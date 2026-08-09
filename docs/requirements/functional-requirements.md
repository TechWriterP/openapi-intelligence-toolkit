# OpenAPI Intelligence Toolkit (OAIT)

## Functional Requirements Specification

**Document version:** 0.1
**Project status:** Planning
**Product status:** Proposed
**Related document:** `PRD.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This Functional Requirements Specification defines the functional requirements for the **OpenAPI Intelligence Toolkit (OAIT)**.

The requirements in this document describe what OAIT must do from a product and system-behavior perspective.

This document establishes traceable requirements for:

* OpenAPI input processing.
* Specification validation.
* Rules-based analysis.
* Specification review.
* Quality scoring.
* AI-assisted improvement.
* API contract protection.
* OpenAPI Overlay generation.
* Specification comparison.
* Breaking-change detection.
* API release-note generation.
* OpenAPI creation.
* Configuration.
* Reporting.
* Command-line usage.
* AI integration.
* MCP integration.
* CI/CD integration.

Detailed implementation decisions are outside the scope of this document and will be defined during the architecture and design phase.

---

# 2. Requirement Conventions

## 2.1 Requirement Keywords

The following keywords are used:

* **Must** — Mandatory requirement.
* **Should** — Recommended requirement that may be deferred when justified.
* **May** — Optional capability.

---

## 2.2 Requirement Identifier Format

Functional requirements use the following identifier structure:

```text
FR-<AREA>-<NUMBER>
```

Examples:

```text
FR-INP-001
FR-VAL-001
FR-REV-001
FR-SCR-001
```

---

## 2.3 Functional Requirement Areas

| Prefix    | Requirement area          |
| --------- | ------------------------- |
| `FR-INP`  | Input processing          |
| `FR-PAR`  | Parsing and normalization |
| `FR-VAL`  | Validation                |
| `FR-RUL`  | Rule framework            |
| `FR-REV`  | OpenAPI Reviewer          |
| `FR-SCR`  | OpenAPI Scorer            |
| `FR-ENH`  | OpenAPI Enhancer          |
| `FR-CGU`  | Contract Guard            |
| `FR-OVL`  | OpenAPI Overlay           |
| `FR-DIF`  | Specification comparison  |
| `FR-CHG`  | Change classification     |
| `FR-REL`  | Release Notes Generator   |
| `FR-CRE`  | OpenAPI Creator           |
| `FR-AI`   | AI capabilities           |
| `FR-SME`  | SME escalation            |
| `FR-CFG`  | Configuration             |
| `FR-CLI`  | Command-line interface    |
| `FR-RPT`  | Reporting                 |
| `FR-MCP`  | MCP integration           |
| `FR-CICD` | CI/CD integration         |
| `FR-ERR`  | Error handling            |

---

# 3. OpenAPI Input Processing

## FR-INP-001 — Accept OpenAPI YAML

OAIT must accept an OpenAPI specification provided in YAML format.

### Acceptance criteria

* A valid YAML file can be supplied as input.
* OAIT reads the file successfully.
* OAIT proceeds to parsing when the file is readable.

---

## FR-INP-002 — Accept OpenAPI JSON

OAIT must accept an OpenAPI specification provided in JSON format.

### Acceptance criteria

* A valid JSON file can be supplied as input.
* OAIT reads the file successfully.
* OAIT proceeds to parsing when the file is readable.

---

## FR-INP-003 — Detect unreadable input

OAIT must detect when an input file cannot be read.

The system must report:

* File path.
* Error category.
* Human-readable error message.

---

## FR-INP-004 — Detect unsupported input format

OAIT must reject unsupported input formats for workflows that require an OpenAPI specification.

---

## FR-INP-005 — Preserve the source file

OAIT must not overwrite an input OpenAPI specification unless the user explicitly requests an output operation that replaces the file.

---

## FR-INP-006 — Support multi-file specifications

OAIT should support OpenAPI specifications distributed across multiple local files through references.

---

## FR-INP-007 — Handle remote references

OAIT must define explicit behavior for remote `$ref` references.

The user must be informed whether remote resolution is:

* Enabled.
* Disabled.
* Restricted by configuration.

---

# 4. Parsing and Normalization

## FR-PAR-001 — Parse OpenAPI documents

OAIT must parse supported OpenAPI YAML and JSON documents into an internal representation.

---

## FR-PAR-002 — Detect OpenAPI version

OAIT must identify the OpenAPI version declared in the specification.

Example:

```yaml
openapi: 3.1.0
```

The detected version must be available to downstream components.

---

## FR-PAR-003 — Reject unsupported versions

OAIT must report an actionable error when the specification uses an unsupported OpenAPI version.

---

## FR-PAR-004 — Normalize specifications

OAIT must provide a normalized internal representation that allows downstream analysis to operate consistently across supported OpenAPI versions where specification semantics permit.

---

## FR-PAR-005 — Preserve source locations

Where technically practical, OAIT must retain sufficient location information to associate findings with the corresponding source location.

The location may include:

* JSONPath.
* JSON Pointer.
* File path.
* Line and column information when supported.

---

## FR-PAR-006 — Resolve references

OAIT must resolve supported `$ref` references when analysis requires the referenced content.

---

## FR-PAR-007 — Detect unresolved references

OAIT must identify unresolved `$ref` references and report them as findings or validation errors.

---

## FR-PAR-008 — Prevent infinite reference resolution

OAIT must detect or safely handle circular references.

---

# 5. Specification Validation

## FR-VAL-001 — Validate OpenAPI conformance

OAIT must validate an input specification against the applicable supported OpenAPI requirements.

---

## FR-VAL-002 — Report validation result

OAIT must return a validation status.

Supported statuses must include at least:

```text
PASSED
FAILED
```

---

## FR-VAL-003 — Report validation findings

Each validation finding should contain:

* Error identifier or category.
* Severity.
* Specification location.
* Human-readable description.
* Relevant technical details where available.

---

## FR-VAL-004 — Block incompatible workflows

When a specification contains critical structural errors that prevent safe analysis, OAIT must prevent dependent workflows from continuing.

---

## FR-VAL-005 — Allow noncritical findings

OAIT may continue applicable workflows when validation findings are noncritical and the specification can be safely analyzed.

---

## FR-VAL-006 — Support standalone validation

Users must be able to run validation without running review, scoring, or AI workflows.

Example:

```bash
oait validate openapi.yaml
```

---

# 6. Rule Framework

## FR-RUL-001 — Support stable rule identifiers

Each OAIT rule must have a stable identifier.

Example:

```text
OAIT-DOC-001
```

---

## FR-RUL-002 — Support rule categories

Each rule must belong to a defined category.

Initial categories must support:

```text
Conformance
Documentation
Operations
Schemas
Responses
Errors
Examples
Security
Governance
Changes
```

---

## FR-RUL-003 — Support severity

A rule must support a severity classification.

Initial severity values should include:

```text
INFO
WARNING
ERROR
CRITICAL
```

---

## FR-RUL-004 — Support deterministic rules

The rule framework must support rules evaluated without an LLM.

---

## FR-RUL-005 — Support AI-assisted rules

The rule framework must support rules that require semantic AI analysis.

---

## FR-RUL-006 — Identify detection method

Rule metadata must indicate whether detection is:

```text
deterministic
ai-assisted
hybrid
```

---

## FR-RUL-007 — Enable and disable rules

Users must be able to enable or disable configurable rules.

---

## FR-RUL-008 — Configure rule severity

Users should be able to override the default severity of configurable rules.

---

## FR-RUL-009 — Configure score impact

Rules used for scoring must support configurable score impact or weighting.

---

## FR-RUL-010 — Register custom rules

The architecture must allow additional rules to be registered without modifying unrelated core components.

---

## FR-RUL-011 — Provide rule metadata

Each rule must expose sufficient metadata for documentation and reporting.

The metadata should include:

* ID.
* Name.
* Description.
* Category.
* Severity.
* Detection type.
* Score impact.
* Applicable OpenAPI versions.
* Autofix capability.
* Documentation reference.

---

# 7. OpenAPI Reviewer

## FR-REV-001 — Review a specification

OAIT must provide a workflow that reviews a supported OpenAPI specification.

Example:

```bash
oait review openapi.yaml
```

---

## FR-REV-002 — Review documentation completeness

The Reviewer must detect applicable missing documentation, including:

* Operation summaries.
* Operation descriptions.
* Parameter descriptions.
* Request-body descriptions.
* Response descriptions.
* Schema descriptions.
* Property descriptions.
* Tag descriptions.

---

## FR-REV-003 — Review documentation quality

The Reviewer should identify applicable documentation-quality issues, including:

* Vague descriptions.
* Descriptions that repeat field names.
* Generic response descriptions.
* Inconsistent terminology.
* Unclear operation summaries.
* Redundant content.
* Potentially ambiguous descriptions.

---

## FR-REV-004 — Review operations

The Reviewer must evaluate applicable operation-level requirements.

---

## FR-REV-005 — Review parameters

The Reviewer must evaluate applicable parameter requirements.

---

## FR-REV-006 — Review schemas

The Reviewer must evaluate applicable schema and property requirements.

---

## FR-REV-007 — Review responses

The Reviewer must evaluate applicable response documentation and structure requirements.

---

## FR-REV-008 — Review error documentation

The Reviewer must evaluate applicable error-response documentation requirements.

---

## FR-REV-009 — Review examples

The Reviewer must identify missing or inadequate examples when required by the active ruleset.

---

## FR-REV-010 — Review security declarations

The Reviewer must evaluate supported rules related to declared security schemes and security requirements.

---

## FR-REV-011 — Review consistency

The Reviewer must identify applicable consistency issues across the specification.

Examples include:

* Naming inconsistencies.
* Terminology inconsistencies.
* Inconsistent descriptions.
* Inconsistent operation patterns.

---

## FR-REV-012 — Produce findings

Each review finding must include:

* Rule ID.
* Title.
* Category.
* Severity.
* Location.
* Description.

Where applicable, findings should also include:

* Evidence.
* Why the issue matters.
* Recommendation.
* Autofix eligibility.
* SME requirement.

---

## FR-REV-013 — Distinguish deterministic and AI findings

The Reviewer must clearly identify whether a finding was produced through:

* Deterministic analysis.
* AI-assisted analysis.
* Hybrid analysis.

---

## FR-REV-014 — Avoid unsupported semantic findings

AI-assisted review findings must not assert undocumented API behavior as fact.

---

# 8. OpenAPI Scorer

## FR-SCR-001 — Calculate an overall quality score

OAIT must calculate an overall specification quality score.

The default score must use a defined normalized range.

The initial recommended range is:

```text
0–100
```

---

## FR-SCR-002 — Calculate category scores

OAIT must calculate scores for configured quality categories.

---

## FR-SCR-003 — Use deterministic score calculation

The numeric score must be calculated from deterministic inputs such as:

* Rule results.
* Weights.
* Severity.
* Category weighting.
* Quality-gate configuration.

The LLM must not directly select the final numeric score.

---

## FR-SCR-004 — Produce repeatable scores

The same specification, configuration, and deterministic rule results must produce the same score.

---

## FR-SCR-005 — Explain score deductions

Users must be able to identify which findings affected the score.

---

## FR-SCR-006 — Support configurable category weights

The scoring framework should support configurable category weights.

---

## FR-SCR-007 — Support quality thresholds

Users must be able to configure a minimum acceptable overall score.

Example:

```text
minimumScore: 85
```

---

## FR-SCR-008 — Support category thresholds

The scoring framework should support minimum scores for individual categories.

---

## FR-SCR-009 — Support mandatory quality gates

OAIT must support rules that cause a quality-gate failure independently of the overall score.

---

## FR-SCR-010 — Report quality-gate status

The Scorer must report:

```text
PASSED
FAILED
```

for applicable quality gates.

---

## FR-SCR-011 — Support standalone scoring

Users must be able to score a specification without invoking the Enhancer.

Example:

```bash
oait score openapi.yaml
```

---

# 9. OpenAPI Enhancer

## FR-ENH-001 — Generate documentation improvements

OAIT must support generating suggested improvements for eligible documentation fields.

---

## FR-ENH-002 — Improve operation summaries

The Enhancer should be able to improve operation summaries when sufficient context exists.

---

## FR-ENH-003 — Improve operation descriptions

The Enhancer should be able to improve operation descriptions when sufficient context exists.

---

## FR-ENH-004 — Improve parameter descriptions

The Enhancer should be able to improve parameter descriptions without inventing unsupported constraints or behavior.

---

## FR-ENH-005 — Improve schema descriptions

The Enhancer should be able to improve schema descriptions when evidence is sufficient.

---

## FR-ENH-006 — Improve property descriptions

The Enhancer should be able to improve schema-property descriptions when evidence is sufficient.

---

## FR-ENH-007 — Improve response descriptions

The Enhancer should improve response descriptions only to the extent supported by specification evidence.

---

## FR-ENH-008 — Improve tag descriptions

The Enhancer should support improvement of tag descriptions.

---

## FR-ENH-009 — Generate examples conditionally

The Enhancer may generate examples when the schema and available evidence are sufficient to produce a safe example.

---

## FR-ENH-010 — Classify improvements

Each proposed improvement must receive one of the following statuses:

```text
SAFE_TO_APPLY
REVIEW_REQUIRED
SME_INPUT_REQUIRED
REJECTED
```

---

## FR-ENH-011 — Preserve current value

Enhancement output must provide the original value when an existing field is being changed.

---

## FR-ENH-012 — Provide suggested value

Enhancement output must provide the proposed replacement or addition.

---

## FR-ENH-013 — Explain the improvement

Where practical, OAIT should provide the reason for an improvement.

---

## FR-ENH-014 — Suggest-only mode

The Enhancer must support a mode that does not modify source files.

---

## FR-ENH-015 — Apply approved changes

The Enhancer should support applying approved changes to a generated output artifact.

---

## FR-ENH-016 — Revalidate enhanced output

Any generated OpenAPI document must be validated after changes are applied.

---

## FR-ENH-017 — Rescore enhanced output

The product should support rescoring an enhanced specification.

---

# 10. Contract Guard

## FR-CGU-001 — Identify protected contract elements

OAIT must maintain a defined set of protected API contract elements for documentation-only enhancement workflows.

---

## FR-CGU-002 — Capture pre-enhancement contract state

The Contract Guard must derive a normalized representation of protected contract elements before AI-generated changes are applied.

---

## FR-CGU-003 — Capture post-enhancement contract state

The Contract Guard must derive the equivalent protected representation after generated changes are applied.

---

## FR-CGU-004 — Compare contract states

The Contract Guard must compare pre-enhancement and post-enhancement contract representations.

---

## FR-CGU-005 — Detect unauthorized contract changes

The Contract Guard must detect modifications to protected fields.

---

## FR-CGU-006 — Reject unsafe output

When an unauthorized contract change is detected, OAIT must not silently accept the generated specification.

---

## FR-CGU-007 — Report changed contract elements

A Contract Guard failure must identify the affected specification locations and, where practical, the before and after values.

---

## FR-CGU-008 — Protect status codes

Documentation-improvement workflows must not change response status codes.

---

## FR-CGU-009 — Protect schema types

Documentation-improvement workflows must not change schema data types.

---

## FR-CGU-010 — Protect required constraints

Documentation-improvement workflows must not change required-property or required-parameter semantics.

---

## FR-CGU-011 — Protect security requirements

Documentation-improvement workflows must not alter security requirements.

---

# 11. OpenAPI Overlay

## FR-OVL-001 — Generate Overlay output

OAIT should support generating documentation improvements as an OpenAPI Overlay.

---

## FR-OVL-002 — Preserve source specification

Overlay generation must not require modification of the original OpenAPI source.

---

## FR-OVL-003 — Represent approved documentation changes

The generated Overlay should contain only changes included in the approved enhancement set.

---

## FR-OVL-004 — Validate Overlay applicability

OAIT should verify that the generated Overlay targets valid locations in the source specification.

---

## FR-OVL-005 — Apply Overlay

OAIT should support applying a generated Overlay to produce an enhanced OpenAPI output.

---

# 12. Specification Comparison

## FR-DIF-001 — Accept two OpenAPI specifications

The comparison workflow must accept:

* Previous specification.
* Current specification.

---

## FR-DIF-002 — Validate both specifications

OAIT must validate both specifications before semantic comparison when required for reliable analysis.

---

## FR-DIF-003 — Normalize before comparison

OAIT must normalize supported specifications before semantic comparison to reduce irrelevant representation differences.

---

## FR-DIF-004 — Detect added paths

OAIT must detect added API paths.

---

## FR-DIF-005 — Detect removed paths

OAIT must detect removed API paths.

---

## FR-DIF-006 — Detect added operations

OAIT must detect added HTTP operations.

---

## FR-DIF-007 — Detect removed operations

OAIT must detect removed HTTP operations.

---

## FR-DIF-008 — Detect parameter changes

OAIT must detect supported changes to parameters, including:

* Addition.
* Removal.
* Required-state changes.
* Type changes.
* Constraint changes.

---

## FR-DIF-009 — Detect request-body changes

OAIT must detect supported request-body changes.

---

## FR-DIF-010 — Detect response changes

OAIT must detect supported response changes.

---

## FR-DIF-011 — Detect schema changes

OAIT must detect supported schema and property changes.

---

## FR-DIF-012 — Detect enum changes

OAIT must identify supported changes to enumeration values.

---

## FR-DIF-013 — Detect security changes

OAIT must identify supported changes to security definitions or requirements.

---

## FR-DIF-014 — Detect deprecation changes

OAIT must identify supported changes to deprecation metadata.

---

## FR-DIF-015 — Detect documentation-only changes

OAIT should distinguish documentation-only changes from contract changes.

---

## FR-DIF-016 — Ignore nonsemantic formatting differences

The comparison engine should not report differences caused only by formatting, indentation, or YAML-versus-JSON representation.

---

# 13. Change Classification

## FR-CHG-001 — Classify detected changes

Each detected change must receive a classification.

Initial classifications must support:

```text
BREAKING
POTENTIALLY_BREAKING
NONBREAKING
DOCUMENTATION_ONLY
UNCLASSIFIED
```

---

## FR-CHG-002 — Use deterministic breaking-change rules

Where formal rules are available, breaking-change classification must be deterministic.

---

## FR-CHG-003 — Identify removed operations as breaking

Removal of an existing operation must be classified as breaking unless an applicable configured policy defines otherwise.

---

## FR-CHG-004 — Identify newly required request data

A change that makes previously optional request data required must be classified as breaking where applicable.

---

## FR-CHG-005 — Identify incompatible type changes

Supported incompatible request or response schema type changes must be classified as breaking or potentially breaking according to defined rules.

---

## FR-CHG-006 — Identify additive operations as nonbreaking

Addition of a new independent operation should normally be classified as nonbreaking.

---

## FR-CHG-007 — Explain classifications

The output must explain why a change received its classification.

---

## FR-CHG-008 — Trace classification to source changes

Each classification must be traceable to the relevant specification locations.

---

# 14. Release Notes Generator

## FR-REL-001 — Generate release notes from verified changes

OAIT must generate API release-note drafts from the output of the Change Analyzer.

---

## FR-REL-002 — Prevent unsupported release-note items

The Release Notes Generator must not create an API change that was not identified or supported by comparison evidence.

---

## FR-REL-003 — Group changes by category

Release notes should support categories such as:

* Breaking changes.
* New APIs.
* Changed operations.
* Deprecations.
* Request changes.
* Response changes.
* Schema changes.
* Authentication changes.
* Error changes.
* Documentation changes.

---

## FR-REL-004 — Explain breaking changes

Breaking-change entries should explain the developer impact when sufficient evidence exists.

---

## FR-REL-005 — Generate migration guidance conditionally

OAIT should generate migration guidance only when the required action is supported by evidence.

---

## FR-REL-006 — Flag uncertain migration guidance

When safe migration guidance cannot be determined, OAIT must flag the item for human or SME review.

---

## FR-REL-007 — Provide source traceability

Each release-note item should be traceable to one or more detected changes.

---

## FR-REL-008 — Generate Markdown

The Release Notes Generator must support Markdown output.

---

## FR-REL-009 — Generate structured output

The Release Notes Generator should support machine-readable structured output, such as JSON.

---

## FR-REL-010 — Support release-note filtering

Users should eventually be able to filter generated release notes by change category or severity.

---

# 15. OpenAPI Creator

## FR-CRE-001 — Create an OpenAPI specification

OAIT must eventually support creating an OpenAPI specification from supported source information.

---

## FR-CRE-002 — Accept requirement input

The Creator must accept supported requirements input.

Initial or future formats may include:

* Markdown.
* Plain text.
* Structured JSON.
* Structured YAML.

---

## FR-CRE-003 — Extract explicit requirements

The Creator must distinguish explicitly provided API requirements from inferred information.

---

## FR-CRE-004 — Detect missing required information

The Creator must identify information required for specification generation that is missing from the source material.

---

## FR-CRE-005 — Generate SME questions

The Creator must be able to generate focused questions for missing API information.

---

## FR-CRE-006 — Avoid invented contract details

The Creator must not invent unsupported:

* HTTP methods.
* Status codes.
* Authentication methods.
* Parameters.
* Constraints.
* Schema properties.
* Enumeration values.
* Error conditions.

---

## FR-CRE-007 — Generate valid OpenAPI structure

Generated specifications must follow the applicable supported OpenAPI structure.

---

## FR-CRE-008 — Validate generated specifications

The Creator must invoke validation after generation.

---

## FR-CRE-009 — Review generated specifications

The Creator should invoke applicable review rules after generation.

---

## FR-CRE-010 — Score generated specifications

The Creator should support scoring the resulting specification.

---

## FR-CRE-011 — Preserve evidence attribution

Where practical, generated elements should retain internal traceability to the source requirement that caused their generation.

---

# 16. AI Functional Requirements

## FR-AI-001 — Use a provider abstraction

AI-dependent capabilities must invoke the AI system through an abstraction layer rather than directly coupling all product modules to one provider.

---

## FR-AI-002 — Support structured AI output

AI operations must use structured output schemas where practical.

---

## FR-AI-003 — Validate AI output structure

OAIT must validate structured AI output before using it.

---

## FR-AI-004 — Separate instructions from source content

OAIT must distinguish trusted workflow instructions from untrusted OpenAPI content.

---

## FR-AI-005 — Treat OpenAPI text as data

Text contained in descriptions, examples, and other OpenAPI fields must not be treated as executable agent instructions.

---

## FR-AI-006 — Provide relevant context only

AI workflows should receive only the specification context required for the task where practical.

---

## FR-AI-007 — Include evidence references

AI-assisted recommendations should identify supporting specification locations when applicable.

---

## FR-AI-008 — Distinguish inference

AI-generated conclusions that involve interpretation must not be represented as deterministic facts without evidence.

---

## FR-AI-009 — Support confidence metadata

AI output may contain confidence metadata.

Confidence values must not replace validation or evidence.

---

## FR-AI-010 — Reject malformed AI responses

OAIT must safely handle AI responses that do not conform to the expected structure.

---

## FR-AI-011 — Support AI-disabled operation

Deterministic functionality such as validation and deterministic scoring must remain usable without configuring an AI provider.

---

## FR-AI-012 — Do not expose provider secrets

AI-provider credentials must not appear in generated reports or normal console output.

---

# 17. SME Escalation

## FR-SME-001 — Identify insufficient evidence

OAIT must detect applicable cases where the available specification information is insufficient to safely produce content.

---

## FR-SME-002 — Mark SME-required items

Such cases must receive:

```text
SME_INPUT_REQUIRED
```

or an equivalent stable status.

---

## FR-SME-003 — Generate focused SME questions

OAIT should generate a specific question describing what information is required.

---

## FR-SME-004 — Identify affected location

An SME question must identify the specification element that requires clarification.

---

## FR-SME-005 — Avoid speculative answers

OAIT must not generate an answer to an SME question unless supporting information is available.

---

# 18. Configuration

## FR-CFG-001 — Support project configuration

OAIT should support project-level configuration through a configuration file.

---

## FR-CFG-002 — Load default configuration

OAIT must provide usable defaults when optional configuration is absent.

---

## FR-CFG-003 — Configure ruleset

Users must be able to select a supported ruleset.

---

## FR-CFG-004 — Configure quality threshold

Users must be able to configure an overall minimum score.

---

## FR-CFG-005 — Configure category thresholds

Users should be able to configure minimum category scores.

---

## FR-CFG-006 — Configure rule severity

Users should be able to override supported rule severities.

---

## FR-CFG-007 — Configure AI provider

AI-enabled workflows must support configuration of the selected provider.

---

## FR-CFG-008 — Configure output behavior

Users should be able to configure applicable output preferences.

---

## FR-CFG-009 — Configure enhancement mode

The Enhancer should support configurable modes such as:

```text
suggest
overlay
write
```

---

## FR-CFG-010 — Validate configuration

OAIT must validate configuration before executing workflows that depend on it.

---

## FR-CFG-011 — Report invalid configuration

Configuration errors must identify the invalid setting and expected form where practical.

---

# 19. Command-Line Interface

## FR-CLI-001 — Provide CLI entry point

OAIT must provide an executable CLI command.

Recommended command:

```text
oait
```

---

## FR-CLI-002 — Provide validation command

```bash
oait validate <spec>
```

---

## FR-CLI-003 — Provide review command

```bash
oait review <spec>
```

---

## FR-CLI-004 — Provide scoring command

```bash
oait score <spec>
```

---

## FR-CLI-005 — Provide improvement command

A later release must support:

```bash
oait improve <spec>
```

---

## FR-CLI-006 — Provide comparison command

A later release must support:

```bash
oait diff <previous> <current>
```

---

## FR-CLI-007 — Provide release-note command

A later release must support:

```bash
oait release-notes <previous> <current>
```

---

## FR-CLI-008 — Provide creation command

A later release must support:

```bash
oait create <requirements>
```

---

## FR-CLI-009 — Provide help

The CLI must provide command help.

Example:

```bash
oait --help
```

---

## FR-CLI-010 — Provide version information

The CLI must expose the installed OAIT version.

---

## FR-CLI-011 — Support output-file selection

Commands that generate artifacts should allow the user to specify an output path.

---

## FR-CLI-012 — Support output-format selection

Applicable commands should allow supported output format selection.

---

## FR-CLI-013 — Return meaningful exit codes

The CLI must return nonzero exit codes for applicable failure conditions.

---

## FR-CLI-014 — Support CI-friendly operation

CLI commands must be executable noninteractively where applicable.

---

# 20. Reporting

## FR-RPT-001 — Produce console reports

The initial release must support human-readable console output.

---

## FR-RPT-002 — Produce JSON reports

The initial release must support JSON output for applicable review and scoring workflows.

---

## FR-RPT-003 — Produce Markdown reports

The initial release must support Markdown output for applicable reports.

---

## FR-RPT-004 — Support stable report schema

Machine-readable report formats should use documented, versioned structures.

---

## FR-RPT-005 — Include run metadata

Reports should include relevant metadata such as:

* OAIT version.
* Analysis timestamp.
* OpenAPI version.
* Ruleset.
* Configuration profile.
* AI provider where applicable.

---

## FR-RPT-006 — Include finding counts

Review reports should summarize findings by severity and category.

---

## FR-RPT-007 — Include score breakdown

Scoring reports must include category scores and overall score.

---

## FR-RPT-008 — Include quality-gate result

Applicable reports must include quality-gate status.

---

## FR-RPT-009 — Support SARIF later

A future release should support SARIF output for integration with code-review and security/developer tooling.

---

# 21. MCP Functional Requirements

## FR-MCP-001 — Provide MCP server

A later release must expose selected OAIT capabilities through an MCP server.

---

## FR-MCP-002 — Expose validation tool

The MCP server should expose OpenAPI validation.

---

## FR-MCP-003 — Expose review tool

The MCP server should expose OpenAPI review.

---

## FR-MCP-004 — Expose scoring tool

The MCP server should expose OpenAPI scoring.

---

## FR-MCP-005 — Expose improvement tool

The MCP server should expose documentation improvement.

---

## FR-MCP-006 — Expose comparison tool

The MCP server should expose specification comparison.

---

## FR-MCP-007 — Expose release-note generation

The MCP server should expose API release-note generation.

---

## FR-MCP-008 — Expose creation capability

The MCP server may expose OpenAPI creation when that workflow reaches sufficient maturity.

---

## FR-MCP-009 — Reuse core components

The MCP implementation must invoke shared OAIT packages rather than duplicate analysis logic.

---

# 22. CI/CD Functional Requirements

## FR-CICD-001 — Support noninteractive scoring

OAIT must allow scoring from CI/CD environments without user interaction.

---

## FR-CICD-002 — Fail below score threshold

Users should be able to configure the CLI to return a failure exit code when the score is below a required threshold.

Example:

```bash
oait score openapi.yaml --fail-under 85
```

---

## FR-CICD-003 — Fail mandatory quality gates

The CLI must be capable of returning failure when a mandatory quality gate fails.

---

## FR-CICD-004 — Generate machine-readable results

CI workflows must be able to receive machine-readable results.

---

## FR-CICD-005 — Support changed-spec workflows

A later release should allow CI/CD pipelines to compare a proposed specification against a baseline specification.

---

## FR-CICD-006 — Support release-note artifacts

A later CI/CD workflow may generate a release-note draft from specification changes.

---

# 23. Error Handling

## FR-ERR-001 — Classify system errors

OAIT should classify errors using defined categories.

Initial categories should include:

```text
INPUT_ERROR
PARSE_ERROR
VALIDATION_ERROR
CONFIGURATION_ERROR
RULE_ERROR
AI_PROVIDER_ERROR
AI_OUTPUT_ERROR
CONTRACT_PROTECTION_ERROR
OUTPUT_ERROR
INTERNAL_ERROR
```

---

## FR-ERR-002 — Provide actionable error messages

Error messages should explain what failed and, where possible, how the user can correct the problem.

---

## FR-ERR-003 — Avoid stack traces by default

Normal user-facing CLI operation should not expose raw internal stack traces unless debug output is explicitly requested.

---

## FR-ERR-004 — Support diagnostic mode

The CLI should provide a diagnostic or verbose mode suitable for troubleshooting.

---

## FR-ERR-005 — Preserve source artifacts on failure

Failed processing must not corrupt the user's source specification.

---

# 24. Functional Traceability by Product Capability

| Product capability | Primary requirement groups                      |
| ------------------ | ----------------------------------------------- |
| Validate           | `FR-INP`, `FR-PAR`, `FR-VAL`                    |
| Review             | `FR-RUL`, `FR-REV`, `FR-AI`                     |
| Score              | `FR-RUL`, `FR-SCR`                              |
| Improve            | `FR-ENH`, `FR-CGU`, `FR-OVL`, `FR-AI`, `FR-SME` |
| Compare            | `FR-DIF`, `FR-CHG`                              |
| Release notes      | `FR-REL`, `FR-AI`                               |
| Create             | `FR-CRE`, `FR-AI`, `FR-SME`                     |
| Configure          | `FR-CFG`                                        |
| CLI                | `FR-CLI`                                        |
| Report             | `FR-RPT`                                        |
| MCP                | `FR-MCP`                                        |
| CI/CD              | `FR-CICD`                                       |

---

# 25. v0.1 Functional Scope

The v0.1 release will focus on deterministic OpenAPI assessment.

## 25.1 Included

The following requirement groups are in scope for v0.1:

```text
FR-INP
FR-PAR
FR-VAL
FR-RUL
FR-REV — deterministic subset
FR-SCR
FR-CFG — initial subset
FR-CLI — validation, review, score
FR-RPT
FR-ERR
FR-CICD — basic quality-gate support
```

---

## 25.2 Excluded from v0.1

The following capabilities are planned for later releases:

```text
FR-ENH
FR-CGU
FR-OVL
FR-DIF
FR-CHG
FR-REL
FR-CRE
FR-AI
FR-SME
FR-MCP
```

Some interfaces for these components may be considered during architecture design, but complete functionality is not required for v0.1.

---

# 26. v0.1 Mandatory Functional Requirements

At minimum, v0.1 must satisfy the following requirements:

```text
FR-INP-001
FR-INP-002
FR-INP-003
FR-INP-005

FR-PAR-001
FR-PAR-002
FR-PAR-003
FR-PAR-005
FR-PAR-006
FR-PAR-007

FR-VAL-001
FR-VAL-002
FR-VAL-003
FR-VAL-004
FR-VAL-006

FR-RUL-001
FR-RUL-002
FR-RUL-003
FR-RUL-004
FR-RUL-006
FR-RUL-011

FR-REV-001
FR-REV-002
FR-REV-004
FR-REV-005
FR-REV-006
FR-REV-007
FR-REV-008
FR-REV-012
FR-REV-013

FR-SCR-001
FR-SCR-002
FR-SCR-003
FR-SCR-004
FR-SCR-005
FR-SCR-007
FR-SCR-009
FR-SCR-010
FR-SCR-011

FR-CFG-002
FR-CFG-003
FR-CFG-004
FR-CFG-010
FR-CFG-011

FR-CLI-001
FR-CLI-002
FR-CLI-003
FR-CLI-004
FR-CLI-009
FR-CLI-010
FR-CLI-013
FR-CLI-014

FR-RPT-001
FR-RPT-002
FR-RPT-003
FR-RPT-006
FR-RPT-007
FR-RPT-008

FR-ERR-001
FR-ERR-002
FR-ERR-005

FR-CICD-001
FR-CICD-002
FR-CICD-003
FR-CICD-004
```

---

# 27. Example v0.1 End-to-End Workflow

A developer runs:

```bash
oait review payment-api.yaml
```

OAIT performs:

```text
Read file
   ↓
Parse YAML
   ↓
Detect OpenAPI version
   ↓
Resolve supported references
   ↓
Validate specification
   ↓
Load ruleset
   ↓
Execute deterministic rules
   ↓
Generate findings
   ↓
Calculate category scores
   ↓
Calculate overall score
   ↓
Evaluate quality gates
   ↓
Generate report
```

Example output:

```text
OpenAPI Intelligence Toolkit

File: payment-api.yaml
OpenAPI: 3.1.0

Review completed

Overall score: 82/100
Quality gate: PASSED

Findings

Critical: 0
Errors:   2
Warnings: 11
Info:     4

Category scores

Conformance:        100
Documentation:       67
Completeness:        84
Schemas:             91
Responses and errors:76
Consistency:         88
Examples:            54
Governance:          90

Top findings

OAIT-DOC-001
Missing operation summary
GET /payments/{paymentId}

OAIT-RSP-002
Generic response description
POST /payments
201 response

OAIT-EXA-001
Response example missing
GET /payments/{paymentId}
200 response
```

---

# 28. Requirements Verification Strategy

Each requirement must eventually map to one or more verification methods.

Supported methods may include:

| Verification method | Description                                      |
| ------------------- | ------------------------------------------------ |
| Unit test           | Verify isolated component behavior               |
| Integration test    | Verify interaction between components            |
| End-to-end test     | Verify complete workflow                         |
| Golden-file test    | Compare generated output against approved output |
| Contract test       | Verify interface/schema behavior                 |
| AI evaluation       | Assess AI-generated output quality               |
| Manual inspection   | Used only where automation is not practical      |

A future requirements traceability matrix should map:

```text
Requirement
    ↓
Architecture component
    ↓
Implementation issue
    ↓
Test case
    ↓
Release
```

---

# 29. Open Functional Decisions

The following functional questions remain unresolved:

1. Which OpenAPI 3.x versions must v0.1 officially support?
2. Will v0.1 support remote `$ref` resolution?
3. Should remote `$ref` resolution be disabled by default for security reasons?
4. Which deterministic review rules must be included in the initial default ruleset?
5. What exact formula will normalize rule deductions into a 0–100 score?
6. Which findings will automatically fail a quality gate?
7. Should scoring begin from 100 and deduct points, or calculate weighted category compliance?
8. Should rule definitions be stored primarily in YAML, TypeScript, or a hybrid representation?
9. What configuration filename will OAIT use?
10. What JSON schema will define the machine-readable report?
11. What exit-code conventions will be used?
12. How will multi-file specifications be represented in findings?
13. How should line-number reporting work after `$ref` resolution?
14. Which requirements belong to v0.1 versus v0.1.x?
15. Which third-party OpenAPI validation capabilities should be reused rather than implemented internally?

These decisions should be resolved before or during architecture design.

---

# 30. Functional Requirements Definition of Done

This Functional Requirements Specification is considered baselined when:

* [ ] All v0.1 product capabilities have corresponding functional requirements.
* [ ] Each mandatory requirement has a stable identifier.
* [ ] Each requirement describes observable system behavior.
* [ ] Requirements do not prescribe unnecessary implementation details.
* [ ] v0.1 requirements are clearly separated from future requirements.
* [ ] Requirements are consistent with the PRD.
* [ ] Open functional decisions have been documented.
* [ ] Requirements can be mapped to verification methods.
* [ ] Requirements are ready for architecture analysis.

---