# ADR-004: Own Source Loading, Reference Evidence, and Source-Location Indexing

**Status:** Accepted
**Date:** 2026-08-09
**Decision owners:** OAIT Architecture
**Applies to:** OAIT v0.1 and later
**Related documents:** `ADR-003-normalized-openapi-domain-model.md`, `openapi-domain-model.md`, `system-architecture.md`, `parser-validator-spike-plan.md`, `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`

---

## 1. Context

The OpenAPI Intelligence Toolkit (OAIT) must analyze OpenAPI descriptions while preserving sufficient evidence to explain exactly where each finding originated.

OAIT must support:

* YAML and JSON.
* Single-file and multi-file OpenAPI descriptions.
* Internal and external `$ref` relationships.
* Nested and recursive references.
* Multiple references to the same target.
* OpenAPI 3.x version differences.
* Deterministic findings that point back to original source.
* Future automated remediation and OpenAPI Overlay generation.
* Future semantic diff, Contract Guard, AI review, and release-note workflows.

ADR-003 established that OAIT will operate on an OAIT-owned normalized, version-aware OpenAPI domain model and that normalized entities must preserve traceability to their original source.

That decision left an important architectural question unresolved:

> **Which component owns original-source identity, reference provenance, source locations, and access-control policy before third-party OpenAPI processing transforms the input?**

SPIKE-002 and SPIKE-003 were conducted specifically to answer that question.

---

## 2. Problem

Third-party OpenAPI parsers, bundlers, resolvers, and validators may transform an OpenAPI description while processing it.

Examples include:

* Moving externally referenced schemas into generated component locations.
* Rewriting external `$ref` values.
* Deduplicating referenced components.
* Flattening physical file boundaries.
* Producing bundled pointers that do not correspond to original source pointers.
* Dereferencing references into cyclic JavaScript object graphs.
* Providing diagnostic source information only for errors but not for valid nodes.
* Automatically loading files or network resources according to library-specific behavior.

OAIT cannot use a transformed representation as the authoritative source of provenance because a transformed location may no longer identify where the user actually authored the content.

For example:

```text
Original source

paths/pets.yaml
/get/responses/200/content/application~1json/schema/$ref
        ↓
./schemas/Pet.yaml
```

may become something conceptually similar to:

```text
Bundled representation

/components/schemas/Pet
```

The bundled pointer is useful for internal processing but is not equivalent to the original physical source location.

OAIT therefore needs a source-processing architecture that preserves original evidence independently of third-party transformations.

---

## 3. Decision

OAIT will own the processing layer responsible for:

1. Source admission and loading.
2. Physical document identity.
3. Source-location indexing.
4. `$ref` declaration capture.
5. Reference target and hop evidence.
6. Filesystem and network access policy.
7. Original-versus-transformed location separation.
8. Normalization of candidate diagnostics into OAIT-owned source evidence.

This evidence must be captured **before third-party bundling or dereferencing can modify source structure or reference representation**.

Third-party parser, bundler, resolver, and validator libraries may participate in processing, but they will not define OAIT's canonical source identity or provenance model.

---

## 4. Decision Statement

> **OAIT will own source loading, source-location indexing, reference-evidence capture, and source-access policy before third-party OpenAPI transformations. Canonical source identity will be based on the original physical document and RFC 6901 JSON Pointer, while line and column will remain presentation metadata.**

---

## 5. Evidence from SPIKE-002

SPIKE-002 evaluated reference resolution and multi-file behavior using:

```text
@scalar/openapi-parser@0.28.10
@scalar/json-magic@0.12.19
@redocly/openapi-core@2.40.0
```

Both candidates successfully handled many required reference-resolution scenarios, including:

* Internal references.
* External files.
* Nested references.
* Shared targets.
* Recursive references.
* Missing targets.
* Missing files.
* Invalid fragments.
* Remote references.

However, both transformed successful reference representations.

### Scalar

Scalar bundled external resources under generated `x-ext` structures and rewrote external references into internal bundled references.

URL-map information preserved useful target-document information, but complete declaration provenance and ordered reference-hop evidence were not available from the final bundled representation alone.

A nested lifecycle path also produced an ambiguous:

```text
[object Object]
```

segment.

### Redocly

Redocly moved external schemas into root components, potentially deduplicated or renamed them, and rewrote references accordingly.

Its `fileDependencies` identified physical files but did not provide complete per-reference mappings between:

```text
declaration
↓
target
↓
nested target
```

### SPIKE-002 conclusion

OAIT must collect reference evidence before bundling or dereferencing.

The spike also demonstrated that filesystem and network access cannot safely be delegated blindly to candidate defaults.

Both default filesystem loaders followed references outside the intended fixture root.

Scalar exposed documented mechanisms that can participate in an OAIT-controlled loading strategy.

Redocly's tested documented safe API did not expose equivalent network-deny or filesystem-root controls.

Therefore source loading is also a security boundary.

---

## 6. Evidence from SPIKE-003

SPIKE-003 evaluated whether Scalar and Redocly could provide canonical original-source locations for valid OpenAPI entities.

The minimum architectural requirement was:

```text
documentUri
+
original RFC 6901 JSON Pointer
```

with optional:

```text
line
column
```

for human-readable presentation.

Neither candidate satisfied that minimum gate independently for valid nodes.

Candidate-native valid-node support for:

* Original JSON Pointer.
* Line.
* Column.
* Schema-property location.
* Array-item location.
* Nested-hop source locations.

was insufficient through the tested documented APIs.

SPIKE-003 therefore produced **Outcome C**:

> Candidate-native source locations are insufficient; OAIT requires an independent source-location index.

---

## 7. Source-Location Feasibility Evidence

SPIKE-003 also performed an isolated feasibility proof.

The proof successfully produced exact source locations for representative YAML and JSON structures, including:

* Original physical document identity.
* RFC 6901 JSON Pointers.
* 1-based line and column.
* Arrays.
* Escaped `/` and `~` pointer tokens.
* Duplicate scalar values.
* Whitespace changes.
* Comments.
* Key reordering.
* Multi-file targets.
* Separate `$ref` declaration and target locations.
* Ordered nested-reference hops.

The proof demonstrated that OAIT can construct reliable source evidence independently of the parser candidates.

The proof does **not** select the production source-preserving YAML/JSON technology.

---

## 8. Revised Source-Processing Boundary

ADR-003 originally described the conceptual flow primarily in terms of parsing, reference resolution, and normalization.

ADR-004 refines the upstream processing boundary.

The intended architecture is now:

```text
User-supplied OpenAPI source
            ↓
┌──────────────────────────────┐
│ Source Admission / Policy    │
│                              │
│ approved roots               │
│ network policy               │
│ URI policy                   │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ OAIT Source Loader           │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Raw Source Documents         │
│                              │
│ original bytes/text          │
│ physical document identity   │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Source Evidence Layer        │
│                              │
│ SourceLocationIndex          │
│ Reference declarations       │
│ Reference targets            │
│ Reference hops               │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Controlled Ref Processing    │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Parser / Bundler / Validator │
│ Adapter                      │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Version Adapter / Normalizer │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ OAIT Domain Model            │
│ + original source evidence   │
└──────────────────────────────┘
```

The exact package/component boundaries will be defined during detailed design.

---

## 9. Canonical Source Identity

The stable source identity of an OpenAPI object will be:

```text
documentUri
+
RFC 6901 JSON Pointer
```

Conceptually:

```typescript
interface SourceLocation {
  documentUri: string;
  filePath?: string;
  pointer: string;
  line?: number;
  column?: number;
}
```

The exact production TypeScript interface remains subject to detailed design.

---

## 10. Why `documentUri + pointer`

A physical source location must remain stable across presentation-only changes.

For example, these changes may move line numbers:

* Adding comments.
* Adding blank lines.
* Reformatting indentation.
* Reordering unrelated mapping keys.

However, the structural location:

```text
/paths/~1pets/get
```

can remain stable.

Therefore:

```text
documentUri + pointer
```

is structural identity.

Whereas:

```text
line + column
```

is presentation metadata.

---

## 11. Line and Column Policy

OAIT will retain line and column when the selected source-index technology can produce them reliably.

The recommended external reporting convention is:

```text
1-based line
1-based column
```

Line and column must not be used as the canonical identity of an entity.

They may be recomputed whenever a source document changes.

---

## 12. Original and Transformed Locations Must Remain Separate

OAIT must never silently substitute:

```text
bundled pointer
```

for:

```text
original source pointer
```

The architecture must distinguish at least:

```text
Original source location
```

from:

```text
Transformed/bundled location
```

where both are useful.

For example:

```text
Original:
schemas/Pet.yaml
/properties/id

Bundled:
entry-document
/components/schemas/Pet/properties/id
```

The first is authoritative for user-facing findings.

The second may be useful internally for candidate correlation.

---

## 13. Source Document Registry

OAIT should maintain an internal registry of every admitted physical source document.

Conceptually, each source document should retain information such as:

```text
canonical document URI
original requested URI/path
source text or bytes
format
source-location index
load status
security decision
```

The precise structure belongs to detailed design.

---

## 14. Source-Location Index

Every successfully loaded YAML or JSON source should be indexable structurally.

Conceptually:

```typescript
interface SourceLocationIndex {
  locate(
    documentUri: string,
    pointer: string
  ): SourceLocation | undefined;
}
```

The implementation must use structural parsing rather than text searching.

This requirement is important because identical scalar values may occur at multiple unrelated positions.

For example:

```yaml
description: Identifier
```

may appear several times.

OAIT must distinguish those objects through structure and pointer identity.

---

## 15. JSON Pointer Requirements

OAIT's canonical structural pointers will follow RFC 6901 semantics.

The source-index implementation must correctly handle:

```text
arrays
mapping keys
/
~
```

including escaping:

```text
/  → ~1
~  → ~0
```

For example:

```text
/pets/{petId}
```

used as a mapping key becomes:

```text
/paths/~1pets~1{petId}
```

The source index must construct pointers structurally rather than infer them from transformed parser paths.

---

## 16. Reference Evidence

OAIT must retain evidence about every significant `$ref` declaration before transformation.

Conceptually, reference evidence should be able to represent:

```text
raw reference
declaration document
declaration pointer
target document
target pointer
resolution status
ordered nested hops
failure information
```

For example:

```text
openapi.yaml
/components/schemas/Pet/$ref
        ↓
models.yaml#/Pet
        ↓
models.yaml
/Pet/properties/id/$ref
        ↓
common.yaml#/Identifier
```

Each declaration and target must retain its own source location.

---

## 17. Reference Hop Preservation

Nested references must be modeled as ordered evidence rather than only as a final resolved object.

Conceptually:

```typescript
interface ReferenceHop {
  declaration: SourceLocation;
  rawReference: string;
  target?: SourceLocation;
}
```

The exact production model may differ.

The architectural invariant is:

> OAIT must be able to explain how resolution moved from one original source location to the next.

---

## 18. Reference-Preserving Analysis

Full dereferencing will not be the canonical representation for deterministic OAIT analysis.

SPIKE-002 showed that recursive schemas can produce cyclic JavaScript graphs when fully dereferenced.

Therefore OAIT should prefer:

```text
reference-preserving representation
+
explicit reference graph/evidence
```

over naïvely expanded graphs.

Dereferenced views may still be created for narrowly scoped use cases if traversal is cycle-aware.

---

## 19. Source Loading Is a Security Boundary

OpenAPI descriptions are untrusted input.

A `$ref` may attempt to access:

```text
../outside.yaml
```

or:

```text
http://host/resource.yaml
```

OAIT must therefore control which resources may be loaded.

Third-party resolver defaults must not determine OAIT's security posture.

---

## 20. Filesystem Policy

OAIT source loading must eventually support an explicit filesystem access policy.

At minimum, the design must address:

* Approved roots.
* Parent-directory traversal.
* Absolute paths.
* Symbolic links.
* Real-path normalization.
* Platform case sensitivity.
* File URI normalization.

A reference outside the permitted boundary must be rejected before unrestricted candidate resolution occurs.

The exact configuration contract belongs to detailed design.

---

## 21. Network Policy

OAIT follows a local-first security model.

Remote references must therefore not be fetched implicitly merely because a third-party candidate chooses to resolve them.

The source-processing layer must own decisions such as:

```text
network disabled
```

or explicitly configured:

```text
allowed schemes
allowed hosts
allowed URLs
```

Remote access should be deny-by-default unless a workflow explicitly enables it.

The final policy configuration remains a later design decision.

---

## 22. Candidate Parser Responsibility

A selected parser/bundler may still provide valuable capabilities such as:

* OpenAPI parsing.
* Version detection support.
* Reference resolution.
* Validation.
* Bundling.
* Diagnostics.
* URL mapping.
* Resolver hooks.

However, candidate output is considered an infrastructure representation, not the canonical source-evidence model.

OAIT-owned interfaces must isolate downstream components from candidate-specific types and transformations.

---

## 23. Candidate Diagnostic Normalization

Third-party diagnostic source information may still be useful.

For example, a validator may report:

```text
source file
pointer
message
severity
```

OAIT may consume this evidence.

However, candidate diagnostics must be normalized against OAIT-owned source identity.

A diagnostic must not introduce a separate incompatible source-location model.

Conceptually:

```text
Candidate diagnostic
       ↓
Diagnostic adapter
       ↓
OAIT documentUri + pointer
       ↓
SourceLocationIndex
       ↓
line / column / source context
```

---

## 24. Relationship to ADR-003

ADR-004 does not supersede ADR-003.

ADR-003 remains responsible for the decision that downstream analysis uses an OAIT-owned normalized, version-aware domain model.

ADR-004 refines how original source evidence reaches that model.

The combined architectural principle is:

```text
Preserve physical evidence first.
Normalize logical meaning second.
Analyze normalized concepts third.
```

Therefore:

```text
Source Representation
      ↓
Owned Source Evidence
      ↓
OpenAPI Interpretation
      ↓
Normalized Domain Model
      ↓
Rules / Scoring / AI / Diff
```

---

## 25. Domain Model Impact

Normalized domain entities will eventually carry or reference original source evidence.

For example:

```typescript
interface NormalizedOperation {
  // logical domain information

  source: SourceLocation;
}
```

Referenced entities may additionally expose reference-origin information.

The domain model must not depend on:

```text
Scalar-specific node types
Redocly-specific source types
YAML-library AST types
```

Infrastructure adapters must convert those representations into OAIT-owned contracts.

---

## 26. Reporting Impact

The Reporting Engine should eventually be able to produce findings such as:

```text
OAIT-DOC-004
Parameter description is missing.

Operation:
GET /pets/{petId}

Parameter:
petId

Source:
file:///project/paths/pets.yaml

Pointer:
/get/parameters/0

Line:
18

Column:
5
```

Logical context comes from the normalized domain model.

Physical evidence comes from the source-evidence layer.

---

## 27. Future Enhancement and Contract Guard Impact

Future safe-edit workflows require exact original-source evidence.

For example, an enhancement engine may need to determine:

```text
where a description is declared
```

without modifying:

```text
schema structure
parameter requirements
response status codes
security requirements
```

Reliable source evidence therefore supports:

* Documentation-only changes.
* Contract Guard.
* OpenAPI Overlay generation.
* Before/after comparison.
* Reviewable patch creation.

---

## 28. Future Diff Impact

Semantic diff will compare normalized domain models.

However, when OAIT identifies a change, it must still be able to explain:

```text
where the previous declaration came from
```

and:

```text
where the current declaration came from
```

The source-evidence architecture therefore becomes reusable by future comparison and release-note workflows.

---

## 29. Future AI Impact

AI components must not independently parse source files to determine provenance.

AI should receive:

```text
normalized logical context
+
OAIT-owned source evidence
```

This improves:

* Evidence grounding.
* Traceability.
* Prompt construction.
* Human review.
* Safe application of suggestions.

AI-generated interpretations must not overwrite deterministic source identity.

---

## 30. Alternatives Considered

### Alternative A — Use candidate-native source locations

Under this option, OAIT would accept the selected OpenAPI parser's source-location representation as canonical.

**Rejected.**

SPIKE-003 demonstrated that neither tested candidate provides sufficient valid-node original-source locations through the evaluated documented APIs.

This would also couple OAIT's domain model to a specific third-party library.

---

### Alternative B — Use bundled pointers as source pointers

Under this option, OAIT would use whatever structural pointer exists after bundling.

**Rejected.**

Bundling may:

* Move external schemas.
* Rewrite references.
* Rename components.
* Deduplicate structures.
* Flatten physical source boundaries.

A bundled pointer does not reliably identify the user's original source.

---

### Alternative C — Fully dereference before analysis

Under this option, OAIT would convert the description into a completely dereferenced graph and analyze that graph.

**Rejected as the canonical architecture.**

Dereferencing:

* Removes reference boundaries.
* Reduces provenance.
* Can create cyclic JavaScript graphs.
* Makes serialization and traversal more difficult.
* Does not solve original-source mapping.

Dereferenced views may still be used for narrowly controlled purposes.

---

### Alternative D — Build source locations after bundling

Under this option, OAIT would first allow a candidate to transform the document and later attempt to reconstruct the original locations.

**Rejected.**

Once source boundaries and raw reference declarations have been transformed, exact provenance may no longer be reconstructable.

Evidence must be captured before transformation.

---

### Alternative E — Implement a complete OpenAPI parser internally

Under this option, OAIT would avoid third-party parser libraries entirely.

**Rejected for now.**

OAIT's differentiating value is OpenAPI intelligence, quality analysis, safe improvement, change analysis, and documentation workflows.

Building and maintaining a complete standards-compliant OpenAPI parser would significantly increase scope and maintenance burden.

OAIT should own the architectural evidence boundary while continuing to reuse suitable third-party parsing and validation capabilities.

---

### Alternative F — OAIT-owned source-evidence layer with candidate adapters

Under this option:

```text
OAIT owns original source evidence
+
third-party tools provide parsing/validation capabilities
```

**Accepted.**

This provides the strongest separation between:

```text
source truth
```

and:

```text
processing technology
```

while avoiding unnecessary reimplementation of the OpenAPI ecosystem.

---

## 31. Positive Consequences

This decision provides:

* Stable original-source identity.
* Reliable multi-file provenance.
* Candidate independence.
* Better security control.
* Deterministic reference evidence.
* Better diagnostics.
* Precise user-facing findings.
* Foundation for safe remediation.
* Foundation for Overlay generation.
* Foundation for semantic diff.
* Foundation for Contract Guard.
* Better AI grounding.
* Easier parser replacement in the future.

---

## 32. Negative Consequences

This decision also introduces additional engineering complexity.

OAIT must implement and test:

* Source-document registration.
* URI normalization.
* Source-preserving structural indexing.
* RFC 6901 pointer construction.
* Reference declaration capture.
* Reference graph evidence.
* Security policies.
* Candidate correlation.
* Diagnostic normalization.

This duplicates some capabilities that may partially exist in third-party libraries.

The duplication is intentional because these responsibilities represent OAIT's stable source-of-truth boundary.

---

## 33. Technology Selection Is Deferred

ADR-004 is an architecture-ownership decision.

It does **not** select:

* A YAML parser.
* A JSON parser.
* A CST implementation.
* An AST implementation.
* Scalar as the production parser.
* Redocly as the production parser.
* A final reference resolver.
* A final validator.

SPIKE-003 used:

```text
yaml@2.8.3
```

only as an isolated feasibility proof.

That package is not selected for production by this ADR.

---

## 34. Required Follow-Up Technical Spike

Before implementing the production source-location layer, OAIT must evaluate source-preserving YAML/JSON technologies or strategies.

The follow-up spike should investigate:

* CST/AST availability.
* Exact source ranges.
* YAML and JSON behavior.
* Malformed-input recovery.
* Duplicate-key behavior.
* YAML anchors and aliases.
* Comment/token retention.
* RFC 6901 pointer construction.
* Memory usage.
* Performance.
* API stability.
* TypeScript integration.
* Maintenance activity.
* Dependency security.
* License compatibility.

The spike should produce evidence sufficient for an implementation technology decision.

---

## 35. Detailed Design Deferred

After the source-location technology decision, OAIT should create a detailed source-processing design covering components such as:

```text
SourceLoader
SourcePolicy
SourceDocumentRegistry
SourceLocationIndex
ReferenceEvidenceCollector
ReferenceGraph
DiagnosticLocationAdapter
ParserAdapter
```

Names shown here are conceptual and are not fixed public APIs.

The detailed design should define ownership, interfaces, failure behavior, and package dependencies.

---

## 36. Architectural Invariants

The implementation must preserve the following invariants.

1. Original source is immutable during deterministic analysis.
2. Every admitted physical document has canonical document identity.
3. Significant source entities can be identified by `documentUri + pointer`.
4. Canonical pointers represent original source, not bundled output.
5. Line and column are presentation metadata.
6. `$ref` declarations are captured before transformation.
7. Declaration and target locations remain distinct.
8. Nested reference hops remain ordered and explainable.
9. Candidate-specific types do not leak into the OAIT domain model.
10. Filesystem and network access are governed by OAIT policy.
11. Remote loading is not implicitly enabled by candidate defaults.
12. Recursive references do not require infinite expansion.
13. Candidate diagnostics are normalized into OAIT-owned source identity.
14. The normalized domain model retains traceability to original source evidence.
15. Source-index technology is replaceable behind OAIT-owned contracts.

---

## 37. Testing Consequences

The source-processing layer requires dedicated deterministic tests.

Required test classes should include:

```text
YAML source locations
JSON source locations
arrays
pointer escaping
duplicate values
comments
whitespace changes
key reordering
multi-file sources
internal references
external references
nested references
recursive references
shared targets
missing files
invalid pointers
filesystem escape attempts
remote-reference policy
diagnostic normalization
```

The SPIKE-002 and SPIKE-003 fixture corpus should be considered a starting point for future production test-data design, but experimental code must not automatically become production implementation.

---

## 38. Decision Consequence for Parser Selection

Parser selection remains open.

Future parser evaluation should no longer ask:

> Can this parser completely own OAIT source provenance?

That responsibility now belongs to OAIT.

Instead, candidate evaluation can focus on areas such as:

* OpenAPI semantic correctness.
* Version support.
* Validation quality.
* Schema behavior.
* Diagnostics.
* API stability.
* TypeScript integration.
* Performance.
* Maintainability.

This reduces inappropriate coupling between parser selection and source-traceability requirements.

---

## 39. Decision Consequence for Repository Design

The source-processing implementation belongs in reusable internal packages rather than directly inside the CLI.

Exact package boundaries are deferred.

Possible future responsibilities may exist within:

```text
packages/parser/
```

or may justify separate cohesive packages if implementation evidence demonstrates a meaningful reusable boundary.

ADR-002's rule remains applicable:

> Do not create new packages merely to mirror conceptual boxes in an architecture diagram.

Package boundaries should be introduced only when implementation responsibilities are sufficiently understood.

---

## 40. Decision Outcome

ADR-004 establishes a stable architectural ownership boundary:

```text
Third-party libraries may interpret OpenAPI.

OAIT owns the evidence describing
where the OpenAPI came from,
where each object was authored,
how references connect source documents,
and which resources were allowed to load.
```

This allows OAIT to change parser or validator technologies later without changing the meaning of source evidence exposed to:

* Rules.
* Reports.
* AI workflows.
* Diff processing.
* Enhancement.
* Contract Guard.
* Release-note generation.

---

## 41. Final Decision

OAIT will implement an independent, pre-transformation source-evidence boundary.

The architecture will:

1. Admit source resources under OAIT-controlled security policy.
2. Preserve original physical source documents.
3. Build structural source-location indexes before transformation.
4. Capture `$ref` declarations and ordered resolution evidence.
5. Treat `documentUri + RFC 6901 pointer` as canonical source identity.
6. Treat line and column as presentation metadata.
7. Keep original and transformed locations distinct.
8. Pass controlled content into third-party OpenAPI tooling.
9. Attach OAIT-owned source evidence to normalized domain entities.
10. Keep parser, validator, and source-index technology choices replaceable behind OAIT-owned interfaces.

---