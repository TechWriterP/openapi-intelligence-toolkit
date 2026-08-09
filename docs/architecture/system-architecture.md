# OpenAPI Intelligence Toolkit (OAIT)

## System Architecture

**Document version:** 0.1
**Project status:** Architecture and Design
**Release applicability:** OAIT v0.1 and future evolution
**Related documents:** `PRD.md`, `functional-requirements.md`, `nonfunctional-requirements.md`, `use-cases.md`, `user-stories.md`, `openapi-quality-model.md`, `rule-catalog.md`, `rule-schema.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This document defines the system architecture for the **OpenAPI Intelligence Toolkit (OAIT)**.

The architecture describes:

* System context.
* Architectural drivers.
* Architectural principles.
* Major components.
* Package boundaries.
* Component responsibilities.
* Data flow.
* Parser and normalization architecture.
* Version-aware OpenAPI abstraction.
* Validator integration.
* Rule Registry.
* Rules Engine.
* Scoring Engine.
* Reporting Engine.
* CLI architecture.
* Configuration architecture.
* Error architecture.
* Extension points.
* v0.1 deployment model.
* Future AI, MCP, and Skills integration.

The primary architectural goal for v0.1 is to establish a deterministic, modular, testable foundation that later AI-assisted capabilities can reuse without replacing the core system.

---

# 2. Architectural Decision Summary

The most important architectural decision for OAIT is:

> **OAIT rules must operate against a normalized, version-aware OpenAPI domain model rather than directly traversing raw YAML or JSON structures.**

This decision creates the boundary:

```text
Raw OpenAPI YAML / JSON
          │
          ▼
      Parser Layer
          │
          ▼
 Version-Aware Adapter
          │
          ▼
Normalized OAIT Domain Model
          │
          ├────────► Validator
          │
          ├────────► Rules Engine
          │
          ├────────► Scoring
          │
          ├────────► Reporting
          │
          └────────► Future AI / Diff / Enhancer
```

Individual rules must not contain repeated version checks such as:

```text
if OpenAPI == 3.0 ...
if OpenAPI == 3.1 ...
if OpenAPI == 3.2 ...
```

except where the rule itself is explicitly version-specific.

Version-specific interpretation belongs primarily in the parser, adapter, and normalization layers.

---

# 3. System Context

OAIT is a local-first developer tool for analyzing OpenAPI specifications.

At v0.1, its primary user-facing interface is the CLI.

```text
                     ┌─────────────────────┐
                     │     Developer       │
                     │ Technical Writer    │
                     │ API Architect       │
                     └─────────┬───────────┘
                               │
                               ▼
                     ┌─────────────────────┐
                     │      OAIT CLI       │
                     └─────────┬───────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │       OAIT Platform       │
                 │                           │
                 │ Parse / Validate / Review │
                 │ Score / Report            │
                 └───────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         OpenAPI Files   Configuration   Reports
         YAML / JSON     YAML / JSON     Console
                                         JSON
                                         Markdown
```

---

# 4. External Actors

## 4.1 Human Users

Primary users include:

* API developers.
* Technical writers.
* API architects.
* Documentation leads.
* API governance engineers.
* Developer experience engineers.
* Open-source maintainers.

---

## 4.2 CI/CD Systems

CI/CD systems invoke OAIT noninteractively for:

* Validation.
* Review.
* Scoring.
* Quality-gate enforcement.
* Machine-readable report generation.

---

## 4.3 File System

The file system provides:

* OpenAPI specifications.
* Multi-file referenced definitions.
* Configuration.
* Rulesets.
* Profiles.

It receives:

* JSON reports.
* Markdown reports.
* Future generated artifacts.

---

## 4.4 External OpenAPI Validator

OAIT may integrate with an established OpenAPI validation library instead of implementing all specification validation internally.

The external library must be hidden behind an OAIT adapter.

---

## 4.5 Future External Systems

Later releases may integrate with:

* AI providers.
* MCP clients.
* IDEs.
* GitHub Actions.
* Documentation platforms.
* API portals.

---

# 5. Architectural Drivers

The architecture is driven by the following requirements.

## AD-001 — Deterministic analysis

v0.1 must provide reproducible:

* Validation.
* Review.
* Scoring.
* Quality-gate results.

---

## AD-002 — Multi-version OpenAPI support

The architecture must support:

```text
OpenAPI 3.0.x
OpenAPI 3.1.x
OpenAPI 3.2.x
```

without scattering version-specific logic throughout the system.

---

## AD-003 — Explainability

Every score-affecting result must be traceable to:

```text
Rule
  ↓
Rule Instance
  ↓
Finding
  ↓
Quality Dimension
  ↓
Score
```

---

## AD-004 — Safe source handling

Analysis must not modify source specifications.

---

## AD-005 — Extensible rules

New deterministic rules must be addable without changing unrelated components.

---

## AD-006 — Future AI integration

AI-assisted review and enhancement must be able to reuse:

* Parser.
* Normalized domain model.
* Findings.
* Rule metadata.
* Evidence.
* Reporting.

---

## AD-007 — CLI-first design

The CLI is the first interface, but business logic must not reside inside CLI commands.

---

## AD-008 — Provider and library isolation

Third-party validators, parsers, and future AI providers must be hidden behind internal abstractions.

---

## AD-009 — Testability

Core components must support:

* Unit testing.
* Integration testing.
* Golden-file testing.
* Deterministic regression testing.

---

## AD-010 — Open-source maintainability

The architecture must be understandable by external contributors.

---

# 6. Architectural Principles

## AP-001 — Core logic is interface-independent

CLI, MCP, CI/CD, and future interfaces must call shared services.

They must not implement their own validation, rule, or scoring logic.

---

## AP-002 — Normalize once

Raw OpenAPI documents should be parsed and normalized once per workflow where practical.

Downstream components should consume the normalized model.

---

## AP-003 — Raw source remains available

Normalization must not discard the original representation.

OAIT should preserve access to:

* Original document.
* Source file.
* JSON Pointer.
* Raw node.
* Source-location metadata.

This supports precise findings and future transformations.

---

## AP-004 — Facts before interpretation

Deterministic components establish facts.

Future AI components consume those facts for interpretation.

---

## AP-005 — Stable internal contracts

Components communicate using documented data contracts rather than undocumented shared state.

---

## AP-006 — Explicit errors

Errors must be represented structurally and must not be silently swallowed.

---

## AP-007 — Configuration resolves before execution

Rules, weights, gates, and profiles should be resolved into an effective configuration before the rules engine executes.

---

# 7. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                      Interfaces                          │
│                                                          │
│  CLI        Future MCP       Future CI Action / API      │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                Application / Workflow Layer              │
│                                                          │
│ ValidateWorkflow                                         │
│ ReviewWorkflow                                           │
│ ScoreWorkflow                                            │
└──────────┬───────────────────────────────┬───────────────┘
           │                               │
           ▼                               ▼
┌───────────────────────┐        ┌─────────────────────────┐
│ OpenAPI Processing    │        │ Configuration           │
│                       │        │                         │
│ Parser                │        │ Config Loader           │
│ Version Detector      │        │ Profile Resolver        │
│ Reference Resolver    │        │ Effective Config        │
│ Normalizer            │        └─────────────────────────┘
│ Source Locator        │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│           Normalized OpenAPI Domain Model               │
└──────────┬──────────────────┬────────────────────────────┘
           │                  │
           ▼                  ▼
┌───────────────────┐  ┌─────────────────────┐
│ Validator Adapter │  │ Rule Registry       │
└──────────┬────────┘  └──────────┬──────────┘
           │                      │
           └─────────────┬────────┘
                         ▼
                ┌─────────────────┐
                │  Rules Engine   │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Rule Instances  │
                │ + Findings      │
                └───────┬─────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
      ┌───────────────┐   ┌────────────────┐
      │ Scoring Engine│   │ Reporting      │
      └───────┬───────┘   │ Engine         │
              │           └────────┬───────┘
              ▼                    │
       Quality Result              │
              └──────────┬─────────┘
                         ▼
                    CLI / Files
```

---

# 8. Architectural Layers

OAIT should use four primary logical layers.

## 8.1 Interface Layer

Responsibilities:

* Accept user input.
* Parse CLI arguments.
* Display output.
* Return process exit codes.

Must not contain core quality-analysis logic.

---

## 8.2 Application Layer

Responsibilities:

* Coordinate workflows.
* Invoke domain services.
* Control execution sequence.
* Assemble final results.

Examples:

```text
ValidateWorkflow
ReviewWorkflow
ScoreWorkflow
```

---

## 8.3 Domain Layer

Contains OAIT's core business logic:

* Normalized OpenAPI model.
* Rules.
* Rule evaluation.
* Findings.
* Scoring.
* Quality gates.

This is the core of OAIT.

---

## 8.4 Infrastructure Layer

Integrates with external mechanisms such as:

* YAML parser.
* File system.
* OpenAPI validator.
* Console.
* Future AI providers.
* Future MCP transport.

---

# 9. Proposed Repository Package Boundaries

For v0.1:

```text
packages/
├── core/
├── parser/
├── validator/
├── rules/
├── reviewer/
├── scoring/
├── reporting/
└── config/

apps/
└── cli/
```

---

# 10. `packages/core`

Purpose:

> Defines stable domain types and shared contracts.

Responsibilities:

* Normalized OpenAPI types.
* Version types.
* Source-location model.
* Rule interfaces.
* Rule-instance types.
* Finding types.
* Quality-result types.
* Shared error types.
* Analysis-result contracts.

Must not depend on:

* CLI.
* Concrete validator implementation.
* Reporting presentation.
* AI providers.

Example conceptual exports:

```typescript
OpenApiDocument
OpenApiOperation
OpenApiParameter
SourceLocation

RuleDefinition
RuleInstance
Finding

QualityScore
QualityGateResult

OaitError
```

---

# 11. `packages/parser`

Purpose:

> Convert source OpenAPI files into OAIT's normalized domain model.

Responsibilities:

* Read YAML/JSON structures.
* Detect OpenAPI version.
* Parse documents.
* Preserve raw nodes where required.
* Resolve permitted references.
* Normalize version differences.
* Build logical operation collections.
* Track source locations.

Key conceptual operations:

```text
parse()
detectVersion()
resolveReferences()
normalize()
locate()
```

---

# 12. `packages/validator`

Purpose:

> Provide standards-conformance validation through an OAIT abstraction.

Responsibilities:

* Invoke selected OpenAPI validator.
* Normalize validator output.
* Map known validator diagnostics to OAIT conformance rules.
* Return structural validation status.
* Identify critical blockers.

Public interface should resemble:

```typescript
interface OpenApiValidator {
  validate(
    document: ParsedOpenApiDocument
  ): Promise<ValidationResult>;
}
```

---

# 13. `packages/rules`

Purpose:

> Define and execute deterministic OAIT quality rules.

Responsibilities:

* Rule metadata.
* Handler registry.
* Rule Registry.
* Rule dependency management.
* Applicability.
* Rule execution.
* Rule-instance generation.
* Finding generation.
* Duplicate suppression.

Potential internal structure:

```text
packages/rules/
└── src/
    ├── registry/
    ├── engine/
    ├── handlers/
    │   ├── conformance/
    │   ├── documentation/
    │   ├── schemas/
    │   └── governance/
    ├── dependencies/
    └── index.ts
```

---

# 14. `packages/reviewer`

Purpose:

> Transform rule results into review-oriented analysis.

Responsibilities:

* Aggregate findings.
* Group findings.
* Sort by severity.
* Produce review summary.
* Calculate finding statistics.
* Provide review-domain result objects.

The Reviewer does not calculate the overall quality score.

---

# 15. `packages/scoring`

Purpose:

> Calculate deterministic quality scores and quality-gate results.

Responsibilities:

* Calculate rule compliance.
* Calculate category scores.
* Apply rule weights.
* Apply category weights.
* Calculate overall score.
* Calculate evaluation coverage when implemented.
* Apply quality thresholds.
* Evaluate mandatory rule gates.
* Return quality result.

---

# 16. `packages/reporting`

Purpose:

> Convert analysis-domain objects into presentation formats.

Responsibilities:

* Console output.
* JSON serialization.
* Markdown reporting.
* Future SARIF output.

Reporting must not rerun rules or calculate scores.

---

# 17. `packages/config`

Purpose:

> Load and resolve OAIT configuration.

Responsibilities:

* Load defaults.
* Load profiles.
* Load project configuration.
* Apply CLI overrides.
* Validate configuration.
* Resolve effective rules.
* Resolve quality policy.

Resolution order:

```text
Built-in defaults
        ↓
Profile
        ↓
Project configuration
        ↓
CLI overrides
        ↓
Effective configuration
```

---

# 18. `apps/cli`

Purpose:

> Provide the v0.1 user-facing executable.

Responsibilities:

* Parse command-line input.
* Invoke workflows.
* Render console output.
* Write reports.
* Return exit codes.

Commands:

```bash
oait validate <spec>
oait review <spec>
oait score <spec>
```

The CLI must remain a thin application shell.

---

# 19. Application Workflow Layer

An application-service layer should coordinate packages.

Potential location:

```text
packages/core/src/workflows/
```

or a dedicated:

```text
packages/workflows/
```

The exact package location should be decided during detailed design.

Conceptual workflows:

```typescript
validateSpecification()
reviewSpecification()
scoreSpecification()
```

---

# 20. Validate Workflow

```text
Input path
   ↓
Load configuration
   ↓
Read file
   ↓
Parse
   ↓
Detect OpenAPI version
   ↓
Resolve permitted references
   ↓
Run validator
   ↓
Normalize validation findings
   ↓
Return ValidationResult
```

---

# 21. Review Workflow

```text
Input specification
       ↓
Load effective configuration
       ↓
Parse + normalize
       ↓
Validate
       ↓
Can analysis continue?
   │             │
  No            Yes
   │             │
   ▼             ▼
Return          Load active rules
errors                ↓
                 Rules Engine
                      ↓
                Rule Instances
                      ↓
                   Findings
                      ↓
                  Reviewer
                      ↓
                 ReviewResult
                      ↓
                Report Engine
```

---

# 22. Score Workflow

```text
Input specification
       ↓
Parse / normalize
       ↓
Validate
       ↓
Rules Engine
       ↓
Rule Instances
       ↓
     Findings
       │
       ▼
Scoring Engine
       │
       ├── Rule compliance
       ├── Category scores
       ├── Overall score
       └── Quality gates
       │
       ▼
QualityResult
       ↓
Reporting Engine
```

---

# 23. Parser Architecture

The parser layer must not merely deserialize YAML.

It must produce three related representations.

```text
Raw Source Representation
         │
         ▼
Parsed OpenAPI Representation
         │
         ▼
Normalized OAIT Domain Model
```

---

# 24. Raw Source Representation

Represents the original source structure.

Used for:

* Source locations.
* JSON Pointer mapping.
* Raw values.
* Future transformation.
* Debugging.

This representation should preserve file boundaries for multi-file specifications.

---

# 25. Parsed OpenAPI Representation

Represents the OpenAPI document according to the parser/library's model.

This layer may still reflect version-specific OpenAPI structures.

It should not be exposed directly to most rules.

---

# 26. Normalized OpenAPI Domain Model

The normalized model provides OAIT-owned logical concepts such as:

```typescript
interface NormalizedOpenApiDocument {
  version: OpenApiVersion;
  info: NormalizedInfo;
  operations: NormalizedOperation[];
  schemas: NormalizedSchema[];
  tags: NormalizedTag[];
  securitySchemes: NormalizedSecurityScheme[];
}
```

Illustrative only.

---

# 27. Why Normalization Is Required

Without normalization, every rule would need to understand:

* OpenAPI 3.0 differences.
* OpenAPI 3.1 differences.
* OpenAPI 3.2 differences.
* Raw YAML versus JSON.
* `$ref` behavior.
* Path-level versus operation-level parameter inheritance.
* Future 3.2 operations such as `query`.
* `additionalOperations`.

This would cause duplicated logic and inconsistent behavior.

Instead:

```text
Version differences
       ↓
Normalization Layer
       ↓
Stable OAIT representation
       ↓
Rules
```

---

# 28. Version-Aware OpenAPI Abstraction

The normalization layer must expose version-aware capabilities.

Example conceptual interface:

```typescript
interface OpenApiCapabilities {
  supportsQueryOperation: boolean;
  supportsAdditionalOperations: boolean;
  responseDescriptionRequired: boolean;
  supportsResponseSummary: boolean;
}
```

Rules can query capabilities where truly necessary.

However, most version differences should already be normalized.

---

# 29. Normalized Operation Model

Operation-level rules must not enumerate raw HTTP method fields independently.

The parser should expose:

```typescript
getOperations(): NormalizedOperation[]
```

Each operation may include:

```typescript
interface NormalizedOperation {
  id?: string;

  transportOperation: string;

  path?: string;

  summary?: string;
  description?: string;

  parameters: NormalizedParameter[];
  requestBody?: NormalizedRequestBody;
  responses?: NormalizedResponses;

  tags: string[];

  source: SourceLocation;
}
```

`transportOperation` allows support for:

```text
GET
POST
PATCH
QUERY
future operation types
```

without forcing the rules engine to know raw document traversal rules.

---

# 30. Parameter Normalization

Parameters should be normalized after accounting for:

* Path-level parameters.
* Operation-level parameters.
* Operation-level overrides.
* Referenced parameters.
* Version-specific parameter locations.

Rules should receive the effective parameter set for an operation where applicable.

---

# 31. Reference Resolution Architecture

Reference resolution should be centralized.

```text
Source document
     │
     ▼
Reference Resolver
     │
 ┌───┴────┐
 ▼        ▼
Local    Remote
refs     refs
```

v0.1 should prioritize local references.

Remote reference behavior must be controlled by explicit configuration.

---

# 32. Reference Resolver Responsibilities

* Resolve internal `$ref`.
* Resolve allowed local file `$ref`.
* Detect unresolved references.
* Prevent infinite traversal.
* Track originating source location.
* Apply remote-reference policy.
* Avoid uncontrolled filesystem access.

Rules must not resolve references independently.

---

# 33. Source Location Architecture

OAIT must maintain source traceability across normalization.

Canonical logical location:

```text
File + JSON Pointer
```

Example:

```yaml
file: openapi.yaml
pointer: /paths/~1customers/get/parameters/0
```

Optional:

```yaml
line: 34
column: 9
```

Normalized domain objects should retain a source reference.

---

# 34. Validator Integration Architecture

OAIT should use an adapter around any third-party OpenAPI validation library.

```text
Normalized / Parsed Input
        ↓
Validator Adapter
        ↓
Third-Party Validator
        ↓
Raw Diagnostics
        ↓
Diagnostic Normalizer
        ↓
OAIT Validation Findings
```

---

# 35. Why a Validator Adapter Is Required

Direct dependency on a validator's diagnostic format would create:

* Vendor/library lock-in.
* Unstable report schemas.
* Difficult migration.
* Coupling between rules and validator internals.

Instead, OAIT owns:

```typescript
ValidationResult
ValidationFinding
```

---

# 36. Validator Diagnostic Mapping

Known external diagnostics may map to stable OAIT rules.

Example:

```text
External:
Path parameters must have required=true
          ↓
Adapter
          ↓
OAIT-CON-005
```

Not every validator diagnostic must have a dedicated OAIT rule immediately.

Unmapped diagnostics may initially receive a generic conformance representation.

---

# 37. Rule Registry Architecture

The Rule Registry is the authoritative runtime catalog of available rules.

```text
Rule metadata
    +
Handler registry
    ↓
Rule Registry
```

Responsibilities:

* Register built-in rules.
* Validate rule definitions.
* Detect duplicate IDs.
* Resolve handlers.
* Resolve dependencies.
* Filter by OpenAPI version.
* Apply effective configuration.
* Return active rules.

---

# 38. Rule Registration Model

Conceptually:

```typescript
registry.register(
  ruleDefinition,
  ruleHandler
);
```

or:

```text
RuleDefinition.handler
        ↓
HandlerRegistry
        ↓
ExecutableRule
```

The architecture should keep handler registration explicit rather than relying on arbitrary runtime code discovery.

---

# 39. Rules Engine Architecture

The Rules Engine executes active rules against normalized targets.

```text
Normalized Document
       +
Effective Rules
       ↓
Target Discovery
       ↓
Applicability
       ↓
Dependency Check
       ↓
Rule Handler
       ↓
Rule Instance
       ↓
Finding if needed
```

---

# 40. Rules Engine Responsibilities

* Determine rule targets.
* Evaluate applicability.
* Check dependencies.
* Execute handlers.
* Capture errors.
* Produce Rule Instances.
* Produce Findings.
* Maintain deterministic ordering.
* Avoid duplicate scoring.
* Record skipped rules.

---

# 41. Rules Engine Non-Responsibilities

The Rules Engine must not:

* Format CLI output.
* Calculate overall scores.
* Load arbitrary user code.
* Call future AI providers directly.
* Modify OpenAPI source files.

---

# 42. Rule Handler Contract

Conceptually:

```typescript
interface RuleHandler<TTarget> {
  evaluate(
    context: RuleContext<TTarget>
  ): RuleEvaluation;
}
```

A handler returns:

```text
PASS
FAIL
NOT_APPLICABLE
SKIPPED
ERROR
```

The engine converts evaluations into Rule Instances.

---

# 43. Rule Execution Determinism

For deterministic rules, execution must not depend on:

* Network services, unless explicitly required for allowed references.
* Randomness.
* Time of day.
* AI models.
* Non-versioned external state.

The same normalized input and effective rule configuration must produce the same result.

---

# 44. Scoring Engine Architecture

The Scoring Engine consumes Rule Instances, not raw OpenAPI data.

```text
Rule Instances
      ↓
Group by Rule
      ↓
Calculate Rule Compliance
      ↓
Apply Rule Weight
      ↓
Calculate Dimension Score
      ↓
Apply Dimension Weight
      ↓
Overall Score
      ↓
Evaluate Quality Gates
```

---

# 45. Scoring Inputs

The Scoring Engine requires:

* Rule instances.
* Effective rule weights.
* Dimension weights.
* Quality policy.
* Mandatory gate definitions.

---

# 46. Scoring Outputs

Conceptual result:

```typescript
interface QualityResult {
  overallScore: number;
  displayScore: number;

  dimensions: DimensionScore[];

  qualityGate: QualityGateResult;

  evaluationCoverage?: number;
}
```

---

# 47. Scoring Independence

The Scoring Engine must not:

* Re-run rules.
* Traverse the OpenAPI document.
* Infer findings.
* Modify rule severity.
* Produce natural-language recommendations.

---

# 48. Quality Gate Architecture

Quality gates operate after scoring inputs are available.

Supported gate types:

```text
Overall score
Category score
Mandatory rule failure
Severity limits
```

Example:

```yaml
qualityGate:
  minimumScore: 80
  maximumCriticalFindings: 0
```

---

# 49. Reporting Engine Architecture

The Reporting Engine receives stable domain results.

Inputs may include:

```text
ValidationResult
ReviewResult
QualityResult
AnalysisMetadata
```

Outputs:

```text
Console
JSON
Markdown
Future SARIF
```

---

# 50. Reporter Interface

Conceptually:

```typescript
interface Reporter<TOutput> {
  render(result: AnalysisResult): TOutput;
}
```

Concrete reporters:

```text
ConsoleReporter
JsonReporter
MarkdownReporter
```

---

# 51. Machine-Readable Report Model

JSON reporting should serialize a stable analysis contract.

```text
AnalysisResult
├── metadata
├── input
├── validation
├── ruleInstances
├── findings
├── scoring
└── qualityGate
```

This object should be versioned independently from console presentation.

---

# 52. CLI Architecture

The CLI should use a command-oriented structure.

```text
oait
├── validate
├── review
└── score
```

Potential source layout:

```text
apps/cli/src/
├── commands/
│   ├── validate.ts
│   ├── review.ts
│   └── score.ts
│
├── output/
├── options/
└── index.ts
```

---

# 53. CLI Command Responsibilities

A command should:

1. Parse arguments.
2. Resolve configuration.
3. Call an application workflow.
4. Invoke selected reporter.
5. Write requested output.
6. Return appropriate exit code.

Example:

```text
score command
     ↓
ScoreWorkflow
     ↓
AnalysisResult
     ↓
ConsoleReporter
     ↓
ExitCodeMapper
```

---

# 54. CLI Must Not Contain Business Rules

Avoid:

```typescript
if (!operation.summary) {
  // create finding here
}
```

inside CLI code.

Correct architecture:

```text
CLI
 ↓
Review Workflow
 ↓
Rules Engine
 ↓
OAIT-DOC-002
```

---

# 55. Configuration Architecture

Configuration should be separated into:

```text
Rule definitions
Quality profile
Project configuration
CLI overrides
```

---

# 56. Configuration Resolution

```text
Built-in defaults
      ↓
Built-in profile
      ↓
Project config
      ↓
CLI flags
      ↓
Configuration Resolver
      ↓
Effective Configuration
```

---

# 57. Effective Configuration

The execution layer should receive resolved values.

Example:

```yaml
profile: default

minimumScore: 85

rules:
  OAIT-DOC-003:
    enabled: true
    severity: error
    weight: 4
```

Rules should not independently inspect multiple configuration sources.

---

# 58. Configuration Validation

Configuration validation occurs before analysis where practical.

Invalid configuration should fail early.

Examples:

```text
Unknown rule ID
Invalid severity
Weight outside permitted range
Unknown profile
Invalid score threshold
```

---

# 59. Error Architecture

OAIT should use structured domain errors.

Base categories:

```text
INPUT_ERROR
PARSE_ERROR
VALIDATION_ERROR
CONFIGURATION_ERROR
RULE_ERROR
OUTPUT_ERROR
INTERNAL_ERROR
```

Future:

```text
AI_PROVIDER_ERROR
AI_OUTPUT_ERROR
CONTRACT_PROTECTION_ERROR
```

---

# 60. Error Object

Conceptual:

```typescript
interface OaitError {
  code: string;
  category: ErrorCategory;
  message: string;

  cause?: unknown;

  file?: string;
  pointer?: string;

  recoverable: boolean;
}
```

---

# 61. Error Boundary Strategy

Errors should be handled at the appropriate layer.

```text
Infrastructure error
       ↓
Package-specific adapter
       ↓
OAIT domain error
       ↓
Application workflow
       ↓
CLI error renderer
```

Third-party exceptions should not leak directly to users by default.

---

# 62. Fatal Versus Nonfatal Errors

Fatal examples:

* Input file missing.
* YAML parse failure.
* Unsupported OpenAPI version.
* Invalid project configuration.

Nonfatal examples:

* One rule execution fails.
* Optional output formatter cannot provide extra metadata.
* One optional rule is skipped because of unresolved context.

Where safe, analysis may continue while clearly reporting incompleteness.

---

# 63. Analysis Result Architecture

Every workflow should return a structured result rather than printing directly.

Example:

```typescript
interface AnalysisResult {
  metadata: AnalysisMetadata;

  validation?: ValidationResult;

  ruleInstances?: RuleInstance[];

  findings?: Finding[];

  quality?: QualityResult;

  diagnostics?: Diagnostic[];
}
```

This becomes the reusable contract for:

* CLI.
* CI/CD.
* MCP.
* Future API.
* Tests.

---

# 64. Analysis Metadata

Should include:

```text
OAIT version
Quality model version
Ruleset version
Profile
OpenAPI version
Input file
Analysis timestamp
```

Future AI fields:

```text
AI provider
Model
Prompt/workflow version
```

---

# 65. Extension Points

The architecture should deliberately expose stable extension points.

---

## 65.1 Rule Handlers

Add new deterministic rules.

---

## 65.2 Validator Adapter

Swap or upgrade the OpenAPI validator.

---

## 65.3 Reporter

Add formats such as:

```text
SARIF
HTML
JUnit XML
```

---

## 65.4 Configuration Profiles

Add organization-specific quality policies.

---

## 65.5 AI Provider

Future AI abstraction.

---

## 65.6 Application Interface

Expose the same workflows through:

* MCP.
* IDE extension.
* GitHub Action.
* Web service.

---

# 66. v0.1 Dependency Direction

Recommended dependency direction:

```text
apps/cli
   ↓
workflows
   ↓
reviewer / scoring / validator
   ↓
rules / parser / config
   ↓
core
```

`core` should not depend on higher-level packages.

---

# 67. Dependency Rules

Recommended rules:

```text
core
  → no internal package dependency

parser
  → core

config
  → core

validator
  → core + parser contracts

rules
  → core

reviewer
  → core + rules

scoring
  → core + rules

reporting
  → core

cli
  → workflows + reporting
```

Exact package organization may be refined after dependency analysis.

---

# 68. Avoid Circular Package Dependencies

Prohibited example:

```text
rules → scoring
scoring → rules
```

Preferred:

```text
rules
  ↓
RuleInstance contract in core
  ↑
scoring
```

Shared contracts belong in `core`.

---

# 69. Proposed v0.1 Runtime Flow

```text
User
 ↓
CLI
 ↓
Configuration Resolver
 ↓
Parser
 ↓
Version Detector
 ↓
Reference Resolver
 ↓
Normalizer
 ↓
Validator
 ↓
Rule Registry
 ↓
Rules Engine
 ↓
Rule Instances
 ↓
Findings
 ↓
Scoring Engine
 ↓
Analysis Result
 ↓
Reporter
 ↓
Console / JSON / Markdown
```

---

# 70. v0.1 Deployment Model

OAIT v0.1 is a local command-line application.

```text
Developer workstation / CI runner
              │
              ▼
         Node.js runtime
              │
              ▼
             OAIT
              │
       ┌──────┴───────┐
       ▼              ▼
Local OpenAPI     Local Reports
Files
```

No server process is required.

No database is required.

No external AI service is required.

---

# 71. v0.1 Runtime Dependencies

Expected runtime dependency categories:

* Node.js.
* YAML parser.
* OpenAPI parser/validator.
* CLI framework.
* Schema validator for OAIT configuration/rules.
* File-system APIs.

Specific libraries must be selected through technical evaluation and ADRs.

---

# 72. State Management

v0.1 should be stateless between CLI invocations.

Each execution:

```text
Load
Analyze
Report
Exit
```

No persistent application database is required.

---

# 73. Concurrency Model

v0.1 deterministic analysis may initially execute sequentially.

The architecture should not assume sequential execution permanently.

Independent rule evaluations should be capable of future parallelization where safe.

Deterministic result ordering must remain stable.

---

# 74. Security Boundary

v0.1 trust boundaries:

```text
Trusted:
OAIT code
Built-in rules
Built-in profiles

Untrusted:
OpenAPI files
Referenced files
Project configuration
Future external rules
```

OpenAPI content must never be treated as executable instructions.

---

# 75. Future AI Architecture

AI functionality enters in v0.2.

Proposed future package:

```text
packages/ai/
```

Conceptual architecture:

```text
Normalized OpenAPI
       +
Deterministic Findings
       ↓
AI Orchestrator
       ↓
Provider Abstraction
       ↓
OpenAI / Anthropic / Future
       ↓
Structured AI Result
       ↓
Schema Validation
       ↓
Evidence Validation
       ↓
Finding / Suggestion
```

---

# 76. AI Must Reuse the Domain Model

Future AI workflows must not independently parse raw OpenAPI YAML.

They should consume:

* Normalized OpenAPI objects.
* Relevant source fragments.
* Findings.
* Evidence.
* Source locations.

This preserves consistent interpretation.

---

# 77. Future Enhancer Integration

Future architecture:

```text
Reviewer Findings
      ↓
Enhancer
      ↓
Suggestion
      ↓
Contract Guard
      ↓
Overlay / Modified Spec
```

The Contract Guard will reuse normalized contract models.

---

# 78. Future Diff Architecture

Planned future package:

```text
packages/diff/
```

Conceptual:

```text
Previous specification
        ↓
Normalize
        │
        ├──────────────┐
        │              │
Current specification │
        ↓              │
Normalize              │
        └──────┬───────┘
               ▼
       Semantic Comparator
               ↓
          Change Records
               ↓
      Change Classification
```

Normalization is therefore a foundational architecture investment.

---

# 79. Future Release Notes Integration

```text
Change Records
     ↓
Deterministic Classification
     ↓
AI Interpretation
     ↓
Release Note Draft
```

AI prose generation should consume verified change records rather than performing raw diff analysis itself.

---

# 80. Future MCP Architecture

Planned application:

```text
apps/mcp-server/
```

MCP tools will call the same application workflows used by the CLI.

Example:

```text
MCP Client
    ↓
openapi_score
    ↓
ScoreWorkflow
    ↓
Core Packages
```

MCP must not maintain a separate implementation of scoring.

---

# 81. Future MCP Tools

Potential tools:

```text
openapi_validate
openapi_review
openapi_score
openapi_improve
openapi_compare
openapi_generate_release_notes
openapi_create
```

---

# 82. Future Skills Architecture

Skills provide workflow guidance and orchestration.

They should not duplicate OAIT implementation logic.

Example:

```text
SKILL.md
   ↓
Calls OAIT MCP / CLI
   ↓
Core OAIT functionality
```

A skill may explain:

* When to review.
* How to interpret findings.
* Which workflow to execute.
* How to request SME input.

But the skill should not independently implement OpenAPI validation or scoring.

---

# 83. Future Interface Architecture

Long-term:

```text
             ┌────────── CLI
             │
             ├────────── MCP
             │
             ├────────── GitHub Action
Workflows ◄──┤
             ├────────── IDE
             │
             └────────── Future Web/API
```

All interfaces converge on shared application services.

---

# 84. Observability Architecture

v0.1 should support structured diagnostics.

Potential fields:

```text
command
input
OpenAPI version
profile
ruleset
rules executed
rules skipped
duration
```

Debug logging must not expose secrets or unnecessary specification contents.

---

# 85. Testing Architecture

Each package should be independently testable.

```text
parser
  → fixture tests

validator
  → adapter tests

rules
  → per-rule unit tests

scoring
  → formula tests

reporting
  → golden-file tests

CLI
  → end-to-end tests
```

---

# 86. Parser Tests

Must cover:

* YAML.
* JSON.
* OpenAPI 3.0.
* OpenAPI 3.1.
* OpenAPI 3.2.
* Local references.
* Circular references.
* Multi-file documents.
* Source location preservation.

---

# 87. Rules Engine Tests

Must cover:

* Rule registration.
* Duplicate IDs.
* Applicability.
* Dependencies.
* PASS.
* FAIL.
* NOT_APPLICABLE.
* SKIPPED.
* ERROR.
* Version filtering.
* Duplicate suppression.

---

# 88. Scoring Tests

Must cover:

* Rule compliance.
* Category weighting.
* Overall score.
* N/A categories.
* Quality gates.
* Mandatory rules.
* Score reproducibility.
* Rounding.

---

# 89. Reporting Tests

Golden files should verify:

```text
Console output
JSON output
Markdown output
```

Machine-readable output schemas require structural validation.

---

# 90. Architecture Risks

| Risk                                       | Architectural mitigation                    |
| ------------------------------------------ | ------------------------------------------- |
| OpenAPI version logic spreads across rules | Normalized domain model                     |
| Third-party validator lock-in              | Validator adapter                           |
| Rules become tightly coupled to files      | Handler registry                            |
| Scoring becomes opaque                     | Rule-instance-based scoring                 |
| CLI becomes business logic layer           | Workflow/application services               |
| Future AI duplicates parsing               | Shared normalized model                     |
| Multi-file source locations are lost       | Source-location metadata                    |
| Package circular dependencies              | Core contract package                       |
| Rules double-penalize same issue           | Finding relationships and scoring ownership |
| Configuration becomes inconsistent         | Effective configuration resolver            |

---

# 91. Architecture Constraints

v0.1 must:

* Use TypeScript/Node.js.
* Operate as a CLI.
* Remain local-first.
* Require no database.
* Require no AI service.
* Preserve source files.
* Support deterministic output.
* Support extensible rules.
* Remain suitable for later MCP integration.

---

# 92. Architecture Decisions Requiring ADRs

The following decisions should be recorded as ADRs.

### ADR-001 — Use TypeScript and Node.js

```text
docs/architecture/adr/ADR-001-use-typescript-nodejs.md
```

---

### ADR-002 — Use a Monorepo

```text
ADR-002-use-monorepo.md
```

---

### ADR-003 — Normalize OpenAPI Before Rule Evaluation

```text
ADR-003-normalized-openapi-domain-model.md
```

This should be the first architecture-specific ADR developed from this document.

---

### ADR-004 — Deterministic Scoring

```text
ADR-004-deterministic-quality-scoring.md
```

---

### ADR-005 — Abstract OpenAPI Validator

```text
ADR-005-openapi-validator-adapter.md
```

---

### ADR-006 — Declarative Rule Metadata with Registered Handlers

```text
ADR-006-rule-metadata-handler-model.md
```

---

### ADR-007 — Local-First Execution

```text
ADR-007-local-first-cli-architecture.md
```

---

### ADR-008 — Provider-Neutral AI Interface

Future:

```text
ADR-008-provider-neutral-ai-interface.md
```

---

# 93. Architecture Validation Through Technical Spikes

Before committing to third-party libraries, small technical spikes should validate:

1. Parsing OpenAPI 3.0, 3.1, and 3.2.
2. Multi-file `$ref` resolution.
3. Source-location preservation.
4. Operation discovery across versions.
5. External validator integration.
6. Mapping diagnostics to OAIT rules.
7. YAML-based rule metadata validation.
8. Handler registration.
9. JSON Pointer reporting.
10. Performance on a representative large specification.

Results should influence ADRs rather than being hidden as implementation details.

---

# 94. v0.1 Component Summary

| Component           | Responsibility                  |
| ------------------- | ------------------------------- |
| CLI                 | User interaction                |
| Workflow Layer      | Coordinate use cases            |
| Config Resolver     | Produce effective configuration |
| Parser              | Parse YAML/JSON                 |
| Version Detector    | Determine OAS version           |
| Reference Resolver  | Resolve references safely       |
| Normalizer          | Produce OAIT domain model       |
| Source Locator      | Preserve source traceability    |
| Validator Adapter   | Abstract standards validation   |
| Rule Registry       | Manage rules and handlers       |
| Rules Engine        | Execute deterministic rules     |
| Reviewer            | Aggregate quality findings      |
| Scoring Engine      | Calculate quality score         |
| Quality Gate Engine | Apply governance policy         |
| Reporting Engine    | Produce output formats          |
| Core Contracts      | Shared domain models            |

---

# 95. v0.1 Architecture Definition of Done

The system architecture is considered baselined when:

* [ ] System context is defined.
* [ ] Architectural drivers are documented.
* [ ] Architectural principles are documented.
* [ ] Major components are identified.
* [ ] Package responsibilities are defined.
* [ ] Package dependency direction is defined.
* [ ] Parser architecture is defined.
* [ ] Normalized domain model boundary is established.
* [ ] OpenAPI version-awareness strategy is defined.
* [ ] Reference-resolution responsibility is centralized.
* [ ] Validator abstraction is defined.
* [ ] Rule Registry responsibilities are defined.
* [ ] Rules Engine responsibilities are defined.
* [ ] Scoring Engine boundaries are defined.
* [ ] Reporting Engine boundaries are defined.
* [ ] CLI boundaries are defined.
* [ ] Configuration resolution is defined.
* [ ] Error architecture is defined.
* [ ] v0.1 deployment model is defined.
* [ ] Future AI integration is accounted for.
* [ ] Future MCP integration is accounted for.
* [ ] Future Skills integration is accounted for.
* [ ] Architecture risks are documented.
* [ ] Required ADRs are identified.
* [ ] Technical spikes are identified.

---