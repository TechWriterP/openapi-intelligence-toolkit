# SPIKE-006: Evaluate Validator Capabilities and Diagnostics

**Status:** Planned  
**Date:** 2026-08-10  
**Phase:** Technical Validation  
**Target release:** OAIT v0.1  
**Predecessors:** `SPIKE-001-parser-version-support.md`, `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`, `SPIKE-LOC-001-source-location-technology.md`, `SPIKE-004-openapi-3.2-operation-support.md`, `SPIKE-005-schema-and-dialect-behavior.md`  
**Related architecture:** `system-architecture.md`, `openapi-domain-model.md`, `source-processing-design.md`  
**Related quality model:** `rule-catalog.md`, `rule-schema.md`  
**Related ADRs:** `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`

---

# 1. Objective

Determine which validation approach can provide sufficiently accurate, version-aware, machine-readable, and source-correlatable OpenAPI conformance diagnostics for OAIT.

The spike must evaluate separately:

```text
CONFORMANCE DETECTION
        +
DIAGNOSTIC QUALITY
        +
OAIT ADAPTABILITY
```

A validator is not considered suitable merely because it rejects invalid input.

OAIT needs to know:

- what requirement was violated;
- whether the diagnostic is correct;
- where the violation occurred;
- which physical source document owns it;
- whether the diagnostic can be deterministically classified;
- whether it can support a stable OAIT rule ID;
- whether valid constructs produce false positives;
- whether invalid constructs produce false negatives.

---

# 2. Primary Research Question

> **Can the candidate validators provide reliable OpenAPI conformance evidence that OAIT can adapt into stable, version-aware findings without coupling OAIT's rules, severity model, or source identity to vendor-specific diagnostics?**

---

# 3. Why This Spike Exists

Previous spikes established that:

```text
PRESERVED
≠
SEMANTICALLY VALIDATED
```

SPIKE-005 demonstrated this directly.

A candidate may preserve an OpenAPI construct perfectly while its validator:

- incorrectly rejects it;
- fails to detect an invalid construct;
- reports only a generic error;
- points at the wrong object;
- loses the physical source file;
- uses unstable text as its only diagnostic identity.

OAIT therefore must not assume that parser fidelity implies validator quality.

---

# 4. Architectural Boundary Under Test

The preferred architecture is:

```text
OpenAPI source
      ↓
OAIT source processing
      ↓
Parser / normalization
      ↓
External validator
      ↓
CandidateDiagnostic[]
      ↓
Diagnostic Adapter
      ↓
OAIT conformance evidence
      ↓
OAIT Rule Engine
      ↓
OAIT Finding
```

The validator must remain replaceable.

OAIT owns:

```text
OAIT rule ID
OAIT severity
OAIT source identity
OAIT rule semantics
version applicability
finding structure
```

External validators supply evidence.

---

# 5. Important Non-Goal

SPIKE-006 does not establish:

```text
external diagnostic code
=
OAIT rule ID
```

by simple one-to-one renaming.

For example:

```text
Scalar / Redocly / IBM diagnostic
            ↓
Candidate-specific adapter
            ↓
classified conformance evidence
            ↓
OAIT-CON-005
```

The mapping is acceptable only if it is deterministic and supported by sufficient evidence.

---

# 6. Candidate Baseline

Evaluate the following exact baselines.

## Scalar

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19
```

Use its public validation capabilities.

## Redocly

```text
@redocly/openapi-core@2.40.0
```

Use its public lint/validation capabilities.

Where useful, record supported machine-readable diagnostic structures separately from human-oriented formatting.

## IBM OpenAPI Validator

```text
ibm-openapi-validator@1.37.15
```

Evaluate it as an independent validation candidate.

Its published support currently identifies OpenAPI 3.0.x and 3.1.x. Therefore OAS 3.2 support must be experimentally tested and reported rather than assumed.

Do not silently upgrade any baseline.

Any secondary-version experiment must be clearly separated.

---

# 7. Candidate Roles

The candidates are not necessarily competing for one identical architectural role.

Possible outcomes include:

```text
Scalar parser
+
Redocly validator
```

or:

```text
Scalar parser
+
OAIT deterministic conformance rules
```

or:

```text
parser validation
+
specialized independent validator
+
OAIT rules
```

The spike must therefore report capability, not prematurely force a single-library architecture.

---

# 8. Experimental Location

Use:

```text
experiments/parser-validator-spike/spike-006/
```

Suggested structure:

```text
spike-006/
├── fixtures/
│   ├── valid/
│   ├── root/
│   ├── parameters/
│   ├── references/
│   ├── responses/
│   ├── operations/
│   ├── security/
│   ├── version-awareness/
│   └── multi-file/
│
├── scalar/
│   └── evaluate.ts
│
├── redocly/
│   └── evaluate.ts
│
├── ibm/
│   └── evaluate.ts
│
├── shared/
│   ├── expected.ts
│   ├── diagnostic-evidence.ts
│   └── types.ts
│
├── results/
│   ├── scalar.json
│   ├── redocly.json
│   └── ibm.json
│
├── README.md
├── package.json
├── package-lock.json
└── tsconfig.json
```

Do not introduce production validator code.

---

# 9. Validation Oracle

Every invalid fixture must have a manually established expected result based on the applicable OpenAPI version.

Conceptually:

```typescript
interface ExpectedViolation {
  fixtureId: string;

  openApiVersion: string;

  expectedValid: boolean;

  violationClass?: string;

  oaitRuleTarget?: string;

  expectedPointer?: string;

  expectedDocument?: string;
}
```

This experiment-only oracle is authoritative for candidate comparison.

Candidate output must not define expected correctness.

---

# 10. Candidate-Neutral Diagnostic Evidence

Normalize experimental evidence into a structure similar to:

```typescript
interface CandidateDiagnosticEvidence {
  candidate: string;

  message?: string;

  severity?: string;

  code?: string;

  ruleId?: string;

  pointer?: string;

  objectPath?: string[];

  file?: string;

  line?: number;

  column?: number;

  versionContext?: string;

  raw: unknown;
}
```

This is experiment-only.

Do not promote it directly into production architecture.

---

# 11. Diagnostic Dimensions

For every expected violation record whether the candidate provides:

```text
detection
correct classification
message
severity
machine-readable code
rule identifier
JSON Pointer
object path
physical source file
line
column
OpenAPI version awareness
stable structured output
```

Each dimension must be measured independently.

---

# 12. Result Vocabulary

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
NOT_APPLICABLE
```

Additionally, diagnostic correctness analysis should use:

```text
TRUE_POSITIVE
TRUE_NEGATIVE
FALSE_POSITIVE
FALSE_NEGATIVE
```

Do not collapse these two vocabularies.

---

# 13. Fixture V1 — Valid Control

Create valid representative OAS:

```text
3.0.4
3.1.2
3.2.0
```

Each should contain:

- valid root structure;
- path operation;
- path parameter;
- response;
- schema;
- security scheme and requirement.

Expected:

```text
no conformance diagnostic
```

Vendor style/best-practice warnings must be distinguished from OAS conformance errors.

---

# 14. Fixture V2 — Missing Root `info`

Create otherwise minimal documents lacking:

```yaml
info:
```

Expected:

```text
invalid
```

Mapping target:

```text
OAIT-CON-002
```

Record whether the diagnostic identifies:

- root;
- missing `info`;
- relevant source position.

---

# 15. Fixture V3 — Invalid `info` Structure

Test separately:

```text
missing info.title
missing info.version
```

Do not combine them into one source mutation.

Mapping target:

```text
OAIT-CON-002
```

The diagnostic should ideally identify the precise missing property.

---

# 16. Fixture V4 — Version-Specific Root Structure

Test valid/invalid root requirements separately for:

```text
OAS 3.0
OAS 3.1
OAS 3.2
```

Particularly preserve the current OAIT rule-model distinction rather than assuming all versions have identical root semantics.

Mapping target:

```text
OAIT-CON-002
```

---

# 17. Fixture V5 — Path Template Parameter Missing

Example:

```yaml
paths:
  /customers/{customerId}:
    get:
      responses:
        "200":
          description: OK
```

Expected violation:

```text
customerId appears in template
but no matching path parameter exists
```

Mapping target:

```text
OAIT-CON-004
```

---

# 18. Fixture V6 — Similar but Incorrect Path Parameter Name

Example:

```text
path:
  /customers/{customerId}

declared parameter:
  customerID
```

Expected violation:

```text
template expression is not satisfied
```

This checks semantic comparison rather than mere presence of a path parameter.

Mapping target:

```text
OAIT-CON-004
```

---

# 19. Fixture V7 — Path Parameter `required: false`

Example:

```yaml
- name: customerId
  in: path
  required: false
  schema:
    type: string
```

Expected:

```text
invalid
```

Mapping target:

```text
OAIT-CON-005
```

OpenAPI requires path parameters to be required.

---

# 20. Fixture V8 — Path Parameter Missing `required`

Create a separate case where `required` is absent.

Expected violation:

```text
path parameter must explicitly be required
```

Mapping target:

```text
OAIT-CON-005
```

This must not be hidden by a default value interpretation.

---

# 21. Fixture V9 — Parameter Defines Neither Schema Nor Content

Example:

```yaml
- name: q
  in: query
```

Expected violation.

Mapping target:

```text
OAIT-CON-006
```

Record the diagnostic pointer and message specificity.

---

# 22. Fixture V10 — Parameter Defines Both Schema and Content

Create a Parameter Object containing both.

Expected violation because the representations are mutually exclusive.

Mapping target:

```text
OAIT-CON-006
```

Record whether candidate diagnostics distinguish:

```text
neither supplied
```

from:

```text
both supplied
```

---

# 23. Fixture V11 — Duplicate Parameter Identity

Within one applicable parameter list create:

```text
name = customerId
in = query
```

twice.

Expected violation:

```text
duplicate parameter identity
```

Mapping target:

```text
OAIT-CON-007
```

Record whether the diagnostic identifies:

- first declaration;
- second declaration;
- list location;
- duplicate name/location pair.

---

# 24. Fixture V12 — Valid Parameter Override Control

Create:

```text
Path Item parameter
customerId:path

Operation parameter
customerId:path
```

where the operation parameter validly overrides the Path Item declaration.

Expected:

```text
valid
```

This is an important false-positive control.

A validator that treats this as an illegal duplicate is incorrect.

---

# 25. Fixture V13 — Missing Internal Reference

Create:

```yaml
$ref: "#/components/schemas/DoesNotExist"
```

Expected violation.

Mapping target:

```text
OAIT-CON-003
```

Record:

- declaration pointer;
- failed target;
- diagnostic code;
- source location.

---

# 26. Fixture V14 — Missing Local File Reference

Create a multi-file OpenAPI Description referencing a nonexistent local file.

Expected violation.

Mapping target:

```text
OAIT-CON-003
```

This case is especially important for physical file attribution.

---

# 27. Fixture V15 — Valid Recursive Reference Control

Create a legal recursive schema.

Expected:

```text
no unresolved-reference diagnostic
```

This checks against recursion false positives.

---

# 28. Fixture V16 — Empty Responses Object

Example:

```yaml
responses: {}
```

Expected violation because an existing Responses Object must contain at least one response code.

Mapping target:

```text
OAIT-CON-008
```

Run against the relevant supported OAS families.

---

# 29. Fixture V17 — OAS 3.0 Operation Missing Responses

Create an OAS 3.0 operation without:

```yaml
responses:
```

Expected violation.

Mapping target:

```text
OAIT-CON-009
```

This is explicitly version-aware.

---

# 30. Fixture V18 — OAS 3.1/3.2 Missing Responses Control

Create equivalent 3.1 and 3.2 operations without a `responses` field.

Record normative/candidate behavior separately from OAS 3.0.

The validator must not blindly apply the OAS 3.0 `responses` requirement to later versions.

This is a high-value false-positive test.

---

# 31. Fixture V19 — Response Missing Description in OAS 3.0

Create:

```yaml
responses:
  "200": {}
```

Expected:

```text
invalid
```

because OAS 3.0 Response Object requires `description`.

Record separately from an empty Responses Object.

---

# 32. Fixture V20 — Response Missing Description in OAS 3.1

Repeat under OAS 3.1.

Expected:

```text
invalid
```

because OAS 3.1 Response Object requires `description`.

---

# 33. Fixture V21 — Response Missing Description in OAS 3.2

Repeat under OAS 3.2.

Expected:

```text
valid with respect to description presence
```

OAS 3.2 no longer marks Response `description` as required.

This is a critical version-awareness false-positive control.

---

# 34. Fixture V22 — Duplicate `operationId`

Create two operations with the same exact `operationId`.

Expected violation.

Mapping target:

```text
OAIT-CNS-001
```

Record whether the diagnostic points to:

- one operation only;
- both conflicting operations;
- document scope.

---

# 35. Fixture V23 — Case-Sensitive Operation IDs Control

Create:

```text
getCustomer
GetCustomer
```

Expected:

```text
not duplicates
```

because `operationId` comparison is case-sensitive.

This checks false-positive behavior.

---

# 36. Fixture V24 — Invalid Security Requirement

Example:

```yaml
security:
  - missingScheme: []
```

with no matching declared security scheme.

Expected violation.

Mapping targets may include:

```text
OAIT-CON-010
OAIT-SEC-001
```

The experiment must determine which OAIT layer should ultimately own the classification.

Do not automatically assign both.

---

# 37. Fixture V25 — Valid Security Requirement Control

Create a correctly declared and referenced security scheme.

Expected:

```text
no security-reference diagnostic
```

---

# 38. Fixture V26 — OpenAPI 3.2 `query` Control

Create a valid OAS 3.2 `query` operation.

Expected:

```text
valid
```

This catches validators that still use an older fixed operation model.

SPIKE-004 established parser behavior; SPIKE-006 tests diagnostic correctness.

---

# 39. Fixture V27 — OpenAPI 3.2 `additionalOperations` Control

Create a valid additional operation, for example an arbitrary HTTP method declared through `additionalOperations`.

Expected:

```text
valid
```

A false positive here represents incomplete OpenAPI 3.2 validation support.

---

# 40. Fixture V28 — OpenAPI 3.2 `querystring` Control

Create a valid:

```yaml
in: querystring
```

parameter.

Expected:

```text
valid
```

This tests validator version awareness independently of parser preservation.

---

# 41. Fixture V29 — OAS 3.1 Boolean Schema Control

Create valid boolean schemas:

```yaml
true
```

and:

```yaml
false
```

Expected:

```text
valid
```

SPIKE-005 observed Redocly diagnostic concerns here.

This fixture must explicitly retest that behavior in the systematic validation spike.

---

# 42. Fixture V30 — OAS 3.2 Boolean Schema Control

Repeat for OAS 3.2.

Expected:

```text
valid
```

---

# 43. Fixture V31 — Arbitrary Schema Keyword Control

For OAS 3.1/3.2 include:

```yaml
acmeQualityScore: 42
```

Expected:

```text
no structural-invalid diagnostic solely because the keyword is unknown
```

This retests the SPIKE-005 Redocly observation systematically.

---

# 44. Fixture V32 — OAS 3.0 Unsupported Schema Keyword

Place the same ordinary unknown JSON Schema keyword in OAS 3.0.

Record candidate behavior separately.

Do not infer 3.1/3.2 semantics.

---

# 45. Multi-Error Fixture

Create one document containing multiple independent violations.

The purpose is not to replace isolated fixtures.

Use it to measure:

- diagnostic completeness;
- ordering;
- truncation;
- cascade behavior;
- whether one fatal diagnostic prevents later useful diagnostics.

Record expected violation count/classes manually.

---

# 46. Cascading Diagnostic Analysis

For each candidate determine whether one root problem causes multiple secondary messages.

Record:

```text
primary diagnostic
secondary/cascade diagnostic
duplicate diagnostic
```

Do not count every emitted message as an independent true positive.

---

# 47. False-Positive Measurement

For each candidate compute:

```text
valid control diagnostics
unexpected conformance diagnostics
false-positive count
false-positive rate within corpus
```

Pay special attention to:

- OAS 3.2 operation features;
- boolean schemas;
- arbitrary schema keywords;
- valid parameter overrides;
- case-sensitive `operationId` control;
- recursive references;
- OAS 3.2 Response without description.

---

# 48. False-Negative Measurement

For each candidate compute:

```text
expected violations
detected violations
missed violation classes
false-negative count
```

Do not treat a generic parse failure as successful detection of every expected semantic violation.

---

# 49. Diagnostic Message Quality

Score diagnostic messages for whether they identify:

```text
what is wrong
what object is affected
expected condition
actual condition
```

Use objective evidence wherever possible.

Do not score prose style aesthetically.

---

# 50. Diagnostic Identity

Determine whether each candidate supplies a stable machine-readable identifier such as:

```text
code
ruleId
keyword
```

If only free-text messages exist, report that explicitly.

Do not manufacture candidate diagnostic codes.

---

# 51. Severity

Record candidate severity exactly as emitted.

Then separately record whether OAIT can ignore the candidate severity and apply its own.

OAIT severity must not become dependent on:

```text
candidate warning
candidate error
```

unless later architecture explicitly chooses that policy.

---

# 52. Source Location Quality

Evaluate:

```text
physical file
JSON Pointer
object path
line
column
```

independently.

Preferred external diagnostic:

```text
file
+
pointer
+
line
+
column
```

but candidate limitations may be supplemented by OAIT source evidence.

---

# 53. Multi-File Source Attribution

Create an error physically located in a referenced file.

Determine whether the validator attributes the violation to:

```text
entry document
```

or:

```text
actual referenced document
```

Record candidate transformed paths separately.

ADR-004 and ADR-005 remain authoritative for OAIT physical source identity.

---

# 54. OAIT Source-Index Correlation

For diagnostics lacking full physical locations, evaluate whether OAIT could deterministically correlate them using:

```text
candidate pointer/object path
+
OAIT SourceIndex
```

Classification:

```text
DIRECT
ADAPTABLE
AMBIGUOUS
NOT_CORRELATABLE
```

This is more important than requiring every external validator to natively produce line/column.

---

# 55. OAIT Rule-Mapping Test

Evaluate mappings for at least:

```text
OAIT-CON-002
OAIT-CON-003
OAIT-CON-004
OAIT-CON-005
OAIT-CON-006
OAIT-CON-007
OAIT-CON-008
OAIT-CON-009
OAIT-CON-010
OAIT-CNS-001
```

For every rule/candidate pair record:

```text
DIRECT_CODE
STRUCTURED_CLASSIFICATION
MESSAGE_HEURISTIC_ONLY
NOT_MAPPABLE
NOT_DETECTED
```

---

# 56. Mapping Safety Rule

Mappings based only on exact English message text are not considered architecturally stable.

For example:

```text
if message === "Path parameter must be required"
```

is not sufficient for a robust OAIT adapter.

Message text may still be retained for user-facing evidence.

---

# 57. Candidate Diagnostic Adapter Feasibility

For each candidate answer:

```text
Can OAIT adapt diagnostics
without exposing candidate types
outside packages/validator?
```

and:

```text
Can candidate replacement occur
without changing OAIT rule IDs?
```

A positive answer is essential for clean architecture.

---

# 58. Scalar-Specific Evaluation

Evaluate public Scalar `validate()` behavior.

Capture:

- `valid`;
- `errors`;
- message;
- code;
- version;
- diagnostic completeness.

Determine experimentally whether sufficient structural path/source information exists.

Do not use Scalar internals.

Scalar's current public error type is expected to be comparatively small, so adaptation feasibility must be evidence-based.

---

# 59. Redocly-Specific Evaluation

Evaluate public Redocly validation/lint APIs.

Capture:

- rule;
- severity;
- message;
- location;
- pointer/object path;
- physical source;
- line/column where available.

Keep separate:

```text
struct/conformance diagnostics
```

from:

```text
style/governance/recommended-rule diagnostics
```

OAIT conformance comparison must not be polluted by optional design-style rules.

---

# 60. Redocly Ruleset Control

Use the narrowest supported configuration appropriate for specification/conformance behavior.

Record exact configuration.

If multiple modes are required, keep evidence separate, for example:

```text
struct/spec
recommended
```

Do not compare Scalar structural validation against Redocly recommended style rules as though they were equivalent validators.

---

# 61. IBM-Specific Evaluation

Evaluate the exact IBM baseline through documented interfaces only.

Capture:

- official OAS-version support;
- JSON/machine-readable output;
- errors versus warnings;
- rule names;
- source locations;
- OAS conformance diagnostics versus IBM best-practice diagnostics.

Separate:

```text
OpenAPI conformance
```

from:

```text
IBM API style/best practices
```

Do not treat IBM-specific governance rules as OAS requirements.

---

# 62. IBM OAS 3.2 Test

Run valid and invalid OAS 3.2 fixtures even though the candidate does not currently advertise OAS 3.2 support.

Classify the result as actual observed behavior.

Possible outcomes include:

```text
SUPPORTED
PARTIAL
REJECTED_AS_UNSUPPORTED
MISINTERPRETED
```

Do not silently treat 3.1 behavior as 3.2 conformance.

---

# 63. CLI versus Programmatic API

When a candidate exposes both, evaluate separately:

```text
CLI diagnostic quality
programmatic diagnostic quality
```

OAIT production architecture prefers a programmatic adapter, but CLI evidence can still reveal supported structured output.

Do not select a CLI subprocess integration without an explicit later architecture decision.

---

# 64. Determinism

Execute every candidate against the same fixture set multiple times where practical.

Verify stable:

- diagnostic count;
- code/rule identifier;
- pointer;
- ordering.

If order changes but diagnostic identity remains stable, record that separately.

---

# 65. Source Immutability

Record SHA-256 fixture hashes before and after execution.

All persisted fixture hashes must remain unchanged.

Validators must not repair or mutate test fixtures.

---

# 66. Sanitization Warning

Do not use candidate features that automatically repair invalid OpenAPI input before validation.

For example:

```text
sanitize
upgrade
rewrite
autofix
```

must not be part of conformance evaluation.

The invalid fixture must remain invalid.

---

# 67. Machine-Readable Results

Create:

```text
results/scalar.json
results/redocly.json
results/ibm.json
```

Each should contain:

```text
environment
candidate version
candidate mode/configuration
fixture hashes
expected oracle
raw diagnostics
normalized diagnostic evidence
TP/TN/FP/FN classification
source-location evidence
OAIT mapping evidence
version-awareness results
multi-file results
mandatory gates
unexpected behavior
internal result hash
```

---

# 68. Candidate Comparison Matrix

The README must contain a matrix covering at least:

| Capability | Scalar | Redocly | IBM |
|---|---|---|---|
| OAS 3.0 validation | | | |
| OAS 3.1 validation | | | |
| OAS 3.2 validation | | | |
| Missing root detection | | | |
| Missing path parameter | | | |
| Path `required` detection | | | |
| Parameter schema/content | | | |
| Duplicate parameter identity | | | |
| Internal unresolved ref | | | |
| Missing external file | | | |
| Empty Responses Object | | | |
| 3.0 missing responses | | | |
| Response-description version awareness | | | |
| Duplicate operationId | | | |
| Security reference | | | |
| 3.2 QUERY false-positive control | | | |
| 3.2 additionalOperations control | | | |
| 3.2 querystring control | | | |
| Boolean-schema control | | | |
| Unknown-keyword control | | | |
| Machine-readable code | | | |
| Severity | | | |
| Pointer/object path | | | |
| File attribution | | | |
| Line/column | | | |
| Multi-file source attribution | | | |
| OAIT rule mapping | | | |
| Public API suitability | | | |

---

# 69. Diagnostic Accuracy Matrix

The README must also show per-fixture:

```text
expected
Scalar
Redocly
IBM
```

using:

```text
TP
TN
FP
FN
NOT_SUPPORTED
```

Do not hide individual failures behind an overall percentage.

---

# 70. Mandatory Validator Gates

Evaluate these gates explicitly.

## VG-01 — OAS 3.0

Candidate can produce reliable structural/conformance validation for OAS 3.0.

## VG-02 — OAS 3.1

Candidate can produce reliable structural/conformance validation for OAS 3.1.

## VG-03 — OAS 3.2 strategy

Candidate has either:

```text
reliable native OAS 3.2 validation
```

or an explicitly viable role in an OAIT composite validation architecture.

Failure means the candidate cannot be OAIT's sole validator.

## VG-04 — Core conformance detection

Candidate detects representative root, parameter, reference, response, operation-ID, and security violations with acceptable false-negative behavior.

## VG-05 — False-positive safety

Candidate does not systematically reject valid version-specific constructs required by OAIT.

## VG-06 — Machine-readable diagnostics

Candidate provides diagnostic output that can be programmatically consumed.

## VG-07 — Diagnostic classification

Diagnostics expose sufficient structured identity for deterministic classification without depending solely on full-message matching.

## VG-08 — Source correlation

Diagnostics are either directly source-correlatable or deterministically adaptable through OAIT SourceIndex.

## VG-09 — Multi-file strategy

Referenced-file violations can be attributed or correlated without losing physical source truth.

## VG-10 — OAIT rule mapping

Representative candidate diagnostics can be mapped to stable OAIT rule concepts without leaking candidate rule IDs into OAIT's public contract.

## VG-11 — Public supported interface

Required validation behavior is reachable through supported/public interfaces.

## VG-12 — Non-mutating validation

Validation does not require silently repairing or rewriting authoritative source.

---

# 71. Gate Interpretation

A candidate can remain useful without passing every gate as a standalone validator.

Report separately:

```text
SOLE_VALIDATOR_VIABLE
COMPOSITE_ROLE_VIABLE
NOT_VIABLE
```

Example:

A validator lacking OAS 3.2 support may fail:

```text
SOLE_VALIDATOR_VIABLE
```

while still potentially contributing to a narrower composite role.

Do not conflate these outcomes.

---

# 72. Architecture Questions

The final report must explicitly answer:

1. Should OAIT use one library for parsing and validation?
2. Should validation remain an independent adapter boundary?
3. Which candidate produces the most accurate OAS conformance diagnostics?
4. Which candidate produces the best machine-readable diagnostics?
5. Which candidate produces the best source-location evidence?
6. Can OAIT reliably map external diagnostics to its existing conformance rules?
7. Which mappings require OAIT-owned deterministic evaluation instead?
8. Should external validator rule IDs ever become public OAIT rule IDs?
9. Must OAIT own severity independently?
10. Must OAIT augment diagnostic location with SourceIndex?
11. How should multi-file diagnostic attribution work?
12. Do validators correctly distinguish OAS 3.0, 3.1, and 3.2 semantics?
13. Which valid constructs create false positives?
14. Which invalid constructs create false negatives?
15. Can IBM participate despite its stated version-support boundary?
16. Should OAIT rely primarily on external validation, OAIT-owned conformance rules, or a hybrid?
17. Does this spike justify an ADR?
18. Do any existing architecture or rule-catalog assumptions require correction?

---

# 73. Expected Architecture Direction

The likely architecture is:

```text
OAIT Source Processing
        ↓
Parser Adapter
        ↓
Normalized Domain Model
        │
        ├──── External Validator Adapter
        │            ↓
        │       Validator Evidence
        │
        └──── OAIT Deterministic Conformance Rules
                     ↓
               Stable OAIT Findings
```

SPIKE-006 must determine whether the evidence supports this direction.

It must not assume it in advance.

---

# 74. What Must Not Be Implemented

Do not implement production:

```text
ValidatorAdapter
DiagnosticAdapter
ConformanceRuleEngine
FindingMapper
SourceCorrelationService
CLI
AI
MCP
Contract Guard
```

Experimental equivalents are allowed only under:

```text
experiments/parser-validator-spike/spike-006/
```

---

# 75. Required README

The completed README must include:

1. Objective.
2. Normative assumptions.
3. Exact environment.
4. Exact candidate versions.
5. Exact candidate configurations.
6. Commands executed.
7. Fixture inventory.
8. Fixture-to-rule traceability.
9. Validation oracle.
10. OAS 3.0 findings.
11. OAS 3.1 findings.
12. OAS 3.2 findings.
13. Root-structure findings.
14. Parameter findings.
15. Reference findings.
16. Response findings.
17. Operation-ID findings.
18. Security findings.
19. Version-awareness controls.
20. False-positive analysis.
21. False-negative analysis.
22. Diagnostic message findings.
23. Diagnostic code/rule findings.
24. Severity findings.
25. Pointer/object-path findings.
26. File/line/column findings.
27. Multi-file source findings.
28. SourceIndex correlation assessment.
29. OAIT rule-mapping matrix.
30. Complete candidate comparison matrix.
31. Per-fixture accuracy matrix.
32. TypeScript/programmatic API findings.
33. CLI findings where applicable.
34. Unexpected behavior.
35. Limitations.
36. Mandatory gate results.
37. Standalone-versus-composite viability.
38. Architecture implications.
39. Candidate continuation recommendation.
40. ADR recommendation.
41. Follow-up actions.

---

# 76. Exit Criteria

SPIKE-006 is complete when OAIT can answer:

> **Which validation approach provides sufficiently correct and actionable OpenAPI conformance evidence, and how should that evidence be integrated into OAIT without coupling stable OAIT findings to third-party validator semantics?**

Completion requires:

- valid controls;
- isolated invalid fixtures;
- cross-version controls;
- multi-file diagnostics;
- Scalar evidence;
- Redocly evidence;
- IBM evidence;
- TP/TN/FP/FN analysis;
- source-correlation analysis;
- OAIT mapping analysis;
- machine-readable results;
- 12 mandatory gates;
- architecture conclusions;
- standalone/composite-role recommendation.

---

# 77. Follow-Up Relationship

After SPIKE-006:

```text
SPIKE-006
Validator capabilities / diagnostics
        ↓
SPIKE-007
Performance / operational suitability
        ↓
Parser-validator evaluation summary
        ↓
Technology decision
        ↓
ADR(s)
        ↓
Production implementation design
```

Do not create the final parser/validator ADR during SPIKE-006.

---

# 78. Guiding Principle

> **Third-party validators may detect the problem; OAIT must own what the problem means.**