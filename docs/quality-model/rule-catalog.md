# OpenAPI Intelligence Toolkit (OAIT)

## v0.1 Rule Catalog

**Document version:** 0.1
**Project status:** Planning
**Release applicability:** OAIT v0.1
**Quality model:** OpenAPI Quality Model 0.1
**Related documents:** `openapi-quality-model.md`, `PRD.md`, `functional-requirements.md`, `nonfunctional-requirements.md`, `use-cases.md`, `user-stories.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

## 1. Purpose

This document defines the initial deterministic rule catalog for **OpenAPI Intelligence Toolkit (OAIT) v0.1**.

The catalog translates the OpenAPI Quality Model into concrete, testable rules that can be implemented by the OAIT rule engine.

Each rule defines:

* Rule ID.
* Rule name.
* Quality dimension.
* Rule source classification.
* Rationale.
* Applicability.
* Severity.
* Default weight.
* PASS condition.
* FAIL condition.
* NOT_APPLICABLE condition.
* Prerequisites.
* Quality-gate behavior.
* Compliant example.
* Noncompliant example.
* Test requirements.

The catalog is intended to serve as the bridge between:

```text
OpenAPI Quality Model
        ↓
Rule Catalog
        ↓
Rule Schema
        ↓
Rules Engine
        ↓
Findings
        ↓
Reviewer + Scorer
```

---

# 2. Scope

OAIT v0.1 will implement deterministic rules only.

The proposed catalog contains **29 rules** across the following quality dimensions:

| Dimension                      | Rule count |
| ------------------------------ | ---------: |
| Specification conformance      |         10 |
| Documentation quality          |          9 |
| API completeness               |          2 |
| Schema quality                 |          1 |
| Consistency                    |          2 |
| Examples                       |          2 |
| Lifecycle and governance       |          2 |
| Security declaration integrity |          1 |
| **Total**                      |     **29** |

Some rules enforce explicit OpenAPI Specification requirements.

Other rules represent OAIT quality conventions intended to improve documentation quality, developer experience, tooling interoperability, or governance.

These two categories must not be conflated.

---

# 3. Rule Source Classification

Every rule must declare one of the following source classes.

## OAS_REQUIREMENT

The rule evaluates an explicit normative OpenAPI Specification requirement.

Example:

```text
A path parameter must have required: true.
```

Failure indicates specification nonconformance.

---

## OAIT_QUALITY

The rule represents an OAIT quality expectation.

Example:

```text
Every operation should contain a useful summary.
```

The OpenAPI Specification may permit omission of the field, but OAIT considers the field important for API quality.

---

## OAIT_PROFILE

The rule represents a policy that may be appropriate only for selected quality profiles.

Example:

```text
Every successful response should contain an example.
```

Such rules can be enabled or disabled through profiles.

---

# 4. Supported OpenAPI Families

The rule catalog is designed for:

```text
OpenAPI 3.0.x
OpenAPI 3.1.x
OpenAPI 3.2.x
```

The implementation must be version-aware.

A rule must not assume that semantics are identical across these versions.

Examples of relevant differences include:

* `responses` is explicitly required on Operation Objects in OpenAPI 3.0.x.
* Response Object `description` is required in OpenAPI 3.0.x and 3.1.x.
* OpenAPI 3.2 introduces a Response Object `summary` field and no longer marks `description` as required.
* OpenAPI 3.2 introduces the `query` Operation field and `additionalOperations`.
* OpenAPI 3.2 introduces the `querystring` parameter location.

---

# 5. Rule Evaluation States

Each rule instance must resolve to one of:

```text
PASS
FAIL
NOT_APPLICABLE
SKIPPED
ERROR
```

Definitions:

| State          | Meaning                                                            |
| -------------- | ------------------------------------------------------------------ |
| PASS           | Rule was evaluated and satisfied                                   |
| FAIL           | Rule was evaluated and violated                                    |
| NOT_APPLICABLE | Rule does not apply                                                |
| SKIPPED        | Rule could not be evaluated because a prerequisite was unavailable |
| ERROR          | Rule execution failed                                              |

`SKIPPED` and `ERROR` must never be treated as `PASS`.

---

# 6. Severity Levels

| Severity | Meaning                                                                                      |
| -------- | -------------------------------------------------------------------------------------------- |
| CRITICAL | Specification cannot be interpreted reliably or a mandatory governance condition is violated |
| ERROR    | Significant correctness or quality issue                                                     |
| WARNING  | Quality issue that should normally be corrected                                              |
| INFO     | Advisory improvement                                                                         |

Severity does not directly determine score weight.

---

# 7. Default Rule Weight Scale

The proposed rule weights are:

| Weight | Interpretation       |
| -----: | -------------------- |
|      5 | Very high importance |
|      4 | High importance      |
|      3 | Significant          |
|      2 | Normal               |
|      1 | Minor                |

Weights influence category scoring.

---

# 8. Quality-Gate Types

Rules can use one of the following gate behaviors.

```text
MANDATORY
CONFIGURABLE
NONE
```

### MANDATORY

A failure fails the default v0.1 quality gate regardless of overall score.

### CONFIGURABLE

Projects may configure the rule as a mandatory gate.

### NONE

The rule affects findings and scoring but does not independently fail the gate.

---

# 9. Rule Summary

| Rule ID      | Rule                                             | Dimension     | Source               | Severity | Weight |
| ------------ | ------------------------------------------------ | ------------- | -------------------- | -------- | -----: |
| OAIT-CON-001 | Supported OpenAPI version                        | Conformance   | OAS_REQUIREMENT      | CRITICAL |      5 |
| OAIT-CON-002 | Valid root document structure                    | Conformance   | OAS_REQUIREMENT      | CRITICAL |      5 |
| OAIT-CON-003 | Reference resolves successfully                  | Conformance   | OAS_REQUIREMENT      | CRITICAL |      5 |
| OAIT-CON-004 | Path template parameter is declared              | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-CON-005 | Path parameter is required                       | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-CON-006 | Parameter defines schema or content              | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-CON-007 | Parameter definitions are unique                 | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-CON-008 | Responses Object is not empty                    | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-CON-009 | OpenAPI 3.0 operation defines responses          | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-CON-010 | Security requirement resolves                    | Conformance   | OAS_REQUIREMENT      | ERROR    |      4 |
| OAIT-DOC-001 | API description present                          | Documentation | OAIT_QUALITY         | WARNING  |      2 |
| OAIT-DOC-002 | Operation summary present                        | Documentation | OAIT_QUALITY         | WARNING  |      3 |
| OAIT-DOC-003 | Operation description present                    | Documentation | OAIT_QUALITY         | WARNING  |      2 |
| OAIT-DOC-004 | Parameter description present                    | Documentation | OAIT_QUALITY         | WARNING  |      3 |
| OAIT-DOC-005 | Request body description present                 | Documentation | OAIT_QUALITY         | WARNING  |      2 |
| OAIT-DOC-006 | Response documentation present                   | Documentation | Hybrid version-aware | WARNING  |      3 |
| OAIT-DOC-007 | Schema description present                       | Documentation | OAIT_QUALITY         | WARNING  |      2 |
| OAIT-DOC-008 | Schema property description present              | Documentation | OAIT_QUALITY         | WARNING  |      3 |
| OAIT-DOC-009 | Declared tag description present                 | Documentation | OAIT_QUALITY         | WARNING  |      1 |
| OAIT-OPS-001 | Operation identifier present                     | Completeness  | OAIT_QUALITY         | WARNING  |      2 |
| OAIT-RSP-001 | Successful response documented                   | Responses     | OAIT_QUALITY         | ERROR    |      4 |
| OAIT-SCH-001 | Required property is explicitly modeled          | Schema        | OAIT_QUALITY         | WARNING  |      2 |
| OAIT-CNS-001 | Operation identifiers are unique                 | Consistency   | OAS_REQUIREMENT      | ERROR    |      5 |
| OAIT-CNS-002 | Root tag names are unique                        | Consistency   | OAS_REQUIREMENT      | ERROR    |      3 |
| OAIT-EXA-001 | Request example present                          | Examples      | OAIT_PROFILE         | WARNING  |      1 |
| OAIT-EXA-002 | Successful response example present              | Examples      | OAIT_PROFILE         | WARNING  |      2 |
| OAIT-GOV-001 | API contact information present                  | Governance    | OAIT_QUALITY         | WARNING  |      1 |
| OAIT-GOV-002 | Operation tags are declared                      | Governance    | OAIT_QUALITY         | WARNING  |      1 |
| OAIT-SEC-001 | Security schemes used by operations are declared | Security      | OAS_REQUIREMENT      | ERROR    |      4 |

---

# 10. Specification Conformance Rules

## OAIT-CON-001 — Supported OpenAPI Version

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** CRITICAL
**Default weight:** 5
**Quality gate:** MANDATORY

### Rationale

OAIT must know which OpenAPI semantics apply before it can interpret the document reliably.

### Applicability

Entry OpenAPI documents.

### PASS

The root `openapi` value identifies an OpenAPI version supported by the current OAIT release.

Example:

```yaml
openapi: 3.1.2
```

### FAIL

The `openapi` field is absent, malformed, or identifies an unsupported version.

Example:

```yaml
openapi: 2.0
```

### NOT_APPLICABLE

Never for an entry OpenAPI document.

### Prerequisites

* Input parsed successfully.

### Compliant example

```yaml
openapi: 3.2.0
info:
  title: Customer API
  version: 1.0.0
paths: {}
```

### Noncompliant example

```yaml
swagger: "2.0"
info:
  title: Customer API
  version: 1.0.0
paths: {}
```

### Test requirements

Test:

* Supported 3.0.x input.
* Supported 3.1.x input.
* Supported 3.2.x input.
* Missing `openapi`.
* Unsupported major version.
* Malformed version.
* Supported patch-version behavior.

---

## OAIT-CON-002 — Valid Root Document Structure

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** CRITICAL
**Default weight:** 5
**Quality gate:** MANDATORY

### Rationale

The OpenAPI entry document must contain the required root metadata and the structures required by its declared OpenAPI version.

### Applicability

Entry OpenAPI document.

### PASS

The document contains all mandatory root-level structures required by the declared OAS version.

At minimum:

```text
openapi
info
```

Version-specific root requirements must also be satisfied.

For OpenAPI 3.2.x, at least one of:

```text
components
paths
webhooks
```

must be present.

### FAIL

A required root-level structure is missing or structurally invalid.

### NOT_APPLICABLE

Never.

### Prerequisites

* OAIT-CON-001 passes.

### Compliant example

```yaml
openapi: 3.2.0

info:
  title: Customer API
  version: 1.0.0

paths: {}
```

### Noncompliant example

```yaml
openapi: 3.2.0

info:
  title: Customer API
  version: 1.0.0
```

### Test requirements

Test separately for:

* 3.0.x root requirements.
* 3.1.x root requirements.
* 3.2.x root requirements.
* Missing `info`.
* Missing `info.title`.
* Missing `info.version`.
* 3.2 document lacking `paths`, `components`, and `webhooks`.

---

## OAIT-CON-003 — Reference Resolves Successfully

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** CRITICAL
**Default weight:** 5
**Quality gate:** MANDATORY

### Rationale

An unresolved `$ref` prevents consumers and OAIT from reliably interpreting the referenced API structure.

### Applicability

Every supported Reference Object and resolvable Schema `$ref`.

### PASS

The reference resolves to an allowed target.

### FAIL

The reference cannot be resolved.

### NOT_APPLICABLE

The evaluated object does not contain a reference.

### Prerequisites

* Parsing succeeded.
* Referenced file access is permitted.
* Reference protocol is permitted.

### Compliant example

```yaml
schema:
  $ref: "#/components/schemas/Customer"

components:
  schemas:
    Customer:
      type: object
```

### Noncompliant example

```yaml
schema:
  $ref: "#/components/schemas/Customer"

components:
  schemas: {}
```

### Test requirements

Test:

* Valid internal reference.
* Missing internal target.
* Valid local-file reference.
* Missing local file.
* Circular reference that is legal and safely resolved.
* Disallowed remote reference.
* Malformed URI reference.

---

## OAIT-CON-004 — Path Template Parameter Is Declared

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

Every path template expression must have a corresponding path parameter so that consumers can determine how to construct the request URL.

### Applicability

Every templated path containing expressions such as:

```text
/customers/{customerId}
```

### PASS

Every template expression has a matching `in: path` parameter at the Path Item or applicable Operation level.

### FAIL

A template expression has no corresponding path parameter.

### NOT_APPLICABLE

The path contains no template expressions.

### Prerequisites

* Path Item can be parsed.
* Parameters can be resolved.

### Compliant example

```yaml
paths:
  /customers/{customerId}:
    get:
      parameters:
        - name: customerId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Customer returned.
```

### Noncompliant example

```yaml
paths:
  /customers/{customerId}:
    get:
      responses:
        "200":
          description: Customer returned.
```

### Test requirements

Test:

* Operation-level parameter.
* Path-level parameter.
* Multiple template expressions.
* Missing one of several parameters.
* Similar but nonmatching parameter names.
* Referenced parameters.

---

## OAIT-CON-005 — Path Parameter Is Required

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

OpenAPI requires parameters in the path to be mandatory because the path cannot be constructed without their values.

### Applicability

Every Parameter Object with:

```yaml
in: path
```

### PASS

```yaml
required: true
```

is explicitly present.

### FAIL

`required` is missing or set to `false`.

### NOT_APPLICABLE

The parameter is not a path parameter.

### Prerequisites

* Parameter resolves successfully.

### Compliant example

```yaml
- name: customerId
  in: path
  required: true
  schema:
    type: string
```

### Noncompliant example

```yaml
- name: customerId
  in: path
  required: false
  schema:
    type: string
```

### Test requirements

Test:

* `required: true`.
* `required: false`.
* Missing `required`.
* Referenced path parameter.
* Query parameter, which must return NOT_APPLICABLE.

---

## OAIT-CON-006 — Parameter Defines Schema or Content

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

A Parameter Object requires a serialization model. OpenAPI expresses that model using either `schema` or `content`.

### Applicability

Every Parameter Object.

### PASS

Exactly one of the following is present:

```text
schema
content
```

### FAIL

Neither is present, or both are present.

### NOT_APPLICABLE

Never for a resolved Parameter Object.

### Prerequisites

* Parameter resolves successfully.

### Compliant example

```yaml
- name: limit
  in: query
  schema:
    type: integer
```

### Noncompliant example

```yaml
- name: limit
  in: query
  schema:
    type: integer
  content:
    application/json:
      schema:
        type: integer
```

### Test requirements

Test:

* Schema only.
* Content only.
* Neither.
* Both.
* Referenced parameter.
* OpenAPI 3.2 `querystring` parameter using content.

---

## OAIT-CON-007 — Parameter Definitions Are Unique

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

OpenAPI identifies a parameter using the combination of its name and location. Duplicate definitions create ambiguity.

### Applicability

Parameter collections at:

* Path Item level.
* Operation level.

### PASS

No two applicable parameters have the same:

```text
name + in
```

combination.

### FAIL

Duplicate parameter identity exists.

### NOT_APPLICABLE

Fewer than two parameters are present.

### Prerequisites

* Parameters resolve successfully.

### Compliant example

```yaml
parameters:
  - name: limit
    in: query
    schema:
      type: integer

  - name: X-Request-ID
    in: header
    schema:
      type: string
```

### Noncompliant example

```yaml
parameters:
  - name: limit
    in: query
    schema:
      type: integer

  - name: limit
    in: query
    schema:
      type: string
```

### Test requirements

Test:

* Unique parameters.
* Duplicate operation parameters.
* Duplicate path parameters.
* Same name in different locations.
* Referenced duplicate parameter.

---

## OAIT-CON-008 — Responses Object Is Not Empty

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

When a Responses Object exists, it must contain at least one response entry.

### Applicability

Every Responses Object.

### PASS

At least one status-code, range, or `default` response is present.

### FAIL

The Responses Object is empty.

### NOT_APPLICABLE

No Responses Object exists and the OpenAPI version permits its omission.

### Prerequisites

* Operation parsed successfully.

### Compliant example

```yaml
responses:
  "200":
    description: Customer returned.
```

### Noncompliant example

```yaml
responses: {}
```

### Test requirements

Test:

* Explicit 200 response.
* `default` response.
* 3.2 `2XX` range.
* Empty response map.
* Missing response object in OpenAPI versions where omission is permitted.

---

## OAIT-CON-009 — OpenAPI 3.0 Operation Defines Responses

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

OpenAPI 3.0.x explicitly requires the Operation Object to contain `responses`.

This rule is intentionally version-specific.

### Applicability

Every Operation Object in OpenAPI 3.0.x.

### PASS

The operation contains:

```yaml
responses:
```

with a valid Responses Object.

### FAIL

The operation does not contain `responses`.

### NOT_APPLICABLE

OpenAPI 3.1.x or 3.2.x.

### Prerequisites

* OpenAPI version detected.
* Operation parsed.

### Compliant example

```yaml
openapi: 3.0.4

paths:
  /customers:
    get:
      responses:
        "200":
          description: Customers returned.
```

### Noncompliant example

```yaml
openapi: 3.0.4

paths:
  /customers:
    get:
      summary: List customers
```

### Test requirements

Test:

* 3.0 operation with responses.
* 3.0 operation without responses.
* 3.1 equivalent returns NOT_APPLICABLE.
* 3.2 equivalent returns NOT_APPLICABLE.

---

## OAIT-CON-010 — Security Requirement Resolves

**Quality dimension:** Specification conformance
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

A Security Requirement must identify a security mechanism that can be resolved according to the applicable OpenAPI version.

### Applicability

Every nonempty Security Requirement Object.

### PASS

Each referenced security requirement resolves to a valid declared or otherwise valid version-specific security scheme target.

### FAIL

A security requirement refers to a nonexistent or invalid target.

### NOT_APPLICABLE

No security requirement is declared, or the requirement is the explicit empty `{}` alternative.

### Prerequisites

* Components available where required.
* Relevant references resolved.

### Compliant example

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

security:
  - bearerAuth: []
```

### Noncompliant example

```yaml
security:
  - bearerAuth: []

components:
  securitySchemes: {}
```

### Test requirements

Test:

* Top-level valid security requirement.
* Operation-level valid security requirement.
* Missing security scheme.
* Empty optional security requirement.
* Multi-scheme requirements.
* Version-specific reference behavior.

---

# 11. Documentation Quality Rules

## OAIT-DOC-001 — API Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE

### Rationale

The root API description provides API consumers with context about the purpose and scope of the API.

### Applicability

Every entry OpenAPI document.

### PASS

`info.description` contains non-whitespace text.

### FAIL

`info.description` is absent, empty, or whitespace-only.

### NOT_APPLICABLE

Never.

### Prerequisites

* `info` available.

### Compliant example

```yaml
info:
  title: Customer API
  version: 1.0.0
  description: Manages customer profiles and account information.
```

### Noncompliant example

```yaml
info:
  title: Customer API
  version: 1.0.0
```

### Test requirements

Test:

* Meaningful text.
* Missing description.
* Empty string.
* Whitespace-only string.
* CommonMark content.

---

## OAIT-DOC-002 — Operation Summary Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 3
**Quality gate:** NONE

### Rationale

Operation summaries improve scanning, generated navigation, search results, and developer comprehension.

### Applicability

Every Operation Object supported by the declared OpenAPI version.

For OpenAPI 3.2, operation discovery must include:

* Standard operation fields.
* `query`.
* `additionalOperations`.

### PASS

The operation contains a nonempty `summary`.

### FAIL

The summary is absent or empty.

### NOT_APPLICABLE

Never for an Operation Object.

### Prerequisites

* Operation parsed successfully.

### Compliant example

```yaml
get:
  summary: Retrieve a customer
```

### Noncompliant example

```yaml
get:
  description: Returns the customer matching the supplied identifier.
```

### Test requirements

Test:

* Standard GET operation.
* Missing summary.
* Empty summary.
* 3.2 QUERY operation.
* 3.2 `additionalOperations` entry.

---

## OAIT-DOC-003 — Operation Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE

### Rationale

A description provides space for behavioral detail that cannot be communicated adequately through a short summary.

### Applicability

Every Operation Object under the default v0.1 profile.

### PASS

A nonempty `description` is present.

### FAIL

Description is absent or empty.

### NOT_APPLICABLE

A profile may disable this rule.

### Prerequisites

* Operation parsed.

### Compliant example

```yaml
get:
  summary: Retrieve a customer
  description: Returns the customer profile associated with the specified identifier.
```

### Noncompliant example

```yaml
get:
  summary: Retrieve a customer
```

### Test requirements

Test:

* Description present.
* Missing description.
* Empty description.
* Profile-disabled behavior.

---

## OAIT-DOC-004 — Parameter Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 3
**Quality gate:** NONE

### Rationale

API consumers need to understand the purpose of inputs rather than infer meaning from parameter names.

### Applicability

Every resolved Parameter Object.

### PASS

The parameter contains a nonempty `description`.

### FAIL

Description is missing or empty.

### NOT_APPLICABLE

None for a resolved parameter.

### Prerequisites

* Parameter resolves successfully.

### Compliant example

```yaml
- name: customerId
  in: path
  required: true
  description: Unique identifier of the customer to retrieve.
  schema:
    type: string
```

### Noncompliant example

```yaml
- name: customerId
  in: path
  required: true
  schema:
    type: string
```

### Test requirements

Test:

* Path parameter.
* Query parameter.
* Header parameter.
* Cookie parameter.
* 3.2 querystring parameter.
* Referenced parameter.

---

## OAIT-DOC-005 — Request Body Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE

### Rationale

A request-body description helps consumers understand the purpose of the payload independently of its schema.

### Applicability

Every resolved Request Body Object.

### PASS

A nonempty `description` is present.

### FAIL

Description is absent or empty.

### NOT_APPLICABLE

The operation has no request body.

### Prerequisites

* Request Body Object resolves.

### Compliant example

```yaml
requestBody:
  description: Customer information used to create the account.
  required: true
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
```

### Noncompliant example

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
```

### Test requirements

Test:

* Inline request body.
* Referenced request body.
* Missing description.
* Operation without request body.

---

## OAIT-DOC-006 — Response Documentation Present

**Quality dimension:** Documentation quality
**Source:** OAS_REQUIREMENT for 3.0.x/3.1.x; OAIT_QUALITY for 3.2.x
**Severity:** WARNING by OAIT review policy
**Default weight:** 3
**Quality gate:** NONE

### Rationale

Every documented response should explain what the response represents.

The rule is version-aware because Response Object requirements changed in OpenAPI 3.2.

### Applicability

Every resolved Response Object.

### PASS

For OpenAPI 3.0.x and 3.1.x:

```text
description is present and nonempty
```

For OpenAPI 3.2.x:

At least one of the following is present and nonempty:

```text
summary
description
```

The default documentation profile may later require `description` even when `summary` exists.

### FAIL

The version-specific documentation requirement is not met.

### NOT_APPLICABLE

Never for a resolved Response Object.

### Prerequisites

* Response resolves.

### Compliant example — 3.1

```yaml
"200":
  description: Customer returned successfully.
```

### Compliant example — 3.2

```yaml
"200":
  summary: Customer returned
  description: Contains the customer profile matching the requested identifier.
```

### Noncompliant example

```yaml
"200":
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
```

### Test requirements

Test separately for:

* 3.0 required description.
* 3.1 required description.
* 3.2 description.
* 3.2 summary-only response.
* Empty documentation fields.
* Referenced responses.

---

## OAIT-DOC-007 — Schema Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE

### Rationale

Named schemas represent important API concepts and should explain their business or technical meaning.

### Applicability

Named schemas under:

```text
components.schemas
```

under the default profile.

### PASS

The Schema Object contains a nonempty `description`.

### FAIL

The description is absent or empty.

### NOT_APPLICABLE

Anonymous inline schemas unless a profile extends this rule.

Boolean schemas are NOT_APPLICABLE.

### Prerequisites

* Schema can be interpreted.

### Compliant example

```yaml
components:
  schemas:
    Customer:
      description: Represents a customer account.
      type: object
```

### Noncompliant example

```yaml
components:
  schemas:
    Customer:
      type: object
```

### Test requirements

Test:

* Named object schema.
* Primitive named schema.
* Missing description.
* Boolean schema.
* Inline anonymous schema.

---

## OAIT-DOC-008 — Schema Property Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 3
**Quality gate:** NONE

### Rationale

Property descriptions help API consumers interpret data semantics that cannot be derived reliably from property names or types.

### Applicability

Explicitly declared properties in object schemas.

### PASS

Each property contains a nonempty `description`.

### FAIL

A declared property lacks a nonempty description.

### NOT_APPLICABLE

Schema does not declare `properties`.

### Prerequisites

* Schema parsed successfully.

### Compliant example

```yaml
Customer:
  type: object
  properties:
    customerId:
      type: string
      description: Unique identifier of the customer.
```

### Noncompliant example

```yaml
Customer:
  type: object
  properties:
    customerId:
      type: string
```

### Test requirements

Test:

* Single property.
* Multiple properties.
* Nested properties.
* Referenced schemas.
* Schema with no properties.
* Boolean schema.

---

## OAIT-DOC-009 — Declared Tag Description Present

**Quality dimension:** Documentation quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 1
**Quality gate:** NONE

### Rationale

Descriptions help users understand how operations grouped under a tag are related.

### Applicability

Every root-level Tag Object.

### PASS

The tag contains a nonempty `description`.

### FAIL

Description is absent or empty.

### NOT_APPLICABLE

No root-level tags are declared.

### Prerequisites

* Tag Object parsed.

### Compliant example

```yaml
tags:
  - name: customers
    description: Operations for managing customer profiles.
```

### Noncompliant example

```yaml
tags:
  - name: customers
```

### Test requirements

Test:

* Described tag.
* Missing description.
* Empty tags array.
* 3.2 tag with `summary`, `kind`, or `parent`.

---

# 12. API Completeness Rules

## OAIT-OPS-001 — Operation Identifier Present

**Quality dimension:** API completeness
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE

### Rationale

`operationId` provides a stable machine-readable identifier that can be used by tooling, SDK generators, links, documentation systems, and automation.

### Applicability

Every Operation Object.

### PASS

The operation contains a nonempty `operationId`.

### FAIL

`operationId` is missing or empty.

### NOT_APPLICABLE

Never for an operation under the default profile.

### Prerequisites

* Operation parsed.

### Compliant example

```yaml
get:
  operationId: getCustomer
```

### Noncompliant example

```yaml
get:
  summary: Retrieve a customer
```

### Test requirements

Test:

* Standard operation.
* Missing ID.
* Empty ID.
* 3.2 QUERY operation.
* 3.2 additional operation.

---

## OAIT-RSP-001 — Successful Response Documented

**Quality dimension:** Responses and errors
**Source:** OAIT_QUALITY based on OpenAPI response-documentation guidance
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

API consumers must be able to determine what successful execution produces.

### Applicability

Operations with a Responses Object.

### PASS

The operation contains at least one documented success response represented by:

```text
2xx explicit status
```

or, where supported:

```text
2XX
```

A project profile may define additional success semantics.

### FAIL

Responses are present but no successful response is documented.

### NOT_APPLICABLE

Responses cannot be evaluated because of a prerequisite failure.

### Prerequisites

* Responses Object available and valid.

### Compliant example

```yaml
responses:
  "200":
    description: Customer returned.
  "404":
    description: Customer not found.
```

### Noncompliant example

```yaml
responses:
  "400":
    description: Invalid request.
  "404":
    description: Customer not found.
```

### Test requirements

Test:

* 200.
* 201.
* 204.
* 2XX where supported.
* Only error responses.
* `default` only.
* Configurable treatment of `default`.

---

# 13. Schema Quality Rules

## OAIT-SCH-001 — Required Property Is Explicitly Modeled

**Quality dimension:** Schema quality
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE

### Rationale

JSON Schema can permit a property to be listed as required without defining it under `properties`. However, for API contracts and generated documentation, explicitly modeling required properties provides clearer semantics and better tooling interoperability.

This rule is therefore an OAIT quality convention, not a general OpenAPI validity requirement.

### Applicability

Object-like schemas containing both:

```text
required
```

and explicit property modeling.

### PASS

Every property named in `required` is explicitly modeled under `properties` in the applicable schema context.

### FAIL

A required property is not explicitly modeled.

### NOT_APPLICABLE

The schema has no `required` keyword.

### Prerequisites

* Schema can be interpreted.
* Composition behavior is not ambiguous for the evaluated instance.

### Compliant example

```yaml
Customer:
  type: object
  required:
    - customerId
  properties:
    customerId:
      type: string
```

### Noncompliant example

```yaml
Customer:
  type: object
  required:
    - customerId
  properties:
    name:
      type: string
```

### Test requirements

Test:

* Fully declared required list.
* Missing declaration.
* No required keyword.
* Inheritance/composition cases.
* OpenAPI 3.1/3.2 JSON Schema semantics.
* Rule does not incorrectly report a conformance violation.

---

# 14. Consistency Rules

## OAIT-CNS-001 — Operation Identifiers Are Unique

**Quality dimension:** Consistency
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 5
**Quality gate:** CONFIGURABLE

### Rationale

OpenAPI requires `operationId` to be unique among described operations.

Duplicate identifiers create ambiguity for tooling and operation references.

### Applicability

All operations that define `operationId`.

### PASS

Every nonempty `operationId` is unique within the applicable OpenAPI Description scope.

### FAIL

Two or more operations define the same operation identifier.

### NOT_APPLICABLE

Fewer than two operations define an `operationId`.

### Prerequisites

* Operations discovered successfully.

### Compliant example

```yaml
/customers:
  get:
    operationId: listCustomers

/customers/{customerId}:
  get:
    operationId: getCustomer
```

### Noncompliant example

```yaml
/customers:
  get:
    operationId: getCustomer

/customers/{customerId}:
  get:
    operationId: getCustomer
```

### Test requirements

Test:

* Unique identifiers.
* Duplicate identifiers.
* Case-sensitive difference.
* Multi-document operation discovery.
* 3.2 additional operations.

---

## OAIT-CNS-002 — Root Tag Names Are Unique

**Quality dimension:** Consistency
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 3
**Quality gate:** CONFIGURABLE

### Rationale

OpenAPI requires names in the root `tags` collection to be unique.

### Applicability

Root-level tag declarations.

### PASS

Each Tag Object has a unique `name`.

### FAIL

Two or more declared Tag Objects have the same name.

### NOT_APPLICABLE

Zero or one root tag is declared.

### Prerequisites

* Root tags parsed.

### Compliant example

```yaml
tags:
  - name: customers
  - name: orders
```

### Noncompliant example

```yaml
tags:
  - name: customers
  - name: customers
```

### Test requirements

Test:

* Unique tags.
* Duplicate tags.
* Empty tags.
* Case-sensitive tag names.

---

# 15. Example Quality Rules

## OAIT-EXA-001 — Request Example Present

**Quality dimension:** Examples
**Source:** OAIT_PROFILE
**Severity:** WARNING
**Default weight:** 1
**Quality gate:** NONE
**Default profile:** Enabled
**May be disabled:** Yes

### Rationale

A realistic request example helps API consumers understand how a schema is represented in practice.

### Applicability

Request bodies that:

* Define content.
* Have at least one media type.
* Represent a structured request payload.

### PASS

At least one usable example is available through the relevant Media Type Object or schema/example mechanism recognized for the declared OpenAPI version.

### FAIL

No example is available.

### NOT_APPLICABLE

* No request body.
* Payload type is excluded by profile.
* No content is defined.

### Prerequisites

* Request body and media type resolve.

### Compliant example

```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
      example:
        name: Ada Lovelace
```

### Noncompliant example

```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
```

### Test requirements

Test:

* Media-type `example`.
* Media-type `examples`.
* Version-appropriate schema example.
* Missing example.
* No request body.
* Referenced examples.

---

## OAIT-EXA-002 — Successful Response Example Present

**Quality dimension:** Examples
**Source:** OAIT_PROFILE
**Severity:** WARNING
**Default weight:** 2
**Quality gate:** NONE
**Default profile:** Enabled

### Rationale

Response examples improve comprehension and help developers understand actual payload shape beyond schema definitions.

### Applicability

Successful responses containing structured content.

### PASS

At least one usable response example is available for the successful response.

### FAIL

Structured response content exists but has no example.

### NOT_APPLICABLE

* Response has no payload.
* Response does not define content.
* Content type is excluded by profile.

### Prerequisites

* Successful response identified.
* Content resolves.

### Compliant example

```yaml
"200":
  description: Customer returned.
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
      example:
        customerId: C-1001
        name: Ada Lovelace
```

### Noncompliant example

```yaml
"200":
  description: Customer returned.
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Customer"
```

### Test requirements

Test:

* `example`.
* `examples`.
* No-content 204 response returns NOT_APPLICABLE.
* Missing example.
* Referenced example.

---

# 16. Lifecycle and Governance Rules

## OAIT-GOV-001 — API Contact Information Present

**Quality dimension:** Lifecycle and governance
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 1
**Quality gate:** NONE

### Rationale

API consumers and maintainers benefit from knowing how to contact the responsible API organization or support function.

### Applicability

Entry OpenAPI document.

### PASS

`info.contact` exists and contains at least one usable contact field:

```text
name
url
email
```

### FAIL

Contact information is absent or empty.

### NOT_APPLICABLE

A profile may disable the rule.

### Prerequisites

* Info Object available.

### Compliant example

```yaml
info:
  title: Customer API
  version: 1.0.0
  contact:
    name: API Support
    email: api-support@example.com
```

### Noncompliant example

```yaml
info:
  title: Customer API
  version: 1.0.0
```

### Test requirements

Test:

* Name only.
* Email only.
* URL only.
* Empty contact object.
* Missing contact.
* Invalid contact formats handled by conformance validation.

---

## OAIT-GOV-002 — Operation Tags Are Declared

**Quality dimension:** Lifecycle and governance
**Source:** OAIT_QUALITY
**Severity:** WARNING
**Default weight:** 1
**Quality gate:** NONE

### Rationale

OpenAPI does not require every operation tag to have a corresponding root Tag Object. However, explicit declarations improve consistent navigation, metadata management, and documentation generation.

This rule intentionally exceeds the minimum OpenAPI requirement.

### Applicability

Operations using one or more tags.

### PASS

Every operation tag has a matching root-level Tag Object.

### FAIL

An operation uses a tag that is not declared at the root.

### NOT_APPLICABLE

The operation uses no tags.

### Prerequisites

* Root tags available.
* Operation tags parsed.

### Compliant example

```yaml
tags:
  - name: customers
    description: Customer operations.

paths:
  /customers:
    get:
      tags:
        - customers
```

### Noncompliant example

```yaml
paths:
  /customers:
    get:
      tags:
        - customers
```

### Test requirements

Test:

* Declared tag.
* Undeclared tag.
* Multiple tags.
* No operation tags.
* Multi-document implications.
* Case-sensitive matching.

---

# 17. Security Declaration Rule

## OAIT-SEC-001 — Security Schemes Used by Operations Are Declared

**Quality dimension:** Specification conformance / governance security
**Source:** OAS_REQUIREMENT
**Severity:** ERROR
**Default weight:** 4
**Quality gate:** CONFIGURABLE

### Rationale

A security requirement that names a nonexistent security scheme cannot be interpreted reliably by consumers or tooling.

This rule complements OAIT-CON-010 by presenting the issue specifically within the security-analysis domain.

To avoid duplicate scoring, OAIT-CON-010 and OAIT-SEC-001 must share a finding family or dependency relationship.

### Applicability

Security requirements that use named security schemes.

### PASS

Every named security scheme can be resolved.

### FAIL

At least one named scheme does not resolve.

### NOT_APPLICABLE

No named security requirements are used.

### Prerequisites

* Security requirements parsed.
* Security scheme declarations available.

### Compliant example

```yaml
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - apiKey: []
```

### Noncompliant example

```yaml
security:
  - apiKey: []
```

### Test requirements

Test:

* Valid named scheme.
* Missing scheme.
* Multiple alternatives.
* Operation override.
* Empty optional security requirement.
* Version-specific URI-reference behavior where applicable.
* Duplicate-finding suppression with OAIT-CON-010.

---

# 18. Duplicate-Finding Prevention

Certain rules intentionally examine related conditions.

For example:

```text
OAIT-CON-010
Security requirement resolves
```

and:

```text
OAIT-SEC-001
Security scheme used by operation is declared
```

The rules engine must avoid scoring the same defect twice.

A finding may therefore contain:

```yaml
primaryRuleId: OAIT-SEC-001

relatedRules:
  - OAIT-CON-010
```

Only the primary finding contributes to scoring.

---

# 19. Rule Dependencies

Rules may depend on other rules.

Example:

```text
OAIT-CON-003
Reference resolves
      │
      ├── FAIL
      │
      ▼
OAIT-DOC-007
Schema description present
      │
      ▼
SKIPPED
```

The documentation rule must not report:

```text
Missing description
```

for a schema that could not be loaded.

---

# 20. Proposed Dependency Relationships

| Rule    | Depends on                                |
| ------- | ----------------------------------------- |
| CON-002 | CON-001                                   |
| CON-004 | CON-003 where referenced parameters exist |
| CON-005 | CON-003 where parameter is referenced     |
| CON-006 | CON-003 where parameter is referenced     |
| CON-007 | CON-003                                   |
| CON-008 | Parsed operation                          |
| CON-009 | CON-001                                   |
| CON-010 | CON-003 where applicable                  |
| DOC-004 | CON-003                                   |
| DOC-005 | CON-003                                   |
| DOC-006 | CON-003                                   |
| DOC-007 | CON-003                                   |
| DOC-008 | CON-003                                   |
| RSP-001 | CON-008                                   |
| EXA-001 | CON-003                                   |
| EXA-002 | CON-003, RSP-001                          |
| SEC-001 | CON-003                                   |

---

# 21. Rule Instance Granularity

Rules should operate on the smallest meaningful target.

Example:

```text
OAIT-DOC-004
Parameter description present
```

If an API contains 100 parameters:

```text
95 PASS
5 FAIL
```

The engine produces:

```text
100 rule instances
5 findings
95% compliance
```

The rule should not be represented as simply:

```text
FAIL
```

for the entire API.

This instance-level model enables proportional scoring.

---

# 22. Finding Location Requirements

Every finding should provide the most precise location available.

Recommended fields:

```yaml
location:
  file: openapi.yaml
  pointer: /paths/~1customers~1{customerId}/get/parameters/0
  line: 42
  column: 7
```

At minimum, the rule engine should attempt to provide:

```text
file
JSON Pointer
```

Line and column information may depend on parser capabilities.

---

# 23. Standard Finding Structure

A v0.1 finding should support:

```yaml
ruleId: OAIT-DOC-004

title: Parameter description missing

dimension: documentation

severity: warning

detection: deterministic

sourceClass: OAIT_QUALITY

location:
  file: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0

context:
  path: /customers
  method: GET
  parameter: limit

message: >
  The query parameter "limit" does not define a description.

recommendation: >
  Add a concise description explaining the purpose of the parameter.

score:
  weight: 3
```

---

# 24. Rule Implementation Contract

Every rule implementation should conceptually expose:

```text
metadata
isApplicable(context)
evaluate(context)
```

Example conceptual interface:

```typescript
interface Rule {
  metadata: RuleMetadata;

  evaluate(context: RuleContext): RuleResult[];
}
```

The detailed TypeScript interface will be decided during architecture.

---

# 25. Rule Metadata Requirements

Each rule definition must eventually include:

```text
id
name
description
dimension
sourceClass
severity
defaultWeight
supportedOpenApiVersions
targetObjectTypes
qualityGate
dependencies
documentationUrl
```

Optional future metadata:

```text
remediation
autofix
aiAssist
deprecated
replacementRule
introducedIn
```

---

# 26. Test Fixture Convention

Each rule should have dedicated fixtures.

Recommended structure:

```text
test-data/
└── rules/
    └── OAIT-DOC-004/
        ├── pass.yaml
        ├── fail.yaml
        ├── not-applicable.yaml
        ├── referenced-pass.yaml
        └── referenced-fail.yaml
```

Complex rules may have additional fixtures.

---

# 27. Minimum Rule Test Requirements

Every v0.1 rule must test:

* PASS behavior.
* FAIL behavior.
* NOT_APPLICABLE behavior where possible.
* Correct rule ID.
* Correct severity.
* Correct target location.
* Correct OpenAPI version applicability.
* No unintended source modification.

Rules involving references must additionally test:

* Inline form.
* Referenced form.

Version-sensitive rules must have fixtures for every affected OpenAPI family.

---

# 28. Rule Test Naming

Recommended test naming:

```text
OAIT-CON-005.pass.path-required
OAIT-CON-005.fail.path-required-false
OAIT-CON-005.fail.path-required-missing
OAIT-CON-005.na.query-parameter
```

This makes failures understandable in CI.

---

# 29. Version-Aware Test Matrix

At minimum, the rules-engine test suite should contain representative specifications for:

```text
3.0.x
3.1.x
3.2.x
```

Version-specific rules must explicitly assert different expected outcomes.

Example:

```text
Response without description

3.0.x → FAIL
3.1.x → FAIL
3.2.x → depends on summary/description quality rule
```

---

# 30. OpenAPI 3.2 Operation Discovery Requirement

The rules engine must not assume that operations consist only of:

```text
get
put
post
delete
options
head
patch
trace
```

For OpenAPI 3.2, operation traversal must also understand:

```text
query
additionalOperations
```

All operation-level rules must use a shared version-aware operation-discovery abstraction.

They must not independently iterate over hard-coded HTTP methods.

---

# 31. Profile Behavior

The initial built-in profile is:

```text
default
```

All rules marked:

```text
OAIT_QUALITY
```

are enabled unless specifically noted.

Profile-oriented rules may be configured separately.

For v0.1:

```text
OAIT-EXA-001
OAIT-EXA-002
```

should remain enabled in the proposed default profile with low weights, but users may disable them.

This decision should be validated during quality-model calibration.

---

# 32. Proposed Default Quality Gates

The following rules are proposed as mandatory gates:

```text
OAIT-CON-001
OAIT-CON-002
OAIT-CON-003
```

Default global gate:

```yaml
qualityGate:
  minimumScore: 80

  maximumCriticalFindings: 0

  mandatoryRules:
    - OAIT-CON-001
    - OAIT-CON-002
    - OAIT-CON-003
```

The following rules may be promoted to mandatory gates by stricter profiles:

```text
OAIT-CON-004
OAIT-CON-005
OAIT-CON-006
OAIT-CON-007
OAIT-CON-008
OAIT-CON-009
OAIT-CON-010
OAIT-CNS-001
OAIT-CNS-002
OAIT-SEC-001
```

---

# 33. External Validator Integration

OAIT should not necessarily reimplement every normative OpenAPI validation rule.

Where an established OpenAPI validator detects a standards violation, OAIT may:

```text
External validator result
        ↓
Normalization adapter
        ↓
OAIT stable rule ID
        ↓
Finding
```

Example:

```text
validator:
Path parameter required must be true
```

becomes:

```text
OAIT-CON-005
```

This approach allows OAIT to provide a stable quality model without duplicating mature validation logic.

---

# 34. OAIT Rule Engine Responsibility

The rules engine is responsible for:

* Loading rule metadata.
* Determining applicability.
* Executing deterministic rule logic.
* Normalizing external validator results.
* Managing dependencies.
* Suppressing duplicate findings.
* Producing rule instances.
* Producing findings.
* Providing results to the scoring engine.

The scoring engine is responsible for:

* Calculating compliance.
* Applying rule weights.
* Calculating category scores.
* Calculating overall score.
* Evaluating quality gates.

The rule engine must not calculate the final overall quality score itself.

---

# 35. Review Versus Scoring Behavior

A rule can generate findings without affecting the score strongly.

For example:

```text
OAIT-GOV-001
Missing contact metadata
```

may appear prominently in the review report while having:

```text
weight: 1
```

By contrast:

```text
OAIT-CON-003
Unresolved reference
```

has:

```text
weight: 5
qualityGate: MANDATORY
```

This separation allows OAIT to express both:

```text
importance to the reviewer
```

and:

```text
effect on quality assessment
```

---

# 36. Rules Intentionally Deferred From v0.1

The following rules should not be implemented deterministically in v0.1 because reliable evaluation requires semantic judgment or further design.

### Vague operation summary

```text
OAIT-DOC-101
```

Example:

```text
summary: Get data
```

Requires semantic assessment.

---

### Parameter description repeats parameter name

```text
OAIT-DOC-102
```

Example:

```text
customerId:
  description: Customer ID
```

Primarily semantic.

---

### Generic response description

```text
OAIT-DOC-103
```

Example:

```text
description: Success
```

Requires quality interpretation.

---

### Terminology inconsistency

```text
OAIT-CNS-101
```

Example:

```text
Customer
Client
Account holder
```

may or may not represent the same concept.

---

### API design conventions

Examples:

```text
Use plural resources
Avoid verbs in paths
Use camelCase property names
```

These are organization or style conventions and must not be presented as universal OpenAPI correctness rules.

---

# 37. Future AI-Assisted Rule Ranges

The following numeric ranges are reserved provisionally:

```text
001–099   Deterministic / foundational rules
100–199   AI-assisted semantic rules
200–299   Hybrid rules
```

Example:

```text
OAIT-DOC-004
Missing parameter description
```

is deterministic.

Future:

```text
OAIT-DOC-104
Parameter description is insufficient
```

may be AI-assisted.

This numbering model should be confirmed before public rule IDs become stable.

---

# 38. Rule Stability Policy

Once a rule ID is published in a stable OAIT release:

* Its fundamental meaning must not silently change.
* Materially different behavior should receive a new rule ID.
* Deprecated rules should remain documented.
* Replacement rules should be identified.
* Score-impact changes must be documented.

Example:

```yaml
id: OAIT-DOC-004
deprecated: true
replacedBy: OAIT-DOC-014
```

---

# 39. Rule Documentation Requirements

Every public rule should eventually have generated documentation containing:

```text
Rule ID
Name
Purpose
Severity
Quality dimension
Default weight
Applicability
Examples
Configuration
Remediation guidance
OpenAPI version support
```

Documentation should be generated from canonical rule metadata where practical.

---

# 40. Rule Calibration Requirements

Before finalizing v0.1, the catalog must be tested against representative OpenAPI specifications.

The calibration process should answer:

1. Does the rule generate legitimate findings?
2. Is its applicability sufficiently narrow?
3. Does it create false positives?
4. Is the default severity appropriate?
5. Is its weight proportional to importance?
6. Does the rule unfairly penalize large specifications?
7. Does the rule overlap another rule?
8. Does the rule behave correctly across OpenAPI versions?

---

# 41. Rule Admission Checklist

A rule is ready for v0.1 implementation only when:

* [ ] Rule ID is assigned.
* [ ] Name is stable.
* [ ] Quality dimension is identified.
* [ ] Source classification is identified.
* [ ] Rationale is documented.
* [ ] Applicability is deterministic.
* [ ] PASS condition is deterministic.
* [ ] FAIL condition is deterministic.
* [ ] NOT_APPLICABLE behavior is defined.
* [ ] Prerequisites are identified.
* [ ] Severity is assigned.
* [ ] Default weight is assigned.
* [ ] Quality-gate behavior is assigned.
* [ ] Compliant example exists.
* [ ] Noncompliant example exists.
* [ ] Test cases are defined.
* [ ] OpenAPI version behavior is defined.
* [ ] Overlap with other rules has been reviewed.

---

# 42. v0.1 Rule Implementation Priority

Not all 29 rules need to be implemented simultaneously.

Recommended order:

## Wave 1 — Core Conformance

```text
OAIT-CON-001
OAIT-CON-002
OAIT-CON-003
OAIT-CON-004
OAIT-CON-005
OAIT-CON-006
OAIT-CON-008
```

This establishes the basic parsing and validation foundation.

---

## Wave 2 — Core Documentation

```text
OAIT-DOC-001
OAIT-DOC-002
OAIT-DOC-003
OAIT-DOC-004
OAIT-DOC-006
OAIT-DOC-007
OAIT-DOC-008
```

This establishes OAIT's documentation-quality differentiation.

---

## Wave 3 — Completeness and Consistency

```text
OAIT-CON-007
OAIT-CON-009
OAIT-OPS-001
OAIT-RSP-001
OAIT-CNS-001
OAIT-CNS-002
```

---

## Wave 4 — Extended Quality

```text
OAIT-DOC-005
OAIT-DOC-009
OAIT-SCH-001
OAIT-EXA-001
OAIT-EXA-002
OAIT-GOV-001
OAIT-GOV-002
OAIT-CON-010
OAIT-SEC-001
```

---

# 43. Proposed MVP Rule Subset

If an executable prototype is required before all v0.1 rules are complete, the minimum useful rule set is:

```text
OAIT-CON-001
OAIT-CON-002
OAIT-CON-003
OAIT-CON-004
OAIT-CON-005

OAIT-DOC-001
OAIT-DOC-002
OAIT-DOC-004
OAIT-DOC-006
OAIT-DOC-008

OAIT-OPS-001
OAIT-RSP-001
OAIT-CNS-001
```

This 13-rule subset is sufficient to demonstrate:

```text
Parse
  ↓
Validate
  ↓
Run rules
  ↓
Generate findings
  ↓
Calculate compliance
  ↓
Score
  ↓
Report
```

---

# 44. Requirements Traceability

| Rule group | Primary functional requirements |
| ---------- | ------------------------------- |
| OAIT-CON   | FR-VAL, FR-RUL                  |
| OAIT-DOC   | FR-REV-002, FR-REV-003          |
| OAIT-OPS   | FR-REV-004                      |
| OAIT-RSP   | FR-REV-007, FR-REV-008          |
| OAIT-SCH   | FR-REV-006                      |
| OAIT-CNS   | FR-REV-011                      |
| OAIT-EXA   | FR-REV-009                      |
| OAIT-GOV   | FR-REV, FR-RUL                  |
| OAIT-SEC   | FR-REV-010                      |

Scoring behavior traces to:

```text
FR-SCR-001
FR-SCR-002
FR-SCR-003
FR-SCR-004
FR-SCR-005
FR-SCR-009
```

---

# 45. Rule Catalog Definition of Done

The v0.1 Rule Catalog is considered baselined when:

* [ ] The initial deterministic rule set is approved.
* [ ] Every rule has a stable provisional ID.
* [ ] OAS requirements are distinguishable from OAIT quality conventions.
* [ ] Version-specific behavior is documented.
* [ ] Every rule has PASS criteria.
* [ ] Every rule has FAIL criteria.
* [ ] Every rule has NOT_APPLICABLE criteria.
* [ ] Rule prerequisites are documented.
* [ ] Rule severities are approved.
* [ ] Rule weights are approved.
* [ ] Mandatory quality gates are approved.
* [ ] Duplicate-finding relationships are identified.
* [ ] Test requirements exist for every rule.
* [ ] Rule implementation priority is established.
* [ ] The catalog is ready to drive rule-schema and rules-engine design.

---

# 46. Open Decisions

The following decisions should be resolved before rule implementation begins:

1. Will all 29 proposed rules ship in v0.1, or will some move to v0.1.x?
2. Should `OAIT-DOC-003` require an operation description in the default profile?
3. Should request and response example rules be enabled by default?
4. Should `OAIT-RSP-001` treat a `default` response as sufficient when no explicit success response exists?
5. Should `OAIT-SCH-001` remain in the default profile or move to a stricter profile?
6. Should `OAIT-GOV-001` be WARNING or INFO?
7. Should undeclared operation tags affect the default score?
8. Which conformance rules should be mapped directly from an external validator?
9. How should external validator errors be normalized to OAIT rule IDs?
10. Should `OAIT-CON-010` and `OAIT-SEC-001` be consolidated into one rule?
11. What canonical rule-definition schema will be used?
12. Will rules be defined in YAML, TypeScript, or a hybrid model?
13. How will rule implementation functions be referenced from declarative metadata?
14. Which rule properties are user-configurable?
15. How will multi-document source locations be represented?
16. How will OpenAPI 3.2 `additionalOperations` be represented internally?
17. How will version-specific aliases or rule implementations be modeled?
18. Which open-source OpenAPI validator will provide the foundational conformance layer?
19. Which benchmark specifications will be used for rule calibration?
20. When do provisional rule IDs become publicly stable?

---
