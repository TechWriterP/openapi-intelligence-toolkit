# OpenAPI Intelligence Toolkit (OAIT)

## Nonfunctional Requirements Specification

**Document version:** 0.1
**Project status:** Planning
**Product status:** Proposed
**Related documents:** `PRD.md`, `functional-requirements.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This Nonfunctional Requirements Specification defines the quality attributes and operational constraints for the **OpenAPI Intelligence Toolkit (OAIT)**.

The requirements in this document define how OAIT must behave with respect to:

* Performance.
* Reliability.
* Security.
* Privacy.
* Maintainability.
* Extensibility.
* Compatibility.
* Portability.
* Usability.
* Accessibility.
* Observability.
* Testability.
* AI quality.
* Reproducibility.
* Scalability.
* Dependency management.

These requirements complement the functional requirements defined in `functional-requirements.md`.

---

# 2. Requirement Conventions

## 2.1 Requirement Keywords

The following keywords are used:

* **Must** — Mandatory requirement.
* **Should** — Recommended requirement that may be deferred when justified.
* **May** — Optional capability.

---

## 2.2 Requirement Identifier Format

Nonfunctional requirements use the following format:

```text
NFR-<AREA>-<NUMBER>
```

Examples:

```text
NFR-PERF-001
NFR-SEC-001
NFR-AIQ-001
```

---

## 2.3 Requirement Areas

| Prefix     | Requirement area      |
| ---------- | --------------------- |
| `NFR-PERF` | Performance           |
| `NFR-REL`  | Reliability           |
| `NFR-SEC`  | Security              |
| `NFR-PRV`  | Privacy               |
| `NFR-MNT`  | Maintainability       |
| `NFR-EXT`  | Extensibility         |
| `NFR-COM`  | Compatibility         |
| `NFR-POR`  | Portability           |
| `NFR-USA`  | Usability             |
| `NFR-ACC`  | Accessibility         |
| `NFR-OBS`  | Observability         |
| `NFR-TST`  | Testability           |
| `NFR-AIQ`  | AI quality            |
| `NFR-REP`  | Reproducibility       |
| `NFR-SCL`  | Scalability           |
| `NFR-DEP`  | Dependency management |

---

# 3. Performance Requirements

## NFR-PERF-001 — Interactive CLI performance

Deterministic CLI operations should complete within a reasonable interactive response time for typical OpenAPI specifications.

For the initial release, the performance target for a specification containing up to approximately 500 operations is:

* Parsing: within 2 seconds.
* Validation: within 5 seconds.
* Deterministic review: within 10 seconds.
* Deterministic scoring: within 10 seconds.

These values are initial engineering targets and may be refined after benchmarking.

---

## NFR-PERF-002 — Performance measurement

OAIT must provide automated performance tests for critical deterministic workflows.

At minimum, benchmarks should cover:

* Parsing.
* Reference resolution.
* Validation.
* Rule execution.
* Scoring.
* Specification comparison when implemented.

---

## NFR-PERF-003 — Avoid unnecessary repeated processing

Within a single workflow, OAIT should avoid unnecessarily repeating:

* Parsing.
* Reference resolution.
* Normalization.
* Rule loading.
* Contract fingerprint generation.

Reusable intermediate representations should be retained during the workflow where practical.

---

## NFR-PERF-004 — Selective AI context

AI-assisted operations must avoid sending the complete OpenAPI specification to the model when only a subset of the document is required.

The AI layer should select the minimum context necessary to complete the requested operation.

---

## NFR-PERF-005 — Large-document processing

OAIT should support processing large OpenAPI specifications by dividing analysis into logical units such as:

* Operations.
* Schemas.
* Tags.
* Path groups.
* Components.

---

## NFR-PERF-006 — AI concurrency control

AI-assisted workflows should support controlled concurrency when multiple independent specification elements require analysis.

Concurrency must respect:

* Provider rate limits.
* Cost constraints.
* Result ordering.
* Error recovery.

---

## NFR-PERF-007 — Performance regression protection

Material performance regressions in core deterministic operations should be detectable through automated benchmark or regression testing.

---

# 4. Reliability Requirements

## NFR-REL-001 — Source-file preservation

OAIT must not corrupt or overwrite the user's source OpenAPI file because of:

* Processing failure.
* AI failure.
* Validation failure.
* Contract Guard failure.
* Report-generation failure.

---

## NFR-REL-002 — Atomic output generation

Where OAIT writes a generated specification or other critical artifact, the output operation should be atomic where practical.

Partially written files must not be presented as successfully generated artifacts.

---

## NFR-REL-003 — Graceful failure

Failure in one processing stage must produce a controlled error rather than an uncontrolled application termination where practical.

---

## NFR-REL-004 — Deterministic subsystem isolation

Failure of an AI provider must not prevent users from using deterministic capabilities such as:

* Validation.
* Deterministic review.
* Scoring.
* Ruleset analysis.

---

## NFR-REL-005 — Error isolation

A failure while processing one independent operation or schema should not unnecessarily invalidate unrelated analysis when partial processing is safe.

---

## NFR-REL-006 — Stable result structure

Machine-readable output must remain structurally valid even when some workflow components fail.

Applicable failure information must be represented explicitly.

---

## NFR-REL-007 — Recovery from transient AI failures

AI-enabled workflows should support bounded retries for transient errors such as:

* Rate limiting.
* Temporary provider failures.
* Network timeouts.

Retries must not be unbounded.

---

## NFR-REL-008 — No silent failure

OAIT must not silently omit a failed rule, failed AI evaluation, unresolved reference, or skipped analysis step when that omission could affect results.

The user must be informed.

---

# 5. Security Requirements

## NFR-SEC-001 — Treat OpenAPI content as untrusted input

All OpenAPI content must be treated as untrusted data.

This requirement includes:

* Descriptions.
* Summaries.
* Examples.
* Extension fields.
* Referenced files.

---

## NFR-SEC-002 — Prompt-injection isolation

Instructions embedded within OpenAPI content must not override:

* System instructions.
* OAIT workflow instructions.
* AI safety rules.
* Contract-protection rules.

---

## NFR-SEC-003 — Secret protection

OAIT must not include AI provider API keys or other credentials in:

* Console output.
* Reports.
* Generated files.
* Error messages.
* Telemetry.
* Debug logs by default.

---

## NFR-SEC-004 — Environment-based secret handling

External service credentials should be supplied through secure mechanisms such as environment variables or supported secret stores.

Credentials must not be required in source-controlled configuration files.

---

## NFR-SEC-005 — Remote reference controls

Resolution of remote `$ref` references must be explicitly controlled.

The implementation must protect against risks including:

* Arbitrary remote access.
* Unexpected network requests.
* Server-side request forgery patterns.
* Untrusted protocols.
* Excessive redirects.

---

## NFR-SEC-006 — Local file reference controls

Local reference resolution must prevent unintended access outside permitted paths where applicable.

---

## NFR-SEC-007 — Output-path protection

OAIT must validate output paths before writing files.

The product should prevent unsafe path traversal caused by untrusted specification content.

---

## NFR-SEC-008 — Dependency vulnerability monitoring

Known security vulnerabilities in dependencies must be detectable through automated dependency scanning.

---

## NFR-SEC-009 — Security disclosure process

The open-source project must provide a documented security-reporting process.

A `SECURITY.md` file should describe:

* Supported versions.
* Vulnerability-reporting method.
* Disclosure expectations.

---

## NFR-SEC-010 — Least-privilege integrations

Future MCP and external integrations should request only the permissions required for the supported workflow.

---

## NFR-SEC-011 — Contract Guard cannot be bypassed silently

Documentation-improvement workflows must not silently disable contract protection.

Any explicit bypass mechanism, if introduced, must require clear user intent.

---

# 6. Privacy Requirements

## NFR-PRV-001 — Local-first deterministic processing

Deterministic OpenAPI processing should occur locally where technically practical.

---

## NFR-PRV-002 — External AI disclosure

When an AI-assisted workflow sends specification content to an external provider, OAIT must clearly document that behavior.

---

## NFR-PRV-003 — Minimize external data transfer

Only the minimum specification context required for the AI task should be transmitted to external AI services.

---

## NFR-PRV-004 — No source-content telemetry by default

OAIT must not transmit OpenAPI specification contents through telemetry by default.

---

## NFR-PRV-005 — Telemetry opt-in

If telemetry is introduced, collection of nonessential telemetry should be opt-in unless required for a clearly documented operational reason.

---

## NFR-PRV-006 — Sensitive data awareness

Documentation must inform users that OpenAPI specifications may contain:

* Internal endpoint names.
* Business terminology.
* Examples containing personal information.
* Authentication information.
* Internal infrastructure references.

Users must be advised to review organizational data policies before enabling external AI processing.

---

## NFR-PRV-007 — Report privacy

Generated reports must not include credentials or other secrets detected during processing.

---

# 7. Maintainability Requirements

## NFR-MNT-001 — Modular architecture

OAIT must use clearly separated modules for major concerns such as:

* Parsing.
* Validation.
* Rules.
* Scoring.
* Reviewing.
* Enhancing.
* Diff processing.
* AI integration.
* Reporting.

---

## NFR-MNT-002 — Single responsibility

Modules should have focused responsibilities and avoid unnecessary coupling.

---

## NFR-MNT-003 — Shared core logic

CLI, MCP, CI/CD, and skill integrations must reuse shared core functionality rather than duplicate business logic.

---

## NFR-MNT-004 — Coding standards

The project must define and enforce consistent coding standards.

Automated checks should include:

* Formatting.
* Linting.
* Type checking.

---

## NFR-MNT-005 — Public API documentation

Reusable public package interfaces must be documented.

---

## NFR-MNT-006 — Architecture Decision Records

Material architectural decisions should be documented using Architecture Decision Records.

---

## NFR-MNT-007 — Change isolation

Changes to one product capability should not require unnecessary changes to unrelated modules.

---

## NFR-MNT-008 — Rule documentation generation

Where practical, human-readable rule documentation should be generated from rule metadata to prevent code-documentation drift.

---

## NFR-MNT-009 — Technical debt visibility

Known technical debt should be recorded through:

* Issues.
* ADRs.
* Roadmap items.
* Explicit code comments where appropriate.

---

## NFR-MNT-010 — Release documentation

Each public release must include meaningful release notes or a changelog entry.

---

# 8. Extensibility Requirements

## NFR-EXT-001 — Extensible rules framework

New rules must be addable without requiring modification of unrelated analysis components.

---

## NFR-EXT-002 — Custom rulesets

The architecture must support custom rulesets.

---

## NFR-EXT-003 — Configurable severity

Rules should support configurable severity where appropriate.

---

## NFR-EXT-004 — Configurable scoring

The architecture must support configurable:

* Rule weights.
* Category weights.
* Quality thresholds.
* Quality gates.

---

## NFR-EXT-005 — AI provider extensibility

New AI providers must be addable through a defined provider interface.

---

## NFR-EXT-006 — Reporting extensibility

New output formats should be addable without modifying core OpenAPI-analysis logic.

---

## NFR-EXT-007 — Interface extensibility

New interfaces such as:

* MCP.
* IDE integrations.
* Web interfaces.
* CI/CD actions.

should reuse core packages without introducing alternate implementations of the same business rules.

---

## NFR-EXT-008 — Version-aware extensions

Rules and analyzers must be able to declare the OpenAPI versions to which they apply.

---

## NFR-EXT-009 — Change-classification extensibility

The change-analysis framework should support additional change types and classification policies.

---

## NFR-EXT-010 — Organizational profiles

Future versions should support organization-specific quality profiles without requiring a fork of OAIT.

---

# 9. Compatibility Requirements

## NFR-COM-001 — OpenAPI 3.x architecture

The architecture must support OpenAPI 3.x specifications.

---

## NFR-COM-002 — Explicit support matrix

Each OAIT release must document the OpenAPI versions it officially supports.

---

## NFR-COM-003 — Version-specific behavior

OAIT must apply version-specific validation or semantic behavior when required by differences between supported OpenAPI versions.

---

## NFR-COM-004 — YAML and JSON equivalence

Equivalent OpenAPI YAML and JSON representations should produce equivalent deterministic analysis results.

---

## NFR-COM-005 — Multi-file compatibility

Where supported, multi-file OpenAPI specifications must receive the same analysis semantics as logically equivalent single-file specifications.

---

## NFR-COM-006 — Ruleset-version compatibility

OAIT should validate that a selected ruleset is compatible with the current OAIT and OpenAPI versions.

---

## NFR-COM-007 — Configuration compatibility

Breaking changes to public configuration formats must follow the project's versioning policy.

---

## NFR-COM-008 — Machine-output compatibility

Breaking changes to stable machine-readable output schemas must be versioned and documented.

---

# 10. Portability Requirements

## NFR-POR-001 — Major desktop platforms

The CLI should support current maintained versions of:

* Windows.
* macOS.
* Linux.

---

## NFR-POR-002 — Architecture independence

The project should avoid assumptions that unnecessarily restrict execution to a specific CPU architecture.

---

## NFR-POR-003 — Standard runtime requirements

OAIT should depend on a supported standard runtime rather than platform-specific native dependencies where practical.

---

## NFR-POR-004 — CI environment support

The CLI must support execution in common headless CI environments.

---

## NFR-POR-005 — Container compatibility

The architecture should permit execution within containers.

---

## NFR-POR-006 — Path handling

File-path handling must account for relevant differences between Windows and POSIX-based systems.

---

# 11. Usability Requirements

## NFR-USA-001 — Clear command structure

CLI commands must use consistent syntax and terminology.

---

## NFR-USA-002 — Actionable findings

Findings must explain:

* What was detected.
* Where it was detected.
* Why it matters where applicable.
* What the user can do next.

---

## NFR-USA-003 — Concise default output

Default CLI output should prioritize essential information.

Detailed diagnostic information should be available through explicit options.

---

## NFR-USA-004 — Consistent terminology

Product terminology must remain consistent across:

* CLI.
* Reports.
* Documentation.
* Configuration.
* MCP tools.
* AI skills.

---

## NFR-USA-005 — Clear severity representation

Users must be able to distinguish:

* Critical findings.
* Errors.
* Warnings.
* Informational findings.

without relying only on color.

---

## NFR-USA-006 — No destructive defaults

Destructive or source-modifying actions must not be default behavior.

---

## NFR-USA-007 — Help availability

Every user-facing CLI command must provide useful help.

---

## NFR-USA-008 — Error guidance

Common user errors should include corrective guidance where practical.

---

## NFR-USA-009 — Progressive complexity

Simple workflows must not require users to understand advanced configuration.

Advanced users should still be able to customize rules and behavior.

---

## NFR-USA-010 — Documentation examples

User documentation must include realistic examples for primary workflows.

---

# 12. Accessibility Requirements

## NFR-ACC-001 — Do not rely on color alone

CLI and report output must not use color as the only means of communicating:

* Severity.
* Pass/fail status.
* Change classification.
* Quality-gate result.

---

## NFR-ACC-002 — Text-based operation

All core capabilities must be usable through text-based interfaces.

---

## NFR-ACC-003 — Machine-readable alternatives

Important report information should be available in machine-readable form.

---

## NFR-ACC-004 — Accessible documentation

Project documentation should use:

* Meaningful headings.
* Descriptive link text.
* Logical heading hierarchy.
* Clear tables.
* Alternative text for meaningful images and diagrams where applicable.

---

## NFR-ACC-005 — Terminal compatibility

Core CLI output should remain understandable when ANSI color support is disabled.

---

## NFR-ACC-006 — Plain-language error messages

User-facing errors should avoid unnecessary implementation jargon.

---

# 13. Observability Requirements

## NFR-OBS-001 — Structured diagnostic logging

OAIT should support structured diagnostic logging.

---

## NFR-OBS-002 — Configurable verbosity

Users must be able to select applicable logging levels.

Suggested levels include:

```text
error
warn
info
debug
```

---

## NFR-OBS-003 — No secrets in logs

Logs must not expose credentials or protected secrets.

---

## NFR-OBS-004 — Workflow identifiers

Complex workflows should provide sufficient identifiers to correlate processing stages within a single run.

---

## NFR-OBS-005 — Execution metadata

Diagnostic output should be capable of reporting:

* OAIT version.
* Command.
* OpenAPI version.
* Active ruleset.
* Processing duration.
* AI provider where applicable.

---

## NFR-OBS-006 — AI call visibility

When diagnostic mode is enabled, OAIT should make AI-call activity observable without exposing sensitive prompts, credentials, or unnecessary specification content.

Useful information may include:

* Provider.
* Model.
* Operation type.
* Retry count.
* Latency.
* Token usage when available.

---

## NFR-OBS-007 — Rule execution visibility

Debug mode should allow maintainers to determine:

* Which rules were loaded.
* Which rules were executed.
* Which rules were skipped.
* Why a rule was skipped.

---

# 14. Testability Requirements

## NFR-TST-001 — Automated unit testing

Core deterministic components must support automated unit tests.

---

## NFR-TST-002 — Integration testing

Primary workflows must have automated integration tests.

---

## NFR-TST-003 — End-to-end testing

Major user workflows should have end-to-end tests.

---

## NFR-TST-004 — Golden-file testing

Generated reports and deterministic transformations should use golden-file testing where this provides stable verification.

---

## NFR-TST-005 — Curated OpenAPI test corpus

The repository must contain or reference a curated test corpus covering:

* Valid specifications.
* Invalid specifications.
* Poorly documented specifications.
* Well-documented specifications.
* Multi-file specifications.
* Circular references.
* Version-specific cases.

---

## NFR-TST-006 — Change-analysis fixtures

When specification comparison is implemented, test data must include version pairs containing:

* Known breaking changes.
* Known nonbreaking changes.
* Documentation-only changes.
* Ambiguous changes.

---

## NFR-TST-007 — Contract Guard tests

The Contract Guard must have tests demonstrating detection of unauthorized changes to protected contract elements.

---

## NFR-TST-008 — Prompt-injection tests

AI-enabled releases must include test cases containing malicious or instruction-like text in OpenAPI content.

---

## NFR-TST-009 — Mockable AI provider

AI-dependent modules must support test doubles or mocked providers so that most automated tests do not require live model API calls.

---

## NFR-TST-010 — Test independence

Unit and deterministic integration tests must not depend on external AI-provider availability.

---

## NFR-TST-011 — Coverage visibility

The project should report automated test coverage.

Coverage targets may be established separately for individual packages.

---

## NFR-TST-012 — Regression testing

Confirmed defects should result in regression tests where technically practical.

---

# 15. AI Quality Requirements

## NFR-AIQ-001 — Evidence-grounded generation

AI-generated findings, improvements, and release-note content must be grounded in available specification evidence or explicitly classified as requiring review.

---

## NFR-AIQ-002 — No unsupported API behavior

The AI layer must not invent unsupported:

* Business rules.
* Parameter semantics.
* Enumeration meanings.
* Authentication behavior.
* Error conditions.
* Migration procedures.
* Contract details.

---

## NFR-AIQ-003 — Structured AI outputs

AI operations that feed downstream software processing must use defined structured output schemas where practical.

---

## NFR-AIQ-004 — Schema validation

Structured AI output must be validated before it is accepted by downstream components.

---

## NFR-AIQ-005 — Uncertainty handling

When insufficient evidence exists, the AI layer must prefer:

```text
SME_INPUT_REQUIRED
```

or:

```text
REVIEW_REQUIRED
```

over unsupported generation.

---

## NFR-AIQ-006 — AI evaluation suite

AI-enabled releases must include an evaluation suite covering applicable capabilities.

---

## NFR-AIQ-007 — Documentation-improvement evaluation

Enhancer evaluations should measure qualities such as:

* Accuracy.
* Clarity.
* Conciseness.
* Evidence support.
* Contract preservation.
* Unsupported-claim rate.

---

## NFR-AIQ-008 — Release-note evaluation

Release-note evaluations should measure:

* Change coverage.
* Traceability.
* Breaking-change accuracy.
* Unsupported claims.
* Developer usefulness.
* Migration-guidance accuracy.

---

## NFR-AIQ-009 — Hallucination tracking

The evaluation framework must include a measurable unsupported-claim or hallucination metric.

---

## NFR-AIQ-010 — Prompt-injection resistance

AI workflows must be evaluated against instruction-like or malicious content embedded in OpenAPI fields.

---

## NFR-AIQ-011 — Model-change evaluation

Before changing the default AI model or materially changing prompts, the project should run the relevant evaluation suite.

---

## NFR-AIQ-012 — Provider comparison

The evaluation architecture should permit comparison of multiple providers or models using the same evaluation dataset.

---

## NFR-AIQ-013 — Human-review dataset

Selected AI outputs should be reviewable through a curated human-evaluation process to validate automated scoring methods.

---

## NFR-AIQ-014 — AI cannot bypass deterministic validation

AI output must remain subject to applicable deterministic validation and contract-protection checks.

---

# 16. Reproducibility Requirements

## NFR-REP-001 — Deterministic score reproducibility

Given identical:

* Specification.
* OAIT version.
* Ruleset.
* Configuration.

deterministic scoring must produce identical results.

---

## NFR-REP-002 — Record relevant run metadata

Reports should identify sufficient metadata to reproduce deterministic results.

This may include:

* OAIT version.
* Ruleset version.
* Configuration.
* OpenAPI version.

---

## NFR-REP-003 — AI run metadata

AI-generated output should record applicable metadata such as:

* Provider.
* Model.
* Prompt/workflow version.
* Relevant AI configuration.

Secrets must not be recorded.

---

## NFR-REP-004 — Prompt versioning

Production AI prompts and workflow instructions should be version-controlled.

---

## NFR-REP-005 — Evaluation dataset versioning

AI evaluation datasets must be version-controlled.

---

## NFR-REP-006 — Ruleset versioning

Rulesets must be version-controlled.

---

## NFR-REP-007 — Non-deterministic AI disclosure

OAIT documentation must not imply that AI-generated prose is guaranteed to be byte-for-byte reproducible.

---

## NFR-REP-008 — Deterministic evidence preservation

The deterministic findings used as evidence for AI operations should be retained long enough within a workflow to support traceability.

---

# 17. Scalability Requirements

## NFR-SCL-001 — Operation-level processing

OAIT should support independent processing of API operations where appropriate.

---

## NFR-SCL-002 — Schema-level processing

OAIT should support independent processing of schemas where appropriate.

---

## NFR-SCL-003 — Large specification strategy

The architecture must not require every workflow to load the complete expanded specification into an AI model context.

---

## NFR-SCL-004 — Incremental analysis

Future versions should support analyzing only changed or selected specification areas.

---

## NFR-SCL-005 — Ruleset scalability

The rule engine must support growth from the initial rule set to a substantially larger catalog without requiring architectural replacement.

---

## NFR-SCL-006 — Multiple API specifications

The architecture should permit future batch analysis of multiple API specifications.

---

## NFR-SCL-007 — Parallel-safe deterministic processing

Independent deterministic analysis should be designed so it can be parallelized where useful without changing results.

---

## NFR-SCL-008 — Bounded resource usage

OAIT should prevent unbounded:

* Memory usage.
* Reference traversal.
* Retry loops.
* AI concurrency.
* Output generation.

---

## NFR-SCL-009 — AI budget controls

Future AI-enabled releases should support configurable limits for applicable resources such as:

* Maximum operations analyzed.
* Maximum concurrent calls.
* Maximum token budget.
* Maximum retry count.

---

# 18. Dependency Management Requirements

## NFR-DEP-001 — Minimize dependencies

OAIT should use third-party dependencies when they provide clear value, but unnecessary dependencies should be avoided.

---

## NFR-DEP-002 — Prefer maintained dependencies

Core dependencies should be actively maintained and suitable for production use.

---

## NFR-DEP-003 — License compatibility

Dependency licenses must be compatible with the OAIT project's open-source license and distribution model.

---

## NFR-DEP-004 — Dependency inventory

The project must maintain an accurate dependency inventory through the package-management system.

---

## NFR-DEP-005 — Automated vulnerability scanning

Dependencies must be checked automatically for known security vulnerabilities.

---

## NFR-DEP-006 — Automated update visibility

The project should use automated tooling to identify available dependency updates.

---

## NFR-DEP-007 — Controlled major upgrades

Major dependency upgrades must be reviewed for:

* Breaking changes.
* Security impact.
* Performance impact.
* OpenAPI compatibility.
* Test impact.

---

## NFR-DEP-008 — Pin reproducible dependency resolution

The repository must use an appropriate lockfile so that supported development and CI environments resolve consistent dependency versions.

---

## NFR-DEP-009 — Avoid unsupported packages

Dependencies that are unmaintained, deprecated, or have unresolved critical vulnerabilities should not remain in core product paths without documented justification.

---

## NFR-DEP-010 — Architecture isolation

Third-party OpenAPI libraries should be accessed through internal abstractions where practical when direct coupling would make replacement difficult.

---

## NFR-DEP-011 — Document significant dependencies

Major architectural dependencies should be documented in relevant ADRs.

---

# 19. Cross-Cutting Quality Requirements

## NFR-CROSS-001 — Deterministic and AI boundary

OAIT must preserve a clear architectural boundary between:

```text
Deterministic processing
```

and:

```text
AI-assisted interpretation
```

---

## NFR-CROSS-002 — Traceability

Significant user-visible results should be traceable to their originating:

* Rule.
* Source location.
* Detected change.
* AI workflow.
* Configuration where applicable.

---

## NFR-CROSS-003 — Safe defaults

Default configuration must favor:

* Source preservation.
* Contract protection.
* Local deterministic processing.
* Human review of uncertain AI output.
* Minimal external data transmission.

---

## NFR-CROSS-004 — Open-source readiness

Public releases must include sufficient documentation for an external contributor to:

* Install OAIT.
* Run tests.
* Understand repository structure.
* Submit an issue.
* Submit a pull request.

---

# 20. v0.1 Nonfunctional Scope

The v0.1 release primarily contains deterministic functionality.

The following areas are mandatory for v0.1:

```text
Performance
Reliability
Security
Privacy
Maintainability
Extensibility
Compatibility
Portability
Usability
Accessibility
Observability
Testability
Reproducibility
Dependency management
```

AI-specific requirements become mandatory when AI functionality is introduced in v0.2.

Scalability requirements should influence architecture from v0.1 even if all scalability features are not implemented immediately.

---

# 21. v0.1 Priority Requirements

The following nonfunctional requirements are considered particularly important for the v0.1 architecture:

```text
NFR-PERF-001
NFR-PERF-002

NFR-REL-001
NFR-REL-003
NFR-REL-008

NFR-SEC-001
NFR-SEC-003
NFR-SEC-005
NFR-SEC-008

NFR-PRV-001
NFR-PRV-004

NFR-MNT-001
NFR-MNT-003
NFR-MNT-004
NFR-MNT-006

NFR-EXT-001
NFR-EXT-002
NFR-EXT-008

NFR-COM-001
NFR-COM-002
NFR-COM-004

NFR-POR-001
NFR-POR-004

NFR-USA-001
NFR-USA-002
NFR-USA-005
NFR-USA-006

NFR-ACC-001
NFR-ACC-005

NFR-OBS-002
NFR-OBS-003

NFR-TST-001
NFR-TST-002
NFR-TST-005
NFR-TST-012

NFR-REP-001
NFR-REP-002
NFR-REP-006

NFR-DEP-002
NFR-DEP-003
NFR-DEP-005
NFR-DEP-008
```

---

# 22. Nonfunctional Verification Strategy

Nonfunctional requirements should be verified using one or more of the following methods.

| Requirement type      | Primary verification methods                              |
| --------------------- | --------------------------------------------------------- |
| Performance           | Benchmark, automated performance test                     |
| Reliability           | Integration test, fault-injection test                    |
| Security              | Static analysis, dependency scan, security test           |
| Privacy               | Configuration inspection, integration test, manual review |
| Maintainability       | Architecture review, code-quality checks                  |
| Extensibility         | Extension test, architecture review                       |
| Compatibility         | Compatibility test matrix                                 |
| Portability           | Cross-platform CI                                         |
| Usability             | CLI acceptance test, documentation review                 |
| Accessibility         | Manual review, automated documentation checks             |
| Observability         | Integration test                                          |
| Testability           | Test-suite inspection                                     |
| AI quality            | Evaluation suite, human evaluation                        |
| Reproducibility       | Repeat-run testing                                        |
| Scalability           | Load and benchmark tests                                  |
| Dependency management | Automated dependency analysis                             |

---

# 23. Suggested Quality Gates

The project should progressively establish automated quality gates.

## Source Quality Gate

```text
Formatting: PASS
Linting: PASS
Type checking: PASS
```

## Test Quality Gate

```text
Unit tests: PASS
Integration tests: PASS
Regression tests: PASS
```

## Security Quality Gate

```text
Critical dependency vulnerabilities: 0
Committed secrets: 0
```

## Compatibility Quality Gate

```text
Supported operating systems: PASS
Supported OpenAPI versions: PASS
```

## AI Quality Gate — v0.2+

```text
Structured output success: PASS
Contract violations: 0
Prompt-injection critical failures: 0
Unsupported claim rate: within approved threshold
```

Exact numerical thresholds will be defined as baseline data becomes available.

---

# 24. Open Nonfunctional Decisions

The following items require resolution during architecture and design:

1. What maximum specification size will v0.1 formally support?
2. What benchmark specifications will define small, medium, and large workloads?
3. Which Node.js versions will be supported?
4. Which operating-system versions will be included in CI testing?
5. Will remote `$ref` resolution be disabled by default?
6. Which protocols will be allowed for remote references?
7. What directory boundaries will apply to local references?
8. What logging library and structured-log format will be used?
9. What test-coverage targets will apply to core packages?
10. What performance-regression threshold will fail CI?
11. Which security scanners will run in GitHub Actions?
12. Will telemetry exist at all in the initial public releases?
13. How will AI prompts and evaluation datasets be versioned?
14. What AI quality thresholds must be achieved before v0.2 is released?
15. What unsupported-claim rate is acceptable for AI-generated content?
16. How will token and cost budgets be configured?
17. How will dependency license compatibility be checked automatically?
18. Which cross-platform environments must be tested before release?

---

# 25. Nonfunctional Requirements Definition of Done

This Nonfunctional Requirements Specification is considered baselined when:

* [ ] All required quality-attribute areas are documented.
* [ ] Mandatory requirements have stable identifiers.
* [ ] Requirements are measurable where practical.
* [ ] Requirements are consistent with the PRD and Functional Requirements Specification.
* [ ] v0.1 priorities are identified.
* [ ] AI-specific quality requirements are defined for future AI-enabled releases.
* [ ] Security and privacy requirements are documented.
* [ ] Verification approaches are identified.
* [ ] Open architecture decisions are documented.
* [ ] Requirements are suitable for use during architecture review.

---

# 26. Requirements Traceability

Nonfunctional requirements should eventually participate in the same traceability model as functional requirements.

```text
Nonfunctional Requirement
           ↓
Architecture Decision
           ↓
Architecture Component
           ↓
Implementation Control
           ↓
Verification Method
           ↓
Test / Evaluation
```

Example:

```text
NFR-AIQ-014
AI cannot bypass deterministic validation
           ↓
ADR: Hybrid deterministic + AI architecture
           ↓
AI Orchestrator + Validator
           ↓
Post-generation validation
           ↓
Integration test
```

---