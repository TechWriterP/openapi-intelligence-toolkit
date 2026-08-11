# Parser and Validator Production Design

**Status:** Draft  
**Date:** 2026-08-11  
**Applies to:** OAIT v0.1 and later  
**Related documents:** ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, ADR-008

---

## 1. Purpose and Scope

This document defines the production design for the OpenAPI Intelligence Toolkit (OAIT) parser and validator architecture.

The design realizes the architectural decisions established in:

- ADR-003: Normalized OpenAPI Domain Model
- ADR-004: Source Ownership and Reference Evidence
- ADR-005: Source Indexing Technology
- ADR-006: Select Scalar as Primary OpenAPI Semantic Parser
- ADR-007: Hybrid Validation and Deterministic Conformance Strategy
- ADR-008: Candidate-Specific Diagnostic Adaptation Boundary

The purpose of this design is to define how OAIT processes OpenAPI documents from source ingestion through final finding generation.

The design covers:

- Source processing.
- Source identity and provenance.
- Semantic parsing.
- Normalized domain-model construction.
- Validation orchestration.
- External validator integration.
- Diagnostic adaptation.
- Source correlation.
- Finding generation.
- Performance and testing considerations.

This document does not introduce new technology decisions. It describes how accepted architectural decisions are realized in the production system.

---

## 2. Design Principles

The OAIT parser and validator architecture follows the following principles.

### 2.1 OAIT Owns Source Truth

The original OpenAPI source files remain authoritative.

OAIT owns:

- Source loading policy.
- Canonical document identity.
- Source registry.
- Source locations.
- Provenance information.
- Source-to-model correlation.

Third-party parsers and validators may provide evidence, but they do not replace source truth.

---

### 2.2 Adapter Boundaries

External dependencies must not define OAIT internal contracts.

The architecture isolates candidate-specific behavior through adapters.

Examples:

```
Scalar parser
      |
      v
Scalar Parser Adapter
```

and:

```
External validator
      |
      v
Validator Adapter
```

and:

```
External validator
      |
      v
Diagnostic Adapter
```

Candidate runtime types, object models, and diagnostic structures must not leak into OAIT core components.

---

### 2.3 Evidence and Semantics Are Separate

OAIT distinguishes between:

```
What a tool reports
```

and:

```
What OAIT concludes
```

External tools provide evidence.

OAIT owns:

- Rule identity.
- Severity.
- Applicability.
- Conformance interpretation.
- Final findings.

---

### 2.4 Traceable Source Locations

Every significant transformation must preserve the ability to trace information back to the original source.

The architecture maintains:

```
Original source
      |
      v
SourceIndex
      |
      v
Normalized model
      |
      v
Finding
```

A transformed or bundled representation must not become the authoritative source location.

---

### 2.5 Deterministic Behavior

OAIT behavior must remain predictable across:

- Parser upgrades.
- Validator upgrades.
- OpenAPI versions.
- Different source layouts.

Deterministic OAIT-owned processing takes precedence over relying exclusively on third-party behavior.

---

### 2.6 Preserve Information Before Simplifying

The architecture favors preserving evidence before applying interpretation.

Examples:

- Preserve unknown OpenAPI fields.
- Preserve reference declarations, targets, and resolution evidence.
- Preserve source locations.
- Preserve vendor diagnostics as evidence.
- Preserve unresolved or ambiguous mappings.

Information should only be discarded when a defined design decision requires it.

---

## 3. High-Level Architecture

The OAIT parser and validator architecture consists of the following major layers:

```
                     OpenAPI Sources
                            |
                            v
                  Source Processing Layer
                            |
              +-------------+-------------+
              |                           |
              v                           v
       Source Registry              SourceIndex
              |
              v
        Parser Adapter
              |
              v
      Normalized OAIT Model
              |
              +----------------------+
              |                      |
              v                      v

   External Validator Layer     OAIT Rule Engine
              |                      |
              v                      |
     Diagnostic Adapters            |
              |                      |
              +----------+-----------+
                         |
                         v

              Finding Generation Layer
                         |
                         v

                    OAIT Output
```

The architecture separates:

- Physical source handling.
- Semantic parsing.
- Internal representation.
- Validation evidence.
- Conformance evaluation.
- Final user-facing findings.

---

## 4. End-to-End Processing Pipeline

The OAIT processing pipeline consists of the following stages.

### 4.1 Source Acquisition

The process begins when OAIT receives one or more OpenAPI source files.

Inputs may include:

- YAML documents.
- JSON documents.
- JSON-with-comments documents where supported.
- Multi-file OpenAPI structures.

The source-processing layer:

- Identifies input documents.
- Normalizes document identity.
- Loads source content.
- Maintains file relationships.

The original source remains unchanged throughout processing.

---

### 4.2 Source Processing and Indexing

The source-processing layer creates authoritative source evidence.

Responsibilities include:

- Parsing physical source structure.
- Creating SourceIndex entries.
- Recording document locations.
- Maintaining pointer-to-location mappings.

The SourceIndex provides the foundation for:

- Provenance.
- Diagnostic correlation.
- Finding locations.
- User-facing references.

---

### 4.3 Semantic Parsing

The parser adapter invokes the selected semantic parser.

Current decision:

```
@scalar/openapi-parser
```

The parser adapter is responsible for:

- Parser invocation.
- Parser lifecycle management.
- Parser error handling.
- Version-aware parsing behavior.
- Conversion into OAIT-compatible representations.

The parser adapter is not responsible for:

- Source ownership.
- Validation semantics.
- Final findings.
- Diagnostic interpretation.

---

### 4.4 Normalized Model Construction

The parser output is transformed into the OAIT normalized domain model.

The normalized model provides a stable representation for:

- Operations.
- Paths.
- Parameters.
- Schemas.
- References.
- Version-specific constructs.

The normalized model hides candidate-specific parser structures from downstream components.

---

### 4.5 Validation Execution

Validation occurs through two complementary mechanisms:

```
External validator evidence

+

OAIT deterministic conformance rules
```

External validators may identify possible issues.

OAIT rules provide authoritative interpretation.

---

### 4.6 Diagnostic Adaptation

External validator output passes through candidate-specific adapters.

The flow is:

```
Validator Diagnostic

        |

Candidate Diagnostic Adapter

        |

Candidate-Neutral Evidence

        |

SourceIndex Correlation
```

The adapter converts candidate-specific structures into OAIT-compatible evidence without allowing vendor-specific concepts to become public contracts.

---

### 4.7 Finding Generation

The finding-generation layer combines:

- OAIT deterministic rule results.
- External validator evidence.
- Source correlation information.
- Applicability decisions.
- Severity decisions.

The output is an OAIT-owned finding model.

The final finding does not expose candidate-specific runtime structures.

## 5. Source Processing Layer

The source-processing layer establishes the authoritative representation of OpenAPI source files before semantic parsing and validation.

This layer implements the source ownership principles defined in:

- ADR-004: Source Ownership and Reference Evidence
- ADR-005: Source Indexing Technology

The source-processing layer is responsible for preserving the relationship between:

- Physical source files.
- Parsed source structures.
- Logical OpenAPI elements.
- Source locations.
- Reference relationships.

The source-processing layer does not determine OpenAPI semantics. Its responsibility is to preserve source truth and provide evidence for downstream processing.

---

### 5.1 Source Loading

The source-loading component is responsible for acquiring OpenAPI source documents.

Responsibilities include:

- Accepting user-provided source locations.
- Reading source files.
- Identifying document formats.
- Preserving original source content.
- Creating source-document identities.
- Handling source-loading failures.

Supported source formats include:

- YAML.
- JSON.
- JSON-with-comments where supported by the selected processing path.

The source loader must preserve the original content because later processing stages may require:

- Exact source reconstruction.
- Source-location mapping.
- Diagnostic correlation.
- User-facing references.

The source loader must not:

- Normalize formatting.
- Rewrite content.
- Modify keys.
- Remove unknown fields.
- Resolve references by changing the source representation.

The source loader establishes the initial source boundary:

```
Physical OpenAPI Files

        |

Source Registry Entries

        |

Source Processing Pipeline
```

---

### 5.2 Source Registry

The Source Registry maintains the authoritative identity of every source document participating in an OAIT processing session.

A source document may represent:

- The root OpenAPI document.
- A referenced OpenAPI fragment.
- An external schema file.
- A referenced component document.

The Source Registry is responsible for maintaining:

- Canonical document identity.
- Source location.
- Source content metadata.
- Document relationships.
- Processing state.

Conceptually:

```
Source Registry

Document URI
      |
      +-- Source Content
      |
      +-- Document Metadata
      |
      +-- Reference Relationships
      |
      +-- SourceIndex Entries
```

The Source Registry is the foundation for multi-file processing.

External tools may report file paths or resource identifiers, but those values must be correlated through the Source Registry before becoming canonical OAIT source identities.

---

### 5.3 SourceIndex Generation

The SourceIndex provides the authoritative mapping between logical OpenAPI locations and physical source locations.

The SourceIndex is generated from source processing information using the technology selected by ADR-005:

```text
YAML
→ yaml

JSON / JSONC physical syntax
→ jsonc-parser
```

It maintains relationships such as:

```
Document URI

        +

RFC 6901 JSON Pointer

        |

Line / Column / Range Information
```

The SourceIndex supports:

- Finding locations.
- Diagnostic correlation.
- Provenance tracking.
- Source navigation.
- Impact analysis.

The SourceIndex must preserve the distinction between:

```
Logical OpenAPI identity

and

Physical source occurrence
```

This distinction is important for cases involving:

- Duplicate keys.
- Formatting differences.
- Multiple equivalent structures.
- Invalid source documents.
- Ambiguous mappings.

The SourceIndex is not a parser output cache.

It is an OAIT-owned source evidence model.

---

### 5.4 Reference Evidence Management

References are processed as evidence relationships rather than as immediate source replacement.

The source-processing layer maintains:

- Reference location.
- Referencing document.
- Target document.
- Target pointer.
- Resolution state.
- Source provenance.

The architecture distinguishes:

```
Reference Relationship

from

Resolved Semantic Object
```

A resolved reference does not eliminate the need to preserve:

- Original source location.
- Original document identity.
- Reference path.
- Provenance information.

Reference processing must support:

- Local references.
- External file references.
- Multi-file OpenAPI documents.
- Recursive references.
- Unresolved references.

For unresolved references, OAIT preserves the evidence of the failed relationship rather than silently removing or replacing the reference.

---

## 6. Parser Adapter Design

The parser adapter provides the boundary between the selected semantic parser and OAIT internal architecture.

The parser adapter implements ADR-006:

```
@scalar/openapi-parser

        |

Scalar Parser Adapter

        |

OAIT Processing Pipeline
```

The parser adapter isolates Scalar-specific behavior from OAIT components.

---

### 6.1 Scalar Parser Integration

Scalar is the selected primary semantic parser for OAIT.

The integration layer is responsible for:

- Invoking Scalar parser APIs.
- Managing parser configuration.
- Handling parser responses.
- Handling parser errors.
- Extracting semantic information required by OAIT.

Scalar provides semantic parsing capability.

Scalar does not become the authority for:

- Source identity.
- Source locations.
- OAIT normalized model structure.
- Validation semantics.
- Final findings.

The integration must treat Scalar output as parser evidence that is transformed into OAIT-owned representations.

---

### 6.2 Parser Adapter Responsibilities

The parser adapter is responsible for:

- Providing a stable interface to the selected parser.
- Translating parser-specific output into OAIT-compatible input.
- Managing parser-specific errors.
- Preserving parser metadata required for processing.
- Isolating dependency upgrades.

The parser adapter may understand:

- Scalar runtime structures.
- Scalar parser behavior.
- Scalar-specific limitations.
- Scalar-specific errors.

The parser adapter must not expose those concepts outside the adapter boundary.

The adapter transforms:

```
Scalar Representation

        |

Parser Adapter

        |

OAIT Internal Representation
```

---

### 6.3 Parser Adapter Boundaries

The parser adapter must maintain clear ownership boundaries.

The parser adapter owns:

- Parser invocation.
- Parser lifecycle.
- Parser-specific translation.
- Parser error interpretation.

The parser adapter does not own:

- Source loading.
- SourceIndex generation.
- Rule evaluation.
- Validation severity.
- Diagnostic adaptation.
- Finding generation.

The separation ensures that OAIT can replace or extend parser implementations without redesigning the rest of the system.

---

## 7. Normalized OAIT Domain Model

The normalized OAIT domain model provides the internal representation consumed by downstream components.

The model implements the principles established in ADR-003.

The normalized model provides:

- Parser-independent representation.
- Version-aware OpenAPI concepts.
- Stable internal contracts.
- Separation between source evidence and semantic interpretation.

---

### 7.1 Model Construction

The normalized model is created after semantic parsing.

The construction process combines:

- Scalar parser output.
- Source Registry information.
- SourceIndex information.
- Reference evidence.

Conceptually:

```
Source Evidence

        +

Semantic Parser Output

        |

Normalized OAIT Model
```

The normalized model represents concepts such as:

- API documents.
- Operations.
- Parameters.
- Request bodies.
- Responses.
- Schemas.
- References.

The model must preserve relationships required for:

- Validation.
- Analysis.
- Documentation generation.
- Finding generation.

---

### 7.2 Version-Aware Representation

OpenAPI versions contain differences in:

- Operation behavior.
- Schema dialect handling.
- Nullability.
- Extension support.
- Validation rules.

The normalized model must preserve version-specific meaning.

The model must not:

- Flatten meaningful differences.
- Convert incompatible concepts silently.
- Remove version information.

Version information remains available for:

- Rule applicability.
- Validation behavior.
- Compatibility analysis.

---

### 7.3 Candidate Type Isolation

The normalized OAIT model must not depend on Scalar, Redocly, IBM, or any future candidate-specific runtime types.

Candidate structures terminate at adapter boundaries.

The architecture requires:

```
Candidate Type

        |

Adapter Translation

        |

OAIT Domain Type
```

The normalized model provides the stable contract for:

- Validation.
- Analysis.
- Reporting.
- Future integrations.

This isolation allows candidate dependencies to evolve without creating architectural coupling.

---

## 8. Validation Architecture

Validation implements the hybrid strategy established by ADR-007:

```text
bounded external validator evidence
        +
OAIT deterministic conformance
        +
OAIT SourceIndex
        |
        v
OAIT-owned findings
```

External validator success is not proof of conformance. External validator diagnostics are inputs to OAIT processing rather than public findings. OAIT retains authority over rule identity, severity, version applicability, source identity, deduplication, suppression, and final finding semantics.

### 8.1 Validation Orchestrator

The Validation Orchestrator coordinates validation after source admission, indexing, semantic parsing, and normalized-model construction have established the required inputs.

External provider execution occurs through a Validator Adapter. The Validator Adapter owns provider invocation, configuration translation, lifecycle handling, and execution-result capture. Candidate diagnostics produced by that execution then cross the separate Diagnostic Adapter defined by ADR-008.

The orchestrator is responsible for:

- Selecting applicable external evidence providers configured for the execution.
- Invoking the default bounded Scalar validation path.
- Invoking applicable OAIT deterministic rules.
- Recording provider execution status separately from diagnostic evidence.
- Passing external diagnostics to candidate-specific adapters.
- Passing candidate-neutral evidence to source correlation and conformance processing.
- Combining external and deterministic evidence for finding generation.
- Preserving partial results when policy permits continued processing.
- Exposing coverage and execution metadata required for audit and troubleshooting.

The orchestrator must not treat absence of external diagnostics as proof that the document conforms. It must also avoid converting execution failures into conformance findings.

The orchestrator may schedule independent work concurrently when input and ordering requirements permit. Concurrency must not change rule outcomes, finding identity, or deterministic output ordering.

### 8.2 External Validator Evidence

Scalar validation is the default bounded external evidence provider for OAIT v0.1. It is already part of the selected parser dependency family and therefore does not require a second default validator dependency.

Scalar validation evidence remains subject to the limitations established by SPIKE-006:

- Zero false positives were observed in the applicable tested valid corpus.
- Five false negatives were observed in the applicable tested invalid corpus.
- Required conformance coverage is incomplete.
- Source and diagnostic metadata are sparse.
- Referenced-target diagnostics may require OAIT-owned correlation and fallback.

The external-provider boundary must represent at least:

- Provider identity and qualified version.
- Invocation configuration.
- Execution outcome.
- Supported OpenAPI-version scope.
- Candidate diagnostics.
- Candidate-reported location evidence.
- Timing and bounded operational metadata where required.

Redocly validation is not an authoritative or default provider. Source-rich Redocly diagnostic enrichment remains deferred. IBM validation remains deferred from the default OAIT v0.1 architecture. Future providers must use the same validator and diagnostic boundaries and require separate qualification.

### 8.3 OAIT Deterministic Conformance Engine

The deterministic conformance engine evaluates OAIT-owned rules against OAIT-owned source evidence and normalized semantic structures.

Its responsibilities include:

- Applying rules only to supported OpenAPI versions and relevant model elements.
- Producing stable rule evidence independent of third-party message wording.
- Covering reviewed external-validator gaps.
- Evaluating cross-document and cross-entity invariants when required.
- Retaining canonical source identity for every locatable result.
- Producing repeatable results for equivalent admitted inputs and configuration.

Evidence requires deterministic OAIT coverage at least for duplicate parameter identity and undeclared security requirements. Additional coverage must follow the reviewed rule catalog rather than being inferred from candidate behavior.

The deterministic engine is not required to reimplement every OpenAPI validation rule. Coverage must be explicit so that no requirement silently depends on an external provider.

### 8.4 Rule Ownership

OAIT owns:

- Stable public rule IDs.
- Rule definitions and semantics.
- Default severity.
- OpenAPI-version applicability.
- Rule configuration and suppression semantics.
- Finding identity and deduplication policy.
- Coverage state.

Provider codes, rule names, severities, and messages remain evidence. They may be associated with an OAIT rule through reviewed mapping logic, but they must not define the OAIT public contract.

The coverage model must be able to distinguish whether a requirement is:

```text
externally detected
OAIT deterministic
covered by both paths
not yet implemented
not applicable
```

Duplicate evidence from an external provider and an OAIT deterministic rule must retain its provenance until the finding layer applies OAIT-owned deduplication.

---

## 9. Diagnostic Adaptation Architecture

Diagnostic adaptation implements ADR-008. It translates candidate-specific diagnostics into candidate-neutral evidence without assigning final OAIT meaning.

```text
candidate diagnostic
        |
        v
candidate-specific adapter
        |
        v
candidate-neutral evidence
        |
        v
SourceIndex correlation
        |
        v
OAIT conformance and finding processing
```

### 9.1 Candidate-Specific Diagnostic Adapters

Each external provider requires its own diagnostic adapter. The adapter may understand:

- Provider runtime types and output shapes.
- Provider diagnostic codes and rule identifiers.
- Provider severity values.
- Provider path, pointer, file, line, column, and range conventions.
- Provider diagnostic nesting and related entries.
- Provider-version-specific behavior.
- Bounded message heuristics when no structured alternative exists.

The adapter must prefer structured fields over message parsing. Message heuristics must remain provider-version-sensitive, regression tested, conservative, and internal. They must not become stable public contracts.

The adapter must not determine OAIT rule applicability, final severity, suppression, deduplication, or whether a public finding is emitted.

### 9.2 Candidate-Neutral Evidence Model

Candidate-neutral diagnostic evidence must support the following conceptual information without importing provider runtime types:

- Provider identity and version.
- Provider diagnostic code or rule identifier when available.
- Provider severity and message as nonauthoritative evidence.
- Provider resource reference and location representation.
- Canonical document URI and RFC 6901 pointer when correlated.
- Presentation range when supported by SourceIndex.
- Correlation status and supporting evidence.
- Mapping status to an OAIT rule, when evaluated outside the adapter.
- Bounded raw provider metadata when justified.

Missing fields must remain absent. The adapter must not fabricate canonical pointers, root locations, rule IDs, or severity.

Raw metadata must be deliberately bounded and serializable. Entire provider runtime objects, cyclic graphs, source copies, and unnecessary source excerpts must not be retained.

### 9.3 Source Correlation

Source correlation is distinct from candidate adaptation. The adapter first expresses candidate location evidence in OAIT-owned neutral terms. A correlation component then compares that evidence with the Source Registry, SourceIndex, and reference graph.

Correlation must account for:

- Candidate-reported file or resource names.
- Relative and absolute paths.
- URI normalization.
- Object paths, array paths, and JSON Pointers.
- Referenced-target documents.
- Original versus transformed paths.
- Duplicate or malformed source occurrences.

Only Source Registry identity and SourceIndex evidence may establish canonical source identity. Candidate-provided line and column information may assist correlation but does not override canonical OAIT evidence.

### 9.4 Correlation Confidence

Every attempted correlation must use one of the following states:

| State | Meaning |
| --- | --- |
| `exact` | Evidence uniquely identifies one canonical document URI and RFC 6901 pointer. |
| `partial` | Some identity evidence is established, but the complete canonical location is unavailable. |
| `ambiguous` | Multiple original source occurrences remain plausible. |
| `unavailable` | The provider supplied insufficient evidence for meaningful correlation. |

If an additional confidence representation is introduced, it must be explainable from evidence and must not imply unsupported statistical precision.

### 9.5 Unmapped Diagnostics

A provider diagnostic may have no reviewed mapping to an OAIT rule. Such evidence must remain identifiable as unmapped rather than receiving an invented OAIT rule ID.

Policy outside the adapter determines whether unmapped evidence is:

- Retained internally.
- Exposed in a diagnostic or debug mode.
- Excluded from public findings.
- Submitted for future coverage review.

Unmapped evidence must not bypass OAIT severity, applicability, suppression, or finding policy.

---

## 10. Multi-File and Reference Processing

Multi-file processing is governed by OAIT source ownership. Candidate reference behavior may assist semantic processing but does not replace the Source Registry or reference evidence graph.

### 10.1 File Graph Management

The Source Registry maintains all admitted physical resources in a processing session. The reference graph records directed relationships from declarations to targets.

Each reference relationship must preserve, where available:

- Declaring document URI and pointer.
- Literal reference value.
- Resolved target document URI and pointer.
- Resolution status.
- Reference-hop evidence.
- Access-policy decision.
- Failure evidence.

Resources must be deduplicated by canonical identity. Graph traversal must use explicit visited and active-path state so that shared targets and cycles are handled without uncontrolled repetition.

### 10.2 Circular References

Recursive references are valid graph relationships and must not be treated as errors solely because they form cycles.

The normalized representation preserves reference edges and target identity. It must not require permanent replacement of references with cyclic JavaScript object graphs. Algorithms traversing the graph must define termination behavior and distinguish a valid recursive reference from an invalid or unresolved target.

Full Scalar dereference may be used only by a bounded operational consumer that explicitly accepts cyclic output. It is never the canonical normalized or source representation.

### 10.3 External References

External references are subject to OAIT source-access policy before candidate processing. The policy controls:

- Filesystem admission and root containment.
- Canonical URI resolution.
- Symlink-aware access decisions.
- Remote-reference and network access.
- Resource size and processing limits.
- Resource deduplication.

Parser or validator convenience APIs must not bypass these controls. Remote access is disabled or enabled only through explicit OAIT policy; the selected parser does not determine network authorization.

Missing resources, invalid fragments, denied access, and unsupported schemes produce reference-processing errors with preserved declaration evidence.

### 10.4 Provenance Preservation

Reference resolution and optional bundling must preserve the relationship between original declaration, resolution hops, and final target.

Bundled or transformed pointers may be retained as operational evidence, but they must not be represented as original pointers. Before any transformation, OAIT must have captured canonical resource identity, SourceIndex entries, reference declarations, target evidence, and access decisions.

Every normalized entity derived through a reference must remain traceable to its original physical source identity or explicitly record why such provenance is partial, ambiguous, or unavailable.

---

## 11. Error Handling Model

The processing result must distinguish failures of the processing system from conformance findings about the user's OpenAPI description. Errors must retain stage, cause, source evidence where available, and whether partial processing remains safe.

### 11.1 Source Errors

Source errors occur before semantic parsing and include:

- Unreadable or missing input.
- Unsupported source encoding or format.
- Malformed YAML or JSON.
- Source-access policy denial.
- Resource or processing-limit violation.

Source errors are associated with the admitted resource and physical range evidence when available. A malformed source may lack a complete RFC 6901 pointer; the system must preserve physical occurrence evidence without fabricating logical identity.

### 11.2 Parser Errors

Parser errors include Scalar invocation failures, unsupported result shapes, and inability to construct candidate-neutral semantic input.

The Parser Adapter translates candidate exceptions into OAIT-owned processing errors while retaining bounded internal cause metadata. Candidate exception types must not escape the adapter. Parser failure does not automatically produce an OpenAPI conformance finding.

Partial parser results may proceed only when the adapter contract explicitly establishes their invariants and downstream consumers declare that they accept partial semantic input.

### 11.3 Reference Errors

Reference errors include:

- Missing target documents.
- Invalid or missing fragments.
- Denied filesystem or network access.
- Unsupported reference schemes.
- Resolution-limit exhaustion.

Reference errors retain the declaration location, literal reference, attempted target identity, access decision, and resolution-hop evidence when available. Recursive references are not reference errors merely because traversal encounters an existing active node.

### 11.4 Validator Execution Errors

Validator execution errors include dependency failures, provider exceptions, unsupported invocation states, timeouts or resource-limit failures, adapter failures, and incompatible output shapes.

These errors describe failure to obtain validator evidence. They must not be converted into findings claiming that the OpenAPI document is invalid. The orchestrator records the provider as failed or incomplete and applies execution policy to determine whether deterministic processing may continue.

### 11.5 Conformance Findings

Conformance findings are OAIT-owned conclusions produced under an applicable OAIT rule. A finding contains stable rule identity, OAIT severity, applicability, canonical source correlation when available, and supporting provenance.

A provider diagnostic is not itself a finding. Finding generation may use external evidence, deterministic evidence, or both. Deduplication combines overlapping evidence without discarding provider provenance.

---

## 12. Performance and Resource Management

SPIKE-007 established that Scalar and Redocly were operationally suitable on the evaluated macOS environment and that the selected Scalar path met the current engineering targets. It also identified memory, repeated-processing, cross-platform, and dependency considerations that remain production responsibilities.

The design must:

- Avoid repeated physical source loading and SourceIndex construction within one processing session.
- Determine whether Scalar load and validate operations can safely reuse an intermediate representation.
- Prefer reuse only when it preserves parser, validator, reference-policy, and diagnostic correctness.
- Bound reference traversal, document count, input size, recursion work, diagnostic count, and retained raw metadata.
- Release candidate lifecycle objects and optional transformed views when their consumers complete.
- Avoid retaining duplicate full-source or bundled representations without an identified need.
- Preserve deterministic result ordering when validation and rule execution are concurrent.
- Measure cold and warm behavior separately where dependency initialization affects CLI latency.

The experiment observed corrected maximum resident-set values of approximately 421.14 MiB for Scalar and 433.22 MiB for Redocly. These are characterization evidence rather than production memory budgets. Production qualification must establish representative limits and monitor peak memory for large and multi-file inputs.

For interactive CLI use, the default path should remain in-process, local-first, cancellable where the hosting interface supports cancellation, and capable of reporting processing-stage failures distinctly. Service deployments require independent concurrency, isolation, admission-control, and resource-limit design. Linux and Windows CI qualification remains required because SPIKE-007 measurements were produced on macOS.

---

## 13. Caching Strategy

Caching is an optimization and must not redefine source authority. This design does not select a cache technology or persistence mechanism.

Eligible cached artifacts may include:

- Loaded immutable source bytes keyed by canonical resource identity and content identity.
- Physical source parse/index results.
- Candidate-neutral parser results.
- Reference-resolution results and graph fragments.
- Deterministic rule results.
- Adapted diagnostic evidence.
- Optional bounded transformed views.

Cache keys and invalidation must account for all inputs that can change meaning, including:

- Source content and every referenced resource.
- Canonical root and source-access policy.
- Parser and validator versions.
- Adapter contract version.
- OpenAPI version and effective schema dialect.
- OAIT rule catalog and configuration.
- Suppression and severity configuration where relevant to the cached stage.

Original source content, Source Registry identity, SourceIndex, and reference evidence remain authoritative even when derived data is cached. A cache hit must not bypass source admission or access-policy decisions. Cached transformed pointers must not be promoted to canonical source identity.

In-memory reuse within one processing session should be evaluated before persistent caching. Persistent or shared caches require separate privacy, tenancy, lifecycle, and invalidation design.

---

## 14. Security and Dependency Management

Third-party dependencies must remain behind the boundaries established by ADR-006 through ADR-008.

The production dependency policy must include:

- Pinned and reproducible dependency resolution.
- Lockfile-based license and vulnerability review.
- Review of transitive dependency changes.
- Adapter contract and fixture regression tests before upgrades.
- OpenAPI-version, schema, reference, diagnostic, and performance requalification.
- Explicit review of parser declaration and TypeScript integration changes.
- Minimal retention and logging of source content and provider metadata.

Source acquisition and reference loading are security boundaries. Candidate APIs must receive only resources admitted by OAIT policy and must not independently fetch filesystem or network targets outside that policy.

Scalar had a LOW_CONCERN observed posture in the pinned experiment. That observation does not replace ongoing production review. Redocly is not a default runtime dependency under the accepted design. IBM remains deferred due to OAS 3.2 limitations, subprocess integration, partial multi-file evidence, a large dependency surface, and the observed SIGNIFICANT_CONCERN audit posture. The eight high findings do not by themselves establish exploitability.

If an external process validator is introduced later, it requires bounded inputs, timeout and resource controls, controlled environment and working directory, captured output limits, and explicit network/filesystem policy. Such an addition requires qualification under the accepted adapter and evidence architecture.

---

## 15. Testing Strategy

Testing must demonstrate stable OAIT contracts independently from candidate implementation details.

### 15.1 Unit Testing

Unit tests cover OAIT-owned behavior, including:

- URI and RFC 6901 pointer handling.
- Source Registry identity and deduplication.
- SourceIndex lookup and physical-range behavior.
- Reference-edge construction and traversal termination.
- Version-aware normalization.
- Rule applicability and deterministic rule semantics.
- Correlation-state transitions.
- Finding identity, severity, deduplication, and suppression.
- Error classification and partial-result policy.

Candidate runtime objects must not be required by core unit tests.

### 15.2 Adapter Contract Testing

Parser and diagnostic adapters require contract tests against pinned candidate versions.

Parser Adapter contract tests verify:

- OAS 3.0, 3.1, and 3.2 semantic ingestion.
- Candidate-neutral output invariants.
- Unknown-field and schema-dialect preservation.
- Reference-boundary behavior.
- Error and partial-result behavior.
- Absence of candidate types from exported OAIT contracts.

Validator and Diagnostic Adapter contract tests verify:

- Invocation and execution-state classification.
- Diagnostic code, severity, message, and location extraction.
- Exact, partial, ambiguous, and unavailable correlation inputs.
- Unmapped diagnostics.
- Bounded raw metadata.
- Known false-positive and false-negative controls.
- Conservative behavior when provider output changes.

Replacement tests must demonstrate that another conforming adapter can provide candidate-neutral evidence without changing public finding contracts.

### 15.3 Fixture-Based Testing

The accepted spike fixtures form the initial regression corpus and must be promoted or reproduced in production test scope without coupling production tests to experiment implementation.

Coverage must include:

- SPIKE-004: version-aware OAS 3.2 `query`, `additionalOperations`, `querystring`, and operation-discovery behavior.
- SPIKE-005: OAS 3.0 distinctions, OAS 3.1/3.2 boolean schemas, multi-type declarations, dialects, unknown keywords, `$ref` siblings, composition, and recursive schemas.
- SPIKE-006: valid controls, known provider false positives and false negatives, duplicate parameter identity, duplicate `operationId`, undeclared security requirements, referenced-target violations, and unsupported-version behavior.
- SPIKE-007: large single-file, multi-file, recursive, failure-path, repeated-run, memory, headless CLI, and platform qualification scenarios.

YAML and JSON, internal and external references, unresolved targets, malformed documents, duplicate physical occurrences, and pointer escaping require explicit fixtures.

### 15.4 Regression Testing

Every parser, validator, source-indexing, or adapter upgrade must run the applicable contract and fixture suites before acceptance.

Regression baselines must track:

- Normalized semantic output.
- Reference and provenance evidence.
- Diagnostic evidence shape.
- Correlation status and canonical locations.
- External-provider FP/FN controls.
- Deterministic rule coverage.
- Final finding identity and ordering.
- Performance and peak-memory guardrails.
- Dependency, license, and vulnerability changes.

Golden artifacts must exclude unstable provider details unless the test explicitly verifies the candidate adapter contract.

---

## 16. Implementation Sequencing

Implementation must proceed through reviewable boundaries. Later phases depend on the contracts established by earlier phases.

### Phase 1 — Source Processing and SourceIndex

- Implement source admission and loading policy.
- Implement Source Registry identity and lifecycle.
- Implement YAML and JSON/JSONC physical indexing under ADR-005.
- Implement reference declaration evidence and the resource graph.
- Establish source, parser, reference, and processing error contracts.

Exit condition: admitted single-file and multi-file resources have canonical identities, SourceIndex entries, reference evidence, and deterministic source errors without candidate parser ownership.

### Phase 2 — Parser Adapter and Normalized Model

- Define the candidate-neutral Parser Adapter contract.
- Integrate Scalar behind the adapter.
- Implement version-aware normalization under ADR-003.
- Preserve reference boundaries, unknown fields, dialect evidence, and provenance links.
- Establish optional noncanonical transformation lifecycle without making bundling a requirement.

Exit condition: OAS 3.0/3.1/3.2 fixtures produce candidate-neutral normalized structures traceable to original source evidence.

### Phase 3 — Validation Orchestration

- Define external provider execution results.
- Integrate bounded Scalar validation evidence.
- Implement deterministic-rule execution and coverage tracking.
- Separate provider execution failures from diagnostics and findings.
- Establish deterministic scheduling and partial-result policy.

Exit condition: external and deterministic evidence execute independently and cannot bypass OAIT conformance ownership.

### Phase 4 — Diagnostic Adaptation

- Define candidate-neutral diagnostic evidence.
- Implement the Scalar diagnostic adapter.
- Implement SourceIndex correlation and its four required states.
- Implement reviewed rule mapping, deduplication, and finding generation outside the adapter.
- Establish unmapped-evidence and bounded raw-metadata behavior.

Exit condition: candidate diagnostics can contribute to stable OAIT findings without leaking candidate types, codes, severities, or source identity.

### Phase 5 — Production Hardening

- Evaluate safe intermediate reuse and caching.
- Add resource limits, cancellation behavior, and privacy-safe logging.
- Qualify Linux and Windows CI behavior.
- Establish dependency-upgrade and security-review procedures.
- Add large, multi-file, recursive, malformed, and failure-path regression suites.
- Validate interactive CLI behavior and define service-specific operational requirements when service scope is approved.

Exit condition: production guardrails, cross-platform qualification, performance baselines, security review, and replacement tests are established.

---

## 17. Open Design Questions

The following matters remain unresolved and require later design or product decisions. They do not alter the accepted technology and ownership decisions in ADR-003 through ADR-008.

- Whether OAIT v0.1 requires only an in-process library and CLI architecture or also a long-running service architecture.
- Whether any source, index, normalized model, diagnostic evidence, or finding requires persistence beyond one processing session.
- What public API surface exposes processing results, partial results, execution errors, evidence, and findings.
- What concurrency and scalability model applies to service or batch execution.
- What resource limits and cancellation guarantees apply to each hosting mode.
- Whether persistent or shared caching is required and, if so, its privacy, tenancy, and invalidation model.
- What user-facing policy governs unmapped external diagnostics.
- What partial-processing behavior is appropriate when parsing, reference resolution, or external validation fails.
- What stable configuration surface controls source access, validation providers, rule selection, severity overrides, and suppression.
- What observability data may be retained without exposing sensitive OpenAPI source content.

These questions must be resolved without reopening the following accepted decisions:

```text
yaml + jsonc-parser
→ authoritative physical source indexing

Scalar
→ primary semantic parser behind an OAIT adapter

Scalar validation
→ bounded nonauthoritative external evidence

OAIT
→ source identity, normalization, deterministic conformance,
  diagnostic adaptation, and findings
```
