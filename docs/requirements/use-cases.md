# OpenAPI Intelligence Toolkit (OAIT)

## Use Cases

**Document version:** 0.1
**Project status:** Planning
**Product status:** Proposed
**Related documents:** `PRD.md`, `functional-requirements.md`, `nonfunctional-requirements.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This document defines the primary end-to-end use cases for the **OpenAPI Intelligence Toolkit (OAIT)**.

The use cases describe how users and external systems interact with OAIT to:

* Validate an OpenAPI specification.
* Review an OpenAPI specification.
* Score an OpenAPI specification.
* Improve an OpenAPI specification.
* Compare two OpenAPI specification versions.
* Generate API release notes.
* Create an OpenAPI specification.

Each use case includes:

* Actors.
* Preconditions.
* Trigger.
* Inputs.
* Normal flow.
* Alternate flows.
* Exception flows.
* Postconditions.
* Outputs.
* Related functional requirements.

This document focuses on user-visible behavior and workflow. Detailed software design and implementation are outside the scope of this document.

---

# 2. Actors

## 2.1 Primary Actors

### Technical Writer

Uses OAIT to improve API reference documentation, identify documentation gaps, generate SME questions, compare API changes, and create developer-facing release notes.

### API Developer

Uses OAIT to validate, review, and score OpenAPI specifications and identify breaking changes before integration or release.

### API Architect

Uses OAIT to evaluate API quality, consistency, and governance compliance.

### Developer Experience Engineer

Uses OAIT to improve API usability, documentation quality, examples, and consistency.

### Documentation Lead

Uses OAIT to establish and apply documentation-quality requirements and scoring thresholds.

### API Governance Engineer

Uses OAIT to enforce API standards and quality gates.

### Open-Source Maintainer

Uses OAIT to review OpenAPI contributions, detect API changes, and generate release documentation.

---

## 2.2 Secondary Actors

### CI/CD Pipeline

Invokes OAIT noninteractively for validation, scoring, quality-gate evaluation, and future change analysis.

### AI Provider

Provides semantic analysis and natural-language generation for AI-assisted capabilities.

### File System

Provides source files and receives generated output artifacts.

### MCP Client

Invokes OAIT capabilities through MCP in a future release.

### Subject Matter Expert

Provides missing API information when OAIT identifies insufficient evidence.

---

# 3. Use Case Summary

| Use case   | Name                           | Primary actor                      | Primary outcome                                  |
| ---------- | ------------------------------ | ---------------------------------- | ------------------------------------------------ |
| UC-VAL-001 | Validate OpenAPI Specification | API Developer                      | Determine whether a specification is valid       |
| UC-REV-001 | Review OpenAPI Specification   | Technical Writer / API Developer   | Identify actionable quality findings             |
| UC-SCR-001 | Score OpenAPI Specification    | API Architect / Documentation Lead | Produce reproducible quality scores              |
| UC-ENH-001 | Improve OpenAPI Specification  | Technical Writer                   | Generate safe documentation improvements         |
| UC-DIF-001 | Compare OpenAPI Specifications | API Developer / API Architect      | Identify semantic API changes                    |
| UC-REL-001 | Generate API Release Notes     | Technical Writer                   | Produce developer-facing release-note drafts     |
| UC-CRE-001 | Create OpenAPI Specification   | API Developer / Technical Writer   | Generate a valid specification from requirements |

---

# 4. Common Preconditions

The following preconditions apply to multiple use cases unless otherwise specified:

1. OAIT is installed and available.
2. The user has permission to read the input files.
3. The user has permission to write to the selected output location.
4. Required configuration is valid.
5. The input file format is supported.
6. Required AI-provider configuration is available for AI-assisted workflows.
7. Required external services are reachable when applicable.

---

# 5. Common Postconditions

Unless a use case specifies otherwise:

* The original input specification remains unchanged.
* OAIT produces a clear success or failure status.
* Any generated artifact is written only to an explicitly selected or safe default output location.
* Errors are reported without corrupting source files.
* Machine-readable outputs remain structurally valid where applicable.

---

# 6. UC-VAL-001 — Validate OpenAPI Specification

## 6.1 Goal

Determine whether an OpenAPI specification conforms sufficiently to the supported OpenAPI version and can be safely processed by downstream OAIT workflows.

---

## 6.2 Primary Actor

API Developer

---

## 6.3 Secondary Actors

* Technical Writer.
* API Architect.
* CI/CD Pipeline.
* File System.

---

## 6.4 Preconditions

* OAIT is installed.
* The input file is accessible.
* The input is expected to contain an OpenAPI specification.
* The declared OpenAPI version is supported or can be identified as unsupported.

---

## 6.5 Trigger

The actor requests validation.

Example:

```bash
oait validate payment-api.yaml
```

---

## 6.6 Inputs

Required:

* OpenAPI YAML or JSON file.

Optional:

* Configuration file.
* Output format.
* Output file.
* Validation profile.
* Reference-resolution settings.

---

## 6.7 Normal Flow

1. The actor invokes the validation command.
2. OAIT verifies that the input file exists.
3. OAIT reads the input file.
4. OAIT determines whether the input is YAML or JSON.
5. OAIT parses the document.
6. OAIT identifies the declared OpenAPI version.
7. OAIT verifies that the version is supported.
8. OAIT resolves supported references required for validation.
9. OAIT validates the specification.
10. OAIT collects validation findings.
11. OAIT classifies each finding by severity.
12. OAIT determines the overall validation status.
13. OAIT generates the requested output.
14. OAIT returns an appropriate process exit code.

---

## 6.8 Expected Result

Example:

```text
OpenAPI Intelligence Toolkit

File: payment-api.yaml
OpenAPI version: 3.1.0

Validation: PASSED

Errors:   0
Warnings: 2
```

---

## 6.9 Alternate Flow A — Validation warnings

1. OAIT detects noncritical issues.
2. OAIT reports the issues as warnings.
3. Validation remains successful if configured rules permit.
4. Applicable downstream workflows may continue.

---

## 6.10 Alternate Flow B — Multi-file specification

1. The input specification contains local `$ref` references.
2. OAIT resolves permitted referenced files.
3. OAIT validates the combined logical specification.
4. Findings identify the originating file where practical.

---

## 6.11 Alternate Flow C — Remote reference

1. OAIT encounters a remote `$ref`.
2. OAIT checks remote-reference configuration.
3. If permitted, OAIT retrieves and processes the reference according to security controls.
4. If prohibited, OAIT reports the unresolved or blocked reference.

---

## 6.12 Exception Flow A — File not found

1. OAIT cannot locate the specified file.
2. OAIT reports `INPUT_ERROR`.
3. OAIT performs no validation.
4. OAIT returns a nonzero exit code.

---

## 6.13 Exception Flow B — Invalid YAML or JSON

1. OAIT cannot parse the input.
2. OAIT reports `PARSE_ERROR`.
3. OAIT identifies the location where practical.
4. The workflow stops.

---

## 6.14 Exception Flow C — Unsupported OpenAPI version

1. OAIT detects an unsupported version.
2. OAIT reports the unsupported version.
3. The workflow stops unless an explicitly supported compatibility mode exists.

---

## 6.15 Exception Flow D — Critical structural failure

1. OAIT determines that the specification cannot be safely processed.
2. OAIT reports `VALIDATION_ERROR`.
3. Dependent analysis is not performed.

---

## 6.16 Postconditions

* Validation status is available.
* Validation findings are available.
* The source file remains unchanged.
* Downstream workflows can determine whether analysis may continue.

---

## 6.17 Outputs

Possible outputs:

* Console.
* JSON.
* Markdown.

---

## 6.18 Related Requirements

```text
FR-INP-001
FR-INP-002
FR-INP-003
FR-PAR-001
FR-PAR-002
FR-PAR-003
FR-PAR-006
FR-PAR-007
FR-VAL-001
FR-VAL-002
FR-VAL-003
FR-VAL-004
FR-VAL-005
FR-VAL-006
FR-CLI-002
FR-RPT-001
FR-RPT-002
FR-RPT-003
```

---

# 7. UC-REV-001 — Review OpenAPI Specification

## 7.1 Goal

Evaluate an OpenAPI specification and identify actionable quality, documentation, consistency, schema, response, error, example, security, and governance findings.

---

## 7.2 Primary Actors

* Technical Writer.
* API Developer.

---

## 7.3 Secondary Actors

* API Architect.
* Documentation Lead.
* API Governance Engineer.
* AI Provider when AI-assisted review is enabled.

---

## 7.4 Preconditions

* The input OpenAPI specification is accessible.
* The specification can be parsed.
* Critical validation failures do not prevent review.
* The selected ruleset is valid.

For AI-assisted review:

* An AI provider is configured.
* The user has enabled or requested AI-assisted review.

---

## 7.5 Trigger

The actor requests a specification review.

Example:

```bash
oait review payment-api.yaml
```

---

## 7.6 Inputs

Required:

* OpenAPI specification.

Optional:

* Ruleset.
* Configuration.
* Severity overrides.
* AI-assisted review setting.
* Output format.
* Output path.

---

## 7.7 Normal Flow

1. The actor invokes the review workflow.
2. OAIT reads and parses the specification.
3. OAIT detects the OpenAPI version.
4. OAIT validates the specification.
5. OAIT loads the selected ruleset.
6. OAIT determines which rules apply to the specification version.
7. OAIT executes deterministic review rules.
8. OAIT collects deterministic findings.
9. If AI-assisted review is enabled, OAIT identifies candidate content requiring semantic review.
10. OAIT selects the minimum relevant specification context.
11. OAIT sends the approved context to the configured AI provider.
12. OAIT validates the structured AI response.
13. OAIT rejects unsupported or malformed AI findings.
14. OAIT combines deterministic and approved AI-assisted findings.
15. OAIT identifies each finding's detection method.
16. OAIT groups findings by severity and category.
17. OAIT generates the review report.
18. OAIT returns the result.

---

## 7.8 Example Finding

```text
OAIT-DOC-005

Severity: Warning
Category: Documentation
Detection: Deterministic

Location:
$.paths./customers/{customerId}.get.parameters[0].description

Finding:
Parameter description repeats the parameter name.

Current value:
Customer ID

Recommendation:
Explain what the identifier represents and how API consumers use it.
```

---

## 7.9 Alternate Flow A — Deterministic review only

1. The actor does not enable AI analysis.
2. OAIT executes deterministic rules only.
3. The report identifies that AI-assisted semantic review was not performed.

---

## 7.10 Alternate Flow B — Rule disabled

1. The active configuration disables a rule.
2. OAIT skips that rule.
3. Diagnostic mode may identify the rule as skipped.
4. The skipped rule does not affect findings or score.

---

## 7.11 Alternate Flow C — Version-specific rule

1. A rule does not apply to the detected OpenAPI version.
2. OAIT does not execute the rule.
3. The rule is marked as not applicable where diagnostic output is enabled.

---

## 7.12 Alternate Flow D — AI provider unavailable

1. Deterministic review completes successfully.
2. AI-assisted review fails because the provider is unavailable.
3. OAIT reports the AI failure.
4. Deterministic findings remain available.
5. OAIT does not present the partial review as a complete AI-assisted review.

---

## 7.13 Exception Flow A — Invalid ruleset

1. OAIT cannot load or validate the requested ruleset.
2. OAIT reports `CONFIGURATION_ERROR` or `RULE_ERROR`.
3. The review does not continue with an unknown ruleset.

---

## 7.14 Exception Flow B — Malformed AI response

1. The provider returns output that does not conform to the required schema.
2. OAIT rejects the malformed result.
3. OAIT may perform a bounded retry.
4. If unsuccessful, OAIT reports `AI_OUTPUT_ERROR`.
5. Deterministic review results remain available.

---

## 7.15 Postconditions

* A set of actionable review findings exists.
* Each finding has a stable rule ID.
* Findings identify source locations where possible.
* AI-assisted findings are distinguishable from deterministic findings.
* The source specification remains unchanged.

---

## 7.16 Outputs

* Console report.
* JSON report.
* Markdown report.

---

## 7.17 Related Requirements

```text
FR-RUL-001 through FR-RUL-011
FR-REV-001 through FR-REV-014
FR-AI-001 through FR-AI-011
FR-RPT-001
FR-RPT-002
FR-RPT-003
FR-RPT-006
```

---

# 8. UC-SCR-001 — Score OpenAPI Specification

## 8.1 Goal

Produce a reproducible quality score and determine whether the OpenAPI specification meets configured quality thresholds.

---

## 8.2 Primary Actors

* API Architect.
* Documentation Lead.
* API Governance Engineer.

---

## 8.3 Secondary Actors

* API Developer.
* Technical Writer.
* CI/CD Pipeline.

---

## 8.4 Preconditions

* The specification can be parsed and analyzed.
* The scoring ruleset is available.
* Score weights and thresholds are valid.

---

## 8.5 Trigger

The actor requests scoring.

Example:

```bash
oait score payment-api.yaml
```

---

## 8.6 Inputs

Required:

* OpenAPI specification.

Optional:

* Ruleset.
* Category weights.
* Rule weights.
* Minimum overall score.
* Category thresholds.
* Mandatory quality gates.
* Output format.

---

## 8.7 Normal Flow

1. The actor invokes the scoring command.
2. OAIT validates and parses the specification.
3. OAIT loads the configured scoring rules.
4. OAIT executes applicable deterministic rules.
5. OAIT calculates category-level compliance.
6. OAIT applies rule and category weights.
7. OAIT calculates the normalized overall score.
8. OAIT evaluates configured category thresholds.
9. OAIT evaluates mandatory quality gates.
10. OAIT determines the overall pass/fail result.
11. OAIT records the findings that affected scoring.
12. OAIT generates the score report.
13. OAIT returns the appropriate exit code.

---

## 8.8 Example Output

```text
OpenAPI Quality Score

Overall: 84/100

Specification conformance     100
Documentation quality          72
API completeness               88
Schema quality                 91
Responses and errors           79
Consistency                    87
Examples                       63
Lifecycle and governance       90

Quality gate: FAILED

Reason:
Documentation quality minimum: 80
Actual: 72
```

---

## 8.9 Alternate Flow A — No custom threshold

1. The actor does not specify a threshold.
2. OAIT calculates and reports scores.
3. OAIT uses default quality-gate behavior.

---

## 8.10 Alternate Flow B — Critical gate fails

1. Overall score exceeds the configured threshold.
2. A mandatory critical rule fails.
3. OAIT marks the quality gate as failed.
4. OAIT identifies the gate-causing finding.

---

## 8.11 Alternate Flow C — CI/CD execution

1. A pipeline invokes OAIT noninteractively.
2. OAIT calculates the score.
3. The score is below the configured threshold.
4. OAIT returns a nonzero exit code.
5. The pipeline can block the change.

---

## 8.12 Exception Flow — Invalid scoring configuration

1. Category weights or thresholds are invalid.
2. OAIT reports `CONFIGURATION_ERROR`.
3. OAIT does not calculate a misleading score.

---

## 8.13 Postconditions

* Overall score exists.
* Category scores exist.
* Score-affecting findings are traceable.
* Quality-gate result exists.
* The score can be reproduced using the same input and configuration.

---

## 8.14 Related Requirements

```text
FR-SCR-001 through FR-SCR-011
FR-CFG-003 through FR-CFG-006
FR-CICD-001 through FR-CICD-004
FR-RPT-007
FR-RPT-008
```

---

# 9. UC-ENH-001 — Improve OpenAPI Specification

## 9.1 Goal

Improve eligible OpenAPI documentation content without changing protected API contract elements.

---

## 9.2 Primary Actor

Technical Writer

---

## 9.3 Secondary Actors

* API Developer.
* Documentation Lead.
* AI Provider.
* Subject Matter Expert.
* File System.

---

## 9.4 Preconditions

* The OpenAPI specification can be parsed.
* The specification has been reviewed or can be reviewed as part of the workflow.
* An AI provider is configured.
* Contract Guard is enabled.
* The user has write permission for any requested generated output.

---

## 9.5 Trigger

The actor requests improvement.

Example:

```bash
oait improve payment-api.yaml
```

---

## 9.6 Inputs

Required:

* OpenAPI specification.

Optional:

* Review findings.
* Ruleset.
* Improvement mode.
* Output path.
* Style profile.
* Selected fields or operations.
* Approval policy.

---

## 9.7 Normal Flow

1. The actor invokes the improvement workflow.
2. OAIT parses and validates the source specification.
3. OAIT reviews the specification or loads existing findings.
4. OAIT identifies findings eligible for improvement.
5. OAIT separates:

   * deterministic fixes,
   * AI-assisted fixes,
   * items requiring SME input.
6. OAIT captures the protected API contract state.
7. OAIT selects relevant context for each AI-assisted improvement.
8. OAIT requests structured improvement suggestions from the AI provider.
9. OAIT validates each AI response.
10. OAIT verifies that each suggestion is grounded in available evidence.
11. OAIT classifies suggestions as:

    * `SAFE_TO_APPLY`,
    * `REVIEW_REQUIRED`,
    * `SME_INPUT_REQUIRED`,
    * `REJECTED`.
12. OAIT presents or records proposed improvements.
13. Depending on mode, OAIT:

    * returns suggestions only,
    * generates an Overlay,
    * or generates an enhanced specification.
14. If changes are applied, OAIT invokes Contract Guard.
15. OAIT compares the pre-change and post-change contract states.
16. OAIT rejects output containing unauthorized contract changes.
17. OAIT validates the enhanced specification.
18. OAIT optionally rescores the specification.
19. OAIT generates an enhancement report.

---

## 9.8 Example

Original:

```yaml
customerId:
  type: string
  description: Customer ID
```

Suggested:

```yaml
customerId:
  type: string
  description: Unique identifier of the customer to retrieve.
```

Result:

```text
Status: SAFE_TO_APPLY
Contract change: No
Confidence: High
```

---

## 9.9 Alternate Flow A — Suggest-only mode

1. OAIT generates suggestions.
2. OAIT does not write an enhanced specification.
3. The user reviews suggestions manually.

---

## 9.10 Alternate Flow B — Overlay mode

1. The user selects Overlay output.
2. OAIT converts approved improvements into an OpenAPI Overlay.
3. The original specification remains unchanged.
4. The Overlay is validated for target applicability where possible.

---

## 9.11 Alternate Flow C — SME information required

1. OAIT identifies insufficient evidence.
2. OAIT does not invent the missing information.
3. OAIT marks the finding `SME_INPUT_REQUIRED`.
4. OAIT generates a focused SME question.
5. The improvement remains unapplied.

---

## 9.12 Alternate Flow D — User selects specific findings

1. The actor selects only certain findings for improvement.
2. OAIT processes only the selected findings.
3. Unselected findings remain unchanged.

---

## 9.13 Exception Flow A — Contract violation detected

1. AI-generated output changes a protected contract field.
2. Contract Guard detects the change.
3. OAIT rejects the unsafe output.
4. OAIT reports the affected field and before/after values.
5. The original source remains unchanged.

---

## 9.14 Exception Flow B — AI provider failure

1. The AI provider fails.
2. OAIT retains deterministic review results.
3. No unsafe partial enhancement is silently applied.
4. OAIT reports the AI failure.

---

## 9.15 Postconditions

* Eligible improvements are available.
* Unsupported information is not invented.
* Contract modifications are prevented.
* Generated output is validated.
* The source remains unchanged unless explicit overwrite behavior is supported and requested.

---

## 9.16 Related Requirements

```text
FR-ENH-001 through FR-ENH-017
FR-CGU-001 through FR-CGU-011
FR-OVL-001 through FR-OVL-005
FR-AI-001 through FR-AI-014
FR-SME-001 through FR-SME-005
```

---

# 10. UC-DIF-001 — Compare OpenAPI Specifications

## 10.1 Goal

Identify meaningful semantic differences between a previous and current OpenAPI specification.

---

## 10.2 Primary Actors

* API Developer.
* API Architect.

---

## 10.3 Secondary Actors

* Technical Writer.
* CI/CD Pipeline.

---

## 10.4 Preconditions

* Both specifications are accessible.
* Both can be parsed sufficiently for comparison.
* Supported version-comparison rules exist.

---

## 10.5 Trigger

The actor requests comparison.

Example:

```bash
oait diff openapi-v1.yaml openapi-v2.yaml
```

---

## 10.6 Inputs

Required:

* Previous OpenAPI specification.
* Current OpenAPI specification.

Optional:

* Comparison ruleset.
* Output format.
* Output path.
* Change filtering.

---

## 10.7 Normal Flow

1. OAIT reads both specifications.
2. OAIT parses both documents.
3. OAIT detects their OpenAPI versions.
4. OAIT validates both specifications.
5. OAIT resolves required references.
6. OAIT normalizes both specifications.
7. OAIT identifies structural and semantic differences.
8. OAIT ignores formatting-only differences.
9. OAIT creates normalized change records.
10. OAIT classifies each change.
11. OAIT identifies breaking and potentially breaking changes.
12. OAIT associates each change with source locations.
13. OAIT generates the comparison report.

---

## 10.8 Detected Change Examples

OAIT may detect:

```text
Endpoint added
Endpoint removed
Operation added
Operation removed
Parameter added
Parameter removed
Parameter made required
Parameter made optional
Schema type changed
Property added
Property removed
Enum value added
Enum value removed
Response status added
Response status removed
Security requirement changed
Deprecation added
Documentation changed
```

---

## 10.9 Alternate Flow A — Documentation-only change

1. OAIT detects only summary, description, or similar documentation metadata changes.
2. The change is classified as `DOCUMENTATION_ONLY`.
3. The change does not appear as a contract-breaking change.

---

## 10.10 Alternate Flow B — Potentially breaking change

1. OAIT detects a change whose impact cannot be determined conclusively.
2. The change is classified as `POTENTIALLY_BREAKING`.
3. The reason for uncertainty is reported.

---

## 10.11 Alternate Flow C — Different supported OpenAPI versions

1. The two documents use different supported OpenAPI versions.
2. OAIT normalizes comparable semantics where possible.
3. Version-specific limitations are reported.

---

## 10.12 Exception Flow A — Previous specification invalid

1. The baseline specification cannot be safely interpreted.
2. OAIT reports the validation failure.
3. Comparison stops unless a safe partial-comparison mode exists.

---

## 10.13 Exception Flow B — Current specification invalid

The same behavior applies to the current specification.

---

## 10.14 Postconditions

* A structured set of semantic changes exists.
* Each change has a classification.
* Breaking changes are identified.
* Formatting-only differences are excluded.
* Changes are traceable to source locations.

---

## 10.15 Related Requirements

```text
FR-DIF-001 through FR-DIF-016
FR-CHG-001 through FR-CHG-008
```

---

# 11. UC-REL-001 — Generate API Release Notes

## 11.1 Goal

Transform verified OpenAPI specification changes into a structured, developer-facing release-note draft.

---

## 11.2 Primary Actor

Technical Writer

---

## 11.3 Secondary Actors

* API Developer.
* Product Manager.
* AI Provider.
* Subject Matter Expert.

---

## 11.4 Preconditions

* A previous and current specification are available.
* OAIT can generate a reliable comparison.
* Detected changes are available.
* An AI provider is configured for natural-language generation.

---

## 11.5 Trigger

The actor requests release notes.

Example:

```bash
oait release-notes openapi-v1.yaml openapi-v2.yaml
```

---

## 11.6 Inputs

Required:

* Previous specification.
* Current specification.

Optional:

* Release version.
* Release date.
* Release-note template.
* Categories to include.
* Audience profile.
* Style profile.
* Output path.

---

## 11.7 Normal Flow

1. OAIT validates both specifications.
2. OAIT compares the specifications.
3. OAIT generates verified change records.
4. OAIT classifies changes.
5. OAIT groups changes into release-note categories.
6. OAIT selects the evidence relevant to each change.
7. OAIT sends structured change data, rather than raw unrelated specification content, to the AI provider.
8. The AI provider generates draft release-note entries.
9. OAIT validates the structured response.
10. OAIT verifies that each release-note item maps to at least one detected change.
11. OAIT rejects unsupported claims.
12. OAIT generates developer-impact explanations where evidence supports them.
13. OAIT generates migration guidance when the required action can be derived safely.
14. OAIT marks uncertain guidance for review or SME input.
15. OAIT produces the final draft report.

---

## 11.8 Example

Detected change:

```text
POST /orders
customerId

Previous: optional
Current: required

Classification: BREAKING
```

Generated draft:

```markdown
### Customer identifier is now required when creating an order

The `customerId` property is now required in requests to `POST /orders`.

Applications that previously omitted `customerId` must include the property before adopting this API version.
```

---

## 11.9 Alternate Flow A — No changes found

1. OAIT compares both specifications.
2. No meaningful changes are detected.
3. OAIT reports that no release-note entries were generated.

---

## 11.10 Alternate Flow B — Documentation-only changes

1. Only documentation metadata changed.
2. OAIT may place these entries in a Documentation category.
3. They are not presented as API contract changes.

---

## 11.11 Alternate Flow C — Migration guidance uncertain

1. A breaking change is verified.
2. OAIT cannot determine a safe migration action.
3. OAIT does not invent guidance.
4. OAIT marks the entry `SME_INPUT_REQUIRED` or `REVIEW_REQUIRED`.

---

## 11.12 Exception Flow A — Unsupported AI statement

1. The AI response contains a claim not supported by detected changes.
2. OAIT rejects or removes the statement.
3. The unsupported content is not included as verified release-note content.

---

## 11.13 Exception Flow B — AI provider unavailable

1. Change analysis completes.
2. Natural-language generation fails.
3. OAIT returns the structured change report.
4. OAIT reports that release-note prose could not be generated.

---

## 11.14 Postconditions

* Release-note entries are traceable to verified changes.
* Breaking changes are clearly distinguished.
* Unsupported claims are excluded.
* Uncertain migration guidance is flagged.
* The output is ready for technical review.

---

## 11.15 Outputs

Required:

* Markdown.

Optional:

* JSON structured release-note representation.

---

## 11.16 Related Requirements

```text
FR-DIF-001 through FR-DIF-016
FR-CHG-001 through FR-CHG-008
FR-REL-001 through FR-REL-010
FR-AI-001 through FR-AI-014
FR-SME-001 through FR-SME-005
```

---

# 12. UC-CRE-001 — Create OpenAPI Specification

## 12.1 Goal

Generate an OpenAPI specification from sufficiently detailed source requirements without inventing unsupported API contract details.

---

## 12.2 Primary Actors

* API Developer.
* Technical Writer.

---

## 12.3 Secondary Actors

* API Architect.
* Subject Matter Expert.
* AI Provider.

---

## 12.4 Preconditions

* The source requirement document is accessible.
* The source format is supported.
* An AI provider is configured.
* The target OpenAPI version is supported.

---

## 12.5 Trigger

The actor requests specification creation.

Example:

```bash
oait create requirements.md
```

---

## 12.6 Inputs

Required:

* Requirements or approved source information.

Optional:

* Target OpenAPI version.
* Output format.
* Output path.
* API title.
* Version.
* Server information.
* Style or governance profile.

---

## 12.7 Normal Flow

1. The actor invokes the Create workflow.
2. OAIT reads the source requirements.
3. OAIT separates the requirement text from trusted workflow instructions.
4. OAIT sends relevant requirement content to the AI provider.
5. The AI provider extracts structured API requirements.
6. OAIT validates the extracted structure.
7. OAIT identifies explicitly supported contract information.
8. OAIT identifies missing information required for generation.
9. If required information is available, OAIT constructs an initial OpenAPI specification.
10. OAIT validates the generated specification.
11. OAIT reviews the generated specification.
12. OAIT scores the generated specification.
13. OAIT produces the specification and generation report.

---

## 12.8 Alternate Flow A — Missing information

1. OAIT identifies required information that cannot be derived safely.
2. OAIT does not invent the missing contract details.
3. OAIT generates focused SME questions.
4. Specification generation may continue only for safely supported sections.
5. Incomplete sections are clearly identified.

---

## 12.9 Alternate Flow B — Incremental creation

1. The source describes only part of an API.
2. OAIT creates only the supported operations or schemas.
3. Missing areas are reported.
4. The output remains valid where possible.

---

## 12.10 Alternate Flow C — Existing partial OpenAPI specification

A future workflow may allow the actor to provide:

* requirements,
* plus an existing partial OpenAPI specification.

OAIT may then extend supported sections while preserving existing contract elements.

---

## 12.11 Exception Flow A — Contradictory requirements

1. OAIT identifies conflicting source requirements.
2. OAIT does not choose one interpretation silently.
3. OAIT marks the issue for clarification.
4. OAIT generates an SME question.

---

## 12.12 Exception Flow B — Generated specification invalid

1. The generated document fails deterministic validation.
2. OAIT identifies correctable structural issues.
3. OAIT may attempt a bounded correction loop.
4. OAIT revalidates the corrected result.
5. If validation still fails, OAIT reports the failure and does not present the specification as production-ready.

---

## 12.13 Exception Flow C — Unsupported contract invention

1. AI output contains fields not supported by the source requirements.
2. Evidence validation identifies the unsupported fields.
3. OAIT removes, rejects, or marks those fields for review.
4. Unsupported content is not silently accepted.

---

## 12.14 Postconditions

* A generated OpenAPI specification exists where sufficient requirements were available.
* The generated document has been validated.
* Missing information is explicitly identified.
* Unsupported API behavior has not been silently invented.
* A generation report is available.
* SME questions are available when needed.

---

## 12.15 Outputs

Potential outputs:

```text
openapi.yaml
generation-report.md
sme-questions.md
review-report.md
score-report.json
```

---

## 12.16 Related Requirements

```text
FR-CRE-001 through FR-CRE-011
FR-AI-001 through FR-AI-014
FR-SME-001 through FR-SME-005
FR-VAL-001 through FR-VAL-006
FR-REV-001 through FR-REV-014
FR-SCR-001 through FR-SCR-011
```

---

# 13. Cross-Use-Case Flow

The core OAIT capabilities are intentionally composable.

The complete lifecycle can be represented as:

```text
Requirements
    │
    ▼
CREATE
    │
    ▼
OpenAPI specification
    │
    ▼
VALIDATE
    │
    ▼
REVIEW
    │
    ▼
SCORE
    │
    ▼
IMPROVE
    │
    ▼
Validate again
    │
    ▼
Rescore
    │
    ▼
Release baseline
```

At the next API version:

```text
Previous specification
        +
Current specification
        │
        ▼
COMPARE
        │
        ▼
Classify changes
        │
        ▼
Generate release notes
```

---

# 14. Human-in-the-Loop Flow

AI-assisted workflows must support human control.

```text
Issue detected
     │
     ▼
Can deterministic logic fix it?
     │
 ┌───┴────┐
 │        │
Yes       No
 │        │
 ▼        ▼
Fix    AI suggestion
          │
          ▼
   Evidence sufficient?
       │        │
      Yes       No
       │        │
       ▼        ▼
 Safe/Review   SME Input
       │
       ▼
 Human approval
       │
       ▼
 Apply change
       │
       ▼
 Validate
       │
       ▼
 Contract Guard
```

---

# 15. Use Case Priorities by Release

| Use case               |          v0.1 |        v0.2 | v0.3 | v0.4 | v0.5+ |
| ---------------------- | ------------: | ----------: | ---: | ---: | ----: |
| Validate               |          Full |        Full | Full | Full |  Full |
| Review                 | Deterministic | AI-assisted | Full | Full |  Full |
| Score                  |          Full |        Full | Full | Full |  Full |
| Improve                |             — |        Full | Full | Full |  Full |
| Compare                |             — |           — | Full | Full |  Full |
| Generate Release Notes |             — |           — | Full | Full |  Full |
| Create OpenAPI         |             — |           — |    — | Full |  Full |

---

# 16. Use Case Acceptance Summary

## UC-VAL-001

Successful when:

* A valid specification is recognized.
* Invalid specifications produce actionable findings.
* Critical validation failures prevent unsafe downstream processing.

---

## UC-REV-001

Successful when:

* Applicable quality issues are detected.
* Findings are traceable.
* Deterministic and AI findings are distinguishable.
* Unsupported API behavior is not asserted.

---

## UC-SCR-001

Successful when:

* The score is deterministic.
* Category scores are available.
* Quality gates are evaluated consistently.
* Score deductions are explainable.

---

## UC-ENH-001

Successful when:

* Documentation improvements are useful.
* Unsupported information is not invented.
* Protected API contract elements remain unchanged.
* Enhanced output is validated.

---

## UC-DIF-001

Successful when:

* Meaningful semantic changes are detected.
* Formatting-only differences are ignored.
* Breaking changes are classified consistently.
* Changes remain traceable to source locations.

---

## UC-REL-001

Successful when:

* Release-note entries correspond to verified changes.
* Breaking changes are clearly communicated.
* Unsupported claims are excluded.
* Uncertain migration guidance is flagged.

---

## UC-CRE-001

Successful when:

* The specification reflects source requirements.
* Generated OpenAPI is valid.
* Unsupported behavior is not invented.
* Missing requirements are surfaced as SME questions.

---

# 17. Traceability Matrix

| Use case   | Functional requirement groups          | Key nonfunctional requirement groups        |
| ---------- | -------------------------------------- | ------------------------------------------- |
| UC-VAL-001 | `FR-INP`, `FR-PAR`, `FR-VAL`           | `NFR-PERF`, `NFR-REL`, `NFR-SEC`, `NFR-COM` |
| UC-REV-001 | `FR-RUL`, `FR-REV`, `FR-AI`            | `NFR-AIQ`, `NFR-TST`, `NFR-REP`             |
| UC-SCR-001 | `FR-SCR`, `FR-CFG`, `FR-CICD`          | `NFR-REP`, `NFR-REL`, `NFR-TST`             |
| UC-ENH-001 | `FR-ENH`, `FR-CGU`, `FR-OVL`, `FR-SME` | `NFR-AIQ`, `NFR-SEC`, `NFR-PRV`             |
| UC-DIF-001 | `FR-DIF`, `FR-CHG`                     | `NFR-PERF`, `NFR-REP`, `NFR-TST`            |
| UC-REL-001 | `FR-REL`, `FR-AI`, `FR-SME`            | `NFR-AIQ`, `NFR-REP`, `NFR-USA`             |
| UC-CRE-001 | `FR-CRE`, `FR-AI`, `FR-SME`            | `NFR-AIQ`, `NFR-SEC`, `NFR-PRV`             |

---

# 18. Open Use-Case Decisions

The following workflow decisions remain open:

1. Should `oait review` automatically include scoring, or should scoring remain an independent command by default?
2. Should `oait improve` automatically run a review first if no review report is supplied?
3. Should Overlay generation be the default improvement mode?
4. Should the user approve each improvement individually, by category, or as a batch?
5. How should interactive approval work in CLI mode?
6. How should noninteractive approval work in CI/CD?
7. Should Release Notes generation include documentation-only changes by default?
8. Which change categories should appear in release notes by default?
9. How should user-provided release metadata such as version and release date be supplied?
10. Should Create OpenAPI support interactive SME clarification in the initial implementation?
11. How should partial OpenAPI generation be represented when requirements are incomplete?
12. Should OAIT support saved review artifacts as input to subsequent workflows?
13. What artifact schema should connect Review, Score, Improve, Compare, and Release Notes?
14. Should `oait diff` and `oait release-notes` support Git references directly in a future release?
15. How should operation-level filtering be represented in CLI syntax?

---

# 19. Use Case Definition of Done

This use-case specification is considered baselined when:

* [ ] All seven primary product workflows are documented.
* [ ] Each use case has a stable identifier.
* [ ] Actors are defined.
* [ ] Preconditions are defined.
* [ ] Normal flows are documented.
* [ ] Alternate flows are documented.
* [ ] Exception flows are documented.
* [ ] Postconditions are documented.
* [ ] Functional requirements are traceable to use cases.
* [ ] Release priorities are identified.
* [ ] Open workflow decisions are documented.
* [ ] The use cases are suitable for deriving user stories and acceptance tests.

---