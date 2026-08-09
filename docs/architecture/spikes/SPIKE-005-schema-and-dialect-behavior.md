# SPIKE-005: Evaluate Schema and Dialect Behavior

**Status:** Planned
**Date:** 2026-08-09
**Phase:** Technical Validation
**Target release:** OAIT v0.1
**Predecessors:** `SPIKE-001-parser-version-support.md`, `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`, `SPIKE-LOC-001-source-location-technology.md`, `SPIKE-004-openapi-3.2-operation-support.md`
**Related architecture:** `system-architecture.md`, `openapi-domain-model.md`, `source-processing-design.md`
**Related ADRs:** `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`

---

# 1. Objective

Determine whether the shortlisted OpenAPI parser candidates preserve sufficient schema semantics across OpenAPI 3.0, 3.1, and 3.2 for OAIT to construct a conservative, version-aware `NormalizedSchema` representation without discarding or falsely rewriting meaningful schema behavior.

The spike must specifically evaluate:

* OAS 3.0 Schema Object behavior.
* OAS 3.1 Schema Object behavior.
* OAS 3.2 Schema Object behavior.
* Boolean schemas.
* Nullability.
* Multi-type declarations.
* Schema dialect declarations.
* Schema-root `$schema`.
* Document-level `jsonSchemaDialect`.
* Effective dialect evidence.
* `$ref` inside Schema Objects.
* `$ref` siblings.
* Recursive schemas.
* `allOf`, `oneOf`, `anyOf`, and `not`.
* Unknown and custom JSON Schema keywords.
* `$defs`.
* Selected Draft 2020-12 keywords.
* `$id` preservation.
* `$anchor` / `$dynamicAnchor` / `$dynamicRef` preservation where feasible.
* Externally referenced schemas.
* Candidate transformation and bundling behavior.
* TypeScript/runtime representation.

The spike does not implement production schema normalization or JSON Schema validation.

---

# 2. Primary Research Question

> **Can Scalar and Redocly preserve enough version-specific schema and dialect evidence for OAIT to normalize commonly needed schema concepts while retaining an authoritative canonical schema representation?**

---

# 3. Why This Spike Exists

OAIT cannot safely treat all OpenAPI Schema Objects as one equivalent structure.

The architecture currently distinguishes:

```text
OpenAPI 3.0
    ↓
OAS-specific schema model

OpenAPI 3.1 / 3.2
    ↓
JSON Schema dialect model
```

The normalized domain model therefore proposes:

```text
Normalized projection
        +
Canonical schema representation
```

The normalized projection provides commonly required concepts.

The canonical representation preserves schema information that OAIT does not explicitly model.

This spike determines whether candidate parser behavior makes that architecture feasible.

---

# 4. Existing OAIT Schema Contract

The current domain model requires `NormalizedSchema` to preserve at least:

```text
schema kind
boolean value
dialect
types
format
required properties
properties
enum values
composition
canonical schema
source evidence
reference provenance
```

It explicitly permits:

```text
CanonicalSchemaValue =
    boolean
    OR
    arbitrary schema object
```

and requires OAIT not to discard unknown schema keywords.

SPIKE-005 validates those assumptions experimentally.

---

# 5. Normative Version Model

## OpenAPI 3.0

OAS 3.0 Schema Object is an OpenAPI-specific extended subset of JSON Schema.

The experiment must treat characteristics such as these as version-specific:

```text
type → single string
nullable → OpenAPI keyword
boolean whole-schema values → unsupported
arbitrary unlisted JSON Schema keywords → unsupported
```

OAIT must not silently reinterpret an OAS 3.0 schema as Draft 2020-12.

---

## OpenAPI 3.1

OAS 3.1 Schema Object is a superset of JSON Schema Draft 2020-12.

It permits:

```text
boolean schemas
null as a JSON Schema type
type arrays
$schema
$id
$ref
$dynamicRef
JSON Schema vocabulary keywords
arbitrary additional schema keywords
```

The OpenAPI Object may provide:

```text
jsonSchemaDialect
```

as the default dialect for contained Schema Objects.

---

## OpenAPI 3.2

OAS 3.2 continues the JSON Schema Draft 2020-12-based schema model.

The OAS dialect schema identifier remains:

```text
https://spec.openapis.org/oas/3.1/dialect/base
```

This apparently surprising `3.1` URI is normative for OAS 3.2 and must not be rewritten by OAIT to a fabricated `3.2` URI.

---

# 6. Core Architectural Hypothesis

The spike evaluates this architecture:

```text
Schema source
     ↓
Candidate parser adapter
     ↓
Version-aware schema evidence
     ↓
┌──────────────────────────────┐
│ Normalized schema projection │
│                              │
│ +                            │
│                              │
│ Canonical schema value       │
└──────────────────────────────┘
     ↓
NormalizedSchema
```

rather than:

```text
Candidate schema type
     ↓
Convert everything to one
small fixed OAIT interface
     ↓
Discard unknown semantics
```

---

# 7. Candidate Baseline

Continue the same exact baseline candidates:

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19

@redocly/openapi-core@2.40.0
```

Supporting experiment dependencies should remain aligned with preceding spikes where practical.

Do not silently upgrade candidates.

If a failure is demonstrably specific to the pinned version and a newer stable release materially changes schema behavior, a secondary exact-version experiment may be performed.

Baseline results must remain separate.

---

# 8. Experimental Location

Use:

```text
experiments/parser-validator-spike/spike-005/
```

Suggested structure:

```text
spike-005/
├── fixtures/
│   ├── oas-3.0/
│   ├── oas-3.1/
│   ├── oas-3.2/
│   ├── referenced/
│   ├── dialects/
│   └── negative/
│
├── scalar/
│   └── evaluate.ts
│
├── redocly/
│   └── evaluate.ts
│
├── shared/
│   ├── expected.ts
│   ├── schema-evidence.ts
│   └── types.ts
│
├── results/
│   ├── scalar.json
│   └── redocly.json
│
├── README.md
├── package.json
├── package-lock.json
└── tsconfig.json
```

No production implementation should be added.

---

# 9. Evaluation Dimensions

Each candidate must be evaluated for:

```text
structural preservation
version fidelity
dialect preservation
reference preservation
composition preservation
recursive-schema safety
unknown-keyword preservation
candidate transformations
TypeScript/runtime fidelity
public API suitability
```

Validation diagnostics discovered incidentally should be recorded, but systematic validator comparison remains SPIKE-006.

---

# 10. Fixture S1 — OAS 3.0 Baseline Schema

Create a valid OpenAPI 3.0.4 schema containing:

```yaml
type: object
required:
  - id
properties:
  id:
    type: integer
    format: int64
  name:
    type: string
  status:
    type: string
    enum:
      - active
      - inactive
```

Verify preservation of:

* type.
* format.
* properties.
* required.
* enum.
* descriptions where present.
* original schema object.

This establishes the control baseline.

---

# 11. Fixture S2 — OAS 3.0 `nullable`

Create:

```yaml
type: string
nullable: true
```

Expected evidence:

```text
declared type = string
nullable = true
```

The experiment must not convert the source representation into:

```yaml
type:
  - string
  - "null"
```

before evidence is recorded.

Such a transformation could be a future normalized semantic projection, but the original version-specific representation must remain known.

---

# 12. Fixture S3 — OAS 3.0 Nullable Without Type

Create:

```yaml
nullable: true
```

Record candidate behavior.

The purpose is to determine whether the candidate:

* preserves it,
* rejects it,
* interprets it,
* rewrites it.

OAS 3.0 `nullable` only takes effect when `type` is explicitly defined in the same Schema Object.

This is a semantic-evidence test, not a full validation comparison.

---

# 13. Fixture S4 — OAS 3.1 Null Type

Create:

```yaml
type:
  - string
  - "null"
```

Verify:

* array-valued `type` is preserved.
* `"null"` remains present.
* candidate does not translate it into OAS 3.0 `nullable`.
* canonical schema preserves exact logical structure.

---

# 14. Fixture S5 — OAS 3.2 Null Type

Repeat the same schema under OpenAPI 3.2.

This tests whether OAS 3.2 handling remains JSON Schema-based rather than regressing to an older OpenAPI-specific representation.

---

# 15. Fixture S6 — Boolean `true` Schema

For OAS 3.1 and 3.2 create a schema location containing:

```yaml
true
```

Expected schema evidence:

```text
schemaKind = boolean-schema
booleanValue = true
```

The candidate must not silently transform it into:

```yaml
{}
```

without retaining sufficient evidence that the authored schema was boolean `true`.

Boolean schemas are explicitly permitted in OAS 3.1/3.2.

---

# 16. Fixture S7 — Boolean `false` Schema

Create:

```yaml
false
```

Expected:

```text
schemaKind = boolean-schema
booleanValue = false
```

This case is especially important because a false schema means:

```text
no instance is valid
```

and must never be normalized into an empty object schema.

---

# 17. Cross-Version Boolean Control

Place equivalent whole-schema boolean values in an OAS 3.0 fixture.

Record whether each candidate:

* rejects them,
* preserves them as raw values,
* diagnoses them,
* silently accepts them.

Do not require parser rejection as a mandatory parser capability if the structure is still faithfully preserved and validation responsibility lies elsewhere.

However, OAIT's version adapter must be able to determine:

```text
boolean schema
+
OAS 3.0
=
not semantically equivalent to valid OAS 3.1/3.2 boolean schema
```

---

# 18. Fixture S8 — Composition

Create representative schemas containing:

```text
allOf
oneOf
anyOf
not
```

Use both:

* inline child schemas.
* `$ref` child schemas.

Required evidence:

* composition keyword remains present.
* branch ordering remains deterministic.
* every child schema remains reachable.
* boolean schemas within composition remain representable where valid.
* referenced and inline branches remain distinguishable.

---

# 19. Fixture S9 — Nested Composition

Create:

```text
oneOf
 ├── allOf
 │    ├── schema
 │    └── schema
 └── anyOf
      ├── schema
      └── schema
```

The purpose is to ensure candidates do not flatten composition into an information-losing representation.

OAIT must retain enough canonical structure to analyze composition later without reconstructing it from candidate-specific types.

---

# 20. Fixture S10 — Recursive Schema

Create:

```yaml
Node:
  type: object
  properties:
    value:
      type: string
    child:
      $ref: "#/components/schemas/Node"
```

Verify:

* recursion is preserved.
* processing terminates.
* candidate does not infinitely expand.
* canonical schema remains cycle-safe.
* original `$ref` evidence remains discoverable.

Full reference-provenance behavior remains governed by ADR-004 and previous spikes.

---

# 21. Fixture S11 — Mutually Recursive Schemas

Create:

```text
A → B
B → A
```

Verify safe traversal and preservation.

This tests graph behavior beyond direct self-reference.

---

# 22. Fixture S12 — Schema `$ref` with Sibling

For OAS 3.1/3.2 create:

```yaml
$ref: "#/components/schemas/Pet"
description: A pet returned by this operation.
maxProperties: 20
```

Within a Schema Object, `$ref` is the JSON Schema keyword and sibling keywords remain schema keywords.

This must be distinguished from the OpenAPI Reference Object, whose additional properties are restricted.

Required evidence:

* `$ref` retained.
* `description` retained.
* `maxProperties` retained.
* candidate does not automatically discard siblings.
* bundled representation is separately recorded.

---

# 23. Cross-Version `$ref` Sibling Control

Create the nearest equivalent under OAS 3.0.

Record:

* preservation.
* diagnostics.
* transformations.
* whether sibling content is ignored or retained by candidate representation.

Do not falsely assume OAS 3.0 Reference Object semantics are identical to OAS 3.1/3.2 Schema `$ref` semantics.

OAS 3.0 Reference Objects ignore additional properties.

---

# 24. Fixture S13 — Document-Level Dialect

Create an OAS 3.1 document with:

```yaml
jsonSchemaDialect: https://example.test/schema/dialect
```

and an ordinary contained schema without `$schema`.

Verify the candidate preserves:

```text
document declared dialect
```

and provides sufficient evidence for OAIT to derive:

```text
effective schema dialect
=
document default
```

The candidate does not need to understand the custom vocabulary to pass preservation.

---

# 25. Fixture S14 — Schema `$schema` Override

Create:

```yaml
jsonSchemaDialect: https://example.test/default-dialect
```

with a schema resource root declaring:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
```

Expected OAIT interpretation:

```text
declared schema dialect
=
$schema value

effective dialect
=
$schema value

source
=
schema
```

The local `$schema` declaration overrides the document default for that schema resource root.

The spike must determine whether candidates preserve enough evidence to compute this relationship even if they do not expose an explicit “effective dialect” API.

---

# 26. Fixture S15 — OAS Default Dialect

Create OAS 3.1 and 3.2 documents with:

```text
no jsonSchemaDialect
no schema-root $schema
```

Expected architecture evidence:

```text
effective dialect
=
OAS dialect default
```

For both 3.1 and 3.2, the OAS dialect identifier is:

```text
https://spec.openapis.org/oas/3.1/dialect/base
```

The experiment should explicitly guard against accidentally synthesizing:

```text
.../oas/3.2/dialect/base
```

for OAS 3.2.

---

# 27. Fixture S16 — Unknown Keyword Preservation

Create an OAS 3.1/3.2 schema containing a deliberately unknown keyword, for example:

```yaml
acmeQualityScore: 42
```

Do not prefix it with `x-`.

Required result:

```text
keyword preserved
value preserved
```

OAS 3.1/3.2 Schema Objects support arbitrary additional schema properties and vocabulary keywords.

A candidate that silently removes unknown schema keywords presents a serious risk to OAIT's canonical-schema strategy.

---

# 28. Cross-Version Unknown Keyword Control

Place the same non-extension keyword in OAS 3.0.

Record:

* preservation.
* validation behavior.
* candidate transformations.

The semantic expectation differs because OAS 3.0 declares additional JSON Schema keywords not identified by the specification as unsupported.

Again:

```text
physically preserved
```

does not mean:

```text
semantically supported by the declared OpenAPI version
```

---

# 29. Fixture S17 — `$defs`

For OAS 3.1 and 3.2 create:

```yaml
$defs:
  Identifier:
    type: string
    pattern: "^[A-Z0-9]+$"

type: object
properties:
  id:
    $ref: "#/$defs/Identifier"
```

Verify:

* `$defs` remains present.
* child schema remains reachable.
* `$ref` remains preserved.
* bundling does not silently translate `$defs` into OAS 3.0-style structures.

---

# 30. Fixture S18 — Selected Draft 2020-12 Keywords

Create a schema containing representative modern JSON Schema keywords such as:

```text
const
contains
minContains
maxContains
prefixItems
unevaluatedProperties
dependentSchemas
```

Do not require every candidate to semantically validate every keyword during this spike.

The mandatory question is:

> Does the parser preserve them faithfully enough for OAIT's canonical schema representation and a future standards-aware validator?

Record each keyword individually.

---

# 31. Fixture S19 — `$id`

Create a schema resource root with:

```yaml
$id: https://example.test/schemas/customer
```

Verify exact preservation.

Do not deeply evaluate every URI-resolution consequence here.

Record whether candidate bundling:

* retains `$id`,
* relocates it,
* rewrites references,
* uses it as a resolution base.

Any behavior affecting reference semantics should be carried into the parser decision evidence.

---

# 32. Fixture S20 — Anchor Keywords

Where supported by candidate APIs, create controlled preservation fixtures for:

```text
$anchor
$dynamicAnchor
$dynamicRef
```

The primary gate is structural preservation and reachability.

Complete JSON Schema dynamic-reference evaluation is not required for SPIKE-005 unless the candidate claims to perform it automatically.

Record:

```text
preserved
rewritten
resolved
dropped
not_supported
```

separately.

---

# 33. Fixture S21 — External Schema Document

Create:

```text
openapi.yaml
    ↓
schemas/customer.yaml
```

where `customer.yaml` is an externally referenced schema resource.

Include:

```text
$schema
$id
$defs
recursive/reference content
unknown keyword
```

Verify:

* external schema remains reachable.
* physical source document remains known through OAIT-owned evidence.
* candidate transformation does not eliminate dialect declarations.
* schema content survives bundling.
* transformed candidate path remains distinct from original source identity.

---

# 34. Fixture S22 — External Dialect Override

Entry OpenAPI document:

```yaml
jsonSchemaDialect: https://example.test/default
```

External schema:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
```

Required architecture evidence:

```text
OpenAPI document default
≠
external schema explicit declaration
```

The candidate must preserve enough information for OAIT to avoid applying the document default blindly to an explicitly declared schema resource.

---

# 35. Fixture S23 — Nullable Cross-Version Contrast

Create parallel schemas:

### OAS 3.0

```yaml
type: string
nullable: true
```

### OAS 3.1 / 3.2

```yaml
type:
  - string
  - "null"
```

The experiment must compare the two without rewriting either source into the other before evidence collection.

The architecture question is not:

```text
Can they both describe nullable strings?
```

The architecture question is:

```text
Can OAIT preserve how each version expresses and interprets the concept?
```

---

# 36. Fixture S24 — `nullable` in OAS 3.1/3.2

Create an OAS 3.1/3.2 Schema Object containing:

```yaml
type: string
nullable: true
```

Record candidate behavior.

Because arbitrary schema properties are permitted in the JSON Schema-based model, the physical keyword may be preserved even though it no longer carries the OAS 3.0-defined nullable semantics.

This fixture again tests:

```text
PRESERVATION
≠
VERSION-SPECIFIC SEMANTIC MEANING
```

---

# 37. Fixture S25 — Canonical Fidelity

Create one deliberately rich OAS 3.2 schema containing:

```text
title
description
type
format
required
properties
enum
examples
default
allOf
$defs
$id
custom keyword
unevaluatedProperties
```

Serialize the candidate-neutral canonical schema evidence.

Compare it against manually established expected keys and values.

The candidate-neutral layer must not lose fields merely because they are absent from `NormalizedSchema`'s projected properties.

---

# 38. Candidate Evaluation Modes

Where publicly supported, evaluate separately:

```text
raw parse / validate representation
bundle representation
dereference representation
lint/validation-adjacent representation
traversal/lifecycle representation
```

Do not merge these into one result.

A candidate may preserve a schema before bundling and change it materially afterward.

That difference is architectural evidence.

---

# 39. Dereference Warning

Full dereference must not become the canonical schema representation.

Recursive schemas may produce:

```text
cyclic JavaScript graphs
```

after dereferencing.

The experiment may inspect dereferenced behavior where useful, but persisted result evidence must remain cycle-safe.

Canonical OAIT schema evidence should retain references rather than requiring infinite expansion.

---

# 40. Candidate-Neutral Schema Evidence

Create an experimental structure similar to:

```typescript
interface ExperimentalSchemaEvidence {
  openApiVersion: string;

  sourcePointer: string;

  schemaKind:
    | "object"
    | "boolean";

  booleanValue?: boolean;

  declaredDialect?: string;

  documentDialect?: string;

  expectedEffectiveDialect?: string;

  types?: string[];

  keywords: string[];

  ref?: string;

  refSiblingKeys?: string[];

  composition?: {
    allOf?: number;
    oneOf?: number;
    anyOf?: number;
    hasNot?: boolean;
  };

  hasRecursiveReference: boolean;

  canonical: unknown;

  candidatePath?: unknown;
}
```

This is experiment-only.

Do not promote it directly into production.

---

# 41. Canonical Representation Test

For every representative schema, persist an OAIT-neutral canonical representation containing:

```text
boolean
OR
plain JSON-compatible object
```

The representation must not contain:

* Scalar classes.
* Redocly classes.
* AST objects.
* lifecycle objects.
* cyclic runtime references.

The experiment should determine whether this canonical form can be produced without semantic loss.

---

# 42. Keyword Inventory

For rich fixtures, record:

```text
expected keywords
observed keywords
missing keywords
added keywords
rewritten keywords
```

This provides direct evidence for candidate transformations.

Example:

```yaml
expected:
  - type
  - properties
  - $defs
  - unevaluatedProperties
  - acmeQualityScore

missing: []
rewritten: []
```

---

# 43. Dialect Evidence Model

For experimental comparison, capture:

```text
declared schema dialect
document default dialect
expected effective dialect
candidate-reported dialect
```

separately.

Do not assume candidate-reported dialect is authoritative.

The normative OpenAPI/version rules determine expected effective dialect.

---

# 44. Preserve Exact Dialect URI

Dialect URI strings must be preserved exactly.

Do not:

* normalize path segments.
* fabricate a new OAS-version URI.
* strip fragments.
* replace a custom dialect URI with the OAS default.

URI interpretation belongs to the appropriate standards-aware layer.

---

# 45. OpenAPI 3.0 Schema Model

OAIT's experiment should model OAS 3.0 separately:

```text
schemaDialectModel =
oas-3.0-schema
```

Do not assign Draft 2020-12 as its effective dialect.

If a candidate internally converts OAS 3.0 to another schema representation, record the transformation explicitly.

A candidate adaptation must preserve enough original evidence to avoid misleading downstream OAIT components.

---

# 46. Unknown Keywords Are High-Risk Evidence

A candidate that drops an unknown keyword may still appear to work for common schemas while corrupting:

* custom vocabularies.
* future JSON Schema drafts.
* vendor schema keywords.
* semantic diff.
* Contract Guard.
* AI-assisted improvements.

Therefore unknown-keyword preservation is a mandatory selection concern rather than a cosmetic capability.

---

# 47. `$ref` Semantics Must Remain Version-Aware

The experiment must distinguish:

```text
OpenAPI Reference Object
```

from:

```text
JSON Schema $ref keyword
```

OAS 3.1/3.2 explicitly note that Reference Objects and Schema Objects containing `$ref` have different sibling-property behavior.

Do not create a generic rule such as:

```text
If object has $ref:
    ignore every sibling
```

for all versions and contexts.

---

# 48. Result Vocabulary

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
NOT_APPLICABLE
```

Use the same definitions established in preceding spikes.

Every `PARTIAL` and `FAIL` requires evidence.

---

# 49. Schema Behavior Matrix

The final README must include at least:

| Capability                       | Scalar | Redocly |
| -------------------------------- | ------ | ------- |
| OAS 3.0 baseline schema          |        |         |
| OAS 3.1 baseline schema          |        |         |
| OAS 3.2 baseline schema          |        |         |
| OAS 3.0 `nullable`               |        |         |
| 3.1 multi-type/null              |        |         |
| 3.2 multi-type/null              |        |         |
| Boolean `true` schema            |        |         |
| Boolean `false` schema           |        |         |
| 3.0 boolean-schema control       |        |         |
| `allOf`                          |        |         |
| `oneOf`                          |        |         |
| `anyOf`                          |        |         |
| `not`                            |        |         |
| Nested composition               |        |         |
| Direct recursion                 |        |         |
| Mutual recursion                 |        |         |
| `$ref` siblings 3.1              |        |         |
| `$ref` siblings 3.2              |        |         |
| `$ref` sibling 3.0 control       |        |         |
| `jsonSchemaDialect`              |        |         |
| `$schema` override               |        |         |
| OAS default dialect evidence     |        |         |
| Unknown keyword preservation     |        |         |
| `$defs`                          |        |         |
| Draft 2020-12 keywords           |        |         |
| `$id`                            |        |         |
| `$anchor`                        |        |         |
| `$dynamicAnchor` / `$dynamicRef` |        |         |
| External schema                  |        |         |
| External dialect override        |        |         |
| Canonical schema fidelity        |        |         |
| TypeScript representation        |        |         |
| Public APIs only                 |        |         |

---

# 50. Cross-Version Semantic Matrix

Create a separate matrix distinguishing:

```text
PRESERVED
SEMANTICALLY_SUPPORTED
DIAGNOSED
TRANSFORMED
```

for representative contrasts:

| Feature                | OAS 3.0 | OAS 3.1 | OAS 3.2 |
| ---------------------- | ------- | ------- | ------- |
| `nullable`             |         |         |         |
| `type: [string, null]` |         |         |         |
| boolean schema         |         |         |         |
| `$schema`              |         |         |         |
| `jsonSchemaDialect`    |         |         |         |
| unknown schema keyword |         |         |         |
| `$defs`                |         |         |         |
| `$ref` siblings        |         |         |         |

This matrix is one of the most important outputs of SPIKE-005.

---

# 51. TypeScript Verification

Compare runtime behavior with published candidate declarations.

Specifically inspect whether types can represent:

```text
boolean schemas
type arrays
jsonSchemaDialect
$schema
arbitrary schema keywords
```

Record separately:

```text
runtime capability
published type capability
```

A runtime/type mismatch must be explicitly reported.

Continue to record the established `skipLibCheck` limitation separately from schema-model fidelity.

---

# 52. Source Correlation

ADR-004 and ADR-005 remain authoritative for physical source evidence.

Candidate schema paths are secondary.

Representative OAIT-owned pointers should include:

```text
/components/schemas/Pet

/components/schemas/Pet/properties/name

/components/schemas/Node/properties/child/$ref

/components/schemas/Result/oneOf/0

/components/schemas/Container/$defs/Identifier
```

For external schemas preserve:

```text
physical document URI
+
original source pointer
```

Candidate bundle paths do not replace them.

---

# 53. Source Immutability

Record SHA-256 hashes for all persisted fixtures before and after execution.

They must remain identical.

---

# 54. Machine-Readable Results

Create:

```text
results/scalar.json
results/redocly.json
```

Include:

```text
environment
candidate versions
fixture hashes
baseline schemas
version behavior
boolean schemas
nullability
composition
recursion
references
dialects
unknown keywords
modern keywords
external schemas
canonical fidelity
TypeScript findings
unexpected behavior
mandatory gates
internal result hash
```

Do not serialize cyclic candidate graphs.

---

# 55. Mandatory Gates

A primary parser candidate remains viable only if OAIT can obtain sufficient evidence for all of the following:

1. OAS 3.0 schema content without silently converting it into 3.1/3.2 semantics.
2. OAS 3.1 schema content.
3. OAS 3.2 schema content.
4. Boolean schemas for 3.1/3.2.
5. Multi-type declarations including `null`.
6. OAS 3.0 `nullable` representation.
7. Composition structures.
8. Recursive-schema strategy.
9. Schema `$ref` preservation.
10. `$ref` siblings for 3.1/3.2.
11. `jsonSchemaDialect` preservation.
12. Schema-root `$schema` preservation.
13. Unknown/custom keyword preservation for 3.1/3.2.
14. Canonical schema construction without candidate-type leakage.
15. Referenced external schema strategy.
16. Public/documented API access.

A candidate may pass through OAIT-owned adaptation if the underlying semantics remain faithfully available.

A candidate that permanently discards schema keywords, boolean schema identity, dialect declarations, or material version distinctions fails the relevant gate.

---

# 56. Non-Mandatory Observations

These should be recorded but do not independently fail a parser during SPIKE-005:

* Candidate performs incomplete JSON Schema validation.
* Candidate does not compute effective dialect directly.
* Candidate has no schema-specific visitor.
* Candidate produces transformed bundle paths.
* Candidate does not understand a custom vocabulary.
* Candidate accepts an invalid cross-version construct.

Formal conformance/diagnostic quality belongs primarily to SPIKE-006.

---

# 57. Architecture Questions

The final report must explicitly answer:

1. Can `NormalizedSchema` safely use the proposed two-part projection + canonical representation?
2. Must OAIT own effective schema-dialect calculation?
3. Can candidate-provided schema types be trusted as the domain representation?
4. Can boolean schemas be represented without coercion?
5. Can OAS 3.0 nullability and OAS 3.1/3.2 null types remain distinguishable?
6. Are unknown schema keywords preserved?
7. Are `$ref` siblings preserved correctly in JSON Schema contexts?
8. Can recursive schemas remain graph-based rather than fully dereferenced?
9. Is one `CanonicalSchemaValue` type sufficient across 3.0/3.1/3.2?
10. Does the `OpenApiCapabilities.schemaDialectModel` abstraction remain valid?
11. Does `SchemaDialectInfo` need refinement?
12. Do candidates alter schemas during bundling?
13. Which candidate currently demonstrates stronger schema fidelity?
14. Does SPIKE-005 justify a new ADR?
15. Do any findings require modifying ADR-003 or the domain model before implementation?

---

# 58. Expected Architecture Direction

The preferred outcome is:

```text
Candidate parser
      ↓
Parser adapter
      ↓
Version-aware schema adapter
      ↓
┌───────────────────────────────┐
│ Common normalized projection  │
│                               │
│ +                             │
│                               │
│ Lossless canonical schema     │
└───────────────────────────────┘
      ↓
NormalizedSchema
```

Dialect determination should conceptually follow:

```text
OAS version
    ↓
document jsonSchemaDialect?
    ↓
schema-resource $schema?
    ↓
effective dialect
```

with explicit schema-level `$schema` taking precedence where applicable.

---

# 59. What Must Not Be Implemented

Do not implement production:

```text
NormalizedSchema
SchemaAdapter
SchemaDialectResolver
SchemaValidator
JSON Schema evaluator
Rules Engine
Contract Guard
CLI
AI
MCP
```

Experimental candidate-neutral transformations are permitted only inside:

```text
experiments/parser-validator-spike/spike-005/
```

---

# 60. Required Final README

The completed README must include:

1. Objective.
2. Normative version assumptions.
3. Exact environment.
4. Exact candidate versions.
5. Commands executed.
6. Fixture inventory.
7. Baseline schema results.
8. Boolean-schema findings.
9. Nullability findings.
10. Composition findings.
11. Recursion findings.
12. `$ref` and sibling findings.
13. Dialect findings.
14. Unknown/custom-keyword findings.
15. Draft 2020-12 keyword findings.
16. External-schema findings.
17. Bundle/dereference transformations.
18. TypeScript/runtime findings.
19. Canonical-schema fidelity.
20. Cross-version semantic matrix.
21. Complete comparison matrix.
22. Unexpected behavior.
23. Limitations.
24. Mandatory gates.
25. Architecture implications.
26. Candidate continuation recommendation.
27. ADR recommendation.
28. Follow-up actions.

---

# 61. Exit Criteria

SPIKE-005 is complete when OAIT can answer:

> **Can Scalar and Redocly preserve enough OpenAPI-version-specific schema and JSON Schema dialect evidence to support a conservative OAIT-owned normalized schema projection without losing canonical schema meaning?**

Completion requires:

* OAS 3.0 fixtures.
* OAS 3.1 fixtures.
* OAS 3.2 fixtures.
* Boolean-schema tests.
* Nullability contrasts.
* Composition tests.
* Recursive schemas.
* `$ref` sibling tests.
* Dialect-default and override tests.
* Unknown keyword tests.
* Modern JSON Schema keyword tests.
* External schema tests.
* Scalar evidence.
* Redocly evidence.
* Machine-readable results.
* Mandatory-gate evaluation.
* Architecture conclusions.
* Candidate continuation recommendation.

---

# 62. Follow-Up Relationship

After SPIKE-005:

```text
SPIKE-005
Schema / dialect behavior
        ↓
SPIKE-006
Validator capabilities and diagnostics
        ↓
SPIKE-007
Performance / operational suitability
        ↓
Parser-validator evaluation summary
        ↓
Final parser / validator ADR(s)
```

Do not select the final parser from SPIKE-005 alone unless a candidate suffers an unequivocal mandatory-gate failure.

---

# 63. Guiding Principle

> **Normalize what OAIT understands; preserve everything the schema means.**
