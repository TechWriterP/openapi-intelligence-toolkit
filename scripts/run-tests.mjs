import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const roots = ["apps", "packages", "tests"];

async function collectTests(directory) {
  const tests = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return tests;
    throw error;
  }

  for (const entry of entries) {
    if (["dist", "node_modules"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) tests.push(...await collectTests(path));
    else if (entry.isFile() && entry.name.endsWith(".test.mjs")) tests.push(path);
  }
  return tests;
}

const tests = (await Promise.all(roots.map((root) => collectTests(join(repositoryRoot, root)))))
  .flat()
  .sort();

if (tests.length === 0) {
  console.error("No production tests were found.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...tests], {
  cwd: repositoryRoot,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
