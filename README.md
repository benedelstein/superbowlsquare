# Super Bowl Squares

A web app for playing Super Bowl Squares with friends. Create a group, share the link, and everyone claims squares on a 10x10 grid. Row/column numbers are randomly assigned and hidden until game time.

**Live:** https://superbowlsquare.bedelstein12.workers.dev

## How It Works

1. Create a group on the home page
2. Share the link (e.g. `/groups/my-group`) with friends
3. Everyone clicks squares to claim them with their name
4. At 5:30 PM CT, squares lock and the randomized row/column numbers are revealed
5. Numbers correspond to the last digit of each team's score at the end of each quarter

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS v4
- **Backend:** Cloudflare Workers with Hono
- **Database:** Cloudflare D1 (SQLite)
- **Build:** Vite with `@cloudflare/vite-plugin`, pnpm

## Development

```bash
pnpm install

# Set up local D1 database
npx wrangler d1 execute superbowlsquare-db --local --file=schema.sql

# Start dev server
pnpm dev
```

## Deploy

Pushes to `master` automatically deploy via GitHub Actions.

```bash
# Create remote D1 database (first time only)
npx wrangler d1 create superbowlsquare-db
# Update database_id in wrangler.jsonc with the returned ID

# Run schema migration
npx wrangler d1 execute superbowlsquare-db --remote --file=schema.sql

# Build and deploy (manual)
pnpm build && npx wrangler deploy
```

## API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/groups` | Create a group (`{ name }`) |
| `GET` | `/api/groups/:name` | Get group + squares (numbers hidden before reveal) |
| `POST` | `/api/groups/:name/squares` | Claim a square (`{ row, col, playerName, squareName? }`) |
| `DELETE` | `/api/groups/:name/squares/:row/:col` | Unclaim a square |
