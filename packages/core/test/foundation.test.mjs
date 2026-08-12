import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("unit scope runs adjacent to its owning package", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.name, "@oait/core");
});
