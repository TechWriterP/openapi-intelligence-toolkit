# OpenAPI Intelligence Toolkit (OAIT)

## Source-Processing Subsystem Detailed Design

**Document version:** 0.1  
**Design status:** Proposed  
**Project phase:** Architecture / Technical Validation  
**Release applicability:** OAIT v0.1 and later  
**Related ADRs:** `ADR-003-normalized-openapi-domain-model.md`, `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-005-use-yaml-and-jsonc-parser-for-source-indexing.md`  
**Related evidence:** `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`, `SPIKE-LOC-001-source-location-technology.md`  
**Related documents:** `system-architecture.md`, `openapi-domain-model.md`, `nonfunctional-requirements.md`

---

# 1. Purpose

This document defines the detailed design of the OAIT source-processing subsystem.

The subsystem is responsible for converting untrusted physical YAML and JSON source resources into trusted OAIT-owned source evidence before OpenAPI-specific parsing, validation, reference interpretation, or normalization occurs.

Its primary responsibilities are:

- Source admission.
- Source-access policy enforcement.
- Physical document identity.
- Source loading.
- Format detection.
- Source-preserving YAML/JSON parsing.
- Source-location indexing.
- RFC 6901 JSON Pointer construction.
- Physical occurrence tracking.
- `$ref` declaration evidence.
- Referenced-resource discovery.
- Source diagnostics.
- Source-document registration.
- Safe downstream handoff.

The subsystem establishes the physical-evidence foundation on which the normalized OpenAPI domain model depends.

---

# 2. Lifecycle Position

```text
Product requirements
        ↓
System architecture
        ↓
ADR-003
Normalized domain model
        ↓
SPIKE-002 / SPIKE-003
Source provenance evidence
        ↓
ADR-004
OAIT owns source evidence
        ↓
SPIKE-LOC-001
Source technology evaluation
        ↓
ADR-005
yaml + jsonc-parser selected
        ↓
THIS DOCUMENT
Detailed source-processing design
        ↓
Production implementation
        ↓
Verification
```

An ADR records a significant decision. This document specifies how multiple accepted decisions work together as an implementable subsystem.

---

# 3. Scope

The source-processing subsystem covers:

```text
Physical source
      ↓
Admission
      ↓
Loading
      ↓
Structural parsing
      ↓
Source indexing
      ↓
Reference evidence
      ↓
Controlled source graph
```

It supports YAML and JSON OpenAPI sources, single-file and multi-file descriptions, internal and external local `$ref` declarations, future controlled remote references, recursive resource graphs, duplicate source declarations, malformed source diagnostics, source ranges, line/column reporting, RFC 6901 pointers, and source immutability.

---

# 4. Non-Goals

This subsystem does not perform:

- OpenAPI semantic validation.
- OpenAPI version adaptation.
- Schema-dialect interpretation.
- Full OpenAPI `$ref` semantic resolution.
- Full dereferencing.
- Normalized OpenAPI domain-model construction.
- Quality-rule execution.
- Scoring.
- Report rendering.
- Contract Guard.
- OpenAPI Overlay generation.
- AI analysis.
- MCP functionality.

These capabilities consume source-processing outputs but remain separate responsibilities.

---

# 5. Core Design Principle

> **Preserve physical source truth before interpreting OpenAPI meaning.**

The source-processing subsystem answers:

```text
Where did this content come from?
Where was it physically authored?
What structural location does it occupy?
What source range contains it?
What references were physically declared?
Was OAIT allowed to load the referenced resource?
```

Later OpenAPI-processing layers answer:

```text
What does this structure mean according to OpenAPI?
```

These concerns must remain separate.

---

# 6. High-Level Architecture

```text
                     SourceProcessingRequest
                               │
                               ▼
                   ┌─────────────────────┐
                   │ SourceProcessing    │
                   │ Orchestrator        │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ SourcePolicy        │
                   │ + URI Canonicalizer│
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ SourceLoader        │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ SourceDocument      │
                   │ Registry            │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ FormatDetector      │
                   └──────────┬──────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌────────────────┐
            │ YAML Adapter │    │ JSON Adapter   │
            │ yaml         │    │ jsonc-parser   │
            └──────┬───────┘    └───────┬────────┘
                   │                    │
                   └─────────┬──────────┘
                             ▼
                  ┌───────────────────────┐
                  │ Structural Event      │
                  │ / Evidence Boundary   │
                  └──────────┬────────────┘
                             ▼
                  ┌───────────────────────┐
                  │ SourceIndexBuilder    │
                  ├───────────────────────┤
                  │ RFC6901 Encoder       │
                  │ Range Mapper          │
                  │ Occurrence Tracker    │
                  └──────────┬────────────┘
                             ▼
                  ┌───────────────────────┐
                  │ SourceLocationIndex   │
                  └──────────┬────────────┘
                             ▼
                  ┌───────────────────────┐
                  │ ReferenceEvidence     │
                  │ Collector             │
                  └──────────┬────────────┘
                             ▼
                  ┌───────────────────────┐
                  │ Source Resource Graph │
                  └──────────┬────────────┘
                             ▼
                    Controlled downstream
                    OpenAPI processing
```

---

# 7. `SourceProcessingOrchestrator`

The orchestrator coordinates one complete source-processing session.

Responsibilities:

- Accept entry-source request.
- Create processing context.
- Apply source-access policy.
- Load the entry source.
- Register physical documents.
- Detect format.
- Select YAML or JSON adapter.
- Build source-location indexes.
- Collect reference declarations.
- Discover referenced source resources.
- Prevent repeated processing.
- Accumulate diagnostics.
- Produce the final source-processing result.

It must not contain YAML-, JSON-, or OpenAPI-specific traversal logic.

---

# 8. `SourceProcessingRequest`

Conceptually:

```typescript
interface SourceProcessingRequest {
  entry: SourceRequest;
  policy: SourcePolicyConfig;
}

interface SourceRequest {
  uriOrPath: string;
  formatHint?: "yaml" | "json";
}
```

Exact runtime contracts remain implementation decisions.

---

# 9. Processing Session

Every workflow creates a source-processing session.

Conceptually:

```typescript
interface SourceProcessingSession {
  id: string;
  entryDocumentUri: string;
  registry: SourceDocumentRegistry;
  diagnostics: SourceDiagnostic[];
  referenceGraph: SourceReferenceGraph;
}
```

Session identity is operational only and is not persisted as OpenAPI source identity.

---

# 10. `SourcePolicy`

`SourcePolicy` determines whether OAIT may access a resource before unrestricted loading.

Responsibilities include evaluating local paths, file URIs, parent-directory traversal, symbolic-link resolution, canonical filesystem paths, remote schemes and hosts, future redirects, resource-count limits, and source-size limits.

Invariant:

> A third-party parser or resolver must never become the component that decides whether OAIT may access a resource.

---

# 11. Policy Decision

Conceptually:

```typescript
type SourcePolicyDecision =
  | {
      allowed: true;
      canonicalUri: string;
    }
  | {
      allowed: false;
      reason: string;
    };
```

A denied resource must produce structured source evidence. It must not silently disappear.

---

# 12. Local Source Policy

Local reference processing must canonicalize physical paths before access decisions are made.

```text
Requested path
      ↓
Resolve relative to declaration document
      ↓
Normalize
      ↓
Resolve real filesystem path
      ↓
Evaluate permitted-root policy
      ↓
ALLOW / DENY
```

This prevents a lexical path such as `/project/allowed/../secret.yaml` from bypassing the intended root boundary.

Exact default allowed-root configuration is deferred to configuration design.

---

# 13. Symlink Handling

Filesystem policy must evaluate the resolved real path where the operating system supports it.

A symlink under the project directory that resolves outside the allowed root must not be considered safe solely because the visible symlink path is local.

Platform-specific behavior must be tested on macOS, Linux, and Windows.

---

# 14. Remote Source Policy

Remote source retrieval is deny-by-default.

```text
https://example.com/schema.yaml
          ↓
SourcePolicy
          ↓
DENY
```

unless future configuration explicitly allows it.

When remote loading is introduced, policy must be capable of controlling allowed schemes, allowed hosts, redirects, timeouts, maximum response size, and network request count.

The source parser must never trigger implicit remote fetches independently.

---

# 15. `SourceLoader`

`SourceLoader` retrieves approved physical source content.

Conceptually:

```typescript
interface SourceLoader {
  load(
    approvedResource: ApprovedSourceResource
  ): Promise<LoadedSource>;
}
```

For v0.1 the primary implementation is a filesystem loader. Future loaders may include file, HTTP, or in-memory implementations, but the interface does not imply that all must exist in v0.1.

---

# 16. Source Immutability

Source loading is read-only. The subsystem must never modify the user's OpenAPI source.

Conceptually:

```typescript
interface LoadedSource {
  documentUri: string;
  sourceText: string;
  byteLength: number;
  contentHash: string;
}
```

A SHA-256 content fingerprint may be retained for mutation detection, reproducibility, and future cache invalidation.

---

# 17. Source Encoding

The initial implementation should support UTF-8 source text, including UTF-8 BOM handling.

Unsupported or undecodable source encoding must result in a controlled source diagnostic.

The decoded source string becomes the indexing input, so offset coordinate semantics must be explicit.

---

# 18. `SourceDocumentRegistry`

The registry provides one authoritative record for every admitted physical source resource in a processing session and is keyed by canonical document URI.

Conceptually:

```typescript
interface SourceDocumentRegistry {
  get(documentUri: string): SourceDocumentRecord | undefined;
  register(document: SourceDocumentRecord): void;
  has(documentUri: string): boolean;
}
```

A canonical physical resource must be loaded and indexed at most once per processing session.

---

# 19. Source Document Record

Conceptually:

```typescript
interface SourceDocumentRecord {
  documentUri: string;
  requestedUri?: string;
  filePath?: string;
  format: SourceFormat;
  sourceText: string;
  contentHash: string;
  index?: SourceLocationIndex;
  parseState:
    | "unprocessed"
    | "parsed"
    | "partial"
    | "failed";
}
```

This is illustrative; the exact TypeScript model remains implementation-specific.

---

# 20. Document URI

`documentUri` is the canonical physical identity of a source resource.

Examples:

```text
file:///workspace/openapi.yaml
file:///workspace/schemas/Pet.yaml
```

Equivalent relative paths that resolve to the same physical file should converge to one canonical resource identity.

---

# 21. `FormatDetector`

Format detection chooses the source-preserving adapter.

```typescript
type SourceFormat = "yaml" | "json";
```

Preferred detection precedence:

```text
Explicit trusted format hint
        ↓
Recognized file extension
        ↓
Deterministic content classification
        ↓
Unsupported / ambiguous diagnostic
```

Recognized extensions include `.yaml`, `.yml`, and `.json`.

JSON input must ultimately pass strict JSON rules; a YAML parser accepting JSON-like text is insufficient to classify invalid JSON as valid JSON.

---

# 22. YAML Adapter

ADR-005 selects `yaml@2.8.3` as the initial YAML structural parsing baseline.

The YAML adapter is responsible for invoking supported public `yaml` APIs, preserving structural ranges, anchor/alias syntax evidence, duplicate-key diagnostics, YAML multi-document detection, and translating candidate nodes into OAIT-neutral structural traversal events.

The adapter must not expose `yaml` node types outside the infrastructure boundary.

---

# 23. JSON Adapter

ADR-005 selects `jsonc-parser@3.3.1` as the initial JSON structural parsing baseline.

The JSON adapter is responsible for strict JSON configuration, tree construction, source ranges, structured parse errors, partial-tree recovery where available, and translation into OAIT-neutral structural traversal events.

The adapter must reject JSON extensions such as comments and trailing commas for OpenAPI JSON input.

Fault-tolerant parsing is used for diagnostics, not for silently accepting invalid JSON.

---

# 24. Adapter Boundary

Candidate structural trees must never cross the adapter boundary.

```text
yaml AST
   ↓
YamlSourceAdapter
   ↓
OAIT structural events

jsonc tree
   ↓
JsonSourceAdapter
   ↓
OAIT structural events
```

The common index builder operates on OAIT-owned structural evidence.

---

# 25. Structural Visitor Contract

Each adapter should expose a common structural traversal contract.

Conceptually:

```typescript
interface SourceStructureVisitor {
  enterNode(node: StructuralNodeEvidence): void;
  leaveNode(node: StructuralNodeEvidence): void;
}

interface StructuralNodeEvidence {
  kind:
    | "document"
    | "mapping"
    | "property"
    | "sequence"
    | "item"
    | "scalar"
    | "alias";
  segment?: string | number;
  fullRange: SourceRange;
  anchorRange: SourceRange;
  keyRange?: SourceRange;
  valueRange?: SourceRange;
}
```

Exact names are not final.

---

# 26. Why Use Structural Events

This design keeps pointer construction independent of parsing technology.

Instead of candidate-specific path implementations:

```text
Candidate tree
      ↓
OAIT structural segments
      ↓
Common pointer encoder
```

produces consistent identity for both formats.

---

# 27. `JsonPointerEncoder`

OAIT owns canonical RFC 6901 serialization.

Conceptually:

```typescript
interface JsonPointerEncoder {
  encode(
    segments: readonly (string | number)[]
  ): string;
}
```

Encoding rules:

```text
~ → ~0
/ → ~1
```

Array indices are decimal path segments.

Example:

```text
["paths", "/pets/{petId}", "get", "parameters", 0]
```

becomes:

```text
/paths/~1pets~1{petId}/get/parameters/0
```

No candidate-specific path representation becomes canonical OAIT identity.

---

# 28. `SourceRange`

A physical source range identifies characters in the decoded original source.

Conceptually:

```typescript
interface SourceRange {
  offset: number;
  length: number;
  unit: "utf16-code-unit";
}
```

The unit should be explicit even though both selected parsers currently expose JavaScript UTF-16-compatible offsets.

---

# 29. Presentation Position

User-facing positions are separate from source ranges.

Conceptually:

```typescript
interface SourcePosition {
  line: number;
  column: number;
}
```

Presentation convention:

```text
line   → 1-based
column → 1-based
```

The implementation should normalize columns consistently for Unicode text. Source range remains authoritative for machine processing; presentation position is derived metadata.

---

# 30. `SourceLocation`

Conceptually:

```typescript
interface SourceLocation {
  documentUri: string;
  pointer: string;
  range: SourceRange;
  position?: SourcePosition;
}
```

This identifies one physical occurrence when the structural pointer is unique. Malformed source requires an additional occurrence model.

---

# 31. Logical Identity vs Physical Occurrence

SPIKE-LOC-001 demonstrated that duplicate mapping keys can produce multiple authored declarations with the same JSON Pointer.

Logical structural identity:

```text
documentUri + pointer
```

Physical occurrence identity:

```text
documentUri
+
pointer
+
occurrence
+
range
```

The latter is needed when multiple physical declarations map to the same pointer.

---

# 32. `SourceOccurrence`

Conceptually:

```typescript
interface SourceOccurrence {
  documentUri: string;
  pointer: string;
  occurrenceIndex: number;
  kind: SourceNodeKind;
  range: SourceRange;
  anchor: SourcePosition;
  keyRange?: SourceRange;
  valueRange?: SourceRange;
}
```

`occurrenceIndex` is deterministic within current source content but is not intended to remain stable after source edits.

---

# 33. `SourceLocationIndex`

The index must not assume one pointer always maps to exactly one physical node.

Conceptually:

```typescript
interface SourceLocationIndex {
  lookup(pointer: string): SourceLookupResult;
}

type SourceLookupResult =
  | { status: "not-found" }
  | { status: "unique"; occurrence: SourceOccurrence }
  | { status: "ambiguous"; occurrences: SourceOccurrence[] };
```

This handles valid and duplicate-key source without silently selecting one occurrence.

---

# 34. Index Construction

For each physical document:

```text
Source text
    ↓
Format-specific adapter
    ↓
Structural traversal
    ↓
Path segment stack
    ↓
RFC 6901 encoder
    ↓
Occurrence detection
    ↓
Range + presentation mapping
    ↓
SourceLocationIndex
```

Index creation occurs before third-party OpenAPI bundling or transformation.

---

# 35. Root Index Entry

The root source document is represented by the empty JSON Pointer:

```text
""
```

rather than `/`, because RFC 6901 uses the empty string to identify the entire document.

This distinction must be covered by unit tests.

---

# 36. Anchors and Aliases

YAML anchors and aliases are source-syntax evidence.

The index should preserve anchor declaration location, alias occurrence location, and node kind.

YAML aliases must not become OpenAPI `$ref` provenance; reference semantics remain separate.

---

# 37. `$ref` Evidence Collector

After indexing a source document, OAIT scans structural evidence for physically declared `$ref` properties.

Conceptually:

```typescript
interface ReferenceDeclaration {
  declarationId: string;
  documentUri: string;
  pointer: string;
  declarationOccurrence: SourceOccurrence;
  valueOccurrence?: SourceOccurrence;
  rawReference: string;
  target: ReferenceTargetDescriptor;
}
```

The declaration is captured before any bundling or dereferencing occurs.

---

# 38. Reference Target Descriptor

A `$ref` value should be decomposed into physical resource and fragment evidence.

Conceptually:

```typescript
interface ReferenceTargetDescriptor {
  resolvedResourceUri: string;
  rawFragment?: string;
  fragmentKind:
    | "none"
    | "json-pointer"
    | "anchor"
    | "unknown";
  pointer?: string;
}
```

Not every legal reference fragment should be assumed to be an RFC 6901 pointer. Schema-aware anchor interpretation belongs to later OpenAPI/JSON Schema processing.

---

# 39. Resource Resolution vs Semantic Resolution

The source subsystem performs **resource resolution**.

Example:

```text
./schemas/Pet.yaml#/Pet
```

can be decomposed into a physical resource URI and a fragment.

The subsystem may resolve an unambiguous RFC 6901 fragment to a physical source pointer, but it must not assume responsibility for every OpenAPI or JSON Schema reference semantic.

This prevents premature coupling to OpenAPI 3.0/3.1/3.2 schema behavior.

---

# 40. Reference Resource Discovery

For every external reference:

```text
Declaration
    ↓
Resolve resource URI relative to declaration document
    ↓
SourcePolicy
    ↓
ALLOW / DENY
    ↓
Registry lookup
    ↓
Already loaded?
    ├── yes → reuse
    └── no  → SourceLoader
                    ↓
                index
                    ↓
            collect references
```

This creates a controlled physical source-resource graph.

---

# 41. Recursive References

Recursive references must terminate safely.

```text
A.yaml → B.yaml
B.yaml → A.yaml
```

The registry prevents repeated source loading. The reference graph may contain cycles, but source-loading traversal must not expand them indefinitely.

---

# 42. Shared Targets

Multiple declarations may target the same physical source.

The registry contains one physical source document, while the reference graph retains independent declaration edges.

This preserves declaration provenance without duplicating source documents.

---

# 43. `SourceReferenceGraph`

Conceptually:

```typescript
interface SourceReferenceGraph {
  declarations: ReferenceDeclaration[];
  resources: SourceDocumentRecord[];
  edges: SourceReferenceEdge[];
}
```

An edge should retain declaration, target resource, fragment evidence, and resolution state.

Possible conceptual states include:

```text
resolved-resource
unresolved-resource
blocked-by-policy
unsupported-scheme
invalid-reference
```

---

# 44. Reference Hops

Ordered reference-hop chains should be derived from the reference graph rather than stored only as flattened final targets.

```text
A declaration
   ↓
B target
   ↓
B declaration
   ↓
C target
```

can produce ordered hop evidence while retaining each original declaration and target.

Full semantic traversal may later use OpenAPI- or schema-aware services.

---

# 45. Diagnostic Architecture

Source processing produces OAIT-owned diagnostics. Candidate parser errors must be normalized before leaving their adapter.

Conceptually:

```typescript
interface SourceDiagnostic {
  code: string;
  severity:
    | "error"
    | "warning"
    | "info";
  message: string;
  documentUri?: string;
  pointer?: string;
  range?: SourceRange;
  position?: SourcePosition;
  source:
    | "source-policy"
    | "source-loader"
    | "yaml-parser"
    | "json-parser"
    | "reference-evidence";
}
```

Candidate-specific error objects must not be exposed downstream.

---

# 46. Diagnostic Examples

Possible internal diagnostic codes include:

```text
SOURCE_NOT_FOUND
SOURCE_ACCESS_DENIED
SOURCE_FORMAT_UNSUPPORTED
SOURCE_ENCODING_UNSUPPORTED
YAML_SYNTAX_ERROR
YAML_MULTIPLE_DOCUMENTS
YAML_DUPLICATE_KEY
JSON_SYNTAX_ERROR
JSON_COMMENT_NOT_ALLOWED
JSON_TRAILING_COMMA_NOT_ALLOWED
REFERENCE_RESOURCE_MISSING
REFERENCE_ACCESS_DENIED
REFERENCE_INVALID_URI
REFERENCE_FRAGMENT_UNRESOLVED
```

Final code names should be finalized during implementation and integrated with the existing OAIT error architecture rather than creating a competing error system.

---

# 47. Processing Outcome

Source processing should return an explicit completeness state.

Conceptually:

```typescript
type SourceProcessingState =
  | "complete"
  | "partial"
  | "failed";
```

`complete` means the entry and required admitted resources were processed successfully. `partial` means entry source remains usable but one or more references or structures produced recoverable problems. `failed` means the entry could not be safely admitted, decoded, or structurally processed sufficiently for downstream analysis.

---

# 48. `SourceProcessingResult`

Conceptually:

```typescript
interface SourceProcessingResult {
  state: SourceProcessingState;
  entryDocumentUri: string;
  registry: SourceDocumentRegistry;
  referenceGraph: SourceReferenceGraph;
  diagnostics: SourceDiagnostic[];
}
```

Downstream OpenAPI processing must inspect `state` rather than assume complete success.

---

# 49. Partial Processing Policy

Malformed entry documents may still produce useful syntax diagnostics, source ranges, and partial source index evidence, but partial structural evidence must not automatically be treated as a valid OpenAPI description.

Similarly, a missing external reference should not erase successful analysis of the entry document. Instead, source evidence plus an explicit unresolved-reference diagnostic is returned.

The next workflow stage determines whether semantic analysis can continue safely.

---

# 50. Downstream Handoff

After source processing:

```text
SourceProcessingResult
       ↓
Controlled OpenAPI parser adapter
       ↓
Version detection
       ↓
Reference/OpenAPI interpretation
       ↓
Version adapter
       ↓
Normalizer
       ↓
NormalizedOpenApiDocument
```

The downstream parser should consume already admitted source content where practical and must not independently bypass source policy to fetch arbitrary resources.

---

# 51. Integration with Future OpenAPI Parser

The eventual OpenAPI parser selection remains independent.

The source layer exposes approved source documents, canonical document URIs, source indexes, reference declarations, and diagnostics.

A Scalar, Redocly, or other parser adapter must coexist with this source graph. Candidate-specific resolution must not overwrite OAIT-owned source evidence.

---

# 52. Integration with Normalized Domain Model

Normalized objects may reference OAIT source evidence.

Conceptually:

```typescript
interface NormalizedOperation {
  // logical OpenAPI properties
  source: SourceLocation;
}
```

If an entity was declared through `$ref`, it may additionally carry `ReferenceOrigin` or equivalent provenance.

The normalized model must not depend on `yaml` or `jsonc-parser` node types.

---

# 53. Raw Source Handles

When a downstream feature requires raw authored source, it should reference source through an OAIT-owned handle.

Conceptually:

```typescript
interface RawSourceHandle {
  documentUri: string;
  pointer: string;
  occurrenceIndex?: number;
}
```

The registry resolves the handle into physical source evidence. The handle never exposes parser AST objects.

---

# 54. Source Caching Within a Workflow

A source document must not be unnecessarily reparsed or reindexed during the same workflow.

```text
canonical document URI
        ↓
registry
        ↓
already processed?
    ├── yes → reuse
    └── no  → load + parse + index
```

This satisfies the requirement to avoid repeated deterministic processing.

---

# 55. Content Fingerprints

Each loaded source should have a deterministic content fingerprint such as SHA-256 for mutation detection, cache invalidation, reproducibility, and debug evidence.

A content fingerprint does not replace `documentUri`; identical content at different URIs remains distinct physical resources.

---

# 56. Performance Design

The implementation should load each physical resource once per workflow, parse each resource once, build each source index once, reuse one line map per document, avoid full dereferencing, avoid unnecessary source-text copying, deduplicate document records by canonical URI, and use iterative/cycle-aware graph traversal.

Performance instrumentation should separately measure source loading, source parsing, index construction, and reference discovery.

---

# 57. Resource Limits

Because input is untrusted, future configuration should support bounded processing such as maximum source document count, maximum individual document size, maximum total source bytes, maximum reference traversal depth, and future remote redirect limits.

Exact defaults are deferred. Limits must produce controlled diagnostics rather than uncontrolled process failure.

---

# 58. Privacy and Logging

Source content must not be logged by default.

Diagnostic/debug output may safely expose document URI, pointer, diagnostic code, timing, and document count where appropriate.

Full source excerpts should be included only when reporting design explicitly allows them. No source-content telemetry is required for deterministic processing.

---

# 59. Dependency Direction

Recommended logical dependency direction:

```text
packages/core
     ↑
     │ OAIT-owned source contracts
     │
packages/parser
     │
     ├── source orchestration
     ├── source policy
     ├── source registry
     ├── YAML adapter
     ├── JSON adapter
     ├── index builder
     └── reference evidence
```

`packages/core` may own stable contracts such as `SourceLocation`, `SourceRange`, `RawSourceHandle`, and reference-provenance contracts used by the domain model.

`packages/parser` may implement source-processing infrastructure.

This prevents `core → parser` dependency inversion.

---

# 60. Package Creation Policy

This design does not require creation of a separate `packages/source/` package.

The initial implementation should remain cohesive with parser/source-processing responsibility, potentially under `packages/parser/src/source/`.

A separate source package should be introduced only if implementation experience demonstrates a stable independent reuse boundary.

This follows the monorepo principle of avoiding premature package proliferation.

---

# 61. Proposed Internal Module Structure

Conceptually:

```text
packages/parser/
└── src/
    └── source/
        ├── source-processing-service.ts
        ├── source-policy.ts
        ├── uri-canonicalizer.ts
        ├── source-loader.ts
        ├── source-document-registry.ts
        ├── format-detector.ts
        │
        ├── adapters/
        │   ├── yaml-source-adapter.ts
        │   └── json-source-adapter.ts
        │
        ├── indexing/
        │   ├── json-pointer-encoder.ts
        │   ├── source-index-builder.ts
        │   ├── source-location-index.ts
        │   └── line-map.ts
        │
        ├── references/
        │   ├── reference-evidence-collector.ts
        │   └── source-reference-graph.ts
        │
        └── diagnostics/
            └── source-diagnostic-normalizer.ts
```

This is a design proposal, not a requirement that every file exist separately. Implementation should optimize for cohesion rather than mirror the diagram mechanically.

---

# 62. Error Isolation

A failure in one referenced source should not erase successfully collected evidence from unrelated resources.

Example:

```text
openapi.yaml
├── good.yaml     PASS
└── missing.yaml  FAIL
```

The registry retains successful resources and records an unresolved-resource diagnostic for the missing one. No failure is silently omitted.

---

# 63. Determinism

Given the same source bytes, same configuration, and same parser versions, the subsystem must deterministically produce canonical document URIs, structural pointers, occurrence ordering, source ranges, reference declarations, and diagnostic codes.

Timing information is excluded from deterministic equality.

---

# 64. Test Strategy

## 64.1 Unit Tests

Test isolated behavior for RFC 6901 encoding, URI canonicalization, range mapping, line/column conversion, duplicate occurrence indexing, format detection, policy evaluation, and reference URI parsing.

## 64.2 Adapter Contract Tests

Equivalent structural expectations should be exercised through `YamlSourceAdapter` and `JsonSourceAdapter` where equivalent YAML/JSON input exists.

Candidate-specific behavior remains confined to adapter tests.

## 64.3 Integration Tests

Integration coverage includes single-file OpenAPI, multi-file OpenAPI, nested references, shared targets, recursive resources, missing targets, invalid pointers, blocked traversal, symlink escape, remote reference denial, duplicate keys, YAML aliases, and malformed input.

## 64.4 Regression Tests

The SPIKE-LOC-001 fixtures should become the foundation for regression coverage, including Unicode, CRLF, BOM, exact ranges, escaped pointer tokens, duplicate scalar values, duplicate mappings, large documents, and strict JSON.

---

# 65. Upgrade Qualification

An upgrade to `yaml` or `jsonc-parser` must rerun source-index regression tests.

At minimum verify source ranges, pointer identity, duplicate behavior, malformed recovery, Unicode coordinates, BOM, CRLF, strict JSON, and performance.

Source parser upgrades are foundational changes and require more scrutiny than ordinary utility dependency updates.

---

# 66. Design Invariants

The production implementation must preserve these invariants:

1. Source input is treated as untrusted.
2. Source is never modified during analysis.
3. No resource is loaded before source-policy evaluation.
4. Canonical physical resources are registered once per session.
5. YAML uses the approved YAML adapter.
6. JSON uses the approved strict JSON adapter.
7. Candidate AST/CST types never escape infrastructure adapters.
8. OAIT owns RFC 6901 pointer serialization.
9. Root pointer is the empty string.
10. Source ranges explicitly declare their coordinate semantics.
11. Line/column are presentation metadata.
12. Duplicate physical occurrences are never silently collapsed.
13. YAML aliases remain separate from OpenAPI references.
14. `$ref` declarations are captured before transformation.
15. Resource resolution remains distinct from full OpenAPI semantic resolution.
16. Recursive resource graphs terminate safely.
17. Unresolved and denied references remain visible diagnostics.
18. Full dereferencing is not required for canonical source analysis.
19. Source-processing results explicitly report complete/partial/failed state.
20. Downstream domain objects reference OAIT-owned source evidence only.

---

# 67. Requirement Traceability

| Design concern | Source requirement/decision |
| --- | --- |
| Normalized downstream model | ADR-003 |
| OAIT owns source evidence | ADR-004 |
| YAML/JSON parser technology | ADR-005 |
| Source immutability | NFR-REL-001 |
| Graceful failure | NFR-REL-003 |
| No silent omission | NFR-REL-008 |
| Treat source as untrusted | NFR-SEC-001 |
| Remote-reference controls | NFR-SEC-005 |
| Local-file controls | NFR-SEC-006 |
| Local-first processing | NFR-PRV-001 |
| Avoid repeated parsing | NFR-PERF-003 |

---

# 68. Deferred Decisions

The following are deliberately not finalized here:

- Exact CLI/configuration keys for allowed roots, remote-reference enablement, host allowlists, and resource limits.
- Remote HTTP loader implementation.
- JSON Schema anchor semantics.
- Final OpenAPI parser/validator.
- Exact parser-to-registry integration mechanism.
- Future source editing model for enhancement/Overlay workflows.
- Whether a dedicated source package should eventually be introduced.

---

# 69. Implementation Readiness

After this design is accepted, the source-processing subsystem is architecturally ready for implementation planning.

However, OAIT as a whole remains in technical validation.

The remaining parser-validator spikes still need to evaluate:

```text
SPIKE-004 — OpenAPI 3.2 operation behavior
SPIKE-005 — Schema and dialect behavior
SPIKE-006 — Validator diagnostics
SPIKE-007 — Performance and operational suitability
```

followed by the parser-validator evaluation summary and final parser technology decision.

Therefore this document does not authorize premature implementation of the full parser/normalization pipeline.

---

# 70. Expected Production Flow

```text
Entry source
    ↓
SourcePolicy
    ↓
SourceLoader
    ↓
SourceDocumentRegistry
    ↓
FormatDetector
    ↓
YAML / JSON Source Adapter
    ↓
SourceIndexBuilder
    ↓
SourceLocationIndex
    ↓
ReferenceEvidenceCollector
    ↓
Controlled Source Resource Graph
    ↓
Selected OpenAPI Parser Adapter
    ↓
Version Detection
    ↓
OpenAPI / Reference Interpretation
    ↓
Version Adapter
    ↓
Normalizer
    ↓
NormalizedOpenApiDocument
    ↓
Validator / Rules / Scoring / Reporting
```

---

# 71. Final Design Statement

The OAIT source-processing subsystem will act as the trusted boundary between untrusted physical OpenAPI source files and all higher-level OpenAPI analysis.

It will:

1. Control which resources may be accessed.
2. Load source without modification.
3. Assign canonical physical document identity.
4. Parse YAML and JSON using format-specific source-preserving adapters.
5. Convert parser structures into OAIT-owned structural evidence.
6. Build RFC 6901-based source indexes.
7. Preserve duplicate physical occurrences.
8. Normalize ranges and presentation coordinates.
9. Capture `$ref` declarations before transformation.
10. Build a cycle-safe physical resource graph.
11. Preserve source diagnostics.
12. Pass only controlled source evidence into downstream OpenAPI processing.

---

# 72. Guiding Principle

> **Source parsers reveal structure; OAIT owns the evidence.**
