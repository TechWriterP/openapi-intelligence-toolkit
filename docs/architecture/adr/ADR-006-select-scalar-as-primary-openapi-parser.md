# ADR-006: Select Scalar as Primary OpenAPI Semantic Parser

**Status:** Proposed
**Date:** 2026-08-10
**Decision owners:** OAIT Architecture
**Applies to:** OAIT v0.1 and later
**Related documents:** `parser-validator-evaluation.md`, `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`, `openapi-domain-model.md`, `source-processing-design.md`, `SPIKE-001-parser-version-support.md`, `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`, `SPIKE-004-openapi-3.2-operation-support.md`, `SPIKE-005-schema-and-dialect-behavior.md`, `SPIKE-006-validator-capabilities-and-diagnostics.md`, `SPIKE-007-performance-and-operational-suitability.md`

---

## 1. Context

The OpenAPI Intelligence Toolkit (OAIT) requires a primary OpenAPI parser that can provide reliable semantic input for its version-aware normalized domain model.

OAIT must support:

* OpenAPI 3.0.
* OpenAPI 3.1.
* OpenAPI 3.2.
* YAML and JSON source descriptions.
* Single-file and multi-file APIs.
* Internal and external `$ref` relationships.
* Recursive schema graphs.
* OpenAPI-version-specific schema semantics.
* OpenAPI 3.2 operation discovery.
* Future deterministic review, scoring, comparison, Contract Guard, remediation, and AI-assisted documentation workflows.

The parser is not responsible for defining OAIT's complete architecture.

Previous decisions already establish that:

* ADR-003 defines an OAIT-owned normalized, version-aware OpenAPI domain model.
* ADR-004 makes OAIT authoritative for source loading, source-access policy, source identity, source-location evidence, and reference provenance before third-party transformations.
* ADR-005 selects `yaml` and `jsonc-parser` for authoritative physical source indexing.
* Third-party parser types must not become OAIT's domain model.
* Full third-party dereference is not OAIT's canonical representation.

SPIKE-001 through SPIKE-007 evaluated candidate OpenAPI parser and validator technologies.

The final parser-validator evaluation compared:

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19

@redocly/openapi-core@2.40.0

ibm-openapi-validator@1.37.15
```

The accepted weighted evaluation produced:

| Candidate             |    Score |
| --------------------- | -------: |
| Scalar                | **80.0** |
| Redocly               |     74.0 |
| IBM OpenAPI Validator |     49.0 |

Scalar and Redocly both remained technically viable primary-parser candidates.

Scalar was preferred based on semantic-ingestion fidelity, architectural fit, dependency shape, and its suitability for an in-process adapter architecture.

---

## 2. Problem

OAIT requires a third-party OpenAPI semantic parser without allowing that parser to become the owner of:

```text
source identity
reference provenance
source-access policy
normalized domain semantics
public OAIT types
finding semantics
```

The selected parser must therefore satisfy two different requirements.

First, it must provide sufficiently faithful OpenAPI semantic data for:

```text
OpenAPI source
      ↓
semantic parsing
      ↓
version-aware OAIT normalization
```

Second, it must remain replaceable behind an OAIT-owned boundary:

```text
Third-party parser
        ↓
OAIT Parser Adapter
        ↓
candidate-neutral semantic input
        ↓
OAIT normalized domain model
```

The architecture therefore needs to answer:

> **Which OpenAPI parser should OAIT use as its primary semantic-ingestion dependency, and what ownership boundaries must constrain that dependency?**

---

## 3. Decision

OAIT v0.1 will use:

```text
@scalar/openapi-parser@0.28.10
```

as its primary OpenAPI semantic parser.

Scalar will operate behind an OAIT-owned Parser Adapter.

The Parser Adapter will translate Scalar-specific runtime structures into candidate-neutral, version-aware semantic input suitable for the OAIT normalized domain model.

Scalar-specific types must not become part of OAIT core or public contracts.

The associated:

```text
@scalar/json-magic@0.12.19
```

technology may be used only as an optional operational transformation or bundling helper when a workflow explicitly requires such a view.

Bundled or dereferenced structures are not OAIT's canonical source representation.

---

## 4. Decision Statement

> **Use `@scalar/openapi-parser@0.28.10` as OAIT's primary OpenAPI semantic-ingestion parser behind an OAIT-owned Parser Adapter. Preserve OAIT ownership of source identity, reference evidence, version-aware normalization, and domain contracts. Treat Scalar bundling and dereferencing as optional noncanonical operational views rather than authoritative source representations.**

---

## 5. Decision Scope

This ADR selects the technology used for:

```text
OpenAPI semantic ingestion
```

and defines the boundary around that dependency.

It covers:

* Primary OpenAPI parser selection.
* Parser Adapter ownership.
* OpenAPI 3.0/3.1/3.2 semantic-ingestion expectations.
* Candidate-specific type containment.
* Interaction with OAIT source evidence.
* Optional bundling/transformation behavior.
* Dereference constraints.
* Dependency/version qualification.

This ADR does not select OAIT's complete conformance-validation strategy.

Validator evidence and deterministic conformance ownership are addressed separately.

---

## 6. Evidence Basis

The decision is supported by the completed technical-validation program:

| Evidence area                  | Source                           |
| ------------------------------ | -------------------------------- |
| Parser and version support     | SPIKE-001                        |
| `$ref` and multi-file behavior | SPIKE-002                        |
| Source-location preservation   | SPIKE-003                        |
| Source-indexing technology     | SPIKE-LOC-001 / ADR-005          |
| OpenAPI 3.2 operations         | SPIKE-004                        |
| Schema and dialect fidelity    | SPIKE-005                        |
| Validator evidence             | SPIKE-006                        |
| Operational suitability        | SPIKE-007                        |
| Final technology synthesis     | `parser-validator-evaluation.md` |

The final evaluation applied mandatory parser gates before weighted scoring.

Both Scalar and Redocly remained eligible primary-parser candidates.

Scalar's selection therefore does not depend on Redocly being technically incapable of parsing OpenAPI.

---

## 7. Why Scalar Was Selected

Scalar provides the strongest overall fit for OAIT's primary semantic-ingestion role.

The decision is based on the combination of:

* OpenAPI 3.0/3.1/3.2 runtime support.
* Strong raw schema preservation.
* OpenAPI 3.2 operation preservation.
* Recursive-schema handling.
* `$ref`-aware processing.
* In-process JavaScript/TypeScript integration.
* Operationally suitable performance.
* Manageable dependency posture.
* Compatibility with an OAIT-owned adapter boundary.
* Ability to provide bounded validation evidence without introducing a second default parser/validator dependency family.

No single characteristic determines the decision.

In particular:

```text
fastest parser
≠
automatically best parser
```

and:

```text
most source-rich diagnostics
≠
automatically best semantic parser
```

The decision optimizes the role Scalar performs inside the complete OAIT architecture.

---

## 8. OpenAPI Version Support

The selected parser must support OAIT's required OpenAPI versions:

```text
3.0
3.1
3.2
```

SPIKE-001 established that Scalar processed representative OpenAPI:

```text
3.0.4
3.1.2
3.2.0
```

YAML and JSON inputs through its public APIs.

SPIKE-004 and SPIKE-005 added version-specific evidence for OpenAPI 3.2 operations and JSON Schema behavior.

OAIT must not infer semantic behavior solely from the parser accepting a document.

The normalized domain layer remains version aware.

Conceptually:

```text
declared OpenAPI version
        ↓
Scalar semantic parsing
        ↓
OAIT Parser Adapter
        ↓
version-specific normalization
        ↓
OAIT normalized model
```

The OpenAPI version must therefore remain explicit throughout parser adaptation and normalization.

---

## 9. Schema Semantic Fidelity

SPIKE-005 demonstrated strong Scalar preservation of the schema structures required by OAIT.

The evaluated behavior included:

* OAS 3.0 `nullable` semantics.
* OAS 3.1/3.2 JSON Schema type arrays.
* Boolean schemas.
* Composition keywords.
* Recursive schemas.
* `$ref` siblings.
* `jsonSchemaDialect`.
* Schema-level dialect declarations.
* Draft 2020-12 keywords.
* Arbitrary extension/unknown schema keywords.
* External schema references.

OAS 3.0 schema semantics must remain distinct from OAS 3.1/3.2 JSON Schema semantics.

OAIT must not convert OAS 3.0 into Draft 2020-12 merely to simplify normalization.

The Parser Adapter must preserve enough information for the appropriate version adapter to determine semantic meaning.

---

## 10. OpenAPI 3.2 Operation Discovery

SPIKE-004 established that Scalar preserves the important OpenAPI 3.2 structures required for OAIT-owned operation discovery, including:

```text
query
additionalOperations
```

OAIT must not rely on a hard-coded historical HTTP-method list.

The intended flow is:

```text
Scalar parsed document
        ↓
OAIT Parser Adapter
        ↓
VersionAdapter
        ↓
OperationDiscovery
        ↓
fixed operations
+
additional operations
        ↓
NormalizedOperation[]
```

Operation discovery remains OAIT semantic behavior.

Scalar provides structural evidence; OAIT determines normalized meaning.

---

## 11. Source Truth Remains OAIT-Owned

Scalar is not authoritative for physical source truth.

ADR-004 and ADR-005 remain controlling.

Before Scalar transformations are allowed to influence downstream processing, OAIT must already have captured:

```text
physical document identity
source ranges
RFC 6901 pointers
reference declarations
reference targets
reference-hop evidence
filesystem/network access decisions
```

Canonical logical source identity remains:

```text
physical document URI
+
RFC 6901 JSON Pointer
```

Physical occurrence/range evidence may supplement that identity for malformed or duplicate-key input.

Scalar-generated locations do not replace this model.

---

## 12. Parser Adapter Boundary

Scalar must be isolated behind an OAIT-owned Parser Adapter.

Conceptually:

```text
admitted source content
        ↓
Scalar
        ↓
Scalar Parser Adapter
        ↓
candidate-neutral parser result
        ↓
OAIT version adapters
        ↓
normalized domain model
```

The adapter is responsible for containing candidate-specific details such as:

* Scalar document/runtime types.
* Scalar parser error objects.
* Scalar lifecycle data.
* Scalar path representations.
* Scalar transformation metadata.
* Scalar reference helper structures.
* Cyclic dereferenced object graphs where encountered.

Downstream packages must consume OAIT-owned contracts.

---

## 13. Candidate Types Must Not Leak

OAIT core interfaces must not import Scalar-specific types.

For example, production architecture should avoid contracts conceptually equivalent to:

```text
normalize(
  scalarDocument: ScalarDocument
): NormalizedOpenApi
```

Instead the boundary should resemble:

```text
Scalar
   ↓
ParserAdapter
   ↓
OaitParsedOpenApiEvidence
   ↓
DomainNormalizer
```

The exact production type names are deferred to detailed design.

The architectural requirement is that replacing Scalar must not require redesigning the normalized domain model.

---

## 14. Scalar Does Not Own Source Loading Policy

Scalar's ability to load or resolve resources does not authorize it to make independent source-access decisions.

ADR-004 remains authoritative for:

* Filesystem admission.
* Canonical URI resolution.
* Root containment.
* Symlink-aware policy.
* Remote-reference policy.
* Network access.
* Resource deduplication.
* Source registry behavior.

Where practical, Scalar should operate on resources admitted and supplied through OAIT-controlled processing.

The production design must prevent parser convenience APIs from bypassing OAIT source-access policy.

---

## 15. Reference Handling

Scalar demonstrated useful support for:

* Internal references.
* External local references.
* Nested references.
* Shared targets.
* Recursive references.
* Missing targets.
* Missing files.
* Invalid fragments.

However, SPIKE-002 also demonstrated that transformations may:

* Rewrite external references.
* Move external content.
* Produce transformed pointers.
* Reduce direct correspondence to original source.
* Produce cyclic graphs when fully dereferenced.

Therefore:

```text
Scalar reference processing
≠
OAIT canonical reference evidence
```

OAIT's reference graph and source provenance remain separate and authoritative.

---

## 16. Bundling Is Optional and Noncanonical

OAIT does not require a canonical bundled representation.

If a workflow requires bundled semantic access, OAIT may use:

```text
@scalar/json-magic@0.12.19
```

as an optional helper associated with the selected parser stack.

The intended relationship is:

```text
OAIT original-source evidence
        ↓
Scalar semantic parsing
        ↓
optional bundle
        ↓
bounded operational consumer
```

not:

```text
bundle
   ↓
new canonical source truth
```

OAIT must retain the distinction between:

```text
original pointer
```

and:

```text
bundled/transformed pointer
```

---

## 17. Full Dereference Is Not Canonical

OAIT will not use full Scalar dereference as its canonical OpenAPI representation.

Recursive OpenAPI schemas naturally form graphs.

Expanding those graphs into direct JavaScript object references can produce cycles.

A cyclic runtime representation may be useful for a narrowly scoped algorithm, but it is unsuitable as OAIT's stable source or normalized identity model.

The canonical architecture remains reference aware:

```text
source entity
+
reference edge
+
target identity
```

rather than attempting to permanently replace all reference edges with expanded objects.

---

## 18. Normalization Remains OAIT-Owned

Selecting Scalar does not delegate normalization semantics to Scalar.

OAIT remains responsible for:

* Version-specific interpretation.
* Operation discovery.
* Schema semantic normalization.
* Canonical entity identity.
* Reference-aware graph semantics.
* Preservation of source provenance.
* Candidate-neutral domain contracts.

Scalar provides parser evidence.

OAIT assigns normalized meaning.

---

## 19. Validation Is Outside This ADR

Scalar exposes validation behavior and SPIKE-006 established that it can provide useful bounded validation evidence.

However, Scalar validation is not sufficient to become OAIT's sole conformance authority.

SPIKE-006 identified false-negative gaps including tested cases involving:

* Missing `info.version`.
* Duplicate parameter identity.
* Duplicate `operationId`.
* Undeclared security requirements.
* A violation located in a referenced file.

Therefore this ADR does not decide the full validator architecture.

A separate ADR will define the hybrid conformance strategy involving:

```text
bounded external validator evidence
+
OAIT deterministic conformance rules
+
OAIT SourceIndex
```

Scalar's selection as parser must not be interpreted as automatic delegation of OAIT conformance semantics to Scalar.

---

## 20. Diagnostic Adaptation Is Outside This ADR

Scalar-specific diagnostics must eventually cross an OAIT-owned diagnostic adapter before they influence public OAIT findings.

That subsequent architecture will define:

* Vendor diagnostic containment.
* Candidate-neutral evidence.
* OAIT-owned rule IDs.
* OAIT-owned severity.
* OAIT version applicability.
* SourceIndex enrichment.
* Stable finding semantics.

The detailed diagnostic-adaptation decision will be recorded separately.

---

## 21. Performance Consequence

SPIKE-007 classified Scalar as:

```text
OPERATIONALLY_SUITABLE
```

for its evidenced OAIT roles.

Representative OAS 3.1 large-workload warm medians were approximately:

```text
load       71 ms
validate   95 ms
```

on the benchmarked macOS arm64 environment.

These measurements comfortably satisfy the current OAIT engineering targets for the evaluated workload.

They are directional engineering evidence, not guaranteed production SLAs.

Performance did not determine the technology selection; it establishes that the preferred semantic candidate is operationally reasonable.

---

## 22. Memory Consequence

The corrected maximum observed Scalar RSS in SPIKE-007 was approximately:

```text
421.14 MiB
```

for the evaluated OAS 3.1.2 large multi-file bundle scenario.

This is evidence from a benchmark process rather than a production memory guarantee.

Production design should avoid unnecessary repeated parse, validation, normalization, and transformation passes where correctness allows safe reuse.

Memory and caching optimizations must not weaken source provenance or semantic correctness.

---

## 23. TypeScript Integration Consequence

Scalar provides an in-process JavaScript/TypeScript-compatible API suitable for OAIT's TypeScript/Node.js architecture.

The experiments also identified dependency declaration/type-checking issues in the tested NodeNext environment.

The experimental environment required:

```text
skipLibCheck
```

to avoid candidate dependency declaration failures.

This constraint must be contained at the infrastructure/build boundary.

OAIT core domain types must not depend on Scalar declarations.

Production adoption should reassess whether the exact compilation workaround remains necessary under the production dependency graph and TypeScript configuration.

---

## 24. Dependency and Security Consequence

SPIKE-007 classified Scalar's tested dependency/security posture as:

```text
LOW_CONCERN
```

No evidence-backed blocking dependency-security issue was identified for the tested Scalar baseline.

This does not eliminate normal dependency governance.

Production adoption still requires:

* Pinned lockfile review.
* Dependency inventory.
* Automated vulnerability scanning.
* License review.
* Upgrade visibility.
* Regression testing when versions change.

Security findings must be reassessed against the actual production lockfile rather than assumed from the experimental environment indefinitely.

---

## 25. License Consequence

The evaluated direct Scalar packages use MIT-compatible licensing for the intended engineering use.

No unresolved direct-license blocker was identified during SPIKE-007.

This is an engineering dependency assessment, not a legal opinion.

Production distribution must still retain ordinary license inventory and compliance controls.

---

## 26. Version Policy

The evidence-backed initial baseline is:

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19
```

ADR-006 does not require OAIT to remain permanently on those exact package versions.

However, an upgrade that materially affects any of the following requires regression qualification:

* OAS 3.0 parsing.
* OAS 3.1 parsing.
* OAS 3.2 parsing.
* OpenAPI 3.2 operation structures.
* Boolean schemas.
* Dialect preservation.
* Unknown schema keywords.
* `$ref` sibling preservation.
* Recursive-reference behavior.
* Local and multi-file references.
* Bundling behavior.
* TypeScript integration.
* Performance.
* Dependency/security posture.

A materially incompatible upgrade may require ADR review.

---

## 27. Cross-Platform Qualification

SPIKE-007 benchmark execution was verified on:

```text
macOS arm64
Node.js v24.18.0
```

The architecture is expected to remain compatible with standard Node.js environments, but equivalent Linux and Windows execution was not benchmark-verified.

Production CI should therefore qualify the selected parser stack on supported Linux and Windows environments.

This is an implementation qualification requirement, not a blocker for the architecture decision.

---

## 28. Alternatives Considered

### Alternative A — Scalar OpenAPI Parser

**Selected.**

Advantages:

* Strong OAS 3.0/3.1/3.2 parser evidence.
* Strong raw schema preservation.
* OpenAPI 3.2 operation preservation.
* In-process programmatic API.
* Good architecture fit behind a Parser Adapter.
* Operationally suitable performance.
* LOW_CONCERN observed dependency posture.
* Optional transformation support through the same dependency family.
* Strongest final weighted evaluation score.

Known constraints:

* Does not own canonical source provenance.
* Transformation paths are not original pointers.
* Full dereference can create cyclic runtime graphs.
* Dependency declaration/type-checking issues require containment.
* Validator evidence is incomplete and must not be confused with parser selection.

### Alternative B — Redocly OpenAPI Core

**Not selected for primary OAIT v0.1 parsing; retained as a viable deferred alternative.**

Advantages:

* Successfully processed the required OpenAPI version families.
* Preserved important OpenAPI 3.2 operation structures.
* Strong runtime structure preservation.
* Strong native diagnostic source attribution.
* Strong operational performance.
* In-process programmatic API.
* LOW_CONCERN observed dependency posture.

Reasons not selected:

* Scalar demonstrated stronger semantic-ingestion fidelity for OAIT's preferred role.
* Scalar provides a simpler fit with the selected parser plus bounded validation-evidence architecture.
* Scalar had the smaller evidenced dependency surface.
* Adding both as default parser/transformation dependencies would increase complexity without a demonstrated v0.1 requirement.

Redocly's validator defects do not make its parser technically invalid.

If future requirements make its source-rich capabilities materially valuable, the parser decision may be revisited through normal architecture review.

### Alternative C — IBM OpenAPI Validator

**Not selected as a primary parser.**

IBM was evaluated as a validator rather than a semantic parser.

Reasons it is unsuitable for the primary-parser role at the tested baseline include:

* No evidenced primary parser API for OAIT's required architecture.
* CLI/subprocess-oriented integration.
* OpenAPI 3.2 not supported in the tested baseline.
* Significant dependency-security concern in the evaluated dependency graph.

IBM's useful OAS 3.0/3.1 validator behavior remains a separate conformance-strategy consideration.

### Alternative D — Build an OAIT-Owned Complete OpenAPI Parser

**Not selected for v0.1.**

OAIT already owns the architecture-specific semantics that matter most:

```text
source identity
version-aware normalization
reference evidence
rule semantics
domain contracts
```

Reimplementing complete OpenAPI YAML/JSON semantic parsing would duplicate substantial mature parser functionality without demonstrated product value.

An OAIT-owned semantic parser would also create:

* Larger maintenance surface.
* Greater OpenAPI-version compatibility burden.
* Additional JSON Schema implementation risk.
* More testing requirements.
* Slower delivery of higher-value OAIT capabilities.

OAIT should own its semantic boundaries rather than unnecessarily own every parsing mechanism beneath those boundaries.

---

## 29. Positive Consequences

This decision provides:

* One preferred in-process OpenAPI semantic parser for v0.1.
* Strong OpenAPI 3.0/3.1/3.2 evidence.
* Strong schema-preservation evidence.
* A replaceable candidate boundary.
* Clear separation between source truth and semantic parsing.
* Clear separation between parsing and normalization.
* No requirement for a second default bundling dependency.
* Optional transformation capability when needed.
* Compatibility with the OAIT TypeScript/Node architecture.
* A clear progression into detailed production parser design.

---

## 30. Negative Consequences

The architecture must accommodate several constraints:

* Scalar-specific types require adapter containment.
* Source locations cannot be delegated to Scalar.
* OAIT must maintain a separate SourceIndex.
* Reference provenance must be captured before transformations.
* Bundled locations require original/transformed distinction.
* Full dereference cannot be used indiscriminately.
* Dependency declaration issues may require build-level mitigation.
* Validation gaps require a separate hybrid conformance architecture.
* Cross-platform CI qualification remains necessary.

These are accepted costs of preserving OAIT ownership and replaceability.

---

## 31. Neutral Consequences

The following remain intentionally unresolved by this ADR:

* Exact Parser Adapter TypeScript interfaces.
* Exact internal parsed-evidence type names.
* Caching strategy.
* Parse-result reuse.
* Exact bundling call sites.
* Exact validator orchestration.
* Deterministic rule execution order.
* Diagnostic deduplication.
* CLI command design.
* MCP integration.
* AI workflows.

These belong to subsequent ADRs or detailed production design.

---

## 32. Production Design Requirements

Detailed parser design following this ADR must define at least:

1. Parser Adapter input and output contracts.
2. Interaction with SourceRegistry and SourceIndex.
3. OpenAPI version detection handoff.
4. Error and partial-result behavior.
5. Candidate-neutral parsed evidence.
6. Reference-boundary preservation.
7. Optional bundle lifecycle.
8. Prevention of uncontrolled source fetching.
9. TypeScript dependency isolation.
10. Upgrade regression tests.
11. OAS 3.0/3.1/3.2 fixture coverage.
12. Large-specification performance tests.
13. Linux and Windows CI qualification.

The production design must remain consistent with ADR-003, ADR-004, ADR-005, and this ADR.

---

## 33. Relationship to Existing ADRs

### ADR-003 — Normalized OpenAPI Domain Model

ADR-003 remains authoritative for OAIT's canonical semantic model.

ADR-006 selects the parser that feeds that model.

```text
Scalar
   ↓
Parser Adapter
   ↓
ADR-003 version-aware normalization
```

Scalar does not replace the domain model.

### ADR-004 — Source Loading and Reference Evidence

ADR-004 remains authoritative before Scalar processing.

```text
OAIT source admission / evidence
        ↓
Scalar semantic parsing
```

Scalar must not independently redefine source identity or access policy.

### ADR-005 — Source Indexing Technology

ADR-005 remains authoritative for physical source indexing:

```text
YAML
→ yaml

JSON
→ jsonc-parser
```

Scalar is not the source-location parser.

The source-indexing and semantic-parser responsibilities are intentionally separate.

---

## 34. Relationship to Subsequent ADRs

ADR-006 establishes only the primary parser decision.

The parser-validator evaluation identified two additional architectural decisions that should be formalized separately:

```text
Hybrid conformance strategy
```

and:

```text
Candidate-specific diagnostic adaptation
```

Those ADRs must preserve the boundaries established here.

In particular:

```text
Scalar selected as parser
```

must never be interpreted as:

```text
Scalar selected as sole conformance authority
```

---

## 35. Implementation Sequencing

After ADR-006 and the related validation/diagnostic ADRs are accepted, detailed production design should proceed before implementation.

The expected architecture sequence is:

```text
ADR-003
Normalized domain model
        +
ADR-004
Source ownership
        +
ADR-005
Source indexing technology
        +
ADR-006
Primary semantic parser
        +
Hybrid conformance ADR
        +
Diagnostic adaptation ADR
        ↓
Detailed parser / validator design
        ↓
Production implementation
```

No production parser package should be introduced solely because this ADR exists before the corresponding detailed design is reviewed.

---

## 36. Follow-Up Actions

After this ADR is accepted:

1. Formalize the hybrid validation/conformance strategy.
2. Formalize the candidate diagnostic-adaptation boundary.
3. Produce detailed parser/validator production design.
4. Define Parser Adapter interfaces.
5. Define candidate-neutral parsed evidence.
6. Define integration with SourceRegistry and SourceIndex.
7. Establish production dependency baselines.
8. Add Linux and Windows qualification to CI design.
9. Implement only after the relevant design review is complete.

---

## 37. Review Criteria

ADR-006 is ready for acceptance when reviewers confirm that it:

* Records Scalar as the primary semantic parser without reopening the completed evaluation.
* Preserves Redocly as a viable but deferred alternative.
* Does not treat IBM as a primary parser.
* Preserves ADR-003 normalization ownership.
* Preserves ADR-004 source/reference ownership.
* Preserves ADR-005 physical source indexing.
* Keeps candidate types behind an adapter.
* Keeps bundling optional and noncanonical.
* Keeps full dereference noncanonical.
* Keeps validation strategy outside this ADR.
* Records dependency/type and cross-platform qualification constraints.
* Introduces no production implementation.

---

## 38. Final Consequence

OAIT now has a complete ownership boundary for source and semantic ingestion:

```text
Physical source
      ↓
ADR-004 source admission / policy
      ↓
ADR-005 source indexing
      ↓
Scalar semantic parsing
      ↓
OAIT Parser Adapter
      ↓
ADR-003 version-aware normalization
      ↓
OAIT normalized domain model
```

The architecture deliberately separates:

```text
how OpenAPI is parsed
```

from:

```text
how OAIT defines identity, semantics, and findings
```

This separation allows OAIT to use a mature third-party parser while retaining control over the architectural contracts that define the product.
