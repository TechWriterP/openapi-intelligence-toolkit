# SPIKE-001: Parser and OpenAPI Version Support

## 1. Objective

Evaluate the documented public APIs of `@scalar/openapi-parser` and `@redocly/openapi-core` against equivalent OpenAPI 3.0.4, 3.1.2, and 3.2.0 YAML/JSON fixtures. This is isolated experimental code. It does not implement the OAIT normalized domain model, rules, a production parser package, AI, or MCP functionality, and it does not select a production parser.

## 2. Environment

- Date: 2026-08-09
- Platform: macOS workspace
- Node.js: `v24.18.0`
- npm: `11.16.0`
- TypeScript: `5.9.2`
- Module mode: ESM with TypeScript `NodeNext`

The experiment is self-contained in this directory. Exact direct dependency versions are pinned in `package.json` and fully resolved in `package-lock.json`.

## 3. Candidate versions

| Candidate | Exact installed version | Documented API used |
| --- | ---: | --- |
| `@scalar/openapi-parser` | `0.28.10` | `validate(source)` |
| `@redocly/openapi-core` | `2.40.0` | `createConfig({})`, then `bundleFromString({ source, absoluteRef, config })` |

No undocumented/private API or internal-module import was needed. Scalar's `sanitize()` and `upgrade()` were deliberately not used. Redocly required its documented bundling API to obtain `bundle.parsed`; dereferencing and unused-component removal were not requested.

## 4. Commands used

Run from `experiments/parser-validator-spike/spike-001/`:

```bash
node --version
npm --version
npm install
npm run typecheck
npm run run:scalar
npm run run:redocly
npm ls --depth=0
shasum -a 256 fixtures/* results/*.json
npm run run
```

The first strict dependency-declaration compile used `skipLibCheck: false` and failed. After recording the issues below, `skipLibCheck: true` was used to compile the experiment source. An initial `tsx scalar/index.ts` execution also failed in the restricted test environment because `tsx` could not create its IPC socket (`listen EPERM`); the scripts use the equivalent non-IPC invocation `node --import tsx`.

To reproduce the finished experiment:

```bash
npm ci
npm run run
```

## 5. Test matrix

`PASS` means processing succeeded, the exact declared version survived, and every required logical observation matched. `PARTIAL` means processing completed but required information was lost, changed, rejected, or obscured. `FAIL` means the fixture could not be processed.

| Candidate | Declared version | Format | Result |
| --- | --- | --- | --- |
| Scalar 0.28.10 | 3.0.4 | YAML | PASS |
| Scalar 0.28.10 | 3.0.4 | JSON | PASS |
| Scalar 0.28.10 | 3.1.2 | YAML | PASS |
| Scalar 0.28.10 | 3.1.2 | JSON | PASS |
| Scalar 0.28.10 | 3.2.0 | YAML | PASS |
| Scalar 0.28.10 | 3.2.0 | JSON | PASS |
| Redocly 2.40.0 | 3.0.4 | YAML | PASS |
| Redocly 2.40.0 | 3.0.4 | JSON | PASS |
| Redocly 2.40.0 | 3.1.2 | YAML | PASS |
| Redocly 2.40.0 | 3.1.2 | JSON | PASS |
| Redocly 2.40.0 | 3.2.0 | YAML | PASS |
| Redocly 2.40.0 | 3.2.0 | JSON | PASS |

For all 12 valid runs, processing succeeded and the observed values were: exact declared OpenAPI version; title `OAIT Parser Spike API`; API version `1.0.0`; path `/pets/{petId}`; GET operation; operationId `getPet`; summary `Get a pet`; required path parameter `petId`; response `200`; reusable `Pet` schema; and `ApiKeyAuth` security scheme. The YAML and JSON observations were equivalent for each version.

Detailed per-fixture evidence, including diagnostics and mutation observations, is in `results/scalar.json` and `results/redocly.json`.

## 6. Observations

### Scalar

- `validate(source)` returned a typed validation result whose `specification` exposed all required structures for all six fixtures.
- It preserved `3.0.4`, `3.1.2`, and `3.2.0` exactly.
- It returned no diagnostics for any valid fixture.
- The immutable input string remained byte-for-byte unchanged. The returned representation was a JavaScript object, preserved the internal `$ref`, and showed no observed semantic transformation in this fixture scope.
- Malformed YAML threw `YAMLParseError` rather than returning Scalar's normal `ErrorObject[]`. The error code was `BAD_INDENT`; its message included line 11 and column 1, but the thrown object did not expose a structured location through the checked public shape.

### Redocly

- The documented way to obtain a parsed document was `bundleFromString`; the document was available at `bundle.parsed`.
- It preserved `3.0.4`, `3.1.2`, and `3.2.0` exactly.
- It returned no bundle problems for any valid fixture.
- The immutable input string remained byte-for-byte unchanged. The bundled parsed object preserved the internal `$ref` with default options and showed no observed semantic transformation in this single-file fixture scope.
- Malformed YAML threw `YamlParseError` instead of returning `NormalizedProblem[]`. Its message included the absolute file and `(11:1)`, but the thrown object did not expose a structured location through the checked public shape.

### TypeScript integration

Both top-level imports and the experiment source compile without casts to private types when `skipLibCheck: true` is used. Full dependency declaration checking failed:

- Scalar declarations reference unresolved `@scalar/types/utils`; `@scalar/openapi-types` declarations also use extensionless relative imports that TypeScript rejects under `NodeNext`.
- Redocly's transitive `@redocly/config` declarations reference React and `@markdoc/markdoc` types that are not installed by this isolated package.

These are package declaration-integration issues, not experiment-source errors. They should be rechecked under the eventual repository compiler configuration; the workaround is explicitly recorded and is not evidence of a clean strict integration.

## 7. PASS/PARTIAL/FAIL results

Every candidate/version/format combination is `PASS`, as shown in the matrix. There are no `PARTIAL` or `FAIL` valid-fixture results. The malformed fixture is an error-behavior probe and is not assigned a version-support status: both candidates correctly refused it by throwing.

## 8. Unexpected behavior

- Both candidates throw on malformed YAML even though their normal APIs can provide structured diagnostic arrays. Location information is readable from each exception message but was not found as a structured location field.
- Both candidates' installed declaration graphs fail a full `skipLibCheck: false` TypeScript check in this isolated NodeNext setup.
- Redocly exposes the parsed document through a bundling operation rather than a parser-only public API. No relevant transformation was observed here, but bundling behavior and reference provenance remain SPIKE-002 concerns.
- The broader `parser-validator-spike-plan.md` describes a generic SPIKE-001 fixture with at least two operations and a request body. The dedicated SPIKE-001 document and this task specify the single `GET /pets/{petId}` fixture used here. No architecture document was changed; the more specific scope was followed.
- Direct `tsx` CLI execution attempted to open an IPC socket that the restricted environment disallowed. `node --import tsx` ran the same TypeScript entry points successfully.

## 9. Proceed to SPIKE-002?

- `@scalar/openapi-parser` 0.28.10: **Yes.** It passed all SPIKE-001 version/format cases using the documented `validate` API. SPIKE-002 should test its documented reference-resolution path, provenance, recursion, and file/network controls, while retaining the TypeScript declaration issue as an integration risk.
- `@redocly/openapi-core` 2.40.0: **Yes.** It passed all SPIKE-001 version/format cases using documented public APIs. SPIKE-002 should closely measure whether bundling preserves declaration and target provenance, how multi-file sources are represented, and whether file/network resolution can be constrained, while retaining the TypeScript declaration issue as an integration risk.

## 10. Production recommendation

There is no final production parser recommendation from SPIKE-001. Both candidates should proceed to SPIKE-002; parser selection must wait for reference resolution, source location, OpenAPI 3.2-specific operations, schema dialect, validation diagnostics, and operational evidence from later spikes.
