import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeSourceUri,
  evaluateSourceAdmission,
  sameSourceUri,
} from "../dist/index.js";

function canonical(input, options) {
  const result = canonicalizeSourceUri(input, options);
  assert.equal(result.status, "complete", JSON.stringify(result));
  return result.value;
}

const root = canonical("file:///workspace/apis/");
const localOnlyPolicy = {
  allowedSchemes: ["file"],
  allowedFileRoots: [root],
  allowAbsoluteFilePaths: true,
  allowRelativeFilePaths: true,
  network: { enabled: false, allowedHosts: [] },
  requireRealPath: false,
};

test("equivalent file identifiers canonicalize to one identity", () => {
  const direct = canonical("file:///workspace/apis/pets%2eyaml");
  const dotted = canonical("./models/../pets.yaml", { baseUri: root });
  assert.ok(sameSourceUri(direct, dotted));
  assert.equal(direct, "file:///workspace/apis/pets.yaml");
});

test("Windows paths canonicalize deterministically on every host platform", () => {
  assert.equal(canonical("c:\\workspace\\pets api.yaml"), "file:///C:/workspace/pets%20api.yaml");
});

test("relative identifiers require an explicit base", () => {
  const result = canonicalizeSourceUri("pets.yaml");
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "source.relative_without_base");
});

test("local policy rejects traversal outside an allowed root", () => {
  const outside = canonical("../secret.yaml", { baseUri: root });
  const result = evaluateSourceAdmission(localOnlyPolicy, {
    requestedIdentifier: "../secret.yaml",
    canonicalUri: outside,
  });
  assert.deepEqual({ admitted: result.admitted, reason: result.reason }, {
    admitted: false,
    reason: "outside_allowed_root",
  });
});

test("network access and unsupported schemes are denied deterministically", () => {
  const https = canonical("https://EXAMPLE.com:443/pets.yaml");
  const deniedNetwork = evaluateSourceAdmission(
    { ...localOnlyPolicy, allowedSchemes: ["file", "https"] },
    { requestedIdentifier: https, canonicalUri: https },
  );
  assert.equal(deniedNetwork.reason, "network_denied");

  const unsupported = canonical("ftp://example.com/pets.yaml");
  const deniedScheme = evaluateSourceAdmission(localOnlyPolicy, {
    requestedIdentifier: unsupported,
    canonicalUri: unsupported,
  });
  assert.equal(deniedScheme.reason, "scheme_denied");
});

test("symlink-aware policy requires loader-supplied real-path evidence", () => {
  const lexical = canonical("file:///workspace/apis/pets.yaml");
  const escapedRealPath = canonical("file:///outside/pets.yaml");
  const policy = { ...localOnlyPolicy, requireRealPath: true };

  assert.equal(evaluateSourceAdmission(policy, {
    requestedIdentifier: lexical,
    canonicalUri: lexical,
  }).reason, "real_path_required");

  assert.equal(evaluateSourceAdmission(policy, {
    requestedIdentifier: lexical,
    canonicalUri: lexical,
    realPathUri: escapedRealPath,
  }).reason, "outside_allowed_root");
});
