# @luma/reader

TypeScript SDK for reading [LUMA](../README.md) oracle feeds directly from Solana.

LUMA is a platform that pushes API data on-chain to a per-feed PDA account.
This SDK lets your dApp, indexer, or backend service read those feeds without
hand-rolling the Anchor account layout.

## Install

The package is not yet published to npm. For now, use it from source:

```bash
git clone https://github.com/oracleLUMA/OracleLUMA.git
cd OracleLUMA/sdk
npm install
npm run build
```

Then import from `dist/` or symlink with `npm link`.

`@solana/web3.js` is a peer dependency — the SDK reuses your existing
`Connection` instance instead of pulling its own copy.

## Quick start

```ts
import { Connection, PublicKey } from "@solana/web3.js";
import { LumaReader } from "@luma/reader";

const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const reader = new LumaReader(conn);

// If you know the PDA address:
const feed = await reader.read(new PublicKey("Fd...your_feed_pda"));
console.log(feed?.json);
```

## Read by (creator, name)

If you only know who created the feed and what they named it, derive the PDA
implicitly:

```ts
import { PublicKey } from "@solana/web3.js";

const creator = new PublicKey("8RHmWcDDUpP6vLcmtiAdfHmqvvfwS3NaafrcX4rmptAk");
const feed = await reader.readByName<{ "bitcoin.usd": number }>(
  creator,
  "BTC Price",
);

if (feed) {
  console.log("BTC:", feed.json?.["bitcoin.usd"]);
  console.log("PDA:", feed.address.toBase58());
}
```

## Batched reads

```ts
const feeds = await reader.readMany([pdaA, pdaB, pdaC]);
// feeds[i] is null if the account does not exist or is not a LUMA feed
```

## Live subscriptions

```ts
const unsubscribe = reader.subscribe<{ "bitcoin.usd": number }>(
  feedPda,
  (feed) => {
    console.log("update:", feed.json?.["bitcoin.usd"]);
  },
);

// later:
unsubscribe();
```

`subscribeByName(creator, name, cb)` is also available.

## Lower-level helpers

```ts
import { decodeFeed, findFeedPda, PROGRAM_ID } from "@luma/reader";

// Derive a PDA without fetching:
const [pda] = findFeedPda(creator, "BTC Price");

// Decode account data you fetched yourself (e.g. via getProgramAccounts):
const accounts = await conn.getProgramAccounts(PROGRAM_ID);
for (const { account } of accounts) {
  const feed = decodeFeed(account.data);
  console.log(feed.name, feed.data.toString("utf8"));
}
```

## Account layout

Every LUMA feed lives in a PDA owned by program
`LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C`:

```
seeds   = ["feed", creator_pubkey, name_bytes]
program = LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C
```

Byte layout written by the on-chain program:

| Offset       | Size      | Field                           |
|--------------|-----------|---------------------------------|
| `0`          | 8         | Anchor discriminator            |
| `8`          | 32        | `creator: Pubkey`               |
| `40`         | 4         | `name` length (u32 LE)          |
| `44`         | N         | `name` UTF-8 bytes              |
| `44 + N`     | 4         | `data` length (u32 LE)          |
| `48 + N`     | M         | `data` raw JSON bytes           |
| `48 + N + M` | 1         | `bump`                          |

`data` is the JSON-encoded extracted value(s), e.g.
`{"bitcoin.usd": 65432.10}` — exactly the bytes the LUMA scheduler wrote.

## API reference

| Export              | Kind   | Notes                                              |
|---------------------|--------|----------------------------------------------------|
| `LumaReader`        | class  | Wraps a `Connection`, provides read & subscribe    |
| `findFeedPda`       | fn     | `(creator, name) => [PublicKey, bump]`             |
| `PROGRAM_ID`        | const  | LUMA program address as a `PublicKey`              |
| `decodeFeed`        | fn     | `(Buffer) => Feed` — pure binary parser            |
| `tryParseJson`      | fn     | `(Buffer) => T \| null` — lenient JSON parse       |
| `FeedDecodeError`   | class  | Thrown for truncated / malformed account data      |
| `Feed`, `ParsedFeed`, `ReadOptions` | type | TypeScript-only exports        |

## License

MIT
