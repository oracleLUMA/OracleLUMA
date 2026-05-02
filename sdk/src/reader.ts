import { Connection, PublicKey } from "@solana/web3.js";
import type { ParsedFeed, ReadOptions } from "./types";
import { PROGRAM_ID, findFeedPda } from "./pda";
import { decodeFeed, tryParseJson } from "./parser";

export class LumaReader {
  constructor(public readonly connection: Connection) {}

  async read<T = unknown>(
    address: PublicKey,
    opts: ReadOptions = {},
  ): Promise<ParsedFeed<T> | null> {
    const info = await this.connection.getAccountInfo(
      address,
      opts.commitment ?? "confirmed",
    );
    if (info === null) return null;
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error(
        `[luma/reader] account ${address.toBase58()} is owned by ` +
          `${info.owner.toBase58()}, expected LUMA program ${PROGRAM_ID.toBase58()}`,
      );
    }
    const feed = decodeFeed(info.data);
    return {
      ...feed,
      address,
      json: tryParseJson<T>(feed.data),
    };
  }

  async readByName<T = unknown>(
    creator: PublicKey,
    name: string,
    opts: ReadOptions = {},
  ): Promise<ParsedFeed<T> | null> {
    const [address] = findFeedPda(creator, name);
    return this.read<T>(address, opts);
  }

  async readMany<T = unknown>(
    addresses: PublicKey[],
    opts: ReadOptions = {},
  ): Promise<(ParsedFeed<T> | null)[]> {
    if (addresses.length === 0) return [];
    const infos = await this.connection.getMultipleAccountsInfo(
      addresses,
      opts.commitment ?? "confirmed",
    );
    return infos.map((info, i) => {
      if (info === null) return null;
      const address = addresses[i]!;
      if (!info.owner.equals(PROGRAM_ID)) return null;
      const feed = decodeFeed(info.data);
      return {
        ...feed,
        address,
        json: tryParseJson<T>(feed.data),
      };
    });
  }

  subscribe<T = unknown>(
    address: PublicKey,
    callback: (feed: ParsedFeed<T>) => void,
    opts: ReadOptions = {},
  ): () => void {
    const subId = this.connection.onAccountChange(
      address,
      (info) => {
        if (!info.owner.equals(PROGRAM_ID)) return;
        try {
          const feed = decodeFeed(info.data);
          callback({
            ...feed,
            address,
            json: tryParseJson<T>(feed.data),
          });
        } catch (err) {
          console.error(
            `[luma/reader] failed to decode update for ${address.toBase58()}:`,
            err,
          );
        }
      },
      opts.commitment ?? "confirmed",
    );
    return () => {
      void this.connection.removeAccountChangeListener(subId);
    };
  }

  subscribeByName<T = unknown>(
    creator: PublicKey,
    name: string,
    callback: (feed: ParsedFeed<T>) => void,
    opts: ReadOptions = {},
  ): () => void {
    const [address] = findFeedPda(creator, name);
    return this.subscribe<T>(address, callback, opts);
  }
}
