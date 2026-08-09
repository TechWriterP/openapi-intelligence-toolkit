# OpenAPI Intelligence Toolkit (OAIT)

## Project Charter

**Document version:** 0.1
**Project status:** Planning
**Project type:** Open-source software project
**License:** Apache License 2.0 — proposed
**Repository:** GitHub — planned

---

## 1. Project Overview

The **OpenAPI Intelligence Toolkit (OAIT)** is an open-source, AI-assisted toolkit for creating, reviewing, scoring, improving, comparing, and documenting changes to OpenAPI specifications.

The toolkit is intended to combine deterministic OpenAPI processing with AI-assisted semantic analysis. Deterministic components will handle specification parsing, validation, rule evaluation, scoring, reference resolution, and change detection. AI capabilities will assist with tasks such as documentation review, description improvement, change-impact explanation, specification generation, and developer-facing release notes.

The project will expose its capabilities through a command-line interface (CLI) initially and may later provide MCP tools, reusable AI skills, CI/CD integrations, and other developer-tooling integrations.

---

## 2. Problem Statement

OpenAPI specifications are increasingly used as the source of truth for API design, documentation, development, testing, and integration. However, the overall quality of these specifications can vary significantly.

Common issues include:

* Missing or unclear operation summaries and descriptions.
* Incomplete parameter and schema documentation.
* Generic or inadequate response descriptions.
* Missing examples.
* Inconsistent terminology and naming.
* Weak error documentation.
* Incomplete metadata.
* Breaking changes that are difficult to identify and communicate.
* Manual effort required to transform specification changes into developer-facing release notes.
* AI-generated specification changes that can unintentionally modify or invent API behavior.

Existing OpenAPI validators and linters can detect many structural and rule-based problems, but they generally provide limited assistance for semantic documentation quality, developer experience, AI-assisted improvement, change explanation, and release-note generation.

OAIT will address these gaps through a combination of rules-based analysis and controlled AI assistance.

---

## 3. Vision

> Build an open-source OpenAPI intelligence platform that helps API teams create, assess, improve, and communicate OpenAPI specifications while protecting the integrity of the API contract.

---

## 4. Mission

OAIT will provide developers, technical writers, API architects, and documentation teams with a reliable and extensible toolkit for improving OpenAPI quality throughout the API lifecycle.

The project will emphasize:

* Standards compliance.
* Documentation quality.
* Developer experience.
* Reproducible quality assessment.
* Safe AI assistance.
* API contract protection.
* Explainable findings.
* Human review for uncertain information.
* Open standards and interoperability.

---

## 5. Project Objectives

The primary objectives of OAIT are to:

1. Provide deterministic validation and analysis of OpenAPI specifications.
2. Define a transparent and reproducible OpenAPI quality model.
3. Review OpenAPI specifications for structural, documentation, consistency, schema, response, error, and governance issues.
4. Calculate a measurable quality score based on explicitly defined rules.
5. Use AI to improve eligible documentation metadata without modifying the API contract.
6. Identify situations where additional information from a subject matter expert is required instead of allowing AI to invent API behavior.
7. Compare OpenAPI specification versions and identify meaningful API changes.
8. Distinguish potentially breaking changes from nonbreaking changes.
9. Generate developer-focused API release-note drafts from specification changes.
10. Assist with creating new OpenAPI specifications from sufficiently detailed source information.
11. Expose reusable functionality through a CLI and, later, MCP and AI skills.
12. Support integration into developer workflows and CI/CD pipelines.
13. Establish an extensible open-source architecture that supports custom rules and organizational quality policies.

---

## 6. Target Users

### 6.1 Technical Writers

Technical writers can use OAIT to:

* Review API reference content.
* Detect missing documentation.
* Improve API descriptions.
* Identify documentation inconsistencies.
* Generate SME questions.
* Generate API release-note drafts.

### 6.2 API Developers

API developers can use OAIT to:

* Validate specifications before committing changes.
* Identify documentation and API-design issues.
* Detect breaking changes.
* Run automated quality checks in CI/CD pipelines.

### 6.3 API Architects

API architects can use OAIT to:

* Review API design consistency.
* Apply governance rules.
* Define API quality gates.
* Evaluate specifications across multiple services.

### 6.4 Developer Experience Teams

Developer experience teams can use OAIT to:

* Improve API discoverability and usability.
* Evaluate API reference quality.
* Improve examples, descriptions, and error documentation.

### 6.5 Documentation and API Governance Leads

Documentation and API governance leads can use OAIT to:

* Define organizational quality requirements.
* Establish reusable rule sets.
* Measure API documentation quality.
* Enforce minimum quality thresholds.

### 6.6 Open-Source Maintainers

Open-source maintainers can use OAIT to:

* Review contributed OpenAPI specifications.
* Validate API changes.
* Improve documentation.
* Generate changelogs and release notes.

---

## 7. Product Capabilities

OAIT is planned around six primary capabilities.

### 7.1 OpenAPI Creator

Creates or assists with creating OpenAPI specifications from structured API requirements and other approved source information.

Potential inputs include:

* API requirements.
* Endpoint definitions.
* Existing API documentation.
* Request and response examples.
* JSON payloads.
* `curl` examples.
* Source-code metadata.

The Creator must not invent unspecified API behavior.

---

### 7.2 OpenAPI Reviewer

Reviews an OpenAPI specification and identifies issues related to:

* Specification conformance.
* Documentation completeness.
* Documentation clarity.
* API consistency.
* Schemas.
* Parameters.
* Request bodies.
* Responses.
* Errors.
* Examples.
* Security declarations.
* Lifecycle metadata.
* Developer experience.

The Reviewer explains findings and recommends appropriate actions.

---

### 7.3 OpenAPI Scorer

Calculates an OpenAPI quality score using deterministic rules and configurable weighting.

Potential scoring categories include:

* Specification conformance.
* Documentation quality.
* API completeness.
* Schema quality.
* Responses and errors.
* Consistency.
* Examples.
* Lifecycle and governance.

The scoring mechanism must be reproducible and explainable.

AI must not arbitrarily assign the overall score.

---

### 7.4 OpenAPI Enhancer

Improves eligible documentation-related metadata based on Reviewer findings.

Examples include:

* Operation summaries.
* Operation descriptions.
* Parameter descriptions.
* Schema descriptions.
* Property descriptions.
* Response descriptions.
* Tag descriptions.
* Examples when sufficient evidence is available.

The Enhancer must distinguish among:

* Safe automatic improvements.
* Suggested improvements requiring review.
* Items requiring SME input.

The Enhancer must not modify protected API contract elements unless the user explicitly requests a contract change through a future supported workflow.

---

### 7.5 OpenAPI Change Analyzer

Compares two versions of an OpenAPI specification and identifies semantic changes such as:

* Added operations.
* Removed operations.
* Changed parameters.
* Required-property changes.
* Schema changes.
* Response changes.
* Status-code changes.
* Authentication changes.
* Deprecations.
* Potential breaking changes.

Change detection must primarily use deterministic comparison.

---

### 7.6 API Release Notes Generator

Transforms verified OpenAPI changes into structured, developer-facing release-note drafts.

Potential release-note categories include:

* Breaking changes.
* New APIs.
* Changed operations.
* Deprecated functionality.
* Schema changes.
* Authentication changes.
* Error-handling changes.
* Migration considerations.

Migration guidance must only be generated when sufficient evidence is available.

---

## 8. Scope

### 8.1 In Scope

The project will support capabilities related to:

* OpenAPI specification parsing.
* OpenAPI validation.
* OpenAPI version detection.
* `$ref` resolution.
* Specification normalization.
* Rules-based analysis.
* Documentation-quality analysis.
* Quality scoring.
* Documentation improvement.
* OpenAPI Overlay generation.
* API contract protection.
* Semantic specification comparison.
* Breaking-change detection.
* Change-impact analysis.
* API release-note generation.
* OpenAPI specification creation.
* CLI workflows.
* Machine-readable reports.
* Markdown reports.
* AI-provider abstraction.
* MCP integration in a later release.
* AI skills in a later release.
* CI/CD integration in a later release.

The architecture should accommodate OpenAPI 3.0.x, 3.1.x, and 3.2.x.

---

### 8.2 Out of Scope for Initial Releases

The following capabilities are not part of the initial project scope:

* API gateway functionality.
* API hosting.
* Runtime API monitoring.
* API performance testing.
* API load testing.
* API penetration testing.
* Full API security scanning.
* SDK generation.
* Mock-server hosting.
* API traffic analytics.
* API monetization.
* API lifecycle-management platform functionality.
* General-purpose developer-documentation generation.
* API management portal functionality.

These capabilities may be considered for integrations but will not be implemented as core OAIT functionality during the initial project phases.

---

## 9. Architectural Principles

### 9.1 Deterministic Software for Facts

OAIT will use deterministic processing for operations where correctness can be established programmatically.

Examples include:

* Parsing.
* Validation.
* Reference resolution.
* Rule evaluation.
* Scoring.
* Structural analysis.
* Specification comparison.
* API contract comparison.

### 9.2 AI for Interpretation

AI will be used for tasks that require semantic interpretation or natural-language generation.

Examples include:

* Documentation-quality assessment.
* Description improvement.
* Explanation of findings.
* Developer-impact descriptions.
* SME-question generation.
* Release-note prose.
* Controlled OpenAPI generation.

### 9.3 Protect the API Contract

AI-generated documentation improvements must not silently alter API behavior.

Protected elements include:

* Paths.
* HTTP methods.
* Operation identifiers.
* Parameter names and locations.
* Required properties.
* Data types.
* Formats.
* Enumeration values.
* Request schemas.
* Response schemas.
* HTTP status codes.
* Security requirements.

Changes to protected elements must be detected and rejected during documentation-only workflows.

### 9.4 Do Not Invent API Behavior

If available evidence is insufficient, OAIT must identify the issue as requiring additional information.

Example:

```text
Requires SME input

The specification defines the property as a string but does not
provide enough information to explain the permitted business values.
```

OAIT should generate an appropriate SME question instead of inventing an explanation.

### 9.5 Explainability

Every finding should indicate, where applicable:

* Rule identifier.
* Severity.
* Location.
* Reason for the finding.
* Recommendation.
* Evidence.
* Whether automatic remediation is safe.
* Whether SME review is required.

### 9.6 Human-in-the-Loop AI

AI-generated modifications should support review before application.

Where practical, workflows should support:

1. Analyze.
2. Recommend.
3. Review.
4. Apply.
5. Validate.
6. Rescore.

### 9.7 Provider Independence

The AI architecture should not depend permanently on a single LLM provider.

A provider abstraction should allow future support for multiple hosted or local models.

### 9.8 Standards-Based Integration

Where practical, OAIT should use established standards rather than proprietary representations.

Examples include:

* OpenAPI Specification.
* OpenAPI Overlay Specification.
* Model Context Protocol.
* SARIF or other standard reporting formats where appropriate.

---

## 10. Proposed High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    User Interfaces                      │
│                                                         │
│       CLI        MCP        Skills        CI/CD         │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 Workflow Orchestrator                   │
│                                                         │
│ Create │ Review │ Score │ Improve │ Compare │ Release   │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Deterministic Engine   │   │        AI Engine         │
│                          │   │                          │
│ Parser                   │   │ Semantic review          │
│ Validator                │   │ Description rewriting    │
│ Reference resolver       │   │ Explanation              │
│ Rules engine             │   │ Impact analysis          │
│ Scoring engine           │   │ SME-question generation  │
│ Diff engine              │   │ Release-note generation  │
│ Contract guard           │   │ Spec-generation support  │
│ Overlay generator        │   │                          │
└─────────────┬────────────┘   └─────────────┬────────────┘
              │                              │
              └──────────────┬───────────────┘
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Output Layer                         │
│                                                         │
│ JSON │ Markdown │ YAML │ Overlay │ SARIF │ Console      │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Proposed Core Components

The shared OpenAPI engine should provide reusable functionality for all higher-level workflows.

Potential modules include:

```text
parseSpec()
detectVersion()
validateSpec()
normalizeSpec()
resolveReferences()

analyzeSpec()
analyzeOperation()
analyzeSchema()
analyzeDocumentation()

runRules()
calculateScore()

compareSpecs()
classifyChanges()
detectBreakingChanges()

createOverlay()
applyOverlay()

protectContract()

generateReport()
```

Higher-level capabilities must reuse these core functions rather than independently implementing OpenAPI processing.

---

## 12. OpenAPI Quality Model

The project will establish a formal OpenAPI Quality Model.

The initial model is expected to include the following categories:

| Category                  | Proposed initial weight |
| ------------------------- | ----------------------: |
| Specification conformance |                     20% |
| Documentation quality     |                     25% |
| API completeness          |                     15% |
| Schema quality            |                     10% |
| Responses and errors      |                     10% |
| Consistency               |                     10% |
| Examples                  |                      5% |
| Lifecycle and governance  |                      5% |
| **Total**                 |                **100%** |

Weights will be configurable.

The scoring system will also support mandatory quality gates so that a critical failure cannot be hidden by a high aggregate score.

Example:

```text
Overall score: 91/100

Quality gate: FAILED

Critical finding:
The API does not declare the required security configuration.
```

---

## 13. Rule Model

Rules will use stable identifiers and categories.

Proposed taxonomy:

```text
OAIT-CON-xxx    Specification conformance
OAIT-DOC-xxx    Documentation
OAIT-OPS-xxx    Operations
OAIT-SCH-xxx    Schemas
OAIT-RSP-xxx    Responses
OAIT-ERR-xxx    Errors
OAIT-EXA-xxx    Examples
OAIT-SEC-xxx    Security
OAIT-GOV-xxx    Governance
OAIT-CHG-xxx    API changes
```

Example rule:

```yaml
id: OAIT-DOC-001
name: Missing operation summary
category: documentation
severity: warning
detection: deterministic
autofix: ai-assisted
scoreImpact: -2
```

Rules should be individually testable and configurable.

---

## 14. AI Requirements

AI capabilities must:

* Produce structured output where practical.
* Identify evidence used to make recommendations.
* Distinguish facts from inferred information.
* Indicate confidence where appropriate.
* Flag unsupported information for SME review.
* Avoid modifying protected contract elements.
* Treat specification content as untrusted input.
* Ignore prompt-like instructions embedded inside specification descriptions.
* Support deterministic post-validation.
* Support automated evaluation through an AI evaluation suite.

---

## 15. Primary Interfaces

### 15.1 CLI

The CLI will be the initial primary user interface.

Planned commands may include:

```bash
oait validate openapi.yaml

oait review openapi.yaml

oait score openapi.yaml

oait improve openapi.yaml

oait diff v1.yaml v2.yaml

oait release-notes v1.yaml v2.yaml

oait create requirements.md
```

---

### 15.2 MCP Server

A later release will expose selected core capabilities through MCP.

Potential MCP tools include:

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

### 15.3 AI Skills

Reusable AI skills will define workflow instructions for:

```text
create-openapi
review-openapi
score-openapi
improve-openapi
generate-api-release-notes
```

Skills will orchestrate deterministic tools rather than duplicate OpenAPI processing logic.

---

### 15.4 CI/CD

Future releases should support automated quality gates.

Example:

```bash
oait score openapi.yaml --fail-under 85
```

This command could be integrated into GitHub Actions and other CI/CD platforms.

---

## 16. Proposed Technology Direction

The following technology choices are proposed for architecture evaluation.

| Area                 | Proposed direction                                                  |
| -------------------- | ------------------------------------------------------------------- |
| Primary language     | TypeScript                                                          |
| Runtime              | Node.js                                                             |
| Repository model     | Monorepo                                                            |
| Package distribution | npm                                                                 |
| Specification input  | YAML and JSON                                                       |
| CLI                  | TypeScript/Node.js                                                  |
| MCP                  | MCP TypeScript SDK                                                  |
| Source control       | Git and GitHub                                                      |
| CI/CD                | GitHub Actions                                                      |
| Testing              | Unit, integration, regression, golden-file, and AI evaluation tests |
| License              | Apache License 2.0                                                  |
| Versioning           | Semantic Versioning                                                 |
| Documentation        | Markdown / docs-as-code                                             |

Final dependency and framework selections will be documented through Architecture Decision Records during the architecture and design phase.

---

## 17. Proposed Repository Structure

```text
openapi-intelligence-toolkit/
│
├── README.md
├── PROJECT_CHARTER.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
│
├── packages/
│   ├── core/
│   ├── parser/
│   ├── rules/
│   ├── scoring/
│   ├── reviewer/
│   ├── enhancer/
│   ├── diff/
│   ├── release-notes/
│   ├── creator/
│   ├── ai/
│   └── reporting/
│
├── apps/
│   ├── cli/
│   └── mcp-server/
│
├── skills/
│   ├── create-openapi/
│   ├── review-openapi/
│   ├── score-openapi/
│   ├── improve-openapi/
│   └── generate-release-notes/
│
├── rulesets/
│   ├── default/
│   ├── documentation/
│   └── strict/
│
├── evals/
│
├── test-data/
│   ├── openapi-3.0/
│   ├── openapi-3.1/
│   └── openapi-3.2/
│
├── examples/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── concepts/
│   └── contributing/
│
└── .github/
```

---

## 18. Release Strategy

### v0.1 — Foundation

Primary objectives:

* Establish OpenAPI Core.
* Implement the rules engine.
* Implement initial Reviewer functionality.
* Implement deterministic scoring.
* Provide CLI commands.
* Generate JSON and Markdown reports.

---

### v0.2 — Safe AI Improvement

Primary objectives:

* Introduce the AI abstraction layer.
* Implement the OpenAPI Enhancer.
* Implement API Contract Guard.
* Generate OpenAPI Overlays.
* Support before-and-after scoring.
* Establish the initial AI evaluation framework.

---

### v0.3 — Change Intelligence

Primary objectives:

* Implement semantic specification comparison.
* Detect potentially breaking changes.
* Classify changes.
* Generate developer-impact explanations.
* Generate API release-note drafts.

---

### v0.4 — OpenAPI Creation

Primary objectives:

* Implement OpenAPI Creator.
* Support controlled specification generation.
* Add validation and correction loops.
* Generate SME questions for missing requirements.

---

### v0.5 — AI Ecosystem Integration

Primary objectives:

* Implement the MCP server.
* Publish reusable AI skills.
* Improve provider abstraction.
* Demonstrate tool-calling workflows.

---

### v1.0 — Stable Public Release

Expected capabilities:

* Stable CLI.
* Stable core API.
* Stable rules framework.
* Review.
* Score.
* Improve.
* Compare.
* Release-note generation.
* Create.
* MCP integration.
* AI skills.
* OpenAPI 3.x support.
* CI/CD integration.
* Evaluation suite.
* Complete contributor and user documentation.

---

## 19. Success Criteria

The project will be considered successful when it can demonstrate the following outcomes.

### Functional Success

* Parse supported OpenAPI specifications reliably.
* Detect specification and documentation issues.
* Produce reproducible quality scores.
* Explain why each significant finding was reported.
* Improve eligible documentation without changing the API contract.
* Detect meaningful differences between specification versions.
* Identify potentially breaking changes.
* Generate useful developer-facing release-note drafts.
* Generate valid OpenAPI specifications from sufficiently complete requirements.

### AI Quality Success

* AI-generated content is grounded in specification evidence.
* Unsupported API behavior is flagged instead of invented.
* Contract-modification attempts are detected.
* AI output conforms to defined structured schemas.
* Automated evaluation tests measure AI quality and regressions.

### Open-Source Success

* Public GitHub repository.
* Clear documentation.
* Automated tests.
* CI/CD pipeline.
* Contribution guidelines.
* Issue and feature-request templates.
* Reusable examples.
* Versioned releases.
* Extensible rule architecture.

### Portfolio Success

The project should demonstrate practical knowledge of:

* AI-assisted software architecture.
* LLM tool calling.
* Structured AI output.
* AI guardrails.
* Hallucination mitigation.
* Human-in-the-loop workflows.
* MCP.
* Reusable AI skills.
* API documentation.
* OpenAPI.
* CI/CD.
* Testing and evaluation.
* Open-source software development.

---

## 20. Major Risks

| Risk                                             | Impact   | Initial mitigation                               |
| ------------------------------------------------ | -------- | ------------------------------------------------ |
| Project scope becomes too broad                  | High     | Maintain strict release boundaries               |
| AI invents API behavior                          | Critical | Evidence requirements and SME escalation         |
| AI changes API contract                          | Critical | Contract Guard and post-generation comparison    |
| Quality scores appear subjective                 | High     | Deterministic rule-based scoring                 |
| Existing tools duplicate functionality           | Medium   | Integrate or complement established tools        |
| OpenAPI version differences introduce complexity | High     | Version-aware core architecture                  |
| LLM provider lock-in                             | Medium   | Provider abstraction                             |
| Large specifications increase token usage        | High     | Selective context and operation-level processing |
| AI output is inconsistent                        | High     | Structured output and automated evals            |
| Prompt injection through API descriptions        | High     | Treat specification content as untrusted data    |
| Open-source maintenance becomes burdensome       | Medium   | Modular architecture and contribution governance |

---

## 21. Constraints

Initial project constraints include:

* The project will be developed as an independent open-source initiative.
* Development resources may initially be limited.
* AI capabilities may depend on external model APIs.
* Model behavior and cost can vary between providers.
* OpenAPI specifications can vary considerably in size and quality.
* Some API behavior cannot be safely inferred from the specification alone.
* The project must not depend on an LLM for deterministic specification correctness.

---

## 22. Assumptions

The project currently assumes that:

* OpenAPI specifications are provided in YAML or JSON.
* Initial users are comfortable with CLI-based workflows.
* OpenAPI specifications remain the primary source artifact.
* Human review remains appropriate for AI-generated API documentation.
* Existing OpenAPI libraries can be reused for foundational processing where suitable.
* GitHub will be the primary open-source collaboration platform.
* The project will use incremental releases rather than attempting full functionality in the first release.

---

## 23. Open-Source Strategy

The project should follow an open development model.

Planned repository assets include:

* Apache License 2.0.
* README.
* Project Charter.
* Contribution guide.
* Code of Conduct.
* Security policy.
* Architecture documentation.
* Architecture Decision Records.
* Issue templates.
* Pull-request template.
* Public roadmap.
* Example OpenAPI files.
* Automated tests.
* AI evaluation datasets.
* Release notes.

Community contributions should be encouraged particularly for:

* New quality rules.
* New rulesets.
* Additional test specifications.
* AI evaluation cases.
* OpenAPI-version compatibility.
* Integrations.
* Documentation improvements.

---

## 24. SDLC Approach

The project will follow the following SDLC phases.

### Phase 1 — Planning

Deliverables:

* Project Charter.
* Project scope.
* Personas.
* Initial roadmap.
* Risk register.
* Architectural principles.

### Phase 2 — Requirements Analysis

Deliverables:

* Product Requirements Document.
* Functional requirements.
* Nonfunctional requirements.
* Use cases.
* User stories.
* Acceptance criteria.
* OpenAPI Quality Model.
* Initial rule catalog.
* AI requirements.

### Phase 3 — Architecture and Design

Deliverables:

* System architecture.
* Component architecture.
* Data-flow design.
* AI architecture.
* Rule architecture.
* Scoring architecture.
* CLI design.
* Contract Guard design.
* Security design.
* Architecture Decision Records.

### Phase 4 — Development

Deliverables:

* Core packages.
* CLI.
* Rules.
* Reviewer.
* Scorer.
* Enhancer.
* Diff engine.
* Release Notes Generator.
* Creator.
* MCP server.
* Skills.

### Phase 5 — Verification and Validation

Testing will include:

* Unit tests.
* Integration tests.
* Regression tests.
* Golden-file tests.
* OpenAPI compatibility tests.
* AI evaluation tests.
* Contract-protection tests.
* Prompt-injection tests.
* Performance tests.
* Security tests.

### Phase 6 — Release

Deliverables:

* Release package.
* npm packages.
* CLI installation.
* Documentation.
* Examples.
* Migration information.
* Release notes.

### Phase 7 — Operations and Maintenance

Activities include:

* Issue triage.
* Security updates.
* Dependency updates.
* Community support.
* Rule maintenance.
* OpenAPI-version updates.
* Evaluation maintenance.

### Phase 8 — Evolution

Future development may include:

* IDE integrations.
* Additional MCP integrations.
* Enterprise rulesets.
* Web interface.
* Repository-aware workflows.
* Additional AI providers.
* Organization-specific quality profiles.

---

## 25. Planning-Phase Definition of Done

The planning phase is complete when the following artifacts have been created and reviewed:

* [x] Initial project vision.
* [x] Project Charter.
* [x] Initial project scope.
* [x] Initial capability model.
* [x] Initial release strategy.
* [x] Initial architectural principles.
* [x] Initial risk identification.
* [ ] Product Requirements Document.
* [ ] Functional Requirements Specification.
* [ ] Nonfunctional Requirements Specification.
* [ ] Use cases and user stories.
* [ ] OpenAPI Quality Model v0.1.
* [ ] Initial rule catalog.
* [ ] AI requirements and guardrails specification.
* [ ] v0.1 acceptance criteria.
* [ ] Architecture review readiness checklist.

---

## 26. Immediate Next Steps

The project should proceed in the following order:

1. Create the GitHub repository structure.
2. Add this Project Charter to the repository.
3. Create the Product Requirements Document.
4. Define functional requirements.
5. Define nonfunctional requirements.
6. Define primary use cases and user stories.
7. Design the OpenAPI Quality Model.
8. Define the initial rule taxonomy and rule catalog.
9. Define AI requirements and guardrails.
10. Establish acceptance criteria for v0.1.
11. Complete the planning and requirements baseline.
12. Begin the architecture and design phase.

---

## 27. Project Principle

The following principle will guide technical and product decisions throughout the project:

> **Use deterministic software for facts, AI for interpretation, and human review where the available evidence is insufficient.**

This principle is intended to make OAIT reliable enough for professional API development and documentation workflows while still taking advantage of modern AI capabilities.
