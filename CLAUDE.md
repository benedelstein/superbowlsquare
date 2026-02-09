# Super Bowl Squares

## Quick Reference

- **Dev server:** `pnpm dev` (serves at http://localhost:5173)
- **Build:** `pnpm build`
- **Deploy:** `pnpm build && npx wrangler deploy`
- **Type check:** `npx tsc --noEmit`

## Project Structure

```
src/
  server/
    index.ts    # Hono API routes + OG tag injection for /groups/:name
    db.ts       # D1 query helpers (createGroup, getGroup, claimSquare, etc.)
  client/
    main.tsx    # React entry point
    App.tsx     # Router setup (/ and /groups/:name)
    pages/
      Home.tsx  # Create group form
      Group.tsx # 10x10 grid view with countdown timer
    components/
      Grid.tsx      # 10x10 grid layout
      Square.tsx    # Individual square cell
      ClaimModal.tsx # Modal for claiming/unclaiming squares
schema.sql          # D1 database migration
wrangler.jsonc      # Cloudflare Workers config
```

## Tech Stack

- React + Vite SPA with react-router v7
- Cloudflare Workers backend via Hono
- Cloudflare D1 (SQLite) database
- Tailwind CSS v4 (`@import "tailwindcss"` syntax)
- `@cloudflare/vite-plugin` for dev/build
- pnpm package manager, wrangler v4

## Setup From Scratch

```bash
pnpm install
npx wrangler d1 execute superbowlsquare-db --local --file=schema.sql
pnpm dev
```

## Deploying

Pushes to `master` automatically deploy via GitHub Actions. The workflow requires a `CLOUDFLARE_API_TOKEN` secret set in the repo.

For manual deploys, requires `CLOUDFLARE_API_TOKEN` in `.env` (gitignored). The token needs Workers Scripts Edit and D1 Edit permissions.

```bash
# First time: create remote D1 database
npx wrangler d1 create superbowlsquare-db
# Then update database_id in wrangler.jsonc

# Run remote schema migration
npx wrangler d1 execute superbowlsquare-db --remote --file=schema.sql

# Build and deploy
pnpm build && npx wrangler deploy
```

## Key Config Details

- `wrangler.jsonc`: `main` points to `src/server/index.ts`. Assets use `not_found_handling: "single-page-application"` with `run_worker_first: ["/api/*", "/groups/*"]`. The `ASSETS` binding is declared explicitly for the OG tag injection route.
- D1 binding name: `DB`, database: `superbowlsquare-db`
- `pnpm.onlyBuiltDependencies` in package.json must include esbuild, workerd, and sharp

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/groups` | Create group `{ name }` |
| GET | `/api/groups/:name` | Get group + squares (numbers hidden before reveal_time) |
| POST | `/api/groups/:name/squares` | Claim square `{ row, col, playerName, squareName? }` |
| DELETE | `/api/groups/:name/squares/:row/:col` | Unclaim a square |

## Important Notes

- The reveal_time is hardcoded in `src/server/db.ts`. Update it for the actual game date.
- `@cloudflare/vite-plugin` does NOT export `/client` types; use `@cloudflare/workers-types` in tsconfig.
- The `/groups/:name` route goes through the worker (via `run_worker_first`) to inject OG meta tags using the `ASSETS` binding to fetch `index.html`.
- Player names are cached in localStorage on the client so users don't have to re-enter their name.
