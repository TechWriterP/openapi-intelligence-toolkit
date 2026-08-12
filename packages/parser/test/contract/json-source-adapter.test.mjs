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
    structures: result.value.structures,
  });
  assert.ok(Object.isFrozen(result.value));
  assert.deepEqual(Object.keys(result.value), [
    "documentUri",
    "representation",
    "documentCount",
    "hasContent",
    "structures",
  ]);
  assert.ok(Object.isFrozen(result.value.structures));
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
  assert.equal(result.status, "partial");
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
    assert.notEqual(result.status, "complete");
    assert.equal(result.errors[0].code, "parser.invalid_json");
  }
});

test("traverses nested objects and arrays with RFC 6901 pointers", () => {
  const result = parseJsonSource(loadedSource('{"pets":[{"name":"Milo"},null]}'));
  assert.equal(result.status, "complete", JSON.stringify(result));
  const summary = result.value.structures.map(({ kind, pointer }) => [kind, pointer]);
  assert.deepEqual(summary, [
    ["document", ""],
    ["object", ""],
    ["property", "/pets"],
    ["array", "/pets"],
    ["item", "/pets/0"],
    ["object", "/pets/0"],
    ["property", "/pets/0/name"],
    ["scalar", "/pets/0/name"],
    ["item", "/pets/1"],
    ["scalar", "/pets/1"],
  ]);
});

test("escapes property names through core JSON Pointer primitives", () => {
  const result = parseJsonSource(loadedSource('{"a/b":{"x~y":1}}'));
  assert.equal(result.status, "complete", JSON.stringify(result));
  assert.ok(result.value.structures.some(({ kind, pointer }) => kind === "scalar" && pointer === "/a~1b/x~0y"));
});

test("maps candidate offsets to immutable UTF-16 source ranges", () => {
  const source = '{"emoji":"😀"}';
  const result = parseJsonSource(loadedSource(source));
  assert.equal(result.status, "complete", JSON.stringify(result));
  const scalar = result.value.structures.find(({ kind, pointer }) => kind === "scalar" && pointer === "/emoji");
  assert.deepEqual(scalar.range, {
    startOffset: source.indexOf('"😀"'),
    endOffset: source.indexOf('"😀"') + '"😀"'.length,
    unit: "utf16-code-unit",
  });
  assert.ok(Object.isFrozen(scalar));
  assert.ok(Object.isFrozen(scalar.range));
});

test("retains duplicate properties as distinct physical evidence", () => {
  const result = parseJsonSource(loadedSource('{"name":"first","name":"second"}'));
  assert.equal(result.status, "complete", JSON.stringify(result));
  const duplicates = result.value.structures.filter(({ kind, pointer }) => kind === "property" && pointer === "/name");
  assert.equal(duplicates.length, 2);
  assert.notDeepEqual(duplicates[0].range, duplicates[1].range);
  assert.ok(duplicates[0].range.endOffset <= duplicates[1].range.startOffset);
});

test("retains safe recovered structural evidence in a partial result", () => {
  const result = parseJsonSource(loadedSource('{"valid":1,"broken": }'));
  assert.equal(result.status, "partial");
  assert.equal(result.errors[0].code, "parser.invalid_json");
  assert.ok(result.value.structures.some(({ kind, pointer, scalarValue }) => (
    kind === "scalar" && pointer === "/valid" && scalarValue === 1
  )));
  assert.ok(Object.isFrozen(result.value));
  assert.ok(Object.isFrozen(result.value.structures));
});

test("rejects a non-JSON LoadedSource without invoking JSON semantics", () => {
  const result = parseJsonSource(loadedSource("name: example\n", "yaml"));
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "parser.unsupported_json_representation");
});
