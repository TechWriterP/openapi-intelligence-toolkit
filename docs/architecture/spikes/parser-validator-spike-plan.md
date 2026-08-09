# OpenAPI Intelligence Toolkit (OAIT)

## Parser and Validator Technical Spike Plan

**Document version:** 0.1
**Project status:** Technical Validation
**Release applicability:** OAIT v0.1
**Related documents:** `system-architecture.md`, `openapi-domain-model.md`, `ADR-001-use-typescript-nodejs.md`, `ADR-002-use-monorepo.md`, `ADR-003-normalized-openapi-domain-model.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

# 1. Purpose

This document defines the technical spike plan for evaluating the OpenAPI parsing, reference-resolution, source-location, and validation capabilities required by OAIT v0.1.

The purpose of this phase is to validate architectural assumptions before selecting implementation libraries.

The spikes will provide evidence for later decisions concerning:

* OpenAPI parser selection.
* Validator selection.
* Reference resolver strategy.
* Source-location strategy.
* OpenAPI 3.2 support.
* Schema-dialect handling.
* Third-party library adapters.
* Parser/validator package boundaries.

---

# 2. Why Technical Spikes Are Required

OAIT architecture currently assumes that the implementation can reliably perform:

```text
YAML / JSON
      ↓
Parse
      ↓
Detect OpenAPI version
      ↓
Resolve references
      ↓
Preserve source locations
      ↓
Normalize
      ↓
Validate
```

However, these assumptions depend heavily on the capabilities of actual OpenAPI libraries.

A library may:

* Parse OpenAPI 3.0 but not 3.2.
* Validate but not preserve locations.
* Dereference `$ref` but lose reference provenance.
* Support single-file specifications but not multi-file specifications.
* Support OpenAPI 3.1 but mishandle JSON Schema semantics.
* Bundle files but destroy physical source ownership.
* Produce diagnostics that are difficult to map to OAIT rule IDs.

Therefore OAIT must experimentally evaluate candidate technologies before committing to them.

---

# 3. Technical Spike Principle

> **A technology choice is not accepted because its documentation says it supports a feature; it is accepted only after OAIT verifies the feature against representative fixtures and records the evidence.**

---

# 4. Questions This Phase Must Answer

The spike phase must answer:

1. Which TypeScript/Node.js parser best supports OAIT?
2. Can it parse OpenAPI 3.0.x?
3. Can it parse OpenAPI 3.1.x?
4. Can it parse OpenAPI 3.2.x?
5. Does it recognize OpenAPI 3.2 `query` operations?
6. Does it recognize `additionalOperations`?
7. Can it resolve internal `$ref`?
8. Can it resolve local multi-file `$ref`?
9. Can it safely handle recursive references?
10. Can it preserve the physical source file of referenced objects?
11. Can it preserve JSON Pointer locations?
12. Can line and column information be obtained?
13. Does dereferencing retain enough provenance for OAIT?
14. Can schemas be accessed without corrupting JSON Schema semantics?
15. Can OpenAPI 3.1/3.2 boolean schemas be represented?
16. Can schema dialect information be retained?
17. Which validator provides useful conformance diagnostics?
18. Can validator errors be mapped to OAIT rule IDs?
19. Can parsing and validation be independently abstracted?
20. What performance is observed on representative specifications?

---

# 5. Candidate Categories

The spike will evaluate tools in separate categories.

## Parser / Resolver Candidates

Initial candidates include:

```text
@scalar/openapi-parser
@redocly/openapi-core
@apidevtools/swagger-parser
```

Additional candidates may be added if technical research identifies a strong alternative.

No candidate is considered selected at this stage.

---

## Validator Candidates

Initial candidates include:

```text
Redocly validation capabilities
Scalar validation capabilities
IBM OpenAPI Validator
other standards-focused validators identified during spike research
```

OAIT may ultimately use:

```text
one library for parsing
+
another library for validation
```

if that provides a cleaner architecture.

---

# 6. Candidate Evaluation Philosophy

Candidate selection must not be based primarily on:

* GitHub stars.
* Popularity.
* Brand recognition.
* Number of npm downloads.
* Feature-marketing claims.

Selection should be based on OAIT requirements.

Priority areas are:

```text
OpenAPI version support
Reference behavior
Source traceability
Diagnostic quality
TypeScript integration
Maintainability
Library stability
Security
Performance
Replaceability
```

---

# 7. Spike Sequence

The technical validation phase will consist of the following spikes.

```text
SPIKE-001
Parser and version support
        ↓
SPIKE-002
Reference resolution and multi-file behavior
        ↓
SPIKE-003
Source-location preservation
        ↓
SPIKE-004
OpenAPI 3.2 operation support
        ↓
SPIKE-005
Schema and dialect behavior
        ↓
SPIKE-006
Validator capabilities and diagnostics
        ↓
SPIKE-007
Performance and operational suitability
        ↓
Technology decision
        ↓
ADR(s)
```

---

# 8. SPIKE-001 — Parser and Version Support

## Objective

Determine whether each parser candidate can correctly load representative OpenAPI documents across the supported version families.

---

## Inputs

Fixtures:

```text
openapi-3.0.yaml
openapi-3.1.yaml
openapi-3.2.yaml
openapi-3.0.json
openapi-3.1.json
openapi-3.2.json
```

Each fixture should contain:

* `info`.
* At least two operations.
* Parameters.
* Request body.
* Responses.
* Schemas.
* Security definition.

---

## Tests

For each candidate:

1. Parse YAML.
2. Parse JSON.
3. Detect OpenAPI version.
4. Access paths.
5. Access operations.
6. Access schemas.
7. Access parameters.
8. Access responses.

---

## Expected Evidence

Record:

```text
PASS
FAIL
PARTIAL
```

for each capability.

---

# 9. SPIKE-002 — Reference Resolution and Multi-File Behavior

## Objective

Determine whether reference resolution meets the needs of the OAIT normalized domain model.

---

## Fixtures

```text
references/
├── internal/
│   └── openapi.yaml
│
├── multi-file/
│   ├── openapi.yaml
│   ├── paths/
│   │   └── customers.yaml
│   └── schemas/
│       └── customer.yaml
│
└── recursive/
    ├── openapi.yaml
    └── schemas/
        └── node.yaml
```

---

## Tests

Evaluate:

* Internal references.
* Relative file references.
* Nested references.
* Recursive references.
* Unresolved references.
* Circular references.
* Missing files.
* Reference siblings where applicable.

---

## Critical Question

Does the library provide only:

```text
resolved object
```

or can OAIT determine:

```text
where the $ref was declared
+
what it referenced
+
where the resolved object came from
```

This distinction is essential for:

* Findings.
* Multi-file reporting.
* Diff.
* Enhancer.
* Contract Guard.

---

# 10. SPIKE-003 — Source-Location Preservation

## Objective

Determine whether OAIT can preserve precise physical source locations.

Required target model:

```yaml
documentUri: file:///repo/schemas/customer.yaml
filePath: schemas/customer.yaml
pointer: /Customer/properties/customerId
line: 18
column: 5
```

---

## Minimum Acceptance

OAIT must be able to obtain:

```text
physical source document
+
JSON Pointer
```

for objects that may generate findings.

---

## Desired Acceptance

Also obtain:

```text
line
column
```

without reparsing source independently.

---

## Test Targets

Capture source locations for:

* Operation.
* Parameter.
* Response.
* Schema.
* Schema property.
* Referenced schema.
* Referenced parameter.

---

# 11. SPIKE-004 — OpenAPI 3.2 Operation Support

## Objective

Verify real handling of OpenAPI 3.2-specific operation structures.

---

## Fixture Requirements

Create a valid OpenAPI 3.2 document containing:

```text
GET
POST
QUERY
additionalOperations
```

---

## Required Tests

Determine whether the candidate:

* Parses `query`.
* Preserves `query`.
* Exposes `query` through traversal.
* Handles `additionalOperations`.
* Preserves custom HTTP method names.
* Allows OAIT to normalize all of them into `NormalizedOperation`.

---

## Expected Result

OAIT should be able to build:

```text
NormalizedOperation[]
```

without hard-coding only traditional HTTP methods.

---

# 12. SPIKE-005 — Schema and Dialect Behavior

## Objective

Determine whether parser/validator candidates preserve schema semantics across OpenAPI versions.

---

## Fixtures

Include:

```text
OpenAPI 3.0 schema
OpenAPI 3.1 schema
OpenAPI 3.2 schema
boolean schema
recursive schema
oneOf
anyOf
allOf
nullable-related constructs
custom schema keyword
schema dialect declaration
```

---

## Tests

Verify that the candidate:

* Does not silently remove unknown schema keywords.
* Handles boolean schemas where applicable.
* Preserves schema composition.
* Preserves dialect information.
* Handles recursion.
* Does not incorrectly convert 3.0 schema semantics into 3.1 semantics.

---

# 13. SPIKE-006 — Validator Capabilities and Diagnostics

## Objective

Determine which validation approach can provide reliable OpenAPI conformance information suitable for OAIT.

---

## Required Tests

Provide intentionally invalid fixtures for:

```text
missing required root field
invalid path parameter
required path parameter false
duplicate parameter identity
unresolved reference
invalid response structure
duplicate operationId
invalid security reference
```

---

## Evaluate Diagnostic Output

For each validator determine whether diagnostics include:

* Error message.
* Severity.
* Object path.
* JSON Pointer.
* File name.
* Line number.
* OpenAPI version context.
* Machine-readable diagnostic code.

---

## Mapping Test

Determine whether:

```text
external validator diagnostic
```

can reliably become:

```text
OAIT-CON-xxx
```

Example:

```text
External validator
Path parameter must be required
          ↓
Diagnostic Adapter
          ↓
OAIT-CON-005
```

---

# 14. SPIKE-007 — Performance and Operational Suitability

## Objective

Verify that shortlisted libraries are operationally reasonable for OAIT.

---

## Test Classes

### Small

```text
< 20 operations
```

### Medium

```text
approximately 100 operations
```

### Large

```text
approximately 500 operations
```

These are engineering benchmark classes rather than hard product limits.

---

## Measurements

Capture:

```text
parse duration
reference-resolution duration
validation duration
memory usage
```

Exact performance acceptance thresholds will be calibrated against the NFRs.

---

# 15. Test Corpus

Create:

```text
test-data/
└── technical-spikes/
    └── parser-validator/
        ├── versions/
        │   ├── openapi-3.0.yaml
        │   ├── openapi-3.1.yaml
        │   ├── openapi-3.2.yaml
        │   └── json/
        │
        ├── references/
        │   ├── internal/
        │   ├── multi-file/
        │   ├── recursive/
        │   └── invalid/
        │
        ├── openapi-3.2/
        │   ├── query.yaml
        │   └── additional-operations.yaml
        │
        ├── schemas/
        │   ├── boolean.yaml
        │   ├── recursive.yaml
        │   ├── composition.yaml
        │   └── dialect.yaml
        │
        └── validation/
            ├── invalid-path-parameter.yaml
            ├── duplicate-operation-id.yaml
            ├── invalid-reference.yaml
            └── invalid-security.yaml
```

The same corpus must be used for all candidates where possible.

---

# 16. Experimental Workspace

Spike code should not initially enter the production package structure.

Recommended:

```text
experiments/
└── parser-validator-spike/
    ├── scalar/
    ├── redocly/
    ├── apidevtools/
    ├── ibm-validator/
    └── results/
```

This keeps experimental integration code separate from production architecture.

After a technology is selected:

```text
experiment
    ↓
decision
    ↓
ADR
    ↓
production implementation
```

Do not promote experimental code automatically into `packages/parser`.

---

# 17. Spike Result Format

Each candidate should receive an evidence report.

Example:

```yaml
candidate: example-parser
version: x.y.z

openapi:
  3.0: PASS
  3.1: PASS
  3.2: PARTIAL

references:
  internal: PASS
  localFiles: PASS
  recursive: PASS

sourceLocations:
  document: PASS
  pointer: PASS
  line: FAIL
  column: FAIL

openapi32:
  query: PASS
  additionalOperations: FAIL

schemas:
  boolean: PASS
  dialect: PARTIAL

validation:
  available: PASS
  diagnosticPointer: PASS
```

Every `PARTIAL` or `FAIL` must include an explanation.

---

# 18. Candidate Decision Matrix

After the spikes, candidates should be compared using a weighted matrix.

Proposed weights:

| Criterion                       |   Weight |
| ------------------------------- | -------: |
| OpenAPI 3.0/3.1/3.2 support     |      20% |
| `$ref` and multi-file support   |      15% |
| Source traceability             |      15% |
| Schema semantic fidelity        |      10% |
| Validation capability           |      10% |
| Diagnostic quality              |      10% |
| TypeScript integration          |       5% |
| API stability / maintainability |       5% |
| Performance                     |       5% |
| License and OSS suitability     |       5% |
| **Total**                       | **100%** |

Weights may be adjusted before final evaluation.

---

# 19. Mandatory Selection Gates

Regardless of weighted score, the primary parser must satisfy mandatory requirements.

At minimum:

```text
OpenAPI 3.0 support
OpenAPI 3.1 support
OpenAPI 3.2 strategy
YAML support
JSON support
local $ref support
multi-file strategy
recursive-reference strategy
usable TypeScript/JavaScript API
Apache-2.0 compatible dependency license
```

A candidate cannot compensate for a mandatory failure simply through a high aggregate score.

---

# 20. Source-Location Gate

Because OAIT depends heavily on actionable findings, source-location capability receives special treatment.

Preferred:

```text
file
JSON Pointer
line
column
```

Minimum acceptable:

```text
file
JSON Pointer
```

If no candidate provides adequate source locations directly, OAIT must evaluate a hybrid approach before accepting a parser.

---

# 21. Architecture Evaluation Questions

For every candidate, record:

### Coupling

Would OAIT's domain model become coupled to candidate-specific types?

### Abstraction

Can the library remain behind:

```text
packages/parser
```

or:

```text
packages/validator
```

interfaces?

### Replaceability

How difficult would migration to another library be?

### Side effects

Does parsing:

* mutate input?
* rewrite specifications?
* flatten references?
* change schemas?

### Security

Can:

* network resolution be disabled?
* file access be constrained?
* remote references be controlled?

These are essential to OAIT's local-first security model.

---

# 22. Spike Evidence Rules

Every technical conclusion should identify:

```text
candidate
candidate version
fixture
test
observed output
result
```

Example:

```text
Candidate:
example-parser 2.3.0

Fixture:
openapi-3.2-query.yaml

Test:
Does parser preserve Path Item query operation?

Observed:
query field available as operation object

Result:
PASS
```

This prevents architecture decisions from being based on memory or assumptions.

---

# 23. Spike Result Artifacts

Expected outputs:

```text
docs/
└── architecture/
    └── spikes/
        ├── parser-validator-spike-plan.md
        ├── SPIKE-001-parser-version-support.md
        ├── SPIKE-002-reference-resolution.md
        ├── SPIKE-003-source-locations.md
        ├── SPIKE-004-openapi-3.2.md
        ├── SPIKE-005-schema-dialects.md
        ├── SPIKE-006-validator-diagnostics.md
        ├── SPIKE-007-performance.md
        └── parser-validator-evaluation-summary.md
```

We do not need to create all result files before running the experiments.

Each should be created when its experiment is performed.

---

# 24. Decisions Expected After Spikes

The technical evidence should enable the following decisions.

## Parser strategy

Example future ADR:

```text
ADR-004-select-openapi-parser.md
```

only if parser choice warrants a dedicated architectural decision.

---

## Validator strategy

```text
ADR-005-openapi-validator-adapter.md
```

This should establish:

* Whether parser and validator are the same library.
* Whether multiple validators are used.
* How diagnostics are normalized.
* How OAIT isolates validator-specific behavior.

---

## Rule architecture

Later:

```text
ADR-006-rule-metadata-handler-model.md
```

This decision does not depend entirely on parser selection but should follow validation of the domain-model assumptions.

---

# 25. What We Must Not Do Yet

During this phase, do not:

```text
create the final parser package around an untested library

create every v0.1 rule

lock a validator into core types

design AI integration

implement MCP

start release-note generation

publish package APIs
```

The objective is to reduce technical uncertainty first.

---

# 26. Spike Exit Criteria

The parser/validator technical validation phase is complete when:

* [ ] OpenAPI 3.0 parsing has been tested.
* [ ] OpenAPI 3.1 parsing has been tested.
* [ ] OpenAPI 3.2 parsing has been tested.
* [ ] YAML and JSON have been tested.
* [ ] Local references have been tested.
* [ ] Multi-file references have been tested.
* [ ] Recursive references have been tested.
* [ ] Source file preservation has been tested.
* [ ] JSON Pointer preservation has been tested.
* [ ] Line/column availability has been evaluated.
* [ ] `query` has been tested.
* [ ] `additionalOperations` has been tested.
* [ ] Boolean schemas have been tested.
* [ ] Schema dialect behavior has been evaluated.
* [ ] Validator diagnostics have been tested.
* [ ] Candidate performance has been measured.
* [ ] Candidate comparison matrix has been completed.
* [ ] Preferred parser strategy is identified.
* [ ] Preferred validator strategy is identified.
* [ ] Known limitations are documented.
* [ ] Required ADRs can be written using experimental evidence.

---