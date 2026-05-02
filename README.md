<div align="center">

# LUMA

**Push-based oracle infrastructure for Solana.**

Schedule any HTTP API → write the result on-chain → read it from anywhere.

[lumaoracle.com](https://lumaoracle.com)

CA: GMtBBTTiXnTBtm1GsLq8JvKQhGGhnfMdLing1BKrYsQK

</div>

---

## What is LUMA?

LUMA lets you turn any HTTP/JSON endpoint into a Solana on-chain feed.

You define **what to fetch**, **which JSON path to extract**, and **how often to run** — LUMA's scheduler does the rest, writing the latest value into a per-feed PDA account that any program, dApp, or indexer can read.

## Architecture

```
                ┌──────────────┐
   user ──────► │   web/       │   Phantom auth, dashboard, scheduler
                │   (Next.js)  │   ───┐
                └──────┬───────┘      │ writes JSON bytes
                       │              ▼
                       │       ┌──────────────┐
                       │       │  program/    │   on-chain Anchor program
                       │       │  (Solana)    │   stores feed in PDA
                       │       └──────┬───────┘
                       │              │ readable by anyone
                       ▼              ▼
                ┌──────────────┐
                │   sdk/       │   TypeScript reader
                │   @luma      │   `LumaReader`, `findFeedPda`, `decodeFeed`
                └──────────────┘
```

| Directory   | Stack                       | Purpose                                                       |
|-------------|-----------------------------|---------------------------------------------------------------|
| [`program/`](program/) | Rust, Anchor                | On-chain program — `create_feed`, `write_data`                |
| [`web/`](web/)         | Next.js 16, Postgres        | Dashboard + cron scheduler that pushes data on-chain          |
| [`sdk/`](sdk/)         | TypeScript                  | Read-only client for any dApp / indexer                       |

## On-chain references

| | |
|--|--|
| **Program ID** | `LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C` |
| **Network**    | Solana mainnet-beta |
| **PDA seeds**  | `["feed", creator_pubkey, feed_name]` |

## Quick start

### Read a feed

```ts
import { Connection, PublicKey } from "@solana/web3.js";
import { LumaReader } from "@luma/reader";

const conn = new Connection("https://api.mainnet-beta.solana.com");
const reader = new LumaReader(conn);

const feed = await reader.readByName(
  new PublicKey("8RHmWcDDUpP6vLcmtiAdfHmqvvfwS3NaafrcX4rmptAk"),
  "BTC Price",
);
console.log(feed?.json);
```

See [`sdk/README.md`](sdk/README.md) for the full API reference.

### Run the dashboard locally

```bash
cd web
cp .env.example .env.local   # fill in RPC + Postgres + admin key
npm install
npm run dev
```

See [`web/README.md`](web/README.md) for environment variables and deployment notes.

### Build the program

```bash
cd program
anchor build
anchor deploy
```

## Account layout

Every feed lives in a PDA owned by the LUMA program.

| Offset       | Size      | Field                           |
|--------------|-----------|---------------------------------|
| `0`          | 8         | Anchor discriminator            |
| `8`          | 32        | `creator: Pubkey`               |
| `40`         | 4         | `name` length (u32 LE)          |
| `44`         | N         | `name` UTF-8 bytes              |
| `44 + N`     | 4         | `data` length (u32 LE)          |
| `48 + N`     | M         | `data` raw JSON bytes           |
| `48 + N + M` | 1         | `bump`                          |

## License

[MIT](LICENSE)
