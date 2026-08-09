# OpenAPI Intelligence Toolkit (OAIT)

## Normalized OpenAPI Domain Model

**Document version:** 0.1
**Project status:** Architecture and Design
**Model status:** Proposed architectural contract
**Release applicability:** OAIT v0.1 and later
**Related ADR:** `ADR-003-normalized-openapi-domain-model.md`
**Related documents:** `system-architecture.md`, `rule-schema.md`, `rule-catalog.md`, `openapi-quality-model.md`
**Project:** OpenAPI Intelligence Toolkit (OAIT)

---

# 1. Purpose

This document defines the normalized logical OpenAPI domain model used internally by the **OpenAPI Intelligence Toolkit (OAIT)**.

The model establishes the stable architectural boundary between:

```text
OpenAPI source documents
        ↓
Parsing / Reference Resolution / Version Adaptation
        ↓
OAIT Normalized Domain Model
        ↓
Validation / Review / Rules / Scoring
        ↓
Future AI / Diff / Enhancement / Release Notes
```

The domain model gives downstream OAIT components a consistent representation of OpenAPI concepts without requiring those components to understand:

* YAML versus JSON serialization.
* Raw document traversal.
* OpenAPI version-specific field discovery.
* Path-level versus operation-level parameter inheritance.
* Inline versus referenced definitions.
* Multi-file physical layout.
* Third-party parser-specific object types.

The normalized model must preserve enough source and version information to avoid hiding meaningful OpenAPI semantics.

---

# 2. Architectural Decision

This document implements the decision established by:

```text
ADR-003 — Use a Normalized, Version-Aware OpenAPI Domain Model
```

The central principle is:

> **Rules and higher-level OAIT capabilities operate on OAIT-owned normalized domain concepts rather than directly traversing raw OpenAPI YAML or JSON.**

Normalization must simplify consumption without rewriting the API contract or discarding meaningful source semantics.

---

# 3. Scope

The v0.1 domain model primarily supports:

* OpenAPI 3.0.x.
* OpenAPI 3.1.x.
* OpenAPI 3.2.x.
* Validation.
* Deterministic review.
* Rule evaluation.
* Quality scoring.
* Quality-gate enforcement.
* Reporting.

The architecture must also remain suitable for future:

* AI-assisted semantic review.
* OpenAPI enhancement.
* Contract Guard.
* Semantic diff.
* Breaking-change detection.
* Release-note generation.
* OpenAPI creation.
* MCP tools.

OpenAPI 3.2 adds operation forms such as `query` and `additionalOperations`, so operation discovery cannot be based on a fixed list of the traditional HTTP method fields.

---

# 4. Non-Goals

The domain model is not intended to:

* Replace the OpenAPI Specification.
* Reproduce every OpenAPI Object field one-for-one.
* Convert all OpenAPI versions into OpenAPI 3.2.
* Fully dereference the entire specification into one flattened object.
* Rewrite Schema Objects into an OAIT-specific schema language.
* Hide version-specific semantics.
* Become a new API-description format.
* Serve as the persisted user-facing OpenAPI representation.

The original OpenAPI source remains authoritative.

The normalized model is an **analysis representation**.

---

# 5. Domain Model Principles

## DM-PRN-001 — Preserve meaning, normalize representation

Equivalent concepts should be represented consistently even if their source representation differs.

---

## DM-PRN-002 — Preserve source traceability

Every significant normalized object should retain its original physical source location.

---

## DM-PRN-003 — Preserve reference provenance

A referenced object and an inline object may normalize to the same logical type, but OAIT must retain information about how each object was declared.

---

## DM-PRN-004 — Do not over-normalize

Where OpenAPI-version or JSON Schema semantics differ materially, the model must retain those differences rather than inventing false equivalence.

---

## DM-PRN-005 — Provide effective views separately from declared views

Derived concepts such as effective operation parameters should not overwrite the user's declared structures.

---

## DM-PRN-006 — OAIT owns domain contracts

Core OAIT packages should depend on OAIT-defined types rather than third-party parser types.

---

## DM-PRN-007 — Raw access is an escape hatch

Raw source information may remain available for uncommon cases, but normal rule development must use normalized properties.

---

## DM-PRN-008 — Deterministic derivations must be reproducible

The same source documents and OpenAPI version must produce the same normalized model.

---

# 6. High-Level Entity Relationships

```text
NormalizedOpenApiDocument
│
├── OpenApiVersion
├── OpenApiCapabilities
├── NormalizedInfo
│
├── operations[]
│   └── NormalizedOperation
│       ├── declaredParameters[]
│       ├── effectiveParameters
│       │   └── NormalizedParameter[]
│       ├── NormalizedRequestBody
│       ├── NormalizedResponses
│       │   └── NormalizedResponse[]
│       ├── NormalizedTag references
│       └── NormalizedSecurityRequirement[]
│
├── schemas[]
│   └── NormalizedSchema
│       └── NormalizedSchemaProperty[]
│
├── tags[]
│   └── NormalizedTag
│
├── securitySchemes[]
│   └── NormalizedSecurityScheme
│
├── securityRequirements[]
│
└── sourceDocuments[]
```

All significant entities may additionally reference:

```text
SourceLocation
ReferenceOrigin
RawSourceHandle
```

---

# 7. Conceptual Root Interface

The following TypeScript is illustrative, not yet an implementation commitment.

```typescript
interface NormalizedOpenApiDocument {
  version: OpenApiVersion;

  capabilities: OpenApiCapabilities;

  info: NormalizedInfo;

  operations: NormalizedOperation[];

  schemas: NormalizedSchema[];

  tags: NormalizedTag[];

  securitySchemes: NormalizedSecurityScheme[];

  securityRequirements: NormalizedSecurityRequirement[];

  entrySource: SourceLocation;

  sourceDocuments: SourceDocumentMetadata[];

  raw: RawSourceHandle;
}
```

Detailed runtime interfaces will be finalized during implementation design.

---

# 8. `OpenApiVersion`

## 8.1 Purpose

Represents the OpenAPI version declared by the entry document in a structured form.

The model should not pass version strings around as unparsed arbitrary text.

---

## 8.2 Conceptual Model

```typescript
interface OpenApiVersion {
  raw: string;

  major: number;
  minor: number;
  patch: number;

  family:
    | "3.0"
    | "3.1"
    | "3.2";

  supported: boolean;
}
```

Example:

```yaml
raw: "3.1.2"
major: 3
minor: 1
patch: 2
family: "3.1"
supported: true
```

---

## 8.3 `raw`

Preserves the exact declared value.

Example:

```text
3.1.2
```

---

## 8.4 `family`

Provides the major/minor semantic family used for OAIT feature selection.

Examples:

```text
3.0
3.1
3.2
```

Rules should normally depend on:

```text
family
```

or capabilities rather than manually parsing `raw`.

---

## 8.5 Invariant

```text
OpenApiVersion.raw
```

must always correspond to the version detected from the entry OpenAPI document.

OAIT must not silently rewrite:

```text
3.0.x
```

into:

```text
3.2.x
```

during normalization.

---

# 9. `OpenApiCapabilities`

## 9.1 Purpose

Represents relevant OpenAPI features implied by the source version.

This reduces scattered logic such as:

```typescript
if (version.startsWith("3.2")) {
   ...
}
```

---

## 9.2 Conceptual Model

```typescript
interface OpenApiCapabilities {
  operationKinds: ReadonlySet<string>;

  supportsQueryOperation: boolean;

  supportsAdditionalOperations: boolean;

  supportsQueryStringParameter: boolean;

  supportsResponseSummary: boolean;

  responseDescriptionRequired: boolean;

  supportsBooleanSchemas: boolean;

  schemaDialectModel:
    | "oas-3.0-schema"
    | "json-schema-dialect";

  supportsJsonSchemaDialectDeclaration: boolean;
}
```

---

## 9.3 Example Capability Sets

Conceptually:

```yaml
version: "3.0"
supportsQueryOperation: false
supportsAdditionalOperations: false
supportsQueryStringParameter: false
supportsResponseSummary: false
responseDescriptionRequired: true
supportsBooleanSchemas: false
schemaDialectModel: oas-3.0-schema
```

and:

```yaml
version: "3.2"
supportsQueryOperation: true
supportsAdditionalOperations: true
supportsQueryStringParameter: true
supportsResponseSummary: true
responseDescriptionRequired: false
supportsBooleanSchemas: true
schemaDialectModel: json-schema-dialect
```

OpenAPI 3.2 defines `query`, `additionalOperations`, and `querystring`, and its Response Object contains both optional `summary` and `description` fields.

---

## 9.4 Design Rule

Capabilities should be created centrally by the version adapter.

Individual rules must not independently derive them.

---

# 10. `NormalizedOpenApiDocument`

## 10.1 Purpose

Represents the complete logical OpenAPI Description being analyzed.

The OpenAPI Description may consist of multiple physical documents connected through references. OpenAPI 3.2 explicitly defines an OpenAPI Description as potentially consisting of multiple documents, with one document acting as the entry document.

---

## 10.2 Conceptual Model

```typescript
interface NormalizedOpenApiDocument {
  version: OpenApiVersion;

  capabilities: OpenApiCapabilities;

  info: NormalizedInfo;

  operations: NormalizedOperation[];

  schemas: NormalizedSchema[];

  tags: NormalizedTag[];

  securitySchemes: NormalizedSecurityScheme[];

  securityRequirements: NormalizedSecurityRequirement[];

  entrySource: SourceLocation;

  sourceDocuments: SourceDocumentMetadata[];

  extensions?: Readonly<Record<string, unknown>>;

  raw: RawSourceHandle;
}
```

---

## 10.3 Responsibilities

The normalized document provides the canonical entry point for downstream analysis.

Consumers should be able to ask:

```text
Give me all operations.
Give me all named schemas.
Give me all declared tags.
Give me all security schemes.
What OpenAPI capabilities are available?
```

without traversing raw source documents.

---

## 10.4 Operation Collection

`operations` should represent operations discovered through supported OpenAPI structures.

Each operation must retain its origin.

For example:

```text
PATH
WEBHOOK
CALLBACK
```

v0.1 quality rules may intentionally scope themselves to `PATH` operations.

The architecture should not assume that every Operation Object necessarily represents a normal client-to-server path operation.

---

# 11. `NormalizedInfo`

## 11.1 Purpose

Represents normalized root API metadata.

---

## 11.2 Conceptual Model

```typescript
interface NormalizedInfo {
  title: string;

  version: string;

  summary?: string;

  description?: string;

  termsOfService?: string;

  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };

  license?: {
    name?: string;
    identifier?: string;
    url?: string;
  };

  source: SourceLocation;

  raw: RawSourceHandle;
}
```

---

## 11.3 Distinguish Two Versions

The following must not be confused:

```text
OpenApiVersion
```

Example:

```text
3.2.0
```

and:

```text
NormalizedInfo.version
```

Example:

```text
2026-08
```

The first identifies the OpenAPI Specification version.

The second identifies the described API's version.

---

# 12. `NormalizedOperation`

## 12.1 Purpose

Represents one logical API operation independent of how the operation was located in the source structure.

---

## 12.2 Conceptual Model

```typescript
interface NormalizedOperation {
  key: OperationKey;

  origin: OperationOrigin;

  transportMethod: string;

  pathTemplate?: string;

  operationId?: string;

  summary?: string;

  description?: string;

  deprecated: boolean;

  tags: string[];

  declaredParameters: NormalizedParameter[];

  parameterSet: EffectiveParameterSet;

  requestBody?: NormalizedRequestBody;

  responses?: NormalizedResponses;

  security:
    | InheritedSecurity
    | ExplicitSecurity;

  source: SourceLocation;

  referenceOrigin: ReferenceOrigin;

  raw: RawSourceHandle;
}
```

---

# 13. `OperationKey`

OAIT requires a stable logical operation identity within an analysis run.

Conceptually:

```typescript
interface OperationKey {
  origin: OperationOrigin;

  path?: string;

  method: string;

  callbackExpression?: string;

  webhookName?: string;
}
```

Example:

```yaml
origin: path
path: /customers/{customerId}
method: GET
```

---

# 14. Operation Transport Method

The method should be represented as a normalized uppercase string.

Examples:

```text
GET
POST
PATCH
QUERY
COPY
```

Do not define the type as a closed TypeScript union containing only:

```text
GET | POST | PUT | DELETE | ...
```

because OpenAPI 3.2 can represent additional HTTP methods through `additionalOperations`.

A more suitable conceptual representation is:

```typescript
type HttpMethod = string;
```

with normalization and validation performed separately.

---

# 15. `OperationOrigin`

Conceptually:

```typescript
type OperationOrigin =
  | "path"
  | "webhook"
  | "callback";
```

Potential later additions may be introduced if needed.

This property allows rules to declare scope.

Example:

```text
OAIT-DOC-002
applies to path operations
```

without assuming every normalized operation has the same runtime direction.

---

# 16. `NormalizedParameter`

## 16.1 Purpose

Represents one logical Parameter Object after reference resolution while preserving its declaration origin.

---

## 16.2 Conceptual Model

```typescript
interface NormalizedParameter {
  identity: ParameterIdentity;

  name: string;

  location: ParameterLocation;

  description?: string;

  required: boolean;

  deprecated: boolean;

  schema?: NormalizedSchema;

  content?: NormalizedContent;

  style?: string;

  explode?: boolean;

  example?: unknown;

  examples?: Readonly<Record<string, NormalizedExample>>;

  declarationScope:
    | "path-item"
    | "operation";

  source: SourceLocation;

  referenceOrigin: ReferenceOrigin;

  raw: RawSourceHandle;
}
```

---

# 17. `ParameterLocation`

Conceptually:

```typescript
type ParameterLocation =
  | "path"
  | "query"
  | "querystring"
  | "header"
  | "cookie"
  | string;
```

The open-ended fallback allows future specification evolution without immediately breaking the domain interface.

OpenAPI 3.2 adds `querystring`, while OpenAPI 3.0 defines the traditional `query`, `header`, `path`, and `cookie` locations.

---

# 18. `ParameterIdentity`

Parameter merging requires a stable identity.

Conceptually:

```typescript
interface ParameterIdentity {
  name: string;
  location: ParameterLocation;
}
```

The version adapter owns the exact identity semantics.

OpenAPI defines parameter uniqueness using the combination of parameter name and location, and Operation-level parameters can override matching Path Item parameters.

---

# 19. Effective Parameter Modeling

This is one of the most important normalized concepts.

OpenAPI permits parameters to be declared at both:

```text
Path Item
```

and:

```text
Operation
```

levels.

An Operation-level parameter with the same identity overrides the Path Item parameter rather than deleting it.

OAIT therefore needs to preserve both:

```text
DECLARED PARAMETERS
```

and:

```text
EFFECTIVE PARAMETERS
```

---

# 20. `EffectiveParameterSet`

Conceptual model:

```typescript
interface EffectiveParameterSet {
  inherited: NormalizedParameter[];

  declared: NormalizedParameter[];

  effective: EffectiveParameter[];

  overrides: ParameterOverride[];
}
```

---

# 21. `EffectiveParameter`

```typescript
interface EffectiveParameter {
  parameter: NormalizedParameter;

  effectiveSource:
    | "path-item"
    | "operation";

  inherited: boolean;

  overrides?: NormalizedParameter;

  identity: ParameterIdentity;
}
```

---

# 22. Example Effective Parameter Resolution

Source:

```yaml
paths:
  /customers/{customerId}:

    parameters:
      - name: customerId
        in: path
        required: true
        description: Customer identifier.
        schema:
          type: string

    get:
      parameters:
        - name: customerId
          in: path
          required: true
          description: Customer account identifier.
          schema:
            type: string
```

Normalized view:

```text
Path declaration
customerId:path
       │
       ▼
Operation declaration
customerId:path
       │
       ▼
Operation declaration wins
       │
       ▼
Effective parameter
customerId:path
```

But OAIT retains both declarations.

This matters for:

* Conformance findings.
* Documentation findings.
* Future diff.
* Source traceability.

---

# 23. Parameter Invariant

For each operation:

```text
parameterSet.effective
```

must contain at most one effective parameter for each normalized parameter identity.

Duplicates that violate the OpenAPI rules should still be preserved in declared input sufficiently for the validator/rules engine to report the problem.

Normalization must not silently repair invalid source.

---

# 24. `NormalizedRequestBody`

## 24.1 Purpose

Represents an operation request body independent of whether it was defined inline or through a reference.

---

## 24.2 Conceptual Model

```typescript
interface NormalizedRequestBody {
  description?: string;

  required: boolean;

  content: ReadonlyMap<
    string,
    NormalizedMediaType
  >;

  source: SourceLocation;

  referenceOrigin: ReferenceOrigin;

  raw: RawSourceHandle;
}
```

---

# 25. Content Modeling

Although not a primary top-level entity in this document, operations require a normalized media-type abstraction.

Conceptually:

```typescript
interface NormalizedMediaType {
  mediaType: string;

  schema?: NormalizedSchema;

  example?: unknown;

  examples?: Readonly<
    Record<string, NormalizedExample>
  >;

  source: SourceLocation;

  raw: RawSourceHandle;
}
```

This supports later rules such as:

```text
Request example present
Successful response example present
```

without forcing rules to traverse raw `content` maps.

---

# 26. `NormalizedResponses`

## 26.1 Purpose

Represents the complete response collection for an operation.

It is intentionally distinct from an individual `NormalizedResponse`.

---

## 26.2 Conceptual Model

```typescript
interface NormalizedResponses {
  responses: NormalizedResponse[];

  bySelector: ReadonlyMap<
    ResponseSelectorKey,
    NormalizedResponse
  >;

  source: SourceLocation;

  raw: RawSourceHandle;
}
```

---

# 27. Response Selector

Responses may be identified by:

* Explicit status.
* Range.
* Default.

Conceptually:

```typescript
type ResponseSelector =
  | {
      kind: "status";
      code: number;
    }
  | {
      kind: "range";
      range: string;
    }
  | {
      kind: "default";
    };
```

Example:

```yaml
kind: status
code: 200
```

or:

```yaml
kind: range
range: 2XX
```

or:

```yaml
kind: default
```

OpenAPI 3.2 supports individual codes, ranges such as `2XX`, and `default`, and requires an existing Responses Object to contain at least one response code.

---

# 28. `NormalizedResponse`

## 28.1 Purpose

Represents a single logical API response.

---

## 28.2 Conceptual Model

```typescript
interface NormalizedResponse {
  selector: ResponseSelector;

  summary?: string;

  description?: string;

  content: ReadonlyMap<
    string,
    NormalizedMediaType
  >;

  headers: ReadonlyMap<
    string,
    NormalizedHeader
  >;

  source: SourceLocation;

  referenceOrigin: ReferenceOrigin;

  raw: RawSourceHandle;
}
```

---

# 29. Response Version Awareness

The normalized model exposes:

```text
summary?
description?
```

without itself deciding whether either is mandatory.

That rule belongs to:

```text
OpenApiCapabilities
```

plus:

```text
rule applicability
```

OpenAPI 3.2 defines both `summary` and `description` as Response Object fields, whereas the OAIT rule layer must apply version-appropriate documentation expectations.

This keeps:

```text
data representation
```

separate from:

```text
quality policy
```

---

# 30. `NormalizedSchema`

## 30.1 Purpose

Represents a Schema Object sufficiently for OAIT analysis while preserving the authoritative schema semantics and dialect.

Schema normalization must be conservative.

OpenAPI 3.1 Schema Objects align with JSON Schema Draft 2020-12, permit boolean schemas, support dialect selection, and allow vocabulary extensions.

Therefore OAIT must **not** convert every schema into a small fixed object model and discard unknown keywords.

---

# 31. Schema Representation Strategy

OAIT will use a two-part schema representation:

```text
Normalized projection
        +
Canonical schema representation
```

The normalized projection exposes commonly required concepts.

The canonical representation preserves the full schema.

---

# 32. Conceptual `NormalizedSchema`

```typescript
interface NormalizedSchema {
  identity?: SchemaIdentity;

  schemaKind:
    | "object-schema"
    | "boolean-schema";

  booleanValue?: boolean;

  dialect?: string;

  title?: string;

  description?: string;

  types?: string[];

  format?: string;

  required: string[];

  properties: NormalizedSchemaProperty[];

  enumValues?: readonly unknown[];

  deprecated?: boolean;

  readOnly?: boolean;

  writeOnly?: boolean;

  composition: SchemaComposition;

  canonical: CanonicalSchemaValue;

  source: SourceLocation;

  referenceOrigin: ReferenceOrigin;

  raw: RawSourceHandle;
}
```

---

# 33. `CanonicalSchemaValue`

Conceptually:

```typescript
type CanonicalSchemaValue =
  | boolean
  | Readonly<Record<string, unknown>>;
```

This preserves schema keywords not explicitly modeled by OAIT.

---

# 34. Why Schema Must Remain Partly Opaque

Consider a future or custom JSON Schema vocabulary containing:

```yaml
x-customKeyword:
  ...
```

or a legitimate JSON Schema keyword OAIT does not yet understand.

OAIT should not:

* Delete it.
* Rewrite it.
* Assume it is irrelevant.
* Claim semantic equivalence after removing it.

The normalized schema projection exists for common OAIT analysis.

The canonical schema remains available for deeper validators and future capabilities.

---

# 35. Schema Dialect

The domain model should preserve the applicable JSON Schema dialect where relevant.

Conceptually:

```typescript
interface SchemaDialectInfo {
  declared?: string;

  effective: string;

  source:
    | "schema"
    | "document-default"
    | "oas-default";
}
```

OpenAPI 3.1 permits `$schema` at schema resource roots and `jsonSchemaDialect` at the OpenAPI document level; the effective dialect therefore cannot safely be inferred from one fixed OAIT assumption.

For OpenAPI 3.0:

```text
schemaDialectModel = oas-3.0-schema
```

should be treated separately rather than pretending it is simply Draft 2020-12.

---

# 36. `NormalizedSchemaProperty`

## 36.1 Purpose

Provides a property-oriented view useful for documentation and quality rules.

---

## 36.2 Conceptual Model

```typescript
interface NormalizedSchemaProperty {
  name: string;

  schema: NormalizedSchema;

  required: boolean;

  description?: string;

  source: SourceLocation;

  raw: RawSourceHandle;
}
```

---

# 37. Required Property Modeling

Example source:

```yaml
Customer:
  type: object

  required:
    - customerId

  properties:
    customerId:
      type: string

    displayName:
      type: string
```

Normalized projection:

```text
Customer
│
├── customerId
│   └── required = true
│
└── displayName
    └── required = false
```

This saves every property-level rule from repeatedly looking up the parent schema's `required` array.

---

# 38. Schema Identity

Named component schemas may expose:

```typescript
interface SchemaIdentity {
  componentName?: string;

  canonicalUri?: string;
}
```

Inline schemas may have no component name but still have a source identity.

This distinction will be important for future semantic diff.

---

# 39. Schema Recursion

The domain model must support recursive schema graphs.

Example:

```yaml
Node:
  type: object
  properties:
    child:
      $ref: "#/components/schemas/Node"
```

OAIT must not require recursive `$ref` structures to be infinitely expanded.

Reference resolution should create graph relationships or controlled handles.

---

# 40. `NormalizedTag`

## 40.1 Purpose

Represents a root Tag Object.

---

## 40.2 Conceptual Model

```typescript
interface NormalizedTag {
  name: string;

  summary?: string;

  description?: string;

  parent?: string;

  kind?: string;

  source: SourceLocation;

  raw: RawSourceHandle;
}
```

Fields unsupported by a source OpenAPI version remain undefined.

Operation tags remain:

```text
string[]
```

with resolution to root `NormalizedTag` objects handled through a lookup service.

---

# 41. `NormalizedSecurityRequirement`

## 41.1 Purpose

Represents one Security Requirement alternative.

Security requirements have logical semantics different from simply storing a raw object.

---

## 41.2 Conceptual Model

```typescript
interface NormalizedSecurityRequirement {
  schemes: SecurityRequirementEntry[];

  optionalAnonymousAccess: boolean;

  source: SourceLocation;

  raw: RawSourceHandle;
}
```

---

## 41.3 `SecurityRequirementEntry`

```typescript
interface SecurityRequirementEntry {
  schemeReference: SecuritySchemeReference;

  scopes: string[];

  resolvedScheme?: NormalizedSecurityScheme;
}
```

---

# 42. Security Alternative Modeling

Given:

```yaml
security:
  - oauth:
      - read
      - write

  - apiKey: []
```

OAIT should model this as:

```text
Alternative 1
  oauth + scopes

OR

Alternative 2
  apiKey
```

not one flattened list of two mandatory security schemes.

Within one Security Requirement Object, the listed schemes form one requirement combination; separate entries in the surrounding security array represent alternatives.

The normalized model must preserve this structure.

---

# 43. Explicit Empty Security Requirement

The empty form:

```yaml
security:
  - {}
```

must not be lost during normalization.

It can indicate an anonymous-access alternative.

Conceptually:

```typescript
optionalAnonymousAccess: true;
```

The raw form should still remain available.

---

# 44. Inherited Security

Operations may inherit security from the document level or override it.

The normalized operation therefore should distinguish:

```typescript
type NormalizedOperationSecurity =
  | {
      source: "document";
      effective: NormalizedSecurityRequirement[];
    }
  | {
      source: "operation";
      effective: NormalizedSecurityRequirement[];
    };
```

Again:

```text
effective
```

must not replace or destroy:

```text
declared
```

security information.

---

# 45. `NormalizedSecurityScheme`

## 45.1 Purpose

Represents a declared reusable security scheme.

---

## 45.2 Conceptual Model

```typescript
interface NormalizedSecurityScheme {
  name: string;

  type: string;

  description?: string;

  apiKey?: {
    name: string;
    in: string;
  };

  http?: {
    scheme: string;
    bearerFormat?: string;
  };

  oauth2?: {
    flows: unknown;
  };

  openIdConnect?: {
    url: string;
  };

  mutualTLS?: boolean;

  source: SourceLocation;

  referenceOrigin: ReferenceOrigin;

  raw: RawSourceHandle;
}
```

The model should expose common attributes while preserving full raw details for OAuth and future scheme evolution.

---

# 46. `SourceLocation`

## 46.1 Purpose

Represents the physical source location from which a normalized object originated.

Source location is essential for:

* Findings.
* Diagnostics.
* Multi-file support.
* Future Overlay generation.
* Enhancement.
* Diff.
* Contract Guard.

---

## 46.2 Conceptual Model

```typescript
interface SourceLocation {
  documentUri: string;

  filePath?: string;

  pointer: string;

  line?: number;

  column?: number;
}
```

---

# 47. `documentUri`

Canonical identifier for the physical source document.

Examples:

```text
file:///project/openapi.yaml
```

or, if future remote references are allowed:

```text
https://example.com/schemas/customer.yaml
```

Internally, URI semantics are preferable to assuming every source is a local filesystem path.

---

# 48. `filePath`

Optional user-friendly local path.

Example:

```text
schemas/customer.yaml
```

This should not replace the canonical document URI.

---

# 49. `pointer`

Canonical JSON Pointer identifying the location inside the physical document.

Example:

```text
/components/schemas/Customer/properties/customerId
```

JSON Pointer should remain the minimum required object-level location mechanism.

---

# 50. Line and Column

Where parser support permits:

```yaml
line: 42
column: 7
```

should be preserved.

These values are primarily presentation aids.

They should not be used as stable semantic identity because lines move after editing.

---

# 51. Source Location Example

```yaml
documentUri: file:///repo/schemas/customer.yaml

filePath: schemas/customer.yaml

pointer: /Customer/properties/customerId

line: 18

column: 5
```

A finding can therefore display both:

```text
Customer.customerId
```

and:

```text
schemas/customer.yaml:18
```

---

# 52. Reference-Origin Metadata

## 52.1 Purpose

Normalization resolves logical references where needed, but OAIT must remember whether an object was:

```text
inline
```

or:

```text
referenced
```

and from where.

---

## 52.2 Conceptual Model

```typescript
type ReferenceOrigin =
  | InlineOrigin
  | ReferencedOrigin;
```

---

# 53. Inline Origin

```typescript
interface InlineOrigin {
  kind: "inline";

  declaration: SourceLocation;
}
```

Example:

```yaml
kind: inline

declaration:
  filePath: openapi.yaml
  pointer: /paths/~1customers/get/parameters/0
```

---

# 54. Referenced Origin

```typescript
interface ReferencedOrigin {
  kind: "reference";

  declaration: SourceLocation;

  rawReference: string;

  resolvedUri: string;

  target: SourceLocation;

  referenceChain?: ReferenceHop[];
}
```

---

# 55. Example Reference Origin

Input:

```yaml
schema:
  $ref: "./schemas/customer.yaml#/Customer"
```

Normalized provenance:

```yaml
kind: reference

declaration:
  filePath: openapi.yaml
  pointer: /paths/~1customers/get/responses/200/content/application~1json/schema

rawReference: ./schemas/customer.yaml#/Customer

resolvedUri: file:///repo/schemas/customer.yaml#/Customer

target:
  filePath: schemas/customer.yaml
  pointer: /Customer
```

---

# 56. Reference Chain

Nested references may require:

```typescript
interface ReferenceHop {
  reference: string;

  declaration: SourceLocation;

  target: SourceLocation;
}
```

This is useful for:

* Debugging.
* Cycles.
* Finding root cause.
* Future dependency graphs.

v0.1 may implement only the minimum required chain metadata if the parser library makes full chains expensive.

---

# 57. Declaration Location Versus Definition Location

For referenced objects, these are different.

Example:

```text
Declaration location:
openapi.yaml
where $ref appears

Definition location:
schemas/customer.yaml
where Customer is defined
```

OAIT must preserve both.

Different findings may need different reporting strategies.

Example:

```text
Unresolved $ref
```

should point to the declaration.

Whereas:

```text
Customer schema lacks description
```

should normally point to the definition.

---

# 58. `RawSourceHandle`

## 58.1 Purpose

Provides a controlled escape hatch to the authoritative parsed source representation.

It must not expose parser-specific objects throughout OAIT's domain layer.

---

## 58.2 Conceptual Model

```typescript
interface RawSourceHandle {
  documentUri: string;

  pointer: string;

  nodeId?: string;
}
```

The handle identifies the raw source node.

It does not necessarily contain the raw parser object directly.

---

# 59. Why Use a Handle

Avoid:

```typescript
interface NormalizedOperation {
  raw: ThirdPartyParserOperation;
}
```

because this would couple the core domain model to the parser library.

Prefer:

```typescript
raw: RawSourceHandle;
```

Then parser infrastructure can resolve the handle when necessary.

---

# 60. Raw-Source Escape-Hatch Policy

Direct raw-source access should be permitted only when:

* The normalized model does not yet expose necessary information.
* The use case cannot reasonably be solved through existing normalized fields.
* The access does not duplicate common traversal logic.

If multiple rules begin using the same raw field, that is a signal that the domain model should probably expose the concept explicitly.

---

# 61. Declared Versus Effective Data

The domain model uses an important distinction:

```text
DECLARED
```

versus:

```text
EFFECTIVE
```

Declared information represents what exists physically in a specific OpenAPI object.

Effective information represents the logical result after OpenAPI inheritance or override semantics are applied.

Examples include:

* Parameters.
* Security.
* Servers in future modeling.

---

# 62. Effective Views Must Be Derived

An effective view must:

* Be deterministic.
* Retain provenance.
* Not mutate declared entities.
* Explain which declaration won.
* Preserve overridden declarations for diagnostics.

This becomes especially important for future semantic diff.

---

# 63. Normalized Identity Versus Source Identity

The domain model should distinguish:

```text
Logical identity
```

from:

```text
Source identity
```

Example:

```text
Logical operation:
GET /customers/{id}
```

Source identity:

```text
openapi.yaml
/paths/~1customers~1{id}/get
```

Two differently structured OpenAPI descriptions could have the same logical operation identity.

This distinction will later make semantic comparison possible.

---

# 64. Domain Invariants

The following invariants define conditions downstream OAIT components may rely upon.

---

## INV-001 — Version exists

Every successfully normalized document has exactly one:

```text
OpenApiVersion
```

derived from the entry document.

---

## INV-002 — Capabilities correspond to version

`OpenApiCapabilities` must be produced from the detected OpenAPI version through a centralized adapter.

---

## INV-003 — Operations are discoverable centrally

All operations considered part of the normalized analysis scope must be available through:

```text
NormalizedOpenApiDocument.operations
```

Rules must not rediscover operations from raw paths.

---

## INV-004 — Operation method is normalized

`transportMethod` uses a canonical representation, recommended uppercase.

---

## INV-005 — Significant objects have source locations

Every normalized object that can produce a finding must have a `SourceLocation`.

---

## INV-006 — Referenced objects retain provenance

Reference resolution must not erase:

* Reference declaration.
* Reference string.
* Resolved target.

---

## INV-007 — Effective parameters are unique

`EffectiveParameterSet.effective` contains no duplicate normalized parameter identities.

Invalid duplicate declarations remain detectable elsewhere.

---

## INV-008 — Declared parameters remain available

Producing effective parameters must not destroy path-level or operation-level declarations.

---

## INV-009 — Source is immutable during analysis

Normalization must not modify the user's OpenAPI source.

---

## INV-010 — Schema canonical representation is preserved

Schema normalization must retain the complete canonical schema value required for accurate schema interpretation.

---

## INV-011 — Schema dialect is not silently discarded

Where the OpenAPI version permits JSON Schema dialect selection, effective dialect information must remain available.

---

## INV-012 — Circular references are finite internally

Recursive OpenAPI/Schema reference graphs must not require infinite expansion.

---

## INV-013 — Missing optional information remains missing

Normalization must not invent:

* Descriptions.
* Summaries.
* Examples.
* `operationId`.
* Response codes.
* Security schemes.
* Schema constraints.

Missing information is important evidence for quality analysis.

---

## INV-014 — Invalid input is not silently repaired

Normalization may produce a partial model for analysis where safe, but must not silently "fix" nonconforming OpenAPI into a conforming representation.

---

## INV-015 — YAML and JSON are representation-equivalent

Logically equivalent YAML and JSON specifications should produce equivalent normalized domain values, excluding source-location differences.

---

## INV-016 — Domain entities do not expose parser types

Public core-domain interfaces must not require third-party parser-specific types.

---

## INV-017 — Effective views retain evidence

Every derived effective value must be traceable to the declaration from which it came.

---

# 65. Partial Normalization

OAIT may encounter specifications containing errors.

The normalizer therefore needs to support:

```text
complete model
```

and where safe:

```text
partial model
```

Example:

```text
1 unresolved schema reference
```

should not necessarily prevent OAIT from analyzing 50 unrelated valid operations.

---

# 66. Partial Model Diagnostics

Conceptually:

```typescript
interface NormalizationResult {
  document?: NormalizedOpenApiDocument;

  completeness:
    | "complete"
    | "partial"
    | "failed";

  diagnostics: NormalizationDiagnostic[];
}
```

This avoids pretending incomplete normalization succeeded fully.

---

# 67. Relationship to Validator

The normalized domain model does not replace standards validation.

Architecture:

```text
Raw / Parsed OpenAPI
       │
       ├──────────────► Validator Adapter
       │
       ▼
Normalizer
       │
       ▼
Normalized Domain Model
```

Depending on the selected validator library, validation and normalization may share parsing infrastructure.

But their logical responsibilities remain separate.

---

# 68. Relationship to Rules Engine

Rules consume normalized targets.

Example:

```text
OAIT-DOC-004
Parameter description present
```

should conceptually execute against:

```typescript
NormalizedParameter
```

rather than:

```typescript
unknownYamlNode
```

Rule logic becomes:

```text
description exists and nonempty?
```

rather than:

```text
find operation
resolve Path Item parameters
resolve operation parameters
resolve $ref
merge parameters
find raw description
```

---

# 69. Relationship to Scoring

The Scoring Engine does not consume this domain model directly.

Its boundary is:

```text
Normalized Domain Model
        ↓
Rules Engine
        ↓
Rule Instances
        ↓
Scoring Engine
```

This protects scoring from OpenAPI structural complexity.

---

# 70. Relationship to Reporting

The Reporting Engine primarily receives:

* Findings.
* Rule instances.
* Scores.
* Analysis metadata.

Those objects reference `SourceLocation` and logical domain context.

Reporting should not traverse normalized OpenAPI objects merely to reconstruct finding locations.

---

# 71. Relationship to Future AI

AI workflows should consume selected normalized entities.

Example:

```text
NormalizedOperation
├── summary
├── description
├── effective parameters
├── request body
├── responses
└── relevant schemas
```

This allows OAIT to send minimal, evidence-grounded context rather than an arbitrary entire OpenAPI file.

---

# 72. Relationship to Future Diff

Future semantic comparison should compare normalized logical identities.

Example:

```text
Previous
GET /customers/{id}
       │
       ▼
NormalizedOperation A

Current
GET /customers/{id}
       │
       ▼
NormalizedOperation B
```

Then compare:

```text
parameters
request
responses
schemas
security
documentation
```

independently of formatting or YAML/JSON representation.

---

# 73. Reference Provenance in Diff

Future diff must distinguish:

```text
Reference organization changed
```

from:

```text
API contract changed
```

Example:

Version A:

```yaml
schema:
  type: object
```

Version B:

```yaml
schema:
  $ref: "#/components/schemas/Foo"
```

If both describe semantically equivalent contracts, future diff logic may classify this differently from a contract change.

That is possible only if OAIT preserves:

```text
logical schema
+
reference provenance
```

separately.

---

# 74. Relationship to Future Enhancer

The Enhancer will identify a normalized object needing improvement.

Example:

```text
NormalizedParameter
customerId
description missing
```

The source information then identifies where the improvement belongs.

```text
Normalized target
       ↓
Finding
       ↓
Suggestion
       ↓
SourceLocation
       ↓
OpenAPI Overlay
```

---

# 75. Relationship to Contract Guard

Contract Guard will later derive protected contract projections from normalized entities.

Examples:

```text
Operation path
Transport method
Parameter identity
Parameter required state
Schema semantics
Request structure
Response selectors
Security requirements
```

Before and after enhancement:

```text
Protected Projection A
        ↓
Compare
        ↑
Protected Projection B
```

Documentation-only changes should leave these protected projections equivalent.

---

# 76. Supporting Internal Indexes

The normalized document may maintain indexes for efficient lookup.

Conceptually:

```typescript
interface DomainIndexes {
  operationsByKey: Map<string, NormalizedOperation>;

  operationsByOperationId: Map<
    string,
    NormalizedOperation[]
  >;

  schemasByName: Map<string, NormalizedSchema>;

  tagsByName: Map<string, NormalizedTag>;

  securitySchemesByName: Map<
    string,
    NormalizedSecurityScheme
  >;
}
```

Indexes are derived runtime structures.

They need not be serialized as part of reports.

---

# 77. Duplicate-Preserving Index Behavior

Indexes must not accidentally hide invalid duplicates.

Example:

```text
operationId = getCustomer
```

occurs twice.

Do not model:

```typescript
Map<string, NormalizedOperation>
```

and silently keep one.

Prefer:

```typescript
Map<string, NormalizedOperation[]>
```

where duplicates are legal input states even if they violate a rule.

Normalization must support analysis of invalid input.

---

# 78. Immutability

Normalized domain objects should preferably be treated as immutable during deterministic analysis.

Conceptually:

```typescript
Readonly<NormalizedOperation>
```

This supports:

* Reproducibility.
* Safe parallel rule evaluation.
* Easier testing.
* Contract protection.

Future enhancement should create explicit transformations rather than mutating the analysis model in place.

---

# 79. Domain Construction Flow

```text
SourceLoader
     ↓
ParsedSourceDocument
     ↓
VersionDetector
     ↓
OpenApiVersion
     ↓
ReferenceResolver
     ↓
ResolvedDocumentGraph
     ↓
VersionAdapter
     ↓
DomainNormalizer
     ↓
NormalizedOpenApiDocument
     ↓
DomainIndexes
```

---

# 80. Version Adapter Boundary

Potential conceptual interface:

```typescript
interface OpenApiVersionAdapter {
  version: OpenApiVersion;

  capabilities(): OpenApiCapabilities;

  normalize(
    source: ResolvedDocumentGraph
  ): NormalizationResult;
}
```

Potential implementations:

```text
OpenApi30Adapter
OpenApi31Adapter
OpenApi32Adapter
```

The exact class structure is not yet mandated.

---

# 81. Avoid Version Checks in Rule Handlers

Discouraged:

```typescript
if (document.version.family === "3.2") {
  // find query operations
}
```

Preferred:

```typescript
for (const operation of document.operations) {
  ...
}
```

Version checks remain valid when the **rule itself** genuinely differs by OpenAPI version.

Example:

```text
Response description requirement
```

---

# 82. Example Normalized Operation

Source:

```yaml
paths:
  /customers/{customerId}:

    parameters:
      - name: customerId
        in: path
        required: true
        description: Customer identifier.
        schema:
          type: string

    get:
      operationId: getCustomer

      summary: Retrieve a customer

      responses:
        "200":
          description: Customer returned.
```

Conceptual normalized representation:

```yaml
key:
  origin: path
  path: /customers/{customerId}
  method: GET

origin: path

transportMethod: GET

pathTemplate: /customers/{customerId}

operationId: getCustomer

summary: Retrieve a customer

deprecated: false

tags: []

declaredParameters: []

parameterSet:
  inherited:
    - name: customerId
      location: path

  declared: []

  effective:
    - identity:
        name: customerId
        location: path

      effectiveSource: path-item

      inherited: true

responses:
  responses:
    - selector:
        kind: status
        code: 200

      description: Customer returned.
```

---

# 83. Example Multi-File Normalization

Input:

```text
openapi.yaml
│
└── $ref
    ↓
paths/customers.yaml
│
└── $ref
    ↓
schemas/customer.yaml
```

Logical model:

```text
NormalizedOpenApiDocument
      │
      └── GET /customers
             │
             └── 200 response
                    │
                    └── Customer schema
```

Source metadata remains:

```text
Operation
→ paths/customers.yaml

Customer schema
→ schemas/customer.yaml
```

Logical unification must not erase physical ownership.

---

# 84. v0.1 Minimum Domain Model

v0.1 does not need to model every OpenAPI feature exhaustively.

The minimum useful entities are:

```text
NormalizedOpenApiDocument
OpenApiVersion
OpenApiCapabilities
NormalizedInfo

NormalizedOperation
NormalizedParameter
EffectiveParameterSet

NormalizedRequestBody
NormalizedMediaType

NormalizedResponses
NormalizedResponse

NormalizedSchema
NormalizedSchemaProperty

NormalizedTag

NormalizedSecurityRequirement
NormalizedSecurityScheme

SourceLocation
ReferenceOrigin
RawSourceHandle
```

---

# 85. v0.1 Minimum Operation Fields

At minimum:

```text
operation identity
origin
transport method
path
operationId
summary
description
deprecated
tags
declared parameters
effective parameters
request body
responses
security
source
reference origin
raw handle
```

---

# 86. v0.1 Minimum Schema Projection

At minimum:

```text
identity
schema kind
dialect where relevant
description
types
format
required
properties
enum
canonical schema
source
reference origin
raw handle
```

More complex schema semantics should remain available through the canonical schema representation until OAIT has a demonstrated need for normalized projections.

---

# 87. Domain Model Testing Strategy

The model requires dedicated tests independent from quality rules.

---

## 87.1 Version Tests

Fixtures for:

```text
OpenAPI 3.0.x
OpenAPI 3.1.x
OpenAPI 3.2.x
```

must produce appropriate `OpenApiCapabilities`.

---

## 87.2 YAML/JSON Equivalence

Equivalent YAML and JSON source documents should produce equivalent logical models.

---

## 87.3 Operation Discovery

Test:

```text
GET
POST
PATCH
TRACE
QUERY
additionalOperations
```

according to source-version capabilities.

---

## 87.4 Effective Parameter Tests

Test:

* Path-only parameter.
* Operation-only parameter.
* Path parameter inherited.
* Operation override.
* Multiple parameters.
* Duplicate invalid parameters.
* Referenced parameters.

---

## 87.5 Source Location Tests

Test:

* Single file.
* Multi-file.
* Internal reference.
* External local-file reference.
* Nested reference chain.

---

## 87.6 Schema Tests

Test:

* OpenAPI 3.0 schema.
* 3.1 schema.
* 3.2 schema.
* Object schema.
* Primitive schema.
* Boolean schema where supported.
* Recursive schema.
* Composition.
* Custom dialect metadata.
* Unknown keywords preserved.

---

## 87.7 Response Tests

Test:

* Explicit 200.
* 204.
* `default`.
* Range response where supported.
* Referenced response.
* 3.2 response summary.

---

## 87.8 Security Tests

Test:

* Document-level security.
* Operation inheritance.
* Operation override.
* Multiple scheme combination.
* Alternative requirements.
* Empty anonymous alternative.
* Unresolved security scheme.

---

# 88. Proposed Domain Test Fixtures

```text
test-data/
└── domain-model/
    ├── openapi-3.0/
    ├── openapi-3.1/
    ├── openapi-3.2/
    │
    ├── parameters/
    │   ├── inherited/
    │   ├── overridden/
    │   └── duplicates/
    │
    ├── references/
    │   ├── internal/
    │   ├── multi-file/
    │   └── circular/
    │
    ├── schemas/
    │   ├── recursive/
    │   ├── boolean/
    │   └── dialects/
    │
    └── security/
```

---

# 89. Architectural Risks

## Risk — Domain model mirrors the OpenAPI specification

If every OpenAPI field receives an identical OAIT field, the abstraction adds little value.

**Mitigation:** Model logical concepts required by OAIT workflows rather than copying the specification verbatim.

---

## Risk — Domain model becomes too abstract

Over-normalization could erase important semantics.

**Mitigation:** Preserve version, capabilities, canonical schemas, reference provenance, and raw-source handles.

---

## Risk — Full dereferencing causes cycles or memory growth

**Mitigation:** Preserve reference graphs and avoid unlimited expansion.

---

## Risk — Invalid input disappears during normalization

**Mitigation:** Preserve declarations and diagnostics. Never silently repair invalid source.

---

## Risk — Future diff needs information v0.1 discarded

**Mitigation:** Retain canonical source handles and reference provenance even when fields are not yet normalized.

---

# 90. Open Design Decisions

The following issues remain intentionally unresolved:

1. Exact TypeScript interface names.
2. Whether domain objects are interfaces, classes, or immutable records.
3. Exact `OperationKey` serialization.
4. Whether webhook and callback operations enter the primary `operations` array in v0.1.
5. Exact canonical URI generation.
6. Exact line/column support.
7. How parser libraries expose source maps.
8. Whether `RawSourceHandle` uses pointer only or an internal node ID.
9. Exact schema graph representation.
10. Whether schema references use object links, IDs, or lazy handles.
11. How OpenAPI 3.0 `nullable` is projected without changing semantics.
12. How discriminator information is modeled.
13. How server inheritance is represented.
14. Whether headers receive a dedicated normalized entity in v0.1.
15. Whether callbacks are normalized in v0.1 or deferred.
16. How remote reference retrieval is controlled.
17. How partial normalization affects evaluation coverage.
18. Whether normalized models are serializable for debugging.
19. Whether indexes live inside the document or a separate domain index service.
20. Which parser library can support this model without excessive custom parsing.

These questions should be answered through detailed design and technical spikes rather than assumptions.

---

# 91. Technical Spikes Required

Before implementation of the parser/domain layer, OAIT should run focused experiments to verify:

```text
OpenAPI 3.0 parsing
OpenAPI 3.1 parsing
OpenAPI 3.2 parsing

3.2 QUERY discovery
3.2 additionalOperations discovery

local $ref resolution
circular reference behavior

multi-file source locations
JSON Pointer preservation

line/column preservation

JSON Schema dialect handling

recursive schema representation

parser-library abstraction feasibility
```

The results should influence parser selection and subsequent ADRs.

---

# 92. Domain Model Definition of Done

This architecture artifact is considered baselined when:

* [ ] `NormalizedOpenApiDocument` is defined.
* [ ] `OpenApiVersion` is defined.
* [ ] `OpenApiCapabilities` is defined.
* [ ] `NormalizedInfo` is defined.
* [ ] `NormalizedOperation` is defined.
* [ ] `NormalizedParameter` is defined.
* [ ] Effective parameter modeling is defined.
* [ ] `NormalizedRequestBody` is defined.
* [ ] `NormalizedResponses` is defined.
* [ ] `NormalizedResponse` is defined.
* [ ] `NormalizedSchema` is defined.
* [ ] `NormalizedSchemaProperty` is defined.
* [ ] `NormalizedTag` is defined.
* [ ] `NormalizedSecurityRequirement` is defined.
* [ ] `NormalizedSecurityScheme` is defined.
* [ ] `SourceLocation` is defined.
* [ ] Reference-origin metadata is defined.
* [ ] Raw-source escape-hatch policy is defined.
* [ ] Domain invariants are defined.
* [ ] Multi-file source preservation is addressed.
* [ ] Schema dialect preservation is addressed.
* [ ] Effective versus declared modeling is addressed.
* [ ] Future AI integration is supported.
* [ ] Future diff integration is supported.
* [ ] Future enhancement and Contract Guard integration are supported.
* [ ] Open implementation decisions are explicitly recorded.

---