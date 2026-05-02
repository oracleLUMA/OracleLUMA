import { PublicKey } from "@solana/web3.js";
import type { Feed } from "./types";

const DISCRIMINATOR_LEN = 8;
const PUBKEY_LEN = 32;
const U32_LEN = 4;

export class FeedDecodeError extends Error {
  constructor(message: string) {
    super(`[luma/reader] ${message}`);
    this.name = "FeedDecodeError";
  }
}

export function decodeFeed(raw: Buffer | Uint8Array): Feed {
  const data = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

  let offset = DISCRIMINATOR_LEN;
  ensure(data, offset + PUBKEY_LEN, "creator pubkey");
  const creator = new PublicKey(data.subarray(offset, offset + PUBKEY_LEN));
  offset += PUBKEY_LEN;

  ensure(data, offset + U32_LEN, "name length prefix");
  const nameLen = data.readUInt32LE(offset);
  offset += U32_LEN;

  ensure(data, offset + nameLen, "name bytes");
  const name = data.subarray(offset, offset + nameLen).toString("utf8");
  offset += nameLen;

  ensure(data, offset + U32_LEN, "data length prefix");
  const dataLen = data.readUInt32LE(offset);
  offset += U32_LEN;

  ensure(data, offset + dataLen, "data bytes");
  const payload = Buffer.from(data.subarray(offset, offset + dataLen));
  offset += dataLen;

  ensure(data, offset + 1, "bump");
  const bump = data.readUInt8(offset);

  return { creator, name, data: payload, bump };
}

export function tryParseJson<T>(bytes: Buffer): T | null {
  if (bytes.length === 0) return null;
  try {
    return JSON.parse(bytes.toString("utf8")) as T;
  } catch {
    return null;
  }
}

function ensure(buf: Buffer, requiredLen: number, field: string): void {
  if (buf.length < requiredLen) {
    throw new FeedDecodeError(
      `account data truncated while reading ${field}: ` +
        `need ${requiredLen} bytes, have ${buf.length}`,
    );
  }
}
