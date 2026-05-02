# LUMA program

On-chain Anchor program for LUMA oracle. Stores per-feed PDA accounts that the
[web scheduler](../web/) writes API data into, and that the
[reader SDK](../sdk/) decodes.

## Layout

```
program/
├── Anchor.toml
├── Cargo.toml          (workspace)
└── programs/
    └── luma/
        ├── Cargo.toml
        ├── Xargo.toml
        └── src/
            └── lib.rs
```

## Build

Requires:

- Rust toolchain (`rustup`)
- Solana CLI ≥ 1.18
- Anchor CLI 0.30.x (`avm install 0.30.1 && avm use 0.30.1`)

```bash
anchor build
```

The compiled program lands in `target/deploy/luma.so`.

## Deploy

```bash
# devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet

# mainnet (current)
solana config set --url mainnet-beta
anchor deploy --provider.cluster mainnet
```

The current mainnet deployment lives at:

```
LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C
```

To redeploy to the same address you need the original program upgrade authority
keypair on `solana config get` — without it the deploy will fail.

## Instructions

### `create_feed(name: String, max_data_size: u32)`

Initializes a feed PDA owned by the signer. Anyone can call this.

- **Seeds:** `["feed", creator_pubkey, name_bytes]`
- **Pays rent:** the `creator` signer
- **Capacity:** fixed at create time via `max_data_size`

### `write_data(data: Vec<u8>)`

Overwrites the `data` field with raw bytes (the scheduler writes JSON).

- **Required signers:** the hardcoded admin (`8RHmWcDDUpP6vLcmtiAdfHmqvvfwS3NaafrcX4rmptAk`) **and** a separate `payer` who covers fees.
- The admin signs to authorize the write; the payer pays gas.

## Account: `Feed`

| Offset       | Size      | Field                           |
|--------------|-----------|---------------------------------|
| `0`          | 8         | Anchor discriminator            |
| `8`          | 32        | `creator: Pubkey`               |
| `40`         | 4         | `name` length (u32 LE)          |
| `44`         | N         | `name` UTF-8 bytes              |
| `44 + N`     | 4         | `data` length (u32 LE)          |
| `48 + N`     | M         | `data` raw bytes                |
| `48 + N + M` | 1         | `bump`                          |
