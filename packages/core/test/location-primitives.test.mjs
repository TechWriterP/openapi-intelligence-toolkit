import assert from "node:assert/strict";
import test from "node:test";

import {
  compareSourceRanges,
  createJsonPointer,
  createSourceRange,
  jsonPointerSegments,
  parseJsonPointer,
  sameJsonPointer,
  sourceRangeLength,
} from "../dist/index.js";

function pointer(segments) {
  const result = createJsonPointer(segments);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

function range(start, end) {
  const result = createSourceRange(start, end);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

test("the empty JSON Pointer identifies the document root", () => {
  const root = pointer([]);
  assert.equal(root, "");
  assert.deepEqual(jsonPointerSegments(root), []);
});

test("creates simple pointers and decimal array-index segments", () => {
  assert.equal(pointer(["paths", "pets", 0]), "/paths/pets/0");
});

test("escapes and decodes '~' and '/' according to RFC 6901", () => {
  const value = pointer(["a~b", "/pets/{petId}"]);
  assert.equal(value, "/a~0b/~1pets~1{petId}");
  assert.deepEqual(jsonPointerSegments(value), ["a~b", "/pets/{petId}"]);
});

test("preserves repeated separators as empty structural tokens", () => {
  const result = parseJsonPointer("/paths//get");
  assert.equal(result.status, "complete");
  assert.deepEqual(jsonPointerSegments(result.value), ["paths", "", "get"]);
});

test("rejects pointers with an invalid prefix or escape sequence", () => {
  for (const invalid of ["paths/pets", "/pets~", "/pets~2id"]) {
    const result = parseJsonPointer(invalid);
    assert.equal(result.status, "failed");
    assert.equal(result.errors[0].code, "source.invalid_json_pointer");
  }
});

test("pointer equality is exact deterministic string equality", () => {
  const first = pointer(["a/b"]);
  const second = parseJsonPointer("/a~1b");
  assert.equal(second.status, "complete");
  assert.equal(sameJsonPointer(first, second.value), true);
  assert.equal(sameJsonPointer(first, pointer(["a", "b"])), false);
});

test("rejects invalid numeric pointer segments", () => {
  for (const invalid of [-1, 1.5, Number.POSITIVE_INFINITY]) {
    const result = createJsonPointer([invalid]);
    assert.equal(result.status, "failed");
    assert.equal(result.errors[0].code, "source.invalid_pointer_segment");
  }
});

test("creates immutable zero-based end-exclusive UTF-16 ranges", () => {
  const value = range(2, 5);
  assert.deepEqual(value, { startOffset: 2, endOffset: 5, unit: "utf16-code-unit" });
  assert.equal(sourceRangeLength(value), 3);
  assert.ok(Object.isFrozen(value));
});

test("supports empty ranges at deterministic boundaries", () => {
  assert.equal(sourceRangeLength(range(4, 4)), 0);
});

test("rejects negative, reversed, fractional, and unsafe source ranges", () => {
  for (const [start, end] of [[-1, 0], [2, 1], [0.5, 1], [0, Number.MAX_SAFE_INTEGER + 1]]) {
    const result = createSourceRange(start, end);
    assert.equal(result.status, "failed");
    assert.equal(result.errors[0].code, "source.invalid_source_range");
  }
});

test("compares ranges by start and then end offsets without locale state", () => {
  const values = [range(4, 8), range(1, 9), range(4, 5), range(1, 3)];
  values.sort(compareSourceRanges);
  assert.deepEqual(values.map(({ startOffset, endOffset }) => [startOffset, endOffset]), [
    [1, 3],
    [1, 9],
    [4, 5],
    [4, 8],
  ]);
  assert.equal(compareSourceRanges(range(2, 4), range(2, 4)), 0);
});

test("UTF-16 offsets count a non-BMP character as two code units", () => {
  const source = "A😀B";
  const emoji = range(source.indexOf("😀"), source.indexOf("😀") + "😀".length);
  assert.deepEqual([emoji.startOffset, emoji.endOffset, sourceRangeLength(emoji)], [1, 3, 2]);
});
