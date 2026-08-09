# ADR-001: Use TypeScript and Node.js

**Status:** Accepted
**Date:** 2026-08-09
**Decision owners:** OAIT Architecture
**Applies to:** OAIT v0.1 and later
**Related documents:** `system-architecture.md`, `ADR-003-normalized-openapi-domain-model.md`, `openapi-domain-model.md`

---

## 1. Context

The OpenAPI Intelligence Toolkit (OAIT) requires a primary programming language and runtime for implementing its core platform.

OAIT v0.1 will provide:

* OpenAPI parsing.
* OpenAPI validation.
* Reference resolution.
* Deterministic rule execution.
* Quality scoring.
* Configuration processing.
* Console, JSON, and Markdown reporting.
* A command-line interface.

Future releases are expected to add:

* AI-assisted OpenAPI review.
* OpenAPI enhancement.
* Semantic specification comparison.
* Breaking-change analysis.
* Release-note generation.
* OpenAPI creation.
* MCP server integration.
* Skills and agent-oriented workflows.

The selected technology therefore needs to support both the deterministic v0.1 foundation and future AI/tooling integrations.

The project also needs to be:

* Cross-platform.
* Open-source friendly.
* Strongly typed.
* Suitable for CLI development.
* Suitable for JSON/YAML-heavy workloads.
* Easy to distribute.
* Maintainable by contributors.
* Compatible with the OpenAPI and MCP ecosystems.

---

## 2. Problem

OAIT needs a programming language and runtime that can serve as the common implementation platform for:

```text
CLI
Parser
Normalizer
Validator adapter
Rule Registry
Rules Engine
Scoring Engine
Reporting
Configuration
Future AI integration
Future MCP server
```

The project should avoid introducing multiple implementation languages unless there is a strong technical reason.

The architecture therefore needs to answer:

> Which language and runtime should form the primary implementation platform for OAIT?

---

## 3. Decision

OAIT will use:

```text
TypeScript
+
Node.js
```

as its primary implementation language and runtime.

TypeScript will be used for application and library code.

Node.js will provide the runtime for:

* CLI execution.
* File-system access.
* Package distribution.
* Testing.
* OpenAPI processing.
* Future MCP and AI integrations.

---

## 4. Decision Statement

> **OAIT will use TypeScript on Node.js as its primary implementation platform because it provides strong typing, mature JSON/YAML and OpenAPI tooling, cross-platform CLI support, a large developer ecosystem, and a direct path to future MCP and AI integrations.**

---

## 5. Why TypeScript

### 5.1 Strong typing

OAIT will contain many important domain contracts, including:

```text
NormalizedOpenApiDocument
NormalizedOperation
NormalizedParameter
RuleDefinition
RuleInstance
Finding
QualityResult
AnalysisResult
```

TypeScript allows these contracts to be represented explicitly.

For example:

```typescript
interface NormalizedParameter {
  name: string;
  location: ParameterLocation;
  required: boolean;
  description?: string;
}
```

This provides compile-time checks across package boundaries.

---

### 5.2 Domain-model safety

The normalized OpenAPI domain model is a central architectural boundary.

TypeScript helps prevent accidental misuse such as:

```text
Raw parser object
        ↓
Rules Engine
```

when the intended architecture is:

```text
Raw parser object
        ↓
Normalizer
        ↓
OAIT domain type
        ↓
Rules Engine
```

Typed interfaces make architectural contracts more visible.

---

### 5.3 Good fit for OpenAPI data

OpenAPI specifications are fundamentally structured documents represented primarily through:

```text
JSON
YAML
```

Node.js and TypeScript work naturally with JavaScript object structures, making them well suited to:

* Traversal.
* Transformation.
* Validation.
* Serialization.
* Reporting.

---

### 5.4 Mature OpenAPI ecosystem

The JavaScript/TypeScript ecosystem contains mature libraries for:

* YAML parsing.
* JSON Schema validation.
* OpenAPI parsing.
* OpenAPI validation.
* Reference handling.
* CLI construction.

OAIT can evaluate and reuse these libraries through internal adapters instead of implementing every low-level capability from scratch.

---

### 5.5 CLI development

Node.js is well suited to portable command-line applications.

OAIT requires commands such as:

```bash
oait validate openapi.yaml
oait review openapi.yaml
oait score openapi.yaml
```

The Node.js ecosystem provides mature support for:

* Command parsing.
* Console formatting.
* File handling.
* Process exit codes.
* Package executables.

---

### 5.6 Cross-platform support

OAIT is expected to run on:

```text
macOS
Linux
Windows
```

Node.js provides a mature cross-platform runtime suitable for both:

* Developer workstations.
* CI runners.

Cross-platform behavior remains subject to automated testing.

---

### 5.7 Package distribution

The npm ecosystem provides a practical distribution model for a CLI tool.

Conceptually:

```bash
npm install -g <package>
```

or:

```bash
npx <package>
```

could eventually provide OAIT execution.

The final package name and distribution strategy will be decided later.

---

### 5.8 Monorepo suitability

OAIT is expected to contain reusable packages and multiple applications.

For example:

```text
apps/
├── cli/
└── mcp-server/

packages/
├── core/
├── parser/
├── validator/
├── rules/
├── scoring/
└── reporting/
```

TypeScript and Node.js have strong tooling for this development model.

The monorepo decision is documented separately in ADR-002.

---

### 5.9 MCP alignment

OAIT plans to expose capabilities through MCP in a later release.

A TypeScript/Node.js implementation provides a natural environment for building:

```text
apps/mcp-server/
```

while reusing the same OAIT packages used by the CLI.

This avoids creating:

```text
CLI implementation in one language
+
MCP implementation in another language
```

without a compelling reason.

---

### 5.10 AI integration

Future OAIT releases will integrate AI providers through a provider-neutral interface.

The Node.js ecosystem provides mature libraries and SDK support for AI-oriented application development.

The architecture can therefore evolve from:

```text
Deterministic OAIT
```

to:

```text
Deterministic OAIT
        +
AI orchestration
```

without replacing the core runtime.

---

## 6. Why Node.js

TypeScript is compiled or transformed into JavaScript that executes in a runtime.

OAIT selects Node.js because it provides:

* File-system APIs.
* Process APIs.
* CLI execution.
* Networking.
* Package management.
* Cross-platform runtime support.
* Mature testing ecosystems.
* Strong compatibility with TypeScript tooling.

OAIT v0.1 does not require a browser runtime.

Therefore Node.js is the primary execution environment.

---

## 7. Proposed Language Policy

Production source code should use TypeScript rather than untyped JavaScript where practical.

Recommended:

```text
.ts
```

for core implementation.

JavaScript may still appear where required by:

* Tool configuration.
* Build infrastructure.
* Third-party integration constraints.

The project should not mix JavaScript and TypeScript application code without a documented reason.

---

## 8. Type-Safety Policy

The project should prefer strict TypeScript configuration.

Conceptually:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

The exact `tsconfig` will be defined during repository setup.

The intent is to catch errors such as:

* Missing required fields.
* Incorrect result states.
* Invalid domain-object access.
* Incorrect package API usage.

---

## 9. Avoid Excessive `any`

The project should avoid widespread use of:

```typescript
any
```

particularly in:

```text
core
rules
scoring
configuration
```

Unknown external data should first enter the system as:

```typescript
unknown
```

and be validated or converted before becoming a trusted domain type.

This principle is particularly important for:

* OpenAPI input.
* Configuration.
* Rule metadata.
* External validator output.
* Future AI output.

---

## 10. Runtime Validation Still Required

TypeScript types exist primarily at development and compile time.

They do not validate arbitrary external runtime input.

Therefore:

```text
TypeScript type safety
        ≠
runtime input validation
```

OAIT must still validate:

* OpenAPI documents.
* Configuration.
* Rule definitions.
* Profiles.
* Machine-readable AI output in future releases.

Where appropriate, runtime schemas such as JSON Schema should complement TypeScript types.

---

## 11. Package Boundary Impact

TypeScript interfaces will define stable contracts between packages.

Example:

```text
packages/parser
      ↓
NormalizedOpenApiDocument
      ↓
packages/rules
```

rather than exposing parser-library-specific object types.

This reinforces ADR-003.

---

## 12. Core Package Independence

The `core` package should contain OAIT-owned domain types and contracts.

It should not expose:

* CLI framework types.
* Concrete OpenAPI parser types.
* Concrete validator types.
* AI provider SDK types.

For example:

```text
packages/core
```

may expose:

```typescript
Finding
RuleInstance
NormalizedOperation
QualityResult
```

while adapters convert external library structures into these types.

---

## 13. Asynchronous Programming Model

Node.js uses an asynchronous I/O model.

OAIT should use asynchronous interfaces where operations may involve:

* File access.
* Multi-file reference loading.
* Future remote references.
* Future AI providers.
* Future MCP transport.

Example:

```typescript
async function analyzeSpecification(
  input: AnalysisInput
): Promise<AnalysisResult>
```

Pure deterministic calculations such as scoring may remain synchronous internally.

---

## 14. Error Handling Impact

Application code should use OAIT-owned structured error types rather than allowing raw third-party exceptions to become public behavior.

Flow:

```text
Node / dependency exception
        ↓
Adapter
        ↓
OaitError
        ↓
Workflow
        ↓
CLI error renderer
```

This keeps error behavior independent from implementation libraries.

---

## 15. Testing Impact

The TypeScript/Node.js platform should support:

* Unit tests.
* Integration tests.
* End-to-end CLI tests.
* Golden-file tests.
* Regression tests.
* Cross-platform CI.

The exact testing framework will be selected later.

A separate ADR is not required unless the framework choice becomes architecture-significant.

---

## 16. Build Impact

The project will require a TypeScript build strategy.

Potential approaches include:

```text
tsc
bundling
runtime TypeScript execution during development
```

The exact toolchain is intentionally not decided by this ADR.

The architecture requires only that:

* Type checking exists.
* Production distribution is repeatable.
* Package boundaries remain enforceable.
* Source maps are available where useful.

---

## 17. Module System

The project must choose a consistent module system.

Likely candidates include:

```text
ES modules
CommonJS
```

The exact choice is deferred until repository/toolchain setup.

Given modern Node.js ecosystem direction, ES modules should be evaluated first.

If selected, the decision should be documented in implementation configuration or an ADR if it has substantial cross-project consequences.

---

## 18. Node.js Version Policy

OAIT should target maintained Node.js releases rather than supporting obsolete runtime versions indefinitely.

The project should define a supported runtime matrix before v0.1 release.

Example policy structure:

```text
Minimum supported Node.js version
Supported LTS versions
CI test versions
```

Exact version numbers should be selected during implementation setup rather than frozen prematurely in this ADR.

---

## 19. Dependency Management

Node.js dependencies will be managed through npm-compatible package tooling.

OAIT requires:

* Lockfile-based reproducibility.
* Vulnerability scanning.
* Controlled major upgrades.
* License review.
* Minimal unnecessary dependencies.

Specific dependency choices will be evaluated separately.

---

# 20. Alternatives Considered

## Alternative A — Python

### Advantages

* Excellent AI ecosystem.
* Strong scripting capabilities.
* Mature YAML/JSON support.
* Accessible language.
* Good CLI support.

### Disadvantages

* Weaker compile-time structural typing by default.
* Packaging/distribution for end-user CLI applications can require additional considerations.
* TypeScript offers closer alignment with the planned MCP and JavaScript tooling ecosystem.
* OAIT's domain-model-heavy architecture benefits significantly from TypeScript's native developer workflow.

### Decision

Not selected as the primary implementation language.

Python may still be useful for isolated development tooling or experiments if justified.

---

## Alternative B — Go

### Advantages

* Strong typing.
* Fast startup.
* Easy single-binary distribution.
* Good concurrency.
* Strong CLI suitability.

### Disadvantages

* Less direct alignment with OAIT's expected AI/MCP ecosystem.
* JSON/YAML manipulation can be more verbose.
* Smaller ecosystem for some OpenAPI/AI integration scenarios than TypeScript.

### Decision

Not selected.

Go would be a strong alternative if standalone binary distribution became the project's dominant architectural requirement.

---

## Alternative C — Rust

### Advantages

* Strong type and memory safety.
* Excellent performance.
* Native binaries.
* Strong correctness characteristics.

### Disadvantages

* Higher implementation complexity.
* Higher contributor learning barrier for this project.
* OAIT v0.1 does not require low-level performance or memory control.
* AI and MCP ecosystem integration would require more effort relative to TypeScript.

### Decision

Not selected.

The additional complexity is not justified by current OAIT requirements.

---

## Alternative D — Java

### Advantages

* Strong typing.
* Mature enterprise ecosystem.
* Excellent tooling.
* Strong library ecosystem.

### Disadvantages

* Heavier runtime/tooling model for a lightweight CLI.
* Less natural fit for npm-based distribution.
* Less direct fit with planned TypeScript-based MCP ecosystem.
* Higher ceremony for document-oriented transformation workflows.

### Decision

Not selected.

---

## Alternative E — JavaScript Without TypeScript

### Advantages

* Simple runtime.
* Very large ecosystem.
* No TypeScript compilation step.

### Disadvantages

* Reduced compile-time safety.
* Domain contracts are less enforceable.
* Higher risk when evolving complex rule, finding, and domain models.
* More difficult refactoring across a monorepo.

### Decision

Rejected.

OAIT's strongly structured architecture benefits from TypeScript.

---

# 21. Benefits

The decision provides:

* Strong compile-time domain contracts.
* Natural JSON/YAML processing.
* Mature CLI ecosystem.
* Mature OpenAPI ecosystem.
* Cross-platform runtime.
* npm-compatible distribution.
* Shared language across CLI and future MCP server.
* Strong future AI integration options.
* Good open-source contributor accessibility.
* Efficient monorepo reuse.

---

# 22. Costs

The decision introduces:

* Node.js runtime dependency.
* TypeScript compilation/type-checking configuration.
* npm ecosystem dependency management.
* Potential JavaScript ecosystem dependency churn.
* Need to manage Node.js version compatibility.
* Need for runtime validation in addition to compile-time typing.

---

# 23. Consequences

## Positive consequences

* Core domain interfaces can be strongly typed.
* Refactoring across packages is safer.
* CLI and future MCP server can reuse the same packages.
* OpenAPI data processing remains natural.
* AI integration can be added without changing the implementation language.
* Contributor tooling can use mainstream JavaScript/TypeScript workflows.

## Negative consequences

* Users may require Node.js unless OAIT later ships bundled executables.
* npm dependency security requires continuous management.
* TypeScript type safety can create false confidence if runtime validation is neglected.
* Build and module-system configuration must be maintained carefully.

---

# 24. Architectural Implications

The expected repository model becomes:

```text
apps/
├── cli/
└── future-mcp-server/

packages/
├── core/
├── parser/
├── validator/
├── rules/
├── reviewer/
├── scoring/
├── reporting/
└── config/
```

Each package can expose typed APIs.

Example:

```typescript
export interface ScoreWorkflow {
  execute(
    input: ScoreInput
  ): Promise<AnalysisResult>;
}
```

---

# 25. Impact on ADR-003

ADR-003 establishes an OAIT-owned normalized OpenAPI domain model.

TypeScript allows that model to become an explicit set of typed contracts.

For example:

```typescript
interface NormalizedOpenApiDocument {
  version: OpenApiVersion;
  operations: readonly NormalizedOperation[];
}
```

The choice of TypeScript therefore reinforces, but does not cause, ADR-003.

The normalized-domain decision remains conceptually independent of language choice.

---

# 26. Impact on Rule Architecture

Rule handlers will use typed interfaces.

Conceptually:

```typescript
interface RuleHandler<TTarget> {
  evaluate(
    context: RuleContext<TTarget>
  ): RuleEvaluation;
}
```

This helps ensure that:

```text
parameter rule
```

receives:

```text
NormalizedParameter
```

rather than arbitrary source data.

---

# 27. Impact on Configuration

Human-authored configuration may use YAML or JSON.

Runtime validation converts untrusted input into typed internal structures.

Flow:

```text
YAML / JSON
      ↓
Runtime schema validation
      ↓
TypeScript object
      ↓
EffectiveConfig
```

---

# 28. Impact on Reporting

OAIT analysis structures can be strongly typed and then serialized consistently.

Example:

```typescript
interface AnalysisResult {
  findings: Finding[];
  quality?: QualityResult;
}
```

The JSON Reporter can serialize the domain object without defining a separate undocumented data shape.

A formal JSON report schema should still be maintained.

---

# 29. Impact on Future MCP

The MCP server can import existing OAIT workflows.

Conceptually:

```text
apps/mcp-server
      ↓
packages/workflows
      ↓
packages/core/rules/scoring
```

No reimplementation is required.

---

# 30. Impact on Future AI Integration

Future AI-provider SDKs remain behind OAIT abstractions.

For example:

```typescript
interface AiProvider {
  generateStructured<T>(
    request: AiRequest,
    schema: OutputSchema<T>
  ): Promise<T>;
}
```

Core packages must not depend directly on a specific provider's types.

---

# 31. Security Considerations

The JavaScript package ecosystem introduces supply-chain risk.

Mitigations include:

* Minimize dependencies.
* Maintain lockfiles.
* Review significant dependencies.
* Use vulnerability scanning.
* Avoid arbitrary install scripts where unnecessary.
* Monitor critical dependency advisories.
* Prefer established maintained packages.

---

# 32. Performance Considerations

OAIT's expected workloads are primarily:

* File parsing.
* Object traversal.
* Rule execution.
* Scoring.
* Serialization.

These workloads do not currently justify adopting a lower-level language solely for performance.

Performance should be benchmarked against the project's nonfunctional requirements.

If future workloads demonstrate genuine bottlenecks, optimization should be evidence-driven.

---

# 33. Portability Considerations

The implementation must avoid unnecessary operating-system-specific assumptions.

Tests should cover supported:

```text
macOS
Linux
Windows
```

Path processing should use runtime-supported abstractions rather than manually assuming Unix path separators.

---

# 34. Developer Experience

The project should provide a predictable development workflow.

Conceptually:

```bash
npm install
npm run build
npm test
npm run lint
npm run typecheck
```

Exact scripts will be defined during repository initialization.

---

# 35. Decision Risks

### Risk — Dependency ecosystem churn

**Mitigation:** Keep external dependencies behind OAIT interfaces and minimize unnecessary packages.

### Risk — Runtime type assumptions

**Mitigation:** Validate all external data before converting it to trusted internal types.

### Risk — Node version incompatibility

**Mitigation:** Publish and test a supported runtime matrix.

### Risk — TypeScript complexity

**Mitigation:** Prefer readable domain types over excessive advanced type-level programming.

### Risk — Package coupling

**Mitigation:** Enforce dependency boundaries and keep shared contracts in core packages.

---

# 36. Technical Spikes

The TypeScript/Node.js choice itself does not require proof-of-concept validation before acceptance.

However, implementation spikes should validate:

1. TypeScript monorepo package references.
2. ESM/CommonJS choice.
3. CLI startup and packaging.
4. OpenAPI parser integration.
5. Source-location preservation.
6. JSON Schema validation.
7. Cross-platform filesystem behavior.
8. Distribution strategy.

---

# 37. Implementation Guidance

The initial project should favor:

```text
Strict TypeScript
Stable package boundaries
Explicit interfaces
Runtime validation
Minimal dependencies
Async I/O where appropriate
Immutable domain data where practical
```

Avoid premature framework adoption.

OAIT is primarily a library-oriented CLI platform, not a web application.

---

# 38. Status

**Accepted**

TypeScript and Node.js are approved as the primary implementation platform for OAIT.

Specific:

* Node.js versions.
* TypeScript versions.
* Build tooling.
* Module system.
* CLI library.
* Test framework.
* Package manager details.

remain implementation/design decisions to be finalized when the repository development environment is established.

---