# SPIKE-004: Evaluate OpenAPI 3.2 Operation Behavior

**Status:** Planned  
**Date:** 2026-08-09  
**Phase:** Technical Validation  
**Target release:** OAIT v0.1  
**Predecessors:** `SPIKE-001-parser-version-support.md`, `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`, `SPIKE-LOC-001-source-location-technology.md`  
**Related architecture:** `system-architecture.md`, `openapi-domain-model.md`, `source-processing-design.md`  
**Related ADRs:** `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`

---

# 1. Objective

Determine whether the shortlisted OpenAPI parser candidates correctly preserve and expose OpenAPI 3.2 operation structures so OAIT can discover and normalize all operations without hard-coding only the traditional HTTP method fields.

The spike must specifically evaluate:

- Fixed `query` operations.
- `additionalOperations`.
- Arbitrary additional HTTP method names.
- HTTP method capitalization.
- Traditional fixed operations.
- Path-level parameter inheritance.
- Operation-level parameter overrides.
- OpenAPI 3.2 `querystring` parameters.
- Operation identity.
- Source-path correlation.
- Cross-version behavior for OpenAPI 3.0 and 3.1.
- Candidate transformations caused by bundling or traversal APIs.

The spike does not implement production `NormalizedOperation` construction. It validates that the required evidence can be obtained reliably.

---

# 2. Why This Spike Exists

The original OAIT parser architecture cannot assume that an operation is discovered using only:

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

OpenAPI 3.2 introduces additional operation representation mechanisms.

A naïve implementation such as:

```typescript
for (const method of [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace"
]) {
  // discover operation
}
```

would omit valid OpenAPI 3.2 operations.

OAIT therefore requires evidence for a version-aware operation-discovery strategy before the parser and normalization implementation is finalized.

---

# 3. Normative OpenAPI 3.2 Basis

The experiment must use OpenAPI Specification 3.2.0 as the normative behavior baseline.

The relevant specification areas are:

```text
OAS 3.2.0
├── Path Item Object
├── Operation Object
├── Parameter Object
├── Responses Object
└── Reference / multi-document behavior where applicable
```

For a Path Item Object, OpenAPI 3.2 defines the fixed operation fields:

```text
get
put
post
delete
options
head
patch
trace
query
```

and additionally defines:

```text
additionalOperations
```

as a map of further HTTP-method operations.

---

# 4. `query` Operation Requirement

OpenAPI 3.2 defines:

```yaml
query:
  operationId: searchPets
  responses:
    "200":
      description: Search results
```

as a first-class Operation Object on a Path Item.

OAIT must therefore treat `query` as an operation kind for OpenAPI 3.2.

The normalized representation should preserve the HTTP method semantically as `QUERY` while retaining original source evidence separately.

The spike must determine whether each candidate:

1. Parses the field.
2. Preserves the Operation Object.
3. Exposes it through supported traversal APIs.
4. Preserves it during bundling where applicable.
5. Preserves its operationId.
6. Preserves its parameters.
7. Preserves its request body.
8. Preserves its responses.
9. Allows OAIT to identify the physical source location independently.

---

# 5. `additionalOperations` Requirement

OpenAPI 3.2 defines structures such as:

```yaml
additionalOperations:
  COPY:
    operationId: copyPet
    responses:
      "200":
        description: Pet copied
```

The map key identifies the HTTP method to send.

Unlike fixed Path Item operation field names, which are lower-case OpenAPI field names, the additional-operation map key preserves HTTP method capitalization.

OAIT must not normalize these by naïvely lower-casing them before preserving their declared HTTP-method identity.

---

# 6. Additional Operation Method Identity

The spike must test at least:

```text
COPY
POLL
PURGE
FOO
MiXeD
```

as experimental additional operation keys.

The purpose is not to endorse any specific non-standard HTTP method. It is to determine whether the parser:

- Preserves the exact map key.
- Rewrites capitalization.
- Filters unknown methods.
- Treats them as extension fields.
- Drops them.
- Exposes them through traversal.
- Bundles them correctly.

OAIT should retain `declaredMethod` separately from any future canonical or comparison representation.

---

# 7. Fixed-Method Collision Rule

OpenAPI 3.2 does not permit `additionalOperations` entries for methods already represented by fixed Operation Object fields.

For example:

```yaml
post:
  operationId: createPet

additionalOperations:
  POST:
    operationId: duplicateCreatePet
```

must not be treated as two valid independent POST operations.

The spike must determine:

- Whether the candidate parser rejects it.
- Whether the candidate preserves it with diagnostics.
- Whether it silently accepts it.
- Whether validation is required separately to detect it.

This distinction helps separate parser responsibility from validator responsibility and should not prematurely penalize a parser merely because semantic validation belongs elsewhere.

---

# 8. Traditional Operations Control

Create a fixture containing all traditional fixed operation fields:

```text
GET
PUT
POST
DELETE
OPTIONS
HEAD
PATCH
TRACE
```

plus `QUERY` and multiple `additionalOperations`.

This verifies that 3.2 support does not regress traditional operation discovery.

Expected operation count must be manually established before candidate execution.

---

# 9. Primary Research Question

> **Can each shortlisted parser provide sufficient stable evidence for OAIT to discover every OpenAPI 3.2 operation through a centralized version-aware operation-discovery service?**

---

# 10. Secondary Research Questions

The spike must answer:

1. Does the candidate recognize `query` as an Operation Object?
2. Does it preserve `additionalOperations`?
3. Are additional-operation keys preserved exactly?
4. Are operation objects accessible before and after candidate transformation?
5. Does bundling alter their paths?
6. Can operations inside referenced Path Item Objects be discovered?
7. Can operationId values be enumerated across all operation kinds?
8. Can path-level parameters be associated with all operation kinds?
9. Can operation-level overrides be identified?
10. Can 3.2 `querystring` parameters be preserved?
11. Does the candidate incorrectly discover 3.2-only fields for 3.0/3.1?
12. Do candidate TypeScript definitions represent the runtime structures accurately?
13. Can all required evidence be mapped into OAIT-owned operation-discovery contracts?

---

# 11. Candidates

Continue the shortlisted parser candidates from the preceding spikes:

```text
@scalar/openapi-parser@0.28.10
@redocly/openapi-core@2.40.0
```

Use the same exact versions initially so SPIKE-004 isolates OpenAPI 3.2 operation behavior rather than introducing a dependency-version change.

If a candidate demonstrably fails only because the pinned version lacks an implementation that a newer stable release has added, that may be investigated as a clearly separated secondary experiment.

Any secondary version must be exact, recorded separately, not overwrite baseline results, include an upgrade rationale, and be treated as separate evidence.

Do not silently upgrade dependencies.

---

# 12. Experimental Directory

Use:

```text
experiments/parser-validator-spike/spike-004/
├── fixtures/
│   ├── valid/
│   ├── cross-version/
│   ├── referenced/
│   └── invalid/
│
├── scalar/
│   └── evaluate.ts
│
├── redocly/
│   └── evaluate.ts
│
├── shared/
│   ├── expected.ts
│   └── types.ts
│
├── results/
│   ├── scalar.json
│   └── redocly.json
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

Do not add production operation-discovery code under `packages/`.

---

# 13. Fixture V1 — Minimal `query`

Create `fixtures/valid/query-minimal.yaml` with one fixed `query` operation.

Example:

```yaml
paths:
  /search:
    query:
      operationId: search
      responses:
        "200":
          description: Search results
```

Expected:

```text
operation count = 1
operation method = QUERY
operation source field = query
operationId = search
```

---

# 14. Fixture V2 — All Fixed Operations

Create one Path Item containing:

```text
get
put
post
delete
options
head
patch
trace
query
```

Each Operation Object must have a unique `operationId`.

Expected:

```text
operation count = 9
```

The experiment must verify that no operation is omitted or duplicated.

---

# 15. Fixture V3 — `additionalOperations`

Create:

```yaml
paths:
  /pets/{id}:
    additionalOperations:
      COPY:
        operationId: copyPet
        responses:
          "200":
            description: Copied

      PURGE:
        operationId: purgePet
        responses:
          "204":
            description: Purged
```

Expected:

```text
operation count = 2
COPY
PURGE
```

Both keys must be preserved exactly.

---

# 16. Fixture V4 — Fixed + Additional Operations

Create one Path Item containing:

```text
GET
POST
QUERY
COPY
PURGE
```

represented correctly using fixed fields plus `additionalOperations`.

Expected:

```text
operation count = 5
```

This is the primary representative operation-discovery fixture.

---

# 17. Fixture V5 — Multiple Paths

Create at least three path items containing different combinations:

```text
/pets
    GET
    POST

/search
    QUERY

/pets/{id}
    GET
    DELETE
    COPY
```

Expected total operation count must be manually established.

The candidate must not require per-path hard-coded method assumptions.

---

# 18. Fixture V6 — Additional Method Case Preservation

Create:

```yaml
additionalOperations:
  MiXeD:
    operationId: mixedMethod
    responses:
      "200":
        description: Test
```

Record whether the candidate preserves `MiXeD` exactly.

OAIT must not infer that a candidate-normalized spelling is source truth.

---

# 19. Fixture V7 — Path-Level Parameters

Create a path-level path parameter and operations using GET, QUERY, and an additional method.

Example:

```yaml
paths:
  /pets/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string

    get:
      operationId: getPet
      responses:
        "200":
          description: Found

    query:
      operationId: queryPet
      responses:
        "200":
          description: Found

    additionalOperations:
      COPY:
        operationId: copyPet
        responses:
          "200":
            description: Copied
```

Required evidence:

```text
path parameter visible
GET operation discoverable
QUERY operation discoverable
COPY operation discoverable
```

The spike need not implement the production effective-parameter algorithm. It must determine whether sufficient declared evidence survives for that future algorithm.

---

# 20. Fixture V8 — Operation Parameter Override

Create a path-level parameter with:

```text
name = tenant
in = header
```

and override the same identity at QUERY and one additional operation.

Verify candidate preservation of path declaration plus operation declaration without prematurely computing the effective parameter set.

The normalized model will later perform inheritance/override calculation.

---

# 21. Fixture V9 — `querystring`

OpenAPI 3.2 introduces:

```text
in: querystring
```

for a parameter that models the complete URL query string.

Create a valid operation such as:

```yaml
query:
  operationId: structuredSearch
  parameters:
    - name: search
      in: querystring
      content:
        application/x-www-form-urlencoded:
          schema:
            type: object
            properties:
              q:
                type: string
              limit:
                type: integer
  responses:
    "200":
      description: Results
```

Required evidence:

- Parameter is preserved.
- `in` remains `querystring`.
- `content` remains accessible.
- Schema remains accessible for later SPIKE-005 analysis.

Do not deeply evaluate schema semantics here.

---

# 22. Fixture V10 — Additional Operation with `querystring`

Create an `additionalOperations.SEARCH` operation with an `in: querystring` parameter.

This ensures `querystring` support is not accidentally coupled only to the fixed `query` operation.

---

# 23. Fixture V11 — Request Body

Create QUERY and COPY operations that contain request bodies.

Verify that candidate traversal does not omit `requestBody` because the operation method is unfamiliar.

Required evidence:

```text
requestBody present
content present
schema reachable
```

Schema semantics remain SPIKE-005 scope.

---

# 24. Fixture V12 — Responses

Each operation kind should include representative responses.

Use examples such as:

```text
200
204
4XX
default
```

across the fixture corpus.

The spike must verify that response maps remain attached to the correct discovered operation.

Deep validator behavior remains SPIKE-006 scope.

---

# 25. Fixture V13 — Response `summary`

OpenAPI 3.2 Response Objects support both `summary` and `description` fields.

Include at least one Response Object using both fields.

This verifies that candidate 3.2 handling does not discard newer response metadata while traversing an operation.

This is a preservation check only.

---

# 26. Fixture V14 — OperationId Enumeration

Create unique operation IDs for:

```text
GET
QUERY
COPY
PURGE
```

Expected enumeration:

```text
getPets
queryPets
copyPet
purgePet
```

The spike must determine whether OAIT can enumerate operation IDs across all operation forms using one discovery mechanism.

Actual duplicate-operationId validation belongs to SPIKE-006.

---

# 27. Fixture V15 — Referenced Path Item

Create:

```text
openapi.yaml
        ↓
paths/pets.yaml
```

where the referenced Path Item contains QUERY and COPY.

Required evidence:

- Physical referenced document remains known through the OAIT-owned source evidence layer.
- Candidate can process the referenced Path Item.
- QUERY remains discoverable.
- COPY remains discoverable.
- Candidate transformation does not silently drop the new operation forms.

Reuse SPIKE-002/003 source-provenance principles.

---

# 28. Fixture V16 — Nested Referenced Operation Content

Place a referenced schema or parameter under QUERY and `additionalOperations.COPY`.

The purpose is only to verify that candidate reference traversal still reaches structures nested under the newer operation locations.

Do not repeat the complete reference-resolution spike.

---

# 29. Cross-Version Control — OpenAPI 3.1

Create a 3.1 fixture containing ordinary GET/POST operations and raw properties named `query` and `additionalOperations` where practical.

The experiment must determine whether the candidate:

- Preserves unknown fields.
- Treats them as official operations.
- Ignores them.
- Reports them.
- Exposes them only as generic properties.

OAIT's version-aware discovery must **not** automatically interpret OpenAPI 3.2 fixed fields as standard 3.1 operations.

---

# 30. Cross-Version Control — OpenAPI 3.0

Repeat the equivalent control for OpenAPI 3.0.

The purpose is not to require parser rejection of unknown fields.

The purpose is to determine whether OAIT can distinguish:

```text
field preserved
```

from:

```text
field semantically recognized as an operation
```

---

# 31. Optional Compatibility Observation

The OpenAPI Initiative maintains an extension named `x-oai-additionalOperations` for representing non-standard methods in pre-3.2 descriptions.

This extension is not required for OAIT v0.1 support in SPIKE-004.

If either parser recognizes it automatically, record the behavior as an observation only.

Do not expand SPIKE-004 into extension-support design without a separate requirement.

---

# 32. Invalid Fixture I1 — Fixed-Method Collision

Create:

```yaml
post:
  operationId: normalPost

additionalOperations:
  POST:
    operationId: duplicatePost
```

Record parser behavior.

Classification:

```text
PARSER_ACCEPTS
PARSER_REJECTS
PARSER_PRESERVES_WITH_DIAGNOSTIC
```

Do not require the parser itself to validate all normative constraints. The result informs SPIKE-006.

---

# 33. Invalid Fixture I2 — Duplicate `querystring`

Create two `in: querystring` parameters applicable to the same operation.

Record whether the parser preserves both, rejects, or diagnoses.

Semantic conformance evaluation remains SPIKE-006 scope.

---

# 34. Invalid Fixture I3 — `query` + `querystring`

Create an operation/path combination containing `in: query` and `in: querystring` together.

Record parser behavior without requiring rejection.

---

# 35. Invalid Fixture I4 — Empty `additionalOperations`

Create:

```yaml
additionalOperations: {}
```

Record candidate behavior.

Do not infer validity unless the normative specification explicitly requires non-emptiness. This fixture primarily tests preservation and transformation behavior.

---

# 36. Candidate Evaluation Modes

Each candidate should be evaluated through all relevant supported modes.

Where available:

```text
parse
bundle
traversal / visitor
validation-adjacent API
```

Do not assume that success through one candidate API means all candidate APIs preserve the same operation evidence.

---

# 37. Raw Parse Evidence

For each candidate record whether the raw parsed representation exposes:

```text
query
additionalOperations
additional-operation keys
parameters
requestBody
responses
operationId
```

before bundling.

---

# 38. Bundled Evidence

Where the candidate provides bundling, repeat representative fixtures after bundling.

Record:

- Operation count.
- Operation kinds.
- Additional method keys.
- Source transformation.
- Pointer/path changes.
- Whether operation content is preserved.

Bundled locations are not canonical OAIT source locations.

---

# 39. Traversal Evidence

If the candidate provides visitor/lifecycle traversal, determine whether callbacks are emitted for:

```text
query
additionalOperations.COPY
additionalOperations.PURGE
```

and whether traversal paths are sufficiently understandable to adapt.

Do not assume candidate traversal paths are canonical JSON Pointers.

---

# 40. Candidate-Neutral Operation Evidence

Normalize experiment output into a candidate-independent structure.

Conceptually:

```typescript
interface ExperimentalOperationEvidence {
  path: string;

  sourceKind:
    | "fixed"
    | "additional";

  declaredFieldOrKey: string;
  httpMethod: string;
  operationId?: string;
  parameterCount: number;
  hasRequestBody: boolean;
  responseKeys: string[];
  sourceDocumentUri?: string;
  candidatePath?: unknown;
}
```

This interface is experimental only. Do not promote it directly into production.

---

# 41. Expected Operation Identity

For experiment comparison, an operation can be identified by:

```text
path template
+
HTTP method
```

with `operationId` recorded separately.

Examples:

```text
/search + QUERY
/pets/{id} + COPY
```

This does not finalize the production operation identity model.

---

# 42. Operation Discovery Hypothesis

The experiment should test the following architectural hypothesis:

```text
OperationDiscovery
      ↓
OpenAPI version capabilities
      ↓
Path Item
      ├── version-supported fixed operation fields
      └── version-supported additional operation map
      ↓
NormalizedOperation[]
```

rather than:

```text
Path Item
↓
hard-coded eight traditional methods
```

---

# 43. Version Capability Hypothesis

The domain model already anticipates version capabilities.

SPIKE-004 should determine whether capabilities such as:

```typescript
interface OpenApiCapabilities {
  supportsQueryOperation: boolean;
  supportsAdditionalOperations: boolean;
}
```

or equivalent behavior are sufficient to isolate version-specific operation discovery.

Exact production field names remain deferred.

---

# 44. Do Not Infer Operations from Arbitrary Objects

A generic object-valued field on a Path Item must not automatically become an operation merely because it resembles an Operation Object.

For example:

```yaml
someFutureField:
  operationId: misleading
```

must not be discovered unless supported by the applicable OpenAPI version semantics or an explicitly supported extension.

This is essential for forward compatibility.

---

# 45. Preservation vs Semantic Recognition

Results must distinguish:

```text
PRESERVED
```

from:

```text
SEMANTICALLY_RECOGNIZED
```

A candidate may preserve `query` as ordinary object data while failing to understand it as an operation. That is materially different from dropping it.

---

# 46. Capability Status Vocabulary

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
NOT_APPLICABLE
```

### PASS

Candidate provides the required evidence reliably using public/documented APIs.

### PARTIAL

Evidence exists but requires adaptation or has a material limitation.

### FAIL

Candidate behavior loses, corrupts, or incorrectly transforms required evidence.

### NOT_SUPPORTED

The evaluated supported API provides no usable capability.

### NOT_APPLICABLE

The capability does not apply to that mode/candidate.

---

# 47. Required Comparison Matrix

The final README must include at least:

| Capability | Scalar | Redocly |
|---|---|---|
| Parse OAS 3.2 | | |
| Preserve fixed GET | | |
| Preserve fixed QUERY | | |
| Traverse fixed QUERY | | |
| Preserve `additionalOperations` | | |
| Preserve COPY | | |
| Preserve PURGE | | |
| Preserve exact additional method case | | |
| Mixed fixed/additional discovery | | |
| Path-level parameters | | |
| Operation override evidence | | |
| Preserve `querystring` | | |
| Preserve request body under QUERY | | |
| Preserve request body under additional operation | | |
| Preserve responses | | |
| Preserve response summary | | |
| Enumerate operationIds | | |
| Referenced Path Item QUERY | | |
| Referenced Path Item additional operation | | |
| Bundle preservation | | |
| Candidate traversal support | | |
| OAS 3.1 control behavior | | |
| OAS 3.0 control behavior | | |
| TypeScript representation | | |
| Public APIs only | | |

---

# 48. Negative/Invalid Behavior Matrix

Also record:

| Invalid case | Scalar | Redocly |
|---|---|---|
| Fixed POST + `additionalOperations.POST` | | |
| Duplicate `querystring` | | |
| `query` + `querystring` combination | | |
| Invalid additional operation value | | |
| Duplicate operationId across operation forms | | |

The spike should record candidate behavior. Conformance quality is evaluated formally in SPIKE-006.

---

# 49. TypeScript Verification

For each candidate verify runtime representation versus published TypeScript declarations for at least:

```text
query
additionalOperations
```

A runtime/type mismatch must be recorded explicitly.

Use the same strict TypeScript configuration where practical:

```text
ESM
NodeNext
skipLibCheck: false
```

If the candidate dependency graph prevents this, record it consistently with preceding spike evidence.

---

# 50. Source-Location Correlation

SPIKE-004 does not ask candidates to become the canonical source-location provider.

ADR-004 and ADR-005 have already resolved that responsibility.

Instead, verify that each discovered operation can be correlated conceptually to OAIT-owned source pointers such as:

```text
/paths/~1search/query
/paths/~1pets~1{id}/additionalOperations/COPY
```

Candidate transformation paths must remain secondary evidence.

---

# 51. Expected Source Pointers

Representative source pointers should be manually established before candidate execution.

Examples:

```text
/paths/~1search/query
/paths/~1pets~1{id}/additionalOperations/COPY
/paths/~1pets~1{id}/additionalOperations/PURGE
/paths/~1search/query/parameters/0
/paths/~1search/query/responses/200
```

OAIT's RFC 6901 encoder remains authoritative.

---

# 52. Source Immutability

Record SHA-256 hashes of all persisted fixtures before and after execution.

They must be identical.

Candidates must not modify source fixtures.

---

# 53. Reproducibility

Record:

```text
date
OS
architecture
Node.js version
npm version
TypeScript version
Scalar version
Redocly version
tsx version
compiler/module settings
fixture hashes
result hashes
commands
```

Provide:

```bash
npm ci
npm run run
```

or equivalent clean reproduction instructions.

---

# 54. Machine-Readable Results

Create:

```text
results/scalar.json
results/redocly.json
```

Each result should contain at least:

```json
{
  "environment": {},
  "candidate": {},
  "fixtures": [],
  "operationDiscovery": {},
  "crossVersion": {},
  "invalidCases": {},
  "typescript": {},
  "unexpectedBehavior": [],
  "resultHash": ""
}
```

Do not serialize candidate cyclic graphs directly.

---

# 55. Mandatory Gates

A parser candidate remains viable only if OAIT can establish a credible OpenAPI 3.2 strategy.

For SPIKE-004, the candidate must at minimum allow OAIT to obtain:

1. Traditional fixed operations.
2. Fixed `query`.
3. `additionalOperations`.
4. Exact additional-operation method keys.
5. Operation Objects under both representations.
6. OperationId.
7. Parameters.
8. Responses.
9. Referenced Path Item operations.
10. Sufficient raw evidence for OAIT-owned normalization.
11. Version-aware differentiation between 3.2 behavior and earlier-version controls.
12. Public/documented API access.

A candidate may satisfy a gate through OAIT adaptation if the required source semantics remain intact.

A candidate that permanently drops a valid OpenAPI 3.2 operation fails the relevant gate.

---

# 56. Decision Interpretation

SPIKE-004 does **not** select the final parser by itself.

Possible outcomes include:

### Outcome A

Both candidates fully support the required operation evidence.

```text
Both continue.
```

### Outcome B

One candidate has materially stronger native 3.2 operation support.

```text
Both may continue,
but evidence favors one.
```

### Outcome C

One candidate drops or corrupts 3.2 operation structures.

```text
Candidate may fail mandatory parser gate.
```

### Outcome D

Neither candidate provides sufficient semantic operation discovery, but both preserve raw structures.

```text
OAIT-owned version-aware discovery remains feasible.
Both may continue conditionally.
```

### Outcome E

Neither candidate preserves sufficient 3.2 structures.

```text
Evaluate another parser/version strategy.
```

---

# 57. Architecture Questions to Answer

The final report must explicitly answer:

1. Must OAIT own operation discovery?
2. Can candidate-native operation traversal be trusted?
3. Should OAIT discover operations from raw/version-adapted structures instead?
4. Does `query` require special-case logic?
5. Can `additionalOperations` be normalized through the same operation contract?
6. How should additional method capitalization be preserved?
7. Does the domain model need both source kind and HTTP method?
8. Can fixed and additional operations use one `NormalizedOperation` shape?
9. Does the OpenAPI capability model require refinement?
10. Do parser-specific structures leak into normalization?
11. Does cross-version handling require explicit adapters?
12. Does this evidence justify any new ADR?

---

# 58. Expected Architecture Direction

The preferred result is an operation-discovery service conceptually like:

```text
VersionAdapter
      ↓
OperationDiscovery
      ↓
Path Item
      ├── supported fixed operation fields
      └── additional operations
      ↓
DiscoveredOperation[]
      ↓
DomainNormalizer
      ↓
NormalizedOperation[]
```

The final implementation design remains deferred until spike evidence is reviewed.

---

# 59. What Must Not Be Implemented

Do not implement production:

```text
OperationDiscovery
VersionAdapter
NormalizedOperation
NormalizedParameter
Rules Engine
Validator Adapter
CLI commands
```

Experimental code must remain under:

```text
experiments/parser-validator-spike/spike-004/
```

---

# 60. Required Final README

The final experiment README must include:

1. Objective.
2. Normative 3.2 assumptions tested.
3. Exact environment.
4. Exact dependency versions.
5. Commands executed.
6. Fixture inventory.
7. Expected operation inventory.
8. Complete candidate comparison matrix.
9. Invalid-case matrix.
10. Raw parse findings.
11. Bundle findings.
12. Traversal findings.
13. Cross-version findings.
14. `querystring` findings.
15. TypeScript findings.
16. Source correlation findings.
17. Unexpected behavior.
18. Limitations.
19. Mandatory-gate results.
20. Architecture implications.
21. Candidate continuation recommendation.
22. Follow-up actions.

---

# 61. Exit Criteria

SPIKE-004 is complete when OAIT can answer:

> **Can the shortlisted parser candidates preserve sufficient OpenAPI 3.2 operation evidence for OAIT to discover traditional operations, QUERY, and arbitrary `additionalOperations` through a centralized version-aware normalization architecture?**

Completion requires:

- Representative valid fixtures.
- Cross-version fixtures.
- Invalid fixtures.
- Scalar experiment.
- Redocly experiment.
- Machine-readable results.
- Source immutability verification.
- Mandatory-gate evaluation.
- Architecture conclusions.
- Candidate continuation recommendation.

---

# 62. Follow-Up Relationship

After SPIKE-004:

```text
SPIKE-004
OpenAPI 3.2 operations
        ↓
SPIKE-005
Schema / dialect behavior
        ↓
SPIKE-006
Validator diagnostics
        ↓
SPIKE-007
Performance / operational suitability
        ↓
Parser-validator evaluation summary
        ↓
Final parser / validator ADR(s)
```

Do not make the final parser selection after SPIKE-004 alone unless a candidate experiences an unequivocal mandatory-gate failure.

---

# 63. Guiding Principle

> **Discover operations from OpenAPI semantics, not from a hard-coded list of yesterday's HTTP methods.**
