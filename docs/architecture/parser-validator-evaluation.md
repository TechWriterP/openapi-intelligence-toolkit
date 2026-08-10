# Parser-Validator Technology Evaluation and Decision

**Status:** Planned
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
NOT_APPLICABLE
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
ß