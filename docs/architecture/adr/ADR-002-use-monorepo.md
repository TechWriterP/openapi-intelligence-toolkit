# ADR-002: Use a Monorepo with Multiple Packages and Applications

**Status:** Accepted
**Date:** 2026-08-09
**Decision owners:** OAIT Architecture
**Applies to:** OAIT v0.1 and later
**Related documents:** `system-architecture.md`, `ADR-001-use-typescript-nodejs.md`, `ADR-003-normalized-openapi-domain-model.md`, `openapi-domain-model.md`

---

## 1. Context

The OpenAPI Intelligence Toolkit (OAIT) is expected to evolve from a command-line application into a broader toolkit containing multiple reusable capabilities and multiple user-facing interfaces.

OAIT v0.1 will initially provide:

* OpenAPI parsing.
* OpenAPI validation.
* Reference resolution.
* Normalization.
* Deterministic review.
* Rule execution.
* Quality scoring.
* Quality gates.
* Console, JSON, and Markdown reporting.
* A CLI.

Future releases are expected to add:

* AI-assisted review.
* OpenAPI enhancement.
* Semantic diff.
* Breaking-change detection.
* Release-note generation.
* OpenAPI creation.
* MCP server.
* Skills.
* CI/CD-specific integrations.
* Potential IDE or service interfaces.

These capabilities must share common logic.

For example:

```text
CLI
MCP server
Future GitHub Action
```

should all use the same:

```text
Parser
Rules Engine
Scoring Engine
Reporting contracts
```

rather than reimplementing them independently.

The repository architecture therefore needs to support:

* Multiple applications.
* Multiple reusable packages.
* Shared domain contracts.
* Controlled package dependencies.
* Independent testing.
* Coordinated versioning.
* Open-source contribution.
* Future growth.

---

## 2. Problem

OAIT needs a source-code organization model that answers:

> How should the codebase be structured so that reusable OAIT capabilities can be shared across multiple interfaces without creating a single tightly coupled application or multiple duplicated repositories?

Three primary options are available:

```text
A. One repository + one large application/package

B. Multiple independent repositories

C. One repository + multiple internal packages + multiple applications
```

OAIT must select a model suitable for both the deterministic v0.1 CLI and its expected future evolution.

---

## 3. Decision

OAIT will use a **monorepo** containing:

```text
one repository
+
multiple internal packages
+
multiple applications
```

The conceptual structure is:

```text
openapi-intelligence-toolkit/
│
├── apps/
│   ├── cli/
│   └── future-mcp-server/
│
├── packages/
│   ├── core/
│   ├── parser/
│   ├── validator/
│   ├── rules/
│   ├── reviewer/
│   ├── scoring/
│   ├── reporting/
│   └── config/
│
├── docs/
├── test-data/
├── tests/
└── ...
```

Applications will remain thin and will compose reusable internal packages.

---

## 4. Decision Statement

> **OAIT will use a monorepo so that multiple applications can share strongly defined internal packages, evolve together, and be tested consistently while preserving explicit architectural boundaries between core capabilities.**

---

# 5. What “Monorepo” Means for OAIT

For OAIT, monorepo does **not** mean:

> Put every source file into one large folder.

Instead:

```text
ONE GIT REPOSITORY
        │
        ├── APPLICATIONS
        │      ├── CLI
        │      └── MCP server
        │
        └── REUSABLE PACKAGES
               ├── Core
               ├── Parser
               ├── Rules
               ├── Scoring
               └── Reporting
```

Each package has a clearly defined responsibility and dependency boundary.

---

# 6. Applications Versus Packages

The architecture distinguishes:

```text
apps/
```

from:

```text
packages/
```

---

## 6.1 Applications

Applications are executable user-facing entry points.

Examples:

```text
apps/cli
apps/mcp-server
```

Applications:

* Parse interface-specific input.
* Invoke shared workflows.
* Present results.
* Manage transport-specific behavior.

Applications should contain minimal business logic.

---

## 6.2 Packages

Packages contain reusable OAIT capabilities.

Examples:

```text
packages/parser
packages/rules
packages/scoring
```

Packages:

* Implement domain capabilities.
* Expose typed APIs.
* Remain reusable across applications.
* Have explicit dependency boundaries.

---

# 7. Example Reuse

Without package separation:

```text
CLI
├── parse logic
├── validation logic
├── scoring logic
└── reporting logic
```

When MCP is later introduced:

```text
MCP server
├── parse logic again
├── validation logic again
├── scoring logic again
└── reporting logic again
```

This creates duplication.

With the monorepo package architecture:

```text
                 ┌──────── CLI
                 │
                 │
Shared packages ◄┼──────── MCP
                 │
                 │
                 └──────── Future interface
```

All interfaces use the same implementation.

---

# 8. Proposed Package Model

The initial package architecture is expected to resemble:

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
```

This structure is conceptual and may be refined during implementation.

---

# 9. `packages/core`

Contains OAIT-owned domain contracts and foundational types.

Examples:

```text
NormalizedOpenApiDocument
NormalizedOperation
RuleDefinition
RuleInstance
Finding
QualityResult
OaitError
```

It should have minimal internal dependencies.

---

# 10. `packages/parser`

Responsibilities:

```text
source loading
YAML/JSON parsing
OpenAPI version detection
reference resolution
normalization
source-location mapping
```

Depends primarily on:

```text
core
```

---

# 11. `packages/validator`

Responsibilities:

* Standards validation abstraction.
* Third-party validator adaptation.
* Diagnostic normalization.

---

# 12. `packages/rules`

Responsibilities:

* Rule metadata.
* Rule Registry.
* Rule handlers.
* Rule execution.
* Applicability.
* Dependencies.
* Rule instances.
* Findings.

---

# 13. `packages/reviewer`

Responsibilities:

* Finding aggregation.
* Review summaries.
* Grouping and ordering.

---

# 14. `packages/scoring`

Responsibilities:

* Rule compliance.
* Category scores.
* Overall scores.
* Quality gates.

---

# 15. `packages/reporting`

Responsibilities:

```text
console
JSON
Markdown
future SARIF
```

---

# 16. `packages/config`

Responsibilities:

* Default configuration.
* Profile loading.
* Project configuration.
* CLI overrides.
* Effective configuration resolution.

---

# 17. Application Model

Initial:

```text
apps/
└── cli/
```

Future:

```text
apps/
├── cli/
└── mcp-server/
```

Possible later applications may include:

```text
github-action
service
IDE integration
```

These should reuse internal packages.

---

# 18. Why Not One Large Package?

Alternative architecture:

```text
src/
├── cli/
├── parser/
├── validator/
├── rules/
├── scoring/
└── ...
```

inside a single application/package.

---

## 18.1 Advantages

* Simple initial repository structure.
* Minimal package configuration.
* Faster initial setup.
* Fewer build boundaries.

---

## 18.2 Problems for OAIT

As OAIT grows, a single package would make it easier for components to access each other's internals directly.

For example:

```text
CLI
  ↓
direct import
  ↓
internal parser implementation
```

or:

```text
reporter
  ↓
rules implementation internals
```

instead of relying on intended contracts.

This can gradually create a tightly coupled codebase.

---

## 18.3 Application Reuse Problem

Future MCP support would have two choices:

### Choice A

Import arbitrary modules from inside the CLI package.

```text
mcp-server
    ↓
cli/src/internal/rules/...
```

This couples MCP to CLI organization.

### Choice B

Refactor the application into reusable libraries later.

That introduces unnecessary migration work.

---

## 18.4 Decision

Rejected as the long-term repository model.

A single-package prototype might be simpler initially, but OAIT's roadmap already contains multiple interfaces and reusable capabilities.

---

# 19. Why Not Multiple Repositories?

Alternative:

```text
oait-core
oait-cli
oait-rules
oait-mcp
oait-ai
```

as separate Git repositories.

---

## 19.1 Advantages

* Strong physical separation.
* Independent ownership.
* Independent release cycles.
* Smaller repositories.
* Useful for very large independently managed teams.

---

## 19.2 Problems for OAIT

OAIT's packages are expected to evolve together closely.

For example, changing:

```text
RuleInstance
```

may require coordinated changes to:

```text
rules
scoring
reporting
CLI
MCP
```

Across separate repositories this could require:

```text
core release
        ↓
rules dependency update
        ↓
scoring dependency update
        ↓
CLI update
        ↓
MCP update
```

for a single architectural change.

---

## 19.3 Development Friction

A contributor working on one feature might need to clone and modify multiple repositories.

Example:

```text
Add a new rule
      ↓
rules repo
      ↓
core repo
      ↓
reporting repo
      ↓
CLI repo
```

This is unnecessarily complex for OAIT's expected project scale.

---

## 19.4 Version Coordination

Early releases are expected to evolve rapidly.

A monorepo allows coordinated changes to:

```text
domain model
rules
scoring
reports
applications
```

in a single pull request.

---

## 19.5 Decision

Multiple repositories are rejected for the current OAIT architecture.

This can be revisited only if components later develop genuinely independent ownership or release lifecycles.

---

# 20. Why Monorepo Fits OAIT

The monorepo aligns particularly well with several OAIT characteristics.

---

## 20.1 Shared domain model

ADR-003 establishes:

```text
Normalized OpenAPI Domain Model
```

as a central architecture contract.

Multiple packages need those types.

A monorepo allows changes to the domain model and its consumers to be reviewed atomically.

---

## 20.2 Shared rules across interfaces

The CLI and future MCP server must execute the same rules.

```text
CLI ─────┐
         │
         ▼
      Rules
         ▲
         │
MCP ─────┘
```

---

## 20.3 Shared workflows

Interfaces should eventually reuse:

```text
validateSpecification()
reviewSpecification()
scoreSpecification()
```

instead of reproducing workflows.

---

## 20.4 Coordinated refactoring

During early architecture evolution, OAIT may change:

```text
NormalizedOperation
RuleInstance
Finding
QualityResult
```

A monorepo allows all affected packages to change in one commit or pull request.

---

## 20.5 Unified testing

One CI workflow can verify:

```text
typecheck
lint
unit tests
integration tests
cross-package tests
CLI end-to-end tests
```

for the whole system.

---

## 20.6 Easier open-source contribution

A contributor needs one repository to:

* Understand the project.
* Run tests.
* Modify a rule.
* Update documentation.
* Add test fixtures.
* Validate the CLI.

---

# 21. Dependency Direction

A monorepo does not eliminate the need for architecture boundaries.

Expected dependency direction:

```text
apps
  ↓
workflows
  ↓
domain services
  ↓
core
```

More specifically:

```text
cli
 ↓
workflows
 ↓
reviewer / scoring / validator
 ↓
rules / parser / config
 ↓
core
```

---

# 22. Dependency Rules

Initial conceptual policy:

```text
core
→ no OAIT package dependency

parser
→ core

config
→ core

validator
→ core

rules
→ core

reviewer
→ core + rules

scoring
→ core + rule result contracts

reporting
→ core

applications
→ workflows + reporting
```

Detailed dependency relationships may evolve.

---

# 23. Preventing Monorepo Coupling

A monorepo can become a “distributed monolith” if packages ignore boundaries.

Therefore packages must not depend arbitrarily on each other's internals.

Discouraged:

```text
packages/scoring
   ↓
packages/rules/src/handlers/internal/foo.ts
```

Preferred:

```text
packages/scoring
   ↓
public RuleInstance contract
```

---

# 24. Public Package APIs

Each internal package should expose an intentional public API.

Conceptually:

```typescript
import {
  analyzeOpenApi
} from "@oait/parser";
```

rather than:

```typescript
import {
  internalTraverseThing
} from "@oait/parser/src/internal/traverse";
```

The exact package naming convention will be decided later.

---

# 25. Internal Versus Published Packages

Using multiple packages in the monorepo does **not** require every package to be published independently to npm.

Packages may initially remain:

```text
internal/private workspace packages
```

while the user-facing CLI is published.

Example:

```text
@oait/core       internal
@oait/parser     internal
@oait/rules      internal

oait             published CLI package
```

The exact package-publishing model remains deferred.

---

# 26. Versioning Strategy

OAIT's early packages are expected to evolve together.

The initial recommendation is coordinated versioning or repository-level release management rather than independently versioning every internal package.

For example:

```text
OAIT 0.1.0
```

may correspond to compatible versions of all internal packages.

Independent package release cycles should be introduced only if needed.

---

# 27. Atomic Changes

One of the strongest benefits of the monorepo is atomic change.

Suppose:

```text
NormalizedParameter
```

gains a new:

```text
referenceOrigin
```

field.

One pull request can update:

```text
core
parser
rules
tests
reports
documentation
```

together.

The repository never needs to be intentionally left in an intermediate incompatible state.

---

# 28. Shared Test Data

OAIT requires a curated OpenAPI corpus.

Examples:

```text
test-data/
├── openapi-3.0/
├── openapi-3.1/
├── openapi-3.2/
├── invalid/
├── poorly-documented/
└── version-pairs/
```

A monorepo allows:

```text
parser
validator
rules
scoring
CLI
```

to reuse the same fixtures.

---

# 29. Cross-Package Integration Tests

Integration tests can verify real workflows such as:

```text
Input OpenAPI
      ↓
parser
      ↓
validator
      ↓
rules
      ↓
scoring
      ↓
reporting
```

without publishing packages before testing them together.

---

# 30. Documentation Co-location

The same repository contains:

```text
requirements
architecture
ADRs
quality model
rules
implementation
tests
examples
```

This provides valuable traceability.

Example:

```text
Rule requirement
      ↓
rule-catalog.md
      ↓
packages/rules
      ↓
test fixture
```

That is particularly useful for OAIT because documentation is a major part of the project's purpose.

---

# 31. CI/CD Impact

The repository should eventually support affected-package-aware CI where useful.

Initial CI may simply run:

```text
install
typecheck
lint
test
build
```

across all workspaces.

As the project grows, tooling may optimize execution based on changed packages.

Optimization is not required for v0.1.

---

# 32. Build Tooling

A monorepo may use:

* npm workspaces.
* pnpm workspaces.
* Yarn workspaces.
* Nx.
* Turborepo.
* Other orchestration.

This ADR does **not** select a specific workspace or build orchestration tool.

That decision should be evidence-driven during repository setup.

---

# 33. Package Manager Decision

ADR-001 establishes the Node.js ecosystem but does not mandate:

```text
npm
pnpm
yarn
```

The package-manager choice will be made during implementation setup.

Criteria should include:

* Workspace support.
* Lockfile behavior.
* Contributor simplicity.
* CI behavior.
* Security.
* Maintenance overhead.

A dedicated ADR is necessary only if the choice has significant long-term consequences.

---

# 34. Impact on CLI

The CLI becomes a thin application.

Example:

```text
apps/cli
    ↓
ScoreWorkflow
    ↓
packages/scoring
```

The CLI should not contain:

* Scoring algorithms.
* OpenAPI traversal.
* Rule definitions.

---

# 35. Impact on Future MCP

Future structure:

```text
apps/
├── cli/
└── mcp-server/
```

Both use:

```text
packages/
├── parser/
├── validator/
├── rules/
├── scoring/
└── ...
```

This is a primary reason for selecting a monorepo early instead of refactoring after MCP is introduced.

---

# 36. Impact on Future AI

Future packages may include:

```text
packages/
├── ai/
├── enhancer/
├── diff/
├── release-notes/
└── creator/
```

These can reuse existing:

```text
core
parser
rules
reporting
```

without creating separate repositories or duplicating contracts.

---

# 37. Impact on Skills

Skills are not conventional runtime code packages.

They may eventually live in:

```text
skills/
```

within the same repository because they form part of the OAIT ecosystem and should evolve alongside the capabilities they orchestrate.

They should call OAIT functionality rather than duplicate it.

---

# 38. Repository Growth Model

The repository should evolve with the product.

Do not create every future package immediately.

Initial implementation may begin with:

```text
apps/
└── cli/

packages/
├── core/
├── parser/
├── validator/
├── rules/
├── scoring/
├── reporting/
└── config/
```

Future packages should be created when their release scope begins.

---

# 39. Avoid Empty Architecture Folders

The monorepo decision does not mean creating empty directories for:

```text
ai
mcp
diff
creator
enhancer
```

years before they contain implementation.

The repository should reflect actual SDLC progress.

---

# 40. Alternatives Considered

## Alternative A — Single Package Repository

```text
openapi-intelligence-toolkit/
└── src/
```

### Advantages

* Lowest initial setup.
* Simple imports.
* Minimal tooling.

### Disadvantages

* Weak package boundaries.
* CLI-specific architecture can leak into core logic.
* Harder future MCP reuse.
* Larger refactoring likely later.
* Easier accidental coupling.

### Decision

Rejected.

---

## Alternative B — Multiple Independent Repositories

```text
oait-core
oait-cli
oait-rules
oait-mcp
```

### Advantages

* Strong physical isolation.
* Independent release cycles.
* Independent permissions/ownership.

### Disadvantages

* High coordination overhead.
* Difficult atomic changes.
* More complex contributor setup.
* Dependency-version management overhead.
* Unnecessary for current project scale.

### Decision

Rejected.

---

## Alternative C — Monorepo with Multiple Packages and Applications

### Advantages

* Shared domain contracts.
* Atomic refactoring.
* Reusable capabilities.
* Unified testing.
* Simple contributor setup.
* Suitable for CLI + MCP evolution.
* Shared fixtures and documentation.

### Disadvantages

* More repository tooling.
* Requires discipline to preserve package boundaries.
* CI can become larger over time.
* Build configuration is more complex than a single package.

### Decision

Accepted.

---

# 41. Benefits

The monorepo provides:

* One source-of-truth repository.
* Explicit package boundaries.
* Multiple interface support.
* Easier cross-component refactoring.
* Shared OpenAPI fixtures.
* Unified documentation.
* Unified CI.
* Easier traceability.
* Lower contribution friction.
* Future AI/MCP extensibility.

---

# 42. Costs

The architecture requires:

* Workspace configuration.
* Package-level configuration.
* Dependency management.
* Build orchestration.
* More careful import boundaries.
* Potential CI optimization later.

These costs are accepted because OAIT's roadmap already requires multiple reusable components.

---

# 43. Consequences

## Positive consequences

* CLI code remains thin.
* MCP can reuse existing packages.
* Parser and rules remain interface-neutral.
* One PR can change multiple packages safely.
* Documentation and code remain co-located.
* Shared test data reduces duplication.

## Negative consequences

* Repository setup is more complex.
* Contributors must understand package boundaries.
* Poor dependency discipline could still create tight coupling.
* Workspace tooling must be maintained.

---

# 44. Architectural Enforcement

Package boundaries should eventually be supported through:

* TypeScript project references or equivalent.
* Package export maps.
* Lint import restrictions.
* Workspace dependency declarations.
* Dependency-cycle checks.

Exact tooling is deferred.

---

# 45. Circular Dependency Policy

Circular package dependencies must be avoided.

Example prohibited relationship:

```text
rules → scoring
scoring → rules
```

Shared types belong in:

```text
core
```

so that both packages can depend downward.

---

# 46. Layering Example

Preferred:

```text
apps/cli
   ↓
workflows
   ↓
scoring
   ↓
core
```

and:

```text
rules
 ↓
core
```

Not:

```text
core
 ↓
cli
```

The lower-level domain layer must not depend on user-interface packages.

---

# 47. Package Responsibility Rule

A new package should be created only when at least one of the following is true:

* It represents a coherent domain capability.
* It has multiple consumers.
* It needs a meaningful dependency boundary.
* It can be independently tested.
* It is likely to become a reusable API.

Do not create packages solely to achieve a visually elaborate repository structure.

---

# 48. Package Size Principle

Packages should be cohesive rather than artificially small.

For example, OAIT should not create:

```text
packages/rule-id
packages/rule-severity
packages/rule-finding
```

if those concepts naturally belong in:

```text
packages/core
```

or:

```text
packages/rules
```

The objective is separation of responsibilities, not maximum package count.

---

# 49. Deployment Consequences

The source repository may contain many packages while v0.1 still deploys as a single CLI product.

```text
Monorepo source
      ↓
Build
      ↓
OAIT CLI distribution
```

Internal source modularity does not require multiple end-user installations.

---

# 50. Open-Source Implications

A monorepo allows contributors to see:

```text
why
what
architecture
implementation
tests
```

in one place.

A contributor fixing:

```text
OAIT-DOC-004
```

can access:

```text
rule-catalog.md
rule-schema.md
handler implementation
test data
CLI behavior
```

without navigating multiple repositories.

---

# 51. Security Considerations

Repository-level dependency management should support:

* Lockfiles.
* Dependency scanning.
* License inspection.
* Automated update tools.
* Controlled workspace dependencies.

Individual packages should minimize external dependencies where possible.

---

# 52. Performance Considerations

Monorepo structure has no direct runtime performance cost.

Build/test performance may become relevant as the repository grows.

If required, future tooling may support:

```text
incremental builds
affected-package tests
caching
parallel CI
```

Such optimization should be introduced based on measured need.

---

# 53. Technical Spikes

Before repository implementation is finalized, small setup experiments should compare:

1. npm workspaces.
2. pnpm workspaces, if considered.
3. TypeScript package references.
4. ESM compatibility.
5. Cross-package tests.
6. CLI packaging.
7. Workspace dependency enforcement.
8. Build performance.

These spikes should determine the concrete monorepo tooling.

---

# 54. Decisions Explicitly Deferred

This ADR does not decide:

1. npm versus pnpm versus Yarn.
2. Nx versus Turborepo versus no orchestration framework.
3. TypeScript project references.
4. Independent versus fixed package versioning.
5. Package publication strategy.
6. ESM versus CommonJS.
7. Build tool.
8. Test framework.
9. Release automation.
10. Workspace naming conventions.

These decisions should be made when implementation requirements provide enough evidence.

---

# 55. Relation to Later ADRs

The monorepo decision provides the structural environment in which later architecture decisions will be implemented.

Later decisions may cover:

```text
OpenAPI parser/validator selection
Rule metadata + handler architecture
Build/module strategy
AI provider abstraction
```

Those decisions should not be prematurely fixed merely because the project uses a monorepo.

---

# 56. Repository Evolution

Expected high-level evolution:

## v0.1

```text
apps/
└── cli/

packages/
├── core/
├── parser/
├── validator/
├── rules/
├── scoring/
├── reporting/
└── config/
```

## Later

```text
apps/
├── cli/
└── mcp-server/

packages/
├── ...
├── ai/
├── enhancer/
├── diff/
├── release-notes/
└── creator/
```

Actual directories should be created only when needed.

---

# 57. Status

**Accepted**

OAIT will use one Git repository containing multiple internal packages and multiple applications.

The repository will enforce logical package boundaries even though all components share one source-control repository.

---