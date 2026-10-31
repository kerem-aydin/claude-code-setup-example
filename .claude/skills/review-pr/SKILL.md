---
name: review-pr
description: Review the current branch or a pull request of orders-api for bugs, missing tests and API breaks. Use when asked to "review this PR", "check my changes", "is this ready to merge".
argument-hint: "[base-branch]"
allowed-tools: Read, Grep, Glob, Bash(git diff*), Bash(git log*), Bash(npm test*)
---

# Review a change to orders-api

Goal: tell the author what will break or confuse a user of the API, in order of severity. Style nits come last or not at all.

## Steps

1. Base branch is `$ARGUMENTS`; if empty, use `main`. Get the diff with `git diff <base>...HEAD` and the commits with `git log --oneline <base>..HEAD`.
2. Pass the diff to the `reviewer` subagent (read-only) and ask the `test-runner` subagent to run `npm test`. Run them in parallel.
3. Check these yourself, they are the usual failures in this codebase:
   - Validation in `validateOrderInput` changed without a matching test in `test/orders.test.ts`.
   - Money handled as floats instead of cents.
   - A route returns a new status code or response shape: that is an API change and needs a note in the PR.
   - I/O added to `src/orders.ts` (it must stay pure).
4. Write the review as:

```
Verdict: ready / needs changes
Must fix:   file:line - problem - suggested fix
Should fix: ...
Tests:      N/N pass (from test-runner)
```

Do not edit files during a review. If a fix is obvious, put it in the suggestion.
