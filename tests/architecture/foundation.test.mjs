import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("architecture scope enforces production package boundaries", () => {
  const checkerPath = fileURLToPath(new URL("../../scripts/check-architecture.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [checkerPath], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});
