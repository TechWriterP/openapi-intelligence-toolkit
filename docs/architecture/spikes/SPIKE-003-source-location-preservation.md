# SPIKE-003: Source-Location Preservation

**Status:** Planned
**Date:** 2026-08-09
**Phase:** Technical Validation
**Target release:** OAIT v0.1
**Predecessors:** `SPIKE-001-parser-version-support.md`, `SPIKE-002-reference-resolution.md`
**Related documents:** `parser-validator-spike-plan.md`, `openapi-domain-model.md`, `ADR-003-normalized-openapi-domain-model.md`

---

## 1. Objective

Evaluate whether OAIT can reliably associate OpenAPI objects and reference declarations with precise physical source locations across YAML, JSON, single-file, and multi-file OpenAPI descriptions.

The spike must determine whether candidate-native location capabilities are sufficient or whether OAIT requires an independent source-location index as part of its owned source-loading/reference-evidence layer.

This spike does not select the production parser.

---

## 2. Candidates

Continue with the candidate versions already evaluated:

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19
@redocly/openapi-core@2.40.0
```

The versions should remain fixed so that SPIKE-003 is comparable with SPIKE-001 and SPIKE-002.

---

## 3. Why This Spike Matters

OAIT findings must eventually point users to the source that caused the finding.

For example:

```text
OAIT-DOC-004
Parameter description is missing.

schemas/pets.yaml
/pets/{petId}/get/parameters/0
Line 42, column 7
```

The architecture therefore defines:

```ts
interface SourceLocation {
  documentUri: string;
  filePath?: string;
  pointer: string;
  line?: number;
  column?: number;
}
```

SPIKE-002 established that OAIT should collect source/reference evidence before candidate transformation.

SPIKE-003 now determines whether that evidence can include dependable:

```text
document identity
+
JSON Pointer
+
line
+
column
```

---

## 4. Primary Research Question

> **Can OAIT reliably map normalized logical OpenAPI entities back to their original physical file and JSON Pointer, with usable line and column information where practical?**

---

## 5. Required Architectural Distinction

The spike must distinguish three different concepts.

### 5.1 Logical location

Example:

```text
GET /pets/{petId}
parameter petId
```

This identifies an OAIT domain entity.

### 5.2 Structural source location

Example:

```text
file:///repo/openapi.yaml
/paths/~1pets~1{petId}/get/parameters/0
```

This identifies an object in the source document.

### 5.3 Presentation location

Example:

```text
line: 18
column: 9
```

This identifies where a human should look in an editor.

OAIT must not treat these concepts as interchangeable.

---

## 6. Minimum Architectural Requirement

The minimum acceptable source evidence for significant OAIT entities is:

```text
document URI
+
JSON Pointer
```

Line and column are strongly desirable but are not required to be part of the stable semantic identity.

This follows the domain-model principle:

> JSON Pointer is the minimum stable object location; line and column are presentation metadata.

---

## 7. Experimental Structure

Create:

```text
experiments/
└── parser-validator-spike/
    └── spike-003/
        ├── fixtures/
        │   ├── yaml/
        │   ├── json/
        │   ├── multi-file/
        │   ├── references/
        │   ├── duplicate-values/
        │   ├── whitespace/
        │   └── invalid/
        │
        ├── scalar/
        │   └── index.ts
        ├── redocly/
        │   └── index.ts
        ├── shared/
        ├── results/
        │   ├── scalar.json
        │   └── redocly.json
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        └── README.md
```

Do not create production code under `packages/`.

---

# 8. Target Entities

The spike must attempt to locate at least:

```text
OpenAPI root
Info Object
Path Item
Operation
Parameter
Request Body
Response
Schema
Schema property
Tag
Security Scheme
$ref declaration
referenced target
```

This set represents the main v0.1 domain entities that may generate findings.

---

# 9. Fixture A — YAML Source Locations

Create a YAML OpenAPI document with deliberately controlled formatting.

It should contain:

```text
GET /pets/{petId}
POST /pets
path parameter
query parameter
request body
200 response
400 response
Pet schema
Error schema
tags
security scheme
```

Before running the experiment, manually establish expected locations for selected objects.

Example evidence:

```yaml
target: getPet
pointer: /paths/~1pets~1{petId}/get
expectedLine: 14
expectedColumn: 5
```

Do not derive the expected values from the candidate under test.

---

# 10. Fixture B — JSON Source Locations

Create a JSON representation of the same logical API.

Verify whether OAIT can obtain:

```text
document
pointer
line
column
```

for the same logical entities.

The goal is not for YAML and JSON line numbers to match.

The goal is:

```text
same logical entity
+
correct source-specific location
```

---

# 11. Fixture C — Multi-File Locations

Create:

```text
multi-file/
├── openapi.yaml
├── paths/
│   └── pets.yaml
└── schemas/
    ├── Pet.yaml
    └── Error.yaml
```

The entry document should reference operations and schemas from external files.

The experiment must determine whether an entity defined in:

```text
schemas/Pet.yaml
```

can be located as:

```text
documentUri → Pet.yaml
pointer → original pointer within Pet.yaml
line/column → original Pet.yaml position
```

rather than its location in a bundled representation.

---

# 12. Fixture D — Reference Declaration Versus Target

This is one of the most important tests.

Given:

```yaml
schema:
  $ref: "./schemas/Pet.yaml"
```

record two locations independently.

### Declaration location

Where the `$ref` appears:

```text
openapi.yaml
/paths/.../schema/$ref
```

### Target location

Where the referenced schema begins:

```text
schemas/Pet.yaml
/
```

The spike must determine whether candidate APIs distinguish these or whether OAIT must construct this distinction.

---

# 13. Fixture E — Nested Reference Locations

Use:

```text
openapi.yaml
   ↓
models.yaml#/Pet
   ↓
common.yaml#/Identifier
```

Attempt to produce an ordered evidence chain:

```text
Hop 1
declaration:
  openapi.yaml + pointer + line/column
target:
  models.yaml#/Pet + line/column

Hop 2
declaration:
  models.yaml + pointer + line/column
target:
  common.yaml#/Identifier + line/column
```

This directly tests the future `ReferenceHop[]` concept.

---

# 14. Fixture F — Duplicate Scalar Values

Location mapping must not depend on searching the raw file for a value.

Create repeated values such as:

```yaml
description: Identifier
```

in several unrelated objects.

Then request locations for each object.

A strategy that merely performs string search would incorrectly map identical values.

The candidate or OAIT-owned approach must locate objects structurally.

---

# 15. Fixture G — Arrays

Include several parameters:

```yaml
parameters:
  - ...
  - ...
  - ...
```

Verify correct locations for:

```text
/parameters/0
/parameters/1
/parameters/2
```

Array indices must map predictably into JSON Pointer.

---

# 16. Fixture H — Escaped JSON Pointer Tokens

Include keys containing characters requiring JSON Pointer escaping.

Examples:

```text
/
~
```

Verify canonical pointer encoding:

```text
~1
~0
```

This is essential for paths such as:

```text
/pets/{petId}
```

where the path key itself contains `/`.

---

# 17. Fixture I — Whitespace Stability

Create two logically identical YAML documents:

```text
compact.yaml
expanded.yaml
```

Change only:

* blank lines,
* indentation where semantically equivalent,
* comments,
* formatting.

Expected:

```text
JSON Pointer remains the same
line/column changes appropriately
logical entity remains the same
```

This validates why line/column must not be used as logical identity.

---

# 18. Fixture J — Key Reordering

Create equivalent documents with mapping keys in a different source order.

Verify:

```text
logical entity identity unchanged
JSON Pointer unchanged
line/column changed
```

where the semantic structure remains equivalent.

---

# 19. Fixture K — Comments

For YAML, place comments:

```yaml
# Important operation
get:
```

around selected structures.

Determine whether source coordinates continue to identify the intended node.

OAIT is not required to preserve comment semantics in v0.1.

This test merely checks whether comments disrupt location calculations.

---

# 20. Fixture L — Invalid YAML

Use malformed YAML.

Record:

```text
error type
document
line
column
structured versus message-only location
```

SPIKE-001 showed that malformed YAML locations may appear only in exception messages.

SPIKE-003 must investigate this more precisely.

Do not make fragile production assumptions based on parsing text from human-readable exception messages.

---

# 21. Fixture M — Structurally Invalid OpenAPI

Create syntactically valid YAML containing an OpenAPI structural error.

For example, a problematic parameter definition.

The purpose is to compare:

```text
parser/source location
```

with:

```text
candidate diagnostic location
```

for the same source object.

Detailed validator mapping remains SPIKE-006.

---

# 22. Candidate-Native Location Investigation

For each candidate, first investigate only documented/public APIs.

Record whether the candidate exposes any representation of:

```text
source file
JSON Pointer
line
column
range
offset
AST node
source object
diagnostic location
```

Do not use undocumented imports.

---

# 23. Scalar-Specific Questions

SPIKE-002 identified an anomalous Scalar nested lifecycle path containing:

```text
[object Object]
```

SPIKE-003 must determine:

1. Whether lifecycle paths are intended as canonical structural paths.
2. Whether they can be converted reliably to JSON Pointer.
3. Whether loaded source documents retain AST/CST or range information.
4. Whether declaration nodes can be mapped back to a physical source.
5. Whether URL-map information can combine with location evidence.
6. Whether line and column are exposed through documented public APIs.
7. Whether parse errors expose structured positional properties.

If a Scalar hook path cannot be trusted as a stable source pointer, record:

```text
NOT_SUITABLE_AS_CANONICAL_POINTER
```

rather than inventing a conversion.

---

# 24. Redocly-Specific Questions

SPIKE-002 found that Redocly diagnostics contain relatively strong declaration-source evidence.

SPIKE-003 must determine:

1. What source/location information is available through documented APIs.
2. Whether locations exist only for diagnostics or also for successfully parsed nodes.
3. Whether the location points to original source or bundled output.
4. Whether pointer information is canonical.
5. Whether line/column information is available.
6. Whether external-file locations remain attributable to the original file.
7. Whether locations survive multi-file processing.
8. Whether a location representation can be used without exposing Redocly-specific types to OAIT core.

---

# 25. Candidate-Native Versus OAIT-Owned Evidence

For each required field, classify the source:

```text
NATIVE
DERIVABLE
OAIT_OWNED_REQUIRED
NOT_AVAILABLE
```

Example:

```yaml
documentUri:
  classification: NATIVE

pointer:
  classification: DERIVABLE

line:
  classification: OAIT_OWNED_REQUIRED
```

This is more informative than a simple candidate PASS/FAIL.

---

# 26. Canonical Pointer Requirement

OAIT should use RFC 6901-style JSON Pointer syntax internally.

Examples:

```text
/info
/paths/~1pets/get
/components/schemas/Pet
/components/schemas/Pet/properties/id
```

The candidate's native path representation does not have to use JSON Pointer.

However, OAIT must determine whether it can **reliably and deterministically** convert that representation into canonical JSON Pointer.

If conversion is ambiguous, classify it as insufficient.

---

# 27. Pointer Must Refer to Original Source

This is critical.

Suppose bundling transforms:

```text
schemas/Pet.yaml
```

into:

```text
/components/schemas/Pet
```

in the root bundled document.

OAIT should not incorrectly report that bundled pointer as the physical declaration location.

The spike must distinguish:

```text
sourcePointer
```

from:

```text
transformedPointer
```

---

# 28. Proposed Experimental Evidence Shape

Attempt to produce:

```json
{
  "logicalTarget": {
    "kind": "operation",
    "identity": "GET /pets/{petId}"
  },
  "sourceLocation": {
    "documentUri": "file:///.../paths/pets.yaml",
    "filePath": "paths/pets.yaml",
    "pointer": "/get",
    "line": 4,
    "column": 1
  },
  "evidenceSource": {
    "documentUri": "NATIVE",
    "pointer": "DERIVABLE",
    "line": "NATIVE",
    "column": "NATIVE"
  }
}
```

The exact JSON schema may be refined during the experiment.

---

# 29. Location Accuracy

A result is not successful merely because it reports some line number.

Verify locations against known fixture positions.

For every sampled entity, determine:

```text
exact
off-by-one
parent-node location
key location
value location
unavailable
incorrect
```

Document whether line numbering is:

```text
0-based
or
1-based
```

and whether columns are:

```text
0-based
or
1-based
```

Do not silently normalize without recording the native convention.

---

# 30. OAIT Presentation Convention

The spike should recommend a future user-facing convention.

Tentatively:

```text
line: 1-based
column: 1-based
```

for console/report presentation.

This is not yet a domain-model requirement.

Internally, OAIT may normalize candidate-specific indexing.

---

# 31. Location Range

If available, record:

```text
start line
start column
end line
end column
```

However, OAIT v0.1 requires only an anchor location.

A full source span should not become mandatory unless it provides clear value.

---

# 32. Source URI Normalization

Determine whether candidate locations use:

```text
absolute filesystem path
file:// URI
relative path
URL
opaque candidate identifier
```

The domain model proposes:

```text
documentUri
```

as the canonical identity and:

```text
filePath
```

as optional user-friendly local representation.

The spike should assess how easily native candidate identifiers can be normalized into this model.

---

# 33. Symlink and Path Canonicalization

Where practical, perform a small controlled test to determine whether equivalent paths can appear as distinct source identities.

Do not over-expand this investigation.

The primary question is whether OAIT will need an explicit URI/path canonicalization policy.

If yes, record it as a follow-on design decision.

---

# 34. Successful Node Versus Diagnostic Location

Evaluate source-location availability in two distinct scenarios:

```text
successfully parsed valid entity
```

and:

```text
entity associated with a diagnostic
```

A library that provides excellent diagnostic locations but no location mechanism for valid nodes may still be useful as a validator, but insufficient as OAIT's canonical source mapper.

---

# 35. Result States

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
```

### PASS

Required source evidence is available accurately through documented APIs or a deterministic documented conversion.

### PARTIAL

Some evidence exists, but required fields are missing or ambiguous.

### FAIL

Reported source evidence is incorrect or unreliable.

### NOT_SUPPORTED

The capability is not exposed through documented APIs.

---

# 36. Required Candidate Matrix

The README must contain a matrix similar to:

| Capability                      | Scalar | Redocly |
| ------------------------------- | ------ | ------- |
| Source document for valid node  | TBD    | TBD     |
| JSON Pointer for valid node     | TBD    | TBD     |
| Line for valid node             | TBD    | TBD     |
| Column for valid node           | TBD    | TBD     |
| Schema-property location        | TBD    | TBD     |
| Array-item location             | TBD    | TBD     |
| `$ref` declaration location     | TBD    | TBD     |
| `$ref` target location          | TBD    | TBD     |
| Nested-hop locations            | TBD    | TBD     |
| Multi-file original location    | TBD    | TBD     |
| Error document                  | TBD    | TBD     |
| Error pointer                   | TBD    | TBD     |
| Error line                      | TBD    | TBD     |
| Error column                    | TBD    | TBD     |
| Stable under whitespace changes | TBD    | TBD     |
| Canonical-pointer conversion    | TBD    | TBD     |
| Documented APIs only            | TBD    | TBD     |

---

# 37. OAIT-Owned Location Layer Assessment

If neither candidate satisfies the minimum gate natively, the spike must describe what an OAIT-owned layer would have to do.

Conceptually:

```text
SourceLoader
     ↓
Raw Source Document
     ↓
Location Index
     ├── JSON Pointer → source range
     └── source range → document
     ↓
Reference Evidence
     ↓
Candidate Parser/Bundler
```

Do not implement the production layer during this spike.

A small proof of feasibility is acceptable only if required to establish that the architecture is practical.

---

# 38. Potential Source Index

A future OAIT-owned source index might conceptually expose:

```ts
interface SourceLocationIndex {
  locate(
    documentUri: string,
    pointer: string
  ): SourceLocation | undefined;
}
```

SPIKE-003 should determine whether this abstraction is feasible.

Do not treat this interface as finalized production design.

---

# 39. Important Architectural Test

The spike should determine whether this pipeline is practical:

```text
load raw files
      ↓
build source-location indexes
      ↓
record $ref declarations
      ↓
controlled reference resolution
      ↓
candidate parser/bundler
      ↓
normalized OpenAPI domain model
      ↓
SourceLocation attached by original pointer
```

This is the strongest architecture hypothesis emerging from SPIKE-002.

---

# 40. Mutation Checks

As with previous spikes:

* Hash fixtures before execution.
* Hash fixtures after execution.
* Confirm source files are unchanged.

Additionally distinguish:

```text
physical source position
```

from:

```text
candidate-transformed object position
```

---

# 41. Reproducibility

Record:

```text
Node.js version
npm version
TypeScript version
candidate versions
operating system
commands executed
fixture hashes
result hashes
```

Use:

```bash
npm ci
npm run run
```

as the final reproduction path where practical.

---

# 42. README Requirements

Create:

```text
experiments/parser-validator-spike/spike-003/README.md
```

containing:

1. Objective.
2. Environment.
3. Candidate versions.
4. Candidate APIs used.
5. Fixture architecture.
6. Source-location terminology.
7. Test matrix.
8. YAML findings.
9. JSON findings.
10. Multi-file findings.
11. Reference declaration/target findings.
12. Pointer findings.
13. Line/column findings.
14. Error-location findings.
15. Candidate-native versus OAIT-owned evidence.
16. Unexpected behavior.
17. Limitations.
18. Architecture implications.
19. Whether each candidate proceeds.
20. Whether a separate source-location technology spike is required.
21. No final parser selection.

---

# 43. Acceptance Criteria

SPIKE-003 is complete when:

* [ ] YAML locations tested.
* [ ] JSON locations tested.
* [ ] Multi-file locations tested.
* [ ] Operation location tested.
* [ ] Parameter location tested.
* [ ] Response location tested.
* [ ] Schema location tested.
* [ ] Schema-property location tested.
* [ ] Security-scheme location tested.
* [ ] `$ref` declaration location tested.
* [ ] `$ref` target location tested.
* [ ] Nested reference hops tested.
* [ ] Array indexing tested.
* [ ] JSON Pointer escaping tested.
* [ ] Duplicate scalar-value fixture tested.
* [ ] Whitespace stability tested.
* [ ] Key-order behavior tested.
* [ ] Malformed YAML location tested.
* [ ] Structurally invalid OpenAPI location tested.
* [ ] Candidate location conventions documented.
* [ ] Original-source versus bundled location distinguished.
* [ ] Candidate-native evidence classified.
* [ ] Need for OAIT-owned location index determined.
* [ ] Machine-readable results generated.
* [ ] Architecture implications documented.
* [ ] Follow-on spike requirement determined.

---

# 44. Possible Outcomes

### Outcome A — Candidate-native locations are sufficient

OAIT can adapt candidate-native locations behind an OAIT-owned interface.

### Outcome B — Candidate-native locations are partially sufficient

OAIT uses candidate locations for some operations but maintains its own source index for canonical source evidence.

### Outcome C — Candidate-native locations are insufficient

OAIT requires an independent source-location/indexing layer before parser transformation.

All three are acceptable spike outcomes.

---

# 45. ADR Timing

Do not write a source-loading/reference-evidence ADR before this spike finishes.

SPIKE-002 strongly suggests such a layer.

SPIKE-003 should establish its precise responsibilities.

After SPIKE-003, evaluate whether the following decision is architecture-significant enough for an ADR:

> OAIT owns source loading, reference evidence, and source-location indexing independently of third-party parser transformations.

The ADR number should be assigned only when the decision is actually accepted.

---

# 46. Exit Question

At the end of SPIKE-003, we must be able to answer:

> **Can OAIT reliably identify the original file and structural location of every significant OpenAPI entity and reference, and what additional OAIT-owned infrastructure is necessary to provide human-readable line and column information?**

---