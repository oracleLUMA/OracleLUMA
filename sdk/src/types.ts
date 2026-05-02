import { PublicKey } from "@solana/web3.js";

export type Feed = {
  creator: PublicKey;
  name: string;
  data: Buffer;
  bump: number;
};

export type ParsedFeed<T = unknown> = Feed & {
  address: PublicKey;
  json: T | null;
};

export type ReadOptions = {
  commitment?: "processed" | "confirmed" | "finalized";
};
