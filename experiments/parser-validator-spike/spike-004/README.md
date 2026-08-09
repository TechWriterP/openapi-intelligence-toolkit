# SPIKE-004: OpenAPI 3.2 Operation Behavior

## 1. Objective

Evaluate whether `@scalar/openapi-parser@0.28.10` and `@redocly/openapi-core@2.40.0` preserve enough OpenAPI 3.2 operation evidence for a future OAIT-owned, centralized, version-aware operation-discovery layer. This experiment does not implement production discovery, adapters, normalization, validation, rules, CLI, AI, or MCP functionality and does not select the final parser.

## 2. Normative OpenAPI 3.2 assumptions tested

The authoritative OpenAPI 3.2.0 assumptions encoded before candidate execution were:

- Path Item fixed operations are `get`, `put`, `post`, `delete`, `options`, `head`, `patch`, `trace`, and `query`.
- `additionalOperations` maps authored HTTP method keys to Operation Objects, and those keys retain their authored capitalization.
- An additional operation must not collide with a fixed operation method.
- A maximum of one applicable `in: querystring` parameter is permitted, and it cannot be combined with ordinary `in: query` parameters.
- Path-level parameters and operation-level declarations remain independent evidence before effective-parameter computation.
- Response objects may preserve both `summary` and `description`; responses include explicit, wildcard, and `default` keys.
- OpenAPI 3.0/3.1 raw fields named `query` and `additionalOperations` are not official operations for those versions merely because an object representation preserves them.

Candidate behavior was measured against these expectations; it was not used to define them.

## 3. Environment and exact dependencies

- Date: 2026-08-09
- OS: Darwin 25.5.0 arm64
- Node.js: `v24.18.0`
- npm: `11.16.0`
- TypeScript: `5.9.2`
- Module mode: ESM / NodeNext
- Experimental compilation: `skipLibCheck: true`

| Package | Exact version | Purpose |
| --- | ---: | --- |
| `@scalar/openapi-parser` | `0.28.10` | Scalar raw validation/dereference |
| `@scalar/json-magic` | `0.12.19` | Scalar documented bundle/load/lifecycle APIs |
| `@redocly/openapi-core` | `2.40.0` | Redocly bundle and `struct` lint |
| `yaml` | `2.8.3` | Existing candidate dependency baseline; no production source index implemented here |
| `typescript` | `5.9.2` | Compiler |
| `tsx` | `4.20.4` | TypeScript runner |
| `@types/node` | `24.3.0` | Node declarations |

No secondary candidate version was necessary.

## 4. Commands executed

```bash
git branch --show-current
git status --short --branch
node --version
npm --version
uname -srm
npm install
npm run typecheck
npm run run:scalar
npm run run:redocly
npm run run
npx tsc --noEmit --skipLibCheck false
npm ls --depth=0
find fixtures -type f | wc -l
shasum -a 256 results/*.json
```

Reproduction:

```bash
cd experiments/parser-validator-spike/spike-004
npm ci
npm run run
```

## 5. Candidate APIs

Scalar uses documented `validate(source)`, `dereference(value)`, `@scalar/json-magic` `bundle(input, options)`, `readFiles()`, URL maps, and lifecycle hooks.

Redocly uses documented safe APIs `createConfig()`, `bundle({ ref, config })`, and `lint({ ref, config })` with the `struct` rule. No Redocly parser-only safe API or supported operation visitor was identified, so those modes are `NOT_SUPPORTED`. No package internals, monkey patches, or copied private traversal code were used.

## 6. Fixture inventory

Twenty-five persisted YAML files were created:

- 13 valid single-file fixtures: minimal QUERY, all nine fixed methods, four additional methods (`COPY`, `PURGE`, `POLL`, `FOO`), mixed fixed/additional forms, multiple paths, `MiXeD`, path parameters, overrides, fixed/additional `querystring`, request bodies, response summary, and operation-ID enumeration.
- Four referenced files: root, external Path Item, parameters, and schemas. The external Path Item contains QUERY and COPY, with nested parameter/schema references.
- Two cross-version controls: OpenAPI 3.1.2 and 3.0.4, each preserving raw `query`, `additionalOperations`, and `someFutureField` beside a valid legacy operation.
- Six negative fixtures: fixed-method collision, duplicate `querystring`, query plus querystring, empty additional map, invalid additional value, and duplicate operationId.

All fixture hashes are recorded before and after execution in both result files. Both hash maps are identical.

## 7. Manually established operation inventory

| Fixture | Expected operations |
| --- | ---: |
| `query-minimal.yaml` | 1: QUERY |
| `all-fixed.yaml` | 9: GET, PUT, POST, DELETE, OPTIONS, HEAD, PATCH, TRACE, QUERY |
| `additional-operations.yaml` | 4: COPY, PURGE, POLL, FOO |
| `mixed.yaml` | 5: GET, POST, QUERY, COPY, PURGE |
| `multiple-paths.yaml` | 6 across three Path Items |
| `method-case.yaml` | 1: `MiXeD` exactly |
| `path-parameters.yaml` | 3: GET, QUERY, COPY |
| `parameter-overrides.yaml` | 2: QUERY, COPY; path plus operation declarations retained |
| `querystring.yaml` | 1: QUERY |
| `additional-querystring.yaml` | 1: SEARCH |
| `request-bodies.yaml` | 2: QUERY, COPY |
| `response-summary.yaml` | 1: QUERY |
| `operation-ids.yaml` | 4: GET, QUERY, COPY, PURGE |
| Referenced Path Item | 2: QUERY, COPY |

The candidate-neutral evidence records path template, source kind, declared field/key, HTTP method, operationId, declared parameter counts, request-body/content presence, response keys/summaries, nested schema reachability, OAIT pointer, and candidate path only as secondary evidence.

## 8. Complete comparison matrix

| Capability | Scalar 0.28.10 | Redocly 2.40.0 |
| --- | --- | --- |
| Parse/process OAS 3.2 | PASS | PASS via bundle/lint; raw-only NOT_SUPPORTED |
| Preserve fixed GET | PASS | PASS |
| Preserve fixed QUERY | PASS | PASS |
| Traverse fixed QUERY | PASS | NOT_SUPPORTED |
| Preserve `additionalOperations` | PASS | PASS |
| Preserve COPY | PASS | PASS |
| Preserve PURGE | PASS | PASS |
| Preserve exact additional method case | PASS | PASS |
| Mixed fixed/additional discovery | PASS | PASS |
| Path-level parameters | PASS | PASS |
| Operation override evidence | PASS | PASS |
| Preserve `querystring` | PASS | PASS |
| Preserve request body under QUERY | PASS | PASS |
| Preserve request body under additional operation | PASS | PASS |
| Preserve responses | PASS | PASS |
| Preserve response summary | PASS | PASS |
| Enumerate operationIds | PASS | PASS |
| Referenced Path Item QUERY | PASS | PASS |
| Referenced Path Item additional operation | PASS | PASS |
| Bundle preservation | PASS | PASS |
| Candidate traversal support | PARTIAL | NOT_SUPPORTED |
| OAS 3.1 control behavior | PASS | PASS |
| OAS 3.0 control behavior | PASS | PASS |
| TypeScript representation | PARTIAL | PARTIAL |
| Public APIs only | PASS | PASS |

Scalar traversal is `PARTIAL`, despite emitting callbacks for fixed and additional operations, because referenced lifecycle paths contain `[object Object]` and cannot be canonical pointers. Redocly has no documented safe operation visitor, but its bundled object is sufficient for an OAIT-owned walker.

TypeScript is `PARTIAL` because both published declaration sets include `query` and `additionalOperations` and agree with runtime, but the combined dependency graph does not compile with `skipLibCheck: false` under NodeNext. Scalar declarations contain extensionless NodeNext-relative imports and missing `@scalar/types/utils`; Redocly configuration declarations require undeclared React/Markdoc types. This reproduces the integration limitation recorded in earlier spikes.

## 9. Invalid-case matrix

| Invalid/negative case | Scalar | Redocly `struct` |
| --- | --- | --- |
| Fixed POST + `additionalOperations.POST` | PARSER_PRESERVES_WITH_DIAGNOSTIC | PARSER_ACCEPTS |
| Duplicate `querystring` | PARSER_PRESERVES_WITH_DIAGNOSTIC | PARSER_ACCEPTS |
| `query` + `querystring` | PARSER_PRESERVES_WITH_DIAGNOSTIC | PARSER_ACCEPTS |
| Empty `additionalOperations` | PARSER_ACCEPTS | PARSER_ACCEPTS |
| Invalid additional-operation value | PARSER_PRESERVES_WITH_DIAGNOSTIC | PARSER_PRESERVES_WITH_DIAGNOSTIC |
| Duplicate operationId across forms | PARSER_ACCEPTS | PARSER_ACCEPTS |

Acceptance is recorded behavior, not automatic parser failure. Full conformance evaluation remains SPIKE-006. Scalar's baseline schema validation already recognizes several new 3.2 constraints that Redocly's tested `struct` rule does not diagnose.

## 10. Raw parse findings

Scalar `validate(source).specification` preserved all manually expected operation counts and content. All 13 valid fixtures returned `valid: true` after the required path parameters were included. It preserved the exact `MiXeD` key, `querystring`, request bodies, response summaries, operation IDs, path parameters, and override declarations.

Redocly exposes no documented parser-only safe representation in the evaluated API. Raw parse is therefore `NOT_SUPPORTED`, not simulated through internals. `bundle.parsed` preserved the required raw object fields for all single-file fixtures and provides enough semantic input for OAIT adaptation.

## 11. Bundle findings

Scalar `bundle()` preserved all operation forms and counts for single-file fixtures. In the referenced fixture it moved the external Path Item under `x-ext` and rewrote the root reference; documented `dereference()` demonstrated that QUERY and COPY and their nested structures remained reachable. The bundled/dereferenced graph is transformed evidence, never canonical OAIT source evidence.

Redocly `bundle()` preserved all valid counts, exact additional keys, and child structures. It made referenced QUERY and COPY directly discoverable in the bundled root and listed all four source files in `fileDependencies`. Its operation objects retained nested parameter/schema reference reachability, but bundled pointers do not replace original file pointers.

## 12. Traversal findings

Scalar lifecycle hooks emitted operation-like callbacks for QUERY, COPY, PURGE, and traditional methods. For the referenced fixture, paths included:

```text
x-ext / <hash> / [object Object] / query
x-ext / <hash> / [object Object] / additionalOperations / COPY
```

These prove traversal but are unsuitable for canonical identity. Candidate traversal can be used as secondary diagnostics only.

No documented Redocly operation visitor was used. OAIT can walk `bundle.parsed`, but that is OAIT-owned generic traversal rather than candidate-native semantic operation traversal.

## 13. Cross-version findings

Both candidates preserved raw `query`, `additionalOperations`, and `someFutureField` in OpenAPI 3.0/3.1 object representations. Both semantic validation paths diagnosed those fields as unexpected for 3.0/3.1: Scalar through `validate()` errors and Redocly through `struct` lint.

The experiment's version-aware discovery returned only GET for 3.1 and only POST for 3.0. A deliberately contrasted hypothetical 3.2 interpretation would have returned raw QUERY and COPY as well. Therefore:

```text
PRESERVED ≠ SEMANTICALLY_RECOGNIZED
```

OAIT must determine version capabilities before interpreting fields as operations. Generic object preservation alone must never cause `someFutureField` or 3.2-only fields to become legacy operations.

## 14. `querystring` findings

Both candidates preserved `in: querystring`, its `content`, and reachable nested schema under fixed QUERY and additional SEARCH. Preservation was not coupled to fixed QUERY. Both retained the path-level and operation-level parameter declarations used by later effective-parameter computation.

Scalar diagnosed duplicate applicable querystring parameters and query-plus-querystring. Redocly `struct` preserved but did not diagnose those combinations. Deep schema/dialect behavior remains SPIKE-005.

## 15. TypeScript/runtime findings

Runtime and published types agree on the two primary fields:

- Scalar declarations include OpenAPI 3.2 `query` and `additionalOperations` in `dist/schemas/v3.2/schema.d.ts`; runtime preserves both.
- Redocly declarations include both in `lib/typings/openapi.d.ts`; runtime bundle/lint preserves both.

Strict experiment source compiles under ESM/NodeNext. Dependency declarations require `skipLibCheck: true`; an explicit `skipLibCheck: false` run failed for the dependency issues summarized above. No runtime-support/type-omission mismatch was found for the two tested fields.

## 16. Source-correlation findings

Representative OAIT-owned pointers were manually established before execution:

```text
/paths/~1search/query
/paths/~1pets~1{id}/additionalOperations/COPY
/paths/~1pets~1{id}/additionalOperations/PURGE
/paths/~1search/query/parameters/0
/paths/~1search/query/responses/200
```

The experimental discovery constructs these from authored path/field segments using OAIT RFC 6901 escaping. In the referenced fixture, canonical evidence remains `fixtures/referenced/paths/pets.yaml + /query` or `/additionalOperations/COPY`; candidate bundle/lifecycle paths remain transformed secondary evidence. ADR-004/005 source ownership is unchanged.

## 17. Unexpected behavior

- Scalar's referenced lifecycle path again contained `[object Object]`, confirming the SPIKE-002/003 anomaly specifically for QUERY and COPY.
- Scalar's baseline validation schema already diagnoses fixed-method collision and querystring exclusivity/cardinality.
- Redocly `struct` accepts those same negative cases while diagnosing an invalid scalar additional-operation value.
- Both candidates preserve raw 3.2-looking properties in 3.0/3.1 while also diagnosing them semantically, demonstrating why preservation and recognition must be separate evidence fields.
- Redocly has strong bundle/lint behavior but no documented parser-only or operation visitor API in the evaluated safe surface.

## 18. Limitations

- Only macOS arm64 and Node.js v24.18.0 were executed.
- Fixtures are YAML because format/source indexing was already resolved independently; JSON parity for semantic parser behavior was established in SPIKE-001, not repeated here.
- Redocly traversal remains `NOT_SUPPORTED` through documented safe APIs; undocumented AST/walker exports were intentionally excluded.
- Scalar reference reachability required composing documented bundle and dereference APIs; the final graph is transformed.
- Full validation quality, schema/dialect behavior, and comparative performance remain SPIKE-006, SPIKE-005, and SPIKE-007 respectively.
- This experiment does not finalize production operation identity or effective parameter calculation.

## 19. Mandatory gates

| Gate | Scalar | Redocly |
| --- | --- | --- |
| Traditional fixed operations | PASS | PASS |
| Fixed QUERY | PASS | PASS |
| `additionalOperations` | PASS | PASS |
| Exact additional method keys | PASS | PASS |
| Operation Objects under both forms | PASS | PASS |
| operationId | PASS | PASS |
| Parameters | PASS | PASS |
| Responses | PASS | PASS |
| Referenced Path Item operations | PASS | PASS |
| Sufficient evidence for OAIT normalization | PASS | PASS |
| Version-aware 3.2 versus 3.0/3.1 | PASS | PASS |
| Public/documented APIs | PASS | PASS |

Both candidates pass all 12 mandatory gates. Redocly's raw/traversal limitations do not destroy semantics because its documented bundle retains all required evidence for an OAIT-owned walker.

## 20. Architecture implications and explicit questions

1. **Must OAIT own operation discovery?** Yes. Both candidates preserve usable structures, but their native traversal surfaces differ and source identity is already OAIT-owned.
2. **Can candidate-native operation traversal be trusted?** No as the canonical mechanism. Scalar paths are anomalous after bundling; Redocly has no supported operation visitor.
3. **Should discovery use raw/version-adapted structures?** Yes: use the applicable version capabilities over an adapter-isolated object representation before normalization.
4. **Does fixed QUERY require special handling?** It must be included in the 3.2 supported fixed-field set, not as a one-off branch throughout the codebase.
5. **Can `additionalOperations` use the eventual operation concept?** Yes. Its values have the same Operation Object evidence.
6. **How should capitalization be preserved?** Retain exact `declaredMethod` (`MiXeD`) and derive any comparison form separately.
7. **Does the domain need source representation and HTTP method?** Yes: source kind (`fixed`/`additional`), declared field/key, and semantic HTTP method are distinct evidence.
8. **Can both forms use one normalized shape?** Yes; this spike found no child-structure difference requiring separate normalized operation types.
9. **Does the capabilities model need refinement?** Yes, it should represent the version-supported fixed operation fields and whether `additionalOperations` and `querystring` are supported, rather than only a hard-coded legacy list.
10. **Do parser structures risk leaking?** Yes unless adapters convert them to OAIT-owned discovered-operation evidence before normalization.
11. **Are explicit version adapters required?** Yes. Cross-version controls prove raw preservation cannot determine semantics.
12. **Is a new ADR justified now?** The evidence supports an eventual ADR for OAIT-owned, version-aware operation discovery, but no ADR should be created until the spike is reviewed and the broader parser decision progresses.

## 21. Candidate continuation recommendation

- **Scalar 0.28.10: continue to SPIKE-005.** It passes every gate, provides direct raw validation evidence, recognizes several normative 3.2 constraints, and exposes lifecycle callbacks. Its transformed traversal paths and dependency declarations remain limitations.
- **Redocly 2.40.0: continue to SPIKE-005.** It passes every gate through documented bundle/lint APIs and preserves every required 3.2 structure. It requires OAIT-owned traversal and offers weaker tested negative-case diagnostics, but neither issue loses required operation semantics.

Both continue; operation evidence modestly favors Scalar's native 3.2 validation/raw mode, but SPIKE-004 does not select a winner.

## 22. Follow-up actions

1. Carry both exact baselines into SPIKE-005 schema/dialect behavior.
2. Revisit the divergent negative diagnostics in SPIKE-006.
3. Measure bundle/traversal costs in SPIKE-007 rather than drawing performance conclusions here.
4. After spike review, consider an ADR for OAIT-owned version-aware operation discovery and capability modeling; do not alter ADR-003/004/005.
5. Preserve source kind, declared method/key, semantic method, original source pointer, and transformed candidate path as separate concepts in detailed production design.

## Result provenance

Machine-readable evidence:

- `results/scalar.json`
- `results/redocly.json`

Each file contains environment, exact versions, valid fixture modes, normalized operation evidence, references, cross-version controls, invalid cases, TypeScript evidence, mutation hashes, gates, unexpected behavior, and an internal result hash. Whole-file hashes are refreshed after the final verification run.

```text
results/scalar.json   c1948cbe75771b972282763256209f1241e08b43e059177cebb78aef19434858
results/redocly.json  09d1931f0544fceea83755146b2c38e3e1b2398595ad551f5d87d8fa8b408011
```
