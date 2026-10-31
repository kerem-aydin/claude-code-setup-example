---
name: write-tests
description: Write or extend tests for orders-api with node:test. Use when adding a feature, fixing a bug, or when asked to "add tests", "cover this case", "why is this untested".
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npm test*)
---

# Write tests for orders-api

Tests are the safety net for the commit hook: a commit is blocked when `npm test` fails, so new tests must pass on a clean checkout and must not depend on network, time of day or test order.

## Where tests go

| Code under test | Test file | Style |
|---|---|---|
| `src/orders.ts` (pure rules) | `test/orders.test.ts` | call the function, assert on the return value |
| `src/app.ts` (HTTP routes) | `test/app.test.ts` | real server on port 0, `fetch`, assert status + JSON |

## Steps

1. Read the code you are covering and list the behaviours: the happy path, each validation error, each status code.
2. For a bug fix, write the failing test first and run `npm test` to see it fail for the right reason.
3. Add tests next to the existing ones in the same file. Use `node:test` and `node:assert/strict`; no new dependencies.
4. Money: assert in cents (`totalCents`), never on floats.
5. Run `npm test`. All tests must pass. Report the count, e.g. "10/10 pass, 2 new".

## Rules of thumb

- One behaviour per `test(...)`, named as the behaviour ("cancelling twice returns 409").
- Create the data a test needs inside the test; never rely on an order created by another test.
- If a case is hard to test, say why instead of skipping it silently.
