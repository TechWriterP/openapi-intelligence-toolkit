import assert from "node:assert/strict";
import { mkdtemp, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  canonicalizeSourceUri,
  createFileSourceLoader,
  detectSourceFormat,
} from "../dist/index.js";

function canonical(input) {
  const result = canonicalizeSourceUri(input);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

async function fixtureRoot(t) {
  const directory = await mkdtemp(join(tmpdir(), "oait-source-loader-"));
  t.after(async () => {
    const { rm } = await import("node:fs/promises");
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

async function policy(root, overrides = {}) {
  const physicalRoot = await realpath(root);
  return {
    allowedSchemes: ["file"],
    allowedFileRoots: [canonical(`${pathToFileURL(physicalRoot).href}/`)],
    allowAbsoluteFilePaths: true,
    allowRelativeFilePaths: true,
    network: { enabled: false, allowedHosts: [] },
    requireRealPath: true,
    ...overrides,
  };
}

test("loads admitted UTF-8 bytes with stable metadata and BOM preservation", async (t) => {
  const root = await fixtureRoot(t);
  const path = join(root, "sample.json");
  const original = Uint8Array.from([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('{"ok":true}\n')]);
  await writeFile(path, original);

  const result = await createFileSourceLoader(await policy(root), { maxSourceBytes: 1024 }).load({ identifier: path });
  assert.equal(result.status, "complete", JSON.stringify(result));
  assert.equal(result.value.format, "json");
  assert.equal(result.value.hasUtf8Bom, true);
  assert.equal(result.value.byteLength, original.byteLength);
  assert.match(result.value.contentHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.value.bytes(), original);
});

test("returned bytes are defensive copies", async (t) => {
  const root = await fixtureRoot(t);
  const path = join(root, "sample.yaml");
  await writeFile(path, "---\nname: immutable\n", "utf8");
  const result = await createFileSourceLoader(await policy(root), { maxSourceBytes: 1024 }).load({ identifier: path });
  assert.equal(result.status, "complete", JSON.stringify(result));
  const changed = result.value.bytes();
  changed[0] = 0;
  assert.notEqual(result.value.bytes()[0], 0);
  assert.ok(Object.isFrozen(result.value));
});

test("policy denial happens before source acquisition", async (t) => {
  const root = await fixtureRoot(t);
  const outside = join(root, "outside.json");
  const deniedRoot = canonical("file:///definitely-not-the-fixture-root/");
  const result = await createFileSourceLoader({
    ...await policy(root),
    allowedFileRoots: [deniedRoot],
    requireRealPath: false,
  }, { maxSourceBytes: 1024 }).load({ identifier: outside });
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "source.admission_denied");
});

test("format detection is representation-level and deterministic", () => {
  assert.equal(detectSourceFormat(canonical("file:///api/spec"), "  { invalid json"), "json");
  assert.equal(detectSourceFormat(canonical("file:///api/spec"), "---\nopenapi: 3.1.0"), "yaml");
  assert.equal(detectSourceFormat(canonical("file:///api/spec.txt"), "plain text"), "unknown");
});

test("unknown, invalid UTF-8, and size failures are structured", async (t) => {
  const root = await fixtureRoot(t);
  const loader = createFileSourceLoader(await policy(root), { maxSourceBytes: 4 });

  const unknown = join(root, "unknown.txt");
  await writeFile(unknown, "text", "utf8");
  assert.equal((await loader.load({ identifier: unknown })).errors[0].code, "source.unsupported_format");

  const invalid = join(root, "invalid.yaml");
  await writeFile(invalid, Uint8Array.from([0xc3, 0x28]));
  assert.equal((await loader.load({ identifier: invalid })).errors[0].code, "source.invalid_utf8");

  const large = join(root, "large.json");
  await writeFile(large, "{    }", "utf8");
  assert.equal((await loader.load({ identifier: large })).errors[0].code, "source.size_limit_exceeded");
});

test("remote sources never trigger network acquisition", async () => {
  const remotePolicy = {
    allowedSchemes: ["https"],
    allowedFileRoots: [],
    allowAbsoluteFilePaths: false,
    allowRelativeFilePaths: false,
    network: { enabled: true, allowedHosts: ["example.com"] },
    requireRealPath: false,
  };
  const result = await createFileSourceLoader(remotePolicy, { maxSourceBytes: 1024 })
    .load({ identifier: "https://example.com/openapi.yaml" });
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "source.unsupported_acquisition");
});
