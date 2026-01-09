# Crashouse Fairness Tool

Client-side verifier for Crashouse crash game fairness on Solana. The UI fetches three
transaction signatures (commit, blockhash, reveal) from a backend, pulls on-chain logs
from a public Solana RPC, and recomputes the crash point locally so players can audit
the flow.

## Getting Started

Install dependencies and start the dev server:

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can preselect a game with query params: `/?game=111569` or `/?gameId=111569`.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

- `NEXT_PUBLIC_SOLANA_RPC_URL`
  - Empty = mocked blockchain data (no network calls).
  - Set to a public RPC (ex: `https://api.devnet.solana.com`) to fetch real transactions.
- `NEXT_PUBLIC_BACKEND_URL`
  - Empty = mocked backend data (quick picks only, no manual input).
  - Set to a backend base URL to fetch live signatures.
  - Optional: set to `/api` to use the local mock API route.
- `NEXT_PUBLIC_SOURCE_URL`
  - Link shown in the header (optional).

## Backend Contract

The UI calls `GET {BACKEND_URL}/fairness/{gameId}` and expects:

```json
{
	"gameId": "111569",
	"commitTx": "tx_signature_1",
	"blockhashTx": "tx_signature_2",
	"revealTx": "tx_signature_3",
	"network": "devnet"
}
```

## Scripts

```bash
yarn dev
yarn build
yarn start
yarn lint
yarn typecheck
yarn format:check
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
