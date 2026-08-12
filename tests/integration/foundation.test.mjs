import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

test("integration scope can locate production workspace boundaries", async () => {
  await assert.doesNotReject(access(new URL("../../packages/core/package.json", import.meta.url)));
  await assert.doesNotReject(access(new URL("../../apps/cli/package.json", import.meta.url)));
});
