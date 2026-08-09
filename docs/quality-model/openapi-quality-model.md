# OpenAPI Intelligence Toolkit (OAIT)

## OpenAPI Quality Model

**Document version:** 0.1
**Project status:** Planning
**Release applicability:** v0.1 and later
**Related documents:** `PRD.md`, `functional-requirements.md`, `nonfunctional-requirements.md`, `use-cases.md`, `user-stories.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This document defines the **OpenAPI Quality Model** used by the OpenAPI Intelligence Toolkit (OAIT) to evaluate the quality of OpenAPI specifications.

The quality model establishes:

* What OAIT considers a high-quality OpenAPI specification.
* Quality dimensions and categories.
* Rule classifications.
* Severity levels.
* Scoring principles.
* Category weights.
* Score calculation.
* Quality thresholds.
* Mandatory quality gates.
* Rule applicability.
* Treatment of not-applicable rules.
* Treatment of duplicate or overlapping findings.
* Evidence and traceability requirements.
* Quality profiles.
* Requirements for deterministic and future AI-assisted quality assessment.

The model is intended to make OAIT quality assessments:

* Transparent.
* Reproducible.
* Explainable.
* Configurable.
* Extensible.
* Suitable for CI/CD enforcement.

---

# 2. Quality Model Objective

OAIT must answer two different questions.

### Question 1 — What quality issues exist?

This is answered by the **Reviewer**.

Example:

```text
OAIT-DOC-001

GET /customers/{customerId}

Operation summary is missing.
```

### Question 2 — What is the overall quality of this specification?

This is answered by the **Scorer**.

Example:

```text
Overall quality score: 82/100

Documentation quality: 68/100
Schema quality:        91/100
Consistency:           87/100
```

The Reviewer and Scorer therefore use the same underlying rule results but serve different purposes.

```text
OpenAPI specification
        │
        ▼
    Rule engine
        │
        ▼
      Findings
       │     │
       │     └──────────► Reviewer
       │                   │
       │                   ▼
       │              Detailed findings
       │
       └────────────────► Scorer
                           │
                           ▼
                    Quality assessment
```

---

# 3. Definition of OpenAPI Quality

For OAIT, OpenAPI quality is defined as:

> **The degree to which an OpenAPI specification is structurally conformant, complete, understandable, consistent, accurate in its declared contract, useful to API consumers, and suitable for automated tooling and governance.**

Quality is therefore broader than specification validity.

A specification can be technically valid while still being poorly documented.

For example:

```yaml
paths:
  /customers/{id}:
    get:
      responses:
        "200":
          description: OK
```

This specification fragment may be structurally acceptable while providing insufficient documentation to an API consumer.

Therefore:

```text
VALID OPENAPI
      ≠
HIGH-QUALITY OPENAPI
```

OAIT evaluates both.

---

# 4. Quality Model Principles

## QM-PRN-001 — Validity is necessary but insufficient

Conformance with OpenAPI syntax and structure is a prerequisite for quality but does not by itself indicate a high-quality API description.

---

## QM-PRN-002 — Scores must be explainable

Every score reduction must be traceable to:

* One or more rules.
* One or more findings.
* A documented scoring calculation.

OAIT must never produce an unexplained score.

---

## QM-PRN-003 — Scoring must be deterministic

For the same:

* OpenAPI specification.
* OAIT version.
* Ruleset.
* Quality profile.
* Configuration.

OAIT must produce the same deterministic score.

---

## QM-PRN-004 — Severity and score impact are different concepts

A finding's severity indicates the importance of the issue.

Its score impact represents how the finding contributes to the calculated quality score.

These concepts must not be treated as interchangeable.

For example:

```text
Severity: ERROR
Score impact: 4
```

is valid.

---

## QM-PRN-005 — Critical issues must not be hidden by averages

A specification must not receive an acceptable governance result merely because a critical problem is offset by high scores in unrelated categories.

OAIT therefore supports **mandatory quality gates** in addition to numerical scores.

---

## QM-PRN-006 — Not-applicable requirements must not reduce quality

A rule that does not apply to a specification must not reduce the specification's score.

---

## QM-PRN-007 — Quality should be measured against opportunities

Where possible, quality should be calculated based on the number of applicable quality opportunities rather than raw document size.

A specification with 500 operations should not automatically receive a lower score than one with five operations simply because it has more elements.

---

## QM-PRN-008 — Findings must be actionable

A quality finding should help the user understand:

* What is wrong.
* Where the issue exists.
* Why it matters.
* What improvement is expected.

---

## QM-PRN-009 — Deterministic quality precedes AI quality

v0.1 establishes the deterministic quality baseline.

Future AI-assisted evaluation will extend the model for semantic qualities that cannot be measured reliably with deterministic rules alone.

---

# 5. Quality Dimensions

The initial OAIT Quality Model contains eight dimensions.

| ID     | Quality dimension         | Default weight |
| ------ | ------------------------- | -------------: |
| QD-CON | Specification conformance |            20% |
| QD-DOC | Documentation quality     |            25% |
| QD-CMP | API completeness          |            15% |
| QD-SCH | Schema quality            |            10% |
| QD-RSP | Responses and errors      |            10% |
| QD-CNS | Consistency               |            10% |
| QD-EXA | Examples                  |             5% |
| QD-GOV | Lifecycle and governance  |             5% |
|        | **Total**                 |       **100%** |

These weights are the initial default profile and may be revised based on implementation experience and community feedback.

---

# 6. QD-CON — Specification Conformance

**Default weight:** 20%

## 6.1 Objective

Measure whether the document conforms sufficiently to the applicable OpenAPI specification and can be interpreted reliably by tooling.

---

## 6.2 Areas Evaluated

This dimension may include:

* Valid OpenAPI version declaration.
* Required root-level fields.
* Valid Path Item structures.
* Valid Operation Objects.
* Valid Parameter Objects.
* Valid Request Body Objects.
* Valid Response Objects.
* Valid Schema Objects.
* Valid security declarations.
* Reference validity.
* Duplicate identifiers where prohibited.
* Invalid structural combinations.
* Unsupported or malformed constructs.

---

## 6.3 Example Rules

```text
OAIT-CON-001
Unsupported OpenAPI version

OAIT-CON-002
Required root field missing

OAIT-CON-003
Invalid operation structure

OAIT-CON-004
Unresolved reference

OAIT-CON-005
Duplicate operationId
```

---

## 6.4 Quality Expectation

A high-quality OpenAPI specification must be structurally valid enough to be consumed predictably by OpenAPI-compatible tools.

Critical conformance failures may prevent scoring of other dimensions.

---

# 7. QD-DOC — Documentation Quality

**Default weight:** 25%

Documentation quality receives the highest default weight because OAIT is designed not only to validate API contracts but also to improve developer-facing API documentation.

---

## 7.1 Objective

Measure whether the specification explains its API operations and data elements sufficiently for API consumers.

---

## 7.2 Areas Evaluated

This dimension includes:

* API-level descriptions.
* Operation summaries.
* Operation descriptions.
* Parameter descriptions.
* Request-body descriptions.
* Schema descriptions.
* Property descriptions.
* Response descriptions.
* Tag descriptions.
* Deprecated-operation explanations where required.
* Documentation completeness.

Future AI-assisted releases may additionally evaluate:

* Clarity.
* Conciseness.
* Ambiguity.
* Terminology.
* User orientation.
* Redundancy.
* Description usefulness.

---

## 7.3 Example Rules

```text
OAIT-DOC-001
Missing operation summary

OAIT-DOC-002
Missing operation description

OAIT-DOC-003
Missing parameter description

OAIT-DOC-004
Missing schema description

OAIT-DOC-005
Missing property description

OAIT-DOC-006
Missing request-body description

OAIT-DOC-007
Missing tag description

OAIT-DOC-008
Missing API description
```

Future semantic rules may include:

```text
OAIT-DOC-101
Parameter description merely repeats parameter name

OAIT-DOC-102
Operation summary is vague

OAIT-DOC-103
Description contains unexplained terminology
```

Rules numbered in a reserved future range may be AI-assisted or hybrid.

---

# 8. QD-CMP — API Completeness

**Default weight:** 15%

## 8.1 Objective

Measure whether the specification provides the information expected to describe its declared API contract sufficiently.

---

## 8.2 Areas Evaluated

Examples include:

* Operations contain required responses.
* Path parameters are declared.
* Required input elements are represented.
* Operations have identifiers when required by the active profile.
* Request bodies are defined where expected.
* Response content is represented where applicable.
* Reusable components are referenced correctly.
* Declared APIs are sufficiently described for supported downstream use.

---

## 8.3 Example Rules

```text
OAIT-OPS-001
Operation has no operationId

OAIT-OPS-002
Declared path parameter is missing

OAIT-OPS-003
Operation has no responses

OAIT-OPS-004
Required request-body definition missing
```

---

# 9. QD-SCH — Schema Quality

**Default weight:** 10%

## 9.1 Objective

Measure whether request and response data models are sufficiently defined and usable.

---

## 9.2 Areas Evaluated

Examples include:

* Schema definitions.
* Property definitions.
* Required properties.
* Data types.
* Formats.
* Constraints.
* Enumeration declarations.
* Reuse.
* Schema naming.
* Model completeness.
* Invalid or contradictory schema definitions.

---

## 9.3 Example Rules

```text
OAIT-SCH-001
Schema property has no type

OAIT-SCH-002
Schema is empty

OAIT-SCH-003
Invalid required-property reference

OAIT-SCH-004
Enum declaration is empty

OAIT-SCH-005
Schema name violates configured convention
```

OAIT must distinguish **schema documentation quality** from **schema structural quality**.

For example:

```yaml
customerId:
  type: string
```

could pass schema structure rules while failing:

```text
OAIT-DOC-005
Missing property description
```

---

# 10. QD-RSP — Responses and Errors

**Default weight:** 10%

## 10.1 Objective

Measure whether API responses and error behavior are sufficiently represented in the OpenAPI specification.

---

## 10.2 Areas Evaluated

Examples include:

* Successful responses.
* Error responses.
* Response descriptions.
* Response schemas.
* Content types.
* Reusable errors.
* Default responses.
* Common error patterns.
* Required response definitions.

---

## 10.3 Example Rules

```text
OAIT-RSP-001
Operation has no success response

OAIT-RSP-002
Response description missing

OAIT-RSP-003
Response content missing where required

OAIT-ERR-001
No documented client-error response

OAIT-ERR-002
No documented server-error response
```

Rules that assume particular HTTP error strategies must be profile-controlled rather than universal.

---

# 11. QD-CNS — Consistency

**Default weight:** 10%

## 11.1 Objective

Measure whether similar API elements are represented using consistent patterns.

---

## 11.2 Areas Evaluated

v0.1 may evaluate deterministic consistency such as:

* Duplicate `operationId` values.
* Naming-pattern consistency.
* Reuse conventions.
* Tag usage.
* Response-definition patterns.
* Schema naming patterns.

Future semantic analysis may evaluate:

* Terminology consistency.
* Similar descriptions using conflicting language.
* Inconsistent concepts.
* Inconsistent developer-facing terminology.

---

## 11.3 Example Rules

```text
OAIT-CNS-001
Duplicate operationId

OAIT-CNS-002
Schema naming convention mismatch

OAIT-CNS-003
Operation uses undeclared tag

OAIT-CNS-004
Inconsistent parameter naming pattern
```

---

# 12. QD-EXA — Examples

**Default weight:** 5%

## 12.1 Objective

Measure whether practical examples are available where required by the configured quality profile.

---

## 12.2 Areas Evaluated

Examples may include:

* Parameter examples.
* Request examples.
* Response examples.
* Schema examples.
* Error examples.

---

## 12.3 Example Rules

```text
OAIT-EXA-001
Request example missing

OAIT-EXA-002
Successful response example missing

OAIT-EXA-003
Error response example missing

OAIT-EXA-004
Required schema example missing
```

Example requirements must be profile-configurable because example expectations differ among organizations and API types.

---

# 13. QD-GOV — Lifecycle and Governance

**Default weight:** 5%

## 13.1 Objective

Measure whether the specification contains metadata required to support governance and API lifecycle management.

---

## 13.2 Areas Evaluated

Examples include:

* API title.
* API version.
* Contact metadata.
* License metadata where required.
* Tags.
* Deprecation declarations.
* External documentation.
* Organizational extension fields.
* Governance-specific metadata.

---

## 13.3 Example Rules

```text
OAIT-GOV-001
API version missing

OAIT-GOV-002
API contact information missing

OAIT-GOV-003
Deprecated operation lacks deprecation metadata

OAIT-GOV-004
Required organizational metadata missing
```

Not all governance metadata is universally required.

Such rules must be controlled through profiles.

---

# 14. Rule Types

OAIT rules are classified according to how they are evaluated.

## 14.1 Deterministic

The result can be derived programmatically.

Example:

```text
Does every operation have a summary?
```

Result:

```text
Yes / No
```

---

## 14.2 AI-Assisted

The rule requires semantic interpretation.

Example:

```text
Does this description meaningfully explain the parameter?
```

This rule type is not part of the v0.1 scoring baseline unless explicitly introduced later.

---

## 14.3 Hybrid

Deterministic logic identifies a candidate issue, while AI performs further semantic evaluation.

Example:

```text
Deterministic:
Description contains fewer than three meaningful tokens.

AI:
Determine whether the short description is nevertheless sufficient.
```

---

# 15. Rule Applicability

Each rule must declare the context in which it applies.

Possible applicability attributes include:

```yaml
appliesTo:
  openapi:
    - "3.0"
    - "3.1"
    - "3.2"

  objects:
    - operation

  profiles:
    - default
    - strict
```

---

## 15.1 Applicable

A rule is applicable when the target element and configuration meet the rule's applicability conditions.

The rule participates in quality evaluation.

---

## 15.2 Not Applicable

A rule is not applicable when the relevant condition does not exist.

Example:

A request-body example rule does not apply to:

```text
GET /health
```

if that operation has no request body and the profile does not require one.

A not-applicable rule must not reduce the score.

---

## 15.3 Disabled

A rule explicitly disabled by configuration:

* Is not evaluated.
* Does not produce findings.
* Does not affect scoring.

---

## 15.4 Skipped

A rule may be skipped because evaluation cannot be performed safely.

Example:

```text
Reference could not be resolved.
```

A skipped rule must be distinguishable from:

```text
PASSED
```

and:

```text
FAILED
```

---

# 16. Rule Evaluation States

Every applicable deterministic rule evaluation should produce one of:

```text
PASS
FAIL
NOT_APPLICABLE
SKIPPED
ERROR
```

Definitions:

| Status         | Meaning                                 |
| -------------- | --------------------------------------- |
| PASS           | Requirement was evaluated and satisfied |
| FAIL           | Requirement was evaluated and violated  |
| NOT_APPLICABLE | Rule does not apply                     |
| SKIPPED        | Evaluation could not be performed       |
| ERROR          | Rule execution failed                   |

`SKIPPED` and `ERROR` must never be silently counted as `PASS`.

---

# 17. Severity Model

OAIT uses four primary severity levels.

| Severity | Meaning                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| CRITICAL | The issue can invalidate analysis, compromise contract interpretation, or violate a mandatory governance requirement |
| ERROR    | Significant quality or correctness issue requiring resolution                                                        |
| WARNING  | Quality issue that should normally be corrected                                                                      |
| INFO     | Improvement opportunity or advisory guidance                                                                         |

---

## 17.1 CRITICAL

Examples:

* Unsupported or unusable specification structure.
* Critical unresolved references.
* Mandatory security governance rule failure.
* Contract information that cannot be interpreted reliably.

A `CRITICAL` finding may independently fail a quality gate.

---

## 17.2 ERROR

Examples:

* Required operation response missing.
* Path parameter mismatch.
* Required governance information missing.
* Significant schema-definition issue.

---

## 17.3 WARNING

Examples:

* Missing operation description.
* Missing property description.
* Missing example where required by profile.
* Naming inconsistency.

---

## 17.4 INFO

Examples:

* Optional metadata missing.
* Recommended documentation improvement.
* Advisory governance recommendation.

---

# 18. Default Severity-to-Penalty Mapping

The initial scoring model proposes the following base penalties:

| Severity | Base penalty |
| -------- | -----------: |
| CRITICAL |           10 |
| ERROR    |            5 |
| WARNING  |            2 |
| INFO     |          0.5 |

This table provides the default penalty value before rule-specific configuration.

Individual rules may override the base penalty.

Example:

```yaml
id: OAIT-DOC-001
severity: warning
scorePenalty: 1
```

---

# 19. Why OAIT Should Not Simply Deduct From 100 Globally

A naïve scoring model might use:

```text
Score = 100 - all penalties
```

This approach creates significant problems.

Consider:

```text
API A: 10 operations
API B: 1,000 operations
```

If both have 10% of operations missing summaries, API B would accumulate substantially more raw findings and could receive a much lower score despite having the same relative quality.

Therefore OAIT should calculate **category compliance based on applicable quality opportunities**.

---

# 20. Recommended Scoring Model

The recommended v0.1 model uses weighted category compliance.

The scoring process is:

```text
Rule evaluations
       │
       ▼
Calculate rule compliance
       │
       ▼
Calculate category score
       │
       ▼
Apply category weight
       │
       ▼
Overall score
       │
       ▼
Evaluate independent quality gates
```

---

# 21. Rule Compliance

For a rule evaluated against multiple applicable elements:

```text
Rule compliance =
passing applicable instances
────────────────────────────
total evaluated applicable instances
```

Example:

The rule requires every operation to have a summary.

```text
Total applicable operations: 100

Operations with summary:      92
Operations missing summary:    8
```

Rule compliance:

```text
92%
```

The rule therefore contributes a score of:

```text
92/100
```

before weighting.

---

# 22. Weighted Rule Score

Rules within a category may have different importance.

For rule `r`:

```text
Weighted contribution =
rule compliance × rule weight
```

Example:

| Rule                  | Compliance | Weight |
| --------------------- | ---------: | -----: |
| Operation summary     |         92 |      2 |
| Operation description |         80 |      3 |
| Parameter description |         90 |      2 |

Weighted category calculation:

```text
(92 × 2) + (80 × 3) + (90 × 2)
────────────────────────────────
           2 + 3 + 2
```

Result:

```text
86.3
```

Therefore:

```text
Documentation category score = 86.3
```

---

# 23. Category Score

For category `c`:

```text
Category score =
Σ(rule compliance × rule weight)
─────────────────────────────────
       Σ(applicable rule weights)
```

Only applicable rules participate in the denominator.

Therefore a rule with:

```text
NOT_APPLICABLE
```

does not reduce the category score.

---

# 24. Overall Score

The overall quality score is calculated from category scores and configured category weights.

```text
Overall score =
Σ(category score × category weight)
────────────────────────────────────
       Σ(applicable category weights)
```

With the default profile:

```text
Conformance       20%
Documentation     25%
Completeness      15%
Schemas           10%
Responses/errors  10%
Consistency       10%
Examples           5%
Governance         5%
```

---

# 25. Overall Score Example

Assume:

| Category             | Score | Weight |
| -------------------- | ----: | -----: |
| Conformance          |   100 |    20% |
| Documentation        |    72 |    25% |
| Completeness         |    88 |    15% |
| Schema quality       |    91 |    10% |
| Responses and errors |    79 |    10% |
| Consistency          |    87 |    10% |
| Examples             |    63 |     5% |
| Governance           |    90 |     5% |

Calculation:

```text
(100 × .20)
+ (72 × .25)
+ (88 × .15)
+ (91 × .10)
+ (79 × .10)
+ (87 × .10)
+ (63 × .05)
+ (90 × .05)

= 84.45
```

Reported score:

```text
84/100
```

The raw score may be retained internally at higher precision.

---

# 26. Rounding Rules

The default user-facing overall and category scores should be rounded to the nearest whole number.

Example:

```text
84.45 → 84
84.51 → 85
```

Machine-readable output should retain additional precision where useful.

Example:

```json
{
  "score": 84.45,
  "displayScore": 84
}
```

The exact rounding implementation must be documented and tested.

---

# 27. Score Bands

The initial OAIT interpretation bands are:

|  Score | Classification | Interpretation                                                      |
| -----: | -------------- | ------------------------------------------------------------------- |
| 90–100 | Excellent      | Strong specification quality with few significant deficiencies      |
|  80–89 | Good           | Generally strong but contains improvements that should be addressed |
|  70–79 | Fair           | Noticeable quality gaps exist                                       |
|  60–69 | Weak           | Significant improvement is required                                 |
|   0–59 | Poor           | Major quality deficiencies exist                                    |

These labels are advisory.

They must not override configured quality gates.

For example:

```text
Overall score: 94
Classification: Excellent

Quality gate: FAILED
```

is valid if a mandatory critical rule fails.

---

# 28. Default Quality Threshold

The initial recommended default governance threshold is:

```text
80/100
```

However, the threshold should be configurable.

OAIT itself should distinguish:

```text
Quality score
```

from:

```text
Quality acceptance policy
```

The score describes quality.

The policy decides whether that quality is acceptable.

---

# 29. Quality Gates

A quality gate is an explicit condition that must be satisfied independently of the aggregate score.

Quality gates may evaluate:

* Overall score.
* Category score.
* Rule result.
* Severity count.
* Specific mandatory rule.

---

## 29.1 Overall Score Gate

Example:

```yaml
qualityGate:
  minimumScore: 85
```

---

## 29.2 Category Score Gate

Example:

```yaml
qualityGate:
  categories:
    documentation:
      minimumScore: 90
```

---

## 29.3 Mandatory Rule Gate

Example:

```yaml
qualityGate:
  mandatoryRules:
    - OAIT-CON-004
    - OAIT-SEC-001
```

If either rule fails:

```text
Quality gate: FAILED
```

regardless of overall score.

---

## 29.4 Severity Gate

Example:

```yaml
qualityGate:
  maximumFindings:
    critical: 0
    error: 5
```

---

# 30. Quality Gate Result

The quality gate has two primary results:

```text
PASSED
FAILED
```

Future implementations may expose a secondary status such as:

```text
NOT_EVALUATED
```

when no quality-gate policy is configured.

---

# 31. Example Quality Assessment

```text
OpenAPI Intelligence Toolkit

Specification:
payment-api.yaml

OpenAPI:
3.1.0

Overall quality score:
84/100 — Good

Category scores:

Specification conformance     100
Documentation quality          72
API completeness               88
Schema quality                 91
Responses and errors           79
Consistency                    87
Examples                       63
Lifecycle and governance       90

Findings:

Critical     0
Error        2
Warning     11
Info         4

Quality gate:
FAILED

Required overall score:
85

Actual:
84
```

---

# 32. Quality Profiles

Different organizations require different quality standards.

OAIT should therefore support **quality profiles**.

A quality profile defines:

* Enabled rules.
* Rule severity.
* Rule weight.
* Category weights.
* Quality thresholds.
* Mandatory rules.
* Example requirements.
* Governance requirements.

---

# 33. Default Profile

The default profile should provide broadly applicable OpenAPI quality rules.

Example:

```yaml
profile: default

categories:
  conformance:
    weight: 20

  documentation:
    weight: 25

  completeness:
    weight: 15

  schemas:
    weight: 10

  responses:
    weight: 10

  consistency:
    weight: 10

  examples:
    weight: 5

  governance:
    weight: 5
```

---

# 34. Documentation Profile

A documentation-focused profile may increase the importance of developer-facing content.

Example:

```yaml
profile: documentation

categories:
  conformance:
    weight: 15

  documentation:
    weight: 35

  completeness:
    weight: 15

  schemas:
    weight: 10

  responses:
    weight: 10

  consistency:
    weight: 10

  examples:
    weight: 5
```

---

# 35. Strict Profile

A future strict profile may:

* Enable more rules.
* Increase severity.
* Require examples.
* Require operation descriptions.
* Require governance metadata.
* Apply higher quality thresholds.

---

# 36. Custom Profiles

Organizations should eventually be able to create their own profile.

Example:

```yaml
profile: acme-api-standard

extends: default

qualityGate:
  minimumScore: 90

categories:
  documentation:
    minimumScore: 90

rules:
  OAIT-DOC-002:
    severity: error
    weight: 4

  OAIT-EXA-002:
    enabled: true

mandatoryRules:
  - OAIT-SEC-001
  - OAIT-CON-004
```

---

# 37. Rule Definition Model

A quality rule should have metadata comparable to:

```yaml
id: OAIT-DOC-001

name: Missing operation summary

description: >
  Every API operation must include a concise summary.

category: documentation

severity: warning

detection: deterministic

appliesTo:
  objects:
    - operation

openapiVersions:
  - "3.0"
  - "3.1"
  - "3.2"

defaultWeight: 2

qualityGate: false

autofix:
  supported: false

documentation:
  rationale: >
    Operation summaries improve scanning, generated reference
    navigation, and API discoverability.
```

The precise rule schema will be defined during detailed design.

---

# 38. Finding Model

A rule failure creates a finding.

A finding should contain:

```yaml
ruleId: OAIT-DOC-001
title: Missing operation summary
category: documentation
severity: warning
detection: deterministic

location:
  file: openapi.yaml
  pointer: /paths/~1customers~1{id}/get/summary

context:
  method: GET
  path: /customers/{id}

message: >
  The operation does not define a summary.

recommendation: >
  Add a concise summary describing the operation.
```

---

# 39. Findings Versus Rule Instances

The model must distinguish a **rule** from a **finding**.

Example:

```text
RULE

OAIT-DOC-001
Every operation must have a summary.
```

Applied to:

```text
100 operations
```

may result in:

```text
8 findings
```

Therefore:

```text
1 rule
≠
1 finding
```

This distinction is essential to correct scoring.

---

# 40. Duplicate and Overlapping Findings

OAIT must avoid unfairly penalizing the same underlying issue multiple times.

Example:

Suppose:

```text
OAIT-DOC-003
Parameter description missing
```

and:

```text
OAIT-DOC-101
Parameter description is unclear
```

The second rule cannot meaningfully evaluate a missing description.

Therefore:

```text
Missing description
      ↓
OAIT-DOC-003 = FAIL

OAIT-DOC-101 = NOT_APPLICABLE
```

rather than:

```text
both rules = FAIL
```

Rule dependencies and applicability conditions should prevent double penalization.

---

# 41. Cascading Failures

A foundational failure can make downstream quality checks impossible.

Example:

```text
$ref cannot be resolved
```

Because the schema cannot be loaded:

```text
Schema documentation rule → SKIPPED
Property quality rule     → SKIPPED
Example validation rule   → SKIPPED
```

OAIT must not report those downstream rules as passed.

The report should state that quality assessment may be incomplete.

---

# 42. Score Confidence / Coverage

OAIT should eventually report how much of the expected quality model was successfully evaluated.

Example:

```text
Quality score: 84/100

Evaluation coverage: 96%
```

Coverage reflects how much applicable analysis completed successfully.

A low coverage percentage indicates that the score should be interpreted cautiously.

For example:

```text
Score: 92
Coverage: 48%

Warning:
Quality score is incomplete because 52% of applicable
checks could not be evaluated.
```

Coverage should not be confused with source-code test coverage.

---

# 43. Evaluation Coverage Model

A proposed future formula is:

```text
Evaluation coverage =
successfully evaluated applicable rule instances
───────────────────────────────────────────────
total expected applicable rule instances
```

Statuses counted as successfully evaluated:

```text
PASS
FAIL
```

Statuses not counted:

```text
SKIPPED
ERROR
```

`NOT_APPLICABLE` is excluded from the denominator.

The final implementation will be refined during architecture and validation.

---

# 44. AI-Assisted Quality Extension

AI-assisted scoring is planned for later releases, but the quality model must accommodate it from the beginning.

AI may evaluate semantic dimensions such as:

* Description clarity.
* Description usefulness.
* Redundancy.
* Ambiguity.
* Terminology consistency.
* Developer orientation.
* Error-message usefulness.

---

# 45. AI Must Not Directly Assign Overall Quality Scores

An LLM must never receive a specification and simply answer:

```text
Score: 82/100
```

Instead:

```text
AI semantic rule
      │
      ▼
Structured rule evaluation
      │
      ▼
PASS / FAIL / REVIEW
      │
      ▼
Rules engine
      │
      ▼
Deterministic score calculation
```

The scoring system remains deterministic even when certain rule outcomes originate from controlled AI evaluations.

---

# 46. AI Rule Evidence

A future AI-assisted rule must produce structured evidence.

Example:

```json
{
  "ruleId": "OAIT-DOC-101",
  "status": "FAIL",
  "location": "/paths/~1customers/get/description",
  "reason": "The description repeats the operation summary without explaining behavior.",
  "confidence": "high"
}
```

The score engine consumes the structured rule result.

It does not consume free-form AI opinions.

---

# 47. AI Uncertainty

If an AI-assisted rule cannot make a sufficiently grounded determination, its result should be:

```text
REVIEW_REQUIRED
```

or:

```text
SKIPPED
```

depending on the rule design.

Uncertain AI evaluation must not automatically produce a scoring penalty unless the quality profile explicitly defines such behavior.

---

# 48. Quality Model and Contract Accuracy

OAIT evaluates the **quality of the specification as an artifact**.

It cannot determine whether the specification accurately represents a running implementation unless runtime or source-code evidence is supplied through a future integration.

Therefore:

```text
OAIT score: 95/100
```

means:

> The OpenAPI specification satisfies the configured quality model to a high degree.

It does **not** inherently mean:

> The API implementation matches the specification perfectly.

This distinction must be clearly documented.

---

# 49. Quality Model and API Design

OAIT may eventually contain API-design rules, but design preferences must be distinguished from universal correctness rules.

Example:

```text
Use plural resource names.
```

is an API-design convention rather than an OpenAPI validity requirement.

Such rules should:

* Be profile-controlled.
* Clearly identify themselves as conventions.
* Not be presented as universal OpenAPI requirements.

---

# 50. Quality Model and Security

OAIT can evaluate **security information declared in an OpenAPI specification**.

It must not present itself as a runtime security-testing system.

For example, OAIT may detect:

```text
No security scheme declared.
```

but cannot conclude:

```text
The API is insecure.
```

without evidence beyond the specification.

---

# 51. v0.1 Quality Model Scope

v0.1 should implement only deterministic quality rules.

The initial model should prioritize:

### Conformance

* OpenAPI version.
* Structural validity.
* Reference validity.
* Required structural elements.

### Documentation

* Missing API description.
* Missing operation summary.
* Missing operation description.
* Missing parameter description.
* Missing request-body description.
* Missing response description.
* Missing schema description.
* Missing property description.

### Completeness

* Missing operation response.
* Missing path parameter declaration.
* Missing `operationId` where required by profile.

### Schemas

* Invalid property definitions.
* Invalid required-property references.
* Empty or unusable schemas where deterministic detection is reliable.

### Responses and Errors

* Missing success response.
* Missing required response description.
* Configurable error-response expectations.

### Consistency

* Duplicate `operationId`.
* Deterministically detectable naming inconsistencies.

### Examples

* Missing examples where explicitly required.

### Governance

* Missing title/version metadata.
* Configurable governance metadata.

---

# 52. Proposed v0.1 Rule Catalog Size

The first release should not attempt hundreds of rules.

A recommended initial target is:

```text
20–30 high-confidence deterministic rules
```

Suggested distribution:

| Category         | Approximate initial rules |
| ---------------- | ------------------------: |
| Conformance      |                       4–6 |
| Documentation    |                       7–9 |
| Completeness     |                       3–4 |
| Schemas          |                       2–3 |
| Responses/errors |                       2–3 |
| Consistency      |                       2–3 |
| Examples         |                       1–2 |
| Governance       |                       2–3 |

The priority should be **rule quality**, not rule quantity.

---

# 53. Rule Admission Criteria

A deterministic rule should be admitted to the default v0.1 ruleset only if:

* The requirement is clearly defined.
* The target can be identified reliably.
* PASS and FAIL conditions are testable.
* The rule has a meaningful quality rationale.
* The expected false-positive rate is acceptably low.
* Applicability can be determined.
* The rule can be represented in reports clearly.
* Appropriate test fixtures can be created.

---

# 54. Rule Quality Requirements

Each rule must have tests covering:

```text
PASS
FAIL
NOT_APPLICABLE
```

where applicable.

Rules with dependencies should additionally test:

```text
SKIPPED
```

or prerequisite failures.

---

# 55. Baseline Quality Profiles for v0.1

v0.1 should initially provide one required profile:

```text
default
```

A second profile may be provided if implementation capacity permits:

```text
documentation
```

The following should be deferred until the rule system stabilizes:

```text
strict
enterprise
custom marketplace profiles
```

Custom configuration support may still exist before formal custom profile distribution.

---

# 56. Proposed Default Quality Policy

Initial recommendation:

```yaml
profile: default

minimumScore: 80

categories:
  conformance:
    weight: 20

  documentation:
    weight: 25

  completeness:
    weight: 15

  schemas:
    weight: 10

  responses:
    weight: 10

  consistency:
    weight: 10

  examples:
    weight: 5

  governance:
    weight: 5

qualityGate:
  maximumCriticalFindings: 0
```

Specific mandatory rules will be defined after the initial rule catalog is completed.

---

# 57. Quality Model Configuration Hierarchy

The effective quality model should eventually be resolved in this order:

```text
Built-in defaults
       ↓
Selected profile
       ↓
Project configuration
       ↓
CLI overrides
```

The more specific configuration takes precedence.

For example:

```text
Default threshold       80
Profile threshold       85
Project threshold       90
CLI --fail-under        92
```

Effective threshold:

```text
92
```

The precise precedence rules must be documented.

---

# 58. Report Requirements

A quality report should provide enough information to answer:

1. What is the overall score?
2. What quality level does that represent?
3. Did the quality gate pass?
4. Which categories are strongest and weakest?
5. Which findings affected the result?
6. Which rules were evaluated?
7. Which rules were skipped?
8. How much of the quality model was evaluated?
9. Which ruleset/profile was used?
10. Which OAIT version generated the score?

---

# 59. Example Machine-Readable Quality Result

A future JSON representation may resemble:

```json
{
  "qualityModelVersion": "0.1",
  "profile": "default",
  "overallScore": 84.45,
  "displayScore": 84,
  "classification": "good",
  "qualityGate": {
    "status": "failed",
    "minimumScore": 85
  },
  "categories": {
    "conformance": {
      "score": 100,
      "weight": 20
    },
    "documentation": {
      "score": 72,
      "weight": 25
    }
  },
  "findings": {
    "critical": 0,
    "error": 2,
    "warning": 11,
    "info": 4
  }
}
```

The final report schema will be defined during architecture and detailed design.

---

# 60. Quality Model Versioning

The quality model itself must be versioned independently enough to identify changes affecting score interpretation.

Examples of score-affecting changes include:

* Adding a default rule.
* Removing a default rule.
* Changing a rule weight.
* Changing a category weight.
* Changing applicability.
* Changing scoring formulas.

Reports should eventually identify:

```text
OAIT version
Quality model version
Ruleset version
```

This supports reproducibility.

---

# 61. Backward Compatibility

A future OAIT version may produce a different score for the same specification because the quality model evolves.

Such changes must be documented.

Example:

```text
OAIT 0.1
Quality model 0.1
Score: 84

OAIT 0.2
Quality model 0.2
Score: 81
```

This does not necessarily represent a regression in the API specification.

The quality model may have changed.

---

# 62. Benchmark Specifications

The project should maintain benchmark specifications representing different quality levels.

Suggested fixtures:

```text
test-data/
└── quality-model/
    ├── excellent/
    ├── good/
    ├── fair/
    ├── weak/
    └── poor/
```

These fixtures should help validate whether the model produces reasonable relative results.

The benchmark classification should not be created solely from OAIT's own score. Human review should establish the reference expectation.

---

# 63. Quality Model Validation

Before v0.1 becomes stable, the quality model should be tested against:

* Small OpenAPI specifications.
* Large OpenAPI specifications.
* Well-documented specifications.
* Poorly documented specifications.
* Single-file specifications.
* Multi-file specifications.
* Specifications with many not-applicable rules.
* Specifications containing known validation defects.

The evaluation should confirm that:

* Scores remain proportional.
* Large APIs are not penalized merely for size.
* Not-applicable rules do not reduce scores.
* Duplicate findings do not cause unfair penalties.
* Critical findings correctly affect quality gates.
* Similar quality levels produce reasonably comparable scores.

---

# 64. Quality Model Calibration

The initial category weights and thresholds are hypotheses.

They should be calibrated using:

1. Representative OpenAPI specifications.
2. Human expert assessment.
3. OAIT results.
4. Comparison of expected versus actual quality ranking.
5. Community feedback.

Example:

```text
Human assessment:
API A > API B > API C

OAIT:
API A = 92
API B = 81
API C = 63
```

This result supports the model.

If OAIT produces:

```text
API A = 71
API B = 94
API C = 83
```

despite strong expert consensus to the contrary, the quality model requires investigation.

---

# 65. Quality Model Governance

Changes to the default quality model should require:

* Documented rationale.
* Tests.
* Evaluation against benchmark specifications.
* Review of score impact.
* Changelog entry.
* Version consideration.

Material changes should be documented through an Architecture Decision Record or equivalent design decision where appropriate.

---

# 66. Proposed Future Quality Dimensions

The following are intentionally deferred:

### Semantic Documentation Quality

AI-assisted assessment of:

* Clarity.
* Conciseness.
* User orientation.
* Ambiguity.
* Redundancy.

### API Design Quality

Profile-based review of:

* Resource design.
* HTTP-method usage.
* Naming patterns.
* Pagination conventions.
* Filtering patterns.

### Change Safety

Quality of changes between versions, including:

* Breaking-change frequency.
* Deprecation quality.
* Migration readiness.

### AI Readiness

Potential evaluation of whether documentation metadata is suitable for:

* Retrieval.
* AI-assisted developer support.
* Semantic search.

These should not be added until the deterministic foundation is stable.

---

# 67. Open Quality Model Decisions

The following decisions must be resolved before v0.1 implementation is finalized:

1. Should the default acceptance threshold be 80 or 85?
2. What exact default weights should individual rules receive?
3. Which rules should be mandatory quality gates?
4. Should `INFO` findings affect the score?
5. Should category scores with zero applicable rules be omitted or reported as `N/A`?
6. Should evaluation coverage be implemented in v0.1 or deferred to v0.1.x?
7. How should rules with `ERROR` execution status affect quality-gate evaluation?
8. Should unresolved references cause a conformance score of zero or trigger an independent quality gate?
9. How should externally provided validator errors map into OAIT rule IDs?
10. Should the conformance category be scored normally or treated partly as a prerequisite?
11. Which missing-description rules belong in the default profile versus the documentation profile?
12. Should operation descriptions be mandatory if a high-quality summary already exists?
13. Which error responses should be universally expected, if any?
14. Should examples be required in the default profile?
15. What constitutes a deterministically measurable naming inconsistency?
16. How should repeated identical issues be represented in concise console reports?
17. What rule metadata schema will be adopted?
18. What configuration format will represent profiles?
19. How will quality-model and ruleset versions relate to OAIT package versions?
20. Which publicly available OpenAPI specifications should be used for quality-model calibration?

---

# 68. Recommended Decisions for v0.1

To keep the first implementation focused, the following provisional decisions are recommended:

### Overall threshold

```text
80
```

### Scoring method

```text
Weighted compliance by applicable rule instances
```

### Category weights

```text
Conformance       20
Documentation     25
Completeness      15
Schemas           10
Responses/errors  10
Consistency       10
Examples           5
Governance         5
```

### INFO findings

```text
Do not materially affect scoring in v0.1.
```

### Not-applicable category

If no rules in a category apply:

```text
Category = N/A
```

Its configured weight is redistributed proportionally among applicable categories during overall-score calculation.

### Quality gate

```text
Minimum overall score: 80
Maximum critical findings: 0
```

### Profiles

```text
Required: default
Optional: documentation
```

### AI rules

```text
Excluded from v0.1
```

### Rule count

```text
Target: 20–30 deterministic rules
```

These recommendations remain subject to validation during detailed rule design.

---

# 69. Quality Model Traceability

The quality model connects product requirements to implementation.

```text
Product Requirement
        │
        ▼
Quality Dimension
        │
        ▼
Quality Rule
        │
        ▼
Rule Evaluation
        │
        ▼
Finding
        │
        ├────────────► Review Report
        │
        └────────────► Category Score
                           │
                           ▼
                       Overall Score
                           │
                           ▼
                       Quality Gate
```

Example:

```text
PRD:
Improve documentation quality
        ↓
QD-DOC
        ↓
OAIT-DOC-001
Missing operation summary
        ↓
8 failures / 100 operations
        ↓
92% rule compliance
        ↓
Documentation category calculation
        ↓
Overall quality score
```

---

# 70. Relationship to Future Enhancer

The quality model will later drive the OpenAPI Enhancer.

```text
Finding
   │
   ▼
Can it be remediated?
   │
   ├── Deterministic fix
   │
   ├── AI-assisted fix
   │
   ├── Review required
   │
   └── SME input required
```

Therefore each rule should eventually be able to declare remediation metadata.

Example:

```yaml
remediation:
  type: ai-assisted
  target: description
  contractSafe: true
```

This metadata is not required for all v0.1 rules but should be considered in rule-schema design.

---

# 71. Relationship to Future Release Notes

The same quality architecture may later support change-quality rules.

For example:

```text
OAIT-CHG-001
Required request parameter added

Classification:
BREAKING
```

These change rules will use a related rule framework but will not necessarily participate in the static OpenAPI quality score.

Static quality and change impact must remain conceptually distinct.

---

# 72. Quality Model Definition of Done

The OpenAPI Quality Model v0.1 is considered baselined when:

* [ ] Quality is formally defined.
* [ ] Quality dimensions are defined.
* [ ] Default category weights are approved.
* [ ] Rule types are defined.
* [ ] Rule applicability states are defined.
* [ ] Rule evaluation states are defined.
* [ ] Severity levels are defined.
* [ ] The scoring model is defined.
* [ ] Treatment of not-applicable rules is defined.
* [ ] Quality-gate concepts are defined.
* [ ] Score bands are defined.
* [ ] Profile concepts are defined.
* [ ] v0.1 deterministic scope is defined.
* [ ] Rule admission criteria are defined.
* [ ] Calibration requirements are defined.
* [ ] Open quality-model decisions are recorded.
* [ ] The model is ready to support development of the initial rule catalog.

---
