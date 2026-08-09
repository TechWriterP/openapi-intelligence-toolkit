# SPIKE-002: Reference Resolution and Multi-File Behavior

**Status:** Completed
**Date:** 2026-08-09
**Phase:** Technical Validation
**Target release:** OAIT v0.1
**Predecessor:** `SPIKE-001-parser-version-support.md`
**Related documents:** `parser-validator-spike-plan.md`, `openapi-domain-model.md`, `ADR-003-normalized-openapi-domain-model.md`

---

## 1. Objective

Evaluate whether the OpenAPI parser candidates retained from SPIKE-001 can resolve references across single-file and multi-file OpenAPI descriptions while preserving sufficient evidence for OAIT to identify:

* Where a `$ref` was declared.
* What reference string was declared.
* What document the reference resolves to.
* What logical object the reference resolves to.
* Whether nested and recursive references are handled safely.
* Whether unresolved references are detectable.
* Whether resolution mutates, bundles, or dereferences the source representation.
* Whether filesystem and network reference resolution can be controlled.

This spike does **not** select the production parser.

---

## 2. Candidates

Continue with the exact candidate versions tested in SPIKE-001:

```text
@scalar/openapi-parser@0.28.10
@redocly/openapi-core@2.40.0
```

Using the same versions allows SPIKE-002 results to be compared directly with SPIKE-001.

Package upgrades are out of scope unless a candidate cannot perform a required experiment because of a confirmed defect fixed in a later release.

Any such upgrade must be explicitly documented.

---

## 3. Why This Spike Matters

ADR-003 requires OAIT to preserve both logical meaning and source evidence.

For a reference such as:

```yaml
schema:
  $ref: "./schemas/customer.yaml#/Customer"
```

OAIT eventually needs enough information to represent something conceptually similar to:

```text
ReferencedOrigin
├── declaration
│   └── openapi.yaml#/paths/.../schema
│
├── rawReference
│   └── ./schemas/customer.yaml#/Customer
│
├── resolvedUri
│   └── file:///.../schemas/customer.yaml
│
└── target
    └── customer.yaml#/Customer
```

A parser that merely returns the final resolved object may be insufficient.

---

# 4. Primary Research Question

> **Can each candidate resolve OpenAPI references while preserving enough declaration and target provenance for OAIT to construct `ReferenceOrigin` and related source-traceability metadata?**

---

# 5. Scope

SPIKE-002 evaluates:

* Internal `$ref`.
* Local external-file `$ref`.
* Nested external references.
* Multiple references to the same target.
* Recursive references.
* Circular reference behavior.
* Unresolved internal references.
* Missing external files.
* Invalid JSON Pointer fragments.
* Reference declaration preservation.
* Resolved target identification.
* Physical source-document identity.
* Bundling behavior.
* Dereferencing behavior.
* Input mutation.
* Filesystem resolution behavior.
* Network-reference behavior and controls.
* Public API suitability.

---

# 6. Out of Scope

The following remain deferred:

```text
precise line/column preservation
complete JSON Pointer/location architecture
OpenAPI 3.2 QUERY operations
additionalOperations
schema dialect semantics
quality-rule implementation
validator diagnostic mapping
performance benchmarking
production parser adapter
```

Precise line/column behavior belongs primarily to SPIKE-003.

---

# 7. Required Experiment Structure

Create:

```text
experiments/
└── parser-validator-spike/
    └── spike-002/
        ├── fixtures/
        │   ├── internal/
        │   ├── multi-file/
        │   ├── nested/
        │   ├── shared-target/
        │   ├── recursive/
        │   ├── unresolved/
        │   ├── invalid-pointer/
        │   └── remote/
        │
        ├── scalar/
        │   └── index.ts
        │
        ├── redocly/
        │   └── index.ts
        │
        ├── shared/
        ├── results/
        │   ├── scalar.json
        │   └── redocly.json
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        └── README.md
```

SPIKE-002 must remain isolated experimental code.

Do not create production implementation under `packages/`.

---

# 8. Fixture A — Internal Reference

Create:

```text
fixtures/internal/openapi.yaml
```

Example relationship:

```yaml
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string

paths:
  /pets/{petId}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
```

### Test

Determine whether the candidate can identify:

```text
declared reference:
#/components/schemas/Pet

resolved target:
#/components/schemas/Pet
```

Record whether the original `$ref` remains inspectable after the tested operation.

---

# 9. Fixture B — Multi-File Reference

Create:

```text
fixtures/multi-file/
├── openapi.yaml
└── schemas/
    └── Pet.yaml
```

`openapi.yaml` references:

```yaml
$ref: "./schemas/Pet.yaml"
```

### Test

Determine:

* Whether the reference resolves.
* Whether `openapi.yaml` remains identifiable as the declaration document.
* Whether `Pet.yaml` remains identifiable as the target document.
* Whether the raw reference string survives.
* Whether the returned representation rewrites the reference.

---

# 10. Fixture C — External Reference with JSON Pointer

Create:

```text
fixtures/nested/
├── openapi.yaml
└── schemas/
    ├── models.yaml
    └── common.yaml
```

Reference chain:

```text
openapi.yaml
     ↓
models.yaml#/Pet
     ↓
common.yaml#/Identifier
```

Example:

```yaml
# openapi.yaml
$ref: "./schemas/models.yaml#/Pet"
```

and:

```yaml
# models.yaml
Pet:
  type: object
  properties:
    id:
      $ref: "./common.yaml#/Identifier"
```

### Test

Determine whether the candidate can expose or allow OAIT to reconstruct:

```text
openapi.yaml
      ↓
models.yaml#/Pet
      ↓
common.yaml#/Identifier
```

This is important for the future:

```text
ReferenceHop[]
```

model.

---

# 11. Fixture D — Shared Target

Create two separate references to the same schema:

```text
GET /pets/{petId}
      ↓
Pet

POST /pets
      ↓
Pet
```

Both should reference the same external target.

### Test

Determine whether:

* Both declarations remain separately identifiable.
* They resolve to the same logical target.
* Candidate processing incorrectly collapses declaration provenance.

OAIT must eventually distinguish:

```text
Reference declaration A
Reference declaration B
             ↓
       same target
```

---

# 12. Fixture E — Recursive Schema

Create:

```text
fixtures/recursive/
├── openapi.yaml
└── schemas/
    └── Node.yaml
```

Example concept:

```yaml
type: object
properties:
  name:
    type: string
  children:
    type: array
    items:
      $ref: "./Node.yaml"
```

### Test

Determine whether the candidate:

* Resolves safely.
* Terminates.
* Preserves recursion.
* Creates a cyclic JavaScript graph.
* Leaves a reference boundary.
* Throws an error.
* Requires special options.

OAIT must not infinitely expand recursive schemas.

---

# 13. Fixture F — Unresolved Internal Reference

Create a reference such as:

```yaml
$ref: "#/components/schemas/DoesNotExist"
```

### Record

* Throws?
* Returns diagnostic?
* Leaves unresolved `$ref`?
* Diagnostic message?
* Machine-readable error type?
* Reference string retained?
* Declaration file identifiable?

---

# 14. Fixture G — Missing External File

Create:

```yaml
$ref: "./schemas/Missing.yaml"
```

where the file deliberately does not exist.

Record:

```text
error type
message
file/reference involved
whether processing continues
whether partial document remains available
```

---

# 15. Fixture H — Invalid JSON Pointer

Use an existing file but a nonexistent fragment:

```yaml
$ref: "./schemas/models.yaml#/DoesNotExist"
```

This must be tested separately from a missing file.

OAIT should eventually distinguish:

```text
resource cannot be loaded
```

from:

```text
resource loaded but target does not exist
```

---

# 16. Remote Reference Experiment

OAIT has a local-first security model.

Therefore SPIKE-002 must determine whether candidates automatically retrieve remote references and whether remote access can be disabled or controlled.

Do **not** depend on the public internet.

Create a temporary local HTTP server during the experiment.

Example:

```text
http://127.0.0.1:<dynamic-port>/RemotePet.yaml
```

Then reference:

```yaml
$ref: "http://127.0.0.1:<dynamic-port>/RemotePet.yaml"
```

Test separately:

### Remote resolution enabled

Determine whether the candidate attempts to retrieve the resource.

### Remote resolution disabled

Determine whether the public API provides a supported mechanism to prevent the retrieval.

### Important

Do not work around missing controls by patching library internals.

If the public API cannot restrict network resolution, record:

```text
LIMITATION
```

That is valuable security evidence.

---

# 17. Filesystem Boundary Experiment

Where practical, determine whether the candidate allows OAIT to restrict local reference resolution to an allowed project directory.

Conceptually:

```text
allowed root:
fixtures/multi-file/
```

Try a reference that attempts to escape the intended root:

```text
../../../outside.yaml
```

The objective is not to exploit the machine.

Use a harmless controlled fixture placed outside the allowed fixture directory.

Record whether:

* Resolution succeeds automatically.
* Resolution can be constrained through a public API.
* A custom loader/resolver is supported.
* OAIT would need to enforce path boundaries outside the library.

---

# 18. Three Representations to Distinguish

For every candidate, distinguish clearly between:

### Parsed

```text
Original structure represented as objects
```

### Bundled

```text
External resources incorporated into a single document representation
while references may remain
```

### Dereferenced

```text
Reference replaced by the referenced object/value
```

Do not use these terms interchangeably.

Record exactly which representation each public API produces.

---

# 19. Redocly-Specific Investigation

SPIKE-001 established that Redocly uses its documented bundling API to obtain the parsed document.

Therefore SPIKE-002 must explicitly examine:

1. What happens to external `$ref`s during default bundling.
2. Whether referenced objects are moved into components.
3. Whether component names are changed.
4. Whether source filenames remain recoverable.
5. Whether original reference strings remain recoverable.
6. Whether dereferencing materially changes provenance.
7. How circular references behave.

Do not assume bundled output is equivalent to source representation.

---

# 20. Scalar-Specific Investigation

Use only documented Scalar APIs.

Determine:

1. Which documented API performs external reference resolution.
2. Whether a callback/hook exposes individual reference-resolution events.
3. Whether declaration and resolved target information is available.
4. Whether recursion is preserved safely.
5. Whether unresolved references pass through or fail.
6. Whether custom loading behavior is supported.
7. Whether filesystem/network retrieval can be controlled.

Do not use undocumented imports to obtain provenance.

---

# 21. Provenance Evidence Model

For every successfully resolved reference, attempt to collect:

```json
{
  "rawReference": "./schemas/models.yaml#/Pet",
  "declarationDocument": "openapi.yaml",
  "declarationPointer": "...",
  "resolvedDocument": "schemas/models.yaml",
  "resolvedPointer": "/Pet",
  "resolutionSucceeded": true
}
```

SPIKE-002 does **not** require exact line/column information.

If a candidate cannot directly provide one of these fields, record whether it can be reliably reconstructed from documented APIs.

---

# 22. Result States

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
```

### PASS

Required behavior is available through a documented API.

### PARTIAL

Reference resolves, but some required evidence or control is lost.

### FAIL

The candidate claims/supports the scenario but processing does not work correctly.

### NOT_SUPPORTED

The required capability is not exposed by the documented public API.

Do not disguise `NOT_SUPPORTED` as `PASS` using private APIs.

---

# 23. Machine-Readable Result Format

Each result should contain approximately:

```json
{
  "candidate": "@scalar/openapi-parser",
  "version": "0.28.10",
  "tests": [
    {
      "id": "MULTI_FILE_REF",
      "status": "PASS",
      "rawReference": "./schemas/Pet.yaml",
      "resolutionSucceeded": true,
      "declarationDocumentPreserved": true,
      "targetDocumentPreserved": true,
      "rawReferencePreserved": true,
      "notes": []
    }
  ]
}
```

Extend the structure where required, but preserve comparability.

---

# 24. Candidate Comparison Matrix

The README must include a matrix similar to:

| Capability                  | Scalar | Redocly |
| --------------------------- | ------ | ------- |
| Internal `$ref`             | TBD    | TBD     |
| External local `$ref`       | TBD    | TBD     |
| External `$ref` + pointer   | TBD    | TBD     |
| Nested references           | TBD    | TBD     |
| Shared target               | TBD    | TBD     |
| Recursive reference         | TBD    | TBD     |
| Missing internal target     | TBD    | TBD     |
| Missing file                | TBD    | TBD     |
| Invalid pointer             | TBD    | TBD     |
| Raw `$ref` preservation     | TBD    | TBD     |
| Declaration document        | TBD    | TBD     |
| Target document             | TBD    | TBD     |
| Reference-chain evidence    | TBD    | TBD     |
| Network control             | TBD    | TBD     |
| Filesystem boundary control | TBD    | TBD     |
| Documented API only         | TBD    | TBD     |

---

# 25. Critical Architecture Gates

A candidate should proceed comfortably toward production consideration only if OAIT can establish at least:

```text
raw reference
+
declaration document
+
resolved target document
+
resolution success/failure
```

through documented APIs or a reliable OAIT-owned resolution layer.

Failure to expose line/column information does not reject the candidate in SPIKE-002.

That is evaluated separately.

---

# 26. Important Architectural Possibility

SPIKE-002 may reveal that the best architecture is **not**:

```text
third-party parser
      ↓
third-party resolver
      ↓
OAIT
```

It may instead be:

```text
OAIT SourceLoader
      ↓
OAIT-controlled reference resolution/provenance
      ↓
third-party parser/validator
      ↓
normalizer
```

or another hybrid.

The spike must remain open to this result.

---

# 27. Input Mutation Check

Calculate hashes of fixture files before and after execution.

No experiment may modify fixtures.

Also distinguish:

```text
source file mutation
```

from:

```text
returned in-memory representation transformation
```

Both should be reported separately.

---

# 28. Repeatability

Record:

```text
Node.js version
npm version
TypeScript version
candidate versions
operating system
commands
fixture hashes
result hashes
```

Use:

```bash
npm ci
```

for reproduction after the initial lockfile exists.

---

# 29. README Requirements

Create:

```text
experiments/parser-validator-spike/spike-002/README.md
```

containing:

1. Objective.
2. Environment.
3. Candidate versions.
4. Fixture architecture.
5. Commands executed.
6. Candidate APIs used.
7. Complete test matrix.
8. Provenance observations.
9. Recursive-reference observations.
10. Error behavior.
11. Bundling/dereferencing behavior.
12. Network behavior.
13. Filesystem-control behavior.
14. Unexpected behavior.
15. Limitations.
16. Architecture implications.
17. Whether each candidate should continue to SPIKE-003.
18. No final production-parser recommendation.

---

# 30. Acceptance Criteria

SPIKE-002 is complete when:

* [ ] Internal references tested.
* [ ] Multi-file references tested.
* [ ] External references with JSON Pointer tested.
* [ ] Nested references tested.
* [ ] Multiple declarations to one target tested.
* [ ] Recursive references tested.
* [ ] Unresolved internal reference tested.
* [ ] Missing external file tested.
* [ ] Invalid pointer tested.
* [ ] Raw `$ref` preservation evaluated.
* [ ] Declaration document preservation evaluated.
* [ ] Target document preservation evaluated.
* [ ] Reference-chain reconstruction evaluated.
* [ ] Bundling behavior documented.
* [ ] Dereferencing behavior documented where supported.
* [ ] Local HTTP reference behavior tested.
* [ ] Network-control capability evaluated.
* [ ] Filesystem-boundary capability evaluated.
* [ ] Input mutation evaluated.
* [ ] Machine-readable results generated.
* [ ] Scalar result completed.
* [ ] Redocly result completed.
* [ ] Architecture implications documented.
* [ ] Candidates for SPIKE-003 identified.

---

# 31. Exit Question

At the end of SPIKE-002 we must be able to answer:

> **Can OAIT preserve reference provenance while resolving real multi-file OpenAPI descriptions, and if the candidate library cannot do so directly, what OAIT-owned abstraction is required to make it possible?**

---

## 32. Guiding Principle

> **Resolving a reference is not sufficient for OAIT; OAIT must know what was referenced, where the reference was declared, where the target came from, and what evidence survives resolution.**