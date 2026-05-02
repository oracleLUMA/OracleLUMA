# LUMA web

Next.js dashboard + scheduler that powers [lumaoracle.com](https://lumaoracle.com).

This package handles three things:

1. **Phantom authentication** — wallet signs a nonce, server issues a JWT cookie.
2. **Feed CRUD** — users register HTTP endpoints, JSON paths, and a schedule.
3. **Scheduler** — a singleton interval ticks every second, fetches each active feed's URL, extracts the configured JSON paths, and pushes the result on-chain via the LUMA program.

## Stack

- Next.js 16 (App Router) + React 19
- Postgres (`pg`) — schema is auto-created on boot
- `@solana/web3.js`, `tweetnacl`, `bs58` — auth + on-chain writes
- `jose` — JWT sessions
- Tailwind v4

## Setup

```bash
cp .env.example .env.local
# fill in RPC_URL, ADMIN_PRIVATE, JWT_SECRET, POSTGRE_*
npm install
npm run dev
```

The dev server boots [`instrumentation.ts`](instrumentation.ts), which:

- runs `initDB()` to ensure tables/columns exist
- starts the scheduler singleton

If you do not want the scheduler running locally, comment those lines out.

## Environment variables

See [`.env.example`](.env.example) for the full list. The scheduler will not start without a valid `ADMIN_PRIVATE` — it must be the keypair authorized in the on-chain program.

## Production

```bash
npm run build
npm start
```

Reverse-proxy this behind nginx/caddy on the same host as Postgres. The scheduler runs in-process — only one Node instance should be live at a time, otherwise you will double-broadcast `write_data` transactions.

## Project layout

```
app/
├── api/             REST routes (auth, requests CRUD, analytics)
├── components/      Landing-page sections
├── dashboard/       Authenticated UI (oracle list, create modal, analytics)
├── docs/            Public docs page
├── layout.tsx       Root layout + theme
└── page.tsx         Landing
lib/
├── auth.ts          JWT cookie session helpers
├── balance-cache.ts Background SOL balance poller for per-feed wallets
├── db.ts            pg pool
├── init-db.ts       Schema bootstrap
├── nonce-store.ts   In-memory nonce store for the Phantom challenge
└── scheduler.ts     The on-chain push loop
```
