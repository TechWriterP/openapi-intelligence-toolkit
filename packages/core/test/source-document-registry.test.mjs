import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeSourceUri,
  createSourceDocumentRegistry,
  createSourceProcessingSession,
} from "../dist/index.js";

function canonical(input) {
  const result = canonicalizeSourceUri(input);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

function loadedSource(uri, contentHash, sourceText = "---\n") {
  const bytes = new TextEncoder().encode(sourceText);
  const admission = Object.freeze({
    admitted: true,
    kind: "file",
    canonicalUri: uri,
    evaluatedUri: uri,
    reason: "admitted",
  });
  return Object.freeze({
    documentUri: uri,
    requestedIdentifier: uri,
    format: "yaml",
    sourceText,
    byteLength: bytes.byteLength,
    contentHash,
    hasUtf8Bom: false,
    admission,
    bytes: () => Uint8Array.from(bytes),
  });
}

test("registers and looks up a loaded source by canonical URI", () => {
  const registry = createSourceDocumentRegistry();
  const uri = canonical("file:///workspace/root.yaml");
  const document = loadedSource(uri, "a".repeat(64));
  const result = registry.register(document);

  assert.equal(result.status, "complete");
  assert.strictEqual(result.value, document);
  assert.strictEqual(registry.get(uri), document);
  assert.equal(registry.has(uri), true);
  assert.equal(registry.size, 1);
});

test("same URI and content hash is idempotent and returns the authoritative first record", () => {
  const registry = createSourceDocumentRegistry();
  const uri = canonical("file:///workspace/shared.yaml");
  const first = loadedSource(uri, "b".repeat(64));
  const duplicate = loadedSource(uri, "b".repeat(64));

  registry.register(first);
  const result = registry.register(duplicate);
  assert.equal(result.status, "complete");
  assert.strictEqual(result.value, first);
  assert.strictEqual(registry.get(uri), first);
  assert.equal(registry.size, 1);
});

test("same URI with conflicting content fails without replacing the first record", () => {
  const registry = createSourceDocumentRegistry();
  const uri = canonical("file:///workspace/conflict.yaml");
  const first = loadedSource(uri, "c".repeat(64));
  const conflicting = loadedSource(uri, "d".repeat(64), "---\nchanged: true\n");

  registry.register(first);
  const result = registry.register(conflicting);
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "source.document_conflict");
  assert.strictEqual(registry.get(uri), first);
  assert.equal(registry.size, 1);
});

test("enumerates by exact canonical-string order independent of locale and registration order", () => {
  const registry = createSourceDocumentRegistry();
  const uris = [
    canonical("file:///workspace/z.yaml"),
    canonical("file:///workspace/%C3%A4.yaml"),
    canonical("file:///workspace/B.yaml"),
    canonical("file:///workspace/a.yaml"),
  ];
  for (const [index, uri] of uris.entries()) {
    registry.register(loadedSource(uri, String(index).repeat(64)));
  }

  assert.deepEqual(registry.documents().map((document) => document.documentUri), [
    canonical("file:///workspace/%C3%A4.yaml"),
    canonical("file:///workspace/B.yaml"),
    canonical("file:///workspace/a.yaml"),
    canonical("file:///workspace/z.yaml"),
  ]);
});

test("returned collections are frozen defensive snapshots", () => {
  const registry = createSourceDocumentRegistry();
  const firstUri = canonical("file:///workspace/first.yaml");
  registry.register(loadedSource(firstUri, "e".repeat(64)));
  const snapshot = registry.documents();

  assert.ok(Object.isFrozen(snapshot));
  assert.throws(() => snapshot.push(loadedSource(canonical("file:///workspace/injected.yaml"), "f".repeat(64))));

  registry.register(loadedSource(canonical("file:///workspace/second.yaml"), "1".repeat(64)));
  assert.equal(snapshot.length, 1);
  assert.equal(registry.documents().length, 2);
});

test("processing sessions isolate registries and preserve entry identity", () => {
  const entry = canonical("file:///workspace/root.yaml");
  const first = createSourceProcessingSession(entry);
  const second = createSourceProcessingSession(entry);
  const document = loadedSource(entry, "2".repeat(64));

  first.registry.register(document);
  assert.strictEqual(first.entryDocumentUri, entry);
  assert.equal(first.registry.has(entry), true);
  assert.equal(second.registry.has(entry), false);
  assert.notStrictEqual(first.registry, second.registry);
  assert.ok(Object.isFrozen(first));
});

test("rejects a loaded source whose document identity disagrees with admission evidence", () => {
  const registry = createSourceDocumentRegistry();
  const uri = canonical("file:///workspace/root.yaml");
  const other = canonical("file:///workspace/other.yaml");
  const document = { ...loadedSource(uri, "3".repeat(64)), admission: Object.freeze({
    admitted: true,
    kind: "file",
    canonicalUri: other,
    evaluatedUri: other,
    reason: "admitted",
  }) };

  const result = registry.register(document);
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "source.invalid_registration");
  assert.equal(registry.size, 0);
});
