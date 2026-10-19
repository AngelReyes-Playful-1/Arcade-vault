// PostToolUse hook: runs Prettier (all files) and ESLint --fix (JS/TS) on the file Claude just wrote/edited.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const LINTABLE = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const SKIP_DIRS = ["node_modules", ".next", ".git", "out", "build"];

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath;
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const abs = path.resolve(projectDir, filePath);
const rel = path.relative(projectDir, abs);

if (rel.startsWith("..") || path.isAbsolute(rel) || !existsSync(abs)) process.exit(0);
if (rel.split(path.sep).some((part) => SKIP_DIRS.includes(part))) process.exit(0);

const run = (script, args) =>
  spawnSync(process.execPath, [path.join(projectDir, script), ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });

const prettier = run("node_modules/prettier/bin/prettier.cjs", ["--write", "--ignore-unknown", abs]);
if (prettier.status !== 0) {
  process.stderr.write(`Prettier failed on ${rel}:\n${prettier.stderr || prettier.stdout}`);
  process.exit(2);
}

if (LINTABLE.has(path.extname(abs).toLowerCase())) {
  const eslint = run("node_modules/eslint/bin/eslint.js", ["--fix", "--no-warn-ignored", abs]);
  if (eslint.status !== 0) {
    process.stderr.write(`ESLint errors in ${rel}:\n${eslint.stdout}${eslint.stderr}`);
    process.exit(2);
  }
}

process.exit(0);
