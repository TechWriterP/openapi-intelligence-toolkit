import assert from "node:assert/strict";
import test from "node:test";

import { canonicalizeSourceUri } from "@oait/core";
import { parseJsonSource } from "../../dist/index.js";

function canonical(input) {
  const result = canonicalizeSourceUri(input);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

function loadedSource(sourceText, format = "json") {
  const documentUri = canonical(`file:///workspace/source.${format === "json" ? "json" : "yaml"}`);
  const bytes = new TextEncoder().encode(sourceText);
  return Object.freeze({
    documentUri,
    requestedIdentifier: documentUri,
    format,
    sourceText,
    byteLength: bytes.byteLength,
    contentHash: "b".repeat(64),
    hasUtf8Bom: false,
    admission: Object.freeze({
      admitted: true,
      kind: "file",
      canonicalUri: documentUri,
      evaluatedUri: documentUri,
      reason: "admitted",
    }),
    bytes: () => Uint8Array.from(bytes),
  });
}

test("parses valid JSON into a deterministic immutable OAIT-owned result", () => {
  const result = parseJsonSource(loadedSource('{"name":"example","enabled":true}'));
  assert.equal(result.status, "complete", JSON.stringify(result));
  assert.deepEqual(result.value, {
    documentUri: canonical("file:///workspace/source.json"),
    representation: "json",
    documentCount: 1,
    hasContent: true,
  });
  assert.ok(Object.isFrozen(result.value));
  assert.deepEqual(Object.keys(result.value), [
    "documentUri",
    "representation",
    "documentCount",
    "hasContent",
  ]);
});

test("rejects empty JSON input while accepting an explicit null value", () => {
  const empty = parseJsonSource(loadedSource(""));
  const explicitNull = parseJsonSource(loadedSource("null"));
  assert.equal(empty.status, "failed");
  assert.equal(empty.errors[0].code, "parser.invalid_json");
  assert.equal(explicitNull.status, "complete", JSON.stringify(explicitNull));
  assert.equal(explicitNull.value.hasContent, true);
});

test("translates malformed JSON without exposing candidate errors", () => {
  const result = parseJsonSource(loadedSource('{"value": }'));
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].category, "parser");
  assert.equal(result.errors[0].code, "parser.invalid_json");
  assert.equal(result.errors[0].message, "JSON source contains invalid syntax.");
  assert.equal("stack" in result.errors[0], false);
  assert.equal("offset" in result.errors[0], false);
  assert.equal("length" in result.errors[0], false);
  assert.equal(typeof result.errors[0].cause?.code, "string");
});

test("strict JSON rejects comments and trailing commas", () => {
  for (const invalid of ['{"a": 1 // comment\n}', '{"a": 1,}']) {
    const result = parseJsonSource(loadedSource(invalid));
    assert.equal(result.status, "failed");
    assert.equal(result.errors[0].code, "parser.invalid_json");
  }
});

test("rejects a non-JSON LoadedSource without invoking JSON semantics", () => {
  const result = parseJsonSource(loadedSource("name: example\n", "yaml"));
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "parser.unsupported_json_representation");
});
