# ADR-007: Adopt Hybrid Validation and Deterministic Conformance Strategy

**Status:** Accepted  
**Date:** 2026-08-10  
**Decision owners:** OAIT Architecture  
**Applies to:** OAIT v0.1 and later  
**Related documents:** `parser-validator-evaluation.md`, `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`, `ADR-006-select-scalar-as-primary-openapi-parser.md`, `openapi-quality-model.md`, `rule-catalog.md`, `SPIKE-006-validator-capabilities-and-diagnostics.md`, `SPIKE-007-performance-and-operational-suitability.md`

---

## 1. Context

The OpenAPI Intelligence Toolkit (OAIT) must evaluate OpenAPI descriptions for conformance and quality while producing stable, explainable findings.

The validation architecture must support:

- OpenAPI 3.0.
- OpenAPI 3.1.
- OpenAPI 3.2.
- Single-file and multi-file descriptions.
- Local and recursive references.
- Version-aware requirements.
- Stable OAIT rule identities.
- Canonical source correlation.
- Deterministic behavior suitable for CLI, CI, and future automated remediation.
- Candidate replaceability.

The completed parser-validator evaluation established that no evaluated third-party validator is sufficient to act as OAIT's sole conformance authority.

SPIKE-006 evaluated:

```text
@scalar/openapi-parser@0.28.10
@redocly/openapi-core@2.40.0
ibm-openapi-validator@1.37.15
```

for validation accuracy and diagnostic usefulness.

SPIKE-007 evaluated their operational suitability.

The final evaluation selected Scalar as OAIT's primary semantic parser under ADR-006 and recommended that OAIT use bounded Scalar validation evidence together with deterministic OAIT-owned rules and authoritative SourceIndex correlation.

---

## 2. Problem

Third-party validators provide useful conformance evidence, but their behavior is candidate specific.

They may differ in:

```text
rule coverage
false-positive behavior
false-negative behavior
version support
diagnostic identity
severity
source paths
file attribution
message text
```

OAIT cannot allow these candidate-specific differences to define its public validation semantics.

If OAIT delegated complete conformance authority to one validator, then replacing or upgrading that validator could change:

```text
which issues are detected
how issues are identified
how severe they appear
where they are reported
whether valid OpenAPI is rejected
```

That would make OAIT's rule behavior unstable and vendor dependent.

At the same time, implementing every available OpenAPI validation rule independently would unnecessarily duplicate useful third-party capabilities.

OAIT therefore needs a hybrid architecture that uses external validator evidence where useful while retaining deterministic ownership of stable conformance semantics.

The architectural question is:

> **How should OAIT combine external validator evidence with OAIT-owned deterministic conformance rules while preserving stable rule semantics and canonical source evidence?**

---

## 3. Decision

OAIT v0.1 will adopt a hybrid validation and deterministic conformance strategy.

The architecture is:

```text
bounded external validator evidence
        +
OAIT deterministic conformance rules
        +
OAIT SourceIndex
        ↓
OAIT-owned findings
```

OAIT will use Scalar validation as the default bounded external validation evidence source because:

- Scalar is already selected as the primary semantic parser.
- It demonstrated zero false positives on the tested applicable valid corpus.
- It detected useful conformance violations.
- It does not require introducing a second default validator dependency.
- It is operationally suitable for the intended workflow.

Scalar validation will not be authoritative.

OAIT will implement deterministic conformance checks for requirements not reliably covered by the external validator and will retain ownership of stable rule semantics.

---

## 4. Decision Statement

> **Use Scalar validation as bounded, nonauthoritative external evidence while retaining OAIT ownership of deterministic conformance rules, rule IDs, severity, version applicability, source identity, and finding semantics. Correlate validator evidence through OAIT SourceIndex, and never allow an external validator to become OAIT's sole conformance authority.**

---

## 5. Decision Scope

This ADR defines:

- External validator authority boundaries.
- Default bounded validation evidence.
- OAIT deterministic conformance ownership.
- Relationship between validator evidence and OAIT findings.
- SourceIndex participation.
- Rule identity and severity ownership.
- Upgrade and replacement constraints.
- Alternative validator disposition.

This ADR does not define the detailed implementation of:

```text
DiagnosticAdapter
ValidatorAdapter
ConformanceRuleEngine
```

Those interfaces belong to production design and the subsequent diagnostic-adaptation ADR.

---

## 6. Existing Architectural Decisions

ADR-007 preserves all previously accepted architecture.

### ADR-003

OAIT owns the normalized, version-aware OpenAPI domain model.

### ADR-004

OAIT owns:

- Source loading.
- Source-access policy.
- Canonical source identity.
- Reference evidence.
- Source provenance.

### ADR-005

OAIT uses:

```text
yaml + jsonc-parser
```

for authoritative physical source indexing.

### ADR-006

OAIT uses:

```text
@scalar/openapi-parser@0.28.10
```

as its primary OpenAPI semantic parser behind an OAIT-owned Parser Adapter.

Selecting Scalar as the parser does not make Scalar the conformance authority.

---

## 7. Validation Evidence from SPIKE-006

SPIKE-006 established fixture-level validation accuracy for all three candidates.

### Scalar

Applicable valid corpus:

```text
19 TN
0 FP
```

False-positive rate:

```text
0%
```

Applicable invalid corpus:

```text
21 TP
5 FN
```

False-negative rate:

```text
19.23%
```

### Redocly

Applicable valid corpus:

```text
14 TN
5 FP
```

False-positive rate:

```text
26.32%
```

Applicable invalid corpus:

```text
13 TP
13 FN
```

False-negative rate:

```text
50.00%
```

### IBM OpenAPI Validator

Applicable supported-version valid corpus:

```text
10 TN
0 FP
```

Applicable supported-version invalid corpus:

```text
21 TP
3 FN
```

False-negative rate:

```text
12.50%
```

IBM also had:

```text
11 NOT_SUPPORTED
```

cases associated with unsupported OAS 3.2 coverage.

---

## 8. No Sole Validator Is Viable

SPIKE-006 classified all three candidates as:

```text
COMPOSITE_ROLE_VIABLE
```

and none as:

```text
SOLE_VALIDATOR_VIABLE
```

This is a foundational constraint of this ADR.

The hybrid architecture is not an optional enhancement to an otherwise complete external validator.

It is required because external validation coverage is demonstrably incomplete.

---

## 9. Why Scalar Validation Is Used

Scalar validation is selected as the default external evidence source for OAIT v0.1.

The decision does not mean Scalar provides the broadest possible validation coverage.

It is selected because the complete architecture benefits from:

- Zero observed false positives on the tested applicable valid corpus.
- Useful conformance coverage.
- In-process integration.
- Operational suitability.
- Existing inclusion in the selected parser dependency stack.
- Reduced default dependency complexity.
- Replaceability behind an OAIT evidence boundary.

The selected relationship is:

```text
Scalar parser stack
        ↓
bounded validation evidence
        ↓
OAIT-owned interpretation
```

not:

```text
Scalar validator
        ↓
public OAIT findings
```

without OAIT mediation.

---

## 10. Scalar Validation Limitations

Scalar validation remains incomplete.

SPIKE-006 identified false-negative gaps involving tested cases such as:

- Missing `info.version`.
- Duplicate parameter identity.
- Duplicate `operationId`.
- Undeclared security requirements.
- A violation located in a referenced target file.

These gaps demonstrate that:

```text
successful Scalar validation
≠
proof of OAIT conformance
```

OAIT must therefore execute deterministic rules for required coverage not reliably provided by Scalar.

---

## 11. OAIT-Owned Deterministic Conformance

OAIT will own deterministic conformance evaluation where stable product behavior requires it.

At minimum, evidence already demonstrates OAIT ownership for requirements such as:

- Duplicate parameter identity.
- Undeclared security requirements.
- Version-aware applicability.
- Stable OAIT rule semantics.
- Candidate-specific false-negative gaps.

OAIT may implement additional deterministic rules when required by the reviewed rule catalog.

This ADR does not require OAIT to reimplement every OpenAPI specification rule.

The decision principle is:

```text
use external evidence where reliable
+
own deterministic rules where stability or coverage requires ownership
```

---

## 12. Rule Identity Remains OAIT-Owned

External validator identifiers must not become OAIT's public rule IDs.

For example, OAIT must not define its public rules by directly exposing:

```text
Scalar code
Redocly rule name
IBM rule identifier
```

Instead:

```text
vendor diagnostic
        ↓
candidate-specific evidence
        ↓
OAIT rule correlation
        ↓
OAIT rule ID
```

OAIT owns the stable public identity.

This allows external validator replacement without breaking consumers of OAIT findings.

---

## 13. Severity Remains OAIT-Owned

Vendor severity is evidence only.

OAIT must not assume that a third-party severity:

```text
error
warning
info
```

matches OAIT's product severity model.

The final finding severity is determined by OAIT-owned rule semantics.

Conceptually:

```text
vendor severity
        ↓
evidence
        ↓
OAIT rule semantics
        ↓
OAIT severity
```

A future adapter may retain original vendor severity for debugging or evidence provenance, but it must not define the public OAIT contract.

---

## 14. Version Applicability Remains OAIT-Owned

OpenAPI requirements vary by version.

OAIT must explicitly determine whether a rule applies to:

```text
OAS 3.0
OAS 3.1
OAS 3.2
```

External validators may not cover the same version range.

For example, IBM's evaluated baseline does not support OAS 3.2.

Therefore external validator execution cannot define whether an OAIT rule is applicable.

Version-aware rule applicability belongs to OAIT.

---

## 15. Source Identity Remains OAIT-Owned

Validator-provided file paths, pointers, object paths, and line numbers are evidence only.

Canonical identity remains:

```text
physical document URI
+
RFC 6901 JSON Pointer
```

under ADR-004 and ADR-005.

The SourceIndex must be used to correlate external evidence to canonical OAIT source identity where possible.

Line and column remain presentation metadata.

---

## 16. SourceIndex Participation

The conceptual evidence path is:

```text
validator diagnostic
        ↓
candidate-specific source evidence
        ↓
SourceIndex correlation
        ↓
canonical document URI + pointer
        ↓
presentation line / column
```

The external validator does not define OAIT source identity.

Where validator evidence is incomplete or ambiguous, OAIT should preserve that uncertainty rather than invent a location.

---

## 17. Candidate-Specific Evidence Boundary

External validation must cross an OAIT-owned boundary before influencing findings.

Conceptually:

```text
Third-party validator
        ↓
candidate-specific validator evidence
        ↓
candidate-neutral conformance evidence
        ↓
OAIT rule/finding layer
```

The exact adapter interfaces are deferred to ADR-008 and detailed design.

ADR-007 establishes that such a boundary is mandatory.

---

## 18. Vendor Messages Are Not Public Contracts

Exact vendor message strings may change across package versions.

OAIT must not define stable product behavior using exact English message text.

Message text may be retained as evidence or debugging information.

Where diagnostic mapping requires candidate-specific interpretation, structured fields such as:

```text
code
path
file
rule identifier
```

should be preferred when available.

Message heuristics may be used only behind candidate-specific adaptation and must not become public OAIT semantics.

---

## 19. Finding Generation

OAIT findings must be generated from OAIT-owned semantics.

Conceptually:

```text
external evidence
        +
deterministic rule result
        +
SourceIndex
        ↓
OAIT finding
```

A finding may include external evidence for traceability, but the public finding structure must remain candidate neutral.

---

## 20. Duplicate Findings

Hybrid validation can produce overlapping evidence.

For example:

```text
Scalar detects violation X
+
OAIT deterministic rule detects violation X
```

The production design must define deterministic correlation and deduplication.

External evidence should not cause duplicate public findings for the same OAIT rule and source identity unless the rule model explicitly permits multiple distinct occurrences.

The detailed algorithm is deferred to production design.

---

## 21. Redocly Validation Decision

Redocly `struct` is not selected as the default or authoritative validator for OAIT v0.1.

SPIKE-006 observed:

```text
5 false positives
13 false negatives
```

including false positives involving valid modern OpenAPI/JSON Schema constructs.

These results violate OAIT's correctness guardrails for authoritative validation.

Redocly remains valuable for its source-rich diagnostic evidence.

That capability is deferred for possible future enrichment and will not be included as a default v0.1 validation dependency under this ADR.

---

## 22. Redocly Source-Rich Diagnostics

Redocly demonstrated the strongest native source attribution among evaluated validator candidates.

Observed useful evidence included:

- File attribution.
- Object/pointer-style paths.
- Line information.
- Column information.
- Referenced-file attribution.

However:

```text
strong source metadata
≠
correct validation semantics
```

Therefore source richness alone does not justify default validator selection.

ADR-008 may evaluate how candidate-specific source-rich evidence could be adapted if OAIT later introduces Redocly enrichment.

---

## 23. IBM Validation Decision

IBM OpenAPI Validator is deferred from the default OAIT v0.1 validation architecture.

Useful evidence included:

- Strong supported-version detection.
- Zero false positives on the applicable tested valid corpus.
- Useful code-bearing diagnostics.
- Unique detection of duplicate `operationId` in the evaluated configuration.

However, the tested baseline also has material constraints:

- OAS 3.2 NOT_SUPPORTED.
- CLI/subprocess integration.
- Significant dependency-security concern.
- Partial multi-file suitability evidence.
- Larger dependency surface.
- Interactive workflow overhead.

These constraints outweigh its incremental value for default v0.1 inclusion.

---

## 24. IBM Dependency-Security Consequence

SPIKE-007 reproduced:

```text
0 critical
8 high
0 moderate
0 low
```

audit findings through the IBM/Spectral runtime dependency chain.

This does not prove exploitability.

It does establish:

```text
SIGNIFICANT_CONCERN
```

for the evaluated baseline.

Any future IBM inclusion requires:

- New baseline review.
- New dependency audit.
- Upgrade assessment.
- Multi-file verification.
- Process-integration review.
- Regression against accepted validator fixtures.

---

## 25. Future Optional IBM Role

IBM may be reconsidered later for a bounded CI-only or supported-version role.

Such integration must be separately reviewed.

It must not silently enter the default dependency set through implementation convenience.

The future decision should explicitly state:

```text
supported OpenAPI versions
execution environment
security baseline
coverage benefit
operational cost
```

before adoption.

---

## 26. Multiple Default Validators Are Not Selected

OAIT v0.1 will not execute multiple third-party validators by default.

Running Scalar, Redocly, and IBM simultaneously could increase coverage, but also introduces:

- Duplicate findings.
- Conflicting severity.
- Conflicting rule semantics.
- Candidate-specific false positives.
- Larger dependency surface.
- Higher runtime cost.
- More mapping logic.
- More upgrade/regression burden.

There is no accepted evidence that this complexity is necessary for v0.1.

OAIT therefore prefers:

```text
one bounded default external validator
+
OAIT deterministic fallback
```

---

## 27. OAIT-Only Validation Is Not Preferred

OAIT could reject all external validation and implement every conformance check internally.

That is not selected for v0.1.

Scalar already provides useful external evidence with:

```text
0 observed false positives
```

on the applicable tested valid corpus and meaningful violation coverage.

Discarding that evidence would require OAIT to reimplement working validation behavior unnecessarily.

The preferred architecture uses external evidence selectively while retaining deterministic ownership where required.

---

## 28. External Evidence Is Advisory to OAIT Semantics

The term:

```text
bounded external evidence
```

means the external validator may contribute facts such as:

```text
candidate reports a violation
candidate code
candidate path
candidate message
candidate source metadata
```

but OAIT determines:

```text
whether an OAIT rule exists
whether it applies
whether evidence is sufficient
what severity applies
what canonical location applies
what public finding is emitted
```

---

## 29. Deterministic Rule Stability

OAIT rule semantics must remain stable across:

- Scalar upgrades.
- Validator replacement.
- Addition/removal of optional validators.
- Diagnostic-message changes.
- Different execution environments.

This means rule tests must target OAIT behavior, not vendor behavior.

Vendor behavior is separately regression-tested as integration evidence.

---

## 30. Validator Upgrade Policy

Any upgrade to the default external validator baseline must rerun the accepted validator corpus.

At minimum verify:

- Previously valid fixtures remain valid.
- False positives do not regress.
- Required violation detection does not materially regress.
- OAS 3.0 behavior.
- OAS 3.1 behavior.
- OAS 3.2 behavior.
- Reference handling.
- Recursive cases.
- Referenced-file diagnostics.
- Diagnostic structure.
- Performance.
- Dependency-security posture.

An upgrade that materially changes conformance behavior may require ADR review.

---

## 31. External Validator Replacement

The architecture must permit Scalar validation to be replaced without changing OAIT core rule contracts.

Replacing Scalar should require changes primarily within:

```text
validator integration
+
candidate-specific adaptation
```

rather than:

```text
OAIT public finding model
+
rule catalog semantics
```

This is a required architectural property.

---

## 32. Operational Suitability

SPIKE-007 classified Scalar as:

```text
OPERATIONALLY_SUITABLE
```

for its evidenced roles.

Representative large OAS 3.1 validation median was approximately:

```text
95 ms
```

in the benchmarked macOS arm64 environment.

This is compatible with interactive and CI workflows.

Performance remains secondary to correctness.

---

## 33. Avoid Repeated Work Where Safe

SPIKE-007 indicated that separate load and validation stages may repeat processing.

Production design should evaluate safe reuse of intermediate state.

However:

```text
performance optimization
≠
permission to weaken correctness
```

Caching or reuse must preserve:

- Version correctness.
- Source identity.
- Reference policy.
- Validator behavior.
- Deterministic rule coverage.

---

## 34. Interactive CLI Consequence

The selected architecture is suitable for an interactive CLI because:

- Scalar validation is in-process.
- Measured performance is well within current targets.
- No subprocess validator is required by default.
- OAIT deterministic rules can execute locally.
- SourceIndex correlation remains local-first.

The CLI must still expose OAIT-owned findings rather than raw Scalar diagnostics.

---

## 35. CI Consequence

The architecture is suitable for CI because:

- Deterministic rules are repeatable.
- External validation is bounded.
- Findings have stable OAIT identities.
- Candidate replacement is isolated.
- Headless operation was demonstrated for the selected stack.

Linux and Windows CI qualification remains an implementation follow-up.

---

## 36. Security Consequence

The default v0.1 strategy minimizes runtime dependencies by using the already-selected Scalar stack for bounded validation.

This avoids introducing IBM's significant dependency concern and avoids adding Redocly solely for default validation.

All production dependencies still require:

- Inventory.
- License review.
- Vulnerability scanning.
- Upgrade visibility.
- Lockfile review.

---

## 37. Privacy and Source-Control Consequence

Validation should remain local-first where practical.

External validators must not independently fetch remote content outside ADR-004 source policy.

All source access remains controlled by OAIT.

The validator role does not authorize:

```text
network access
arbitrary filesystem traversal
uncontrolled remote $ref loading
```

---

## 38. Alternatives Considered

### Alternative A — Scalar as Sole Validator

**Rejected.**

Advantages:

- Already part of selected parser stack.
- Zero observed false positives.
- Useful violation coverage.
- Strong operational performance.

Reasons rejected:

- Five observed false negatives.
- Incomplete rule coverage.
- Sparse diagnostic/source metadata.
- Not sole-validator viable in SPIKE-006.

### Alternative B — Scalar + OAIT Deterministic Rules

**Selected.**

Advantages:

- Uses useful existing validation.
- Avoids second default validator dependency.
- Preserves OAIT rule ownership.
- Covers known external gaps.
- Maintains stable finding semantics.
- Supports replacement.
- Strong operational fit.

Known constraints:

- Requires deterministic rule implementation.
- Requires evidence correlation.
- Requires deduplication.
- Requires adapter boundaries.
- Requires explicit coverage testing.

### Alternative C — Redocly `struct` as Default Validator

**Rejected for default/authoritative validation.**

Advantages:

- Strongest observed source metadata.
- Strong operational performance.
- In-process API.

Reasons rejected:

- Five observed false positives.
- Thirteen observed false negatives.
- Valid modern constructs were incorrectly diagnosed.
- Source richness does not offset correctness defects.

### Alternative D — IBM as Default Validator

**Deferred.**

Advantages:

- Strong supported-version accuracy.
- Useful code-bearing diagnostics.
- Duplicate `operationId` detection.

Reasons deferred:

- OAS 3.2 unsupported.
- CLI/subprocess integration.
- Significant dependency concern.
- Partial multi-file evidence.
- Higher operational complexity.

### Alternative E — OAIT-Only Validation

**Not selected for v0.1.**

Advantages:

- Complete control.
- No external validator semantics.
- Maximum candidate independence.

Reasons not selected:

- Unnecessary reimplementation of useful existing checks.
- Larger engineering scope.
- Higher maintenance burden.
- Slower delivery of product capabilities.

### Alternative F — Multiple Default Third-Party Validators

**Rejected for v0.1.**

Potential benefit:

- Wider aggregate coverage.

Costs:

- More false positives.
- More conflicting evidence.
- Deduplication complexity.
- Dependency growth.
- Operational cost.
- Upgrade burden.

No accepted evidence demonstrates that the benefit justifies those costs for v0.1.

---

## 39. Positive Consequences

This decision provides:

- Stable OAIT-owned rule semantics.
- Useful external validator evidence.
- Deterministic fallback coverage.
- Minimal default validator dependency footprint.
- Candidate replaceability.
- SourceIndex correlation.
- Version-aware rule applicability.
- Interactive CLI suitability.
- CI suitability.
- Clear ownership boundaries.

---

## 40. Negative Consequences

OAIT must implement and maintain deterministic rule logic.

The architecture also requires:

- External evidence adaptation.
- Source correlation.
- Deduplication.
- Coverage matrices.
- Validator regression testing.
- Upgrade governance.
- Candidate-specific integration tests.

These are accepted costs of maintaining stable conformance semantics.

---

## 41. Neutral Consequences

This ADR does not decide:

- Exact validator adapter interface.
- Exact diagnostic adapter interface.
- Exact rule engine API.
- Execution ordering.
- Parallelism.
- Caching.
- Finding deduplication algorithm.
- Suppression implementation.
- Diagnostic message normalization details.
- Redocly enrichment design.
- IBM CI integration.

These belong to subsequent ADRs and production design.

---

## 42. Testing Requirements

Production validation design must include separate test categories for:

### External validator contract tests

Verify:

- Candidate invocation.
- Version behavior.
- Reference behavior.
- Diagnostic shape.
- Known accepted FP/FN corpus.

### Deterministic OAIT rule tests

Verify:

- Rule applicability.
- Rule semantics.
- Stable rule IDs.
- Severity.
- Source identity.
- Known external gaps.

### Integration tests

Verify:

```text
external evidence
+
deterministic rules
+
SourceIndex
↓
stable OAIT findings
```

### Replacement tests

Verify that OAIT public findings are not structurally coupled to Scalar diagnostic types.

---

## 43. Coverage Tracking Requirement

OAIT should maintain an explicit coverage view showing whether each conformance requirement is:

```text
externally detected
OAIT deterministic
both
not yet implemented
not applicable
```

This prevents silent dependence on external validator behavior.

The exact representation belongs to production design.

---

## 44. Relationship to ADR-006

ADR-006 selects Scalar for semantic parsing.

ADR-007 selects Scalar validation only as bounded evidence.

The distinction is explicit:

```text
Scalar parser
→ selected primary dependency

Scalar validation
→ useful bounded evidence

Scalar conformance authority
→ not selected
```

This separation must remain visible in implementation and documentation.

---

## 45. Relationship to ADR-008

ADR-007 requires candidate-specific diagnostics to cross an OAIT-owned evidence boundary.

ADR-008 will formalize the diagnostic-adaptation contract, including:

- Vendor diagnostic containment.
- Candidate-neutral evidence fields.
- SourceIndex correlation behavior.
- Vendor code/message retention.
- Mapping uncertainty.
- Stable public finding boundaries.

ADR-007 does not preempt those details.

---

## 46. Production Design Requirements

Detailed validation design must define at least:

1. External validator invocation boundary.
2. Candidate-neutral validation evidence.
3. Deterministic rule execution model.
4. Rule applicability model.
5. SourceIndex correlation.
6. Evidence deduplication.
7. Finding generation.
8. External validator failure behavior.
9. Partial evidence behavior.
10. Upgrade regression process.
11. Coverage tracking.
12. Performance strategy.
13. Local-first execution.
14. Security boundaries.

No production validator/rule packages should be introduced before this design is reviewed.

---

## 47. Implementation Sequencing

The intended sequence is:

```text
ADR-003
Normalized domain model
        +
ADR-004
Source ownership
        +
ADR-005
Source indexing
        +
ADR-006
Primary parser
        +
ADR-007
Hybrid conformance
        +
ADR-008
Diagnostic adaptation
        ↓
Detailed parser/validator design
        ↓
Production implementation
```

---

## 48. Follow-Up Actions

After ADR-007 is accepted:

1. Create ADR-008 for candidate-specific diagnostic adaptation.
2. Produce detailed parser/validator production design.
3. Define validator evidence interfaces.
4. Define deterministic rule execution interfaces.
5. Define SourceIndex correlation.
6. Define coverage tracking.
7. Define deduplication behavior.
8. Define failure/partial-result behavior.
9. Establish production regression fixtures.
10. Implement only after design review.

---

## 49. Review Criteria

ADR-007 is ready for acceptance when reviewers confirm that it:

- Uses Scalar validation only as bounded evidence.
- Does not make Scalar authoritative.
- Requires OAIT deterministic fallback.
- Preserves OAIT rule IDs/severity/applicability.
- Preserves SourceIndex authority.
- Rejects Redocly `struct` as default validation.
- Defers IBM from default v0.1.
- Does not require multiple default validators.
- Does not require OAIT to implement every possible OpenAPI rule.
- Preserves replaceability.
- Leaves detailed diagnostic adaptation for ADR-008.
- Introduces no production implementation.

---

## 50. Final Consequence

OAIT's conformance architecture becomes:

```text
OpenAPI semantic input
        ↓
Scalar bounded validation evidence
        +
OAIT deterministic conformance
        +
OAIT SourceIndex
        ↓
candidate-neutral evidence
        ↓
OAIT-owned findings
```

The architecture deliberately separates:

```text
who detects evidence
```

from:

```text
who owns conformance meaning
```

Third-party validators may help detect evidence.

OAIT owns the meaning, identity, applicability, severity, source correlation, and stability of its findings.