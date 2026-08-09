# SPIKE-005: Schema and Dialect Behavior

## 1. Objective

Determine whether `@scalar/openapi-parser@0.28.10` and `@redocly/openapi-core@2.40.0` preserve enough version-specific schema and dialect evidence for OAIT to combine a normalized projection with an authoritative candidate-neutral canonical schema value. This experiment implements no production normalization, dialect resolver, evaluator, validator, rules, CLI, AI, or MCP functionality and does not select the final parser.

## 2. Normative assumptions

- OAS 3.0 uses its OpenAPI-specific Schema Object model: `nullable` is version-specific, `type` is a single string, boolean whole schemas are unsupported, and arbitrary non-extension keywords are not semantically supported.
- OAS 3.1/3.2 use the Draft 2020-12-based model and permit boolean schemas, null/type arrays, `$schema`, `$id`, `$defs`, dynamic references, and arbitrary schema vocabulary keywords.
- The OAS default dialect for both 3.1 and 3.2 is exactly `https://spec.openapis.org/oas/3.1/dialect/base`. No `/oas/3.2/` URI is fabricated.
- Schema-resource `$schema` overrides document `jsonSchemaDialect` in expected effective-dialect evidence.
- JSON Schema `$ref` siblings in 3.1/3.2 remain meaningful schema keywords.
- Preservation, semantic support, diagnostics, and transformation are separate evidence dimensions.

## 3. Environment and dependencies

- 2026-08-09; Darwin 25.5.0 arm64
- Node.js `v24.18.0`; npm `11.16.0`; TypeScript `5.9.2`
- ESM / NodeNext; experimental `skipLibCheck: true`

| Package | Exact version |
| --- | ---: |
| `@scalar/openapi-parser` | `0.28.10` |
| `@scalar/json-magic` | `0.12.19` |
| `@redocly/openapi-core` | `2.40.0` |
| `yaml` | `2.8.3` |
| `typescript` | `5.9.2` |
| `tsx` | `4.20.4` |
| `@types/node` | `24.3.0` |

No secondary version was needed.

## 4. Commands

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
shasum -a 256 results/*.json
```

Reproduce with `npm ci && npm run run` from this directory.

## 5. APIs and fixtures

Scalar uses documented `validate`, `bundle`, `readFiles`, lifecycle hooks, and `dereference`. Redocly uses documented `createConfig`, `bundle`, and `lint`. Redocly raw parse and schema visitor modes are `NOT_SUPPORTED`; no internals were used.

Seven persisted fixtures cover all 25 themes: OAS 3.0 baseline/controls; OAS 3.1 and 3.2 nullability, booleans, composition, recursion, siblings, dialects, unknown keywords, `$defs`, modern keywords, `$id`, anchors/dynamic refs; separate default-dialect controls; a rich 3.2 schema; and an external recursive schema with an explicit dialect override. Fixture hashes before/after are identical in both results.

### S1–S25 fixture traceability

Pointers are original OAIT-owned RFC 6901 locations in the named persisted fixture. A row with two locations intentionally provides the required cross-version repetition without duplicating files.

| Case | Persisted fixture | Schema name / original pointer | Feature tested |
| --- | --- | --- | --- |
| S1 | `fixtures/oas-3.0/schemas.yaml` | `Baseline` — `/components/schemas/Baseline` | OAS 3.0 baseline object, properties, required, format, enum, and descriptions |
| S2 | `fixtures/oas-3.0/schemas.yaml` | `Nullable` — `/components/schemas/Nullable` | OAS 3.0 `type: string` plus `nullable: true` without type-array rewriting |
| S3 | `fixtures/oas-3.0/schemas.yaml` | `NullableNoType` — `/components/schemas/NullableNoType` | OAS 3.0 `nullable` without an explicit type |
| S4 | `fixtures/oas-3.1/schemas.yaml` | `NullType` — `/components/schemas/NullType` | OAS 3.1 array-valued type containing `null` |
| S5 | `fixtures/oas-3.2/schemas.yaml` | `NullType` — `/components/schemas/NullType` | OAS 3.2 array-valued type containing `null` |
| S6 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `BooleanTrue` — `/components/schemas/BooleanTrue` | Boolean `true` schema identity in both JSON Schema-based OAS versions |
| S7 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `BooleanFalse` — `/components/schemas/BooleanFalse` | Boolean `false` schema identity in both JSON Schema-based OAS versions |
| S8 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Composition` — `/components/schemas/Composition` | `allOf`, `oneOf`, `anyOf`, `not`, inline, `$ref`, and boolean children |
| S9 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Composition` — `/components/schemas/Composition/oneOf` and `/components/schemas/Composition/allOf` | Nested composition and deterministic branch order |
| S10 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Node` — `/components/schemas/Node/properties/child/$ref` | Direct recursive `$ref`, termination, and cycle-safe canonical evidence |
| S11 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `A`, `B` — `/components/schemas/A/properties/b/$ref`, `/components/schemas/B/properties/a/$ref` | Mutual recursion |
| S12 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `RefSibling` — `/components/schemas/RefSibling` | Schema `$ref` with `description` and `maxProperties` siblings |
| S13 | `fixtures/oas-3.1/schemas.yaml` | document root — `/jsonSchemaDialect`; ordinary contained schemas under `/components/schemas` | Exact custom document-level dialect preservation |
| S14 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `SchemaOverride` — `/components/schemas/SchemaOverride/$schema` | Schema-resource `$schema` overriding document/default dialect evidence |
| S15 | `fixtures/oas-3.1/default-dialect.yaml`; `fixtures/oas-3.2/default-dialect.yaml` | `Defaulted` — `/components/schemas/Defaulted` | Default OAS dialect evidence with no authored dialect declaration |
| S16 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `UnknownKeyword` — `/components/schemas/UnknownKeyword/acmeQualityScore` | Non-`x-` custom keyword and value preservation |
| S17 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Container` — `/components/schemas/Container/$defs/Identifier` | `$defs`, its child schema, and `$ref` reachability |
| S18 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Modern` — `/components/schemas/Modern` | `const`, `contains`, `minContains`, `maxContains`, `prefixItems`, `unevaluatedProperties`, and `dependentSchemas` |
| S19 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Anchored` — `/components/schemas/Anchored/$id` | Exact `$id` preservation and bundle transformation observation |
| S20 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Anchored` — `/components/schemas/Anchored/$anchor`, `/$dynamicAnchor`, `/properties/next/$dynamicRef` | `$anchor`, `$dynamicAnchor`, and `$dynamicRef` preservation |
| S21 | `fixtures/referenced/openapi.yaml`; `fixtures/referenced/schemas/customer.yaml` | `Customer` declaration — `/components/schemas/Customer/$ref`; external schema root — empty pointer | External schema containing dialect, ID, definitions, recursion, and custom keyword |
| S22 | `fixtures/referenced/openapi.yaml`; `fixtures/referenced/schemas/customer.yaml` | `/jsonSchemaDialect`; external root `/$schema` | External `$schema` override distinct from OpenAPI document default |
| S23 | `fixtures/oas-3.0/schemas.yaml`; `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `Nullable` and `NullType` at their component pointers | Parallel nullable representation contrast without rewriting |
| S24 | `fixtures/oas-3.1/schemas.yaml`; `fixtures/oas-3.2/schemas.yaml` | `NullableKeyword` — `/components/schemas/NullableKeyword/nullable` | Physical `nullable` preservation versus lack of OAS 3.0 nullable semantics |
| S25 | `fixtures/oas-3.2/schemas.yaml` | `Rich` — `/components/schemas/Rich` | Full manually inventoried candidate-neutral canonical fidelity |

The separate OAS 3.0 boolean, type-array, `$schema`, `$defs`, unknown-keyword, and `$ref`-sibling controls are additionally located in `fixtures/oas-3.0/schemas.yaml`; they support the required cross-version semantic matrix even though they are not separately numbered S-cases.

## 6. Baseline, boolean, and nullability findings

Both preserve OAS 3.0 type, format, properties, required, enum, descriptions, and original representation without 3.1/3.2 conversion. Both preserve all tested 3.1/3.2 structures.

| Version | Scalar | Redocly bundle | Redocly `struct` |
| --- | --- | --- | --- |
| 3.0 boolean controls | Preserved; diagnosed | Preserved | Diagnosed |
| 3.1 booleans | Literal booleans; accepted | Literal booleans | Incorrectly diagnosed as requiring objects |
| 3.2 booleans | Literal booleans; accepted | Literal booleans | Incorrectly diagnosed as requiring objects |

OAS 3.0 `type: string` plus `nullable: true` and nullable-without-type remain exactly authored. OAS 3.1/3.2 `type: [string, "null"]` remains an array containing `null`; neither candidate introduces `nullable`. A physical 3.1/3.2 `nullable` keyword is preserved but is not assigned OAS 3.0 semantics. Redocly `struct` diagnoses that keyword while Scalar accepts it as an arbitrary keyword.

## 7. Composition and recursion

Both preserve `allOf`, `oneOf`, `anyOf`, `not`, nested combinations, inline objects, `$ref` children, boolean branches, and deterministic ordering without flattening.

Direct `Node → Node` and mutual `A → B → A` remain reference graphs and processing terminates. Scalar dereference also terminates but creates a cyclic JavaScript graph; that graph is never persisted. Canonical schema must remain reference-bearing and cycle-safe.

## 8. `$ref` siblings

For OAS 3.1/3.2 both retain `$ref`, `description`, and `maxProperties` on the same Schema Object. The 3.0 control is physically retained with diagnostics/legacy semantics recorded separately. Adapters must not apply a universal “has `$ref`, drop siblings” rule.

## 9. Dialects

Both preserve exact custom document dialect `https://example.test/schema/dialect` and schema override `https://json-schema.org/draft/2020-12/schema`.

Expected dialect is independently derived as schema `$schema`, else document `jsonSchemaDialect`, else the exact OAS 3.1 dialect URI for OAS 3.1/3.2. OAS 3.0 remains `oas-3.0-schema`, not Draft 2020-12. Candidate-reported dialect is not normative.

## 10. Unknown and modern keywords

Both preserve `acmeQualityScore: 42` in 3.1/3.2. Scalar accepts it; Redocly bundle preserves it but `struct` incorrectly diagnoses it. In 3.0 both retain and diagnose it, proving preservation is not semantic support.

Both preserve every tested modern keyword and value:

```text
const, contains, minContains, maxContains, prefixItems,
unevaluatedProperties, dependentSchemas, $defs, $id,
$anchor, $dynamicAnchor, $dynamicRef
```

No ordinary `$defs` fixture was translated into OAS 3.0 components.

## 11. External schema and transformations

Both load and retain the external schema's `$schema`, `$id`, `$defs`, recursion, and custom keyword. Its explicit Draft 2020-12 dialect remains distinct from entry default `https://example.test/default`.

Scalar moves it under `x-ext` and rewrites internal refs to `#/x-ext/<hash>/...`. Redocly relocates/reuses definitions under root components and rewrites refs to component pointers. These are transformed paths, not canonical source identity. Original identity remains `fixtures/referenced/schemas/customer.yaml` plus empty root pointer.

Scalar raw `validate()` is the strongest untransformed representation. Scalar dereference is cyclic/noncanonical. Redocly has no documented raw-only mode; `bundle.parsed` retains material content but transforms external paths. `fileDependencies` does not replace ADR-004/005 provenance.

## 12. TypeScript/runtime

Scalar declarations explicitly cover 3.1/3.2 and `jsonSchemaDialect`; runtime supports booleans, type arrays, `$schema`, and unknown keywords. Redocly's `Oas3_1Schema` includes type arrays and named modern keywords, but its inspected root type omits `jsonSchemaDialect` and component schemas are object-oriented rather than explicitly boolean-or-object. Runtime preserves both: a mismatch.

`skipLibCheck: false` fails because Scalar has extensionless NodeNext imports/missing `@scalar/types/utils`, while Redocly config declarations reference unavailable React/Markdoc types. These dependency issues are separate from runtime fidelity.

## 13. Canonical fidelity

The experiment-only canonical type is `boolean | Record<string, unknown>`, produced as plain JSON-compatible data before dereference. It contains no candidate classes, AST/lifecycle objects, prototypes, or cycles.

Both candidates matched all 14 manually expected rich-schema keys with no missing, added, or rewritten keys: `$id`, title, description, type, format, required, properties, enum, examples, default, allOf, `$defs`, `acmeQualityScore`, and `unevaluatedProperties`. Projection plus canonical representation is feasible without known loss in this corpus.

Representative OAIT pointers are recorded separately, including `/components/schemas/Node/properties/child/$ref` and `/components/schemas/Container/$defs/Identifier`; candidate paths are secondary.

## 14. Cross-version semantic matrix

| Feature | OAS 3.0 | OAS 3.1 | OAS 3.2 |
| --- | --- | --- | --- |
| `nullable` | PRESERVED + SEMANTICALLY_SUPPORTED with type | PRESERVED; not 3.0 semantics | PRESERVED; not 3.0 semantics |
| type array/null | PRESERVED + DIAGNOSED | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED + SEMANTICALLY_SUPPORTED |
| boolean schema | PRESERVED + DIAGNOSED | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED + SEMANTICALLY_SUPPORTED |
| `$schema` | PRESERVED + DIAGNOSED | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED + SEMANTICALLY_SUPPORTED |
| `jsonSchemaDialect` | NOT_APPLICABLE | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED/default supported |
| unknown keyword | PRESERVED + DIAGNOSED | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED + SEMANTICALLY_SUPPORTED |
| `$defs` | PRESERVED + DIAGNOSED | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED + SEMANTICALLY_SUPPORTED |
| `$ref` siblings | PRESERVED legacy control | PRESERVED + SEMANTICALLY_SUPPORTED | PRESERVED + SEMANTICALLY_SUPPORTED |

Redocly `struct` additionally misdiagnoses valid 3.1/3.2 booleans and arbitrary keywords; preservation remains PASS.

## 15. Complete comparison matrix

| Capability | Scalar | Redocly |
| --- | --- | --- |
| OAS 3.0 / 3.1 / 3.2 baseline | PASS | PASS |
| OAS 3.0 nullable | PASS | PASS |
| 3.1/3.2 multi-type null | PASS | PASS |
| Boolean true/false | PASS | PASS preservation / PARTIAL lint |
| 3.0 boolean control | PASS | PASS |
| allOf / oneOf / anyOf / not | PASS | PASS |
| Nested composition | PASS | PASS |
| Direct/mutual recursion | PASS | PASS |
| `$ref` siblings 3.1/3.2 | PASS | PASS |
| `$ref` sibling 3.0 control | PASS | PASS |
| `jsonSchemaDialect` | PASS | PASS runtime / PARTIAL typing |
| `$schema` override/default dialect | PASS | PASS |
| Unknown keyword | PASS | PASS preservation / PARTIAL lint |
| `$defs` and modern keywords | PASS | PASS |
| `$id`, anchors, dynamic ref | PASS | PASS |
| External schema/override | PASS | PASS |
| Canonical fidelity | PASS | PASS |
| TypeScript representation | PARTIAL | PARTIAL |
| Public APIs only | PASS | PASS |

Every PARTIAL is a typing or validation-adjacent limitation; no material preservation loss was found.

## 16. Unexpected behavior and limitations

- Redocly `struct` incorrectly diagnoses valid 3.1/3.2 boolean schemas and arbitrary keywords despite preserving them.
- Redocly runtime supports `jsonSchemaDialect` and boolean schemas beyond its inspected types.
- Scalar dereference creates cycles, confirming it cannot be canonical.
- Both bundlers rewrite external refs differently while retaining material keywords.
- Only macOS arm64/Node 24 was executed; this is representative, not a full JSON Schema conformance suite.
- Custom-vocabulary and dynamic-reference evaluation were not established.
- Redocly raw/visitor modes are NOT_SUPPORTED. SPIKE-006 owns diagnostic comparison and SPIKE-007 performance.

## 17. Mandatory gates

| Gate | Scalar | Redocly |
| --- | --- | --- |
| 1. OAS 3.0 schema content without silent conversion to 3.1/3.2 semantics | PASS | PASS |
| 2. OAS 3.1 schema content | PASS | PASS |
| 3. OAS 3.2 schema content | PASS | PASS |
| 4. Boolean schemas for 3.1/3.2 | PASS | PASS |
| 5. Multi-type declarations including `null` | PASS | PASS |
| 6. OAS 3.0 `nullable` | PASS | PASS |
| 7. Composition structures | PASS | PASS |
| 8. Recursive-schema strategy | PASS | PASS |
| 9. Schema `$ref` preservation | PASS | PASS |
| 10. `$ref` siblings for 3.1/3.2 | PASS | PASS |
| 11. `jsonSchemaDialect` preservation | PASS | PASS |
| 12. Schema-root `$schema` preservation | PASS | PASS |
| 13. Unknown/custom keyword preservation for 3.1/3.2 | PASS | PASS |
| 14. Candidate-neutral canonical schema construction without candidate-type leakage | PASS | PASS |
| 15. Referenced external schema strategy | PASS | PASS |
| 16. Public/documented API access | PASS | PASS |

The underlying machine results contain all 16 individual gates; both candidates pass all. Redocly's incorrect diagnostics do not destroy preserved semantics and therefore do not fail parser-fidelity gates.

## 18. Architecture implications

1. Projection plus canonical representation is viable and necessary.
2. OAIT must own effective dialect precedence.
3. Candidate schema types must remain behind adapters.
4. Boolean schemas remain literal booleans.
5. 3.0 nullable and 3.1/3.2 null types remain distinct.
6. Unknown keywords and JSON Schema `$ref` siblings remain canonical.
7. Recursion remains graph/reference based.
8. `CanonicalSchemaValue = boolean | object` is sufficient for this corpus.
9. `OpenApiCapabilities.schemaDialectModel` remains valid.
10. `SchemaDialectInfo` should retain version model, document declaration, schema declaration, effective dialect, and decision provenance.
11. Both candidates transform external paths during bundling.
12. Scalar currently demonstrates stronger schema behavior because raw validation accepts valid booleans/custom keywords while Redocly lint misdiagnoses them.
13. ADR-003 is validated, not contradicted. The domain model may later clarify dialect-decision provenance and exact canonical typing, but no factual correction is required now.

## 19. Continuation, ADR, and follow-up

- Scalar 0.28.10: continue to SPIKE-006; all fidelity gates pass.
- Redocly 2.40.0: continue to SPIKE-006 with explicit boolean/custom-keyword diagnostic concerns; all preservation gates pass.
- Both continue; no final parser selection.

A future ADR for OAIT-owned dialect calculation and projection-plus-canonical schema appears justified after remaining evidence review. Do not create it yet. No existing ADR requires correction.

Follow up by retesting Redocly diagnostics in SPIKE-006, measuring canonical/bundle costs in SPIKE-007, preserving pre-bundle source/dialect/ref evidence, and refining `SchemaDialectInfo` during reviewed production design.

## Result provenance

Machine-readable evidence is in `results/scalar.json` and `results/redocly.json`. Each contains exact environment/versions, fixture hashes, version results, booleans, nullability, composition, recursion, references, dialects, keywords, external/canonical/TypeScript evidence, transformations, unexpected behavior, 16 gates, and an internal hash. Whole-file hashes are added after final verification.

```text
results/scalar.json   5082375b41be155f42aca35ea7650f3793cf80d10e14a5967fb71f9119860afb
results/redocly.json  fff21ef686b8f58b1857c1cd32d9b7ced8f5a4101b15a6ebca94ee93afc5960f
```
