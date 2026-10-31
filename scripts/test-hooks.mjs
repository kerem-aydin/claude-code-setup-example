#!/usr/bin/env node
// Feeds sample PreToolUse JSON to each hook (the same shape Claude Code sends on stdin)
// and checks the exit code: 2 = blocked, 0 = allowed. Run with: npm run test:hooks
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = (name) => path.join(root, ".claude", "hooks", name);

// A throwaway project whose test suite fails, to prove the commit hook blocks.
const broken = mkdtempSync(path.join(tmpdir(), "broken-project-"));
writeFileSync(path.join(broken, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('not ok 1 - totals include tax'); process.exit(1)\"" } }));

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });
const file = (tool, file_path) => ({ tool_name: tool, tool_input: { file_path } });

const cases = [
  ["guard.mjs", bash("rm -rf ./dist"), "BLOCK"],
  ["guard.mjs", bash("git push --force origin main"), "BLOCK"],
  ["guard.mjs", bash("git push -f"), "BLOCK"],
  ["guard.mjs", bash("git reset --hard HEAD~1"), "BLOCK"],
  ["guard.mjs", bash("cat .env"), "BLOCK"],
  ["guard.mjs", file("Read", ".env"), "BLOCK"],
  ["guard.mjs", file("Read", "config/.env.production"), "BLOCK"],
  ["guard.mjs", bash("npm test"), "ALLOW"],
  ["guard.mjs", bash("git push origin feature/cancel-orders"), "ALLOW"],
  ["guard.mjs", bash("rm dist/old-bundle.js"), "ALLOW"],
  ["guard.mjs", file("Read", ".env.example"), "ALLOW"],
  ["test-before-commit.mjs", bash('git commit -m "Add order cancel"'), "ALLOW", root],
  ["test-before-commit.mjs", bash('git commit -m "WIP"'), "BLOCK", broken],
];

let passed = 0;
const lines = [];
for (const [name, payload, expected, projectDir] of cases) {
  const input = { session_id: "test", cwd: projectDir ?? root, hook_event_name: "PreToolUse", ...payload };
  const r = spawnSync(process.execPath, [hook(name)], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir ?? root },
  });
  const got = r.status === 2 ? "BLOCK" : r.status === 0 ? "ALLOW" : `EXIT ${r.status}`;
  const ok = got === expected;
  if (ok) passed++;
  const what = payload.tool_input.command ?? `${payload.tool_name} ${payload.tool_input.file_path}`;
  const why = got === "BLOCK" ? (r.stderr.match(/\[([\w-]+)\]/)?.[1] ?? "tests failed") : "";
  lines.push(`${ok ? "PASS" : "FAIL"}  ${got.padEnd(5)}  ${name.padEnd(22)}  ${what.padEnd(38)}  ${why}`.trimEnd());
}
rmSync(broken, { recursive: true, force: true });

console.log(lines.join("\n"));
console.log(`\n${passed}/${cases.length} hook cases behave as expected`);
process.exit(passed === cases.length ? 0 : 1);
