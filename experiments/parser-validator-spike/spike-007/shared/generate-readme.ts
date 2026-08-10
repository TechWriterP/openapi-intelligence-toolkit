import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import{join}from'node:path';import{root}from'./benchmark-runner.js';const read=async(n:string)=>JSON.parse(await readFile(join(root,'results',`${n}.json`),'utf8')),s=await read('scalar'),r=await read('redocly'),i=await read('ibm'),o=await read('operational-evidence');const f=(n:any)=>typeof n==='number'?n.toFixed(2):n??'—',mb=(n:any)=>typeof n==='number'?(n/1048576).toFixed(1):'N/A';
function matrix(name:string,x:any){const lines=[]as string[];for(const row of[...x.singleFileResults,...x.multiFileResults]){const base=[name,row.version,row.size,row.mode,row.stage,row.fixture.operationCount,row.fixture.byteSize];if(name==='IBM'){const t=row.totalCli.timing;lines.push(`| ${base.join(' | ')} | cold CLI | ${row.totalCli.measuredSampleCount} | ${f(t.min)} | ${f(t.median)} | ${f(t.mean)} | ${f(t.p95)} | ${f(t.max)} | ${f(t.stddev)} | N/A child RSS | ${row.nfr} |`)}else{for(const mode of['warm','cold']){const q=row[mode],t=q.timing;lines.push(`| ${base.join(' | ')} | ${mode} | ${q.measuredSampleCount} | ${f(t.min)} | ${f(t.median)} | ${f(t.mean)} | ${f(t.p95)} | ${f(t.max)} | ${f(t.stddev)} | ${mode==='warm'?mb(q.memory.observedMax.rss)+' MiB RSS':'N/A child RSS'} | ${row.nfr} |`)}}}return lines.join('\n')}
function scaling(name:string,x:any){const groups=name==='Scalar'?Object.entries(x.scaling):name==='Redocly'?Object.entries(x.scaling):[['cli',x.scaling]];return groups.flatMap(([stage,rows]:any)=>rows.map((q:any)=>`| ${name} | ${stage} | ${q.from}→${q.to} | ${f(q.operationRatio)} | ${f(q.durationRatio)} | ${f(q.memoryRatio)} | ${f(q.operationsPerSecond)} |`)).join('\n')}
function gates(){return Object.keys(s.mandatoryGates).map(k=>`| ${k.replace('OG','OG-')} | ${s.mandatoryGates[k].status} | ${r.mandatoryGates[k].status} | ${i.mandatoryGates[k].status} |`).join('\n')}
const hashes:any={};for(const n of['scalar','redocly','ibm'])hashes[n]=createHash('sha256').update(await readFile(join(root,'results',`${n}.json`))).digest('hex');const inv=s.singleFileResults.filter((x:any)=>x.stage==='load').map((x:any)=>x.fixture);const multi=s.multiFileResults.map((x:any)=>x.fixture);const large=(x:any,stage:string,version='3.1.2')=>x.singleFileResults.find((q:any)=>q.size==='large'&&q.stage===stage&&q.version===version);const sl=large(s,'load'),sv=large(s,'validate'),rb=large(r,'bundle'),rl=large(r,'lint'),ib=i.singleFileResults.find((q:any)=>q.size==='large'&&q.version==='3.1.2');
const scalarAll=[...s.singleFileResults,...s.multiFileResults],redoclyAll=[...r.singleFileResults,...r.multiFileResults],scalarMax=scalarAll.reduce((a:any,q:any)=>q.warm.memory.observedMax.rss>a.warm.memory.observedMax.rss?q:a),redoclyMax=redoclyAll.reduce((a:any,q:any)=>q.warm.memory.observedMax.rss>a.warm.memory.observedMax.rss?q:a),probe=await read('ibm-multifile-probe');const text=`# SPIKE-007: Performance and Operational Suitability

## 1. Objective and prior-spike constraints

Determine whether the pinned candidates are operationally reasonable in the roles established by SPIKE-001–006. Speed does not override semantic evidence: Scalar retains strong schema/runtime fidelity and sparse source diagnostics; Redocly retains strong source locations and known structural false positives/negatives; IBM remains CLI-only evidence for OAS 3.0/3.1 with OAS 3.2 NOT_SUPPORTED; ADR-004/005 keep source loading and identity OAIT-owned. No production adapter, cache, telemetry, CLI, or CI workflow was built.

## 2. Environment and exact versions

- ${o.capturedAt}; macOS ${o.environment.osVersion} (Darwin), arm64, Apple M4, ${o.environment.logicalCpuCount} logical CPUs, ${(o.environment.physicalMemoryBytes/1073741824).toFixed(0)} GiB RAM.
- Node ${o.environment.node}; npm ${o.environment.npm}; TypeScript ${o.versions.typescript}; power mode ${o.environment.powerMode}.
- Scalar parser ${o.versions['@scalar/openapi-parser']} / json-magic ${o.versions['@scalar/json-magic']}; Redocly ${o.versions['@redocly/openapi-core']}; IBM ${o.versions['ibm-openapi-validator']}.
- Local desktop invocation was noninteractive. Other applications, OS scheduling, filesystem caches, thermal state, and candidate execution order can affect timings; these are engineering observations, not laboratory-grade or universal SLAs.

## 3. Methodology and reproduction

Fixtures are deterministic YAML generated from code. Each operation has descriptions, query/header parameters, request bodies where applicable, two responses, reusable nested schemas, local refs, and API-key security. Single-file workloads contain 12, 100, and 500 operations. Multi-file medium/large equivalents shard paths and components without remote refs. Recursive controls retain a legal reference boundary. No candidate rewrites fixtures.

Warm in-process scenarios use one warm-up plus ten measured iterations in one loaded process. Cold Scalar/Redocly scenarios use three fresh Node processes and include module startup. IBM uses one warm-up plus ten measured CLI subprocess invocations; “warm IBM” is NOT_APPLICABLE. Durations use parent-side process.hrtime.bigint(). All raw samples are retained; no outliers were removed and GC was not forced. In-process memory records before, observed maximum after-sample values, after, and delta for RSS/heapUsed/heapTotal/external. IBM child peak RSS is NOT_AVAILABLE because no defensible portable measurement was available.

Execution order is recorded in result JSON and rotated between candidates/sizes. Numeric evidence is MEASURED except IBM validator-only duration (DERIVED as total CLI minus median empty-Node startup) and composite costs below (DERIVED). Semantic signatures, counts, and shapes—not timings—must repeat exactly.

Executed commands:

\`\`\`bash
npm install
npm run fixtures
node --import tsx shared/collect-operational.ts
npm run typecheck
npm run benchmark:scalar
npm run benchmark:redocly
npm run benchmark:ibm
node --import tsx shared/augment-operational.ts
npm run refresh:operational
node --import tsx shared/generate-readme.ts
npx tsc --noEmit --skipLibCheck false
shasum -a 256 fixtures/**/*.yaml results/*.json
\`\`\`

Reproduce the core experiment with \`npm ci && npm run fixtures && npm run operational && npm run benchmark\`, then refresh shared operational evidence and regenerate the README.

## 4. Workload inventory

| Mode | Size/version | Operations | Schemas | refs | Files | Bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
${inv.map((q:any)=>`| single | ${q.path.match(/(small|medium|large)/)?.[1]} / ${q.path.match(/3\.[0-2]\.[0-9]/)?.[0]} | ${q.operationCount} | ${q.schemaCount} | ${q.refCount} | ${q.sourceFileCount} | ${q.byteSize} |`).join('\n')}
${multi.map((q:any)=>`| multi | ${q.path.split('/')[1]} / ${q.path.match(/3\.[0-2]\.[0-9]/)?.[0]} | ${q.operationCount} | ${q.schemaCount} | ${q.refCount} | ${q.sourceFileCount} | ${q.byteSize} |`).join('\n')}

Recursive controls use the 12-operation workload plus one tree operation and a self-referential schema. Controlled failure fixtures cover malformed YAML and an unresolved local ref. Three later evidence-review probe files compare IBM's inline and referenced handling of the same required-false path-parameter violation; their hashes are recorded separately and do not alter the established timing corpus.

## 5. Complete benchmark matrix

Every value is milliseconds except bytes and RSS. NFR applies only to large single-file parser/validation stages.

| Candidate | Version | Size | Layout | Stage | Ops | Bytes | Temperature | n | Min | Median | Mean | p95 | Max | Stddev | Memory | NFR |
| --- | --- | --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${matrix('Scalar',s)}
${matrix('Redocly',r)}
${matrix('IBM',i)}

## 6. Key single-file, cold/warm, and NFR findings

- Scalar OAS 3.1 large: warm load ${f(sl.warm.timing.median)} ms, warm validate ${f(sv.warm.timing.median)} ms; cold medians ${f(sl.cold.timing.median)} / ${f(sv.cold.timing.median)} ms. Parsing and validation PASS the 2 s/5 s targets for all three versions.
- Redocly OAS 3.1 large: warm bundle/load ${f(rb.warm.timing.median)} ms and struct lint ${f(rl.warm.timing.median)} ms; cold medians ${f(rb.cold.timing.median)} / ${f(rl.cold.timing.median)} ms. Both targets PASS, without changing prior diagnostic correctness limitations.
- IBM OAS 3.1 large: total CLI median ${f(ib.totalCli.timing.median)} ms; empty Node startup median ${f(ib.startupBaseline.medianMs)} ms; derived validator/ruleset work ${f(ib.validatorExecutionDerived.timing.median)} ms. Total CLI validation PASSes 5 s but is much less suitable for repeated interactive calls. OAS 3.2 is NOT_SUPPORTED and unbenchmarked.

## 7. Multi-file, recursion, failures, and repeated processing

Scalar and Redocly completed their applicable medium/large multi-file operations within bounded time; Redocly lint retains its source-rich role. IBM's main multi-file timing corpus did **not** complete equivalent successful validation: it exited nonzero with 304 errors on the large OAS 3.1 case (53 invalid-ref, 251 oas3-schema). Shard-local component references resolve against the shard rather than the entry document, and the whole Components Object reference is rejected. Its 563.33 ms value is retained as MEASURED diagnostic-heavy entry processing, not equivalent full-validation performance, and must not be compared to the 2408.45 ms successful single-file validation as if semantic work were equal.

The targeted IBM probe uses a path parameter with required false, detected reliably inline in SPIKE-006. IBM reports path-params for both the inline document and the externally referenced Path Item. This proves that the external file is resolved, loaded, traversed, and checked for this violation class; it does not establish universally complete referenced-file conformance. The main corpus's speed difference is explained by its invalid reference topology/nonzero diagnostic path, not demonstrated multi-file efficiency.

All candidates terminated on legal recursion. Scalar dereference also terminated but remains explicitly noncanonical and cyclic per prior evidence. Malformed and unresolved cases produced controlled results/errors; no hangs, infinite expansion, or uncontrolled subprocess spawning occurred.

Separate Scalar load/validate/bundle and Redocly bundle/lint calls repeat parsing/loading. IBM repeats process startup, ruleset loading, parsing, and validation every invocation. OAIT should retain appropriate source/candidate intermediates within one logical workflow where public API boundaries safely permit it, satisfying the direction of NFR-PERF-003; no cache was implemented.

## 8. Scaling matrix

Ratios use OAS 3.1 single-file primary stages. RSS ratios are observed whole-process maxima and are order/cache affected; they are not isolated retained-memory ratios.

| Candidate | Stage | Range | Operation ratio | Duration ratio | RSS ratio | Throughput at destination ops/s |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${scaling('Scalar',s)}
${scaling('Redocly',r)}
${scaling('IBM',i)}

No unexplained runaway or severe superlinear trend was observed. IBM duration approaches operation-linear growth once fixed subprocess/ruleset overhead is amortized; Scalar and Redocly scale predictably for this corpus.

## 9. Memory evidence

Scalar's maximum observed RSS across all warm single- and multi-file scenarios was ${mb(scalarMax.warm.memory.observedMax.rss)} MiB (${scalarMax.mode} ${scalarMax.size} OAS ${scalarMax.version} ${scalarMax.stage}). Redocly's was ${mb(redoclyMax.warm.memory.observedMax.rss)} MiB (${redoclyMax.mode} ${redoclyMax.size} OAS ${redoclyMax.version} ${redoclyMax.stage}). These are high-water observations in long-lived candidate processes run in recorded order, not per-scenario isolated peaks. Heap/RSS/external raw values and deltas are retained per sample. No forced GC, infinite growth, or process failure occurred. IBM memory is PARTIAL evidence: process termination was bounded, but child peak RSS is not available and no approximation is fabricated.

## 10. Derived composite costs

Direct hybrid integration would be premature. For OAS 3.1 large, Scalar load + Redocly lint is DERIVED as ${(sl.warm.timing.median+rl.warm.timing.median).toFixed(2)} ms from constituent warm medians; Scalar load + IBM total CLI is DERIVED as ${(sl.warm.timing.median+ib.totalCli.timing.median).toFixed(2)} ms. These exclude future OAIT SourceIndex/normalization/rule costs and are not MEASURED end-to-end workflows.

## 11. Dependency inventory, footprint, audit, and licenses

The shared installed graph is ${(o.experiment.nodeModulesBytes/1048576).toFixed(1)} MiB; lockfile ${o.experiment.lockfileBytes} bytes, SHA-256 ${o.experiment.lockfileSha256}. Hoisting prevents precise candidate-attributable disk claims.

| Item | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| Version | ${o.versions['@scalar/openapi-parser']} + json-magic ${o.versions['@scalar/json-magic']} | ${o.versions['@redocly/openapi-core']} | ${o.versions['ibm-openapi-validator']} |
| Integration | ESM programmatic | ESM programmatic | CommonJS CLI subprocess |
| Manifest direct runtime deps | 10 + 3 | 11 | 18 |
| Installed tree nodes (npm tree method) | ${o.manifests['@scalar/openapi-parser'].installedTreeNodeCount} + ${o.manifests['@scalar/json-magic'].installedTreeNodeCount} | ${o.manifests['@redocly/openapi-core'].installedTreeNodeCount} | ${o.manifests['ibm-openapi-validator'].installedTreeNodeCount} |
| Candidate-attributable disk | AMBIGUOUS (hoisted) | AMBIGUOUS (hoisted) | AMBIGUOUS (hoisted) |
| Audit C/H/M/L | 0/0/0/0 on named audit paths | 0/0/0/0 on named audit paths | 0/8/0/0 through IBM/Spectral graph |
| Direct license | MIT / MIT | MIT | Apache-2.0 |
| Node engine | >=22 | >=22.12 or >=20.19 <21 | >=16 |
| Native/platform concern | none direct; esbuild is dev tooling | none direct; esbuild is dev tooling | none observed direct |
| Security risk | LOW_CONCERN | LOW_CONCERN | SIGNIFICANT_CONCERN |

Audit was captured ${o.audit.timestamp} with npm ${o.audit.npmVersion}: critical 0, high 8, moderate 0, low 0. It reproduces SPIKE-006. Paths include IBM, @ibm-cloud/openapi-ruleset, Spectral CLI/core/functions, js-yaml, lodash, and minimatch. They are runtime-relevant to the documented IBM CLI chain; exploitability was not established. npm reports IBM 1.38.2 as an available mitigation route, which changes the pinned baseline and was not applied. No audit fix, override, or upgrade occurred.

Installed license counts are ${Object.entries(o.experiment.transitiveLicenseCounts).map(([k,v])=>`${k}:${v}`).join(', ')}. Two manifests were UNKNOWN and therefore REVIEW_REQUIRED; this is evidence, not legal approval. Direct licenses present no known blocker. Duplicated majors are recorded machine-readably. The only optional native concern observed is esbuild's platform binary for tsx development tooling, not a candidate runtime addon.

## 12. Runtime, TypeScript/ESM, CI, and portability

All workflows ran headlessly with no prompts, GUI, or user-specific state. Scalar and Redocly public ESM APIs work on Node 24; IBM's documented CommonJS CLI exits cleanly on valid files and predictably on controlled failures. Normal typecheck passes. Strict dependency checking with skipLibCheck false reproduces prior Scalar extension/missing-type and Redocly React/Markdoc declaration failures; these do not fail runtime benchmarks.

macOS arm64 is VERIFIED. Linux and Windows are NOT_VERIFIED; their standard Node/filesystem/subprocess architecture is SUPPORTED_BY_ARCHITECTURE, but benchmark equivalence and IBM shell/process details are not claimed. CI suitability: Scalar PASS, Redocly PASS, IBM PASS with subprocess/time/security constraints.

## 13. Candidate comparison

| Capability | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| Small/medium/large | PASS | PASS | PASS supported versions |
| Large parse target | PASS | PASS bundle proxy | NOT_APPLICABLE |
| Large validation target | PASS | PASS | PASS total CLI |
| Cold start | low hundreds ms | high hundreds ms | subprocess/ruleset dominated |
| Warm execution | PASS | PASS | NOT_APPLICABLE |
| Memory | PASS bounded observation | PASS bounded observation | PARTIAL child peak unavailable |
| Scaling | PASS | PASS | PASS with fixed startup cost |
| Multi-file | PASS bundle | PASS bundle/lint | PARTIAL: targeted traversal shown; main corpus non-equivalent/nonzero |
| Recursive safety | PASS | PASS | PASS |
| Programmatic API | PASS | PASS | NOT_SUPPORTED |
| Interactive fit | PASS | PASS | PARTIAL |
| CI/batch fit | PASS | PASS | PASS with constraints |
| TypeScript/ESM | PARTIAL declarations | PARTIAL declarations | N/A CLI |
| Dependency footprint | modest tree | moderate tree | large tree |
| Vulnerability posture | LOW_CONCERN observed | LOW_CONCERN observed | SIGNIFICANT_CONCERN |
| License | PASS direct / review transitive unknowns | PASS direct / review transitive unknowns | PASS direct / review transitive unknowns |
| Replaceability | PASS | PASS | PASS subprocess adapter |

## 14. NFR mapping

| NFR | Result | Evidence |
| --- | --- | --- |
| NFR-PERF-001 | PASS | Large parser and applicable validation medians meet 2 s/5 s desktop targets. |
| NFR-PERF-002 | PASS | Automated raw-sample benchmark harness covers parse/load, bundle and validation. |
| NFR-PERF-003 | PARTIAL | Repeated work identified; intermediate retention recommended but not implemented. |
| NFR-PERF-007 | PARTIAL | Reproducible baseline exists; production regression CI not implemented. |
| NFR-SEC-008 | PASS | npm audit exposes current advisories. |
| NFR-MNT-001 | PASS | Candidate roles remain modular adapter boundaries. |
| NFR-COM-001 | PARTIAL | Scalar/Redocly cover 3.0/3.1/3.2; IBM is bounded to 3.0/3.1. |
| NFR-COM-005 | PASS | Equivalent medium/large multi-file workloads execute. |
| NFR-POR-001 | PARTIAL | macOS verified; Windows/Linux not verified. |
| NFR-POR-003 | PASS | Standard Node runtime; no candidate direct native runtime addon observed. |
| NFR-POR-004 | PASS | All paths headless/noninteractive. |
| NFR-REP-002 | PASS | Environment, versions, raw samples, order, hashes and methodology persisted. |
| NFR-SCL-008 | PARTIAL | No runaway observed; IBM child peak RSS unavailable. |
| NFR-DEP-001 | PARTIAL | Clear value exists, but IBM has a large transitive tree. |
| NFR-DEP-002 | PARTIAL | Pinned packages run; IBM mitigation implies a later version review. |
| NFR-DEP-003 | PARTIAL | Direct licenses known; two transitive UNKNOWN manifests require review. |
| NFR-DEP-004 | PASS | npm lock/tree inventory persisted. |
| NFR-DEP-005 | PASS | Time-stamped npm audit persisted; automation belongs in production CI. |

## 15. Exactly 12 operational gates

| Gate | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
${gates()}

PARTIAL explanations: IBM OG-04 lacks defensible child peak RSS; IBM OG-05 has targeted referenced-file traversal evidence but the main timing corpus is a nonzero, reference-invalid workload and cannot establish equivalent valid multi-file suitability; IBM OG-09 is CLI-only and costly for repeated interactive use. All other non-PASS entries are NOT_APPLICABLE parser-role evidence, not hidden failures.

## 16. Operational classifications

- Scalar: OPERATIONALLY_SUITABLE for in-process parsing/schema preservation and its bounded validation-evidence role.
- Redocly: OPERATIONALLY_SUITABLE for in-process bundle/transformation and source-rich diagnostic evidence, subject to prior semantic limitations.
- IBM: SUITABLE_WITH_CONSTRAINTS for bounded CI/batch and occasional interactive OAS 3.0/3.1 validation; repeated interactive subprocess use and the current security graph are material constraints.

## 17. Architecture answers and implications

1. Scalar meets the parser target; Redocly meets bundle/transformation targets. All applicable validator roles meet 5 s on this machine.
2. IBM's ~${f(ib.totalCli.timing.median)} ms large total and ~${f(i.singleFileResults.find((q:any)=>q.size==='small'&&q.version==='3.1.2').totalCli.timing.median)} ms small total make bounded CI/batch reasonable but repeated interactive invocation unattractive.
3. Scaling and legal recursion do not change viability. IBM multi-file suitability is constrained because the established timing corpus is not semantically equivalent successful validation; memory is bounded observationally, with IBM peak unknown.
4. OAIT should retain safe intermediates to avoid duplicate parsing/resolution, without treating transformed pointers as source truth.
5. Scalar and Redocly suit interactive and CI roles. IBM suits CI/batch with subprocess and security constraints.
6. No verified platform-specific runtime blocker exists; only macOS performance is verified.
7. IBM's audit posture is significant but not automatically blocking. Mitigation needs a separately tested baseline upgrade/override/replacement decision.
8. Direct licenses show no known blocker; two unknown transitive manifests require distribution review.
9. The hybrid parser/external-validator/OAIT-rule architecture remains operationally reasonable. External speed cannot repair prior diagnostic or semantic gaps.
10. All candidates proceed to the final weighted technology evaluation in their evidenced roles. No earlier semantic conclusion changes.
11. Evidence is sufficient to produce the parser-validator evaluation summary, with IBM memory/cross-platform/security follow-ups explicitly bounded.
12. After that summary, ADRs are justified for parser selection, validator/hybrid strategy, candidate diagnostic adaptation, and dependency-risk acceptance/mitigation. No ADR is created here.

## 18. Limitations and follow-up

This is one desktop/macOS run, YAML-only performance input, safe rather than adversarial failure testing, whole-process sampled memory, and no production SourceIndex/normalization/rules cost. Cold sample count is three for in-process candidates; warm distributions use ten. IBM internal timing is derived, not measured. Audit data is time-sensitive. Candidate-specific disk footprints are ambiguous under npm hoisting.

Follow up with the final parser-validator summary, weighted decision, Linux/Windows CI confirmation, legal review of UNKNOWN transitive licenses, IBM baseline/mitigation retest, isolated child-memory instrumentation if IBM remains shortlisted, and production benchmark/regression design after ADRs.

## Result provenance

Machine results retain environment, roles, exact versions, fixture inventory/hashes, raw timing and memory samples, cold/warm evidence, recursion, scaling, NFRs, dependency/audit/license/runtime/CI evidence, exactly 12 gates, classifications, and internal hashes.

\`\`\`text
results/scalar.json  ${hashes.scalar}
results/redocly.json ${hashes.redocly}
results/ibm.json     ${hashes.ibm}
results/ibm-multifile-probe.json ${createHash('sha256').update(await readFile(join(root,'results/ibm-multifile-probe.json'))).digest('hex')}
\`\`\`
`;
await writeFile(join(root,'README.md'),text);console.log('generated README from machine results')
