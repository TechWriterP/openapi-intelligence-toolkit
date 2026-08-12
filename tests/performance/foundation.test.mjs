import assert from "node:assert/strict";
import test from "node:test";

test("performance scope has a monotonic clock for future reviewed baselines", () => {
  const before = process.hrtime.bigint();
  const after = process.hrtime.bigint();
  assert.ok(after >= before);
});
