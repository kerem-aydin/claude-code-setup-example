# orders-api

Small HTTP API for creating, listing and cancelling orders. Node 22.18+ runs the TypeScript files directly (type stripping), so there is no build step and no dependencies.

## Commands

- `npm test` - all tests (node:test). Must pass before every commit; a hook enforces it.
- `npm start` - server on `PORT` (default 3000).
- `npm run test:hooks` - checks that the safety hooks block and allow the right commands.

## Layout

- `src/orders.ts` - domain rules: validation, totals, status changes. Pure functions, no I/O.
- `src/store.ts` - in-memory store. Keep its interface if you replace it with a database.
- `src/app.ts` - routes: `GET /health`, `GET|POST /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`.
- `test/` - one test file per source file.

## Rules

- Money is integer cents (`subtotalCents`, `taxCents`, `totalCents`). Never compare floats.
- Errors return `{ "errors": [string] }`: 400 bad JSON, 404 not found, 409 wrong state, 422 invalid input.
- Imports use the `.ts` extension. Use only erasable TypeScript (no `enum`, no `namespace`).
- Every change to validation or a route comes with a test.
- Secrets live in `.env`, which Claude must not read. Variable names are in `.env.example`.

## How work is split

- Writing tests: `/write-tests`. Reviewing a branch: `/review-pr`. Releases: `/release` (manual only, never pushes).
- `test-runner` subagent (haiku) runs the suite; `reviewer` subagent (sonnet) is read-only.
- GitHub issues and PRs through the `github` MCP server (needs `GITHUB_PAT` in your environment).
