# SPIKE-002: Reference Resolution and Multi-File Behavior

## 1. Objective

Evaluate whether `@scalar/openapi-parser@0.28.10` and `@redocly/openapi-core@2.40.0` resolve internal, external, nested, shared, recursive, invalid, remote, and filesystem-boundary references while retaining enough evidence for OAIT reference provenance. This remains isolated experimental code and makes no production parser selection.

## 2. Environment

- Date: 2026-08-09
- OS: Darwin 25.5.0 arm64
- Node.js: `v24.18.0`
- npm: `11.16.0`
- TypeScript: `5.9.2`
- Module mode: ESM / TypeScript NodeNext

Exact direct versions are pinned in `package.json`; the complete dependency graph is locked by `package-lock.json`. As in SPIKE-001, experiment source compiles with `skipLibCheck: true`; the previously recorded dependency-declaration failures remain.

## 3. Candidate versions

| Package | Exact installed version | Role |
| --- | ---: | --- |
| `@scalar/openapi-parser` | `0.28.10` | Scalar dereferencing |
| `@scalar/json-magic` | `0.12.19` | Scalar-documented bundling and loader plugins; exact parser transitive version also pinned directly for reproducibility |
| `@redocly/openapi-core` | `2.40.0` | Redocly bundling and dereferencing |
| `typescript` | `5.9.2` | Compiler |
| `tsx` | `4.20.4` | TypeScript runtime loader |
| `@types/node` | `24.3.0` | Node.js types |

## 4. Fixture architecture

```text
fixtures/
├── internal/openapi.yaml
├── multi-file/openapi.yaml → schemas/Pet.yaml
├── nested/openapi.yaml → schemas/models.yaml#/Pet → common.yaml#/Identifier
├── shared-target/openapi.yaml ⇉ schemas/Pet.yaml
├── recursive/openapi.yaml → schemas/Node.yaml ↻
├── unresolved/openapi.yaml
├── unresolved/missing-file.yaml → absent schemas/Missing.yaml
├── invalid-pointer/openapi.yaml → existing models.yaml#/DoesNotExist
├── remote/openapi.yaml → http://127.0.0.1:<dynamic-port>/RemotePet.yaml
└── filesystem-boundary/project/openapi.yaml → ../outside.yaml
```

The HTTP server binds only to `127.0.0.1` on an operating-system-assigned port, serves one controlled fixture, counts requests, and is closed by the experiment. The filesystem escape target is a harmless fixture inside the spike directory but outside the intended `project/` root.

SHA-256 hashes for every fixture are embedded in both machine-readable result files under `mutation.beforeHashes` and `mutation.afterHashes`. They matched exactly after each candidate run.

## 5. Commands executed

From `experiments/parser-validator-spike/spike-002/`:

```bash
node --version
npm --version
uname -srm
npm install
npm run typecheck
npm run run:scalar
npm run run:redocly
npm ls --depth=0
shasum -a 256 results/*.json
find fixtures -type f -print0 | sort -z | xargs -0 shasum -a 256
```

The localhost runs require permission to bind a loopback socket. Reproduce after checkout with:

```bash
npm ci
npm run run
```

Final result hashes from this execution:

```text
scalar.json   1ebbe5f07baae1020912a8389dce9c476162b1a92297e7362eb22be33b693b5a
redocly.json  b279acc36abee7119afd799a5bb262e355aec6947562e516b7d9c24d875ca285
```

## 6. Candidate APIs used

Scalar used the documented `dereference()` API. Following Scalar's parser README for external files, it also used documented `@scalar/json-magic` APIs: `bundle()`, `readFiles()`, `fetchUrls()`, `parseYaml()`, `urlMap`, lifecycle hooks, and the public `LoaderPlugin` contract. No `sanitize()`, `upgrade()`, internal import, or private API was used.

Redocly used only APIs documented as safe in the package README: `createConfig({})`, `bundle({ ref, config, dereference? })`, and `bundleFromString({ source, absoluteRef, config })`. The optional `externalRefResolver` argument was not used because the safe API documentation does not document an implementation contract for a network-denying or root-constraining resolver.

## 7. Complete test matrix

| Capability | Scalar 0.28.10 | Redocly 2.40.0 |
| --- | --- | --- |
| Internal `$ref` | PASS | PASS |
| External local `$ref` | PARTIAL | PARTIAL |
| External `$ref` + pointer | PARTIAL | PARTIAL |
| Nested references | PARTIAL | PARTIAL |
| Shared target | PARTIAL | PARTIAL |
| Recursive reference | PASS | PASS |
| Missing internal target | PASS | PASS |
| Missing file | PASS | PASS |
| Invalid pointer | PASS | PASS |
| Remote resolution enabled | PASS | PASS |
| Remote resolution disabled | PASS | NOT_SUPPORTED |
| Raw `$ref` preservation | PARTIAL | PARTIAL |
| Declaration document | PARTIAL | PARTIAL |
| Target document | PASS | PARTIAL |
| Reference-chain evidence | PARTIAL | PARTIAL |
| Network control | PASS | NOT_SUPPORTED |
| Filesystem boundary control | PASS | NOT_SUPPORTED |
| Documented API only | PASS | PASS |

`PARTIAL` means resolution worked but provenance was incomplete or transformed. `NOT_SUPPORTED` means the required control was not exposed by the documented safe public API. There were no claimed-capability `FAIL` results.

## 8. Provenance observations

Scalar bundles external resources into `x-ext`, rewrites external references to internal `#/x-ext/<hash>...` pointers, and—when `urlMap: true` is requested—adds `x-ext-urls`, mapping each hash to a normalized source resource. This provides strong target-document evidence. Lifecycle traversal exposed raw references and a declaration path, but nested paths were bundle-relative and one observed nested path contained `[object Object]`; neither the event nor bundled reference directly attached its physical declaration document. Full ordered `ReferenceHop[]` therefore still requires OAIT to scan original source documents before bundling and correlate them with the URL map.

Redocly moves referenced schemas into root `components`, chooses or deduplicates component names, and rewrites references to those components. `fileDependencies` identifies all loaded physical resources, but it is a flat set: it does not map an individual declaration to its target, preserve the original fragment, or expose an ordered chain. Original-source scanning is required before bundling.

For shared targets, both candidates load the external target once and point both logical uses at it. Neither bundled representation retains two independently attributable declaration records. OAIT must collect declaration provenance before bundling/dereferencing.

## 9. Recursive-reference observations

Both candidates terminated safely.

- Scalar bundling retained a recursive internal `$ref` under `x-ext`. Scalar dereferencing terminated and produced a cyclic JavaScript object graph.
- Redocly default bundling retained a recursive internal reference. `dereference: true` terminated and produced a cyclic JavaScript object graph.

Consequently, bundled/reference-preserving representations are safer for serialization and analysis. Any dereferenced representation must be handled by cycle-aware traversal and must never be naïvely passed to `JSON.stringify`.

## 10. Error behavior

Scalar bundling alone did not validate unresolved internal pointers. Following it with documented `dereference()` returned structured errors while retaining a partial schema:

- Missing internal target: `INVALID_REFERENCE`.
- Missing file: `EXTERNAL_REFERENCE_NOT_FOUND`.
- Invalid external fragment: `INVALID_REFERENCE` after the resource was bundled.

The bundler also wrote human-readable missing-loader/file messages to stderr. Its structured dereference errors did not include a declaration pointer or source file.

Redocly returned `NormalizedProblem` entries with `ruleId: "bundler"`, severity, declaration-source absolute path, and declaration pointer. Missing-file messages include the failed physical path. It distinguished a missing resource through `ENOENT`, although missing internal targets and invalid fragments shared the generic message `Can't resolve $ref`.

## 11. Bundling and dereferencing behavior

The representations are not interchangeable:

| Candidate | Parsed | Bundled | Dereferenced |
| --- | --- | --- | --- |
| Scalar | Loader plugins parse YAML/JSON while loading | External resources copied under `x-ext`; external refs rewritten; optional URL map retained | References replaced; recursion creates cycles |
| Redocly | No parser-only safe API tested; `bundle.parsed` is already bundled | External schemas moved/deduplicated in root components; refs rewritten; file list retained | `dereference: true` replaces refs; recursion creates cycles |

Neither candidate modified source files; hashes before and after were identical. Both materially transformed returned bundled representations.

## 12. Network behavior

Scalar performs remote retrieval only when the documented `fetchUrls()` loader plugin is supplied. The enabled test made exactly one request. Omitting that plugin made zero requests, retained the reference, and triggered the documented resolution-error hook. This provides a clear allow-list control model; a custom fetch implementation can add tighter policy if needed.

Redocly default bundling automatically fetched the localhost resource and made exactly one request. The documented safe API does not specify a supported network-disable option or a contract for implementing a deny resolver. Remote-disable and network-control capabilities are therefore `NOT_SUPPORTED` for this spike, rather than being simulated through undocumented internals.

## 13. Filesystem-control behavior

Both default filesystem loaders followed `../outside.yaml`, escaping the intended fixture project root.

Scalar's documented custom `LoaderPlugin` contract allowed a wrapper around `readFiles()` to reject paths outside an allowed absolute root. The controlled run retained the unresolved reference and reported resolution failure, so filesystem boundary control is `PASS`, although OAIT must implement the policy.

Redocly's safe documented API offers no allowed-root option. Its default resolver loaded the outside fixture and listed it as a dependency. Filesystem boundary control is `NOT_SUPPORTED`; an OAIT-owned preloader/source boundary would be required.

## 14. Unexpected behavior

- Scalar's lifecycle declaration path for a nested bundled node included `[object Object]`, so hook paths cannot be assumed to be canonical JSON Pointers without further SPIKE-003 investigation.
- Scalar reports missing external loaders/files to stderr in addition to returning structured dereference errors.
- Redocly diagnostics retained substantially better declaration-source evidence than its successful bundle representation.
- Both dereferencers create cyclic JavaScript graphs for the recursive fixture.
- The authoritative `SPIKE-002-reference-resolution.md` ends with a stray `ß` after the final guiding principle. It was left unchanged as user-owned architecture text.

## 15. Limitations

- Exact line/column evidence is deferred to SPIKE-003.
- The experiment does not establish schema-dialect correctness or OpenAPI 3.2 operation behavior.
- Scalar provenance is strongest when `urlMap` and pre-bundle source scanning are combined; neither alone gives the complete conceptual `ReferenceOrigin`.
- Redocly's successful bundle output does not provide per-reference target mapping, network deny control, or a filesystem allowed-root control through the documented safe API.
- `skipLibCheck: true` remains necessary for this isolated NodeNext experiment due to dependency declaration issues recorded in SPIKE-001.
- Dynamic localhost ports are normalized to `<dynamic-port>` in machine-readable output so result hashes remain reproducible.

## 16. Architecture implications

Neither candidate alone satisfies the critical provenance gate from only its final bundled/dereferenced representation. OAIT should introduce an owned source-loading and reference-evidence layer that:

1. loads only approved filesystem roots and explicitly allowed network schemes/hosts;
2. records every raw `$ref`, declaration document, and declaration pointer before transformation;
3. resolves the resource URI and fragment into explicit target-document/target-pointer fields;
4. records ordered hops and failures independently of candidate diagnostics;
5. passes controlled source content to the selected parser/bundler;
6. retains both original-source handles and the candidate's bundled representation;
7. avoids full dereferencing as the canonical analysis representation, especially for recursive schemas.

Scalar's plugin allow-list and URL map could participate directly in this layer. Redocly should receive already policy-approved inputs or an OAIT-controlled resource graph; relying on its default resolver would violate the local-first boundary requirement.

## 17. Continue to SPIKE-003?

- Scalar `0.28.10`: **Yes.** It resolves all tested reference shapes, diagnoses failures when bundle and dereference are composed, handles recursion, exposes useful URL mappings/hooks, and supports documented network/filesystem controls. SPIKE-003 must verify whether canonical file/pointer/line/column evidence can be obtained reliably, especially given the anomalous nested hook path.
- Redocly `2.40.0`: **Yes, with explicit security/provenance caveats.** It resolves all tested shapes and provides strong error-location evidence, but successful bundling loses per-reference provenance and its documented safe API lacks network-deny and allowed-root controls. SPIKE-003 should measure whether its source/location objects can support an OAIT-owned evidence layer without depending on undocumented interfaces.

## 18. Production recommendation

No final production parser recommendation is made. Both candidates proceed to SPIKE-003 for source-location evidence; later spikes and an explicit architecture/technology decision remain required.
