import { Connection, PublicKey } from "@solana/web3.js";
import { LumaReader, findFeedPda } from "../src";

async function main() {
  const rpcUrl = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const creatorArg = process.env.CREATOR;
  const feedName = process.env.FEED_NAME ?? "BTC Price";

  if (!creatorArg) {
    console.error(
      "Set CREATOR=<base58 wallet> (and optionally FEED_NAME, RPC_URL).",
    );
    process.exit(1);
  }

  const conn = new Connection(rpcUrl, "confirmed");
  const reader = new LumaReader(conn);
  const creator = new PublicKey(creatorArg);

  const [pda] = findFeedPda(creator, feedName);
  console.log(`Feed PDA: ${pda.toBase58()}`);

  const feed = await reader.readByName(creator, feedName);
  if (!feed) {
    console.log("Feed account does not exist yet.");
    return;
  }

  console.log(`Name:    ${feed.name}`);
  console.log(`Creator: ${feed.creator.toBase58()}`);
  console.log(`Bump:    ${feed.bump}`);
  console.log(`Data:    ${feed.data.toString("utf8")}`);
  console.log(`JSON:    ${JSON.stringify(feed.json, null, 2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
