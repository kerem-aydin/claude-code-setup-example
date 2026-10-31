---
name: release
description: Prepare a versioned release of orders-api - bump the version, write the changelog entry, run the tests and create the release commit and tag. Run only when the user types /release.
argument-hint: "[patch|minor|major]"
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git status), Bash(git log*), Bash(git tag*), Bash(git commit*), Bash(npm test*), Bash(npm version*)
---

# Release orders-api

This skill only runs when the user asks for it (`/release minor`). It never pushes: pushing the tag is the user's call.

## Steps

1. `git status` must be clean. If not, stop and list the uncommitted files.
2. Read the commits since the last tag: `git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD`.
3. Pick the bump from `$ARGUMENTS` (default `patch`). Suggest `minor` if a route or field was added, `major` if a response shape changed.
4. Run `npm test`. If anything fails, stop: no release on red tests.
5. Add an entry at the top of `CHANGELOG.md` (create it if missing):

```
## <new version> - <YYYY-MM-DD>
### Added / Changed / Fixed
- one line per user-visible change, written for API users
```

6. `npm version <bump> --no-git-tag-version`, then commit `CHANGELOG.md` and `package.json` as `release: v<new version>`. The test-before-commit hook runs the suite again here.
7. Tag: `git tag v<new version>`.
8. Tell the user the version, the changelog lines, and the command to publish: `git push --follow-tags`.
