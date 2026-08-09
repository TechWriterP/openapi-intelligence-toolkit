# SPIKE-LOC-001: Source-Location Technology

## 1. Objective

This isolated experiment selects a source-preserving YAML/JSON technology strategy for a future OAIT-owned source-location index. It does not implement a production loader, normalized domain model, reference resolver, rules, CLI, AI, or MCP feature. The experiment follows ADR-004: candidate trees provide evidence, while OAIT owns document identity, RFC 6901 serialization, and the neutral index.

## 2. Exact environment

Executed 2026-08-09 on macOS Darwin 25.5.0, arm64, Node.js v24.18.0, npm 11.16.0, TypeScript 5.9.2, ESM, `module`/`moduleResolution` `NodeNext`, and `skipLibCheck: false`. Only macOS arm64 was executed; Linux and Windows findings are feasibility assessments.

## 3. Exact dependency versions

| Package | Version | License | Role |
| --- | ---: | --- | --- |
| `yaml` | 2.8.3 | ISC | Strategies A/B YAML; Strategy A JSON |
| `jsonc-parser` | 3.3.1 | MIT | Strategy B strict JSON tree |
| `tree-sitter` | 0.21.1 | MIT | Strategy C native runtime |
| `@tree-sitter-grammars/tree-sitter-yaml` | 0.6.1 | MIT | Strategy C YAML grammar |
| `tree-sitter-json` | 0.24.8 | MIT | Strategy C JSON grammar |
| `typescript` | 5.9.2 | Apache-2.0 | Experiment compiler |
| `tsx` | 4.20.4 | MIT | Experiment runner |
| `@types/node` | 24.3.0 | MIT | Node declarations |

Versions are exact in `package.json` and `package-lock.json`. Published peer metadata established the Tree-sitter intersection before installation: YAML grammar 0.6.1 and JSON grammar 0.24.8 both accept runtime 0.21.1. The then-latest YAML grammar 0.7.1 required `tree-sitter ^0.22.4`, which did not intersect JSON grammar 0.24.8's `^0.21.1`; no forced unsupported combination was used.

## 4. Candidate strategies

- **A:** `yaml@2.8.3` for YAML and JSON. Strict `.json` acceptance is checked independently with the public Node `JSON.parse` API because the YAML grammar accepts JSON-incompatible YAML forms.
- **B:** `yaml@2.8.3` for YAML and `jsonc-parser@3.3.1` with comments disallowed, trailing commas disallowed, and empty input disallowed.
- **C:** Tree-sitter runtime 0.21.1 with YAML grammar 0.6.1 and JSON grammar 0.24.8. It uses the documented parser callback input API and an OAIT experimental structural walker.

Public APIs used were `yaml`'s `parseDocument`, `parseAllDocuments`, `LineCounter`, node `range`, and node guards; `jsonc-parser`'s `parseTree`, nodes, offsets/lengths, and structured parse errors; and Tree-sitter's `Parser`, `setLanguage`, `parse`, `Tree.rootNode`, and documented `SyntaxNode` traversal/location fields. No private import was required.

## 5. Commands executed

```bash
node --version
npm --version
curl -L https://unpkg.com/tree-sitter-json@0.24.8/package.json
curl -L https://registry.npmjs.org/@tree-sitter-grammars%2ftree-sitter-yaml
npm install
npm ls --all
npm run typecheck
npm run run:a
npm run run:b
npm run run:c
npm run run
shasum -a 256 results/*.json
git status --short --branch
```

Clean reproduction:

```bash
cd experiments/source-location-technology-spike/spike-loc-001
npm ci
npm run run
```

The run performs one warm-up and three measured samples for every benchmark point. Generated fixtures are deterministic and are not persisted.

## 6. Fixture inventory

The 27 persisted fixtures cover equivalent representative YAML/JSON (24 independently established structural expectations, including exact anchor positions), arrays, RFC 6901 `/` and `~` escaping, five duplicate scalar values, duplicate mapping keys, anchors/aliases, flow collections, block scalars, comments, quoting and special keys, Unicode, LF/CRLF, UTF-8 BOM, four malformed YAML forms, six malformed JSON forms, a YAML multi-document stream, whitespace variants, key reordering, and a three-file OpenAPI graph with `$ref` declarations.

Every fixture SHA-256 is embedded in each result as `fixtureHashesBefore` and `fixtureHashesAfter`. The maps are identical for every strategy. This both preserves complete provenance and proves source immutability.

## 7. Complete result matrix

| Capability | Strategy A | Strategy B | Strategy C |
| --- | --- | --- | --- |
| YAML exact ranges | PASS | PASS | PASS |
| JSON exact ranges | PASS | PASS | PASS |
| YAML line/column | PASS | PASS | PASS |
| JSON line/column | PASS | PASS | PASS |
| RFC 6901 pointer construction | PASS | PASS | PASS |
| Arrays | PASS | PASS | PASS |
| Escaped keys | PASS | PASS | PASS |
| Duplicate scalar values | PASS | PASS | PASS |
| Duplicate mapping keys | PARTIAL | PARTIAL | PARTIAL |
| YAML anchors | PARTIAL | PARTIAL | PARTIAL |
| YAML aliases | PARTIAL | PARTIAL | PARTIAL |
| Comments | PASS | PASS | PASS |
| Flow collections | PASS | PASS | PASS |
| Block scalars | PASS | PASS | PASS |
| Unicode positions | PASS | PASS | PASS |
| CRLF | PASS | PASS | PASS |
| BOM | PASS | PASS | PARTIAL |
| Malformed YAML recovery | PARTIAL | PARTIAL | PARTIAL |
| Malformed JSON recovery | PARTIAL | PARTIAL | PARTIAL |
| Strict JSON enforcement | PASS | PASS | FAIL |
| Multi-document YAML detection | PASS | PASS | PASS |
| Source immutability | PASS | PASS | PASS |
| TypeScript integration | PASS | PASS | PASS |
| ESM / NodeNext | PASS | PASS | PASS |
| Cross-platform suitability | PASS | PASS | PARTIAL |
| Native dependency required | NOT_APPLICABLE | NOT_APPLICABLE | PARTIAL |
| Public APIs only | PASS | PASS | PASS |

`PARTIAL` for duplicate keys means both physical declarations remain indexable at distinct ranges, but an OAIT-owned duplicate-aware representation/report is needed because canonical JSON Pointer alone cannot uniquely identify two declarations with the same structural key. YAML reports `DUPLICATE_KEY`; `jsonc-parser` and Tree-sitter retained both occurrences but did not diagnose semantic duplication. Anchors and aliases remain physical syntax nodes, but the current neutral index needs explicit node-kind metadata to distinguish an alias occurrence from its anchor target. They must not be treated as OpenAPI `$ref` provenance.

## 8. Malformed-input comparison

| Input | A | B | C |
| --- | --- | --- | --- |
| Invalid YAML indentation | PARTIAL_RECOVERY; sibling yes | same | PARTIAL_RECOVERY; sibling no |
| YAML unterminated quote | PARTIAL_RECOVERY; sibling no | same | PARTIAL_RECOVERY; sibling yes |
| Broken YAML flow | PARTIAL_RECOVERY; sibling yes | same | same |
| Invalid YAML mapping | PARTIAL_RECOVERY; sibling no | same | same |
| JSON missing comma | YAML tree reports no error; `JSON.parse` rejects | PARTIAL_RECOVERY; sibling yes | PARTIAL_RECOVERY; sibling yes |
| JSON missing brace | PARTIAL_RECOVERY; sibling yes | same | **FULL_RECOVERY/no diagnostic** |
| JSON unterminated string | PARTIAL_RECOVERY; sibling no | PARTIAL_RECOVERY; sibling no | same |
| JSON invalid literal | YAML tree reports no error; `JSON.parse` rejects | PARTIAL_RECOVERY; sibling yes | PARTIAL_RECOVERY; sibling no |
| JSON trailing comma | YAML tree reports no error; `JSON.parse` rejects | PARTIAL_RECOVERY; sibling yes | PARTIAL_RECOVERY; sibling yes |
| JSON comment | YAML tree reports no error; `JSON.parse` rejects | PARTIAL_RECOVERY; sibling yes | **FULL_RECOVERY/no diagnostic** |

All candidate diagnostics used structured offsets; line/column was native or derived from the original source. Human-readable messages were not parsed. Strategy A can enforce strict JSON acceptance, but its structural parser does not supply JSON diagnostics for several invalid JSON forms. Strategy C's grammar accepts a missing final brace and comments without error in these fixtures, so it cannot alone enforce strict JSON.

## 9. YAML-feature comparison

All walkers produced canonical pointers for block/flow mappings, block/flow sequences, quoted/special keys, multiline literal/folded scalars, comments, anchors, aliases, array indices, and escaped segments. Pointer identity remained stable across compact, expanded/commented, and reordered YAML while offsets and presentation positions changed. Multiple YAML documents were detected as two documents and can be rejected by OAIT. A source index must retain physical alias nodes and duplicate occurrences rather than relying on `toJS()`-style evaluated objects.

## 10. JSON comparison

All strategies produced the same logical pointers and exact source anchors for valid strict JSON. Strategy A's shared YAML walker is operationally simple but admits YAML semantics unless paired with strict JSON validation, and valid large JSON parsing was far slower than Strategy B. Strategy B preserved JSON ranges and exposed structured recovery errors under strict options. Strategy C preserved syntax ranges but its grammar is not a strict JSON validator for comments and one missing-brace case.

## 11. Unicode and position findings

`yaml` and `jsonc-parser` expose offsets in JavaScript UTF-16 code units. Tree-sitter exposes byte offsets and zero-based byte columns; the adapter deterministically converted them to UTF-16 offsets and one-based Unicode-code-point columns. The neutral experiment reports one-based line and code-point column consistently. ASCII, Japanese, accented Latin, emoji, and non-BMP characters were tested. This conversion policy must be explicit in production; storing the native range alongside normalized presentation coordinates is preferable.

LF and CRLF pointers were identical. Offsets differed consistently while line/column remained correct. `yaml` accepted the BOM and counted its source range. Tree-sitter exposed the BOM as syntax outside the semantic document, so acceptance worked but BOM accounting is `PARTIAL` and requires an explicit document-start policy.

## 12. Performance results

Median total milliseconds (p95 in parentheses), three samples after one warm-up:

| Operations | Format | A | B | C |
| ---: | --- | ---: | ---: | ---: |
| 500 | YAML | 19.445 (31.496) | 20.041 (25.213) | 38.886 (39.332) |
| 500 | JSON | 20.031 (21.618) | 3.186 (3.940) | 26.672 (27.625) |
| 2,000 | YAML | 89.013 (94.521) | 91.325 (105.164) | 157.875 (164.882) |
| 2,000 | JSON | 88.194 (88.298) | 10.849 (11.586) | 112.270 (120.820) |
| 10,000 | YAML | 1432.208 (1466.906) | 1435.038 (1443.479) | 844.417 (948.905) |
| 10,000 | JSON | 845.429 (852.562) | 55.165 (83.542) | 591.816 (601.781) |

Parse and index timings, input bytes, and indexed-entry counts are separated in the result JSON. At 10,000 operations all strategies indexed 60,006 entries. Strategy B's JSON median was about 15× faster than A and 11× faster than C. Tree-sitter was fastest for the largest YAML case but its OAIT walker cost and native operational burden reduce that advantage. These are directional single-machine results, not SLA certification.

## 13. Memory findings

The common method records `process.memoryUsage().heapUsed` delta around parse plus index. Median observed 10,000-operation deltas were approximately: A YAML 64.7 MB / JSON 124.9 MB; B YAML 76.5 MB / JSON 45.9 MB; C YAML 34.0 MB / JSON 27.6 MB. Some smaller samples recorded zero because garbage collection occurred between observations. Native Tree-sitter allocation is not fully represented by V8 heap. These figures are comparable directional evidence, not peak retained-size measurements.

## 14. Cross-platform and dependency findings

Strategies A/B are pure JavaScript at runtime. Strategy C uses native Node-API bindings, `node-gyp-build`, prebuild selection, and a larger platform/install surface. It installed and executed on macOS arm64. Linux and Windows are plausible from package metadata/prebuild conventions but were not executed; build-tool fallback remains a risk. A documented callback input was required because the 0.21.1 binding rejected direct string input at roughly 32 KiB (`Invalid argument`).

The complete experiment installation contains 15 packages in `npm ls --all`; `package-lock.json` is 21,278 bytes. Candidate runtime additions are small for A/B. Strategy C adds `node-addon-api` and `node-gyp-build`, plus two native grammar bindings. TypeScript compiled all strategies under the same strict NodeNext configuration with no candidate type leakage in persisted results.

## 15. License and security

Direct candidate licenses are ISC or MIT; no unresolved distribution blocker was identified (this is technical evidence, not legal advice). Parsers were used in data-only modes with no custom YAML tags or executable constructors. None evaluates arbitrary source code. Tree-sitter's native binaries expand supply-chain and memory-safety surface relative to pure JavaScript. No candidate reported an installed npm vulnerability during installation. Network/reference security is outside this spike.

## 16. Unexpected behavior

- Tree-sitter's compatible 0.21.1 binding rejected a direct source string around 32 KiB. The documented callback-input form worked at all benchmark sizes; no private API was used.
- Tree-sitter JSON did not diagnose a missing closing brace or a comment fixture.
- Strategy A's YAML parse tree accepted several invalid JSON forms, even though independent strict JSON validation rejected them.
- JSON duplicate keys remained physically visible in `jsonc-parser` and Tree-sitter but had no semantic duplicate diagnostic.
- Tree-sitter offsets/columns are UTF-8 byte based, unlike the JavaScript UTF-16 offsets of the pure-JS candidates.
- Latest Tree-sitter YAML and JSON grammar releases had incompatible runtime peer ranges; compatible exact older YAML metadata had to be selected deliberately.

## 17. Limitations

Only macOS arm64 and one Node release were executed. Benchmark sample count is three, memory is approximate, repository activity/issue health was reviewed only at package-metadata level, and no adversarial fuzzing was performed. The feasibility walkers intentionally omit production caching, duplicate occurrence IDs, alias-kind fields, diagnostic normalization, and file-URI policy. Multi-file documents were indexed individually; this spike did not resolve references. No human error string was converted into structured evidence.

## 18. Weighted decision matrix

Scores are 1–5 and use the authoritative weights (20/15/15/10/10/10/5/5/5/5). Full per-criterion scores are in each result.

| Strategy | Source | Malformed | YAML | JSON | Pointer | Perf. | TS | Ops | API | Lic./sec. | Weighted /100 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 5 | 4 | 5 | 3 | 5 | 4 | 5 | 5 | 5 | 5 | **91** |
| B | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **97** |
| C | 5 | 5 | 4 | 5 | 4 | 3 | 4 | 2 | 3 | 3 | **83** |

Strategy C's JSON score reflects valid-source fidelity; its strictness defect is separately explicit and materially affects selection. Numeric scores do not override gates.

## 19. Mandatory gates

All three strategies passed the 12 authoritative mandatory gates: YAML/JSON structural indexing, reliable original ranges, canonical pointer construction, arrays, escaping, duplicate scalar distinction, immutability, public APIs, interface isolation, no license blocker, and feasible installation. Strict JSON enforcement is not listed as a mandatory gate, but it is an architectural requirement for the selected combined strategy; Strategy C would need another strict validator.

## 20. Architecture implications

OAIT should own:

- source document identity and original source bytes/text;
- canonical RFC 6901 serialization from structural string/index segments;
- an occurrence-aware index (pointer alone cannot identify duplicate keys);
- one-based presentation line/column conversion and declared offset semantics;
- both full source ranges and presentation anchors;
- separate physical YAML alias evidence and OpenAPI `$ref` evidence;
- multi-document rejection and strict JSON policy;
- adapter isolation so parser tree types do not cross the boundary.

Recommended anchors are key start for mapping properties and `$ref` declarations, item value/node start for array items, and node start for roots; retain a full original-source range separately. In the multi-file fixtures, `/paths/~1pets/get/responses/200/content/application~1json/schema/$ref` belongs to the paths document, while `/Pet` (and descendants) belongs to the schema document. Resolution must link those records without replacing either original document pointer or location.

## 21. Production recommendation

**Select Strategy B: `yaml@2.8.3` for YAML plus `jsonc-parser@3.3.1` for JSON as the technology foundation to take into production design.** It passed every mandatory gate, achieved 97/100, preserved exact source evidence, enforced strict JSON with structured recovery, remained pure JavaScript and cross-platform, and was decisively faster for JSON. This is a source-location technology decision, not a final OpenAPI parser/validator selection.

Known limitations are partial malformed recovery, the need for an OAIT-owned duplicate-occurrence representation, explicit YAML alias handling, and OAIT-owned pointer/document identity. Dependency upgrades must re-run Unicode, range, malformed, duplicate, and performance fixtures. Strategy A remains a viable fallback but has weaker JSON semantics/diagnostics and much slower JSON. Strategy C should not be the primary source index: recovery advantages do not offset strict-JSON failure, native installation risk, peer-version coordination, callback-input anomaly, and added adapter complexity.

## 22. Follow-up actions

1. Propose a separate technology ADR for review; do not modify ADR-004.
2. Design the production `SourceDocumentRegistry`, occurrence-aware `SourceLocationIndex`, diagnostic adapter, and reference-evidence boundary around Strategy B only after acceptance.
3. Add CI validation on Linux and Windows before production adoption.
4. Expand fuzz/malformed and peak-memory testing during implementation planning.
5. Retain the exact fixtures as regression evidence and re-run them on every candidate upgrade.

## Result provenance

Result files include a `resultHash` over all preceding compact result fields. Whole-file SHA-256 after the final run:

| File | SHA-256 |
| --- | --- |
| `results/strategy-a.json` | `8c2c70f4d52fee3b3d8a19866f1e9c8257ea4c33a8853084f4815012d4459ecd` |
| `results/strategy-b.json` | `94cf6d804ea0c3eda95b58eea173580bc115a2445b7c565476be47969e05f96c` |
| `results/strategy-c.json` | `2422f4c3c3b032c5eb1610dfc6af7dfc8e61d87afaf7d8fcba216b042e345843` |

These whole-file hashes must be refreshed if results are re-executed because timestamps and measured evidence change.
