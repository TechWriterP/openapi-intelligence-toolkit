import assert from "node:assert/strict";
import test from "node:test";

import {
  processingErrorCategories,
  processingStages,
} from "../dist/index.js";

test("public core exports contain the exhaustive processing error categories", () => {
  assert.deepEqual(processingErrorCategories, [
    "configuration",
    "source",
    "parser",
    "reference",
    "validator_execution",
    "internal",
  ]);
});

test("public core exports expose deterministic processing stages", () => {
  assert.deepEqual(processingStages, processingErrorCategories);
});
