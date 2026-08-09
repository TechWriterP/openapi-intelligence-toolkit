# OpenAPI Intelligence Toolkit (OAIT)

## Rule Schema

**Document version:** 0.1
**Project status:** Planning
**Release applicability:** OAIT v0.1 and later
**Schema status:** Proposed logical model
**Related documents:** `openapi-quality-model.md`, `rule-catalog.md`, `functional-requirements.md`, `nonfunctional-requirements.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This document defines the proposed machine-readable model for rules used by the **OpenAPI Intelligence Toolkit (OAIT)**.

The rule schema establishes how OAIT represents:

* Rule identity.
* Rule metadata.
* Quality dimensions.
* Rule source classification.
* Severity.
* Weight.
* OpenAPI version applicability.
* Target objects.
* Applicability conditions.
* Dependencies and prerequisites.
* Executable rule handlers.
* Quality-gate behavior.
* Rule configuration.
* Profile overrides.
* Rule evaluation results.
* Rule instances.
* Findings.
* Remediation metadata.
* Rule versioning and lifecycle metadata.

The purpose of this schema is to establish a stable contract between:

```text
Rule definitions
      ↓
Rule registry
      ↓
Rules engine
      ↓
Rule instances
      ↓
Findings
      ↓
Scoring engine
      ↓
Reviewer / Reports
```

The detailed serialization format and implementation mechanism will be finalized during architecture and design.

---

# 2. Design Objectives

The rule model must support the following objectives.

## RS-OBJ-001 — Machine readability

Rules must be representable in a format that can be:

* Parsed programmatically.
* Validated.
* Version-controlled.
* Documented automatically.
* Inspected by contributors.

---

## RS-OBJ-002 — Separation of metadata and execution logic

Rule metadata should be separable from executable rule logic.

For example:

```yaml
id: OAIT-DOC-004
name: Parameter description present
implementation:
  handler: parameter-description-present
```

The metadata describes the rule.

The handler implements its deterministic evaluation.

---

## RS-OBJ-003 — Version awareness

Rules must explicitly declare which OpenAPI versions they support.

---

## RS-OBJ-004 — Explicit applicability

Rules must identify which objects and conditions they evaluate.

---

## RS-OBJ-005 — Explainable scoring

Rules must expose the metadata required by the scoring engine, including:

* Quality dimension.
* Weight.
* Severity.
* Quality-gate behavior.

---

## RS-OBJ-006 — Extensibility

The schema must support future:

* AI-assisted rules.
* Hybrid rules.
* Additional quality dimensions.
* Custom organizational rules.
* Remediation capabilities.
* Rule deprecation.
* Rule packs and plugins.

---

## RS-OBJ-007 — Stable reporting

Rule results must produce stable structures that can be consumed consistently by:

* CLI reports.
* JSON reports.
* Markdown reports.
* CI/CD.
* MCP tools.
* Future IDE integrations.

---

# 3. Core Domain Model

The rule system consists of several distinct entities.

```text
RuleDefinition
      │
      │ executed against
      ▼
RuleTarget
      │
      ▼
RuleInstance
      │
      ├── PASS
      ├── FAIL
      ├── NOT_APPLICABLE
      ├── SKIPPED
      └── ERROR
              │
              ▼
        Finding
       (when applicable)
```

Supporting entities include:

```text
RuleProfile
RuleDependency
RuleOverride
QualityGate
RuleRegistry
RuleExecutionContext
```

---

# 4. Rule Definition

A **Rule Definition** describes a reusable quality rule.

Conceptual representation:

```yaml
id: OAIT-DOC-004

name: Parameter description present

description: >
  Every API parameter should include a nonempty
  description.

dimension: documentation

sourceClass: OAIT_QUALITY

detection: deterministic

severity: warning

weight: 3

versions:
  - "3.0"
  - "3.1"
  - "3.2"

target:
  object: parameter

implementation:
  handler: parameter-description-present

gate:
  mode: none
```

---

# 5. Proposed RuleDefinition Schema

Conceptually:

```typescript
interface RuleDefinition {
  id: RuleId;
  name: string;
  description: string;

  dimension: QualityDimension;
  sourceClass: RuleSourceClass;
  detection: DetectionType;

  severity: Severity;
  weight: number;

  versions: VersionApplicability;

  target: RuleTargetDefinition;

  applicability?: ApplicabilityDefinition;

  dependencies?: RuleDependency[];

  implementation: RuleImplementation;

  gate: GateDefinition;

  remediation?: RemediationDefinition;

  documentation?: DocumentationMetadata;

  lifecycle?: RuleLifecycle;

  tags?: string[];
}
```

This TypeScript representation is illustrative only.

The canonical schema may ultimately be expressed using JSON Schema and serialized as YAML or JSON.

---

# 6. Rule Identity

## 6.1 `id`

Required.

Example:

```yaml
id: OAIT-DOC-004
```

The rule identifier must:

* Be unique within the OAIT rule registry.
* Remain stable after public release.
* Follow the approved rule taxonomy.
* Be suitable for CLI, reports, configuration, and issue tracking.

---

## 6.2 Identifier Pattern

Proposed pattern:

```text
OAIT-<CATEGORY>-<NUMBER>
```

Examples:

```text
OAIT-CON-001
OAIT-DOC-004
OAIT-SCH-001
OAIT-CNS-002
```

Proposed validation pattern:

```regex
^OAIT-[A-Z]{3}-[0-9]{3}$
```

Custom organizational rules may eventually use a different namespace.

Example:

```text
ACME-DOC-001
```

---

## 6.3 Rule Namespace

Future schema versions may explicitly represent the namespace.

Example:

```yaml
namespace: OAIT
categoryCode: DOC
number: 4
```

For v0.1, the complete `id` is sufficient.

---

# 7. Rule Name

## `name`

Required.

Example:

```yaml
name: Parameter description present
```

Requirements:

* Concise.
* Human-readable.
* Stable.
* Describes the expected condition rather than only the failure message.

Preferred:

```text
Parameter description present
```

Avoid:

```text
Bad parameter docs
```

---

# 8. Rule Description

## `description`

Required.

Provides the complete rule purpose.

Example:

```yaml
description: >
  Every resolved Parameter Object should include a
  nonempty description.
```

The description should explain the expectation without duplicating the rationale or remediation guidance.

---

# 9. Quality Dimension

## `dimension`

Required.

Allowed v0.1 values:

```text
conformance
documentation
completeness
schemas
responses
consistency
examples
governance
security
```

Example:

```yaml
dimension: documentation
```

The scoring engine maps each dimension to a category weight defined by the active quality profile.

---

# 10. Rule Source Class

## `sourceClass`

Required.

Allowed values:

```text
OAS_REQUIREMENT
OAIT_QUALITY
OAIT_PROFILE
```

Example:

```yaml
sourceClass: OAIT_QUALITY
```

Definitions:

### `OAS_REQUIREMENT`

The rule enforces an explicit OpenAPI Specification requirement.

### `OAIT_QUALITY`

The rule represents a generally recommended OAIT quality expectation.

### `OAIT_PROFILE`

The rule represents an optional policy convention typically controlled by a profile.

This field is important because OAIT must not present internal quality preferences as normative OpenAPI requirements.

---

# 11. Detection Type

## `detection`

Required.

Allowed values:

```text
deterministic
ai-assisted
hybrid
```

For v0.1:

```text
deterministic
```

is the only enabled type.

Example:

```yaml
detection: deterministic
```

Future example:

```yaml
detection: ai-assisted
```

for:

```text
OAIT-DOC-104
Parameter description is insufficient
```

---

# 12. Severity

## `severity`

Required.

Allowed values:

```text
critical
error
warning
info
```

Example:

```yaml
severity: warning
```

The severity describes the significance of a failed rule instance.

Severity is independent of weight.

---

# 13. Rule Weight

## `weight`

Required for score-participating rules.

Proposed range:

```text
1–5
```

Example:

```yaml
weight: 3
```

Interpretation:

| Weight | Meaning     |
| -----: | ----------- |
|      1 | Minor       |
|      2 | Normal      |
|      3 | Significant |
|      4 | High        |
|      5 | Very high   |

A future rule may explicitly opt out of scoring.

Example:

```yaml
scoring:
  enabled: false
```

For v0.1, all catalog rules should declare a weight.

---

# 14. OpenAPI Version Applicability

Version applicability must not be embedded only inside executable code.

It must be visible through rule metadata.

---

## 14.1 Simple Version Family Representation

Proposed v0.1 representation:

```yaml
versions:
  - "3.0"
  - "3.1"
  - "3.2"
```

This means that the rule applies to supported patch versions within those families.

---

## 14.2 Version-Specific Rule

Example:

```yaml
versions:
  - "3.0"
```

for:

```text
OAIT-CON-009
OpenAPI 3.0 operation defines responses
```

---

## 14.3 Future Range Representation

A future schema may support:

```yaml
versions:
  minimum: "3.1.0"
  maximumExclusive: "4.0.0"
```

or semantic expressions such as:

```yaml
versions:
  constraint: ">=3.1.0 <4.0.0"
```

The v0.1 format should remain intentionally simple unless a stronger requirement emerges during architecture.

---

# 15. Rule Target

The target describes the logical OpenAPI object evaluated by the rule.

Conceptual structure:

```yaml
target:
  object: parameter
```

---

## 15.1 Proposed Target Object Types

v0.1 should support logical targets such as:

```text
document
info
path
path-item
operation
parameter
request-body
response
schema
schema-property
tag
security-requirement
security-scheme
responses
```

Example:

```yaml
target:
  object: operation
```

---

## 15.2 Logical Rather Than Raw YAML Targets

Rules should use normalized OAIT object types rather than raw field traversal where practical.

Preferred:

```yaml
target:
  object: operation
```

Avoid requiring each rule to know:

```text
paths.*.get
paths.*.post
paths.*.query
additionalOperations.*
```

The version-aware parser and normalization layer should provide logical operations to the rule engine.

---

## 15.3 Optional Target Filters

A rule may define filters.

Example:

```yaml
target:
  object: parameter
  where:
    in:
      equals: path
```

This could support:

```text
OAIT-CON-005
Path parameter is required
```

Whether such filters are declarative or implemented by handlers will be finalized during design.

---

# 16. Applicability

Applicability determines whether a rule should evaluate a particular target.

Conceptual example:

```yaml
applicability:
  when:
    field: in
    equals: path
```

---

## 16.1 Applicability Outcomes

For each potential rule target:

```text
Applicable
    ↓
evaluate()

Not applicable
    ↓
NOT_APPLICABLE
```

Applicability must not be conflated with failure.

---

## 16.2 Example

Rule:

```text
OAIT-EXA-001
Request example present
```

A GET operation with no request body should result in:

```text
NOT_APPLICABLE
```

not:

```text
FAIL
```

---

## 16.3 Declarative Applicability

Simple conditions may eventually be represented declaratively.

Example:

```yaml
applicability:
  all:
    - field: requestBody
      exists: true
    - field: content
      exists: true
```

---

## 16.4 Handler-Based Applicability

Complex applicability may be implemented by the executable handler.

Example:

```yaml
implementation:
  handler: successful-response-example-present
```

The handler determines whether response content qualifies for example evaluation.

---

## 16.5 Design Recommendation

Use declarative applicability for simple metadata-driven conditions.

Use handler logic for complex OpenAPI semantics.

Do not create an overly complex custom expression language in v0.1.

---

# 17. Dependencies

Rules can depend on successful completion of other rule conditions or processing capabilities.

Example:

```yaml
dependencies:
  - rule: OAIT-CON-003
    requiredState: PASS
```

---

# 18. Dependency Types

The proposed model should support:

```text
hard
soft
ordering
```

---

## 18.1 Hard Dependency

The dependent rule cannot be evaluated meaningfully if the dependency fails.

Example:

```text
Reference resolves
      ↓
Schema description evaluation
```

If resolution fails:

```text
OAIT-DOC-007 → SKIPPED
```

---

## 18.2 Soft Dependency

The dependent rule can run, but its behavior may be adjusted.

Future example:

```text
AI semantic review can run even if optional metadata is missing.
```

---

## 18.3 Ordering Dependency

One rule must execute before another, but failure does not necessarily block it.

This should be used sparingly.

---

# 19. Proposed Dependency Schema

Example:

```yaml
dependencies:
  - ruleId: OAIT-CON-003
    type: hard
    onFailure: skip
```

Possible `onFailure` values:

```text
skip
error
continue
```

For most v0.1 hard dependencies:

```text
skip
```

is recommended.

---

# 20. Processing Dependencies

Not all prerequisites should be represented as rule-to-rule dependencies.

Some depend on platform capabilities.

Example:

```yaml
prerequisites:
  - parsed-document
  - resolved-references
```

Possible processing prerequisites may include:

```text
parsed-document
version-detected
resolved-references
normalized-operation-model
validated-schema
```

This distinction prevents the rules catalog from creating artificial dependency rules merely to represent engine state.

---

# 21. Rule Implementation Reference

Rule metadata must identify executable logic without embedding implementation code directly.

Example:

```yaml
implementation:
  type: handler
  handler: parameter-description-present
```

---

## 21.1 Handler Identifier

Handler IDs should be:

* Stable.
* Lowercase.
* Kebab-case.
* Independent from source-file paths.

Example:

```text
parameter-description-present
```

Avoid:

```text
src/rules/documentation/checkParameterDescription.ts
```

Metadata should not depend on repository layout.

---

## 21.2 Proposed Implementation Types

v0.1:

```text
handler
external-validator
```

Future:

```text
ai
hybrid
expression
```

---

## 21.3 Handler Rule

Example:

```yaml
implementation:
  type: handler
  handler: operation-summary-present
```

The Rule Registry resolves the handler identifier to executable code.

---

## 21.4 External Validator Rule

Some normative conformance rules may map external validator results to OAIT rules.

Example:

```yaml
implementation:
  type: external-validator
  adapter: openapi-validator
  code: path-parameter-required
```

The exact validator and adapter model will be decided through architecture evaluation.

---

# 22. Rule Registry

The Rule Registry connects metadata with executable behavior.

Conceptually:

```text
Rule metadata
     +
Handler registry
     ↓
Executable Rule
```

Example:

```text
parameter-description-present
       ↓
ParameterDescriptionPresentHandler
```

---

## 22.1 Registry Responsibilities

The registry should:

* Load rule metadata.
* Validate rule definitions.
* Detect duplicate IDs.
* Resolve handlers.
* Verify handler availability.
* Validate dependencies.
* Determine active rules.
* Apply profile overrides.

---

# 23. Quality Gate Model

Rule metadata must define default gate behavior.

Example:

```yaml
gate:
  mode: none
```

Allowed values:

```text
mandatory
configurable
none
```

---

## 23.1 Mandatory Gate

Example:

```yaml
gate:
  mode: mandatory
```

Failure causes the active quality gate to fail.

---

## 23.2 Configurable Gate

```yaml
gate:
  mode: configurable
```

The active profile may promote the rule to a mandatory gate.

---

## 23.3 No Independent Gate

```yaml
gate:
  mode: none
```

The rule may affect scoring but does not independently fail governance.

---

# 24. Remediation Metadata

v0.1 does not implement the Enhancer, but the rule schema should allow future remediation metadata.

Example:

```yaml
remediation:
  supported: true
  type: ai-assisted
  targetField: description
  contractSafe: true
```

---

## 24.1 Proposed Remediation Types

```text
none
deterministic
ai-assisted
hybrid
manual
```

---

## 24.2 Example

For:

```text
OAIT-DOC-004
Parameter description present
```

future metadata may be:

```yaml
remediation:
  supported: true
  type: ai-assisted
  contractSafe: true
  reviewRequired: true
```

---

# 25. Documentation Metadata

Rules should support documentation metadata.

Example:

```yaml
documentation:
  rationale: >
    Parameter descriptions explain API input semantics
    that may not be apparent from names alone.

  recommendation: >
    Add a concise description explaining the purpose
    of the parameter.

  reference:
    type: oait-quality-guideline
```

For OAS requirements:

```yaml
documentation:
  reference:
    type: openapi-specification
    section: Parameter Object
```

Exact URLs should not necessarily be embedded directly if documentation-generation tooling can resolve canonical references.

---

# 26. Rule Lifecycle Metadata

Rules should support lifecycle management.

Example:

```yaml
lifecycle:
  status: active
  introducedIn: "0.1.0"
```

Allowed future statuses:

```text
draft
active
deprecated
removed
experimental
```

---

## 26.1 Deprecation

Example:

```yaml
lifecycle:
  status: deprecated
  introducedIn: "0.1.0"
  deprecatedIn: "1.4.0"
  replacedBy: OAIT-DOC-014
```

Published stable rule IDs must not be silently reused.

---

# 27. Tags

Rules may have optional searchable tags.

Example:

```yaml
tags:
  - documentation
  - parameter
  - developer-experience
```

Tags should not affect scoring.

They may support:

* Documentation generation.
* Rule discovery.
* CLI filtering.
* Future marketplaces or custom rule packs.

---

# 28. Complete Rule Definition Example

Example:

```yaml
id: OAIT-DOC-004

name: Parameter description present

description: >
  Every resolved Parameter Object should include a
  nonempty description.

dimension: documentation

sourceClass: OAIT_QUALITY

detection: deterministic

severity: warning

weight: 3

versions:
  - "3.0"
  - "3.1"
  - "3.2"

target:
  object: parameter

dependencies:
  - ruleId: OAIT-CON-003
    type: hard
    onFailure: skip

implementation:
  type: handler
  handler: parameter-description-present

gate:
  mode: none

remediation:
  supported: true
  type: ai-assisted
  contractSafe: true
  reviewRequired: true

documentation:
  rationale: >
    Parameter descriptions help API consumers understand
    the meaning and intended use of request inputs.

  recommendation: >
    Add a concise description explaining what the
    parameter represents and how consumers should use it.

lifecycle:
  status: active
  introducedIn: "0.1.0"

tags:
  - documentation
  - parameter
```

---

# 29. Profiles

A **Rule Profile** defines how a collection of rules behaves for a specific quality policy.

The profile does not duplicate the complete rule definition.

It overrides selected configurable properties.

---

# 30. Proposed Profile Schema

Conceptually:

```typescript
interface RuleProfile {
  id: string;
  name: string;
  extends?: string;

  qualityGate?: QualityGateConfiguration;

  dimensions?: Record<string, DimensionOverride>;

  rules?: Record<RuleId, RuleOverride>;
}
```

---

# 31. Profile Example

```yaml
id: documentation

name: Documentation Quality

extends: default

qualityGate:
  minimumScore: 85

dimensions:
  documentation:
    weight: 35

rules:
  OAIT-DOC-003:
    severity: error
    weight: 4

  OAIT-EXA-001:
    enabled: true

  OAIT-GOV-001:
    enabled: false
```

---

# 32. Rule Override Model

A profile should be able to override only approved properties.

Example:

```yaml
rules:
  OAIT-DOC-004:
    enabled: true
    severity: error
    weight: 4
    gate:
      mode: configurable
```

---

## 32.1 Proposed Overridable Properties

Profiles may eventually override:

```text
enabled
severity
weight
gate mode
selected applicability parameters
```

Profiles must not override:

```text
rule ID
source classification
fundamental rule meaning
executable handler
```

unless a future extension mechanism explicitly defines this behavior.

---

# 33. Configuration Resolution Order

The proposed configuration precedence is:

```text
Built-in rule definition
        ↓
Built-in profile
        ↓
Project configuration
        ↓
CLI override
```

More specific configuration wins.

Example:

```text
Rule default weight:      2
Profile override:         3
Project override:         4
CLI override:             none
```

Effective weight:

```text
4
```

---

# 34. Effective Rule

Before execution, OAIT should resolve each configured rule into an **Effective Rule**.

Conceptually:

```yaml
id: OAIT-DOC-004

enabled: true

severity: error

weight: 4

gate:
  mode: configurable

source:
  baseRule: default
  profile: documentation
  projectOverride: true
```

The scoring engine should consume effective rule configuration rather than recomputing override precedence.

---

# 35. Rule Execution Context

A rule handler requires a controlled execution context.

Conceptual interface:

```typescript
interface RuleContext<TTarget> {
  document: NormalizedOpenApiDocument;
  target: TTarget;

  version: OpenApiVersion;

  location: SourceLocation;

  config: EffectiveRuleConfiguration;

  services: RuleServices;
}
```

---

# 36. Rule Services

Rules should receive approved shared services rather than independently parsing or traversing documents.

Potential services include:

```text
referenceResolver
operationDiscovery
schemaNavigator
locationResolver
versionCapabilities
normalizationService
```

This prevents rule implementations from duplicating version-aware OpenAPI logic.

---

# 37. Rule Handler Output

A rule handler must not produce arbitrary output.

It should return structured rule evaluations.

Conceptual:

```typescript
interface RuleEvaluation {
  state: RuleEvaluationState;
  message?: string;
  evidence?: Evidence[];
  metadata?: Record<string, unknown>;
}
```

Allowed states:

```text
PASS
FAIL
NOT_APPLICABLE
SKIPPED
ERROR
```

---

# 38. Rule Instance

A **Rule Instance** represents one rule evaluated against one logical target.

Example:

```text
Rule:
OAIT-DOC-004

Target:
GET /customers
parameter: limit
```

becomes one Rule Instance.

---

# 39. Proposed RuleInstance Schema

```yaml
instanceId: OAIT-DOC-004:abc123

ruleId: OAIT-DOC-004

target:
  type: parameter
  identity:
    path: /customers
    method: GET
    name: limit
    in: query

location:
  file: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0
  line: 34
  column: 9

state: FAIL

effectiveRule:
  severity: warning
  weight: 3
```

---

# 40. Rule Instance Identity

Rule instances need stable identity within a single analysis run.

Possible identity inputs include:

```text
rule ID
+
document identity
+
target location
```

Example:

```text
OAIT-DOC-004
+
openapi.yaml
+
/paths/~1customers/get/parameters/0
```

The resulting ID may be generated as:

```text
OAIT-DOC-004:4e89a21b
```

Persistent cross-version instance IDs are not required for v0.1.

---

# 41. Rule Instance State

Required:

```yaml
state: FAIL
```

Allowed values:

```text
PASS
FAIL
NOT_APPLICABLE
SKIPPED
ERROR
```

---

# 42. Rule Instance Scoring Metadata

The scoring engine may require:

```yaml
scoring:
  applicable: true
  weight: 3
```

A `NOT_APPLICABLE` instance should have:

```yaml
scoring:
  applicable: false
```

`SKIPPED` and `ERROR` require separate treatment and must not count as successful evaluation.

---

# 43. Finding

A **Finding** is a user-facing representation of a failed or otherwise reportable rule instance.

Usually:

```text
FAIL
    ↓
Finding
```

Some `ERROR` states may also produce diagnostic findings.

`PASS` normally does not generate a user-facing finding.

---

# 44. Proposed Finding Schema

```yaml
findingId: FND-01HXYZ123

ruleId: OAIT-DOC-004

ruleInstanceId: OAIT-DOC-004:4e89a21b

title: Parameter description missing

dimension: documentation

severity: warning

sourceClass: OAIT_QUALITY

detection: deterministic

location:
  file: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0
  line: 34
  column: 9

context:
  path: /customers
  method: GET
  parameter:
    name: limit
    in: query

message: >
  The query parameter "limit" does not define a description.

recommendation: >
  Add a concise description explaining the purpose of
  the parameter.

evidence:
  - type: field-missing
    field: description

scoring:
  weight: 3
  contributesToScore: true

gate:
  triggered: false
```

---

# 45. Finding ID

`findingId` identifies an individual finding in a report.

Example:

```text
FND-01HXYZ123
```

Requirements:

* Unique within the analysis result.
* Opaque to consumers.
* Not used as the stable rule identity.

Consumers must use:

```text
ruleId
```

when referring to the type of problem.

---

# 46. Finding Title

The title should describe the detected problem.

Rule name:

```text
Parameter description present
```

Finding title:

```text
Parameter description missing
```

These may intentionally differ.

---

# 47. Finding Location

The location model should support:

```yaml
location:
  file: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0
  line: 34
  column: 9
```

Minimum v0.1 requirement:

```text
file
pointer
```

Line and column are strongly desirable but depend on parser capabilities.

---

# 48. JSON Pointer as Canonical Logical Location

OAIT should prefer JSON Pointer as the stable machine-readable location representation.

Example:

```text
/paths/~1customers~1{customerId}/get/parameters/0
```

A human-readable path may additionally be provided.

Example:

```text
GET /customers/{customerId} → parameter customerId
```

---

# 49. Finding Context

Context provides domain-specific information useful to humans.

Example:

```yaml
context:
  path: /customers/{customerId}
  method: GET
  parameter:
    name: customerId
    in: path
```

Different target types may provide different context.

Schema example:

```yaml
context:
  schema: Customer
  property: customerId
```

---

# 50. Finding Evidence

Evidence records why the rule failed.

Conceptual examples:

```yaml
evidence:
  - type: field-missing
    field: description
```

or:

```yaml
evidence:
  - type: duplicate-value
    field: operationId
    value: getCustomer
```

or:

```yaml
evidence:
  - type: unresolved-reference
    value: "#/components/schemas/Customer"
```

Evidence will become especially important for future AI-assisted processing.

---

# 51. Recommendation

Rules may provide a standard recommendation.

Example:

```yaml
recommendation: >
  Add a concise description explaining the purpose
  and intended use of the parameter.
```

Recommendations must not invent API behavior.

For deterministic v0.1 rules, recommendations should typically explain **what information should be provided**, not fabricate that information.

---

# 52. Finding Scoring Data

The finding may contain resolved scoring metadata.

Example:

```yaml
scoring:
  contributesToScore: true
  weight: 3
```

The final category and overall score should not be calculated inside the finding.

---

# 53. Finding Gate Data

Example:

```yaml
gate:
  triggered: true
  reason: mandatory-rule
```

Possible reasons:

```text
mandatory-rule
critical-finding-limit
profile-policy
```

The quality-gate engine remains responsible for the overall gate result.

---

# 54. Duplicate Findings

The schema must support relationships between overlapping findings.

Example:

```yaml
relationships:
  relatedRules:
    - OAIT-CON-010

  scoringRole: primary
```

A secondary overlapping finding could contain:

```yaml
scoringRole: secondary
```

Only the designated primary finding should contribute to scoring for the same underlying defect.

---

# 55. Finding Group

Reports may group repeated findings.

Example:

```text
OAIT-DOC-004 — Parameter description missing

5 occurrences
```

Machine-readable reports should retain all individual findings.

Grouping is primarily a presentation concern.

---

# 56. Analysis Result

Rule instances and findings belong to an overall analysis result.

Conceptual structure:

```yaml
analysis:
  id: RUN-01HXYZ

  oaitVersion: 0.1.0

  qualityModelVersion: "0.1"

  rulesetVersion: "0.1"

  input:
    file: openapi.yaml
    openapiVersion: 3.1.2

  rules:
    evaluated: 24
    skipped: 2
    errors: 0

  instances:
    total: 418
    pass: 382
    fail: 31
    notApplicable: 3
    skipped: 2

  findings:
    total: 31
```

---

# 57. Relationship Between Rule Instances and Findings

Example:

```text
Rule:
OAIT-DOC-004

Applicable parameters:
100

Rule instances:
100

PASS:
95

FAIL:
5

Findings:
5
```

Therefore:

```text
rule definition
      ≠
rule instance
      ≠
finding
```

This distinction is fundamental to scoring.

---

# 58. Rule Compliance Calculation Input

The scoring engine consumes instance states.

For example:

```text
PASS = 95
FAIL = 5
```

Rule compliance:

```text
95 / 100 = 95%
```

Instances with:

```text
NOT_APPLICABLE
```

are excluded.

Instances with:

```text
SKIPPED
ERROR
```

must be handled through evaluation coverage rather than counted as passing.

---

# 59. Rule Definition Validation

Before a rule can enter the registry, its metadata must be validated.

Validation should detect:

* Missing required fields.
* Invalid ID format.
* Duplicate rule ID.
* Unknown dimension.
* Unknown severity.
* Invalid weight.
* Unsupported version format.
* Unknown handler.
* Circular rule dependency.
* Invalid gate mode.
* Invalid source classification.

---

# 60. Example Invalid Rule

```yaml
id: DOC-4
name: Check docs
severity: bad
weight: 99
implementation:
  handler: unknown-handler
```

Expected result:

```text
RULE_SCHEMA_ERROR

Invalid rule definition.
```

The invalid rule must not enter the active registry.

---

# 61. Canonical Rule Serialization

The recommended eventual approach is:

```text
Canonical schema:
JSON Schema

Human-authored representation:
YAML

Runtime representation:
Typed TypeScript objects
```

Conceptually:

```text
rule.yaml
   ↓
JSON Schema validation
   ↓
TypeScript RuleDefinition
   ↓
Rule Registry
```

This approach provides:

* Human readability.
* Machine validation.
* IDE schema support.
* Typed runtime access.
* Documentation generation.

The final choice should be documented through an ADR.

---

# 62. Proposed Rule File Layout

A possible future repository structure is:

```text
rulesets/
└── default/
    ├── conformance/
    │   ├── OAIT-CON-001.yaml
    │   ├── OAIT-CON-002.yaml
    │   └── ...
    │
    ├── documentation/
    │   ├── OAIT-DOC-001.yaml
    │   ├── OAIT-DOC-002.yaml
    │   └── ...
    │
    ├── schemas/
    ├── responses/
    ├── consistency/
    ├── examples/
    └── governance/
```

Alternative:

```text
rules/
├── conformance.yaml
├── documentation.yaml
└── ...
```

The physical file organization will be decided during design.

The logical schema should work with either layout.

---

# 63. Proposed Handler Layout

Executable handlers may use:

```text
packages/rules/src/handlers/
├── conformance/
├── documentation/
├── schemas/
├── responses/
└── governance/
```

Rule metadata must refer to handlers by logical identifier, not file path.

---

# 64. Example Metadata-to-Handler Resolution

Metadata:

```yaml
implementation:
  type: handler
  handler: parameter-description-present
```

Registry:

```text
parameter-description-present
        ↓
ParameterDescriptionPresentRule
```

This allows implementation files to move without changing public rule metadata.

---

# 65. Custom Rules

The schema should eventually support organization-defined rules.

Example:

```yaml
id: ACME-GOV-001

name: API owner extension present

dimension: governance

sourceClass: OAIT_PROFILE

detection: deterministic

severity: error

weight: 3

versions:
  - "3.1"
  - "3.2"

target:
  object: document

implementation:
  type: handler
  handler: acme-api-owner-present
```

Custom executable handlers introduce security and plugin-governance considerations and are outside v0.1 scope.

Declarative custom rules may be supported earlier if they can be implemented safely.

---

# 66. Declarative Rules

Future versions may support simple declarative rules without executable custom code.

Example concept:

```yaml
implementation:
  type: expression

  expression:
    field: info.contact
    exists: true
```

This could support simple custom governance rules.

However, OAIT v0.1 should not build a general-purpose rule-expression language unless necessary.

---

# 67. AI-Assisted Rule Extension

Future AI-assisted rules may extend the implementation block.

Example:

```yaml
implementation:
  type: ai

  evaluator: documentation-quality

  outputSchema: semantic-rule-result-v1
```

AI execution must still produce a structured rule result.

Example:

```yaml
state: FAIL

reason: >
  The description repeats the parameter name without
  explaining its meaning.

confidence: high
```

The scoring engine continues to consume structured rule states rather than free-form AI output.

---

# 68. Hybrid Rule Extension

Example:

```yaml
implementation:
  type: hybrid

  candidateHandler: short-description-detector
  aiEvaluator: documentation-quality
```

Flow:

```text
Deterministic candidate detection
          ↓
Candidate exists?
      │         │
     No        Yes
      │         │
     PASS       ▼
            AI evaluation
```

This capability is deferred beyond v0.1.

---

# 69. Rule Versioning

Rule definitions must support controlled evolution.

The following changes may occur without changing the rule ID if they do not materially change the rule meaning:

* Documentation wording.
* Recommendation wording.
* Tag changes.
* Internal handler refactoring.

The following may require a new rule ID or documented major ruleset change:

* Material applicability change.
* Different PASS/FAIL meaning.
* Different target semantics.
* Reclassification from quality guidance to normative requirement.

---

# 70. Ruleset Version

A collection of rule definitions must have a version.

Example:

```yaml
ruleset:
  id: default
  version: "0.1"
```

Reports should eventually record:

```text
OAIT version
Quality model version
Ruleset version
Profile
```

---

# 71. Rule Schema Version

The machine-readable rule schema itself must also be versioned.

Example:

```yaml
schemaVersion: "1"
```

This allows future evolution of rule metadata without ambiguity.

Complete rule example:

```yaml
schemaVersion: "1"

id: OAIT-DOC-004

name: Parameter description present

...
```

---

# 72. Profile Schema Version

Profiles should likewise declare their schema version.

Example:

```yaml
schemaVersion: "1"

id: default

name: Default OAIT Quality Profile
```

---

# 73. Finding Schema Version

Machine-readable findings should identify their schema version directly or through the enclosing report.

Example:

```json
{
  "schemaVersion": "1",
  "findings": []
}
```

A report-level schema version is preferred to repeating it for every finding.

---

# 74. Schema Compatibility Principles

Minor schema evolution should preserve compatibility where practical.

Examples of generally compatible changes:

* Adding optional metadata fields.
* Adding optional tags.
* Adding optional documentation metadata.

Potentially breaking changes:

* Renaming required fields.
* Changing field types.
* Removing allowed enum values.
* Changing identifier semantics.

Breaking schema changes must be versioned.

---

# 75. Security Considerations

Rule definitions must be treated as configuration data.

If externally supplied rules are supported in the future:

* Rule files must not execute arbitrary code by default.
* Handler references must resolve only to approved handlers.
* Unknown handler IDs must be rejected.
* Declarative expressions must be sandboxed or constrained.
* Remote rule loading should be explicitly controlled.
* Rule packages must be treated as third-party dependencies.

---

# 76. Profile Security

Profiles must not be allowed to:

* Replace executable handlers.
* Disable mandatory platform safety controls silently.
* Change rule source classification.
* Rewrite rule meaning.

A profile may configure policy.

It must not redefine implementation trust boundaries.

---

# 77. Traceability

The rule schema supports traceability through:

```text
Requirement
    ↓
Quality dimension
    ↓
RuleDefinition
    ↓
RuleInstance
    ↓
Finding
    ↓
Score / Quality Gate
    ↓
Test
```

Example:

```text
FR-REV-005
Parameter review
      ↓
QD-DOC
      ↓
OAIT-DOC-004
      ↓
Rule instance against GET /customers limit
      ↓
Finding
      ↓
Documentation score
```

---

# 78. Testing Requirements for the Rule Schema

The schema implementation must include tests for:

### Valid rule definitions

* Minimal valid deterministic rule.
* Rule with dependencies.
* Rule with remediation metadata.
* Version-specific rule.
* External-validator rule.

### Invalid rule definitions

* Missing ID.
* Invalid ID.
* Duplicate ID.
* Invalid severity.
* Invalid dimension.
* Invalid detection type.
* Invalid weight.
* Unknown version.
* Unknown handler.
* Invalid gate mode.

### Dependencies

* Valid dependency.
* Missing referenced rule.
* Circular dependency.
* Hard dependency.
* Soft dependency.

### Profiles

* Valid override.
* Unknown rule override.
* Invalid severity override.
* Invalid weight.
* Attempt to override protected metadata.

### Findings

* Required fields.
* Precise target location.
* Correct rule relationship.
* Scoring metadata.
* Duplicate-finding relationship.

---

# 79. Proposed Rule Schema Test Fixtures

Recommended structure:

```text
test-data/
└── rule-schema/
    ├── valid/
    │   ├── minimal-rule.yaml
    │   ├── dependency-rule.yaml
    │   ├── external-validator-rule.yaml
    │   └── remediation-rule.yaml
    │
    ├── invalid/
    │   ├── missing-id.yaml
    │   ├── invalid-severity.yaml
    │   ├── unknown-handler.yaml
    │   ├── invalid-weight.yaml
    │   └── circular-dependency.yaml
    │
    └── profiles/
        ├── default.yaml
        ├── documentation.yaml
        └── invalid-override.yaml
```

---

# 80. Proposed JSON Schema Artifacts

During detailed design, the project should consider creating:

```text
schemas/
├── rule-definition.schema.json
├── rule-profile.schema.json
├── rule-instance.schema.json
├── finding.schema.json
└── analysis-result.schema.json
```

These schemas would provide formal validation for OAIT's machine-readable contracts.

---

# 81. v0.1 Minimum Schema

The first implementation does not need every future field.

The minimum v0.1 Rule Definition should contain:

```yaml
schemaVersion: "1"

id: OAIT-DOC-004

name: Parameter description present

description: >
  Every resolved parameter should contain a
  nonempty description.

dimension: documentation

sourceClass: OAIT_QUALITY

detection: deterministic

severity: warning

weight: 3

versions:
  - "3.0"
  - "3.1"
  - "3.2"

target:
  object: parameter

implementation:
  type: handler
  handler: parameter-description-present

gate:
  mode: none
```

---

# 82. v0.1 Minimum Rule Instance

```yaml
instanceId: OAIT-DOC-004:4e89a21b

ruleId: OAIT-DOC-004

target:
  type: parameter

location:
  file: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0

state: FAIL

effectiveRule:
  severity: warning
  weight: 3
```

---

# 83. v0.1 Minimum Finding

```yaml
findingId: FND-001

ruleId: OAIT-DOC-004

ruleInstanceId: OAIT-DOC-004:4e89a21b

title: Parameter description missing

dimension: documentation

severity: warning

location:
  file: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0

message: >
  The query parameter "limit" does not define a description.

recommendation: >
  Add a concise description explaining the parameter's
  purpose.
```

---

# 84. v0.1 Minimum Profile

```yaml
schemaVersion: "1"

id: default

name: Default

qualityGate:
  minimumScore: 80
  maximumCriticalFindings: 0

rules:
  OAIT-EXA-001:
    enabled: true

  OAIT-EXA-002:
    enabled: true
```

The complete dimension weights may also reside in this profile or in a separate quality-model configuration object. That decision belongs to architecture design.

---

# 85. Recommended Architecture Boundary

The schema design suggests the following eventual separation:

```text
Rule metadata
    │
    ▼
Rule Registry
    │
    ├───────────────┐
    ▼               ▼
Rule Handler   Effective Config
    │               │
    └───────┬───────┘
            ▼
       Rules Engine
            │
            ▼
      Rule Instances
            │
       ┌────┴────┐
       ▼         ▼
   Findings    Scorer
       │         │
       ▼         ▼
   Reviewer   Quality result
```

This boundary should be preserved during implementation.

---

# 86. Decisions Deferred to Architecture

This document intentionally does not finalize:

1. Whether YAML or JSON is the canonical persisted rule format.
2. Which JSON Schema draft will define the rule schema.
3. Which YAML parser will be used.
4. Whether rule metadata is compiled into the package.
5. Whether built-in rules are loaded dynamically at runtime.
6. How handlers are registered in TypeScript.
7. Whether profiles and rules share one schema package.
8. How external validator codes map to OAIT rule IDs.
9. How rule source locations are represented internally.
10. Whether line and column information is mandatory.
11. Whether rule instance IDs use hashes, UUIDs, or deterministic strings.
12. Whether finding IDs are deterministic.
13. How analysis run IDs are generated.
14. Whether custom declarative rules are included in v0.1.
15. How custom executable rules will be secured.
16. How plugins will contribute future rule packs.
17. How rule schema versions are migrated.
18. Whether category weights belong to profiles or a separate quality-policy schema.
19. How evaluation coverage is represented in the analysis-result schema.
20. How AI rule metadata will be integrated in later versions.

---

# 87. Recommended Architecture Decisions

The following provisional decisions are recommended for later ADR review.

### Rule serialization

```text
YAML for human-authored rules
```

### Formal validation

```text
JSON Schema
```

### Runtime representation

```text
TypeScript interfaces/types
```

### Rule execution

```text
Registered handler IDs
```

### Rule target model

```text
Normalized logical OpenAPI objects
```

### Canonical source location

```text
File + JSON Pointer
```

### Profile model

```text
Override selected policy properties only
```

### Built-in rule execution

```text
No arbitrary runtime code loading
```

### Scoring

```text
Consumes rule instances, not raw findings
```

### Reporting

```text
Consumes findings and quality results
```

These decisions should be validated with small technical spikes during architecture design.

---

# 88. Rule Schema Definition of Done

This artifact is considered baselined when:

* [ ] Rule identity is defined.
* [ ] Required rule metadata is defined.
* [ ] Quality dimension representation is defined.
* [ ] Source classification is defined.
* [ ] Severity representation is defined.
* [ ] Rule weighting is defined.
* [ ] OpenAPI version applicability is defined.
* [ ] Rule targets are defined.
* [ ] Applicability is defined.
* [ ] Dependencies are defined.
* [ ] Processing prerequisites are distinguished from rule dependencies.
* [ ] Executable-handler references are defined.
* [ ] Quality-gate representation is defined.
* [ ] Profile overrides are defined.
* [ ] Rule instances are defined.
* [ ] Findings are defined.
* [ ] Scoring metadata is defined.
* [ ] Duplicate-finding handling is defined.
* [ ] Rule lifecycle metadata is defined.
* [ ] Schema versioning is defined.
* [ ] v0.1 minimum structures are identified.
* [ ] Deferred architecture decisions are recorded.

---