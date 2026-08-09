# SPIKE-001: Parser and OpenAPI Version Support

**Status:** Planned
**Date:** 2026-08-09
**Phase:** Technical Validation
**Target release:** OAIT v0.1
**Related documents:** `parser-validator-spike-plan.md`, `openapi-domain-model.md`, `ADR-003-normalized-openapi-domain-model.md`

---

## 1. Objective

Evaluate whether candidate TypeScript/Node.js OpenAPI libraries can reliably load representative OpenAPI 3.0.x, 3.1.x, and 3.2.x specifications and expose enough structured information for OAIT to construct its normalized OpenAPI domain model.

This spike is an experiment.

It does not select the production parser.

---

## 2. Candidates

Initial candidates:

```text
Candidate A
@scalar/openapi-parser

Candidate B
@redocly/openapi-core
```

Additional candidates should be introduced only if these candidates expose important limitations or another library provides a materially different architecture.

---

## 3. Scope

SPIKE-001 evaluates only:

* Package installation.
* TypeScript integration.
* YAML input.
* JSON input.
* OpenAPI 3.0.x loading.
* OpenAPI 3.1.x loading.
* OpenAPI 3.2.x loading.
* Version-field preservation.
* Access to basic OpenAPI structures.
* Basic parser/validator diagnostics.
* Basic programmatic API ergonomics.

The following are deliberately deferred:

```text
$ref provenance
multi-file resolution
recursive references
source locations
line/column locations
OpenAPI 3.2 query
additionalOperations
schema dialect behavior
performance benchmarking
```

Those belong to subsequent spikes.

---

# 4. Test Versions

Use the following OpenAPI versions:

```text
3.0.4
3.1.2
3.2.0
```

Each version must be tested independently.

---

# 5. Fixture Set

Create:

```text
experiments/
└── parser-validator-spike/
    └── spike-001/
        ├── fixtures/
        │   ├── openapi-3.0.yaml
        │   ├── openapi-3.0.json
        │   ├── openapi-3.1.yaml
        │   ├── openapi-3.1.json
        │   ├── openapi-3.2.yaml
        │   └── openapi-3.2.json
        │
        ├── scalar/
        ├── redocly/
        │
        ├── results/
        │   ├── scalar.json
        │   └── redocly.json
        │
        └── README.md
```

---

# 6. Common Fixture Design

All six fixtures should describe the same logical API as closely as possible.

Use:

```text
API title:
OAIT Parser Spike API

API version:
1.0.0
```

Define:

```text
GET /pets/{petId}
```

with:

```text
operationId:
getPet

summary:
Get a pet
```

and a required path parameter:

```text
petId
```

of type:

```text
string
```

---

# 7. Response

Define:

```text
200
```

with:

```text
application/json
```

returning:

```text
Pet
```

---

# 8. Schema

Define a reusable:

```text
Pet
```

schema containing:

```text
id
name
```

Both properties should be strings.

`id` and `name` should be required.

---

# 9. Security

Define one API-key security scheme:

```text
ApiKeyAuth
```

using a request header.

Apply it to the `GET /pets/{petId}` operation.

This ensures the parser exposes several structures needed by the future normalized model.

---

# 10. Fixture Equivalence

For each OpenAPI version:

```text
YAML fixture
```

and:

```text
JSON fixture
```

must describe the same logical API.

The only intended representation difference should be:

```text
YAML versus JSON
```

The OpenAPI version value will naturally differ across version-family fixtures.

---

# 11. Required Observations

For every candidate and every fixture, record whether the library can obtain:

```text
OpenAPI version
API title
API version
paths
GET operation
operationId
operation summary
path parameter
responses
200 response
Pet schema
security scheme
```

---

# 12. Expected Logical Values

The expected observations are:

```yaml
title: OAIT Parser Spike API

apiVersion: 1.0.0

path: /pets/{petId}

method: GET

operationId: getPet

summary: Get a pet

parameter:
  name: petId
  in: path
  required: true

response:
  selector: "200"

schema:
  name: Pet
  required:
    - id
    - name

securityScheme:
  name: ApiKeyAuth
  type: apiKey
```

---

# 13. Candidate Test Procedure

For each candidate:

1. Install the package.
2. Record the exact installed version.
3. Create the smallest supported TypeScript integration.
4. Process each of the six fixtures.
5. Capture success or failure.
6. Read the parsed or bundled result.
7. Extract the required observations.
8. Capture diagnostics.
9. Write the results to JSON.
10. Do not normalize the candidate output into OAIT domain objects yet.

The objective is to understand the candidate's native behavior first.

---

# 14. Result States

Use:

```text
PASS
PARTIAL
FAIL
```

### PASS

The candidate loads the document and exposes the expected data correctly.

### PARTIAL

The candidate processes the file but loses, transforms, rejects, or obscures information needed by the test.

### FAIL

The candidate cannot successfully process the fixture.

---

# 15. Required Result Structure

Each candidate result should use approximately:

```json
{
  "candidate": "@candidate/package",
  "installedVersion": "x.y.z",
  "runtime": {
    "node": "x.y.z"
  },
  "fixtures": [
    {
      "file": "openapi-3.0.yaml",
      "declaredOpenApiVersion": "3.0.4",
      "status": "PASS",
      "observed": {
        "openapi": "3.0.4",
        "title": "OAIT Parser Spike API",
        "apiVersion": "1.0.0",
        "pathFound": true,
        "getOperationFound": true,
        "operationId": "getPet",
        "summary": "Get a pet",
        "parameterFound": true,
        "response200Found": true,
        "petSchemaFound": true,
        "securitySchemeFound": true
      },
      "diagnostics": []
    }
  ]
}
```

The exact implementation may add fields but must preserve the same comparable information.

---

# 16. Version Support Test

A candidate receives a version `PASS` only if:

```text
fixture is processed successfully
+
declared OpenAPI version survives intact
+
basic structures remain accessible
```

Simply accepting a string without understanding its structure is insufficient evidence.

---

# 17. YAML/JSON Equivalence Test

For each version:

```text
YAML observations
```

must be compared against:

```text
JSON observations
```

Expected:

```text
Equivalent logical observations
```

Source-format-specific metadata may differ.

---

# 18. Mutation Check

Capture the value of the input before and after processing.

Record whether the candidate:

```text
preserves
modifies
sanitizes
upgrades
bundles
dereferences
```

the document during the API being tested.

SPIKE-001 should prefer non-mutating APIs.

Do not intentionally invoke APIs that upgrade or sanitize specifications.

---

# 19. Error Test

Create one additional intentionally malformed file:

```text
invalid.yaml
```

containing syntactically invalid YAML.

Determine:

* Whether the API throws.
* Whether it returns a structured error.
* Error type.
* Error message.
* Whether a location is available.

This is exploratory only; detailed diagnostics are covered by SPIKE-006.

---

# 20. TypeScript Integration Test

Record:

```text
Can package be imported cleanly?
Are useful types exported?
Does TypeScript compile without workarounds?
Are public APIs documented?
Does integration require internal/private APIs?
```

Any use of undocumented package internals must be explicitly recorded as a negative result.

---

# 21. Candidate-Specific Guidance

## Scalar

Evaluate only public documented APIs.

Particularly observe:

```text
validation result
dereferenced result where needed only for inspection
error representation
TypeScript types
```

Do not use `sanitize()` or `upgrade()` during this spike because OAIT must not silently repair or change input during deterministic analysis.

---

## Redocly

Use only interfaces explicitly documented as safe for external use.

Potential APIs include:

```text
bundle
bundleFromString
lint
lintFromString
loadConfig
createConfig
```

Record whether obtaining a parsed document requires a bundling operation and whether bundling changes the representation in ways relevant to OAIT.

The fact that a package works technically is not sufficient if OAIT would need to depend on undocumented internal interfaces.

---

# 22. Acceptance Criteria

SPIKE-001 is complete when:

* [ ] Six valid fixtures exist.
* [ ] One malformed fixture exists.
* [ ] Scalar has been tested against all fixtures.
* [ ] Redocly has been tested against all fixtures.
* [ ] Exact package versions are recorded.
* [ ] Node.js version is recorded.
* [ ] YAML support is recorded.
* [ ] JSON support is recorded.
* [ ] OpenAPI 3.0.4 support is recorded.
* [ ] OpenAPI 3.1.2 support is recorded.
* [ ] OpenAPI 3.2.0 support is recorded.
* [ ] Basic OpenAPI structures are inspected.
* [ ] YAML/JSON equivalence is evaluated.
* [ ] TypeScript integration is evaluated.
* [ ] Input mutation behavior is recorded.
* [ ] Malformed-input behavior is recorded.
* [ ] Machine-readable result files exist.
* [ ] Observations are based on execution rather than documentation claims.

---

# 23. Expected Outcome

This spike should answer:

> Which candidates deserve to continue to the `$ref`, source-location, and OpenAPI 3.2-specific technical spikes?

It should **not** answer:

> Which parser will OAIT permanently use?

Parser selection occurs only after subsequent evidence is available.

---