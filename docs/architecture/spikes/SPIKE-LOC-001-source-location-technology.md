# SPIKE-LOC-001: Evaluate Source-Location Indexing Technology

**Status:** Planned
**Date:** 2026-08-09
**Phase:** Technical Validation
**Target release:** OAIT v0.1
**Predecessors:** `SPIKE-002-reference-resolution.md`, `SPIKE-003-source-location-preservation.md`
**Architecture decision:** `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`
**Related documents:** `ADR-003-normalized-openapi-domain-model.md`, `openapi-domain-model.md`, `system-architecture.md`, `nonfunctional-requirements.md`

---

## 1. Objective

Evaluate source-preserving YAML and JSON parsing technologies or strategies for implementing OAIT's owned source-location index.

The spike must determine which approach can most reliably support:

```text
documentUri
+
canonical RFC 6901 JSON Pointer
+
source range
+
line / column
```

for original OpenAPI source documents before bundling, dereferencing, normalization, or other third-party transformation.

The spike must produce sufficient reproducible evidence to select a production implementation strategy for the source-location layer.

---

## 2. Why This Spike Exists

SPIKE-002 established that third-party OpenAPI bundlers and resolvers transform reference representations and do not preserve complete declaration provenance.

SPIKE-003 established that neither Scalar nor Redocly provides sufficient canonical valid-node source locations through the evaluated documented APIs.

SPIKE-003 also demonstrated that an OAIT-owned source-location index is technically feasible.

ADR-004 therefore establishes the architectural decision:

> OAIT owns source loading, reference evidence, source-location indexing, and source-access policy before third-party OpenAPI transformations.

However, ADR-004 deliberately does not select the technology used to implement that source-location index.

SPIKE-LOC-001 makes that technology decision.

---

## 3. Primary Research Question

> **Which source-preserving YAML/JSON parsing strategy provides the most reliable, maintainable, performant, and portable foundation for OAIT's canonical source-location index?**

---

## 4. Scope

This spike evaluates only technology required to construct structural source evidence from raw YAML and JSON.

It evaluates:

* Structural YAML parsing.
* Structural JSON parsing.
* AST/CST availability.
* Source offsets and ranges.
* Line and column mapping.
* RFC 6901 pointer construction.
* Array indexing.
* Escaped pointer tokens.
* Duplicate keys and duplicate scalar values.
* YAML anchors and aliases.
* YAML comments.
* Flow and block YAML structures.
* Block scalar handling.
* Malformed-input behavior.
* Partial-tree/recovery behavior.
* Strict JSON behavior.
* Multi-file indexing.
* Source immutability.
* Performance.
* Memory use.
* TypeScript integration.
* Cross-platform suitability.
* Dependency footprint.
* API stability.
* Maintenance characteristics.
* License compatibility.

---

## 5. Out of Scope

This spike does **not** evaluate or select:

```text
OpenAPI parser
OpenAPI validator
OpenAPI version adapter
reference resolver
OpenAPI normalizer
rules engine
scoring engine
CLI framework
AI provider
MCP implementation
```

It must not implement production:

```text
SourceLoader
ReferenceResolver
ParserAdapter
NormalizedOpenApiDocument
RuleEngine
CLI
AI
MCP
```

The spike may implement only the minimum experimental indexing logic required to compare candidate strategies.

---

## 6. Architectural Boundary Under Test

The target architecture is:

```text
Raw YAML / JSON
       ↓
Source-preserving parser
       ↓
Source-location index
       ↓
documentUri + pointer → range
       ↓
Reference evidence
       ↓
Controlled OpenAPI processing
       ↓
Parser / Bundler / Validator
       ↓
Normalizer
```

SPIKE-LOC-001 evaluates only:

```text
Raw YAML / JSON
       ↓
Source-preserving parser
       ↓
Source-location index
```

---

## 7. Required Output Capability

The selected strategy must make an abstraction similar to the following practical:

```typescript
interface SourceLocation {
  documentUri: string;
  filePath?: string;
  pointer: string;
  offset?: number;
  length?: number;
  line?: number;
  column?: number;
}
```

and conceptually:

```typescript
interface SourceLocationIndex {
  locate(
    documentUri: string,
    pointer: string
  ): SourceLocation | undefined;
}
```

These are experimental shapes only.

SPIKE-LOC-001 does not finalize the production TypeScript interfaces.

---

# 8. Candidate Strategies

Evaluate the following strategies independently.

---

## 8.1 Strategy A — `yaml` for YAML and JSON

Use the `yaml` package as the structural parser for both YAML and JSON source.

This strategy explores whether one source-preserving parsing technology can support both accepted serialization formats.

The experiment must determine whether this provides sufficient fidelity for strict JSON input in addition to YAML.

The exact package version must be pinned and recorded.

SPIKE-003 used:

```text
yaml@2.8.3
```

as an isolated feasibility proof.

That version may serve as the baseline unless the experiment documents a justified version change.

A newer package version must not be adopted silently.

---

## 8.2 Strategy B — `yaml` for YAML + `jsonc-parser` for JSON

Use format-specific source parsers:

```text
YAML
  ↓
yaml

JSON
  ↓
jsonc-parser
```

This strategy tests whether using a dedicated JSON structural parser improves:

* JSON correctness.
* Error recovery.
* Position information.
* JSON-path traversal.
* performance.
* implementation clarity.

OAIT would expose the same owned source-location abstraction above both technologies.

The exact package versions must be pinned and recorded before execution.

---

## 8.3 Strategy C — Tree-sitter for YAML + JSON

Evaluate a Tree-sitter-based structural parsing strategy using suitable YAML and JSON grammars.

Conceptually:

```text
YAML
  ↓
Tree-sitter YAML grammar

JSON
  ↓
Tree-sitter JSON grammar
```

This strategy represents the more general CST-oriented alternative.

The experiment must evaluate both technical capability and operational cost, including:

* Node.js bindings.
* Native/prebuilt dependency behavior.
* Grammar compatibility.
* installation complexity.
* cross-platform portability.
* TypeScript integration.

Do not assume the latest Tree-sitter runtime and grammar versions are mutually compatible.

Before installation, record compatible exact versions based on published package metadata.

If a compatible documented combination cannot be established, record that as evidence rather than forcing an unsupported combination.

---

# 9. Candidate Version Policy

Every candidate must be installed using exact versions.

The result must record:

```text
package
exact version
license
installation source
runtime requirements
direct dependencies
native dependencies
```

Do not use floating versions in the final experiment evidence.

Example:

```json
{
  "package": "yaml",
  "version": "x.y.z"
}
```

The experiment must retain its `package-lock.json`.

---

# 10. Experimental Directory

Create:

```text
experiments/
└── source-location-technology-spike/
    └── spike-loc-001/
        ├── fixtures/
        │   ├── yaml/
        │   ├── json/
        │   ├── yaml-features/
        │   ├── malformed/
        │   ├── duplicates/
        │   ├── unicode/
        │   ├── line-endings/
        │   └── generated/
        │
        ├── strategy-a/
        │   └── index.ts
        │
        ├── strategy-b/
        │   └── index.ts
        │
        ├── strategy-c/
        │   └── index.ts
        │
        ├── shared/
        ├── benchmarks/
        ├── results/
        │   ├── strategy-a.json
        │   ├── strategy-b.json
        │   └── strategy-c.json
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        └── README.md
```

Do not place experimental implementation under production `packages/`.

---

# 11. Reuse SPIKE-003 Fixtures

Reuse or copy the conceptual test coverage from SPIKE-003 for:

* YAML locations.
* JSON locations.
* Arrays.
* Pointer escaping.
* Duplicate scalar values.
* Whitespace changes.
* Comments.
* Key reordering.
* Multi-file documents.
* `$ref` declaration locations.

Where practical, copy fixtures into the new spike directory so the experiment remains independently reproducible.

Do not modify the original SPIKE-003 evidence.

---

# 12. Fixture A — Basic YAML Structure

Create a representative OpenAPI YAML source containing:

```text
root document
info
tags
path items
operations
parameters
request body
responses
schemas
schema properties
security schemes
$ref declarations
```

Manually establish expected pointers and source positions before candidate execution.

Test at least 20 structural locations.

Examples:

```text
/info

/paths/~1pets/get

/paths/~1pets~1{petId}/get/parameters/0

/components/schemas/Pet

/components/schemas/Pet/properties/id
```

---

# 13. Fixture B — Equivalent JSON Structure

Create a logically equivalent strict JSON document.

Expected:

```text
same logical RFC 6901 pointers
different physical offsets
different line/column positions
```

The strategy must not depend on YAML-specific assumptions when processing JSON.

---

# 14. Fixture C — Arrays

Test multiple array elements.

Example:

```yaml
parameters:
  - name: first
  - name: second
  - name: third
```

Expected pointers:

```text
/parameters/0
/parameters/1
/parameters/2
```

The implementation must derive array indices structurally.

---

# 15. Fixture D — Pointer Escaping

Test mapping keys containing:

```text
/
~
```

Expected RFC 6901 transformations:

```text
/ → ~1
~ → ~0
```

Example path:

```text
/pets/{petId}
```

Expected pointer segment:

```text
~1pets~1{petId}
```

Also include a schema property such as:

```text
a/b~c
```

Expected:

```text
a~1b~0c
```

---

# 16. Fixture E — Duplicate Scalar Values

Create the same scalar value in several unrelated locations.

Example:

```yaml
description: Identifier
```

appearing at least five times.

Each occurrence must resolve to a different structural pointer and source range.

Any implementation based on searching source text for scalar values automatically fails this test.

---

# 17. Fixture F — Duplicate Mapping Keys

Create controlled YAML and JSON fixtures containing duplicate property names.

Determine:

* Whether duplicate keys are detected.
* Whether the parser retains both physical occurrences.
* Whether a partial structural index can still be produced.
* Whether the final occurrence silently replaces the earlier occurrence.
* How OAIT could report the duplicate locations.

This experiment must distinguish:

```text
source representation
```

from:

```text
evaluated JavaScript object
```

A source-location technology that loses duplicate declarations before indexing is problematic.

---

# 18. Fixture G — YAML Anchors and Aliases

Create:

```yaml
commonParameter: &commonParameter
  name: tenantId
  in: header

paths:
  /pets:
    get:
      parameters:
        - *commonParameter
```

Determine:

* Anchor node location.
* Alias occurrence location.
* Whether the alias remains structurally identifiable.
* Whether conversion to JavaScript expands or loses source identity.
* Whether pointer construction remains deterministic.

The source index must reflect what is physically authored.

Do not resolve YAML aliases into OAIT reference provenance.

YAML aliases and OpenAPI `$ref` are separate mechanisms.

---

# 19. Fixture H — YAML Flow Collections

Test YAML structures such as:

```yaml
schema: { type: object, properties: { id: { type: string } } }
```

and:

```yaml
required: [id, name]
```

Verify:

* Pointer construction.
* Offset/range accuracy.
* line/column accuracy.

---

# 20. Fixture I — Block Scalars

Test:

```yaml
description: |
  First line.
  Second line.
```

and folded scalars.

Determine:

* key location.
* scalar range.
* source range.
* resulting line/column.
* whether multiline contents interfere with following-node positions.

---

# 21. Fixture J — Comments and Whitespace

Create logically equivalent YAML files containing:

* No comments.
* Many comments.
* Blank lines.
* Different indentation where semantically valid.

Expected:

```text
pointer unchanged
logical location unchanged
offset changed
line/column changed
```

---

# 22. Fixture K — Key Reordering

Reorder unrelated mapping keys.

Expected:

```text
pointer unchanged
source position changed
```

This validates the separation between structural identity and presentation location.

---

# 23. Fixture L — Quoted and Special Keys

Test keys using:

```yaml
"/pets/{petId}":
"~special/key":
'quoted key':
```

Ensure pointer creation depends on parsed key value rather than source quoting style.

---

# 24. Fixture M — Unicode

Include:

```text
ASCII
Japanese
accented Latin text
emoji
non-BMP Unicode characters
```

Determine how each candidate defines:

```text
offset
length
column
```

Record whether positions are based on:

```text
bytes
UTF-16 code units
Unicode code points
```

OAIT must understand this distinction before exposing source positions.

---

# 25. Fixture N — Line Endings

Create equivalent fixtures using:

```text
LF
CRLF
```

Determine whether:

* pointers remain identical.
* offsets remain internally consistent.
* line/column values remain correct.

Do not assume all users author OpenAPI on Unix-style systems.

---

# 26. Fixture O — UTF-8 BOM

Where supported, test source containing a UTF-8 BOM.

Record whether the candidate:

* accepts it.
* includes it in offsets.
* strips it.
* changes position accounting.

---

# 27. Fixture P — Malformed YAML

Create malformed examples including:

* Invalid indentation.
* Unterminated quotes.
* Broken flow collection.
* Invalid mapping structure.

For each candidate determine:

```text
Does parsing throw?
Is a partial tree available?
Are errors structured?
Is an offset available?
Is line/column available?
Can unaffected nodes still be indexed?
```

Do not parse human-readable error messages to fabricate structured locations.

---

# 28. Fixture Q — Malformed JSON

Create:

```text
missing comma
missing closing brace
unterminated string
invalid literal
trailing comma
comment
```

Since OAIT accepts JSON rather than JSONC, test whether strict JSON behavior can be enforced.

For each invalid form record:

```text
diagnostic
partial tree
offset
line
column
index usability
```

---

# 29. Fixture R — YAML Multi-Document Stream

OpenAPI entry input is expected to represent a single OpenAPI document.

Test YAML containing multiple documents:

```yaml
---
openapi: 3.1.0
---
openapi: 3.1.0
```

Determine:

* whether the candidate detects multiple documents.
* whether OAIT can reject the input clearly.
* whether source positions remain available for diagnostics.

---

# 30. Source Anchor Convention

SPIKE-003 used source key tokens as human-readable anchors.

SPIKE-LOC-001 must explicitly evaluate and recommend the location convention for:

```text
mapping object
mapping property
array item
scalar
$ref declaration
```

Possible choices include:

```text
key start
value start
node start
full node range
```

The recommendation must be consistent across YAML and JSON.

The spike should determine whether OAIT should store both:

```text
range
```

and:

```text
presentation anchor
```

rather than forcing one offset to serve both purposes.

---

# 31. Structural Index Construction

Each strategy must independently attempt to produce the same OAIT-neutral result.

Example:

```json
{
  "pointer": "/paths/~1pets/get",
  "offset": 120,
  "length": 240,
  "line": 12,
  "column": 3
}
```

Candidate-specific node objects must not appear in the machine-readable comparison result.

This isolates technology-specific APIs behind the experimental adapter.

---

# 32. Required Index Invariants

For valid source, each strategy must demonstrate:

1. Root can be indexed.
2. Mapping values can be indexed.
3. Array items can be indexed.
4. Pointers use RFC 6901 escaping.
5. Duplicate scalar values remain distinguishable.
6. Source ranges refer to the original input.
7. Input text remains unchanged.
8. Line/column can be calculated consistently.
9. YAML and JSON expose equivalent logical pointers.
10. Candidate-specific types can be adapted to an OAIT-owned representation.

---

# 33. Malformed-Input Evaluation

Do not evaluate malformed parsing only as:

```text
PASS / FAIL
```

Classify recovery:

```text
FULL_RECOVERY
PARTIAL_RECOVERY
DIAGNOSTIC_ONLY
THROWS_WITH_STRUCTURE
THROWS_MESSAGE_ONLY
UNUSABLE
```

Record which valid sibling nodes remain indexable after an error.

This matters because OAIT should provide useful diagnostics even when an OpenAPI file is malformed.

---

# 34. YAML Feature Evaluation

Evaluate how each relevant strategy handles:

```text
anchors
aliases
comments
flow collections
block collections
block scalars
quoted keys
duplicate keys
explicit tags
directives where practical
```

The purpose is not to implement every YAML feature in OAIT.

The purpose is to ensure the source-index technology does not silently destroy structural evidence.

---

# 35. JSON Strictness

OAIT accepts JSON, not arbitrary JSONC.

A JSON strategy must demonstrate a configuration or validation mode that distinguishes standard JSON from extensions such as:

```text
comments
trailing commas
```

If the parser is intentionally fault-tolerant, that is acceptable only if errors remain available so OAIT can reject invalid JSON while still using the partial tree for diagnostics.

---

# 36. Pointer Construction Ownership

Do not use candidate-specific path strings as OAIT's canonical pointers unless they are proven structurally equivalent to RFC 6901.

Preferred experiment pattern:

```text
candidate structural tree
        ↓
OAIT experimental tree walk
        ↓
string/number segments
        ↓
OAIT RFC 6901 encoder
        ↓
canonical pointer
```

OAIT should own JSON Pointer serialization.

---

# 37. Performance Test

Performance results are directional evidence, not final production SLA certification.

Generate deterministic synthetic OpenAPI-like documents representing approximately:

```text
500 operations
2,000 operations
10,000 operations
```

Test separately for YAML and JSON.

Do not commit unnecessarily huge generated fixtures if they can be generated deterministically.

Record:

```text
parse time
index construction time
total time
peak or observed memory where practical
number of indexed entries
input size
```

Run each benchmark multiple times after a warm-up.

Report:

```text
median
p95 where enough samples exist
```

or clearly document the chosen statistical method.

---

# 38. Performance Separation

Measure separately:

```text
parse
```

and:

```text
index construction
```

This distinction is important.

A slow OAIT traversal should not be incorrectly attributed to the candidate parser.

Similarly, a fast tree walk must not hide expensive parsing.

---

# 39. Memory Evaluation

Measure memory where practical for:

```text
source text
parsed tree
location index
combined working set
```

Absolute measurement may be approximate in Node.js.

Use the same methodology for all candidates.

Record methodology and limitations.

---

# 40. Cross-Platform Evaluation

OAIT targets a cross-platform Node.js CLI.

The candidate strategy must be evaluated for compatibility with at least:

```text
macOS arm64
Linux CI
Windows feasibility
```

The spike does not require access to every operating system if unavailable.

However, it must identify:

* native binary requirements.
* prebuild availability.
* node-gyp requirements.
* Wasm alternatives if applicable.
* architecture-specific installation risks.

A pure JavaScript solution and a native binding must not be treated as operationally equivalent.

---

# 41. Node.js and TypeScript Integration

Record for each strategy:

```text
ESM support
TypeScript declarations
NodeNext compatibility
skipLibCheck requirement
native build requirement
async/sync API
candidate-specific type leakage risk
```

The experiment should use the same TypeScript compiler configuration where possible.

---

# 42. Dependency Evaluation

Record:

```text
direct dependency count
transitive dependency count
native dependencies
install scripts
package-lock size
```

Do not reject a candidate merely because it has dependencies.

The purpose is to understand operational and supply-chain cost.

---

# 43. Maintenance and API Stability

Record evidence for:

```text
repository activity
release recency
documented API stability
issue activity
maintainer ownership
deprecation signals
```

Do not convert popularity alone into a selection criterion.

A highly downloaded package may still have an unsuitable source-location API.

---

# 44. License Evaluation

All production dependencies must be suitable for the Apache-2.0 licensed OAIT project.

Record the license of each direct candidate dependency.

If a candidate introduces a license concern, mark it:

```text
LICENSE_REVIEW_REQUIRED
```

Do not make an unsupported legal conclusion.

---

# 45. Security Evaluation

This spike does not evaluate `$ref` network security.

However, source parsers operate on untrusted input.

Record:

* Whether parsing executes arbitrary code.
* Whether tags or custom constructors can trigger behavior.
* Whether candidate configuration can remain data-only.
* Known parsing modes that should be avoided.
* Whether native binaries expand the supply-chain surface.

Do not enable custom executable YAML tags.

---

# 46. Source Mutation Check

For every persisted fixture:

```text
SHA-256 before
SHA-256 after
```

must match.

Parsing/indexing must not modify experimental fixtures.

---

# 47. Result Status Vocabulary

Use:

```text
PASS
PARTIAL
FAIL
NOT_SUPPORTED
NOT_APPLICABLE
```

Definitions:

### PASS

Requirement is satisfied using documented/public APIs.

### PARTIAL

Capability exists but requires OAIT adaptation, has meaningful limitations, or does not cover all cases.

### FAIL

Candidate claims or attempts the capability but produces incorrect/unreliable evidence.

### NOT_SUPPORTED

Required capability is unavailable through the evaluated supported API.

### NOT_APPLICABLE

Capability does not apply to the candidate strategy.

---

# 48. Required Comparison Matrix

The final README must include at least:

| Capability                    | Strategy A | Strategy B | Strategy C |
| ----------------------------- | ---------- | ---------- | ---------- |
| YAML exact ranges             |            |            |            |
| JSON exact ranges             |            |            |            |
| YAML line/column              |            |            |            |
| JSON line/column              |            |            |            |
| RFC 6901 pointer construction |            |            |            |
| Arrays                        |            |            |            |
| Escaped keys                  |            |            |            |
| Duplicate scalar values       |            |            |            |
| Duplicate mapping keys        |            |            |            |
| YAML anchors                  |            |            |            |
| YAML aliases                  |            |            |            |
| Comments                      |            |            |            |
| Flow collections              |            |            |            |
| Block scalars                 |            |            |            |
| Unicode positions             |            |            |            |
| CRLF                          |            |            |            |
| BOM                           |            |            |            |
| Malformed YAML recovery       |            |            |            |
| Malformed JSON recovery       |            |            |            |
| Strict JSON enforcement       |            |            |            |
| Multi-document YAML detection |            |            |            |
| Source immutability           |            |            |            |
| TypeScript integration        |            |            |            |
| ESM / NodeNext                |            |            |            |
| Cross-platform suitability    |            |            |            |
| Native dependency required    |            |            |            |
| Public APIs only              |            |            |            |

---

# 49. Evidence Classification

For key fields, classify implementation source as:

```text
NATIVE
DERIVABLE
OAIT_OWNED
NOT_AVAILABLE
```

Example:

```json
{
  "pointer": "OAIT_OWNED",
  "offset": "NATIVE",
  "line": "DERIVABLE",
  "column": "DERIVABLE"
}
```

This distinction is important.

OAIT does not require every field to be supplied directly by the library.

It requires each field to be reliably constructible from supported public APIs.

---

# 50. Weighted Decision Matrix

Score each strategy from:

```text
1 = poor
2 = weak
3 = acceptable
4 = strong
5 = excellent
```

Use the following weights.

| Criterion                               |  Weight |
| --------------------------------------- | ------: |
| Source fidelity and exact ranges        |      20 |
| Malformed-input recovery                |      15 |
| YAML feature correctness                |      15 |
| JSON fidelity and strictness            |      10 |
| Pointer/index construction suitability  |      10 |
| Performance and memory                  |      10 |
| TypeScript/Node integration             |       5 |
| Cross-platform operational simplicity   |       5 |
| API stability and maintainability       |       5 |
| License/security/dependency suitability |       5 |
| **Total**                               | **100** |

Weighted result:

```text
Σ(score × weight)
-----------------
maximum possible
```

Normalize to 100 if useful.

The numeric score must not override a failed mandatory gate.

---

# 51. Mandatory Gates

A strategy cannot be recommended as the primary production foundation if it fails any mandatory gate.

Mandatory gates:

1. YAML structural indexing is feasible.
2. JSON structural indexing is feasible.
3. Original source offsets/ranges are reliable.
4. Canonical RFC 6901 pointers can be constructed.
5. Arrays are indexed correctly.
6. `/` and `~` pointer escaping works.
7. Duplicate scalar values are structurally distinguishable.
8. Original source remains immutable.
9. Candidate APIs used are documented/public.
10. Candidate-specific tree types can be isolated behind OAIT-owned interfaces.
11. Package license is compatible with OAIT's intended open-source distribution, or no unresolved license blocker exists.
12. Installation is feasible for the Node.js CLI architecture.

Malformed recovery is extremely important but may be evaluated as a comparative criterion rather than requiring complete recovery from every malformed input.

---

# 52. Strategy A Questions

For `yaml` handling both YAML and JSON, answer:

1. Does parsing strict JSON through the YAML parser preserve correct source ranges?
2. Can JSON-specific invalid syntax be reliably rejected?
3. Are YAML semantics accidentally applied in ways inappropriate for `.json` input?
4. Can one walker construct identical logical pointers for YAML and JSON?
5. Does one-library operational simplicity outweigh format-specific correctness concerns?

---

# 53. Strategy B Questions

For `yaml` + `jsonc-parser`, answer:

1. Does the dedicated JSON tree make JSON location handling simpler?
2. Are JSON paths straightforward to translate into RFC 6901?
3. Can strict JSON be enforced while retaining fault-tolerant diagnostics?
4. How much duplicated adapter logic is required across the two parser technologies?
5. Is the additional dependency justified by correctness or maintainability benefits?

---

# 54. Strategy C Questions

For Tree-sitter, answer:

1. Are YAML and JSON trees sufficiently semantic for deterministic pointer construction?
2. How difficult is mapping grammar nodes into key/value and array semantics?
3. How strong is malformed-source recovery?
4. Are byte-based positions straightforward to normalize for OAIT reporting?
5. Does native/prebuilt installation introduce unacceptable complexity?
6. Do runtime/grammar compatibility constraints create maintenance risk?
7. Is Tree-sitter's generality useful enough to justify the additional operational complexity?

---

# 55. Do Not Optimize for AST Convenience Alone

Selection must not be based only on:

```text
which API looks nicest
```

The selected source parser becomes part of a foundational evidence system.

Accuracy and reproducibility are more important than minimizing a small amount of adapter code.

---

# 56. Candidate-Neutral Experimental API

Where practical, implement a very small common experimental contract.

Example:

```typescript
interface ExperimentalIndexEntry {
  pointer: string;
  offset: number;
  length?: number;
  line: number;
  column: number;
}

interface ExperimentalSourceIndexer {
  index(
    source: string,
    format: "yaml" | "json"
  ): {
    entries: ExperimentalIndexEntry[];
    diagnostics: unknown[];
  };
}
```

This contract exists only to normalize experiment comparison.

Do not promote it directly into production.

---

# 57. Correctness Verification

Expected locations must not be generated by the candidate being tested.

Use:

```text
manually established expected locations
+
independent fixture assertions
```

For larger generated fixtures, correctness may be established algorithmically where the generator controls exact structure.

---

# 58. Reproducibility

The experiment must record:

```text
date
OS
architecture
Node version
npm version
TypeScript version
package versions
module mode
commands
fixture hashes
result hashes
benchmark methodology
```

The README must provide a clean reproduction command such as:

```bash
npm ci
npm run run
```

if practical.

---

# 59. Machine-Readable Results

Each strategy result file must include at least:

```json
{
  "environment": {},
  "dependencies": {},
  "capabilities": {},
  "fixtures": [],
  "diagnostics": [],
  "performance": {},
  "memory": {},
  "operationalCharacteristics": {},
  "resultHash": ""
}
```

Do not store candidate-specific cyclic AST/CST objects directly in result JSON.

---

# 60. Unexpected Behavior

Maintain a dedicated section in the README for observations such as:

```text
runtime/type mismatch
unexpected parser recovery
range inconsistency
Unicode position anomaly
native installation problem
grammar incompatibility
duplicate-key loss
silent normalization
```

Unexpected behavior is evidence and must not be hidden merely because the main test passes.

---

# 61. Required Final README

The final README must contain:

1. Objective.
2. Exact environment.
3. Exact dependency versions.
4. Candidate strategy definitions.
5. Commands executed.
6. Fixture inventory.
7. Complete result matrix.
8. Malformed-input comparison.
9. YAML-feature comparison.
10. JSON comparison.
11. Unicode/position findings.
12. Performance results.
13. Memory findings.
14. Cross-platform/dependency findings.
15. License information.
16. Unexpected behavior.
17. Limitations.
18. Weighted decision matrix.
19. Mandatory-gate results.
20. Architecture implications.
21. Production recommendation.
22. Follow-up actions.

---

# 62. Possible Outcomes

The spike may conclude:

### Outcome A — Single parser strategy

One source-preserving technology is suitable for both YAML and JSON.

Conceptually:

```text
YAML ─┐
      ├→ one source index technology
JSON ─┘
```

---

### Outcome B — Format-specific parser strategy

Separate technologies are preferred:

```text
YAML → YAML source parser ─┐
                           ├→ OAIT SourceLocationIndex
JSON → JSON source parser ─┘
```

---

### Outcome C — Tree-sitter strategy

Tree-sitter provides sufficiently strong correctness/recovery benefits to justify its operational complexity.

---

### Outcome D — Hybrid or additional evaluation required

None of the tested strategies satisfies OAIT requirements.

A further candidate must be evaluated.

This is an acceptable result if supported by evidence.

---

# 63. Production Recommendation Requirements

A production recommendation must state:

```text
recommended strategy
exact evaluated versions
why it won
mandatory gates
weighted score
known limitations
operational risks
upgrade considerations
```

If Strategy B wins, specify both YAML and JSON technologies.

Do not select a technology merely because it performed well in SPIKE-003.

---

# 64. ADR Requirement After the Spike

Do not modify ADR-004 to contain library-specific implementation details.

ADR-004 records architectural ownership.

If SPIKE-LOC-001 results in a durable technology choice with significant replacement cost, create a separate technology ADR after the spike.

Conceptually:

```text
ADR-004
OAIT owns source evidence
        ↓
SPIKE-LOC-001
technology evidence
        ↓
future technology ADR
select source-index parsing strategy
```

Assign the ADR number only when the technology decision is accepted.

---

# 65. Detailed Design Timing

Do not create the full production source-processing design before this spike finishes.

After technology selection, develop the detailed design for:

```text
SourcePolicy
SourceLoader
SourceDocumentRegistry
SourceLocationIndex
ReferenceEvidenceCollector
ReferenceGraph
DiagnosticLocationAdapter
```

The selected technology will materially affect those interfaces and implementation constraints.

---

# 66. Exit Criteria

SPIKE-LOC-001 is complete when OAIT can answer:

> **Which source-preserving YAML/JSON parsing strategy should implement OAIT's source-location index, and what evidence demonstrates that it can reliably produce canonical original-source locations under realistic and malformed inputs?**

Completion requires:

* All feasible candidate experiments executed.
* Mandatory gates evaluated.
* Weighted matrix completed.
* Benchmark evidence recorded.
* Exact dependency versions recorded.
* Reproducible result files produced.
* Candidate limitations documented.
* A production technology recommendation or explicit no-selection outcome.

---

# 67. Decision Rule

Recommend a strategy only if:

```text
all mandatory gates pass
+
source fidelity is reliable
+
operational risks are acceptable
+
weighted evidence supports the choice
```

A lower weighted score may still win if another candidate fails a mandatory architectural requirement.

All exceptions must be explicitly justified.

---