#!/usr/bin/env node
// PreToolUse guard: blocks destructive shell commands and any access to secret .env files.
// Claude Code sends the tool call as JSON on stdin. Exit 2 = block; stderr is shown to Claude as the reason.
// Exit 0 with no output = no decision, the normal permission flow continues.
import path from "node:path";

const RULES = [
  {
    id: "rm-rf",
    test: (cmd) => /\brm\s+(-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*|(-r|--recursive)\s+(-f|--force)|(-f|--force)\s+(-r|--recursive))\b/i.test(cmd),
    reason: "recursive force delete (rm -rf). Delete specific files instead, or ask the user to run it.",
  },
  {
    id: "force-push",
    test: (cmd) => /\bgit\s+push\b/.test(cmd) && /(\s--force(?!-with-lease)\b|\s-f\b|\s\+[\w./-]+)/.test(cmd),
    reason: "git push --force rewrites shared history. Push normally, or ask the user before using --force-with-lease.",
  },
  {
    id: "reset-hard",
    test: (cmd) => /\bgit\s+reset\s+--hard\b/.test(cmd),
    reason: "git reset --hard discards uncommitted work. Use git stash, or ask the user first.",
  },
  {
    id: "env-in-shell",
    test: (cmd) => /(^|[\s"'=<>|;&/])\.env(\.(?!example\b|sample\b)[\w-]+)?(?=$|[\s"'|;&<>)])/.test(cmd),
    reason: "this command touches a .env file, which holds secrets. Use .env.example for variable names.",
  },
];

const SECRET_FILE = /^\.env(\.(?!example$|sample$)[\w.-]+)?$/;

function decide(input) {
  const tool = input.tool_name;
  const ti = input.tool_input ?? {};
  if (tool === "Bash" && typeof ti.command === "string") {
    const hit = RULES.find((r) => r.test(ti.command));
    if (hit) return `[${hit.id}] ${hit.reason}`;
  }
  if (["Read", "Edit", "Write", "MultiEdit"].includes(tool) && typeof ti.file_path === "string") {
    if (SECRET_FILE.test(path.basename(ti.file_path))) {
      return `[env-file] ${tool} on ${path.basename(ti.file_path)} is not allowed. Secrets stay out of the session; use .env.example.`;
    }
  }
  return null;
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // malformed input: do not block, let normal permissions decide
  }
  const reason = decide(input);
  if (reason) {
    process.stderr.write(`Blocked by guard hook ${reason}\n`);
    process.exit(2);
  }
  process.exit(0);
});
