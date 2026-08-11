# ADR-008: Define Candidate-Specific Diagnostic Adaptation Boundary

**Status:** Accepted  
**Date:** 2026-08-11  
**Decision owners:** OAIT Architecture  
**Applies to:** OAIT v0.1 and later  
**Related documents:** `parser-validator-evaluation.md`, `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`, `ADR-006-select-scalar-as-primary-openapi-parser.md`, `ADR-007-hybrid-validation-and-deterministic-conformance.md`, `source-processing-design.md`, `SPIKE-006-validator-capabilities-and-diagnostics.md`, `SPIKE-007-performance-and-operational-suitability.md`

---

## 1. Context

OAIT uses third-party validator diagnostics as bounded evidence within the hybrid conformance architecture established by ADR-007.

The evaluated validator candidates produce different diagnostic structures.

Depending on the candidate, a diagnostic may contain some combination of:

```text
rule code
rule name
severity
message
file path
object path
JSON-style path
line
column
range
nested context
raw runtime objects
```

These values are candidate-specific.

They may also change when a validator dependency is upgraded.

OAIT cannot allow those candidate-specific structures to become part of its stable validation or finding contract.

ADR-007 therefore requires external diagnostics to cross an OAIT-owned evidence boundary before they participate in OAIT conformance semantics.

ADR-008 defines that boundary.

---

## 2. Problem

OAIT must transform third-party validation output into useful evidence without allowing third-party implementation details to spread into core architecture.

Directly exposing vendor diagnostics would create coupling such as:

```text
Scalar diagnostic type
        ↓
OAIT rule processing

Redocly rule identifier
        ↓
OAIT public rule ID

IBM severity
        ↓
OAIT public severity

vendor file/path format
        ↓
OAIT source identity
```

Such coupling would make validator upgrades or replacements potentially breaking changes.

It would also conflict with previous architecture decisions establishing that OAIT owns:

- Stable rule identity.
- Severity.
- Version applicability.
- Canonical source identity.
- Conformance semantics.
- Public finding structure.

The architectural question is:

> **How should OAIT adapt candidate-specific validator diagnostics into candidate-neutral evidence while preserving stable OAIT semantics and canonical source identity?**

---

## 3. Decision

OAIT will introduce an OAIT-owned diagnostic-adaptation boundary between every external validator and OAIT conformance/finding logic.

The conceptual flow is:

```text
Third-party validator
        ↓
Candidate-specific diagnostic adapter
        ↓
Candidate-neutral diagnostic evidence
        ↓
SourceIndex correlation / provenance enrichment
        ↓
OAIT conformance semantics
        ↓
OAIT-owned finding
```

Candidate-specific validator diagnostics must not bypass this boundary.

---

## 4. Decision Statement

> **Convert every external validator diagnostic into candidate-neutral OAIT diagnostic evidence before it participates in conformance or finding generation. Preserve vendor metadata only as bounded evidence and provenance, use OAIT SourceIndex for canonical source correlation, preserve correlation uncertainty explicitly, and keep OAIT rule identity, severity, applicability, deduplication, suppression, and final finding semantics outside candidate-specific adapters.**

---

## 5. Decision Scope

This ADR defines:

- The diagnostic-adaptation ownership boundary.
- Candidate-specific versus candidate-neutral responsibilities.
- Diagnostic evidence expectations.
- SourceIndex correlation.
- Source-correlation uncertainty.
- Vendor metadata containment.
- Message-parsing constraints.
- Upgrade and replacement behavior.
- Diagnostic adapter testing requirements.

This ADR does not define:

```text
exact TypeScript interfaces
class names
package layout
rule engine APIs
finding deduplication algorithms
suppression algorithms
execution scheduling
```

Those belong to detailed production design.

---

## 6. Existing Architectural Constraints

ADR-008 preserves all accepted architecture.

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

OAIT uses `yaml` and `jsonc-parser` to build authoritative physical source evidence and SourceIndex.

### ADR-006

Scalar is the selected primary OpenAPI semantic parser behind an OAIT-owned adapter.

### ADR-007

Scalar validation is bounded external evidence.

OAIT owns conformance semantics.

No external validator is the sole conformance authority.

---

## 7. Diagnostic Evidence Is Not a Finding

OAIT must explicitly distinguish:

```text
diagnostic evidence
```

from:

```text
OAIT finding
```

A third-party diagnostic means:

> A validator reported some condition using its own semantics and representation.

It does not by itself determine:

- OAIT rule ID.
- OAIT severity.
- OAIT applicability.
- OAIT canonical source identity.
- Whether a public finding should be emitted.
- Whether the evidence duplicates another finding.
- Whether the finding is suppressed.
- Whether additional deterministic evidence changes interpretation.

Therefore:

```text
vendor diagnostic
≠
OAIT finding
```

---

## 8. Candidate-Specific Diagnostic Adapter

Each external validator integration must contain candidate-specific interpretation inside an adapter boundary.

The adapter may understand:

- Candidate runtime diagnostic types.
- Candidate rule codes.
- Candidate severity values.
- Candidate path conventions.
- Candidate file attribution.
- Candidate line/column conventions.
- Candidate diagnostic nesting.
- Candidate version-specific behavior.
- Candidate message patterns when unavoidable.

Those concerns must not leak into candidate-neutral OAIT layers.

Conceptually:

```text
Scalar-specific behavior
        ↓
Scalar diagnostic adapter

Redocly-specific behavior
        ↓
Redocly diagnostic adapter

IBM-specific behavior
        ↓
IBM diagnostic adapter
```

Each produces the same conceptual class of OAIT diagnostic evidence.

---

## 9. Candidate-Neutral Diagnostic Evidence

After adaptation, diagnostic evidence must use OAIT-owned concepts.

The exact production type is deferred, but the conceptual evidence may contain:

```text
provider identity

provider diagnostic code
provider rule identifier
provider severity
provider message

provider source/resource reference
provider path/object path/pointer
provider line/column/range

canonical document URI
canonical RFC6901 pointer
presentation line/column/range

source-correlation status
source-correlation confidence/evidence

bounded raw provider metadata
```

Not every diagnostic will populate every field.

Absence of candidate data must be represented as absence, not fabricated values.

---

## 10. Provider Identity

Candidate-neutral evidence should retain which provider produced the diagnostic.

Examples:

```text
scalar
redocly
ibm
```

Provider identity is evidence provenance.

It must not determine the public OAIT rule identity.

Provider identity allows:

- Debugging.
- Regression comparison.
- Candidate-specific telemetry.
- Upgrade analysis.
- Evidence provenance.
- Future multi-adapter support.

---

## 11. Provider Diagnostic Codes

Vendor rule codes or identifiers may be retained as raw evidence where available.

Examples conceptually include:

```text
providerCode
providerRuleId
```

These fields are not OAIT public rule IDs.

The relationship is:

```text
provider diagnostic code
        ↓
evidence correlation
        ↓
OAIT conformance semantics
        ↓
OAIT rule ID
```

A provider code may assist mapping but must not define product semantics.

---

## 12. Provider Severity

Vendor severity may be preserved as evidence.

However:

```text
provider severity
≠
OAIT severity
```

Candidate-specific adapters may normalize representation sufficiently to preserve the vendor value, but they must not assign final OAIT severity.

OAIT severity remains governed by OAIT rule semantics.

---

## 13. Provider Message

The original candidate diagnostic message may be retained as evidence.

It may support:

- Debugging.
- Human inspection.
- Regression testing.
- Adapter development.
- Unmapped diagnostic reporting.

It must not become a stable machine-readable OAIT contract.

Exact message text may change across dependency versions.

---

## 14. Structured Fields Are Preferred

Candidate adapters should prefer structured diagnostic fields over English prose interpretation.

Preferred evidence includes:

```text
code
rule identifier
file/resource
path
pointer
line
column
range
structured context
```

before:

```text
English message parsing
```

This minimizes dependence on unstable human-readable text.

---

## 15. Message Heuristics

Message parsing is permitted only when structured evidence is insufficient and the resulting evidence is still useful.

Any such heuristic must:

- Remain inside the candidate-specific adapter.
- Be treated as candidate-version-sensitive.
- Be regression tested.
- Avoid becoming a public contract.
- Fail conservatively.
- Preserve mapping uncertainty.

Conceptually:

```text
structured candidate evidence
        ↓
preferred

message heuristic
        ↓
last resort
```

---

## 16. Candidate Runtime Types Must Not Leak

Third-party runtime or TypeScript types must stop at the adapter boundary.

Core OAIT components must not depend directly on types such as:

```text
ScalarDiagnostic
RedoclyProblem
IBMRuleResult
```

or equivalent candidate-defined structures.

This is required for replaceability.

Candidate types may exist inside integration code but not in stable OAIT domain contracts.

---

## 17. Source Identity Remains OAIT-Owned

External validators may report locations using:

- Relative filenames.
- Absolute filenames.
- URI-like strings.
- Object paths.
- Array paths.
- JSON pointers.
- Line/column values.
- Bundled/transformed paths.

None of those automatically becomes canonical OAIT source identity.

Canonical identity remains:

```text
physical source document URI
+
RFC 6901 JSON Pointer
```

under ADR-004 and ADR-005.

---

## 18. SourceIndex Correlation

Candidate diagnostic locations must be correlated against OAIT SourceIndex and source registry evidence where possible.

Conceptually:

```text
candidate source evidence
        ↓
candidate-specific interpretation
        ↓
SourceIndex / source registry correlation
        ↓
canonical document URI + pointer
```

The adapter or correlation layer must not invent canonical locations that cannot be supported by existing source evidence.

---

## 19. Separation of Adaptation and Correlation

Candidate adaptation and canonical source correlation are related but distinct responsibilities.

Conceptually:

```text
candidate diagnostic
        ↓
adapt candidate representation
        ↓
candidate-neutral location evidence
        ↓
correlate against SourceIndex
        ↓
canonical source evidence
```

This separation prevents SourceIndex from needing knowledge of Scalar, Redocly, IBM, or future validator formats.

---

## 20. Correlation Status

Source correlation is not always binary.

OAIT must preserve meaningful correlation states.

At minimum, production design should support the conceptual states:

```text
exact
partial
ambiguous
unavailable
```

### Exact

Candidate evidence maps uniquely to a canonical physical source identity.

### Partial

Some source evidence is known, but a complete canonical URI + pointer cannot be established.

### Ambiguous

More than one plausible canonical source occurrence exists.

### Unavailable

The candidate diagnostic contains insufficient evidence for meaningful source correlation.

---

## 21. Exact Correlation

An exact correlation requires sufficient evidence to uniquely identify the relevant OAIT source location.

Conceptually:

```text
candidate evidence
        +
SourceIndex
        ↓
one canonical document URI
+
one canonical RFC6901 pointer
```

Line/column/range may then be added as presentation evidence when available from SourceIndex.

---

## 22. Partial Correlation

Partial correlation may occur when OAIT can determine, for example:

```text
document known
pointer unknown
```

or:

```text
document known
candidate line known
canonical logical node unresolved
```

Partial evidence should be preserved rather than discarded.

OAIT must not fabricate the missing portion.

---

## 23. Ambiguous Correlation

Ambiguous correlation occurs when candidate evidence could correspond to multiple physical occurrences.

Examples may include:

- Duplicate mapping possibilities.
- Duplicate source keys.
- Repeated structurally equivalent nodes.
- Incomplete candidate file/path attribution.
- Transformed diagnostic paths without a unique original-source mapping.

Ambiguity must remain explicit.

The adapter or correlation layer must not arbitrarily choose one source location.

---

## 24. Unavailable Correlation

Some candidate diagnostics may contain no usable source-location metadata.

Such diagnostics can still be valid evidence.

The absence of a canonical location must not cause OAIT to:

- Discard useful evidence automatically.
- Invent a pointer.
- Assign the root pointer without evidence.
- Copy an unrelated location.

Finding-generation policy for locationless evidence belongs to detailed design and rule semantics.

---

## 25. Correlation Confidence

Production design may represent source-correlation confidence when it provides useful information beyond categorical correlation status.

If introduced, confidence must be evidence-based.

It must not imply statistical precision that the mapping process does not possess.

Prefer explainable states and evidence over arbitrary numeric percentages.

---

## 26. Transformed and Bundled Paths

Validator diagnostics may refer to transformed or bundled representations.

Such paths are not automatically canonical source identities.

OAIT must distinguish:

```text
original physical source path
```

from:

```text
transformed/bundled diagnostic path
```

A transformed location may be retained as provider evidence.

It must be mapped through OAIT source/reference evidence before being treated as original-source identity.

---

## 27. Referenced Files

Diagnostics originating in referenced files must be reconciled through OAIT source registry and SourceIndex evidence.

Candidate-reported referenced-file names may assist correlation.

However:

```text
candidate file string
≠
canonical OAIT URI
```

Canonicalization remains OAIT-owned.

---

## 28. Duplicate and Malformed Source Cases

ADR-005 distinguishes logical identity from physical occurrence evidence.

In duplicate-key or malformed-source scenarios, a single RFC6901 pointer may not uniquely describe every physical occurrence.

Diagnostic adaptation must therefore permit evidence such as:

- Range.
- Occurrence.
- Line.
- Column.
- Partial correlation.
- Ambiguous correlation.

The architecture must not force an incorrect unique logical pointer where the physical source does not support one.

---

## 29. Raw Candidate Metadata

OAIT may retain bounded raw candidate metadata for debugging and evidence provenance.

Raw metadata must:

- Be optional.
- Remain nonauthoritative.
- Remain outside stable public OAIT semantics.
- Avoid leaking candidate runtime types into core contracts.
- Avoid unnecessary duplication.
- Avoid retaining sensitive source content without a justified need.

Production design should prefer a deliberately selected evidence subset over unconstrained storage of entire candidate runtime objects.

---

## 30. Sensitive Content

Validator diagnostics can sometimes contain source excerpts or values.

OAIT must not automatically retain arbitrary source fragments merely because a candidate emits them.

Raw diagnostic retention must follow privacy and source-control principles.

In particular:

```text
useful diagnostic provenance
≠
permission to retain full source content
```

Logging policies must also avoid exposing sensitive OpenAPI content unnecessarily.

---

## 31. OAIT Rule Mapping

Candidate-neutral evidence may contribute to OAIT rule evaluation.

However, rule mapping remains outside the candidate-specific adapter.

The adapter answers:

> What did this candidate report, and what source evidence can be correlated?

The OAIT conformance layer answers:

> What does this evidence mean under OAIT rules?

Conceptually:

```text
adapter
→ evidence

conformance layer
→ meaning
```

---

## 32. OAIT Severity and Applicability

Candidate adapters must not determine:

- Final OAIT severity.
- OpenAPI-version applicability.
- Whether a violation is suppressible.
- Whether it is breaking.
- Whether it affects quality scoring.
- Whether it produces a public finding.

These remain OAIT-owned decisions.

---

## 33. Deduplication Remains Outside the Adapter

ADR-007 established that hybrid validation can create overlapping evidence.

Candidate adapters must not own final finding deduplication.

For example:

```text
Scalar evidence
+
OAIT deterministic rule evidence
```

may represent the same OAIT rule occurrence.

The adapter should preserve source and provider evidence needed for later correlation.

The final deduplication algorithm belongs to production design.

---

## 34. Suppression Remains Outside the Adapter

Candidate adapters must not implement OAIT suppression semantics.

Suppression is part of OAIT rule/finding policy.

A suppressed finding may still have underlying candidate evidence.

Therefore:

```text
diagnostic adaptation
≠
suppression decision
```

---

## 35. Unmapped Diagnostics

A candidate may emit a diagnostic that OAIT does not currently map to a known conformance rule.

The architecture must permit such evidence to remain identifiable as unmapped candidate evidence.

Production design should determine whether unmapped evidence is:

- retained internally,
- surfaced in diagnostic/debug modes,
- ignored for public findings,
- or reviewed for future rule coverage.

The adapter must not invent an OAIT rule ID merely to force mapping.

---

## 36. Validator Failure Versus Diagnostic Evidence

Failure to invoke or execute a validator is not equivalent to a conformance diagnostic.

The design must distinguish:

```text
validator execution failure
```

from:

```text
validator reports invalid OpenAPI
```

Examples of execution failure include:

- Dependency/runtime failure.
- Unexpected candidate exception.
- Unsupported invocation state.
- Adapter failure.
- Candidate output-shape incompatibility.

Failure handling belongs to detailed validation design but must remain distinct from diagnostic adaptation.

---

## 37. Candidate Upgrades

External validator upgrades may change:

- Diagnostic codes.
- Diagnostic shapes.
- Severity.
- Paths.
- Message text.
- Source attribution.
- Nested context.

Therefore candidate upgrades must include diagnostic contract regression testing.

The upgrade process must verify that the adapter still produces valid candidate-neutral evidence.

---

## 38. Adapter Contract Tests

Each candidate adapter must have contract tests against its pinned supported version.

Tests should cover:

- Structured diagnostic fields.
- Missing optional fields.
- File attribution.
- Path forms.
- Line/column behavior.
- Referenced-file diagnostics.
- Malformed or unexpected candidate output.
- Message heuristic behavior, if any.
- Source correlation states.
- Raw metadata containment.

These tests verify the adapter boundary rather than the final OAIT rule semantics.

---

## 39. Replaceability

The architecture must permit Scalar validation to be replaced or supplemented without redesigning OAIT findings.

A new validator should primarily require:

```text
validator integration
+
candidate-specific diagnostic adapter
```

while leaving unchanged:

```text
OAIT rule IDs
OAIT severity semantics
OAIT source identity
OAIT public finding structure
```

This is a required architectural property.

---

## 40. Future Redocly Integration

Redocly remains deferred from default validation.

If future use is approved for source-rich diagnostic enrichment, its diagnostics must cross the same candidate-specific adaptation boundary.

Redocly's stronger native source metadata does not grant it source-identity authority.

---

## 41. Future IBM Integration

IBM OpenAPI Validator remains deferred from default v0.1.

If a future bounded or CI-only IBM role is approved, IBM diagnostics must cross the same evidence boundary.

IBM rule codes may be useful evidence but must not become OAIT rule IDs.

---

## 42. Multiple Future Providers

The evidence boundary should support multiple providers without requiring provider-aware core rule logic.

Conceptually:

```text
Scalar ─────┐
            │
Redocly ────┼→ candidate adapters
            │        ↓
IBM ────────┘ candidate-neutral evidence
                     ↓
                 OAIT core
```

The OAIT core should consume evidence concepts rather than candidate runtime structures.

---

## 43. Alternatives Considered

### Alternative A — Expose Vendor Diagnostics Directly

**Rejected.**

Advantages:

- Minimal adapter work.
- Maximum preservation of candidate-specific detail.

Reasons rejected:

- Vendor types leak into OAIT.
- Rule IDs become unstable.
- Severity becomes candidate-controlled.
- Path semantics become inconsistent.
- Validator replacement becomes breaking.
- Public contracts become dependency-version-sensitive.

---

### Alternative B — Normalize Only During Final Finding Generation

**Rejected.**

This would allow candidate-specific concepts to propagate through conformance logic.

Consequences would include:

- Vendor-aware rule processing.
- Duplicated mapping logic.
- Increased coupling.
- Harder testing.
- Harder validator replacement.

Normalization must occur before candidate diagnostics reach core conformance semantics.

---

### Alternative C — Parse English Messages as the Primary Contract

**Rejected.**

Advantages:

- Available even when structured candidate codes are weak.

Reasons rejected:

- Message wording may change.
- Localization may change output.
- Punctuation and formatting may change.
- Version upgrades can silently break parsing.
- Human-readable prose is not a stable machine interface.

Message heuristics are allowed only as bounded candidate-specific fallbacks.

---

### Alternative D — Require Every Candidate to Produce Canonical URI + Pointer

**Rejected.**

SPIKE-006 demonstrated inconsistent source richness across candidates.

ADR-004 and ADR-005 already establish that canonical source identity belongs to OAIT.

External validators are not required to reproduce OAIT source semantics.

---

### Alternative E — Omit Raw Vendor Metadata Entirely

**Not preferred.**

Advantages:

- Maximum abstraction.
- Smaller evidence representation.

Reasons not selected:

- Raw provider codes/messages may help debugging.
- Upgrade regressions are easier to diagnose with provenance.
- Future adapter improvements may need original candidate evidence.

Raw metadata may therefore be retained in a bounded, nonauthoritative form.

---

## 44. Positive Consequences

This decision provides:

- Stable public OAIT finding semantics.
- Validator replaceability.
- Candidate-neutral core architecture.
- SourceIndex authority preservation.
- Explicit source-correlation uncertainty.
- Better validator-upgrade isolation.
- Better regression diagnostics.
- Support for future validator integrations.
- Clear separation between evidence and meaning.

---

## 45. Negative Consequences

The architecture requires:

- Candidate-specific adapter maintenance.
- Additional mapping logic.
- Source correlation.
- Adapter contract tests.
- Upgrade regression tests.
- Explicit handling of partial and ambiguous evidence.

These are accepted costs of maintaining stable OAIT semantics.

---

## 46. Neutral Consequences

This ADR does not decide:

- Exact TypeScript evidence interfaces.
- Adapter class names.
- Package structure.
- Execution ordering.
- Caching.
- Final finding deduplication.
- Suppression behavior.
- Rule-engine internals.
- Public CLI rendering.
- Diagnostic telemetry schema.
- Redocly or IBM adoption.

These belong to later design or ADRs where necessary.

---

## 47. Production Design Requirements

Detailed parser/validator design must define at least:

1. Candidate diagnostic adapter interface.
2. Candidate-neutral evidence representation.
3. Provider provenance fields.
4. Optional raw metadata constraints.
5. Candidate location representation.
6. SourceIndex correlation interface.
7. Correlation status representation.
8. Exact/partial/ambiguous/unavailable behavior.
9. Validator execution failure behavior.
10. Unmapped-diagnostic behavior.
11. Diagnostic adapter contract testing.
12. Upgrade regression testing.
13. Privacy and logging constraints.
14. Evidence-to-conformance handoff.

No production DiagnosticAdapter implementation should precede review of that design.

---

## 48. Implementation Sequencing

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
Detailed parser/validator production design
        ↓
Production implementation
```

---

## 49. Review Criteria

ADR-008 is ready for acceptance when reviewers confirm that it:

- Requires a candidate-specific adaptation boundary.
- Distinguishes diagnostic evidence from OAIT findings.
- Prevents vendor runtime types from leaking into OAIT core contracts.
- Prevents vendor rule IDs from becoming OAIT rule IDs.
- Prevents vendor severity from becoming OAIT severity.
- Treats vendor messages as unstable evidence.
- Prefers structured fields over message parsing.
- Allows message heuristics only inside candidate adapters.
- Preserves SourceIndex authority.
- Defines exact, partial, ambiguous, and unavailable correlation.
- Does not fabricate source locations.
- Preserves transformed paths only as evidence unless mapped to original source.
- Permits bounded raw provider evidence.
- Keeps rule mapping, applicability, severity, deduplication, suppression, and final finding construction outside adapters.
- Preserves candidate replaceability.
- Introduces no production implementation.

---

## 50. Final Consequence

OAIT's diagnostic architecture becomes:

```text
Third-party validator
        ↓
candidate-specific diagnostic representation
        ↓
OAIT candidate adapter
        ↓
candidate-neutral diagnostic evidence
        ↓
SourceIndex correlation
        ↓
OAIT conformance interpretation
        ↓
OAIT-owned finding
```

The architecture deliberately separates:

```text
what a validator reported
```

from:

```text
what OAIT concludes
```

and separately distinguishes:

```text
where a validator says the issue is
```

from:

```text
what OAIT can prove is the canonical source identity
```

Third-party diagnostics contribute evidence.

OAIT owns the stable meaning, identity, severity, applicability, source correlation, and public contract of its findings.