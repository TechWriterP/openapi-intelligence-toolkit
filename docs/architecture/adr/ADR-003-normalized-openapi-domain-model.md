# ADR-003: Use a Normalized, Version-Aware OpenAPI Domain Model

**Status:** Accepted
**Date:** 2026-08-09
**Decision owners:** OAIT Architecture
**Applies to:** OAIT v0.1 and later
**Related documents:** `system-architecture.md`, `openapi-quality-model.md`, `rule-catalog.md`, `rule-schema.md`

---

## 1. Context

The OpenAPI Intelligence Toolkit (OAIT) must analyze OpenAPI specifications across multiple OpenAPI 3.x versions and support a growing set of capabilities, including:

* Validation.
* Deterministic review.
* Quality scoring.
* Quality gates.
* Future AI-assisted review.
* Specification improvement.
* Semantic comparison.
* Breaking-change detection.
* Release-note generation.
* OpenAPI creation.

OpenAPI specifications can be represented as:

* YAML.
* JSON.
* Single-file documents.
* Multi-file documents connected through `$ref`.
* Different OpenAPI versions with different structural and semantic rules.

OAIT v0.1 is expected to support OpenAPI 3.x specifications, including version families whose details are not identical.

Examples of version-specific differences include:

* Available operation forms.
* Response Object semantics.
* Parameter capabilities.
* JSON Schema behavior.
* Root document requirements.
* Reference handling.

If every downstream OAIT component interprets the raw OpenAPI document independently, version-specific behavior would be repeated across:

* Validators.
* Rules.
* Scoring support.
* AI workflows.
* Diff processing.
* Enhancement workflows.

This would create inconsistent behavior and significantly increase maintenance complexity.

---

## 2. Problem

OAIT needs a stable internal representation of an OpenAPI specification that allows downstream components to reason about API concepts without understanding:

* Whether the input was YAML or JSON.
* Whether an element was defined inline or through `$ref`.
* Whether a parameter originated at the Path Item or Operation level.
* How a particular OpenAPI version represents an operation or response.
* How OpenAPI 3.0, 3.1, and 3.2 differ structurally.
* How source files are divided in a multi-file specification.

Without an internal abstraction, a rule such as:

```text
Every operation should have a summary.
```

could require implementation logic resembling:

```text
Look under GET
Look under POST
Look under PUT
Look under DELETE
Look under PATCH
Look under TRACE
Look under QUERY for OpenAPI 3.2
Look under additionalOperations for OpenAPI 3.2
Resolve references
Track source files
Map back to original location
```

The same traversal logic would then be duplicated in many rule implementations.

The architecture therefore needs to answer:

> What representation should downstream OAIT components consume when analyzing OpenAPI specifications?

---

## 3. Decision

OAIT will introduce an **OAIT-owned normalized, version-aware OpenAPI domain model** between OpenAPI parsing and all higher-level analysis.

The processing boundary will be:

```text
Raw YAML / JSON
      ↓
Parser
      ↓
OpenAPI Version Detection
      ↓
Reference Resolution
      ↓
Version-Aware Normalization
      ↓
Normalized OAIT Domain Model
      ↓
Validation / Rules / Scoring / AI / Diff / Enhancement
```

Rules and higher-level analysis components must operate primarily on the normalized OAIT domain model.

They must not directly traverse raw YAML or JSON structures except through narrowly defined infrastructure or diagnostic mechanisms.

---

## 4. Decision Statement

> **Parse OpenAPI according to its declared version, normalize version-specific structures into OAIT-owned domain concepts, preserve traceability to the original source, and require downstream analysis to depend on those normalized concepts rather than raw document representation.**

---

## 5. Why Rules Must Not Traverse Raw YAML or JSON

### 5.1 Raw representation is not the domain model

YAML and JSON represent serialization formats.

OAIT's business concepts are things such as:

* API operation.
* Parameter.
* Request body.
* Response.
* Schema.
* Tag.
* Security scheme.

Rules should operate on these concepts rather than serialization mechanics.

---

### 5.2 YAML and JSON should behave equivalently

The following logically equivalent inputs:

```yaml
openapi: 3.1.0
```

and:

```json
{
  "openapi": "3.1.0"
}
```

must produce equivalent deterministic analysis.

A normalized domain model removes representation differences before rule evaluation.

---

### 5.3 Version logic would otherwise be duplicated

A raw-document approach would require each operation-level rule to understand which fields represent operations in each supported OpenAPI version.

For example:

```text
OAIT-DOC-002
Operation summary present
```

and:

```text
OAIT-OPS-001
Operation identifier present
```

would both need the same version-aware operation-discovery logic.

That duplication violates separation of concerns.

---

### 5.4 Reference resolution would be duplicated

Rules should not need to determine whether a parameter is:

```text
inline
```

or:

```text
$ref
```

The normalization layer should expose the logical parameter and retain source traceability.

---

### 5.5 Path-level parameter inheritance is domain behavior

An effective operation parameter set may contain parameters inherited from a Path Item plus Operation-level overrides.

Individual rules should not repeatedly implement this resolution.

---

### 5.6 Raw traversal increases inconsistent findings

If multiple rule authors implement their own traversal logic, they may:

* Discover different operation sets.
* Interpret references differently.
* Handle version differences differently.
* Generate inconsistent source locations.

A shared domain model makes behavior uniform.

---

### 5.7 Raw traversal couples rules to OpenAPI structure

If future OpenAPI versions introduce new structural forms, many rules could require changes.

With normalization:

```text
OpenAPI structural change
          ↓
Adapter / Normalizer
          ↓
Stable domain concept
```

Most downstream rules can remain unchanged.

---

## 6. Proposed Architectural Boundary

```text
┌───────────────────────────────┐
│      OpenAPI Source           │
│ YAML / JSON / Multi-file      │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ Parser / Version Detector     │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ Reference Resolver            │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ Version Adapter / Normalizer  │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ OAIT Domain Model             │
│                               │
│ Document                      │
│ Operation                     │
│ Parameter                     │
│ RequestBody                   │
│ Response                      │
│ Schema                        │
│ Tag                           │
│ SecurityScheme                │
└──────────────┬────────────────┘
               ▼
       ┌───────┼─────────┬─────────┐
       ▼       ▼         ▼         ▼
     Rules   Scoring   Future AI  Future Diff
```

---

## 7. Normalization Does Not Mean Information Loss

The normalized model must not discard information needed for:

* Diagnostics.
* Findings.
* Report traceability.
* Future modification.
* Contract comparison.
* Debugging.

Each normalized object should retain a link to its originating source.

Conceptually:

```typescript
interface NormalizedParameter {
  name: string;
  location: ParameterLocation;
  required: boolean;

  source: SourceLocation;

  raw?: unknown;
}
```

The precise TypeScript model will be defined separately.

---

## 8. Source Location Preservation

Source traceability is a mandatory part of normalization.

Each relevant normalized object should retain enough information to identify its original location.

The minimum canonical source-location model is:

```yaml
file: openapi.yaml
pointer: /paths/~1customers~1{customerId}/get/parameters/0
```

Where available:

```yaml
line: 42
column: 7
```

may also be retained.

---

## 9. Why Source Location Matters

Without source-location preservation, OAIT could detect:

```text
Parameter description missing
```

but report only:

```text
customerId
```

A useful finding should instead be able to identify:

```text
File:
openapi.yaml

Operation:
GET /customers/{customerId}

Parameter:
customerId

Pointer:
/paths/~1customers~1{customerId}/get/parameters/0
```

This traceability is required for developer trust and future automated remediation.

---

## 10. Multi-File Source Preservation

Normalization must not flatten multi-file documents in a way that loses file ownership.

Example:

```text
openapi.yaml
    ↓
paths/customers.yaml
    ↓
schemas/customer.yaml
```

A finding against the `Customer` schema should identify:

```text
schemas/customer.yaml
```

rather than only the entry document.

The internal normalized model may represent the logical specification as one graph while preserving physical source boundaries.

---

## 11. Version-Awareness Strategy

Version-specific behavior will be centralized through:

1. Version detection.
2. Version adapters.
3. Capability metadata.
4. Normalization.

---

## 12. Version Detection

The parser determines the declared OpenAPI version before semantic normalization.

Conceptually:

```typescript
type OpenApiVersionFamily =
  | "3.0"
  | "3.1"
  | "3.2";
```

The exact representation will be defined during domain-model design.

---

## 13. Version Adapter

The architecture should provide an adapter or equivalent strategy for interpreting version-specific structures.

Conceptually:

```text
OpenAPI 3.0
   ↓
OAS30Adapter

OpenAPI 3.1
   ↓
OAS31Adapter

OpenAPI 3.2
   ↓
OAS32Adapter
```

All produce the same normalized OAIT domain concepts where semantics are equivalent.

---

## 14. Version Capabilities

Some differences cannot or should not be normalized away.

OAIT may expose capabilities such as:

```typescript
interface OpenApiCapabilities {
  supportsQueryOperation: boolean;
  supportsAdditionalOperations: boolean;
  supportsResponseSummary: boolean;
  responseDescriptionRequired: boolean;
}
```

A rule may consult these capabilities when the rule itself is genuinely version-sensitive.

Rules should not infer capabilities from version strings independently.

---

## 15. Version-Specific Rules Remain Possible

Normalization does not prohibit version-specific rules.

For example:

```text
OAIT-CON-009
OpenAPI 3.0 operation defines responses
```

is intentionally applicable only to OpenAPI 3.0.x.

The Rule Registry can filter the rule by declared version.

The key distinction is:

> Rule applicability may be version-specific, but low-level structural interpretation should remain centralized.

---

## 16. Normalized Operation Discovery

Operation discovery is a primary reason for this decision.

Downstream components should receive:

```text
NormalizedOperation[]
```

rather than scanning Path Item fields directly.

Conceptually:

```typescript
document.operations
```

could contain:

```text
GET /customers
POST /customers
QUERY /search
CUSTOM /events
```

depending on supported OpenAPI features.

The rules engine should not care how these operations were represented in the original version.

---

## 17. Normalized Parameter Resolution

The model should expose effective parameters after considering:

* Path-level declaration.
* Operation-level declaration.
* Overrides.
* References.
* Version-specific parameter locations.

A rule such as:

```text
Parameter description present
```

should receive a normalized parameter collection rather than implement inheritance logic.

---

## 18. Normalized Response Representation

Response normalization should provide common information such as:

* Response selector/status code.
* Summary where available.
* Description where available.
* Content.
* Headers.
* Links.
* Source location.

Version-specific rules may still determine whether a field is mandatory.

---

## 19. Schema Normalization

Schema normalization is more sensitive because OpenAPI 3.0 and later OpenAPI versions differ in their JSON Schema alignment.

The architecture must therefore avoid forcing all schema semantics into an oversimplified common model.

The normalized schema abstraction should expose common concepts where safe while retaining access to version-specific schema information.

The model must not alter or reinterpret schema semantics merely for convenience.

---

## 20. Parser Design Impact

This decision makes the parser package more than a syntax parser.

The parser architecture will need distinct responsibilities:

```text
Source Loader
      ↓
YAML / JSON Parser
      ↓
Version Detector
      ↓
Reference Resolver
      ↓
Version Adapter
      ↓
Normalizer
      ↓
Source Location Mapper
```

These responsibilities may be separate components even if one external library supports several of them.

---

## 21. Parser Package Responsibility

The parser package becomes responsible for producing a trusted internal representation suitable for deterministic analysis.

It must provide:

* Parsed source representation.
* OpenAPI version.
* Reference graph.
* Normalized objects.
* Version capabilities.
* Source-location metadata.

It must not perform quality scoring.

---

## 22. Rule Design Impact

Rule handlers become smaller and more focused.

Without normalization:

```typescript
if (
  node.paths &&
  node.paths[path] &&
  node.paths[path].get &&
  ...
) {
}
```

With normalization:

```typescript
for (const operation of document.operations) {
  evaluate(operation);
}
```

The latter is easier to:

* Read.
* Test.
* Reuse.
* Maintain.
* Extend.

---

## 23. Rule Target Model

Rules should declare logical targets such as:

```text
document
operation
parameter
request-body
response
schema
schema-property
tag
security-requirement
```

The Rules Engine asks the normalized model for these targets.

Rules do not implement raw source discovery independently.

---

## 24. Rule Testing Impact

Normalization allows most rule tests to focus on business behavior rather than parser mechanics.

For example:

```text
OAIT-DOC-004
```

can be tested using normalized parameter fixtures.

Separate parser integration tests verify that real OpenAPI inputs produce the expected normalized parameters.

This creates a cleaner test pyramid:

```text
Raw OpenAPI fixtures
        ↓
Parser integration tests
        ↓
Normalized domain objects

Normalized objects
        ↓
Rule unit tests
```

---

## 25. Scoring Impact

The Scoring Engine is not directly affected by OpenAPI version differences.

It consumes:

```text
RuleInstance[]
```

Therefore:

```text
OpenAPI version
      ↓
Parser / Normalizer / Rule applicability
      ↓
Rule Instances
      ↓
Scoring
```

Scoring remains stable and version-independent.

---

## 26. Reporting Impact

Findings produced from normalized objects retain source locations.

The Reporting Engine can therefore display:

* Logical API context.
* Physical source location.

Example:

```text
OAIT-DOC-004 — Parameter description missing

GET /customers/{customerId}

Parameter:
customerId

Source:
paths/customers.yaml

Pointer:
/get/parameters/0
```

---

## 27. Impact on Future AI Components

Future AI capabilities will consume the normalized model instead of independently parsing OpenAPI.

This provides several benefits.

### Controlled context selection

OAIT can supply an AI model with only:

```text
Operation
+
Parameters
+
Request
+
Responses
+
Relevant schemas
```

instead of an entire specification.

### Evidence grounding

AI suggestions can reference normalized source locations.

### Version consistency

AI orchestration does not need custom interpretation logic for every OpenAPI version.

### Prompt-injection isolation

OpenAPI content remains clearly represented as data supplied by the domain model.

---

## 28. AI Architecture Consequence

Future flow:

```text
Raw OpenAPI
    ↓
Normalize
    ↓
Deterministic findings
    ↓
Relevant domain objects
    ↓
AI workflow
    ↓
Structured suggestion
```

AI should not become an alternate parser.

---

## 29. Impact on Future Diff Component

Semantic comparison requires logical API concepts rather than raw text differences.

With normalization:

```text
OpenAPI v1 YAML
      ↓
Normalized Model A

OpenAPI v2 JSON
      ↓
Normalized Model B

A + B
  ↓
Semantic Comparator
```

This naturally eliminates irrelevant differences such as:

* YAML versus JSON.
* Property ordering.
* Formatting.
* Some reference layout differences.

---

## 30. Diff Architecture Consequence

The future comparator can compare:

```text
Operation identity
Parameter identity
Request model
Response model
Schema model
Security requirements
```

rather than textual line changes.

This is critical for breaking-change detection.

---

## 31. Impact on Future Enhancer

The Enhancer will need both:

* Normalized semantic representation.
* Original source location.

Flow:

```text
Finding
   ↓
Normalized target
   ↓
AI or deterministic suggestion
   ↓
Source location
   ↓
Overlay or transformation
```

The domain model therefore must preserve enough correspondence to generate safe changes later.

---

## 32. Impact on Contract Guard

The future Contract Guard can derive a normalized representation of protected contract elements.

Example:

```text
Normalized operation
   ├── path
   ├── method
   ├── parameters
   ├── request schema
   ├── responses
   └── security
```

Before and after enhancement, these representations can be compared.

This is substantially safer than relying on raw text diffs.

---

## 33. Benefits

### 33.1 Centralized version semantics

OpenAPI-version differences are handled primarily in one architectural area.

---

### 33.2 Simpler rules

Rule handlers focus on quality requirements rather than document traversal.

---

### 33.3 Consistency

All downstream components see the same interpretation of:

* Operations.
* Parameters.
* Responses.
* Schemas.
* References.

---

### 33.4 Testability

Normalization can be tested independently from rule behavior.

---

### 33.5 Extensibility

Future OpenAPI versions can often be supported by adding or modifying adapters rather than rewriting every rule.

---

### 33.6 Reusability

The same domain model supports:

* Review.
* Scoring.
* AI.
* Diff.
* Enhancement.
* Release-note generation.

---

### 33.7 Better developer experience

Findings can present logical API context rather than opaque raw document paths alone.

---

### 33.8 Representation independence

Equivalent YAML and JSON inputs can produce equivalent analysis.

---

### 33.9 Better multi-file support

Logical elements can be unified while physical file locations remain traceable.

---

### 33.10 Reduced third-party coupling

OAIT's domain model creates a buffer between external OpenAPI libraries and OAIT's public behavior.

---

## 34. Costs

### 34.1 Additional implementation effort

OAIT must build and maintain:

* Domain types.
* Adapters.
* Normalization logic.
* Source mapping.

This is more work than allowing rules to inspect parser output directly.

---

### 34.2 Potential normalization bugs

Incorrect normalization could affect many downstream rules.

Normalization therefore becomes a critical subsystem requiring extensive tests.

---

### 34.3 Model evolution

As OAIT supports more OpenAPI features, the domain model must evolve.

---

### 34.4 Some semantics cannot be unified cleanly

OpenAPI 3.0 and later versions differ substantially in certain schema semantics.

The architecture must avoid creating misleading abstractions.

---

### 34.5 Memory overhead

Retaining:

* Raw representation.
* Parsed representation.
* Normalized representation.
* Source metadata.

may increase memory usage.

This is acceptable for v0.1 but should be benchmarked.

---

## 35. Consequences

### Positive consequences

* Rules remain small and focused.
* OpenAPI-version changes are isolated.
* YAML and JSON behave consistently.
* Future semantic diff becomes feasible.
* Future AI context extraction becomes cleaner.
* Contract Guard design becomes stronger.
* Source-level findings remain precise.

### Negative consequences

* Parser/normalizer architecture becomes more complex.
* The normalized model becomes an important internal API.
* Changes to domain types must be carefully managed.
* Contributors must understand the distinction between source representation and normalized representation.

---

## 36. Alternatives Considered

### Alternative A — Rules Traverse Raw YAML/JSON

Architecture:

```text
Raw OpenAPI
    ↓
Rules
```

#### Advantages

* Simple initial implementation.
* Minimal abstraction.
* Fast prototype.

#### Disadvantages

* Duplicated traversal.
* Duplicated version logic.
* Rules coupled to serialization.
* Difficult multi-file handling.
* Difficult future OpenAPI-version support.
* Harder semantic diff.
* Harder AI context extraction.
* Inconsistent reference handling.

#### Decision

Rejected.

The short-term simplicity creates unacceptable long-term coupling.

---

### Alternative B — Rules Use Third-Party Parser Types Directly

Architecture:

```text
Raw OpenAPI
    ↓
Third-party parser
    ↓
Parser-specific objects
    ↓
Rules
```

#### Advantages

* Less internal modeling work.
* Strong typing may already exist.
* Faster implementation.

#### Disadvantages

* Strong vendor/library coupling.
* Parser upgrades can break OAIT rules.
* Parser types may expose raw version-specific structures.
* OAIT cannot independently stabilize its domain contract.
* Difficult to replace parser later.

#### Decision

Rejected as the primary domain boundary.

Third-party types may be used inside parser infrastructure but should not become OAIT's core rule contract.

---

### Alternative C — Convert Every Input to One OpenAPI Version

Example:

```text
3.0 → convert to 3.2
3.1 → convert to 3.2
3.2 → use directly
```

#### Advantages

* One version representation downstream.
* Potentially fewer adapters.

#### Disadvantages

* Conversion may alter semantics.
* Some concepts do not map perfectly.
* Quality analysis could assess conversion artifacts rather than the original document.
* Source traceability becomes difficult.
* Validation should reflect the declared source version, not an artificial converted version.

#### Decision

Rejected.

OAIT will normalize concepts without pretending that all source documents are actually authored in the same OpenAPI version.

---

### Alternative D — Separate Complete Domain Models Per Version

Example:

```text
Oas30DomainModel
Oas31DomainModel
Oas32DomainModel
```

Rules would implement different handlers for each.

#### Advantages

* Maximum semantic fidelity.
* Little abstraction leakage.

#### Disadvantages

* Large duplication.
* Rules become version-specific even when semantics are identical.
* Future components require multiple models.
* Increased maintenance.

#### Decision

Rejected as the default approach.

OAIT will use a shared normalized model with version-specific capabilities and escape hatches where semantics genuinely differ.

---

### Alternative E — Normalized Domain Model with Version Capabilities

Architecture:

```text
Version-specific parsing
       ↓
Shared normalized concepts
       +
Version capabilities
       +
Source metadata
```

#### Advantages

* Stable domain boundary.
* Centralized version handling.
* Preserves meaningful differences.
* Supports simple common rules.
* Supports explicit version-specific rules when required.

#### Disadvantages

* Requires careful domain-model design.
* Requires adapters and tests.

#### Decision

Accepted.

---

## 37. Risks and Mitigations

### Risk — Over-normalization

OAIT could erase meaningful OpenAPI-version differences.

**Mitigation:**

* Preserve declared source version.
* Provide capability metadata.
* Retain raw source access.
* Avoid forcing incompatible schema semantics into one simplistic model.

---

### Risk — Under-normalization

If the model exposes too much raw structure, rules may still contain version logic.

**Mitigation:**

* Provide shared logical traversal APIs.
* Establish rule-design guidelines.
* Review rule handlers for raw-document access.

---

### Risk — Domain model becomes too large

Attempting to model the entire OpenAPI Specification immediately could delay v0.1.

**Mitigation:**

Build the domain model incrementally around v0.1 rule requirements.

---

### Risk — Source mapping becomes inaccurate after `$ref`

**Mitigation:**

Reference resolution must retain origin metadata independently from logical resolution.

---

### Risk — Third-party parser limitations

A selected parser may not fully support required OpenAPI versions or source mapping.

**Mitigation:**

Perform technical spikes before committing to the library.

---

## 38. Implementation Guidance

The normalized model should be built incrementally.

For v0.1, priority logical entities are:

```text
NormalizedOpenApiDocument
NormalizedInfo
NormalizedOperation
NormalizedParameter
NormalizedRequestBody
NormalizedResponses
NormalizedResponse
NormalizedSchema
NormalizedSchemaProperty
NormalizedTag
NormalizedSecurityRequirement
NormalizedSecurityScheme
SourceLocation
OpenApiCapabilities
```

The model should not attempt to mirror every OpenAPI field initially.

---

## 39. Raw Source Escape Hatch

Some future rules may require data not yet represented in the normalized model.

Normalized objects may therefore retain a controlled reference such as:

```typescript
raw?: unknown;
```

or an opaque source-node identifier.

This escape hatch must not become the normal rule-development path.

If multiple rules require the same raw information, the normalized model should be extended instead.

---

## 40. Domain Model Ownership

OAIT owns the normalized domain interfaces.

Therefore third-party parser objects should be converted at the parser boundary.

Conceptually:

```text
Third-party parser model
        ↓
OAIT Adapter
        ↓
OAIT Domain Model
```

This protects the rest of the codebase from third-party API changes.

---

## 41. Dependency Direction

The expected dependency direction is:

```text
Rules
  ↓
OAIT Domain Model
  ↑
Parser / Adapter
```

The domain model must not depend on:

* Rules.
* CLI.
* Scoring.
* Reporter.
* AI provider.

---

## 42. Architectural Enforcement

The project should consider automated architectural checks to discourage:

```text
packages/rules
      ↓
third-party parser package
```

Rules should depend on OAIT-owned contracts.

Possible enforcement mechanisms include:

* Package dependency boundaries.
* ESLint import restrictions.
* Monorepo dependency rules.
* Code review conventions.

The exact mechanism will be selected later.

---

## 43. Test Strategy

This decision creates several test layers.

### Adapter tests

Verify:

```text
OpenAPI 3.0 source
      ↓
correct normalized model
```

and equivalent tests for 3.1 and 3.2.

### Representation equivalence tests

Equivalent YAML and JSON inputs should normalize identically.

### Reference tests

Inline and referenced forms should produce equivalent logical entities where appropriate.

### Multi-file tests

Source origins must remain correct.

### Rule tests

Rules should be tested against normalized domain fixtures.

### Regression tests

Known normalization defects must receive dedicated fixtures.

---

## 44. Technical Spikes Required

Before finalizing the implementation, technical spikes should verify:

1. OpenAPI 3.0 parsing.
2. OpenAPI 3.1 parsing.
3. OpenAPI 3.2 parsing.
4. `query` operation discovery.
5. `additionalOperations` discovery.
6. Local `$ref` resolution.
7. Circular reference handling.
8. Multi-file source ownership.
9. JSON Pointer preservation.
10. Line and column preservation.
11. YAML/JSON equivalence.
12. Large-specification memory behavior.
13. Parser-library abstraction feasibility.

---

## 45. Impact on Public OAIT Behavior

The normalized domain model is initially an internal architectural contract.

OAIT public behavior should expose:

* Stable findings.
* Stable report schemas.
* Stable rule IDs.

It should not expose parser-library-specific object types.

Future package APIs may expose selected domain types if they become intentionally public.

---

## 46. Migration Strategy

Because OAIT has no implementation yet, no migration is required.

The normalized domain model should be introduced from the first v0.1 implementation.

Future changes to the domain model should:

* Prefer additive changes.
* Avoid unnecessary public exposure.
* Maintain adapter tests.
* Be documented when behavior changes.

---

## 47. Decision Consequence for v0.1 Scope

This ADR increases initial architecture effort but reduces rule-development complexity.

The recommended implementation sequence becomes:

```text
Define minimal domain types
        ↓
Select parser
        ↓
Build version detector
        ↓
Build adapters
        ↓
Build source mapping
        ↓
Normalize operations/parameters/responses
        ↓
Implement first rule handlers
```

The project should not begin by implementing all 29 rules against raw parser objects.

---

## 48. Compliance With This ADR

A new rule complies with this ADR when:

* It receives normalized OAIT targets.
* It does not parse YAML or JSON itself.
* It does not resolve `$ref` independently.
* It does not enumerate raw OpenAPI operation fields independently.
* It uses shared version capabilities when necessary.
* It produces findings using preserved source locations.

A rule that requires repeated raw-document traversal should trigger review of the domain model.

---

## 49. Status

**Accepted**

This decision is approved as the architectural baseline for OAIT v0.1.

Implementation details remain subject to technical spikes and subsequent ADRs, but the architectural boundary itself is considered established.

---

## 50. Follow-On Artifacts

This ADR should be followed by:

```text
docs/architecture/openapi-domain-model.md
```

That document will define the actual normalized logical entities and their relationships.

It should cover:

* `NormalizedOpenApiDocument`.
* `OpenApiVersion`.
* `OpenApiCapabilities`.
* `NormalizedInfo`.
* `NormalizedOperation`.
* `NormalizedParameter`.
* `NormalizedRequestBody`.
* `NormalizedResponses`.
* `NormalizedResponse`.
* `NormalizedSchema`.
* `NormalizedSchemaProperty`.
* `NormalizedTag`.
* `NormalizedSecurityRequirement`.
* `NormalizedSecurityScheme`.
* `SourceLocation`.
* Reference-origin metadata.
* Effective parameter modeling.
* Raw-source escape hatch.
* Domain invariants.

Additional related ADRs should address:

```text
ADR-005-openapi-validator-adapter.md
ADR-006-rule-metadata-handler-model.md
```

---