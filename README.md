# orders-api + Claude Code setup (example)

A small, working Node/TypeScript API with a complete Claude Code setup around it. It is a reference setup: every file below is real and tested, nothing is a placeholder except the GitHub token, which you provide.

## What is inside

```
.
├── CLAUDE.md                     codebase map, commands and rules Claude reads every session
├── .mcp.json                     GitHub MCP server (token from the GITHUB_PAT env var)
├── .claude/
│   ├── settings.json             permissions + hooks
│   ├── hooks/
│   │   ├── guard.mjs             blocks rm -rf, force push, reset --hard, .env access
│   │   └── test-before-commit.mjs  runs npm test before any git commit, blocks on failure
│   ├── skills/
│   │   ├── write-tests/SKILL.md  how tests are written here
│   │   ├── review-pr/SKILL.md    review a branch, uses both subagents
│   │   └── release/SKILL.md      version bump + changelog + tag (manual /release only)
│   └── agents/
│       ├── test-runner.md        haiku: runs the suite, short report
│       └── reviewer.md           sonnet: read-only second opinion on a diff
├── scripts/test-hooks.mjs        feeds sample tool calls to the hooks and checks the result
├── src/                          the API (orders.ts, store.ts, app.ts, server.ts)
└── test/                         node:test suites
```

## Requirements

- Node.js 22.18 or newer (runs `.ts` files directly, no build step, no dependencies)
- Claude Code
- Optional: a GitHub fine-grained personal access token for the MCP server

## Use it

```bash
npm test              # 8 API tests
npm run test:hooks    # 13 hook cases: 8 blocked, 5 allowed
npm start             # http://localhost:3000/health
```

Open the folder with `claude`. Claude Code loads `CLAUDE.md`, the skills, the subagents and the hooks from `.claude/`. It asks once before enabling the MCP server from `.mcp.json`. For GitHub access, export your token first:

```bash
export GITHUB_PAT=...   # never commit it; .env is ignored and blocked by the guard hook
```

Try:

- `/write-tests add a test for cancelling an unknown order`
- `/review-pr main`
- `/release minor` (it creates a local commit and tag, it never pushes)
- Ask Claude to run `rm -rf dist` or `cat .env` and watch the guard hook refuse.

## How the hooks work

Claude Code sends every tool call to the `PreToolUse` hooks as JSON on stdin before running it. A hook that exits with code `2` blocks the call, and its stderr message is shown to Claude so it can choose a safer route. Exit `0` lets the normal permission flow continue.

`settings.json` also has `permissions.deny` rules for the same cases. The two layers overlap on purpose: permission rules match command prefixes, while the hook also catches variants such as `git push origin main --force` or `rm -fr`.

## Adapting it to your repo

1. Rewrite `CLAUDE.md` for your stack: commands, layout, the rules a new teammate would get wrong.
2. Change the test command in `test-before-commit.mjs` if yours is not `npm test`.
3. Keep one skill per repeated task you want done the same way every time.
4. Give subagents the cheapest model that does the job well, and only the tools they need.
