#!/usr/bin/env node
// PreToolUse hook for `git commit`: runs the test suite first and blocks the commit if it fails.
// settings.json already limits it to "Bash(git commit*)"; the check below keeps it safe on its own too.
import { spawnSync } from "node:child_process";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const cmd = input?.tool_input?.command ?? "";
  if (input?.tool_name !== "Bash" || !/\bgit\s+commit\b/.test(cmd)) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const run = spawnSync("npm", ["test", "--silent"], { cwd: projectDir, encoding: "utf8", shell: true });
  if (run.status === 0) process.exit(0);

  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split("\n");
  const failing = out.filter((l) => /^not ok\b/.test(l.trim())).slice(0, 5);
  process.stderr.write(
    `Blocked by test-before-commit hook: npm test failed (exit ${run.status}).\n` +
      (failing.length ? failing.join("\n") + "\n" : out.slice(-8).join("\n") + "\n") +
      "Fix the failing tests, then commit again.\n",
  );
  process.exit(2);
});
