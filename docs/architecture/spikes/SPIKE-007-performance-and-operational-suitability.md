# SPIKE-007: Evaluate Performance and Operational Suitability

**Status:** Planned  
**Date:** 2026-08-10  
**Phase:** Technical Validation  
**Target release:** OAIT v0.1  
**Predecessors:** `SPIKE-001-parser-version-support.md`, `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`, `SPIKE-LOC-001-source-location-technology.md`, `SPIKE-004-openapi-3.2-operation-support.md`, `SPIKE-005-schema-and-dialect-behavior.md`, `SPIKE-006-validator-capabilities-and-diagnostics.md`  
**Related architecture:** `system-architecture.md`, `openapi-domain-model.md`, `source-processing-design.md`  
**Related requirements:** `nonfunctional-requirements.md`  
**Related ADRs:** `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`

---

# 1. Objective

Determine whether the parser and validator candidates that survived SPIKE-001 through SPIKE-006 are operationally reasonable for OAIT v0.1.

SPIKE-007 evaluates:

```text
PERFORMANCE
      +
RESOURCE USAGE
      +
SCALING BEHAVIOR
      +
RUNTIME / CI FIT
      +
DEPENDENCY / SECURITY POSTURE
      +
OPERATIONAL REPLACEABILITY
```

This spike does not re-decide semantic correctness already established by previous spikes.

---

# 2. Primary Research Question

> **Can the candidate parser/validator technologies perform their evidenced OAIT roles within acceptable runtime, resource, deployment, dependency, and maintenance constraints for OAIT v0.1?**

---

# 3. Why This Spike Exists

A technically correct library can still be unsuitable for production if it:

- consumes excessive memory;
- scales poorly with document size;
- has unacceptable startup overhead;
- requires subprocess execution where an in-process API is preferable;
- introduces a large or vulnerable dependency graph;
- relies on unsupported runtime assumptions;
- behaves inconsistently in headless environments;
- performs unnecessary repeated parsing or resolution;
- cannot be isolated behind replaceable adapters.

SPIKE-007 provides the final experimental evidence needed before the parser-validator technology decision.

---

# 4. Governing NFR Targets

The current OAIT engineering targets for specifications containing up to approximately 500 operations are:

```text
Parsing     ≤ 2 seconds
Validation  ≤ 5 seconds
```

These are initial engineering targets, not permanent product SLAs.

The spike must also evaluate relevant requirements concerning:

- bounded resource usage;
- reproducibility;
- deterministic execution;
- dependency vulnerability visibility;
- standard runtime suitability;
- headless CI operation;
- portability;
- modularity and replaceability.

---

# 5. Important Scope Boundary

SPIKE-007 measures the technologies in the roles supported by prior evidence.

Do not pretend every candidate performs identical work.

The roles entering SPIKE-007 are approximately:

```text
Scalar
  parser / schema-preservation candidate
  +
  useful validation evidence

Redocly
  parser / transformation candidate
  +
  high-quality diagnostic-source evidence

IBM
  bounded 3.0/3.1 validation evidence
  +
  CLI/subprocess integration candidate
```

SPIKE-006 classified all three as:

```text
COMPOSITE_ROLE_VIABLE
```

and none as:

```text
SOLE_VALIDATOR_VIABLE
```

SPIKE-007 must preserve that distinction.

---

# 6. Exact Candidate Baselines

Use the exact versions already established:

## Scalar

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19
```

## Redocly

```text
@redocly/openapi-core@2.40.0
```

## IBM OpenAPI Validator

```text
ibm-openapi-validator@1.37.15
```

Supporting dependencies should remain aligned with previous spikes where practical.

Do not silently upgrade baseline versions.

Secondary-version experiments are allowed only when explicitly justified and must remain separate.

---

# 7. Experimental Location

Use:

```text
experiments/parser-validator-spike/spike-007/
```

Suggested structure:

```text
spike-007/
├── fixtures/
│   ├── generated/
│   │   ├── small/
│   │   ├── medium/
│   │   └── large/
│   ├── multi-file/
│   └── recursive/
│
├── scalar/
│   └── benchmark.ts
│
├── redocly/
│   └── benchmark.ts
│
├── ibm/
│   └── benchmark.ts
│
├── shared/
│   ├── generate-fixtures.ts
│   ├── benchmark-runner.ts
│   ├── metrics.ts
│   └── types.ts
│
├── results/
│   ├── scalar.json
│   ├── redocly.json
│   └── ibm.json
│
├── README.md
├── package.json
├── package-lock.json
└── tsconfig.json
```

Do not introduce production packages.

---

# 8. Benchmark Classes

Use three primary workload classes.

## Small

Target:

```text
approximately 10–15 operations
```

and always:

```text
<20 operations
```

## Medium

Target:

```text
approximately 100 operations
```

## Large

Target:

```text
approximately 500 operations
```

The generated corpus must record the actual operation count.

Do not label a fixture solely by intended size.

---

# 9. Benchmark Fixture Design

Each workload should contain realistic OpenAPI structures, including:

- paths;
- multiple HTTP operations;
- parameters;
- request bodies;
- responses;
- reusable schemas;
- nested schemas;
- reusable components;
- `$ref` usage;
- security schemes;
- representative descriptions.

Avoid constructing unrealistically trivial operations whose only purpose is inflating the operation count.

---

# 10. Version Coverage

At minimum benchmark:

```text
OpenAPI 3.0.4
OpenAPI 3.1.2
OpenAPI 3.2.0
```

for Scalar and Redocly where supported by prior spikes.

For IBM:

```text
3.0.4
3.1.2
```

must be benchmarked.

OAS 3.2 remains operationally:

```text
NOT_SUPPORTED
```

for the pinned IBM baseline unless fresh experiment evidence proves otherwise.

Do not treat unsupported input as a performance benchmark.

---

# 11. Equivalent Workload Requirement

Where possible, equivalent benchmark classes must describe logically comparable APIs across versions.

The purpose is to reduce workload-shape bias.

Differences required by OpenAPI version semantics are acceptable and must be documented.

---

# 12. Single-File Benchmark

For each size class measure representative single-file processing.

At minimum capture:

```text
file size
operation count
schema count
reference count
```

This provides the base scaling curve.

---

# 13. Multi-File Benchmark

Create a logically equivalent multi-file workload for at least:

```text
medium
large
```

Distribute content across realistic files such as:

```text
openapi.yaml
paths/
schemas/
parameters/
responses/
```

Measure the additional operational cost of:

- file loading;
- reference discovery;
- reference resolution/bundling where applicable;
- validator traversal.

---

# 14. Recursive-Reference Benchmark

Create a workload containing legal recursion.

The benchmark must verify:

```text
processing terminates
```

and must measure whether recursion causes abnormal time or memory growth.

Do not benchmark canonical full infinite dereference.

Recursive graphs remain graph/reference based.

---

# 15. Benchmark Operations

Measure candidate operations separately where technically meaningful.

## Scalar

Candidate operations may include:

```text
parse/load
validate
bundle
dereference
```

Use only public supported APIs already justified by previous spikes.

## Redocly

Candidate operations may include:

```text
bundle/load
lint/struct validation
```

Separate transformation cost from validation cost where feasible.

## IBM

Measure documented CLI validation.

Because IBM is CLI-only in the evidenced SPIKE-006 integration, explicitly capture subprocess overhead.

Do not import undocumented internal APIs merely to improve benchmark results.

---

# 16. Primary Timing Metrics

Capture durations for applicable operations:

```text
parse/load
reference-resolution / bundle
dereference where relevant
validation
end-to-end candidate workflow
```

Use high-resolution monotonic timing such as:

```text
performance.now()
```

or:

```text
process.hrtime.bigint()
```

Do not use wall-clock timestamps as benchmark durations.

---

# 17. Cold and Warm Execution

Distinguish:

```text
cold process
warm process
```

A cold benchmark includes process/module startup where relevant.

A warm benchmark measures repeated execution in an already-running process.

This distinction is especially important for:

```text
CLI startup
Node module initialization
IBM subprocess execution
```

---

# 18. Benchmark Repetition

Each benchmark scenario must execute enough iterations to characterize variability.

Minimum preferred approach:

```text
1+ warm-up iteration
10 measured iterations
```

If a large scenario is expensive, a smaller number may be used only with explicit justification.

Do not report one timing sample as representative performance.

---

# 19. Timing Statistics

Report at minimum:

```text
minimum
median
mean
p95
maximum
standard deviation
```

Median should be the primary central measure.

Do not select the fastest observed run as the candidate result.

---

# 20. Outlier Handling

Do not silently discard outliers.

If an outlier policy is used:

- define it before applying it;
- retain raw observations;
- report excluded observations separately.

Prefer retaining all results unless there is a clear measurement failure.

---

# 21. Execution Order Bias

Avoid always benchmarking candidates in the same order.

Where practical:

- rotate candidate order;
- separate cold process runs;
- minimize thermal/cache bias.

Record the benchmark order.

---

# 22. Memory Metrics

Measure operational memory using Node/process-level evidence where feasible.

At minimum capture:

```text
RSS
heapUsed
heapTotal
external
```

for programmatic Node candidates.

Capture:

```text
before
peak/observed maximum where feasible
after
delta
```

IBM CLI memory should be measured through child-process/OS-supported evidence where practical.

If exact child peak RSS cannot be measured reliably in a portable way, report the limitation rather than inventing values.

---

# 23. Memory Interpretation

Memory measurements are engineering observations, not exact universal limits.

The spike should identify:

- linear-looking growth;
- superlinear growth;
- unexpectedly retained memory;
- uncontrolled growth;
- large candidate differences.

Do not establish a permanent product memory limit from a single Mac benchmark.

---

# 24. Garbage Collection

Do not manipulate garbage collection unless the benchmark protocol explicitly controls it.

If using:

```text
--expose-gc
```

record that fact and use it consistently.

Do not compare one candidate under forced GC and another without it.

---

# 25. Scaling Analysis

For each candidate compare growth from:

```text
small → medium → large
```

Assess:

```text
duration ratio
memory ratio
operations-per-second
```

The goal is not merely to identify the fastest candidate.

The goal is to determine whether scaling is operationally acceptable and predictable.

---

# 26. NFR Performance Evaluation

For the large ~500-operation class evaluate:

## Parsing

Target:

```text
≤ 2 seconds
```

## Validation

Target:

```text
≤ 5 seconds
```

Use median warm performance for the primary engineering comparison.

Also report cold-start behavior separately.

Do not treat a pass on one workstation as a universal SLA guarantee.

---

# 27. End-to-End Composite Cost

Because OAIT is likely to use a hybrid architecture, also estimate the cost of realistic composite workflows.

Examples:

```text
OAIT source processing
+
Scalar parse
+
external validation
```

or:

```text
OAIT source processing
+
Scalar parse
+
Redocly diagnostic evidence
```

This may be approximated from independently measured stages if direct composition would create premature production integration.

Clearly label:

```text
MEASURED
```

versus:

```text
DERIVED
```

metrics.

---

# 28. Repeated Processing Observation

Evaluate NFR-PERF-003 concerns.

Determine whether candidate APIs encourage or require repeated:

```text
parsing
reference loading
bundling
validation preparation
```

for one logical workflow.

Record opportunities to retain intermediate representations.

Do not implement production caching in this spike.

---

# 29. Failure and Resource-Boundary Behavior

Use controlled operational tests where useful to observe:

- malformed input;
- unresolved references;
- recursive references;
- large inputs.

Determine whether the candidate:

- terminates predictably;
- throws a controlled error;
- hangs;
- exhibits runaway memory;
- spawns uncontrolled work.

Do not perform denial-of-service stress testing beyond safe local experimental limits.

---

# 30. IBM Subprocess Overhead

IBM is currently evidenced through CLI invocation.

Measure separately:

```text
process startup
validator execution
total CLI elapsed time
```

where feasible.

Determine whether CLI-only integration creates operational disadvantages for:

- repeated interactive use;
- CI;
- batch execution.

Do not assume subprocess integration is unacceptable solely because it is a CLI.

Measure it.

---

# 31. Installation Footprint

For each candidate/composite dependency graph record where feasible:

```text
direct dependency count
transitive dependency count
node_modules size attributable to experiment
package-lock footprint
```

Avoid claiming precise per-package disk attribution if npm hoisting makes it ambiguous.

Record measurement method.

---

# 32. Dependency Graph

Capture:

```text
npm ls
```

or equivalent structured inventory.

Identify:

- duplicated major versions;
- very large dependency chains;
- optional native dependencies;
- platform-specific dependencies;
- runtime dependencies versus development-only dependencies.

---

# 33. Dependency Security

Run:

```text
npm audit --json
```

against the pinned experiment dependency graph.

Record:

```text
critical
high
moderate
low
```

counts.

Do not automatically run:

```text
npm audit fix
```

Do not upgrade candidate versions during baseline testing.

Audit results are time-sensitive because vulnerability databases change.

Record:

```text
audit date/time
npm version
lockfile hash
```

---

# 34. SPIKE-006 Security Carry-Forward

SPIKE-006 observed:

```text
8 high-severity transitive dependency findings
```

through the IBM/Spectral dependency chain.

SPIKE-007 must:

- reproduce or refute the finding;
- identify the relevant dependency path(s);
- separate IBM-specific/transitive findings from shared experiment dependencies;
- record whether mitigation requires candidate upgrade, override, replacement, or no action.

Do not fix the issue during the spike.

---

# 35. License Evidence

Determine licenses for:

- direct candidate packages;
- relevant production transitive dependencies where practical.

Classify whether any observed license appears incompatible with OAIT's intended open-source distribution.

Do not infer legal approval merely from package popularity.

If license compatibility is uncertain:

```text
REVIEW_REQUIRED
```

is acceptable.

---

# 36. Package Maintenance Evidence

Record objective package metadata available locally or from package manifests where possible:

- package version;
- repository reference;
- engine requirement;
- deprecated status;
- package license.

Do not make a final maintainability judgment solely from download counts or GitHub stars.

---

# 37. Node Runtime Compatibility

Record:

```text
Node version used
package engine declarations
runtime warnings
deprecated API warnings
```

Determine whether any candidate requires unusually narrow or obsolete Node support.

---

# 38. ESM / TypeScript Operational Fit

Record:

- ESM/CommonJS behavior;
- NodeNext compatibility;
- type-check behavior;
- need for `skipLibCheck`;
- import friction;
- public API import stability.

Carry forward existing Scalar and Redocly dependency declaration issues accurately.

Do not conflate declaration problems with runtime benchmark failure.

---

# 39. Headless CI Suitability

Verify that applicable candidate workflows run without:

- interactive prompts;
- GUI requirements;
- user-specific filesystem assumptions;
- development-only state.

IBM CLI must be tested in noninteractive mode.

Record exit codes.

---

# 40. Output Determinism

Where output is generated, execute identical runs repeatedly and verify stable:

- success/failure;
- diagnostic count where applicable;
- ordering where previously expected;
- machine-result structure.

Timing values do not need to be identical.

Semantic outputs should remain deterministic.

---

# 41. Fixture Immutability

Hash all persisted benchmark fixtures before and after execution.

No candidate may alter benchmark source files.

---

# 42. Benchmark Result Immutability

Persist raw benchmark observations.

Do not overwrite raw measurements with summarized values only.

Machine-readable result files must preserve:

```text
raw samples
summary statistics
environment
fixture identity
fixture hash
candidate configuration
```

---

# 43. Benchmark Environment

Record at minimum:

```text
date
OS
OS version
CPU architecture
CPU model if available
logical CPU count
physical memory
Node version
npm version
TypeScript version
power mode where identifiable
```

Because benchmarks are machine-dependent, this metadata is mandatory.

---

# 44. Background Load Limitation

Record that desktop benchmark results can be affected by:

- other applications;
- OS scheduling;
- thermal state;
- filesystem cache.

Where practical, reduce unnecessary background activity.

Do not claim laboratory-grade precision.

---

# 45. Machine-Readable Results

Create:

```text
results/scalar.json
results/redocly.json
results/ibm.json
```

Each should include:

```text
environment
candidate versions
candidate role
fixture inventory
fixture hashes
raw timing samples
summary statistics
memory observations
cold-start measurements
warm-run measurements
single-file results
multi-file results
recursive results
NFR comparisons
dependency inventory
audit evidence
license evidence
runtime/CI observations
operational limitations
mandatory gates
result hash
```

---

# 46. Performance Result Vocabulary

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
NOT_APPLICABLE
```

Every PARTIAL or FAIL must contain evidence and explanation.

---

# 47. Benchmark Result Labels

Every numeric result must identify whether it is:

```text
MEASURED
DERIVED
ESTIMATED
```

Do not present derived composite timing as directly measured timing.

---

# 48. Mandatory Operational Gates

Evaluate exactly the following gates.

## OG-01 — Large parse target

Applicable parser role meets or reasonably supports the ~500-operation parsing target:

```text
median warm parse ≤ 2 seconds
```

## OG-02 — Large validation target

Applicable validator role meets or reasonably supports:

```text
median warm validation ≤ 5 seconds
```

## OG-03 — Predictable scaling

No unexplained severe superlinear growth appears across small, medium, and large fixtures.

## OG-04 — Bounded memory behavior

No runaway or operationally unreasonable memory growth appears within the benchmark corpus.

## OG-05 — Multi-file suitability

Applicable role processes representative multi-file workloads within reasonable operational bounds.

## OG-06 — Recursive-reference safety

Applicable role terminates safely on legal recursion without uncontrolled expansion.

## OG-07 — Reproducibility

Benchmark fixtures, semantic outputs, and measurement methodology are reproducible.

## OG-08 — Headless / CI suitability

Candidate role executes noninteractively in a headless workflow.

## OG-09 — Runtime integration suitability

Candidate's public integration mode is operationally acceptable for its proposed OAIT role.

## OG-10 — Dependency security visibility

The dependency graph can be inventoried and known vulnerability findings can be identified.

A vulnerable dependency does not automatically fail this gate; inability to detect/manage the risk does.

## OG-11 — License / distribution suitability

No known direct license incompatibility blocks the proposed OAIT role, or uncertainty is explicitly classified.

## OG-12 — Operational replaceability

The evidenced integration can remain behind OAIT adapter boundaries without requiring candidate-specific behavior throughout the system.

---

# 49. Security-Risk Classification

Dependency-security posture should be classified separately from gate outcomes:

```text
LOW_CONCERN
MANAGEABLE_CONCERN
SIGNIFICANT_CONCERN
BLOCKING_CONCERN
```

The classification must explain:

- severity;
- whether vulnerability is reachable/relevant where known;
- whether it is transitive;
- available mitigation path;
- whether mitigation requires changing the pinned baseline.

Do not claim exploitability without evidence.

---

# 50. Candidate Operational Classification

For each candidate classify:

```text
OPERATIONALLY_SUITABLE
SUITABLE_WITH_CONSTRAINTS
NOT_OPERATIONALLY_SUITABLE
```

This classification is role-specific.

Example:

```text
IBM may be suitable for bounded CI validation
while unsuitable for repeated in-process interactive validation.
```

Do not force one global label if the role matters.

---

# 51. Required Comparison Matrix

The README must include a matrix similar to:

| Capability | Scalar | Redocly | IBM |
|---|---|---|---|
| Small workload | | | |
| Medium workload | | | |
| Large workload | | | |
| Large parse target | | | |
| Large validation target | | | |
| Cold start | | | |
| Warm execution | | | |
| Memory behavior | | | |
| Scaling | | | |
| Multi-file | | | |
| Recursive safety | | | |
| Programmatic API fit | | | |
| CLI/subprocess overhead | | | |
| Headless CI | | | |
| TypeScript/ESM fit | | | |
| Dependency footprint | | | |
| Vulnerability posture | | | |
| License posture | | | |
| Operational replaceability | | | |

---

# 52. Required Benchmark Matrix

For every candidate/workload combination report:

```text
operation count
file size
mode
cold/warm
sample count
min
median
mean
p95
max
stddev
memory observations
NFR result
```

Do not show only an overall candidate average.

---

# 53. Required Scaling Matrix

Show at minimum:

```text
small → medium ratio
medium → large ratio
small → large ratio
```

for:

- primary duration;
- memory where measurable.

Interpret ratios in relation to workload-size growth.

---

# 54. Required Dependency Matrix

Include:

| Item | Scalar | Redocly | IBM |
|---|---|---|---|
| Direct version | | | |
| Integration type | | | |
| Dependency count | | | |
| Install footprint | | | |
| Audit critical | | | |
| Audit high | | | |
| Audit moderate | | | |
| Audit low | | | |
| License | | | |
| Node engine | | | |
| Native dependency concern | | | |
| Operational concern | | | |

---

# 55. Required NFR Mapping

Map evidence explicitly to at least:

```text
NFR-PERF-001
NFR-PERF-002
NFR-PERF-003
NFR-PERF-007
NFR-SEC-008
NFR-MNT-001
NFR-COM-001
NFR-COM-005
NFR-POR-001
NFR-POR-003
NFR-POR-004
NFR-REP-002
NFR-SCL-008
NFR-DEP-001
NFR-DEP-002
NFR-DEP-003
NFR-DEP-004
NFR-DEP-005
```

Do not claim that a single-machine benchmark proves cross-platform portability.

Portability conclusions should distinguish:

```text
VERIFIED
SUPPORTED_BY_ARCHITECTURE
NOT_VERIFIED
```

---

# 56. Fairness Rule

Do not rank candidates purely by elapsed time.

A faster candidate that loses:

```text
source truth
schema semantics
version correctness
diagnostic accuracy
```

cannot compensate for those failures through benchmark speed.

SPIKE-001 through SPIKE-006 remain authoritative for semantic suitability.

---

# 57. Cross-Spike Evidence Rule

SPIKE-007 must not overwrite prior findings.

Examples:

- Scalar source-location limitations remain true unless new evidence explicitly changes them.
- Redocly SPIKE-006 diagnostic false positives remain true.
- IBM OAS 3.2 lack of support remains true.
- IBM CLI-only integration remains true unless a supported public programmatic API is discovered and verified.
- OAIT owns source processing under ADR-004/005.

Performance evidence supplements prior evidence.

---

# 58. Architecture Questions

The final report must explicitly answer:

1. Does Scalar meet OAIT's parser performance target?
2. Does Redocly meet relevant parser/transformation targets?
3. Which validator roles meet the validation target?
4. What is the operational cost of IBM subprocess validation?
5. How do candidates scale from <20 to ~500 operations?
6. Does multi-file processing materially alter viability?
7. Does recursion create unacceptable operational behavior?
8. Are memory characteristics bounded and predictable?
9. Should OAIT retain parser/validator intermediate representations to avoid repeated work?
10. Which integrations are suitable for interactive CLI use?
11. Which integrations are suitable for CI?
12. Does any candidate impose problematic runtime/platform assumptions?
13. What dependency-security risks exist?
14. Are those risks manageable without changing architecture?
15. Does any license issue require review?
16. Is the likely hybrid parser/validator architecture still operationally reasonable?
17. Which candidates should proceed into the final technology decision?
18. Does SPIKE-007 change any conclusion from earlier spikes?
19. Is the evidence sufficient to produce the parser-validator evaluation summary?
20. Which ADRs are now justified?

---

# 59. What Must Not Be Implemented

Do not implement production:

```text
benchmark package
parser adapter
validator adapter
caching service
performance telemetry
CLI command
CI workflow
dependency-update bot
AI integration
MCP integration
```

Experiment-only measurement code belongs under:

```text
experiments/parser-validator-spike/spike-007/
```

---

# 60. Required README

The completed README must include:

1. Objective.
2. Prior-spike constraints.
3. Environment.
4. Exact versions.
5. Benchmark methodology.
6. Warm-up/repetition methodology.
7. Fixture-generation methodology.
8. Fixture inventory.
9. Actual operation/schema/reference counts.
10. Single-file results.
11. Multi-file results.
12. Recursive-reference results.
13. Cold-start results.
14. Warm-run results.
15. Timing statistics.
16. Memory results.
17. Scaling analysis.
18. NFR target comparison.
19. Candidate comparison matrix.
20. Benchmark matrix.
21. Scaling matrix.
22. Dependency inventory.
23. Installation footprint.
24. Audit/security findings.
25. SPIKE-006 audit carry-forward.
26. License evidence.
27. Node/runtime compatibility.
28. ESM/TypeScript findings.
29. Headless/CI suitability.
30. Determinism.
31. Fixture immutability.
32. Reproducibility commands.
33. NFR mapping.
34. Exactly 12 operational gates.
35. Candidate operational classification.
36. Limitations.
37. Architecture implications.
38. Candidate continuation/final-decision recommendation.
39. ADR recommendation.
40. Follow-up actions.

---

# 61. Exit Criteria

SPIKE-007 is complete when OAIT can answer:

> **Are the shortlisted parser and validator technologies operationally suitable, in their evidenced roles, for OAIT v0.1 and ready for final technology selection?**

Completion requires:

- small/medium/large workload evidence;
- 500-operation NFR comparison;
- timing distributions;
- memory observations;
- multi-file evidence;
- recursive-reference evidence;
- cold/warm analysis;
- deterministic repeatability;
- dependency inventory;
- vulnerability evidence;
- license evidence;
- runtime/headless suitability;
- 12 operational gates;
- final role-specific operational classification.

---

# 62. Follow-Up Relationship

After SPIKE-007:

```text
SPIKE-007
Performance / operational suitability
        ↓
Parser-validator evaluation summary
        ↓
Weighted technology decision
        ↓
ADR(s)
        ↓
Production parser/validator design
```

Do not create final parser/validator ADRs during SPIKE-007.

---

# 63. Guiding Principle

> **A library is production-suitable only when its correctness, operational cost, and dependency risk are all acceptable for the role OAIT actually asks it to perform.**