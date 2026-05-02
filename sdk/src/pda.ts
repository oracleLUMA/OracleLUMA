import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C",
);

const FEED_SEED = Buffer.from("feed");

export function findFeedPda(
  creator: PublicKey,
  name: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [FEED_SEED, creator.toBuffer(), Buffer.from(name)],
    PROGRAM_ID,
  );
}
