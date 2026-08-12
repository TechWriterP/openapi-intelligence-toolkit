import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

test("regression scope separates stable and provider-specific evidence", async () => {
  await assert.doesNotReject(access(new URL("../../test-data/regression/stable", import.meta.url)));
  await assert.doesNotReject(access(new URL("../../test-data/regression/provider-specific", import.meta.url)));
});
