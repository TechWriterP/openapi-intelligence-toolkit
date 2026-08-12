import assert from "node:assert/strict";
import test from "node:test";

import { canonicalizeSourceUri } from "@oait/core";
import { parseYamlSource } from "../../dist/index.js";

function canonical(input) {
  const result = canonicalizeSourceUri(input);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

function loadedSource(sourceText, format = "yaml") {
  const documentUri = canonical(`file:///workspace/source.${format === "yaml" ? "yaml" : "json"}`);
  const bytes = new TextEncoder().encode(sourceText);
  return Object.freeze({
    documentUri,
    requestedIdentifier: documentUri,
    format,
    sourceText,
    byteLength: bytes.byteLength,
    contentHash: "a".repeat(64),
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

test("parses a simple YAML document into an immutable OAIT-owned result", () => {
  const result = parseYamlSource(loadedSource("name: example\nenabled: true\n"));
  assert.equal(result.status, "complete", JSON.stringify(result));
  assert.deepEqual(result.value, {
    documentUri: canonical("file:///workspace/source.yaml"),
    representation: "yaml",
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

test("rejects an empty stream while accepting an explicit null scalar", () => {
  const empty = parseYamlSource(loadedSource(""));
  const explicitNull = parseYamlSource(loadedSource("null\n"));
  assert.equal(empty.status, "failed");
  assert.equal(empty.errors[0].code, "parser.unsupported_yaml_representation");
  assert.equal(explicitNull.status, "complete", JSON.stringify(explicitNull));
  assert.equal(explicitNull.value.hasContent, true);
});

test("translates malformed YAML without exposing candidate errors", () => {
  const result = parseYamlSource(loadedSource("value: [unterminated\n"));
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].category, "parser");
  assert.equal(result.errors[0].code, "parser.invalid_yaml");
  assert.equal(result.errors[0].message, "YAML source contains invalid syntax.");
  assert.equal("stack" in result.errors[0], false);
  assert.equal("source" in result.errors[0], false);
  assert.equal(typeof result.errors[0].cause?.code, "string");
});

test("rejects multiple YAML documents as an unsupported representation", () => {
  const result = parseYamlSource(loadedSource("---\na: 1\n---\nb: 2\n"));
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "parser.unsupported_yaml_representation");
});

test("rejects a non-YAML LoadedSource without invoking YAML semantics", () => {
  const result = parseYamlSource(loadedSource('{"name":"example"}', "json"));
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "parser.unsupported_yaml_representation");
});
