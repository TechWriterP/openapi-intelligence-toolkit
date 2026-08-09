# SPIKE-003: Source-Location Preservation

## 1. Objective

Determine whether `@scalar/openapi-parser@0.28.10` and `@redocly/openapi-core@2.40.0` expose dependable original-source document identity, canonical RFC 6901 JSON Pointer, and line/column evidence for valid OpenAPI nodes and diagnostics. Where candidate-native evidence is insufficient, test only the feasibility—not the production design—of an OAIT-owned source-location index.

This experiment does not implement the production source loader, location index, parser adapter, normalized model, rules, CLI, AI, or MCP functionality, and it makes no final parser selection.

## 2. Environment

- Date: 2026-08-09
- OS: Darwin 25.5.0 arm64
- Node.js: `v24.18.0`
- npm: `11.16.0`
- TypeScript: `5.9.2`
- Module mode: ESM / TypeScript NodeNext

As in SPIKE-001 and SPIKE-002, experiment source compiles with `skipLibCheck: true`; the candidate dependency-declaration issues recorded in SPIKE-001 remain.

Commands executed from this directory:

```bash
node --version
npm --version
uname -srm
npm install
npm run typecheck
npm run run:scalar
npm run run:redocly
npm run run
npm ls --depth=0
shasum -a 256 results/scalar.json results/redocly.json
find fixtures -type f -print0 | sort -z | xargs -0 shasum -a 256
```

Final reproduction path:

```bash
npm ci
npm run run
```

Final machine-readable result hashes:

```text
scalar.json   c638e061fc80c147ed2cc5596780a7efbc93614cda65f63221b177336d459522
redocly.json  8bc6f62568fad97e13d0eed1002c867f2d3539b95a6c21ead248ab9cd95906a7
```

All fixture hashes are recorded in each candidate result under both `mutation.beforeHashes` and `mutation.afterHashes`; the maps are identical.

## 3. Candidate versions

| Package | Exact version | Use |
| --- | ---: | --- |
| `@scalar/openapi-parser` | `0.28.10` | Parsing and structural diagnostics |
| `@scalar/json-magic` | `0.12.19` | Documented Scalar bundling and lifecycle paths |
| `@redocly/openapi-core` | `2.40.0` | Bundling and lint diagnostics |
| `yaml` | `2.8.3` | Isolated OAIT-owned index feasibility proof only; not selected for production |
| `typescript` | `5.9.2` | Compiler |
| `tsx` | `4.20.4` | TypeScript runtime loader |
| `@types/node` | `24.3.0` | Node.js types |

`yaml@2.8.3` was already an exact transitive dependency of Scalar in earlier spikes. It is pinned directly here solely to make the proof reproducible. This spike does not select it as OAIT's source-location technology.

## 4. Candidate APIs used

Scalar used documented `validate()` and documented `@scalar/json-magic` `bundle()`, `readFiles()`, lifecycle hooks, and URL-map options.

Redocly used only package-README safe APIs: `createConfig()`, `bundle()`, `lint()`, and `lintFromString()`. Exported but undocumented AST and line/column helper functions were deliberately not used.

The feasibility proof used public `yaml` APIs `parseDocument()`, node ranges, and `LineCounter`. No candidate-private or internal imports were used.

## 5. Fixture architecture

```text
fixtures/
├── yaml/openapi.yaml                 # controlled YAML formatting and comments
├── json/openapi.json                 # logically equivalent JSON
├── multi-file/
│   ├── openapi.yaml
│   ├── paths/pets.yaml
│   └── schemas/{Pet,Error,common}.yaml
├── references/{openapi,models,common}.yaml
├── duplicate-values/openapi.yaml
├── whitespace/{compact,expanded,reordered}.yaml
└── invalid/{malformed,structural,unresolved-ref}.yaml
```

The main YAML and JSON fixtures contain the OpenAPI root, Info Object, tags, path items, GET/POST operations, three array parameters, request body, 200/400 responses, schemas, schema properties, security scheme, and `$ref` declarations. The key `a/b~c` verifies canonical `~1` and `~0` escaping.

Expected line/column anchors were manually established before comparison and are encoded alongside every sample in the result files.

## 6. Source-location terminology

- Logical location identifies an OAIT entity, such as `GET /pets/{petId}`.
- Structural source location is original `documentUri + RFC 6901 pointer`.
- Presentation location is source-specific line and column.
- Bundled pointers identify transformed output and are never reported as original-source pointers.

The feasibility proof anchors an object/property at its source key token. Array items anchor at the item start. Lines and columns are recorded as 1-based for presentation.

## 7. Complete candidate test matrix

| Capability | Scalar 0.28.10 | Redocly 2.40.0 |
| --- | --- | --- |
| Source document for valid node | PARTIAL | NOT_SUPPORTED |
| JSON Pointer for valid node | NOT_SUPPORTED | NOT_SUPPORTED |
| Line for valid node | NOT_SUPPORTED | NOT_SUPPORTED |
| Column for valid node | NOT_SUPPORTED | NOT_SUPPORTED |
| Schema-property location | NOT_SUPPORTED | NOT_SUPPORTED |
| Array-item location | NOT_SUPPORTED | NOT_SUPPORTED |
| `$ref` declaration location | PARTIAL | PARTIAL |
| `$ref` target location | PARTIAL | PARTIAL |
| Nested-hop locations | FAIL | NOT_SUPPORTED |
| Multi-file original location | NOT_SUPPORTED | PARTIAL |
| Error document | PARTIAL | PASS |
| Error pointer | PASS | PASS |
| Error line | PARTIAL | NOT_SUPPORTED |
| Error column | PARTIAL | NOT_SUPPORTED |
| Stable under whitespace changes | PASS¹ | PASS¹ |
| Canonical-pointer conversion | FAIL | NOT_SUPPORTED |
| YAML index feasibility | PASS¹ | PASS¹ |
| JSON index feasibility | PASS¹ | PASS¹ |
| Duplicate scalar handling | PASS¹ | PASS¹ |
| Pointer escaping | PASS¹ | PASS¹ |
| Documented candidate APIs only | PASS | PASS |

¹ Evidence comes from the explicitly labeled OAIT-owned feasibility proof, not the candidate-native representation.

Redocly additionally receives `FAIL` for the structural-parameter diagnostic: its documented `struct` lint did not report `required: false` for the path parameter in the controlled fixture. An unresolved-reference fixture was therefore used separately to measure actual Redocly diagnostic locations.

## 8. YAML findings

Both candidates parsed the valid YAML but returned ordinary transformed JavaScript objects without valid-node source coordinates.

The OAIT-owned feasibility proof produced exact manually expected locations for all 15 sampled entities, including root, Info, tag, path item, operation, three parameters, request body, response, schema, schema property, escaped property, security scheme, and `$ref` declaration. Comments and repeated scalar text did not confuse the structural walk.

## 9. JSON findings

Neither candidate exposed valid-node locations for JSON through the documented APIs tested. The same source-index proof parsed JSON structurally and matched all 15 manually expected JSON-specific key anchors exactly. Logical pointers matched YAML while line and column values correctly reflected JSON formatting.

This demonstrates format-independent structural identity with format-specific presentation coordinates.

## 10. Multi-file findings

Scalar URL maps and Redocly `fileDependencies` identify loaded documents, but neither candidate maps every successful logical node back to its original file, pointer, and coordinates.

The feasibility proof independently indexed each physical source document and produced, without using bundled pointers:

- `paths/pets.yaml` + `/get` for the operation;
- `paths/pets.yaml` + `/get/responses/200/content/application~1json/schema/$ref` for its declaration;
- `schemas/Pet.yaml` + empty root pointer for the Pet target;
- `schemas/Pet.yaml` + `/properties/id/$ref` for the nested declaration;
- `schemas/common.yaml` + `/Identifier` for the nested target.

This validates the proposed “index before candidate transformation” pipeline.

## 11. Reference declaration and target findings

Candidate bundling transforms successful external references. Neither final bundle retains sufficient original-source evidence to represent declaration and target independently.

The owned proof generated two ordered hops:

1. `references/openapi.yaml#/components/schemas/Pet/$ref` → `references/models.yaml#/Pet`.
2. `references/models.yaml#/Pet/properties/id/$ref` → `references/common.yaml#/Identifier`.

Each side has its own document URI, pointer, line, column, and offset. These are source-index results, not candidate-native provenance.

## 12. Pointer findings

- RFC 6901 escaping worked for `/paths/~1pets~1{petId}` and `/components/schemas/Pet/properties/a~1b~0c`.
- Array indices were stable and distinct at `/parameters/0`, `/parameters/1`, and `/parameters/2`.
- Three identical `Identifier` scalar values mapped to three distinct structural locations; no text searching was used.
- Compact, expanded/commented, and reordered YAML retained `/paths/~1pets/get` while moving from lines 5 to 12 to 3.
- A bundled pointer must not substitute for the original physical pointer.

Scalar lifecycle paths are not suitable as canonical pointers. The nested test again produced an `[object Object]` segment, making deterministic canonical conversion ambiguous. Redocly does not expose successful valid-node paths through its documented safe API.

## 13. Line and column findings

Candidate-native valid-node line, column, range, offset, and AST evidence were unavailable through the documented APIs tested.

The OAIT-owned proof returned exact 1-based key anchors for YAML and JSON. Pointer identity remained stable while whitespace/comments/key order changed presentation positions. Recommended future reporting convention remains 1-based line and column; stable semantic identity should remain `documentUri + pointer`.

Full ranges are technically feasible from source node offsets but are not necessary for the v0.1 minimum gate.

## 14. Error-location findings

Scalar structural diagnostics returned JSON Pointer strings such as `/paths/~1pets~1{petId}/get/parameters/0/required`, despite the installed TypeScript declaration describing `path` as an array. The caller knows the input document, but Scalar does not attach it. Malformed YAML threw `YAMLParseError` with structured `linePos` and `pos` fields; this is useful observation but not a documented Scalar error contract, so line/column are `PARTIAL`, not production-safe `NATIVE` evidence. No human-readable message parsing was used.

Redocly unresolved-reference diagnostics returned native original source paths and canonical `#/...` pointers. The documented result did not contain line/column fields. Redocly exports additional AST/location formatting helpers, but they are not listed among the package's documented safe APIs and were therefore not used. Malformed YAML threw an error whose message contained position text; it was recorded observationally and not parsed.

Redocly's `struct` lint did not diagnose the controlled `required: false` path parameter, which is retained as a separate behavioral failure rather than hidden by another diagnostic.

## 15. Candidate-native versus OAIT-owned evidence

| Evidence field | Scalar valid node | Scalar diagnostic | Redocly valid node | Redocly diagnostic |
| --- | --- | --- | --- | --- |
| `documentUri` | DERIVABLE from caller input | OAIT_OWNED_REQUIRED | NOT_AVAILABLE per node | NATIVE path, URI normalization DERIVABLE |
| original pointer | OAIT_OWNED_REQUIRED | NATIVE runtime string | NOT_AVAILABLE | NATIVE |
| line | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED |
| column | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED |
| range/offset | OAIT_OWNED_REQUIRED | undocumented observation only | OAIT_OWNED_REQUIRED | OAIT_OWNED_REQUIRED |

For both candidates, the minimum valid-node gate—native or reliably derived `documentUri + original pointer`—is not satisfied without an OAIT-owned index.

## 16. Unexpected behavior

- Scalar's runtime diagnostic `path` is a JSON Pointer string, contrary to its installed `ErrorObject` declaration (`string[]`).
- Scalar's malformed-YAML exception carried structured positions even though the candidate API does not document that error contract.
- Scalar's nested lifecycle path again included `[object Object]`.
- Redocly diagnostic source/pointer evidence is much stronger than its successful-node evidence.
- Redocly did not flag the intentionally invalid path-parameter requirement under the tested documented `struct` configuration.

## 17. Limitations

- The `yaml@2.8.3` proof establishes feasibility only; it is not a production implementation or technology decision.
- A dedicated comparison of YAML/JSON CST/AST libraries, recovery behavior, memory cost, comment handling, and maintenance characteristics was not performed.
- Symlink identity was not executed as a persisted fixture because portable symlink behavior differs across platforms and repositories. OAIT still needs an explicit canonicalization policy covering absolute paths, `file:` URI normalization, realpath/symlink policy, case sensitivity, and percent encoding.
- Detailed validator-to-rule mapping remains SPIKE-006.
- Candidate-undocumented helpers were intentionally excluded even where technically exported.

## 18. Architecture implications

SPIKE-003 supports Outcome C: candidate-native valid-node locations are insufficient. OAIT should own a source-location index built before bundling or dereferencing.

Required responsibilities are:

1. canonicalize each approved physical source into a document URI;
2. parse each raw YAML/JSON document into a source-preserving tree;
3. structurally walk maps and arrays to build RFC 6901 pointer → range entries;
4. record 1-based presentation anchors and raw offsets;
5. record each `$ref` declaration before transformation;
6. resolve each hop to a target document and pointer under OAIT-controlled security policy;
7. retain candidate diagnostic locations but normalize them through the same index;
8. keep bundled pointers explicitly separate from original-source pointers;
9. attach owned source evidence to normalized logical entities later.

The conceptual `SourceLocationIndex.locate(documentUri, pointer)` abstraction is practical, but its production contract remains undecided.

## 19. Candidate continuation

- Scalar `0.28.10`: **Continue.** Parsing, validation, resolution, and location indexing should be separate concerns. Scalar cannot supply the canonical source index, but this does not disqualify its parser role. Its runtime diagnostic type mismatch and lifecycle-path anomaly remain integration risks.
- Redocly `2.40.0`: **Continue.** Its diagnostics provide valuable source/pointer evidence, while successful-node locations require the owned index. Its structural diagnostic gap should be revisited in validation-focused SPIKE-006.

## 20. Separate source-location technology spike

**Yes.** Before production implementation, run a focused technology spike comparing source-preserving YAML/JSON parsers or CST/AST strategies. It should evaluate exact ranges, malformed-input recovery, YAML features, JSON behavior, duplicate-key policy, memory/performance, comment/source-token retention, pointer construction, library API stability, and maintenance/security characteristics.

The current proof is sufficient to validate the architecture but insufficient to select the source-index technology.

## 21. Production recommendation

No final production parser or source-location technology recommendation is made. Both parser candidates continue to later spikes, and the source-location concern should be evaluated independently.
