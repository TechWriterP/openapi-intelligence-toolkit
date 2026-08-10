# SPIKE-006: Validator Capabilities and Diagnostics

## 1. Objective and normative assumptions

This isolated experiment measures conformance detection, diagnostic quality, and OAIT adaptability for Scalar, Redocly, and IBM. The manually authored oracle in `shared/expected.ts`, not candidate output, defines correctness. Preservation, semantic validation, diagnostics, and transformation remain separate. Candidate severity and rule IDs are evidence only; OAIT owns public rule IDs, severity, source identity, version applicability, and findings. No source was sanitized, upgraded, repaired, or bundled before conformance evaluation.

The oracle follows the version distinctions in the authoritative specification: OAS 3.0 operations require `responses`; 3.1/3.2 permit omission; Response `description` is required in 3.0/3.1 but not 3.2; 3.1/3.2 permit boolean schemas and unknown JSON Schema vocabulary keywords; 3.0 does not assign those later semantics. A generic load/reference failure is not credited as detection of a referenced file's structural violation.

## 2. Environment, versions, APIs, and configuration

- 2026-08-10; Darwin 25.5.0 arm64; Node.js `v24.18.0`; npm `11.16.0`.
- ESM/NodeNext; TypeScript `5.9.2`; `skipLibCheck: true`.
- Scalar `@scalar/openapi-parser@0.28.10` using public `validate(value, options)`; supporting `@scalar/json-magic@0.12.19` is pinned but not needed by this validation path.
- Redocly `@redocly/openapi-core@2.40.0` using public `createConfig()` and `lint()` with only `struct: error`. Recommended/governance rules were disabled.
- IBM `ibm-openapi-validator@1.37.15` using documented `lint-openapi --json --errors-only --ruleset ibm/oas-ruleset.yaml`; that ruleset extends `spectral:oas`, excluding IBM governance rules. The installed package exposes no package-root programmatic export, so programmatic integration is `NOT_SUPPORTED`; no internal module was imported.
- Supporting exact versions: `yaml@2.8.3`, `tsx@4.20.4`, `@types/node@24.3.0`.

`npm run typecheck` passes. `npx tsc --noEmit --skipLibCheck false` fails in candidate dependencies: Redocly configuration declarations require unavailable React/Markdoc types, and Scalar declarations contain missing `@scalar/types/utils` and extensionless NodeNext imports. IBM is CLI-only in this experiment.

## 3. Commands executed

```bash
git branch --show-current
git status --short --branch
npm install
npm run fixtures
npm run typecheck
npm run run:scalar
npm run run:redocly
npm run run:ibm
npm run run
npx tsc --noEmit --skipLibCheck false
node --version
npm --version
uname -srm
npm ls --depth=0
shasum -a 256 fixtures/**/*.yaml results/*.json
```

Reproduce with `npm ci && npm run fixtures && npm run run`. Every candidate ran twice per oracle row. Counts, identities, pointers, and ordering were stable. Before/after fixture SHA-256 maps are identical in all result files.

## 4. Fixture inventory, traceability, and oracle

All pointers are candidate-neutral RFC 6901 pointers. Multiple rows are persisted where a case requires independent version/mutation controls.

| Case | Persisted evidence | Expected feature / rule target |
| --- | --- | --- |
| V1 | `valid/oas-{3.0.4,3.1.2,3.2.0}.yaml` | Valid full controls |
| V2 | `root/v2-missing-info-{version}.yaml`, `/info` | Invalid missing `info`; CON-002 |
| V3 | `root/v3-missing-title.yaml`, `/info/title`; `v3-missing-version.yaml`, `/info/version` | Two independent invalid mutations; CON-002 |
| V4 | `root/v4-oas30-missing-paths.yaml`; `v4-components-only-{3.1.2,3.2.0}.yaml` | Invalid 3.0 root, valid later-version root controls; CON-002 |
| V5 | `parameters/v5-template-missing.yaml`, `/paths/~1pets~1{petId}` | Missing template declaration; CON-004 |
| V6 | `parameters/v6-template-similar.yaml`, parameter name pointer | Similar but unequal name; CON-004 |
| V7 | `parameters/v7-required-false.yaml`, `.../parameters/0/required` | Explicit false; CON-005 |
| V8 | `parameters/v8-required-missing.yaml`, same expected pointer | Omitted required; CON-005 |
| V9 | `parameters/v9-neither-schema-content.yaml`, `.../parameters/1` | Neither representation; CON-006 |
| V10 | `parameters/v10-both-schema-content.yaml`, `.../parameters/1` | Both representations; CON-006 |
| V11 | `parameters/v11-duplicate.yaml`, `.../parameters/2` | Duplicate `(name,in)`; CON-007 |
| V12 | `parameters/v12-valid-override.yaml` | Valid Path Item/Operation override |
| V13 | `references/v13-missing-internal.yaml`, `/components/schemas/Broken/$ref` | Missing internal target; CON-003 |
| V14 | `references/v14-missing-file.yaml`, same declaration pointer | Missing local file; CON-003 |
| V15 | `references/v15-recursive.yaml` | Valid recursive reference |
| V16 | `responses/v16-empty-{version}.yaml`, operation responses pointer | Empty Responses Object; CON-008 |
| V17 | `responses/v17-oas30-missing.yaml`, operation responses pointer | Missing 3.0 responses; CON-009 |
| V18 | `responses/v18-missing-{3.1.2,3.2.0}.yaml` | Valid omission controls |
| V19 | `responses/v19-missing-description.yaml`, response description pointer | Invalid 3.0 Response; CON-002 evidence |
| V20 | `responses/v20-missing-description.yaml`, same pointer | Invalid 3.1 Response; CON-002 evidence |
| V21 | `responses/v21-missing-description.yaml` | Valid 3.2 description omission |
| V22 | `operations/v22-duplicate-operation-id.yaml`, second operation ID | Exact duplicate; CNS-001 |
| V23 | `operations/v23-case-sensitive.yaml` | Valid case-sensitive IDs |
| V24 | `security/v24-undeclared.yaml`, requirement name pointer | Undeclared scheme; primary target CON-010 |
| V25 | `security/v25-declared.yaml` | Valid declared scheme |
| V26 | `version-awareness/v26-query.yaml` | Valid OAS 3.2 `query` |
| V27 | `version-awareness/v27-additional-operations.yaml` | Valid OAS 3.2 `additionalOperations` |
| V28 | `version-awareness/v28-querystring.yaml` | Valid OAS 3.2 `querystring` |
| V29 | `version-awareness/v29-boolean.yaml` | Valid 3.1 true/false schemas |
| V30 | `version-awareness/v30-boolean.yaml` | Valid 3.2 true/false schemas |
| V31 | `version-awareness/v31-unknown-{3.1.2,3.2.0}.yaml` | Valid arbitrary schema keyword |
| V32 | `version-awareness/v32-unknown-3.0.4.yaml` | Invalid OAS 3.0 ordinary keyword control; CON-002 evidence |
| MF | `multi-file/openapi.yaml` → `schemas/external.yaml`, target `/required` | Invalid structure physically in referenced file |
| MULTI | `multi-error/multiple.yaml` | Missing info, path-required false, empty responses, duplicate operation ID |

The machine-readable oracle records exact version, validity, violation class, rule target, expected pointer, expected physical document, and control type for all 45 evaluation rows. There are 46 files because MF has an entry and target file.

## 5. Per-fixture diagnostic accuracy

`TP/TN/FP/FN` measure correctness; `NOT_SUPPORTED` is a capability result, not a false positive. IBM rejects every 3.2 input before validation.

| Fixture | Expected | Scalar | Redocly | IBM |
| --- | --- | --- | --- | --- |
| V1-3.0.4 | valid | TN | TN | TN |
| V1-3.1.2 | valid | TN | TN | TN |
| V1-3.2.0 | valid | TN | TN | NOT_SUPPORTED |
| V2-3.0.4 | invalid | TP | TP | TP |
| V2-3.1.2 | invalid | TP | TP | TP |
| V2-3.2.0 | invalid | TP | TP | NOT_SUPPORTED |
| V3-title | invalid | TP | TP | TP |
| V3-version | invalid | FN | TP | TP |
| V4-3.0 | invalid | TP | TP | TP |
| V4-3.1.2 | valid | TN | TN | TN |
| V4-3.2.0 | valid | TN | TN | NOT_SUPPORTED |
| V5 | invalid | TP | FN | TP |
| V6 | invalid | TP | FN | TP |
| V7 | invalid | TP | FN | TP |
| V8 | invalid | TP | FN | TP |
| V9 | invalid | TP | TP | TP |
| V10 | invalid | TP | FN | TP |
| V11 | invalid | FN | FN | FN |
| V12 | valid | TN | TN | TN |
| V13 | invalid | TP | FN | TP |
| V14 | invalid | TP | FN | TP |
| V15 | valid | TN | TN | TN |
| V16-3.0.4 | invalid | TP | FN | TP |
| V16-3.1.2 | invalid | TP | FN | TP |
| V16-3.2.0 | invalid | TP | FN | NOT_SUPPORTED |
| V17 | invalid | TP | TP | TP |
| V18-3.1.2 | valid | TN | TN | TN |
| V18-3.2.0 | valid | TN | TN | NOT_SUPPORTED |
| V19 | invalid | TP | TP | TP |
| V20 | invalid | TP | TP | TP |
| V21 | valid | TN | FP | NOT_SUPPORTED |
| V22 | invalid | FN | FN | TP |
| V23 | valid | TN | TN | TN |
| V24 | invalid | FN | FN | FN |
| V25 | valid | TN | TN | TN |
| V26 | valid | TN | TN | NOT_SUPPORTED |
| V27 | valid | TN | TN | NOT_SUPPORTED |
| V28 | valid | TN | TN | NOT_SUPPORTED |
| V29 | valid | TN | FP | TN |
| V30 | valid | TN | FP | NOT_SUPPORTED |
| V31-3.1.2 | valid | TN | FP | TN |
| V31-3.2.0 | valid | TN | FP | NOT_SUPPORTED |
| V32 | invalid | TP | TP | TP |
| MF | invalid | FN | TP | FN |
| MULTI | invalid | TP | TP | TP |

| Measure | Scalar | Redocly | IBM |
| --- | ---: | ---: | ---: |
| TP | 21 | 13 | 21 |
| TN | 19 | 14 | 10 |
| FP | 0 | 5 | 0 |
| FN | 5 | 13 | 3 |
| NOT_SUPPORTED | 0 | 0 | 11 |
| FP rate over applicable valid controls | 0% | 26.32% | 0% |
| FN rate over applicable invalid cases | 19.23% | 50.00% | 12.50% |

Applicable rate denominators exclude every row classified `NOT_SUPPORTED`: Scalar uses 19 valid and 26 invalid rows; Redocly uses 19 valid and 26 invalid rows; IBM uses 10 valid and 24 invalid rows. Thus IBM's FN rate is `3 / 24 = 12.50%`. Raw counts remain authoritative. The multi-error document is one fixture-level classification; raw output permits cascade/order inspection and is not miscounted as multiple independent TPs.

## 6. Findings by feature and version

- Root: all detect missing `info` and title. Scalar misses missing `info.version`; all detect the invalid 3.0 missing-`paths` control and accept 3.1 components-only. IBM rejects 3.2 before validation.
- Parameters: Scalar detects template, required, and schema/content cases except duplicate identity. IBM does likewise. Redocly `struct` detects only the neither-schema/content case in this group. All accept the valid override.
- References: Scalar detects unresolved references but raw `validate(source)` cannot load the valid local target, so its MF unresolved-file message is unrelated and correctly scored FN. Redocly misses V13/V14 but loads MF and reports its target at the target file/pointer. IBM detects V13/V14 but misses MF. All accept recursion.
- Responses: Scalar detects empty responses, 3.0 missing responses, and 3.0/3.1 missing descriptions while accepting later omission controls. Redocly misses empty objects, correctly enforces 3.0 missing responses, but wrongly requires description in 3.2. IBM behaves correctly for applicable 3.0/3.1 rows.
- Operations/security: only IBM detects duplicate `operationId`; all preserve case-sensitive control behavior. None detects the undeclared security scheme with the narrow conformance configurations.
- 3.2: Scalar accepts all valid controls and version semantics. Redocly accepts `query`, `additionalOperations`, and `querystring`, but incorrectly rejects 3.2 Response description omission, boolean schemas, and unknown keywords. IBM explicitly reports that only 3.0.x/3.1.x are supported: `REJECTED_AS_UNSUPPORTED`, not 3.2 validation.
- Schema controls: Scalar accepts 3.1/3.2 booleans and unknown keywords and diagnoses the 3.0 control. Redocly repeats SPIKE-005's validation-adjacent false positives despite preservation. IBM accepts applicable 3.1 controls.

## 7. Diagnostics, identity, severity, and source evidence

Scalar emits messages, occasional codes (`INVALID_REFERENCE`, `EXTERNAL_REFERENCE_NOT_FOUND`), and sometimes paths, but no candidate severity, physical file, line, or column. Mapping is structured for CON-004/005/006/008/009, direct-code for CON-003, mixed/message-only for CON-002, and not detected for CON-007/010 and CNS-001. Source correlation is `AMBIGUOUS` when a path exists and `NOT_CORRELATABLE` otherwise; SourceIndex cannot recover a referenced target violation from an unrelated load failure.

Redocly emits `ruleId=struct`, severity, absolute physical file, pointer, and usually line/column. Its broad rule ID is stable but not itself an OAIT concept; deterministic mappings need version plus structured location/classification. It directly attributes MF to `fixtures/multi-file/schemas/external.yaml` at `/required`. Source correlation is `DIRECT`, including referenced files.

IBM JSON emits Spectral rule names such as `oas3-schema`, messages, object paths, and line numbers. The single-file output commonly omits a physical `source` and column, so it is `AMBIGUOUS`/SourceIndex-adaptable only with invocation context; MF was not detected. It has strong direct rule identity but that identity is broad. CLI output is machine-readable; programmatic use is `NOT_SUPPORTED` without an undocumented internal import.

Candidate severities are recorded exactly where emitted. OAIT can and should discard them and apply its own severity. Full English-message equality is never considered a safe mapping.

## 8. OAIT rule-mapping evidence

| OAIT target | Scalar | Redocly | IBM | Architecture result |
| --- | --- | --- | --- | --- |
| CON-002 | STRUCTURED / MESSAGE_HEURISTIC_ONLY; one FN | DIRECT_CODE (`struct`), accurate applicable cases | DIRECT_CODE (`oas3-schema`), 3.2 N/S | Adapter classification plus OAIT version logic |
| CON-003 | DIRECT_CODE | NOT_DETECTED | DIRECT_CODE | Scalar/IBM evidence usable; OAIT source resolution still authoritative |
| CON-004 | STRUCTURED_CLASSIFICATION | NOT_DETECTED | DIRECT_CODE | External evidence possible; deterministic OAIT rule remains prudent |
| CON-005 | STRUCTURED_CLASSIFICATION | NOT_DETECTED | DIRECT_CODE | Same |
| CON-006 | STRUCTURED_CLASSIFICATION | mixed detected/not detected | DIRECT_CODE | Same |
| CON-007 | NOT_DETECTED | NOT_DETECTED | NOT_DETECTED | OAIT-owned deterministic evaluation required |
| CON-008 | STRUCTURED_CLASSIFICATION | NOT_DETECTED | DIRECT_CODE for supported versions | Composite/OAIT-owned coverage required |
| CON-009 | STRUCTURED_CLASSIFICATION | DIRECT_CODE | DIRECT_CODE | Safely adaptable with explicit 3.0 applicability |
| CON-010 | NOT_DETECTED | NOT_DETECTED | NOT_DETECTED | OAIT-owned deterministic evaluation required |
| CNS-001 | NOT_DETECTED | NOT_DETECTED | DIRECT_CODE | IBM evidence useful; OAIT-owned fallback required |

External rule IDs must never become public OAIT rule IDs. Candidate types remain confined to a validator adapter; candidate replacement need not change OAIT IDs. CON-007 and CON-010 definitely require OAIT-owned checks in this corpus; CNS-001 requires one unless IBM participates. Other mappings need version-aware adapters and fallback coverage.

## 9. Complete candidate comparison

| Capability | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| OAS 3.0 validation | PASS | PARTIAL | PARTIAL |
| OAS 3.1 validation | PARTIAL | PARTIAL | PARTIAL |
| OAS 3.2 validation | PASS | PARTIAL | NOT_SUPPORTED |
| Missing root | PASS | PASS | PASS |
| Missing path parameter | PASS | FAIL | PASS |
| Path required | PASS | FAIL | PASS |
| Parameter schema/content | PASS | PARTIAL | PASS |
| Duplicate parameter identity | FAIL | FAIL | FAIL |
| Internal unresolved ref | PASS | FAIL | PASS |
| Missing external file | PASS | FAIL | PASS |
| Empty Responses Object | PASS | FAIL | PASS applicable |
| 3.0 missing responses | PASS | PASS | PASS |
| Response-description awareness | PASS | FAIL | PASS applicable |
| Duplicate operationId | FAIL | FAIL | PASS |
| Security reference | FAIL | FAIL | FAIL |
| 3.2 QUERY control | PASS | PASS | NOT_SUPPORTED |
| 3.2 additionalOperations | PASS | PASS | NOT_SUPPORTED |
| 3.2 querystring | PASS | PASS | NOT_SUPPORTED |
| Boolean control | PASS | FAIL | PASS 3.1 / N/S 3.2 |
| Unknown-keyword control | PASS | FAIL | PASS 3.1 / N/S 3.2 |
| Machine-readable code | PARTIAL | PASS | PASS |
| Severity | NOT_AVAILABLE | PASS | PASS |
| Pointer/object path | PARTIAL | PASS | PASS/PARTIAL |
| File attribution | NOT_AVAILABLE | PASS | PARTIAL |
| Line/column | NOT_AVAILABLE | PASS | line PARTIAL, column absent |
| Multi-file attribution | FAIL | PASS | FAIL |
| OAIT rule mapping | PARTIAL | PARTIAL | PARTIAL |
| Public API suitability | PASS programmatic | PASS programmatic | PASS CLI / N/S programmatic |

## 10. Mandatory validator gates and viability

| Gate | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| VG-01 OAS 3.0 | PASS | PARTIAL | PARTIAL |
| VG-02 OAS 3.1 | PARTIAL | PARTIAL | PARTIAL |
| VG-03 OAS 3.2 strategy | PASS | PARTIAL | PARTIAL |
| VG-04 core detection | PARTIAL | PARTIAL | PARTIAL |
| VG-05 false-positive safety | PASS | PARTIAL | PASS |
| VG-06 machine-readable | PASS | PASS | PASS |
| VG-07 classification | PARTIAL | PASS | PASS |
| VG-08 source correlation | PARTIAL | PASS | PARTIAL |
| VG-09 multi-file strategy | PARTIAL | PASS | PARTIAL |
| VG-10 OAIT mapping | PARTIAL | PARTIAL | PARTIAL |
| VG-11 public interface | PASS | PASS | PASS |
| VG-12 non-mutating | PASS | PASS | PASS |
| Viability | COMPOSITE_ROLE_VIABLE | COMPOSITE_ROLE_VIABLE | COMPOSITE_ROLE_VIABLE |

No candidate is `SOLE_VALIDATOR_VIABLE` on this corpus. None is `NOT_VIABLE`: each supplies useful, distinct evidence in a composite role.

Redocly VG-10 is `PARTIAL`: diagnostics it does detect are structurally adaptable without leaking candidate IDs, but representative mapping coverage is incomplete because CON-003, CON-004, CON-005, CON-007, CON-008, CON-010, and CNS-001 violations were not detected.

## 11. Unexpected behavior, limitations, and result provenance

- Scalar's high detection accuracy comes with sparse identity/location evidence and misses info version, duplicate parameters, duplicate operation IDs, security resolution, and the actual MF violation.
- Redocly has the best native source evidence but `struct` has many semantic FNs and the known boolean/unknown-keyword false positives, plus a new 3.2 Response-description false positive.
- IBM's OAS ruleset has the best applicable structured detection breadth, yet misses duplicate parameters, security resolution, and MF; it is CLI-only here and explicitly rejects OAS 3.2.
- The corpus is representative, not a complete OAS conformance suite. Only macOS arm64/Node 24 was run. Message quality was assessed by retained structured evidence, not aesthetic prose scoring.
- A network-backed `npm audit --json` on 2026-08-10 reproduced eight high-severity transitive-dependency audit findings in the pinned graph, surfaced through the IBM/Spectral dependency chain. These are time-sensitive advisory results rather than immutable fixture evidence. No candidate version was upgraded and no `npm audit fix` or automatic remediation was performed because SPIKE-006 preserves exact baselines. Dependency/security operational suitability belongs in SPIKE-007.
- Result JSON includes full oracle, raw and normalized diagnostics, fixture hashes, repeat determinism, TP/TN/FP/FN, location/correlation, mappings, version behavior, gates, limitations, and internal hashes.

Final whole-file hashes after verification:

```text
scalar.json  9245a6c0ef80e6cc4221b73d38a1ab68113585ba0f79be9e91a12785bad09219
redocly.json 4d450c671c1eaa14749b845a152f44d6990e445a69db0b4159eb427ddda8f1d9
ibm.json     9ce30864ffadf58f16a5c892edc8536788cd2e5556b584c273397fd3d8a07894
```

## 12. Architecture implications, continuation, ADR, and follow-up

1. Parsing and validation should remain independent adapter boundaries; one library cannot safely be assumed to cover both roles.
2. Scalar produced the best fixture-level applicable accuracy and zero false positives; IBM produced the broadest code-bearing applicable diagnostics; Redocly produced the best source locations. These are different strengths, not a final selection.
3. OAIT should use a hybrid: external validator evidence plus OAIT-owned deterministic conformance rules. Source processing and SourceIndex remain authoritative.
4. Multi-file diagnostics must retain target physical document and original pointer. When a candidate supplies only an entry path/object path, OAIT may correlate through SourceIndex only if deterministic; it must not relabel an unrelated reference-load error.
5. OAIT must own severity, mappings, duplicate suppression, applicability, and stable rule identity. CON-007 and CON-010 require OAIT-owned evaluation; CNS-001 needs fallback coverage; other mappings remain candidate-adapter evidence.
6. IBM can participate in a bounded 3.0/3.1 CLI-evidence role only if a later architecture decision permits subprocess integration; it cannot supply 3.2 validation at this baseline.
7. The evidence supports a future ADR for the hybrid validator boundary after SPIKE-007/summary, but this spike does not create it. No current ADR or rule-catalog factual correction was identified.

All three candidates should continue to SPIKE-007 in their evidenced composite roles. This is not a final production parser or validator selection.
