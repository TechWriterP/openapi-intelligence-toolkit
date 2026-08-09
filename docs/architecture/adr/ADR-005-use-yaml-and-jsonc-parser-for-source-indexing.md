# ADR-005: Use `yaml` and `jsonc-parser` for Source Indexing

**Status:** Accepted  
**Date:** 2026-08-09  
**Decision owners:** OAIT Architecture  
**Applies to:** OAIT v0.1 and later  
**Related documents:** `ADR-004-own-source-loading-reference-evidence-and-location-indexing.md`, `ADR-003-normalized-openapi-domain-model.md`, `SPIKE-LOC-001-source-location-technology.md`, `openapi-domain-model.md`, `system-architecture.md`

---

## 1. Context

ADR-004 established that the OpenAPI Intelligence Toolkit (OAIT) owns the source-evidence boundary before third-party OpenAPI transformations.

OAIT is responsible for source document identity, source-location indexing, RFC 6901 JSON Pointer construction, `$ref` declaration evidence, original source ranges, presentation line and column, filesystem and network source policy, and original-versus-transformed source distinction.

ADR-004 deliberately did not select the YAML or JSON technology used to build the source-location index.

SPIKE-LOC-001 therefore evaluated three source-preserving parsing strategies:

```text
Strategy A
YAML → yaml
JSON → yaml

Strategy B
YAML → yaml
JSON → jsonc-parser

Strategy C
YAML → Tree-sitter YAML
JSON → Tree-sitter JSON
```

The spike evaluated source fidelity, malformed-input recovery, YAML features, JSON strictness, RFC 6901 pointer construction, performance, memory, TypeScript integration, portability, dependency characteristics, and operational complexity.

---

## 2. Problem

OAIT requires source-preserving parsers that can expose enough structural evidence to construct a canonical source-location index.

The selected technologies must support OAIT in reliably determining:

```text
documentUri
+
RFC 6901 JSON Pointer
+
original source range
+
presentation line / column
```

without requiring downstream components to depend on parser-specific AST or CST types.

The architecture therefore needs to answer:

> **Which YAML and JSON source-preserving parsing technologies should OAIT use beneath its owned source-location abstraction?**

---

## 3. Decision

OAIT will use:

```text
yaml
```

for YAML source parsing and:

```text
jsonc-parser
```

for JSON source parsing.

The initial technology baseline established by SPIKE-LOC-001 is:

```text
yaml@2.8.3
jsonc-parser@3.3.1
```

These libraries will operate behind OAIT-owned source-processing interfaces.

Their AST/tree types, diagnostic types, offsets, and internal structural representations must not become part of the OAIT domain model or public interfaces.

---

## 4. Decision Statement

> **Use `yaml` for YAML source indexing and `jsonc-parser` for JSON source indexing, while retaining OAIT ownership of source identity, RFC 6901 pointer construction, occurrence handling, ranges, presentation coordinates, and diagnostic normalization.**

---

## 5. Evidence from SPIKE-LOC-001

SPIKE-LOC-001 produced the following weighted results:

| Strategy | Score |
| --- | ---: |
| Strategy A — `yaml` for YAML and JSON | 91/100 |
| Strategy B — `yaml` + `jsonc-parser` | **97/100** |
| Strategy C — Tree-sitter YAML + JSON | 83/100 |

All three strategies passed the 12 mandatory gates defined by the spike.

Strategy B achieved the strongest overall result and was recommended as the source-location technology foundation.

---

## 6. Why Strategy B Was Selected

Strategy B provides the strongest combination of:

- Exact source ranges.
- Structural source traversal.
- YAML feature support.
- Strict JSON enforcement.
- Structured JSON diagnostics.
- RFC 6901 pointer feasibility.
- TypeScript integration.
- Performance.
- Pure-JavaScript deployment.
- Cross-platform operational simplicity.
- Candidate isolation behind OAIT-owned interfaces.

The decision is based on the combined evidence rather than any single benchmark or API convenience.

---

## 7. YAML Technology

OAIT will use:

```text
yaml@2.8.3
```

as the initial YAML source-parsing baseline.

The evaluated public APIs include:

```text
parseDocument
parseAllDocuments
LineCounter
node.range
public node guards
```

These capabilities were sufficient to support source indexing for the evaluated YAML fixtures, including mappings, sequences, arrays, flow collections, block collections, block scalars, quoted keys, comments, anchors, aliases, duplicate keys, Unicode, CRLF/LF, UTF-8 BOM, multi-document detection, and malformed-input diagnostics with partial recovery.

---

## 8. JSON Technology

OAIT will use:

```text
jsonc-parser@3.3.1
```

as the initial JSON source-parsing baseline.

The evaluated public capabilities include:

```text
parseTree
tree nodes
offset
length
structured parse errors
```

OAIT will configure JSON parsing so that standard JSON rules remain authoritative.

At minimum:

```text
comments → invalid
trailing commas → invalid
empty JSON input → invalid
```

Fault-tolerant parsing may still be used to recover structural evidence for diagnostics. Fault tolerance must not cause invalid JSON to be accepted as valid OpenAPI input.

---

## 9. Why a Dedicated JSON Parser Is Preferred

Strategy A demonstrated that `yaml` can structurally parse JSON because JSON is compatible with YAML syntax in many cases.

However, the YAML parser also accepted several inputs that are invalid JSON, including missing commas, invalid literals, trailing commas, and comments.

Strategy A therefore required an independent strict JSON validation step.

Using `jsonc-parser` provides a cleaner architecture:

```text
JSON syntax
   ↓
JSON-native parser
   ↓
structured JSON diagnostics
   ↓
OAIT source index
```

rather than:

```text
JSON syntax
   ↓
YAML parser
   +
separate JSON validation
```

The format-specific parser boundary is therefore preferable to forcing both formats through one parser.

---

## 10. Strict JSON Is an OAIT Requirement

SPIKE-LOC-001's original mandatory-gate list did not explicitly include strict JSON enforcement.

All three strategies therefore technically passed the defined mandatory gates.

However, strict JSON handling is an architectural requirement for OAIT because a `.json` OpenAPI description must conform to JSON rather than JSONC or a more permissive grammar.

This decision does not reinterpret the spike result.

Instead:

```text
Tree-sitter passed the defined mandatory gates
```

while:

```text
Tree-sitter failed the additional strict-JSON requirement
for use as OAIT's complete JSON source parser
```

---

## 11. Why Tree-sitter Was Not Selected

Strategy C produced useful source-preservation and malformed-input recovery capabilities and performed particularly well for the largest YAML benchmark.

However, several disadvantages outweighed those benefits:

- The evaluated JSON grammar did not report errors for a JSON comment fixture and one missing-closing-brace fixture.
- Native Node bindings, `node-gyp-build`, prebuilt binary selection, and grammar/runtime compatibility add operational complexity.
- Compatible runtime and grammar versions required deliberate coordination.
- The evaluated runtime rejected direct string input at approximately 32 KiB; documented callback input worked, but the anomaly adds complexity.
- Tree-sitter exposes UTF-8 byte offsets and byte-based columns, requiring additional position normalization.

For these reasons, Tree-sitter's stronger recovery characteristics did not justify its additional complexity for the v0.1 source-location layer.

---

## 12. Why Strategy A Was Not Selected

Strategy A remains technically viable. It passed the mandatory gates, used one source-parsing dependency, preserved exact source ranges, supported YAML and JSON structural indexing, and remained pure JavaScript.

It was not selected because:

1. YAML parsing alone does not enforce strict JSON.
2. Separate strict JSON validation would be required.
3. JSON diagnostics would come from a different path than structural parsing.
4. JSON performance was significantly weaker than Strategy B in the experiment.

Strategy A therefore remains a possible fallback, not the preferred implementation.

---

## 13. Performance Evidence

At approximately 10,000 operations, median JSON totals were:

```text
Strategy A    ~845 ms
Strategy B     ~55 ms
Strategy C    ~592 ms
```

Strategy B was approximately 15× faster than Strategy A and 11× faster than Strategy C for the largest evaluated JSON workload.

Tree-sitter was faster for the largest YAML workload, but performance alone did not determine the decision.

The benchmark results are directional single-machine evidence and are not production SLA guarantees.

---

## 14. Source Pointer Ownership

Neither `yaml` nor `jsonc-parser` will define OAIT's canonical source pointers.

The intended flow is:

```text
Candidate structural tree
          ↓
OAIT structural traversal
          ↓
string / numeric path segments
          ↓
OAIT RFC 6901 encoder
          ↓
canonical JSON Pointer
```

OAIT owns escaping rules:

```text
~ → ~0
/ → ~1
```

This maintains parser independence.

---

## 15. Candidate Types Must Not Leak

Parser-specific types must remain inside infrastructure adapters.

The OAIT domain model and higher-level components must not depend on YAML AST node types, `jsonc-parser` node types, or parser-specific diagnostics.

Instead:

```text
yaml tree ──────────┐
                    ↓
              YAML adapter
                    ↓
             OAIT source model

jsonc-parser tree ──┐
                    ↓
              JSON adapter
                    ↓
             OAIT source model
```

Downstream components consume only OAIT-owned contracts.

---

## 16. Offset Semantics

SPIKE-LOC-001 showed that both selected technologies expose source offsets compatible with JavaScript UTF-16 code-unit indexing.

The production design must still explicitly define offset semantics.

OAIT should distinguish native source range from presentation line/column rather than assuming they represent the same coordinate system.

---

## 17. Presentation Coordinates

The production design should use:

```text
1-based line
1-based column
```

for user-facing source positions.

The detailed source-processing design must formalize native offset semantics, line calculation, column calculation, Unicode handling, non-BMP handling, and CRLF behavior.

The parser libraries must not independently define OAIT's user-facing location contract.

---

## 18. Source Range and Presentation Anchor

OAIT should retain both a full source range and a presentation anchor where useful.

SPIKE-LOC-001 recommended anchors such as:

- Mapping property → key start.
- `$ref` declaration → key start.
- Array item → value/node start.
- Root → node start.

The precise production model belongs to detailed design.

---

## 19. Duplicate-Key Consequence

SPIKE-LOC-001 identified an important limitation of canonical JSON Pointer identity.

Given invalid source such as:

```yaml
Pet:
  type: string

Pet:
  type: object
```

both declarations structurally correspond to the same pointer.

Therefore:

```text
documentUri + pointer
```

remains the canonical logical structural location, but is insufficient to uniquely identify every physical occurrence in malformed or duplicate-key source.

OAIT must therefore support an occurrence-aware physical source representation, conceptually:

```text
documentUri
+
pointer
+
physical occurrence/range
```

The exact production contract is deferred to detailed design.

---

## 20. Duplicate Keys Are Not Parser Identity

The selected parsers expose enough physical information to distinguish duplicate declarations by source range.

YAML reports duplicate keys through its diagnostics. `jsonc-parser` preserves duplicate occurrences but does not itself provide the complete OAIT semantic duplicate model.

OAIT therefore owns duplicate-occurrence identity and reporting.

The parser technology provides evidence; OAIT assigns meaning.

---

## 21. YAML Anchors and Aliases

YAML anchors and aliases remain physical YAML syntax concepts and must not be confused with OpenAPI `$ref`.

OAIT source indexing should preserve the physical locations of anchor declarations and alias occurrences where useful, while keeping YAML alias evidence separate from OpenAPI reference provenance.

---

## 22. Malformed Input

Both selected technologies provide partial malformed-input recovery.

The production design must not assume that a complete source tree is always available after a syntax error.

Parser adapters should instead produce explicit outcomes containing parsed structure, diagnostics, and a partial index where available. The system must fail safely when reliable structural evidence cannot be produced.

---

## 23. Diagnostic Normalization

Parser diagnostics must be converted into OAIT-owned diagnostics.

Conceptually:

```text
yaml diagnostic
        ↓
YAML adapter
        ↓
OAIT source diagnostic

jsonc-parser error
        ↓
JSON adapter
        ↓
OAIT source diagnostic
```

OAIT should normalize document identity, pointer where derivable, offset, range, line, column, severity/category, and recovery status.

---

## 24. YAML Multi-Document Policy

SPIKE-LOC-001 demonstrated that `yaml` can identify multiple documents in a YAML stream.

OAIT OpenAPI source input is expected to represent one OpenAPI description document per physical source resource.

Therefore a YAML multi-document stream should be detected and rejected unless a future explicit requirement defines otherwise.

---

## 25. BOM and Line Endings

The selected YAML technology correctly handled the evaluated UTF-8 BOM fixture. Both selected technologies supported evaluated LF and CRLF cases.

Pointer identity remained structural while physical offsets changed according to source representation.

The production implementation must retain the separation:

```text
pointer identity
≠
physical offset
```

---

## 26. Security Consequence

Both selected runtime parser dependencies are pure JavaScript in the evaluated strategy and were used in data-only parsing modes.

OAIT must not enable executable custom YAML constructors or other behavior that turns untrusted source content into executable logic.

Source-access security defined by ADR-004 remains independent of this technology choice.

This ADR does not authorize network access, filesystem traversal, remote `$ref` fetching, or custom executable tags.

---

## 27. Dependency and License Consequence

The evaluated direct licenses were:

```text
yaml@2.8.3          ISC
jsonc-parser@3.3.1 MIT
```

SPIKE-LOC-001 identified no unresolved distribution blocker for intended OAIT open-source use. This is an engineering dependency decision, not a legal opinion.

---

## 28. Version Policy

The versions:

```text
yaml@2.8.3
jsonc-parser@3.3.1
```

are the evidence-backed initial baseline.

This ADR does not require OAIT to remain permanently on those exact versions. However, upgrades must rerun regression evidence covering at least source ranges, RFC 6901 pointer mapping, Unicode, CRLF, BOM, duplicate keys, anchors and aliases, malformed input, strict JSON, and performance.

If an upgrade materially changes behavior, ADR review may be required.

---

## 29. Cross-Platform Qualification

SPIKE-LOC-001 executed the strategy on:

```text
macOS arm64
Node.js v24.18.0
```

Linux and Windows suitability was assessed but not executed.

Before production adoption is considered complete, OAIT should validate the selected strategy in CI on Linux and Windows where practical.

This does not block the architecture decision; it is an implementation qualification requirement.

---

## 30. Alternatives Considered

### Alternative A — `yaml` for both YAML and JSON

**Not selected.**

Advantages:

- Single parsing dependency.
- Pure JavaScript.
- Strong source fidelity.
- 91/100 weighted score.

Disadvantages:

- YAML semantics are more permissive than JSON.
- Requires separate strict JSON validation.
- Weaker JSON diagnostic integration.
- Significantly slower JSON performance in the experiment.

### Alternative B — `yaml` + `jsonc-parser`

**Selected.**

Advantages:

- Format-specific parsing.
- Exact source ranges.
- Strong YAML support.
- Strict JSON enforcement.
- Structured JSON diagnostics.
- Pure JavaScript.
- Strong TypeScript/NodeNext integration.
- Best weighted score: 97/100.
- Strongest JSON performance.

Known limitations:

- Partial malformed-input recovery.
- Duplicate occurrences require OAIT-owned representation.
- YAML alias semantics require explicit handling.
- Parser-specific diagnostics require normalization.

### Alternative C — Tree-sitter YAML + JSON

**Not selected.**

Advantages:

- Strong source fidelity.
- Useful malformed-input recovery.
- Fast performance on the largest evaluated YAML workload.

Disadvantages:

- JSON grammar did not independently enforce strict JSON.
- Native bindings.
- Larger operational surface.
- Runtime/grammar compatibility coordination.
- Byte-based position model.
- Direct-string input anomaly.
- Additional adapter complexity.
- Lowest weighted score: 83/100.

---

## 31. Positive Consequences

This decision provides format-appropriate source parsers, reliable original source ranges, strong JSON performance, structured JSON syntax diagnostics, pure-JavaScript runtime dependencies, reduced native installation risk, common UTF-16-compatible source offsets, clear adapter boundaries, parser-independent RFC 6901 identity, and a stable foundation for `SourceLocationIndex` design.

---

## 32. Negative Consequences

This decision introduces two parser technologies, two infrastructure adapters, different candidate diagnostic models, OAIT-owned normalization logic, OAIT-owned duplicate-occurrence handling, OAIT-owned alias metadata, and regression obligations for parser upgrades.

These costs are accepted because format-specific correctness is preferable to forcing YAML and JSON through one generalized source parser.

---

## 33. Relationship to ADR-004

ADR-004 answers:

> Who owns source evidence?

Answer:

```text
OAIT
```

ADR-005 answers:

> Which parsing technologies provide structural evidence beneath that OAIT-owned layer?

Answer:

```text
YAML → yaml
JSON → jsonc-parser
```

Combined architecture:

```text
Raw Source
    ↓
OAIT Source Admission
    ↓
Format Detection
    ↓
┌────────────────────────────┐
│ YAML → yaml adapter        │
│ JSON → jsonc-parser adapter│
└──────────────┬─────────────┘
               ↓
OAIT Structural Evidence
               ↓
OAIT RFC 6901 Pointer Encoder
               ↓
OAIT SourceLocationIndex
               ↓
Reference Evidence
               ↓
Controlled OpenAPI Processing
               ↓
Normalized Domain Model
```

---

## 34. Relationship to OpenAPI Parser Selection

This ADR does **not** select the final OpenAPI parser or validator.

The following decisions remain open:

```text
Scalar versus Redocly versus another OpenAPI parser
validator technology
OpenAPI 3.2 interpretation
schema/dialect handling
diagnostic adapter strategy
```

The source-index layer exists before those components and remains independently owned by OAIT.

A future OpenAPI parser selection must consume or coexist with this source-evidence boundary rather than replace it.

---

## 35. Detailed Design Consequence

After accepting ADR-005, OAIT has sufficient architecture and technology evidence to define the detailed source-processing subsystem, including concepts such as `SourcePolicy`, `SourceLoader`, `SourceDocumentRegistry`, YAML/JSON source adapters, `SourceLocationIndex`, physical source occurrences, reference evidence, the source reference graph, and diagnostic-location adaptation.

Actual responsibilities, interfaces, package boundaries, errors, lifecycle, and testing strategy are defined by the detailed source-processing design.

---

## 36. Testing Consequence

The SPIKE-LOC-001 fixture corpus should become an input to future regression-test design.

Production verification should cover YAML/JSON equivalence, exact ranges, arrays, RFC 6901 escaping, duplicate scalar values, duplicate keys, anchors/aliases, comments, flow collections, block scalars, Unicode and non-BMP characters, LF/CRLF, BOM, malformed YAML/JSON, strict JSON enforcement, YAML multi-document rejection, multi-file physical source identity, and source immutability.

Experimental code must not automatically be copied into production.

---

## 37. Implementation Constraint

Production implementation must preserve this separation:

```text
Third-party parser tree
        ↓
Infrastructure adapter
        ↓
OAIT-owned source model
```

It must not become:

```text
Third-party parser tree
        ↓
Rules / domain / reports / AI
```

This preserves replaceability and keeps the source-evidence contract stable.

---

## 38. Decision Outcome

OAIT adopts:

```text
yaml@2.8.3
```

for YAML source parsing and:

```text
jsonc-parser@3.3.1
```

for JSON source parsing as the initial production-design baseline.

The source-index implementation will use these libraries only as structural evidence providers.

OAIT remains responsible for canonical document identity, RFC 6901 pointer serialization, source occurrence identity, full source ranges, line/column normalization, duplicate handling, alias classification, diagnostic normalization, and source-access policy.

---

## 39. Final Decision

The source-location subsystem will follow this technology model:

```text
YAML source
    ↓
yaml
    ↓
OAIT YAML adapter
    ┐
    │
    ├→ OAIT SourceLocationIndex
    │
    ┘
JSON source
    ↓
jsonc-parser
    ↓
OAIT JSON adapter
```

The adapters convert candidate structural evidence into OAIT-owned source-location contracts.

Neither parser library becomes part of OAIT's domain model or public interface.

---

## 40. Guiding Principle

> **Use format-specific parsers for source fidelity, but keep source identity and meaning owned by OAIT.**
