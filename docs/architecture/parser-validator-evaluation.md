# Parser-Validator Technology Evaluation and Decision

**Status:** Accepted
**Date:** 2026-08-10
**Phase:** Architecture Decision Synthesis
**Target:** OAIT v0.1
**GitHub issue:** #16
**Evidence window:** SPIKE-001 through SPIKE-007
**Next stage:** Architecture Decision Records and production design

---

# 1. Purpose

This document defines the final evaluation method for selecting the parser, validator, and related technology roles for OpenAPI Intelligence Toolkit (OAIT) v0.1.

The decision must synthesize the technical evidence produced by:

* SPIKE-001 — Parser and OpenAPI version support
* SPIKE-002 — Reference resolution
* SPIKE-003 — Source-location preservation
* SPIKE-LOC-001 — Source-location technology
* SPIKE-004 — OpenAPI 3.2 operation support
* SPIKE-005 — Schema and dialect behavior
* SPIKE-006 — Validator capabilities and diagnostics
* SPIKE-007 — Performance and operational suitability

This is not another experimental spike.

No new candidate should be introduced during scoring unless existing evidence is demonstrably insufficient to make a decision.

---

# 2. Primary Decision Question

> **Which technologies should OAIT use for source processing, OpenAPI parsing, transformation/reference handling, validator evidence, and deterministic conformance enforcement, based on the complete technical evidence gathered during SPIKE-001 through SPIKE-007?**

The decision must optimize for the complete OAIT architecture rather than identify a single library that appears strongest in isolation.

---

# 3. Core Decision Principle

OAIT does not require one third-party package to own the entire OpenAPI processing lifecycle.

The evaluation therefore follows:

```text
SOURCE TRUTH
    +
OPENAPI SEMANTICS
    +
VALIDATION EVIDENCE
    +
OAIT RULE SEMANTICS
    +
OPERATIONAL SUITABILITY
```

The preferred architecture may use different technologies for different responsibilities.

The decision must not reward a candidate merely because it performs more responsibilities if doing so weakens correctness, source provenance, version handling, security, or replaceability.

---

# 4. Fixed Architectural Decisions

The following decisions are already established and are not reopened by this evaluation unless contradictory evidence is discovered.

## 4.1 Source loading and source identity

Under ADR-004, OAIT owns:

```text
source loading
source-access policy
canonical URI handling
source registry
reference declaration evidence
reference graph evidence
source identity
```

Third-party parser or validator transformations are not authoritative for physical source identity.

## 4.2 Source indexing

Under ADR-005, OAIT uses:

```text
yaml
+
jsonc-parser
```

for physical source indexing.

This role is already decided and is therefore not scored against Scalar, Redocly, or IBM.

## 4.3 Canonical source identity

Stable source identity is:

```text
physical document URI
+
RFC6901 JSON Pointer
```

Line and column are presentation metadata.

## 4.4 Canonical OpenAPI representation

OAIT uses the normalized, version-aware domain model established by ADR-003.

Full third-party dereference is not the canonical OAIT model.

## 4.5 Rule ownership

OAIT owns:

```text
OAIT rule IDs
OAIT severity
version applicability
finding semantics
source identity
public machine-readable finding structure
```

Third-party validator diagnostics are evidence inputs.

They are not OAIT's public rules contract.

---

# 5. Candidate Baselines

The final decision uses the exact technical-validation baselines.

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

A newer release must not silently replace a tested baseline during scoring.

---

# 6. Evidence Hierarchy

Evidence must be classified as one of:

```text
DIRECT
DERIVED
INFERRED
UNVERIFIED
```

### DIRECT

Observed directly in a completed experiment.

Examples:

```text
Scalar preserved boolean schemas.
Redocly produced source-rich diagnostics.
IBM rejected OpenAPI 3.2.
```

### DERIVED

Calculated directly from observed evidence.

Examples:

```text
performance ratios
weighted score
derived composite workflow duration
```

### INFERRED

Architectural conclusion supported by multiple direct observations.

Example:

```text
OAIT requires deterministic fallback conformance rules.
```

### UNVERIFIED

Not tested sufficiently.

Examples may include:

```text
Windows benchmark equivalence
Linux benchmark equivalence
IBM child peak RSS
```

A candidate must not receive a high score based primarily on UNVERIFIED assumptions.

---

# 7. Evidence Traceability Requirement

Every material score must cite one or more specific spike findings.

The scoring rationale should identify the evidence source in the form:

```text
SPIKE-004
SPIKE-005
SPIKE-006
```

or equivalent subsection references.

Scores must not be justified by package reputation, popularity, marketing claims, or intuition when experimental evidence exists.

---

# 8. Architectural Roles Under Decision

The final technology decision must explicitly resolve the following roles.

## Role A — Physical source processing

Responsibilities:

```text
YAML/JSON source parsing
physical ranges
logical pointers
duplicate occurrence evidence
source identity
```

Current expected technology:

```text
yaml + jsonc-parser
```

This role is already established by ADR-005 and is not reopened by weighted candidate scoring.

## Role B — Primary OpenAPI parser / semantic ingestion

Responsibilities:

```text
OpenAPI 3.0 / 3.1 / 3.2 ingestion
version recognition
schema preservation
operation discovery support
reference-aware semantic processing
input to OAIT normalization
```

Primary candidates:

```text
Scalar
Redocly
```

IBM is not treated as a primary parser candidate unless evidence demonstrates that role.

## Role C — Reference transformation / bundling support

Responsibilities may include:

```text
bundling
reference traversal
controlled transformation
multi-file semantic access
```

Candidates:

```text
Scalar
Redocly
```

OAIT-owned source evidence remains authoritative before transformation.

## Role D — External validator evidence

Responsibilities:

```text
detect useful OpenAPI conformance problems
emit machine-adaptable diagnostics
provide complementary evidence
```

Candidates:

```text
Scalar
Redocly
IBM
```

A validator need not provide complete OAIT conformance coverage to serve a bounded evidence role.

## Role E — Deterministic conformance fallback

Responsibilities include conformance requirements not reliably supplied by external validators.

This role is:

```text
OAIT-owned
```

Examples already evidenced include:

```text
duplicate parameter identity
undeclared security references
version-aware controls
```

## Role F — Diagnostic adaptation

Candidate-specific diagnostics must be translated through adapters into candidate-neutral evidence before they influence OAIT findings.

This role is:

```text
OAIT-owned adapters
```

External rule identifiers must not become OAIT's public rule IDs.

---

# 9. Mandatory Gates Before Weighted Scoring

Mandatory gates are evaluated before weighted scores.

A candidate that fails a mandatory gate cannot be selected for a role that requires that capability merely because its weighted score is higher.

The primary parser mandatory gates are:

```text
MG-01 OpenAPI 3.0 support
MG-02 OpenAPI 3.1 support
MG-03 OpenAPI 3.2 strategy
MG-04 YAML support
MG-05 JSON support
MG-06 local $ref support
MG-07 multi-file strategy
MG-08 recursive-reference strategy
MG-09 usable TypeScript/JavaScript API
MG-10 compatible dependency license
```

Gate vocabulary:

```text
PASS
PARTIAL
FAIL
NOT_APPLICABLE
```

A `PARTIAL` result must state whether the limitation is acceptable for the proposed role.

---

# 10. Role-Specific Mandatory Gates

The global parser gates must not be applied blindly to every validator.

For example:

```text
IBM OpenAPI 3.2 support
```

is mandatory for a sole OAIT validator or primary parser but may be non-mandatory for a deliberately bounded OAS 3.0/3.1 secondary validator role.

Therefore the decision must record:

```text
candidate
role
required gate
gate result
selection effect
```

This prevents both false exclusion and inappropriate selection.

---

# 11. Mandatory Correctness Rule

A weighted score cannot override demonstrated semantic incompatibility.

The following have priority over score:

```text
OpenAPI version correctness
schema semantic fidelity
source-truth preservation
reference safety
false-positive behavior on valid OpenAPI
false-negative behavior on critical conformance rules
```

Performance is a suitability criterion, not a correctness substitute.

---

# 12. Weighted Criteria

Use the weights established in the parser-validator spike plan unless the evaluation identifies a principled reason to revise them before scoring.

| Criterion                       |   Weight |
| ------------------------------- | -------: |
| OpenAPI 3.0 / 3.1 / 3.2 support |      20% |
| `$ref` and multi-file support   |      15% |
| Source traceability             |      15% |
| Schema semantic fidelity        |      10% |
| Validation capability           |      10% |
| Diagnostic quality              |      10% |
| TypeScript integration          |       5% |
| API stability / maintainability |       5% |
| Performance                     |       5% |
| License and OSS suitability     |       5% |
| **Total**                       | **100%** |

The weights must be frozen before numeric candidate scoring begins.

---

# 13. Weight Interpretation

## OpenAPI version support — 20%

Measures native and architecturally usable handling of:

```text
OAS 3.0
OAS 3.1
OAS 3.2
```

Version preservation alone is insufficient if valid version-specific structures are incorrectly interpreted.

## `$ref` and multi-file support — 15%

Measures:

```text
internal refs
local-file refs
nested refs
recursive refs
multi-file behavior
reference safety
transformation behavior
```

Native access outside OAIT policy controls is not automatically a benefit.

## Source traceability — 15%

Measures the candidate's ability to coexist with OAIT's authoritative SourceIndex and preserve useful provenance.

Because OAIT already owns physical source indexing, this criterion must not incorrectly require the candidate to replace ADR-004/005.

Evaluate:

```text
source information exposed
transformation provenance
pointer usefulness
referenced-file attribution
ability to adapt to OAIT identity
```

## Schema semantic fidelity — 10%

Measures preservation and correct handling of:

```text
OAS 3.0 schema semantics
OAS 3.1 / 3.2 JSON Schema semantics
boolean schemas
nullable semantics
composition
dialects
unknown keywords
recursive schemas
$ref siblings
```

## Validation capability — 10%

Measures conformance-detection usefulness.

This must use SPIKE-006 TP/TN/FP/FN evidence rather than the mere existence of a `validate()` function.

## Diagnostic quality — 10%

Measures:

```text
structured identity
message usefulness
code/rule identifier
pointer/object path
file attribution
line/column
OAIT mapping adaptability
```

## TypeScript integration — 5%

Measures:

```text
programmatic API
ESM compatibility
published typings
NodeNext compatibility
integration friction
```

Known third-party declaration defects must be recorded.

## API stability / maintainability — 5%

Measures evidence relevant to:

```text
public supported API
replaceability
dependency shape
maintenance risk
architecture coupling
```

Do not use popularity as a proxy.

## Performance — 5%

Measures operational suitability from SPIKE-007.

Performance scoring must distinguish successful equivalent work from failed/partial processing.

## License and OSS suitability — 5%

Measures:

```text
direct license
known transitive license concerns
distribution compatibility evidence
dependency-security posture where relevant
```

Security risk should also influence maintainability/risk discussion and must not be hidden inside license scoring.

---

# 14. Numeric Scoring Scale

Each criterion is scored from `0` to `5`.

## Score 5 — Excellent

```text
Meets the role strongly.
No material demonstrated limitation.
```

## Score 4 — Strong

```text
Meets the role with minor or manageable limitations.
```

## Score 3 — Adequate

```text
Usable with meaningful constraints or fallback requirements.
```

## Score 2 — Weak

```text
Substantial limitations.
Useful only in a bounded role.
```

## Score 1 — Poor

```text
Minimal useful capability for this criterion.
```

## Score 0 — Unsupported / incompatible

```text
Required capability is absent or unusable.
```

No half-points should be used unless a specific reason is documented before scoring.

---

# 15. Weighted Score Calculation

For criterion `i`:

```text
weighted contribution
=
(score / 5)
×
criterion weight
```

Total:

```text
Σ weighted contributions
```

Maximum:

```text
100
```

Example:

```text
score = 4
weight = 15

(4 / 5) × 15 = 12
```

The raw score and weighted contribution must both be shown.

---

# 16. Scoring Discipline

The evaluator must not:

```text
change weights after seeing totals
invent capabilities not demonstrated
award points because a package is popular
penalize a candidate for responsibilities OAIT intentionally owns elsewhere
reward speed for incomplete processing
average away mandatory-gate failures
```

Every score must include concise evidence rationale.

---

# 17. Candidate-Level Matrix

Produce a matrix for:

```text
Scalar
Redocly
IBM
```

using the frozen criteria.

The matrix is comparative evidence, not by itself the final architecture.

IBM may receive a low overall score while still being useful in a bounded validator role.

Likewise, the highest overall candidate score does not imply that OAIT should delegate every parser/validator responsibility to that candidate.

---

# 18. Role-Fit Matrix

After global scoring, create a separate role-fit matrix.

Required roles:

| Role                               | Scalar | Redocly | IBM | OAIT-owned |
| ---------------------------------- | ------ | ------- | --- | ---------- |
| Physical source indexing           |        |         |     |            |
| Primary parser                     |        |         |     |            |
| Semantic normalization input       |        |         |     |            |
| Bundling/reference transformation  |        |         |     |            |
| Validator evidence                 |        |         |     |            |
| Source-rich diagnostics            |        |         |     |            |
| Deterministic conformance fallback |        |         |     |            |
| Diagnostic adaptation              |        |         |     |            |

Use:

```text
PREFERRED
SUPPORTED
BOUNDED
NOT_SELECTED
NOT_APPLICABLE — OAIT owns adapter boundary
```

---

# 19. Cross-Spike Evidence Matrix

The final evaluation must explicitly summarize each spike.

| Evidence area              | Primary source |
| -------------------------- | -------------- |
| Version/parser support     | SPIKE-001      |
| References                 | SPIKE-002      |
| Source locations           | SPIKE-003      |
| Source indexing technology | SPIKE-LOC-001  |
| OpenAPI 3.2 operations     | SPIKE-004      |
| Schema/dialect fidelity    | SPIKE-005      |
| Validation/diagnostics     | SPIKE-006      |
| Performance/operations     | SPIKE-007      |

For each area record:

```text
Scalar
Redocly
IBM where applicable
architecture consequence
```

---

# 20. Known Evidence Entering the Decision

The evaluation must preserve, rather than silently rediscover, the following established evidence.

## Source indexing

`yaml + jsonc-parser` was selected for authoritative source indexing.

## OpenAPI operations

Both Scalar and Redocly preserve OAS 3.2 operation structures sufficiently for OAIT-owned semantic discovery.

## Schema fidelity

Scalar demonstrated strong raw schema preservation across OAS 3.0/3.1/3.2.

Redocly also preserved canonical structures but its validator/type layer demonstrated important 3.1/3.2 limitations.

## Validation

SPIKE-006 established that no candidate is sufficient as OAIT's sole conformance authority.

## Validator accuracy

The accepted fixture-level summary is:

```text
Scalar
FP 0
FN 5

Redocly
FP 5
FN 13

IBM
FP 0
FN 3 on applicable supported-version invalid corpus
OAS 3.2 NOT_SUPPORTED
```

Counts must be interpreted with their applicable denominators and candidate roles.

## Operational suitability

SPIKE-007 classified:

```text
Scalar
OPERATIONALLY_SUITABLE

Redocly
OPERATIONALLY_SUITABLE

IBM
SUITABLE_WITH_CONSTRAINTS
```

IBM's primary generated multi-file timing was not equivalent successful validation and must not be used as a favorable performance comparison.

## Dependency risk

IBM's pinned dependency graph reproduced eight high-severity transitive vulnerability findings through the IBM/Spectral runtime chain.

This remains a significant operational risk until separately mitigated or a new baseline is evaluated.

---

# 21. Sensitivity Analysis

After calculating the primary weighted matrix, test whether the result is robust to reasonable weighting changes.

At minimum evaluate:

## Scenario A — Correctness emphasis

Increase combined weight of:

```text
OpenAPI support
schema fidelity
validation capability
diagnostic quality
```

while reducing lower-priority operational criteria proportionally.

## Scenario B — Source/provenance emphasis

Increase:

```text
source traceability
reference/multi-file support
```

## Scenario C — Operational emphasis

Increase:

```text
performance
maintainability
TypeScript integration
```

The purpose is not to select a different winner intentionally.

The purpose is to determine whether the preferred role assignment is stable under plausible priorities.

---

# 22. Sensitivity Interpretation

If one candidate remains preferred across plausible weighting scenarios:

```text
ROBUST_DECISION
```

If the result changes under small weight movements:

```text
WEIGHT_SENSITIVE
```

If candidates remain effectively indistinguishable:

```text
TIE_REQUIRES_ROLE_DECISION
```

Do not manufacture precision from small score differences.

---

# 23. Tie-Breaking Order

If candidates are close, use the following priority order:

```text
1. Mandatory gates
2. Semantic correctness
3. Version correctness
4. Source/provenance safety
5. Diagnostic correctness
6. OAIT architectural fit
7. Dependency/security risk
8. Operational performance
9. Weighted score
```

A numerically higher score cannot overcome a materially worse mandatory correctness result.

---

# 24. Security and Dependency Risk Treatment

Security findings must be shown separately from ordinary score totals.

Use:

```text
LOW_CONCERN
MANAGEABLE_CONCERN
SIGNIFICANT_CONCERN
BLOCKING_CONCERN
```

The final decision must explicitly state whether any selected dependency requires:

```text
acceptance
mitigation
upgrade evaluation
containment
replacement
```

Do not assert vulnerability exploitability without evidence.

---

# 25. Decision Output by Role

The final decision section must state, explicitly:

```text
Role
Selected technology
Why selected
Why alternatives were not selected
Known constraints
Required adapter/ownership boundary
```

A valid decision may resemble:

```text
Source indexing
→ Technology A

Primary OpenAPI parser
→ Technology B

External validator evidence
→ Technology C or bounded combination

Deterministic conformance
→ OAIT-owned
```

Do not assume this structure before completing the evidence matrix.

---

# 26. Rejected and Bounded Alternatives

The final report must distinguish:

```text
REJECTED
BOUNDED_ROLE
DEFERRED
```

### REJECTED

Not suitable for the evaluated role.

### BOUNDED_ROLE

Useful only for a deliberately constrained responsibility.

### DEFERRED

Potentially useful later, but not required for OAIT v0.1.

This avoids incorrectly describing a useful secondary tool as globally "failed."

---

# 27. Architecture Consequences

The evaluation must describe consequences for:

```text
source-processing pipeline
parser adapter
normalization boundary
reference traversal
validator adapter
diagnostic evidence model
OAIT deterministic rule engine
finding generation
dependency isolation
testing
```

Do not implement those components yet.

---

# 28. Adapter Boundary Requirement

Any selected third-party parser or validator must remain replaceable.

The production architecture should prevent candidate-specific types or rule IDs from leaking across OAIT core boundaries.

Conceptually:

```text
Third-party API
      ↓
OAIT Adapter
      ↓
Candidate-neutral evidence/domain input
      ↓
OAIT core
```

The decision must identify where this boundary occurs for each selected technology.

---

# 29. Required Final Recommendation

The final evaluation must answer:

1. What technology owns physical YAML source indexing?
2. What is the preferred primary OpenAPI parser?
3. Is a separate bundler/reference transformation dependency required?
4. What external validator evidence should OAIT consume?
5. Should IBM be part of OAIT v0.1?
6. Should Redocly validation be used despite observed false positives?
7. Should Scalar validation be used despite incomplete rule coverage?
8. Which conformance rules must OAIT implement itself?
9. How should source locations be correlated to validator evidence?
10. Should OAIT ever use canonical full dereference?
11. Which candidate-specific types must remain behind adapters?
12. Which dependency risks require follow-up?
13. Is the chosen architecture suitable for interactive CLI use?
14. Is it suitable for CI use?
15. Are any additional technical spikes required?
16. Which ADRs should now be written?

---

# 30. Required ADR Recommendations

Do not create ADRs during the evaluation.

Instead identify the ADRs justified by the final decision.

Likely topics may include:

```text
primary OpenAPI parser
hybrid validation strategy
external diagnostic adaptation
```

Only recommend ADRs actually supported by the final evidence.

Existing ADR-003, ADR-004, and ADR-005 remain authoritative.

---

# 31. Non-Goals

Do not implement:

```text
ParserAdapter
ValidatorAdapter
DiagnosticAdapter
ConformanceRuleEngine
normalization code
production caching
CLI commands
MCP
AI
CI workflows
```

This phase produces a decision document only.

---

# 32. Decision Review Gate

Before the evaluation is considered complete, verify:

```text
all spikes are represented
all mandatory gates are explicit
weights total 100%
scoring scale is consistent
every score has evidence
no unsupported assumptions drive selection
sensitivity analysis is included
role decisions are explicit
risks are retained
ADRs are recommended but not created
```

---

# 33. Deliverable

The authoritative deliverable is:

```text
docs/architecture/parser-validator-evaluation.md
```

The final document should contain both:

```text
evaluation method
+
completed evaluation results
```

This file will become the evidence basis for subsequent ADRs.

---

# 34. Exit Criteria

This activity is complete when OAIT can answer:

> **Which parser and validator technologies should OAIT use for each architectural role, why are they preferred over the alternatives, what risks remain, and what ADRs are now justified?**

The result must be:

```text
evidence-traceable
mandatory-gate compliant
numerically reproducible
role-aware
architecturally consistent
risk-aware
ready for ADR formalization
```

---

# 35. Guiding Principle

> **Choose technologies by the correctness and value they contribute to OAIT's architecture, not by how many responsibilities a single library can absorb.**

---

# PART II — Completed Evaluation

# 36. Executive Decision Summary

The recommended OAIT v0.1 technology assignment, pending review, is:

```text
Physical source indexing
  → OAIT-owned yaml + jsonc-parser (ADR-005; unchanged)

Primary OpenAPI semantic ingestion
  → Scalar behind an OAIT Parser Adapter

Bundling / reference transformation
  → Scalar/json-magic as an optional operational helper
  → never canonical source truth

Default external validator evidence
  → bounded Scalar validation evidence

Redocly validation
  → not selected for authoritative or default v0.1 validation
  → deferred source-rich diagnostic enrichment option

IBM validation
  → deferred from the default v0.1 product
  → potential future bounded CI integration after baseline/security review

Deterministic conformance and diagnostic adaptation
  → OAIT-owned
```

Scalar is preferred over Redocly for primary semantic ingestion because it passes the parser gates, demonstrated stronger raw schema/version fidelity, produced materially better applicable validation accuracy, and fits the interactive in-process architecture. The decision is not based on speed alone. No external validator is sufficient as OAIT's conformance authority.

# 37. Cross-Spike Evidence Synthesis

| Stage | Direct finding | Candidate consequence | Architecture consequence | Classification |
| --- | --- | --- | --- | --- |
| SPIKE-001 — version/parser support | Scalar and Redocly processed representative YAML/JSON OAS 3.0.4, 3.1.2, and 3.2.0 through public APIs. | Both remain primary-parser candidates; IBM was not a parser candidate. | Version must remain explicit in normalized input. | DIRECT |
| SPIKE-002 — references | Both resolve/bundle local and nested references, but rewrite external references and do not preserve complete declaration/target provenance; Scalar full dereference can create cyclic graphs. | Bundling is useful but transformed paths cannot be authoritative. | OAIT owns loading policy, raw reference evidence, reference chains, and filesystem/network controls; full dereference is noncanonical. | DIRECT / INFERRED |
| SPIKE-003 — locations | Neither primary parser supplied sufficient authoritative original locations through its public parser API; Redocly supplied stronger diagnostic locations. | Neither replaces an OAIT source-location index. | Pre-transformation `documentUri + pointer` remains OAIT-owned. | DIRECT |
| SPIKE-LOC-001 — indexing technology | `yaml` and `jsonc-parser` produced the required physical source index evidence. | Scalar, Redocly, and IBM are not candidates for this role. | ADR-005 remains final for physical indexing. | DIRECT |
| SPIKE-004 — OAS 3.2 operations | Scalar and Redocly preserved `query`, `additionalOperations`, and `querystring` structures sufficiently for OAIT discovery. | Both can feed version-aware operation normalization. | OAIT discovers operations from version semantics, not a fixed legacy method list. | DIRECT / INFERRED |
| SPIKE-005 — schemas/dialects | Scalar preserved raw 3.0/3.1/3.2 schema semantics strongly. Redocly also preserved structures, but its types/`struct` layer mishandled valid booleans and unknown keywords. | Scalar has the strongest semantic-ingestion evidence; Redocly preservation remains useful but validation behavior is separate. | OAIT owns effective dialect decisions and a candidate-neutral canonical schema value; refs remain graph boundaries. | DIRECT / INFERRED |
| SPIKE-006 — validation | Scalar: 19 TN/0 FP and 21 TP/5 FN. Redocly: 14 TN/5 FP and 13 TP/13 FN. IBM supported corpus: 10 TN/0 FP and 21 TP/3 FN; OAS 3.2 NOT_SUPPORTED. All were composite-role viable, none sole-validator viable. | Scalar offers useful bounded evidence; Redocly is not safe as authoritative/default validation; IBM is strong only in a bounded supported-version role. | OAIT deterministic rules must cover external false negatives and stable rule semantics. | DIRECT / INFERRED |
| SPIKE-007 — operations | Scalar and Redocly were operationally suitable. IBM was suitable with constraints, had ~2.4 s large CLI validation, significant dependency concern, and only PARTIAL multi-file suitability after correction. | Scalar/Redocly fit in-process roles; IBM subprocess/security constraints are material. | The hybrid architecture is operationally reasonable, but failed/partial work receives no performance credit. | DIRECT / DERIVED |

The eight stages required by the frozen methodology are represented. Corrected SPIKE-006 rates and corrected SPIKE-007 RSS/multi-file evidence supersede earlier intermediate summaries.

# 38. Mandatory Gate Results

## 38.1 Primary parser gates

| Gate | Scalar | Selection effect | Redocly | Selection effect | IBM primary-parser relevance |
| --- | --- | --- | --- | --- | --- |
| MG-01 OAS 3.0 | PASS — SPIKE-001/005 | Permits | PASS — SPIKE-001/005 | Permits | NOT_APPLICABLE as parser; supported only in validator role |
| MG-02 OAS 3.1 | PASS — SPIKE-001/005 | Permits | PASS — SPIKE-001/005 | Permits | NOT_APPLICABLE as parser |
| MG-03 OAS 3.2 strategy | PASS — SPIKE-001/004/005 | Permits | PASS — preservation/discovery evidence in SPIKE-004/005 | Permits parser role despite validator defects | FAIL for primary/sole role; SPIKE-006 NOT_SUPPORTED |
| MG-04 YAML | PASS — SPIKE-001 | Permits | PASS — SPIKE-001 | Permits | PASS for CLI input, but not parser selection |
| MG-05 JSON | PASS — SPIKE-001 | Permits | PASS — SPIKE-001 | Permits | PASS for CLI input, but not parser selection |
| MG-06 local `$ref` | PASS — SPIKE-002 | Permits with OAIT policy boundary | PASS — SPIKE-002 | Permits with OAIT policy boundary | PASS for bounded cases; not sufficient for parser role |
| MG-07 multi-file strategy | PARTIAL — transformed refs/provenance | Permits because ADR-004 supplies authoritative loading/evidence | PARTIAL — transformed refs/provenance | Permits for the same reason | PARTIAL; SPIKE-007 main corpus non-equivalent and targeted traversal only |
| MG-08 recursion | PASS — SPIKE-002/005/007 | Permits; no canonical full dereference | PASS — SPIKE-002/005/007 | Permits | PASS for supported validation controls |
| MG-09 usable TS/JS API | PARTIAL — public ESM API, dependency declaration defects | Permits behind adapter with `skipLibCheck` constraint | PARTIAL — public ESM API, React/Markdoc declaration defects | Permits behind adapter | FAIL for primary parser: documented integration is CLI-only |
| MG-10 compatible license | PASS — MIT | Permits; normal transitive review | PASS — MIT | Permits; normal transitive review | PASS direct Apache-2.0, but not enough to overcome role failures |

Scalar and Redocly both pass or have architecturally acceptable PARTIAL results for primary parsing. IBM cannot be selected as primary parser because it lacks the evidenced parser API and OAS 3.2 support required for that role. Mandatory gates take precedence over weighted totals.

# 39. Frozen Primary Weights

**Weights were fixed by commit `d143f86` before candidate scoring.** No criterion, scale, gate, or tie-break rule was changed.

| Criterion | Weight |
| --- | ---: |
| OpenAPI 3.0 / 3.1 / 3.2 support | 20% |
| `$ref` and multi-file support | 15% |
| Source traceability | 15% |
| Schema semantic fidelity | 10% |
| Validation capability | 10% |
| Diagnostic quality | 10% |
| TypeScript integration | 5% |
| API stability / maintainability | 5% |
| Performance | 5% |
| License and OSS suitability | 5% |
| **Total** | **100%** |

The arithmetic sum is exactly `20 + 15 + 15 + 10 + 10 + 10 + 5 + 5 + 5 + 5 = 100`.

# 40. Primary Candidate Scoring

All raw scores are integers from 0 through 5. Contribution is `(score / 5) × weight`.

| Criterion | Weight | Scalar score | Scalar contribution | Redocly score | Redocly contribution | IBM score | IBM contribution |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| OpenAPI support | 20 | 5 | 20.0 | 4 | 16.0 | 2 | 8.0 |
| `$ref` / multi-file | 15 | 4 | 12.0 | 4 | 12.0 | 2 | 6.0 |
| Source traceability | 15 | 3 | 9.0 | 4 | 12.0 | 2 | 6.0 |
| Schema fidelity | 10 | 5 | 10.0 | 4 | 8.0 | 2 | 4.0 |
| Validation capability | 10 | 4 | 8.0 | 2 | 4.0 | 4 | 8.0 |
| Diagnostic quality | 10 | 2 | 4.0 | 3 | 6.0 | 4 | 8.0 |
| TypeScript integration | 5 | 3 | 3.0 | 3 | 3.0 | 1 | 1.0 |
| API stability / maintainability | 5 | 4 | 4.0 | 3 | 3.0 | 1 | 1.0 |
| Performance | 5 | 5 | 5.0 | 5 | 5.0 | 3 | 3.0 |
| License / OSS | 5 | 5 | 5.0 | 5 | 5.0 | 4 | 4.0 |
| **Total** | **100** |  | **80.0** |  | **74.0** |  | **49.0** |

## 40.1 Criterion rationales

| Criterion | Scalar rationale | Redocly rationale | IBM rationale |
| --- | --- | --- | --- |
| OpenAPI support | `5`: public runtime evidence across 3.0/3.1/3.2, including 3.2 operation/schema structures (SPIKE-001/004/005). | `4`: preserves all three families and 3.2 operations, but `struct` misinterprets some valid 3.1/3.2 constructs (SPIKE-004/005/006). | `2`: useful 3.0/3.1 validation only; 3.2 explicitly NOT_SUPPORTED (SPIKE-006/007). |
| `$ref` / multi-file | `4`: internal/local/nested/recursive support; bundling rewrites refs and lacks complete provenance (SPIKE-002/005). | `4`: strong bundle and target-file evidence; transformed paths are noncanonical (SPIKE-002/003/005). | `2`: missing-file/internal evidence exists, but multi-file suitability is PARTIAL and the primary timing corpus failed equivalence (SPIKE-006/007). |
| Source traceability | `3`: paths are sometimes adaptable, but validation metadata is sparse; coexistence with SourceIndex is feasible (SPIKE-003/006). | `4`: best native diagnostic file/pointer/line evidence and referenced-target attribution; still cannot replace original SourceIndex (SPIKE-003/006). | `2`: paths/rules/lines can help, but file/column and multi-file correlation are incomplete (SPIKE-006/007). |
| Schema fidelity | `5`: strongest raw preservation for 3.0 distinctions, booleans, dialects, recursion, unknown keywords, and ref siblings (SPIKE-005). | `4`: runtime preservation is strong, but type/validator behavior is materially weaker (SPIKE-005). | `2`: no primary-parser fidelity evidence; limited supported-version structural validation is useful but not equivalent (SPIKE-005/006). |
| Validation capability | `4`: 0 FP and 5 FN on the applicable corpus; useful but incomplete (SPIKE-006). | `2`: 5 FP and 13 FN, including valid modern constructs; unsuitable as authority (SPIKE-006). | `4`: 0 FP and 3 FN on the smaller supported-version corpus, uniquely detecting duplicate operation IDs; no 3.2 (SPIKE-006). |
| Diagnostic quality | `2`: messages and occasional paths/codes, but weak severity/file/line evidence and incomplete mapping (SPIKE-006). | `3`: strongest structured source evidence, offset by diagnostic correctness and broad `struct` identity (SPIKE-006). | `4`: useful code-bearing structured CLI diagnostics for supported versions, with weaker source completeness (SPIKE-006). |
| TypeScript integration | `3`: public in-process ESM API; NodeNext declaration defects require containment (SPIKE-005/007). | `3`: public ESM API; React/Markdoc declaration defects and type/runtime gaps (SPIKE-005/007). | `1`: documented integration is a CLI subprocess, not a public programmatic TypeScript API (SPIKE-006/007). |
| Maintainability | `4`: public replaceable APIs, modest dependency tree, LOW_CONCERN audit posture (SPIKE-007). | `3`: public replaceable APIs and LOW_CONCERN posture, but broader dependency/type surface (SPIKE-007). | `1`: large CLI/Spectral tree, eight high audit findings, upgrade pressure, and process integration (SPIKE-007). |
| Performance | `5`: successful large warm load/validate approximately 71/95 ms and operationally suitable (SPIKE-007). | `5`: successful large bundle/lint approximately 26/29 ms and operationally suitable; speed does not repair diagnostics (SPIKE-007). | `3`: successful large single-file CLI approximately 2.4 s meets target, but startup/process overhead matters and 563 ms multi-file is excluded as non-equivalent (SPIKE-007). |
| License / OSS | `5`: direct MIT licenses; no known direct blocker, normal transitive review (SPIKE-007). | `5`: direct MIT; same qualification (SPIKE-007). | `4`: direct Apache-2.0 has no known blocker, but shared unknown manifests and significant dependency risk require review; security is separately dispositioned (SPIKE-007). |

# 41. Weighted Results and Interpretation

| Rank | Candidate | Total | Mandatory-role interpretation |
| ---: | --- | ---: | --- |
| 1 | Scalar | 80.0 | Eligible and preferred primary parser; bounded validator evidence |
| 2 | Redocly | 74.0 | Eligible parser alternative; not selected for default validation |
| 3 | IBM | 49.0 | Not eligible as primary parser; possible bounded supported-version validator only |

The six-point Scalar/Redocly difference is not treated as self-executing. The global candidate score includes validator-layer evidence. The primary-parser decision therefore relies on role-specific mandatory gates and parser/semantic-ingestion evidence; Redocly's validator defects do not make its parser ineligible. The frozen tie-break order favors Scalar through semantic-ingestion fidelity, architectural fit, and dependency shape. Redocly's source evidence remains a role-specific strength.

# 42. Role-Fit Matrix

| Role | Scalar | Redocly | IBM | OAIT-owned |
| --- | --- | --- | --- | --- |
| Physical source indexing | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | PREFERRED — `yaml + jsonc-parser` |
| Primary parser | PREFERRED | SUPPORTED | NOT_SELECTED | Diagnostic/parser adapter boundary |
| Semantic normalization input | PREFERRED | SUPPORTED | NOT_APPLICABLE | PREFERRED normalized domain model |
| Bundling/reference transformation | PREFERRED optional helper | SUPPORTED optional alternative | NOT_SELECTED | PREFERRED source policy/provenance |
| Validator evidence | SUPPORTED bounded/default | NOT_SELECTED default | BOUNDED | PREFERRED deterministic fallback |
| Source-rich diagnostics | BOUNDED | PREFERRED capability, deferred integration | BOUNDED supported versions | PREFERRED identity enrichment via SourceIndex |
| Deterministic conformance fallback | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | PREFERRED |
| Diagnostic adaptation | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | PREFERRED candidate-specific adapters |

The IBM capability is `BOUNDED`; its inclusion in the default v0.1 deployment is formally `DEFERRED` in Section 47.

# 43. Sensitivity Analysis

Scenario weights were defined as simple priority shifts, not tuned to produce an outcome. Each totals exactly 100%.

| Criterion | Primary | A: correctness | B: source/provenance | C: operational |
| --- | ---: | ---: | ---: | ---: |
| OpenAPI support | 20 | 25 | 15 | 15 |
| `$ref` / multi-file | 15 | 10 | 25 | 10 |
| Source traceability | 15 | 10 | 25 | 10 |
| Schema fidelity | 10 | 15 | 8 | 8 |
| Validation capability | 10 | 15 | 7 | 8 |
| Diagnostic quality | 10 | 15 | 7 | 8 |
| TypeScript integration | 5 | 2 | 3 | 10 |
| Maintainability | 5 | 3 | 3 | 12 |
| Performance | 5 | 2 | 3 | 12 |
| License / OSS | 5 | 3 | 4 | 7 |
| **Total** | **100** | **100** | **100** | **100** |

Applying the unchanged raw scores:

| Scenario | Scalar | Redocly | IBM | Primary-parser outcome |
| --- | ---: | ---: | ---: | --- |
| Primary | 80.0 | 74.0 | 49.0 | Scalar |
| A — correctness | 80.6 | 71.0 | 52.6 | Scalar |
| B — source/provenance | 77.6 | 76.0 | 46.6 | Scalar, close; tie-break required |
| C — operational | 81.2 | 74.6 | 47.2 | Scalar |

The role assignment is a **ROBUST_DECISION**. Redocly approaches Scalar under source/provenance emphasis, as expected from its source-rich diagnostics, but Scalar remains preferred after mandatory gates, semantic-ingestion fidelity, and architectural-fit considerations. Redocly remains the strongest source-rich diagnostic capability rather than becoming the semantic ingestion choice.

# 44. Tie-Break Analysis

The frozen order was applied explicitly:

1. **Mandatory gates:** Scalar and Redocly both pass or acceptably partially pass the primary-parser gates and are eligible.
2. **Semantic correctness:** Scalar has the semantic-ingestion advantage through stronger raw/untransformed schema evidence, a cleaner evidenced distinction between parsing and transformation, and the strongest fit with the normalized semantic-ingestion role.
3. **Version correctness:** There is no material separating parser-role failure. Both candidates have an acceptable OAS 3.0/3.1/3.2 parser strategy and preserve the important evidenced structures.
4. **Source/provenance safety:** Redocly exposes stronger native diagnostic source evidence, but neither candidate replaces OAIT's authoritative SourceIndex or canonical source identity.
5. **Diagnostic correctness:** Scalar clearly outperformed Redocly in applicable validation correctness. Redocly's five false positives and thirteen false negatives are material to the external-validator role, but do not invalidate its parser eligibility.
6. **Architectural fit:** Scalar can serve as the selected semantic parser and bounded validation-evidence provider behind one adapter/dependency family, while retaining OAIT ownership boundaries.
7. **Dependency/security risk:** Both have LOW_CONCERN observed security posture; Scalar has the smaller evidenced dependency surface.
8. **Operational performance:** Both are comfortably suitable, so performance does not determine the parser choice.
9. **Weighted score:** Scalar remains first, confirming rather than creating the recommendation.

The source-emphasis sensitivity gap is small. Semantic-ingestion fidelity and architectural fit resolve it for Scalar; parser-level version correctness does not separate the candidates.

# 45. Security and Dependency Disposition

| Technology | Risk | Disposition for v0.1 |
| --- | --- | --- |
| `yaml` + `jsonc-parser` | Governed by ADR-005 evidence | Selected; normal lockfile, license, and vulnerability controls required |
| Scalar/json-magic | LOW_CONCERN in the pinned experiment | Select behind adapter; monitor pinned dependencies and declaration issues |
| Redocly | LOW_CONCERN in the pinned experiment | Not selected by default; no new runtime dependency required for v0.1 decision |
| IBM/Spectral | SIGNIFICANT_CONCERN; eight high findings, exploitability not established | Defer from default v0.1. Any future integration requires baseline-upgrade evaluation, renewed audit, multi-file verification, and process-boundary review |

IBM's audit result does not prove exploitability and is not, by itself, a universal rejection. Combined with CLI-only integration, OAS 3.2 absence, large dependency graph, and partial multi-file evidence, it causes deferral from default v0.1.

# 46. Final Technology Decision by Role

## 46.1 Physical source indexing

Use OAIT-owned `yaml + jsonc-parser` exactly as selected by ADR-005. Scalar, Redocly, and IBM do not compete for this responsibility.

## 46.2 Primary parser and normalization input

Select Scalar as the preferred primary OpenAPI parser. Its untransformed parsed specification feeds an OAIT Parser Adapter, which constructs candidate-neutral, version-aware input to the normalized domain model. Scalar types, error types, lifecycle objects, and cyclic dereference results remain inside the adapter.

Redocly remains a supported alternative, not the selected primary. Both candidates have an acceptable version strategy for parsing, but Scalar has stronger semantic-ingestion fidelity and architectural-fit evidence.

## 46.3 Bundling and reference transformation

No canonical bundler is required. Prefer Scalar/json-magic as an optional operational helper when transformed semantic access is necessary because it accompanies the selected parser. Minimize reliance on bundled representations. Redocly bundling remains a supported alternative for a future bounded use, not a second default dependency.

OAIT source loading, access policy, raw declarations, target identity, and reference graph are captured before any bundle. Bundled pointers are never original source pointers.

## 46.4 Scalar validation

Consume Scalar validation as bounded default evidence because it showed zero false positives and useful coverage in the tested applicable corpus. Scalar is already the selected parser stack, so consuming this evidence does not introduce a second default validator dependency. It is not authoritative: five false negatives included missing `info.version`, duplicate parameter identity, duplicate `operationId`, undeclared security requirements, and the referenced-file target violation. Rule coverage is incomplete, source/diagnostic metadata is sparse, and OAIT deterministic fallback plus SourceIndex correlation are required.

SPIKE-007 also observed that separate load and validate operations may repeat processing. Production design should determine whether safe intermediate reuse is possible without weakening correctness.

## 46.5 Redocly validation and source-rich diagnostics

Do not use Redocly `struct` as authoritative or default v0.1 validation. Five false positives and thirteen false negatives, including valid boolean schemas, arbitrary schema keywords, and an OAS 3.2 Response-description control, are too costly. Its native file/pointer/line evidence is the strongest observed and may justify deferred, bounded diagnostic enrichment if that benefit can be obtained without treating `struct` correctness as authoritative or adding unnecessary default dependencies.

## 46.6 IBM validation

Defer IBM from the default OAIT v0.1 product. It provides valuable OAS 3.0/3.1 code-bearing evidence and uniquely detected duplicate operation IDs, but lacks OAS 3.2, uses a subprocess, takes about 2.4 seconds for the successful large input, carries significant dependency risk, and has only partial multi-file suitability. A future optional CI-only integration requires a newly reviewed baseline; this document does not select it.

## 46.7 Deterministic conformance fallback

OAIT must own deterministic evaluation for externally missed requirements, at minimum the evidenced duplicate parameter identity and undeclared security requirement cases. OAIT also owns version-aware applicability, stable rule meaning, suppression/deduplication, and fallback for candidate-specific false-negative gaps. This is not a claim that every OAS rule must be reimplemented; coverage follows the reviewed rule catalog and evidence.

## 46.8 Diagnostic adaptation

```text
Third-party validator
        ↓
Candidate-specific Diagnostic Adapter
        ↓
Candidate-neutral conformance evidence
        ↓
OAIT Rule / Finding layer
```

Vendor codes and types remain internal. Vendor severity is evidence only. OAIT owns source identity and may enrich candidate pointer/object-path evidence through SourceIndex. Exact English-message matching may support observation but must not become a stable public contract.

# 47. Rejected, Bounded, and Deferred Alternatives

| Alternative | Classification | Reason |
| --- | --- | --- |
| Redocly as primary parser | DEFERRED | Technically viable primary-parser alternative, but not required for OAIT v0.1 because Scalar is preferred on semantic-ingestion and architectural-fit evidence. |
| Redocly `struct` as authoritative/default validator | REJECTED for that role | Demonstrated FP/FN behavior violates correctness guardrails. |
| Redocly source-rich enrichment | DEFERRED | Useful evidence, but not required for v0.1 and must not import incorrect validation semantics. |
| IBM as primary or sole validator | REJECTED | No OAS 3.2 and no complete conformance coverage. |
| IBM optional supported-version CI validator | DEFERRED | Potential value after version, security, subprocess, and multi-file reassessment. |
| Full third-party dereference as canonical model | REJECTED | Loses canonical reference/source boundaries and can create cyclic runtime graphs. |
| Two default bundlers | REJECTED for v0.1 | Adds dependency and transformation complexity without demonstrated need. |

# 48. Architecture Consequences

1. The source-processing pipeline loads and indexes every physical resource before third-party transformation.
2. A Scalar Parser Adapter is the only boundary allowed to expose Scalar parser types.
3. Normalization consumes candidate-neutral parsed values plus OAIT source/reference evidence.
4. Reference traversal obeys OAIT policy; bundling is optional and noncanonical.
5. Scalar validation evidence crosses a candidate-specific Diagnostic Adapter, not directly into findings.
6. The diagnostic evidence model retains vendor payload internally while OAIT owns rule IDs, severity, applicability, and source identity.
7. OAIT deterministic conformance covers documented candidate gaps and prevents candidate replacement from changing public findings.
8. Finding generation uses OAIT SourceIndex for canonical correlation and line/column enrichment.
9. Redocly and IBM are not default v0.1 dependencies under this recommendation, reducing dependency/runtime exposure.
10. Tests need candidate-contract fixtures, version-semantic fixtures, deterministic fallback tests, and adapter replacement tests.

# 49. Risks and Follow-Ups

- Scalar dependency declarations require `skipLibCheck` in the experimental NodeNext setup; production compilation policy must be reviewed without leaking candidate types.
- Scalar validation remains incomplete and source-sparse; deterministic rule and SourceIndex integration are required.
- The exact production boundary between raw Scalar load/validation and optional bundle intermediates needs design, not another technology spike.
- SourceIndex/normalization and validator evidence must avoid duplicate parsing where safe, while correctness takes precedence over caching.
- Linux and Windows performance remain unverified; ordinary production CI coverage is required.
- Transitive licenses and vulnerability state must be rechecked from the production lockfile.
- If Redocly enrichment or IBM CI validation is reconsidered, use a separately reviewed decision/baseline rather than silently adding them.

# 50. Answers to Required Decision Questions

1. **What owns physical YAML/JSON source indexing?** OAIT-owned `yaml + jsonc-parser` under ADR-005.
2. **Preferred primary parser?** Scalar 0.28.10 with json-magic 0.12.19 behind an adapter.
3. **Is a separate bundler required?** No canonical bundler. Scalar/json-magic is an optional helper; pre-transformation OAIT evidence is authoritative.
4. **What validator evidence should OAIT consume?** Bounded Scalar validation evidence plus OAIT deterministic fallback.
5. **Should IBM be in default v0.1?** No; defer it. A future optional CI role needs renewed evidence.
6. **Should Redocly validation be used?** Not as authoritative or default validation; source-rich enrichment is deferred.
7. **Should Scalar validation be used?** Yes, as nonauthoritative evidence with explicit fallback.
8. **Which conformance requirements remain OAIT-owned?** At least duplicate parameter identity, undeclared security requirements, version applicability, stable rule semantics, and coverage of evidenced external gaps.
9. **How do diagnostics correlate to SourceIndex?** Through candidate-specific adapters using structured pointer/path/file evidence; OAIT resolves canonical document URI and pointer and supplies presentation ranges.
10. **Canonical full dereference?** Never. Preserve reference boundaries; use dereference only as a bounded operational view if explicitly needed.
11. **Which third-party types stay behind adapters?** All parser documents/types, bundle lifecycle/provenance objects, diagnostic/error/rule/severity types, and IBM CLI payloads.
12. **Dependency follow-up?** Scalar declaration/lockfile monitoring; normal license/audit review; IBM upgrade/security reassessment if reconsidered.
13. **Interactive CLI suitability?** Yes for the Scalar/OAIT in-process architecture.
14. **CI suitability?** Yes; headless behavior was verified on macOS, with Linux/Windows CI still required.
15. **Further technical spikes?** None required before the summary/ADRs. Targeted production design tests and any future deferred-candidate baseline evaluation are follow-ups, not blockers.
16. **Which ADRs?** Primary Scalar parser; hybrid external-evidence plus OAIT deterministic validation; candidate diagnostic-adaptation boundary.

# 51. ADR Recommendations

Prepare, after review of this evaluation:

1. **Select Scalar for primary OpenAPI semantic ingestion.** Record exact role, adapter boundary, supported versions, optional json-magic bundling, and noncanonical dereference constraint.
2. **Use a hybrid conformance strategy.** Record bounded external validator evidence plus OAIT-owned deterministic rules, applicability, severity, and finding semantics.
3. **Use candidate-specific diagnostic adapters.** Record internal vendor codes/types, SourceIndex enrichment, canonical source identity, and prohibition on message-text public contracts.

Do not duplicate ADR-003, ADR-004, or ADR-005.

# 52. Decision Review Gate

| Check | Result |
| --- | --- |
| All eight spike stages represented | PASS |
| Mandatory gates explicit | PASS |
| Frozen weights sum to 100% | PASS |
| Scores are integer 0–5 | PASS |
| Weighted arithmetic reproducible | PASS |
| Every score has spike evidence | PASS |
| IBM 3.2 limitation visible | PASS |
| Redocly FP/FN visible | PASS |
| Scalar validation gaps visible | PASS |
| IBM security and corrected multi-file evidence visible | PASS |
| ADR-005 source indexing unchanged | PASS |
| Role-fit and sensitivity complete | PASS |
| Tie-break order applied | PASS |
| No new experiment or candidate introduced | PASS |
| No ADR or production implementation created | PASS |

# 53. Final Conclusion

The recommended technology decision, pending review, is to use OAIT-owned `yaml + jsonc-parser` source indexing, Scalar as the primary semantic parser and optional noncanonical bundling helper, bounded Scalar validation evidence, and OAIT-owned deterministic conformance and diagnostic adaptation. Redocly remains a capable but unselected parser alternative and a deferred source-rich diagnostic option. IBM is deferred from default v0.1 despite useful supported-version evidence because its role limitations and operational/dependency risks outweigh incremental value for the initial architecture.

This assignment remains stable under correctness, source/provenance, and operational sensitivity scenarios. It is ready for evidence review and, once accepted, ADR formalization.
