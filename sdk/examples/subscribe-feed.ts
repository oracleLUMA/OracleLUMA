import { Connection, PublicKey } from "@solana/web3.js";
import { LumaReader } from "../src";

async function main() {
  const rpcUrl = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const creatorArg = process.env.CREATOR;
  const feedName = process.env.FEED_NAME ?? "BTC Price";

  if (!creatorArg) {
    console.error("Set CREATOR=<base58 wallet> (and optionally FEED_NAME).");
    process.exit(1);
  }

  const conn = new Connection(rpcUrl, "confirmed");
  const reader = new LumaReader(conn);
  const creator = new PublicKey(creatorArg);

  console.log(`Subscribing to feed "${feedName}" by ${creator.toBase58()}...`);

  const unsubscribe = reader.subscribeByName(creator, feedName, (feed) => {
    const stamp = new Date().toISOString();
    console.log(`[${stamp}] update: ${feed.data.toString("utf8")}`);
  });

  process.on("SIGINT", () => {
    console.log("\nUnsubscribing...");
    unsubscribe();
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
