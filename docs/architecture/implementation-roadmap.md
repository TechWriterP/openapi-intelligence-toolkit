# OAIT v0.1 Implementation Roadmap

**Status:** Draft
**Date:** 2026-08-11
**Applies to:** OAIT v0.1 implementation planning
**Basis:** ADR-001 through ADR-008, completed parser-validator spikes, source-processing design, normalized domain model, parser-validator evaluation, and parser-validator production design

---

## 1. Purpose and Scope

This document defines the engineering execution roadmap for the OpenAPI Intelligence Toolkit (OAIT) v0.1 after completion of architecture discovery and parser-validator technology validation.

It translates accepted decisions and experiment evidence into:

- An implementation-readiness assessment.
- Recommended package and test boundaries.
- A dependency-ordered implementation roadmap.
- Engineering epics and candidate issues.
- A first implementation milestone.
- Risk mitigations and testing requirements.
- Immediate developer actions.

This roadmap does not authorize new technology decisions, modify accepted architecture, or provide production implementation. Exact implementation interfaces must remain consistent with the governing designs and ADRs.

## 2. Evidence Reviewed

The assessment is based on the repository state and the following evidence groups.

### 2.1 Governing architecture

- `docs/architecture/system-architecture.md`
- `docs/architecture/openapi-domain-model.md`
- `docs/architecture/source-processing-design.md`
- `docs/architecture/parser-validator-evaluation.md`
- `docs/architecture/parser-validator-production-design.md`
- `project-structure.md`

### 2.2 Accepted decisions

- ADR-001: TypeScript and Node.js.
- ADR-002: Monorepo with internal packages and thin applications.
- ADR-003: OAIT-owned normalized, version-aware domain model.
- ADR-004: OAIT-owned source loading, reference evidence, and source identity.
- ADR-005: `yaml@2.8.3` and `jsonc-parser@3.3.1` for source indexing.
- ADR-006: `@scalar/openapi-parser@0.28.10` as primary semantic parser behind an adapter; `@scalar/json-magic@0.12.19` is an optional noncanonical transformation helper.
- ADR-007: Bounded Scalar validator evidence plus OAIT-owned deterministic conformance.
- ADR-008: Candidate-specific diagnostic adaptation into candidate-neutral evidence.

### 2.3 Experimental evidence

- SPIKE-001 through SPIKE-007.
- SPIKE-LOC-001.
- Persisted experiment fixtures, machine-readable results, and accepted experiment READMEs.

### 2.4 Requirements and quality model

- Functional and nonfunctional requirements.
- OpenAPI quality model.
- Proposed rule schema.
- The 29-rule v0.1 rule catalog.

## 3. Repository Baseline

The repository is a documentation-and-experiment repository at the start of production implementation.

### 3.1 Present today

- Accepted architecture and ADRs.
- Detailed source-processing, normalized-domain, parser-validator, validation, and diagnostic-adaptation designs.
- Isolated TypeScript experiments for parser, reference, source-location, schema, validation, and performance behavior.
- Reusable evidence fixtures covering OAS 3.0, 3.1, and 3.2.
- Proposed repository layout in `project-structure.md`.
- Requirements, quality model, rule schema, and rule catalog.

### 3.2 Not present today

- Root `package.json` or workspace configuration.
- Root TypeScript configuration.
- Production `apps/` or `packages/` directories.
- Production source or exported package contracts.
- Root test runner configuration or production tests.
- CI workflow configuration.
- Production build, lint, formatting, type-check, release, or dependency-audit automation.

The `project-structure.md` tree is a target concept, not the current filesystem. Experiment `package.json`, TypeScript configuration, source files, and installed dependencies are spike-local and must not be treated as the production workspace.

## 4. Current Architecture Understanding

### 4.1 Runtime flow

```text
Untrusted OpenAPI sources
        |
        v
OAIT source admission and loading policy
        |
        v
SourceDocumentRegistry + SourceLocationIndex
        |
        +----> reference declarations and source-resource graph
        |
        v
Scalar Parser Adapter
        |
        v
candidate-neutral semantic evidence
        |
        v
version adapters and Normalized OAIT Domain Model
        |
        +---------------------------+
        |                           |
        v                           v
bounded Scalar validation     OAIT deterministic rules
        |                           |
        v                           |
Scalar Diagnostic Adapter          |
        |                           |
        v                           |
candidate-neutral evidence --------+
        |
        v
SourceIndex correlation + OAIT interpretation
        |
        v
OAIT-owned findings
        |
        v
reporting / CLI / later API-intelligence workflows
```

### 4.2 Ownership boundaries

| Concern | Owner | External contribution |
| --- | --- | --- |
| Source admission and loading | OAIT | None may bypass policy |
| Canonical resource identity | OAIT Source Registry | Candidate paths are evidence only |
| Canonical location | OAIT SourceIndex: physical URI + RFC 6901 pointer | Candidate line/path data may assist correlation |
| Reference declaration and provenance | OAIT | Candidate resolution may assist semantics |
| Physical YAML/JSON indexing | OAIT adapters over `yaml` and `jsonc-parser` | AST/CST types remain internal |
| Semantic parsing | Scalar Parser Adapter | Scalar supplies parser evidence |
| Normalized semantics | OAIT | Candidate types terminate at adapters |
| Bundling/dereferencing | Optional, noncanonical operational view | Scalar/json-magic may assist bounded consumers |
| Validator evidence | Bounded Scalar provider | Non-authoritative evidence |
| Rule identity, severity, applicability | OAIT | Provider values remain evidence |
| Diagnostic adaptation | OAIT candidate-specific adapter | Structured provider fields are preferred |
| Findings, deduplication, suppression | OAIT | May retain supporting provider provenance |

### 4.3 Confirmed constraints

1. Source is immutable during analysis.
2. Source evidence is captured before third-party transformation.
3. Canonical logical source identity is physical document URI plus RFC 6901 JSON Pointer.
4. Line and column are presentation metadata.
5. Duplicate physical occurrences must not be silently collapsed.
6. References remain graph edges; canonical full dereference is prohibited.
7. OAS 3.0, 3.1, and 3.2 meanings remain version aware.
8. Unknown fields, schema dialects, `$ref` siblings, and reference provenance are preserved before projection.
9. Parser, validator, and diagnostic candidate types do not leak into core or public contracts.
10. No external validator is the conformance authority.
11. Validator execution failure is not a conformance finding.
12. OAIT results must be deterministic and replaceable across candidate upgrades.

## 5. Implementation Readiness Assessment

The classifications describe readiness to begin scoped implementation, not whether production code already exists:

- **READY:** Accepted evidence and design are sufficient to schedule implementation; exact coding choices remain within the approved boundary.
- **PARTIALLY READY:** Direction is accepted, but one or more contracts or policies must be finalized during an enabling issue before dependent implementation.
- **NOT STARTED:** The production foundation is absent and requires an explicit design/scaffold issue before feature work.

| Area | Classification | Complete evidence/design | Production gap |
| --- | --- | --- | --- |
| Source processing | READY | ADR-004/005 and detailed source-processing design define policy, registry, adapters, graph, errors, and invariants. | No production modules or contracts exist. |
| SourceIndex | READY | SPIKE-LOC-001 proves feasibility; exact ranges, pointers, duplicates, Unicode, malformed recovery, and strict JSON are evidenced. | Index model, builder, and adapter contracts require implementation. |
| Parser Adapter | READY | ADR-006 and production design define isolation, inputs, output intent, and noncanonical transformations. | Exact candidate-neutral contract and tests do not exist. |
| Scalar integration | READY | Pinned public API behavior and operational baseline are established across all supported versions. | Production wrapper, controlled resource handoff, error translation, and upgrade tests are absent. |
| Normalized domain model | PARTIALLY READY | ADR-003 and domain design define entities, invariants, minimum v0.1 projection, and test cases. | Exact TypeScript contracts, graph identifiers, partial-model contract, and package exports must be finalized. |
| Validation engine | PARTIALLY READY | ADR-007 defines hybrid authority and Scalar's bounded role. | Orchestrator contracts, execution state, partial-result policy, coverage tracking, and deduplication handoff are not implemented. |
| OAIT rules engine | PARTIALLY READY | Rule schema and 29-rule catalog define the logical model; known deterministic gaps are identified. | Executable registry/engine contracts, prerequisite semantics, configuration, and first rule implementations are absent. |
| Diagnostic adapters | PARTIALLY READY | ADR-008 defines boundaries, fields, correlation states, and failure distinctions. | Candidate-neutral TypeScript evidence contract, Scalar adapter, raw-metadata limits, and correlation service are absent. |
| Finding model | PARTIALLY READY | Rule schema, ADR-007/008, and domain/reporting relationships define ownership. | Canonical finding identity, evidence aggregation, deduplication, suppression, serialization, and error separation require executable contracts. |
| Reporting/output layer | NOT STARTED | System architecture identifies console, JSON, and Markdown outputs. | No stable analysis-result envelope, serializers, CLI output contract, or production package exists. |
| Testing infrastructure | NOT STARTED | Extensive spike fixtures and test requirements exist. | No root runner, workspace scripts, CI matrix, production fixture policy, coverage baseline, or architecture-contract enforcement exists. |

### 5.1 Readiness conclusion

The architecture is sufficiently mature to begin implementation. The repository is not yet implementation-ready as a buildable workspace. The first work must establish the monorepo and contract-testing foundation, followed by source truth. Semantic, validation, and user-facing work must not bypass that dependency order.

## 6. Recommended Repository Structure

The initial production structure should realize ADR-002 while avoiding premature package proliferation.

```text
openapi-intelligence-toolkit/
├── apps/
│   └── cli/
│       ├── src/
│       └── test/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── source/
│   │   │   ├── domain/
│   │   │   ├── diagnostics/
│   │   │   ├── findings/
│   │   │   └── errors/
│   │   └── test/
│   ├── parser/
│   │   ├── src/
│   │   │   ├── source/
│   │   │   │   ├── adapters/
│   │   │   │   ├── indexing/
│   │   │   │   ├── references/
│   │   │   │   └── diagnostics/
│   │   │   ├── scalar/
│   │   │   ├── normalization/
│   │   │   └── version/
│   │   └── test/
│   ├── validator/
│   │   ├── src/
│   │   │   ├── orchestration/
│   │   │   ├── scalar/
│   │   │   ├── diagnostics/
│   │   │   └── correlation/
│   │   └── test/
│   ├── rules/
│   │   ├── src/
│   │   │   ├── registry/
│   │   │   ├── engine/
│   │   │   └── conformance/
│   │   └── test/
│   └── reporting/
│       ├── src/
│       └── test/
├── test-data/
│   ├── source-processing/
│   ├── domain-model/
│   ├── validation/
│   └── regression/
├── tests/
│   ├── integration/
│   ├── architecture/
│   ├── regression/
│   └── performance/
├── experiments/
└── docs/
```

### 6.1 Boundary rationale

- `packages/core` owns stable candidate-neutral contracts and contains no dependency on parser or validator packages.
- `packages/parser` owns the cohesive source-processing subsystem, source adapters, Scalar Parser Adapter, version adapters, and normalization. A separate source package is deferred in accordance with `source-processing-design.md`.
- `packages/validator` owns provider execution, diagnostic adaptation, source correlation, and hybrid orchestration, but not stable OAIT rule semantics.
- `packages/rules` owns rule definitions, registry, deterministic execution, applicability, and conformance coverage.
- `packages/reporting` consumes stable result contracts and must not inspect candidate diagnostics directly.
- `apps/cli` remains thin and composes package APIs.
- Cross-package integration, architecture-contract, regression, and performance tests live at repository level; package-specific tests remain adjacent to each package.
- `experiments/` remains isolated and is never imported by production packages.

No package manager, test runner, formatter, linter, or build orchestrator is newly selected by this roadmap. The foundation epic must configure the technologies already authorized by repository decisions and separately review any still-unselected development tooling.

## 7. Dependency-Ordered Implementation Roadmap

### Phase 1 — Foundation

**Objective:** Establish a buildable TypeScript monorepo and stable cross-package contract discipline.

Deliverables:

- Root workspace and TypeScript configuration consistent with ADR-001 and ADR-002.
- Initial `core`, `parser`, `validator`, `rules`, and `reporting` package boundaries.
- Package dependency rules and public entry points.
- Production test-data policy and test execution skeleton.
- CI-ready commands for build, type-check, tests, and architecture checks.
- Common processing error/result primitives needed by Phase 2.

Exit criteria:

- A clean checkout can install, type-check, build, and execute placeholder package contract tests through documented root commands.
- `core` has no reverse dependency on capability packages.
- Experiments remain independently reproducible and outside production workspaces where necessary.

### Phase 2 — Source Intelligence

**Objective:** Implement the authoritative pre-transformation source boundary.

Deliverables:

- Source policy, immutable loader, format detection, and canonical URI handling.
- SourceDocumentRegistry and processing-session lifecycle.
- YAML and strict JSON source adapters.
- RFC 6901 encoder and SourceLocationIndex.
- Duplicate occurrence, range, Unicode, BOM, CRLF, and malformed-input behavior.
- `$ref` evidence collector and cycle-safe source-resource graph.
- Complete/partial/failed source-processing outcomes.

Exit criteria:

- Single-file and multi-file YAML/JSON inputs produce deterministic canonical identities, source ranges, pointers, occurrence evidence, and reference declarations.
- Denied, missing, malformed, recursive, and ambiguous cases remain visible without silent repair.

### Phase 3 — Semantic Processing

**Objective:** Produce the minimum version-aware normalized OAIT domain model from controlled source evidence.

Deliverables:

- Candidate-neutral Parser Adapter contract.
- Scalar integration using controlled admitted resources.
- Version detection and OAS 3.0/3.1/3.2 capability mapping.
- Normalized v0.1 document, operation, parameter, response, schema, tag, security, source, and reference-origin contracts.
- Version-aware operation discovery, including OAS 3.2 forms.
- Canonical schema preservation, dialect evidence, recursive reference identity, and partial-model diagnostics.

Exit criteria:

- Equivalent YAML and JSON produce equivalent logical models.
- Significant entities correlate to original SourceIndex evidence.
- Scalar types and transformed pointers do not appear in public/core contracts.

### Phase 4 — Validation Framework

**Objective:** Establish OAIT-owned conformance authority and bounded external evidence.

Deliverables:

- Validation Orchestrator and provider execution-result model.
- Bounded Scalar validation invocation.
- Candidate-neutral diagnostic evidence contract.
- Initial deterministic conformance engine and coverage registry.
- OAIT finding model with stable rule identity, severity, applicability, and provenance.
- Initial deterministic coverage for evidenced external gaps.
- Explicit separation of execution errors, diagnostics, rule results, and findings.

Exit criteria:

- Scalar diagnostics cannot become findings without adaptation and OAIT interpretation.
- Duplicate parameter identity and undeclared security requirements are deterministically evaluated.
- External provider failure does not become a conformance finding or silent pass.

### Phase 5 — Diagnostic Intelligence and Product Output

**Objective:** Complete source-rich evidence correlation and expose stable deterministic results through the first product interface.

Deliverables:

- Scalar Diagnostic Adapter.
- Exact, partial, ambiguous, and unavailable source-correlation behavior.
- Reviewed provider-to-OAIT rule mapping.
- Evidence aggregation, deduplication, suppression boundary, and unmapped-evidence policy.
- Console, JSON, and Markdown result serializers.
- Thin validation/review CLI workflow.
- Production regression, performance, dependency, and cross-platform qualification.

Exit criteria:

- Findings retain stable OAIT semantics while preserving bounded provider provenance.
- Output formats consume only candidate-neutral result contracts.
- The CLI can process supported single-file and multi-file inputs with deterministic exit and error behavior.

### Phase 6 — API Intelligence Features

**Objective:** Build higher-level intelligence only after source, semantic, finding, and output contracts are stable.

Deliverables:

- Semantic comparison inputs based on normalized identities and reference provenance.
- Change model and deterministic change detection.
- Breaking-change classification grounded in OAIT-owned semantics.
- Release-note data model and deterministic generation foundation.
- Regression fixtures for version pairs and referenced changes.

Exit criteria:

- Comparison never depends on raw candidate objects or canonical full dereference.
- Breaking-change evidence points to both relevant source versions.
- Release-note generation consumes stable change evidence rather than reparsing source independently.

Quality scoring, review, and additional reporting capabilities may be incrementally added after the Phase 4 rule/finding contracts stabilize. AI and MCP work remain outside this roadmap's immediate implementation critical path.

## 8. Engineering Epics

### Epic 1 — Establish the Production Monorepo Foundation

**Goal:** Create the buildable, testable package foundation required by every production capability.

**Scope:** Root workspace, TypeScript configuration, package boundaries, shared contracts, test layout, architecture checks, and documented commands.

**Dependencies:** ADR-001, ADR-002, accepted repository structure.

**Deliverables:** Root configuration; initial package manifests and entry points; common result/error primitives; test skeleton; CI-ready scripts.

**Acceptance criteria:** Clean-checkout build and type-check work; package direction is enforced; no experiment dependency leaks into production; no business feature is implemented in applications.

### Epic 2 — Implement Authoritative Source Processing

**Goal:** Establish immutable source truth, canonical document identity, and controlled resource acquisition.

**Scope:** Source policy, loader, registry, format detection, processing session, diagnostics, partial outcomes, and limits.

**Dependencies:** Epic 1; ADR-004; source-processing design.

**Deliverables:** Source-processing contracts and implementation; canonical URI handling; source error model; source policy tests.

**Acceptance criteria:** Only admitted resources load; source bytes remain unchanged; canonical resources register once; failures do not erase unrelated evidence.

### Epic 3 — Implement SourceIndex and Reference Evidence

**Goal:** Produce authoritative physical locations and reference provenance before third-party transformations.

**Scope:** YAML/JSON adapters, structural events, RFC 6901 encoding, ranges, occurrences, SourceLocationIndex, `$ref` collector, and source graph.

**Dependencies:** Epic 2; ADR-005; SPIKE-LOC-001.

**Deliverables:** Source adapters and indexes; duplicate-aware occurrences; reference graph; regression fixtures.

**Acceptance criteria:** YAML/JSON equivalence, pointer escaping, arrays, Unicode, CRLF/BOM, duplicate occurrences, malformed recovery, nested and recursive references behave as specified.

### Epic 4 — Implement Semantic Parsing and Normalization

**Goal:** Convert admitted OpenAPI sources into a candidate-neutral, version-aware domain model.

**Scope:** Parser Adapter contract, Scalar integration, version capabilities, v0.1 domain entities, reference origins, schema preservation, and partial normalization.

**Dependencies:** Epics 2 and 3; ADR-003; ADR-006; SPIKE-004/005.

**Deliverables:** Scalar Parser Adapter; normalizer; minimum model; model indexes; semantic contract tests.

**Acceptance criteria:** OAS 3.0/3.1/3.2 fixtures normalize correctly; OAS 3.2 operations are discovered; schemas retain dialect/unknown data; candidate types do not leak.

### Epic 5 — Implement Hybrid Validation and Rules

**Goal:** Create stable OAIT conformance behavior using bounded Scalar evidence and deterministic OAIT rules.

**Scope:** Validator Adapter, orchestrator, rule registry/engine, applicability, coverage tracking, finding model, and first conformance rules.

**Dependencies:** Epic 4; ADR-007; rule schema/catalog; SPIKE-006.

**Deliverables:** Validation execution contracts; deterministic engine; findings; coverage matrix; initial OAIT rules.

**Acceptance criteria:** Provider success is not treated as proof of conformance; known gaps are deterministically covered; rule IDs and severity remain OAIT-owned; failures and findings remain distinct.

### Epic 6 — Implement Diagnostic Adaptation and Correlation

**Goal:** Turn Scalar diagnostics into source-correlated, candidate-neutral evidence without leaking provider semantics.

**Scope:** Scalar adapter, neutral evidence, SourceIndex correlation, confidence states, raw metadata, mapping, unmapped evidence, and deduplication handoff.

**Dependencies:** Epics 3 and 5; ADR-008.

**Deliverables:** Diagnostic Adapter; correlation service; mapping tests; evidence aggregation.

**Acceptance criteria:** All four correlation states are represented; transformed paths are never canonicalized without evidence; provider codes/severity remain internal; message heuristics are bounded and tested.

### Epic 7 — Deliver Stable Output and CLI Workflows

**Goal:** Expose deterministic OAIT processing through stable machine- and human-readable outputs.

**Scope:** Result envelope, console/JSON/Markdown serializers, exit semantics, thin CLI composition, privacy-safe diagnostics.

**Dependencies:** Epics 5 and 6.

**Deliverables:** Reporting package; initial CLI validation/review workflow; output contract tests.

**Acceptance criteria:** Reports contain candidate-neutral findings and processing errors; deterministic ordering is stable; CLI contains no parser/rule business logic.

### Epic 8 — Production Hardening and Qualification

**Goal:** Qualify the implementation for repeatable interactive and CI use.

**Scope:** Performance, memory, resource limits, cancellation, safe reuse, dependency audit, license review, upgrade qualification, and platform CI.

**Dependencies:** Epics 1 through 7; SPIKE-007.

**Deliverables:** Regression/performance baselines; cross-platform matrix; dependency policy automation; operational runbooks.

**Acceptance criteria:** Current NFR targets are verified on representative production workflows; Linux/macOS/Windows are covered; dependency upgrades cannot bypass contract regression; sensitive source content is not logged by default.

### Epic 9 — Implement Semantic API Comparison

**Goal:** Add comparison, change classification, breaking-change analysis, and release-note evidence after the foundation stabilizes.

**Scope:** Version-pair processing, entity matching, change model, breaking classifications, and release-note inputs.

**Dependencies:** Epics 4, 5, and 7; relevant requirements and quality model.

**Deliverables:** Comparison contracts and engine; change evidence; breaking-change findings; deterministic release-note model.

**Acceptance criteria:** Both source versions remain traceable; comparison uses normalized concepts; reference movement does not create false semantic changes; outputs are deterministic.

## 9. Candidate Engineering Issues

The following are GitHub-style issue definitions. They are planning artifacts only and must not be created automatically.

### Epic 1 issues

#### Issue 1.1 — Scaffold the production TypeScript monorepo

**Description:** Create the root workspace and minimum package/application directories authorized by ADR-001 and ADR-002.

**Technical scope:** Root workspace metadata; shared TypeScript baseline; package manifests; public entry points; root build/type-check/test commands; exclusion or isolation of spike-local workspaces.

**Acceptance criteria:** A clean install succeeds; every production package type-checks independently and from the root; no production package imports from `experiments/`; documented commands are reproducible.

**Dependencies:** None beyond accepted ADRs.
**Complexity:** Medium

#### Issue 1.2 — Define package dependency and export boundaries

**Description:** Encode the allowed dependency graph and stable package entry points.

**Technical scope:** `core` dependency direction; parser/validator/rules/reporting dependencies; prohibition of deep candidate imports outside adapters; architecture contract checks.

**Acceptance criteria:** Invalid reverse dependencies fail an automated check; candidate packages are referenced only from designated integration modules; public exports are explicit.

**Dependencies:** Issue 1.1.
**Complexity:** Medium

#### Issue 1.3 — Establish production test and fixture conventions

**Description:** Create the root testing structure and a policy for promoting accepted spike evidence into production regression fixtures.

**Technical scope:** Unit, contract, integration, regression, and performance test locations; fixture provenance; golden-update policy; deterministic snapshots; no experiment imports.

**Acceptance criteria:** One representative test runs at each intended scope; fixture provenance is documented; stable and provider-specific goldens are separated.

**Dependencies:** Issue 1.1.
**Complexity:** Medium

#### Issue 1.4 — Define common processing results and error taxonomy

**Description:** Establish candidate-neutral result states and stage-specific error contracts used by source, parser, validator, and reporting layers.

**Technical scope:** Complete/partial/failed outcomes; source/parser/reference/validator-execution errors; bounded cause metadata; deterministic codes; no conformance finding conflation.

**Acceptance criteria:** Error categories are exhaustive for the production design; provider exceptions cannot cross core boundaries; serializers can distinguish processing errors from findings.

**Dependencies:** Issues 1.1 and 1.2.
**Complexity:** Medium

### Epic 2 issues

#### Issue 2.1 — Implement SourcePolicy and canonical URI handling

**Description:** Evaluate source access before loading and assign deterministic physical document identities.

**Technical scope:** Allowed roots; path and URI normalization; symlink-aware decision boundary; local/remote scheme policy; policy decision evidence.

**Acceptance criteria:** Outside-root and denied-scheme controls are rejected before load; equivalent resource identifiers deduplicate; policy decisions are testable and preserved.

**Dependencies:** Issues 1.2 and 1.4.
**Complexity:** Large

#### Issue 2.2 — Implement immutable SourceLoader and format detection

**Description:** Load admitted bytes without modification and determine the physical syntax path.

**Technical scope:** File acquisition; encoding/BOM handling; YAML/JSON detection; content fingerprint; size limits; source diagnostics.

**Acceptance criteria:** Original bytes remain available unchanged; malformed/unknown formats return structured errors; no candidate parser performs independent source acquisition.

**Dependencies:** Issue 2.1.
**Complexity:** Medium

#### Issue 2.3 — Implement SourceDocumentRegistry and processing session

**Description:** Track every admitted resource and processing state within one analysis session.

**Technical scope:** Canonical URI keys; source records; root identity; lifecycle; deduplication; partial failure retention; content metadata.

**Acceptance criteria:** A physical resource registers once; shared targets reuse one record; failure in one referenced source does not erase successful records.

**Dependencies:** Issue 2.2.
**Complexity:** Medium

### Epic 3 issues

#### Issue 3.1 — Implement RFC 6901 pointer and source-range primitives

**Description:** Provide OAIT-owned pointer encoding and explicit range/position semantics.

**Technical scope:** Root pointer; `~` and `/` escaping; array indices; UTF-16/code-unit offset policy consistent with adapters; line map; occurrence identifiers.

**Acceptance criteria:** Escaping and array tests match SPIKE-LOC-001; root is `""`; range end semantics are explicit; line/column remain derived presentation data.

**Dependencies:** Issues 1.4 and 2.2.
**Complexity:** Medium

#### Issue 3.2 — Implement YAML source adapter

**Description:** Convert `yaml` public node evidence into candidate-neutral structural events and diagnostics.

**Technical scope:** Mappings, sequences, flow/block forms, scalars, comments, anchors/aliases, duplicate keys, multi-document rejection policy, malformed recovery.

**Acceptance criteria:** Adapter types do not escape; accepted YAML fixtures produce exact ranges/pointers; aliases remain distinct from `$ref`; duplicates retain occurrence evidence.

**Dependencies:** Issue 3.1.
**Complexity:** Large

#### Issue 3.3 — Implement strict JSON source adapter

**Description:** Convert `jsonc-parser` tree/errors into structural evidence while enforcing standard JSON validity.

**Technical scope:** Tree traversal; strict comments/trailing-comma/empty-input policy; malformed recovery; duplicate occurrences; range mapping.

**Acceptance criteria:** Invalid JSON is never silently accepted; useful partial locations survive where supported; equivalent JSON/YAML structures yield equivalent pointers.

**Dependencies:** Issue 3.1.
**Complexity:** Large

#### Issue 3.4 — Implement SourceLocationIndex builder and lookup

**Description:** Build authoritative document URI + pointer indexes with physical occurrences.

**Technical scope:** Structural event consumption; root entry; logical lookup; occurrence lookup; presentation ranges; immutable result.

**Acceptance criteria:** Significant fixtures map deterministically; whitespace changes preserve pointers; duplicate declarations remain separately addressable; candidate AST types are absent.

**Dependencies:** Issues 3.2 and 3.3.
**Complexity:** Large

#### Issue 3.5 — Implement `$ref` evidence collection and source graph

**Description:** Capture reference declarations and controlled resource relationships before semantic transformation.

**Technical scope:** Literal declaration location; target descriptors; resolution status; hops; shared targets; cycles; denied/missing targets; traversal limits.

**Acceptance criteria:** Internal, external, nested, shared, recursive, invalid-fragment, missing-file, and denied-reference cases preserve evidence; traversal terminates.

**Dependencies:** Issues 2.3 and 3.4.
**Complexity:** Large

### Epic 4 issues

#### Issue 4.1 — Define candidate-neutral parser evidence contract

**Description:** Define the narrow semantic handoff between Scalar integration and OAIT normalization.

**Technical scope:** Declared version; candidate-neutral values; parser diagnostics; partial result; source/reference handles; optional transformation metadata isolation.

**Acceptance criteria:** No Scalar type appears in the contract; source identity is OAIT-owned; raw and transformed views are distinguishable; partial invariants are documented and tested.

**Dependencies:** Issues 1.4, 2.3, and 3.5.
**Complexity:** Large

#### Issue 4.2 — Implement the Scalar Parser Adapter

**Description:** Integrate the pinned Scalar parser through controlled inputs and translate results into parser evidence.

**Technical scope:** Public API invocation; admitted-resource handoff; lifecycle handling; error translation; version extraction; optional bundle isolation; dependency declaration containment.

**Acceptance criteria:** OAS 3.0/3.1/3.2 YAML/JSON parse; uncontrolled filesystem/network fetch is prevented; no Scalar runtime/type leaks; no automatic upgrade or sanitation occurs.

**Dependencies:** Issue 4.1.
**Complexity:** Large

#### Issue 4.3 — Define and implement v0.1 normalized domain contracts

**Description:** Turn the minimum model in `openapi-domain-model.md` into OAIT-owned TypeScript contracts and invariants.

**Technical scope:** Document/version/capabilities; info; operations; parameters/effective sets; requests/responses; schemas; tags; security; source/reference/raw handles.

**Acceptance criteria:** Required v0.1 entities exist; missing optional values remain missing; declared and effective views remain distinct; models expose no candidate types.

**Dependencies:** Issues 1.2 and 4.1.
**Complexity:** Large

#### Issue 4.4 — Implement version-aware normalization and operation discovery

**Description:** Build normalized entities and central operation discovery for OAS 3.0, 3.1, and 3.2.

**Technical scope:** Version capability map; fixed operations; 3.2 `query` and `additionalOperations`; exact method keys; origin/source evidence; partial diagnostics.

**Acceptance criteria:** SPIKE-004 cases pass; rules need no hard-coded raw operation traversal; YAML/JSON equivalents normalize equivalently.

**Dependencies:** Issues 4.2 and 4.3.
**Complexity:** Large

#### Issue 4.5 — Implement schema and reference-aware normalization

**Description:** Preserve schema semantics and graph identity without canonical full dereference.

**Technical scope:** OAS 3.0 `nullable`; 3.1/3.2 booleans and multi-types; dialects; canonical schema value; `$ref` siblings; recursion; external origins.

**Acceptance criteria:** SPIKE-005 gates are represented; unknown keywords survive; recursive models remain finite; original declaration and target provenance remain available.

**Dependencies:** Issues 4.3 and 4.4.
**Complexity:** Large

### Epic 5 issues

#### Issue 5.1 — Define validation execution and evidence contracts

**Description:** Define provider invocation, execution state, diagnostic collection, and hybrid orchestration inputs.

**Technical scope:** Validator Adapter; supported-version scope; success/failure/partial execution; timing metadata; candidate-neutral handoff.

**Acceptance criteria:** Execution failure is not a diagnostic; no-diagnostic success is not proof of conformance; provider identity/version is retained.

**Dependencies:** Issues 1.4 and 4.2.
**Complexity:** Medium

#### Issue 5.2 — Implement bounded Scalar validation provider

**Description:** Invoke Scalar validation as nonauthoritative evidence within the selected parser dependency family.

**Technical scope:** Controlled inputs; diagnostic capture; supported versions; repeated-work instrumentation; failure containment.

**Acceptance criteria:** SPIKE-006 valid/invalid controls are regression tested; five known false negatives remain explicit; provider output cannot directly create findings.

**Dependencies:** Issue 5.1.
**Complexity:** Medium

#### Issue 5.3 — Define OAIT rule registry, applicability, and coverage model

**Description:** Convert the proposed rule schema into executable OAIT-owned contracts.

**Technical scope:** Rule IDs; source class; severity; version applicability; target/prerequisite model; coverage states; deterministic ordering.

**Acceptance criteria:** All 29 catalog entries can be represented; unsupported/not-implemented differs from not-applicable; vendor codes are not OAIT IDs.

**Dependencies:** Issues 1.2 and 4.3.
**Complexity:** Large

#### Issue 5.4 — Implement deterministic rule execution engine

**Description:** Execute applicable rules against normalized concepts and source evidence.

**Technical scope:** Target enumeration; prerequisites; PASS/FAIL/NOT_APPLICABLE/SKIPPED/ERROR; stable evidence; failure isolation.

**Acceptance criteria:** Results are deterministic; one rule error does not silently pass or erase unrelated results; raw YAML/JSON traversal is prohibited in ordinary handlers.

**Dependencies:** Issue 5.3 and Epic 4.
**Complexity:** Large

#### Issue 5.5 — Implement initial deterministic conformance gaps

**Description:** Implement evidence-backed OAIT checks missed by the default external validator.

**Technical scope:** Duplicate parameter identity; undeclared security requirements; version-aware applicability; source evidence.

**Acceptance criteria:** SPIKE-006 controls fail under stable OAIT rule IDs with canonical source identity; no unsupported additional rule semantics are invented.

**Dependencies:** Issues 5.3 and 5.4.
**Complexity:** Medium

#### Issue 5.6 — Define finding and evidence aggregation model

**Description:** Establish the stable output of conformance interpretation before reporting.

**Technical scope:** Finding identity; rule/severity/applicability; canonical location; supporting evidence; duplicate aggregation; suppression boundary; deterministic ordering.

**Acceptance criteria:** Provider and deterministic evidence may support one finding without provenance loss; processing errors remain separate; finding contracts are provider neutral.

**Dependencies:** Issues 5.1, 5.3, and 5.4.
**Complexity:** Large

### Epic 6 issues

#### Issue 6.1 — Define candidate-neutral diagnostic evidence

**Description:** Implement the ADR-008 conceptual evidence fields as stable OAIT contracts.

**Technical scope:** Provider metadata; neutral location evidence; optional raw metadata; correlation state; unmapped status; privacy limits.

**Acceptance criteria:** Missing data remains absent; raw provider objects cannot leak; source excerpts are not retained by default; four correlation states are representable.

**Dependencies:** Issues 1.4 and 5.1.
**Complexity:** Medium

#### Issue 6.2 — Implement Scalar Diagnostic Adapter

**Description:** Translate Scalar diagnostics into candidate-neutral evidence.

**Technical scope:** Structured codes/paths/messages; sparse location handling; version-sensitive contract tests; bounded message fallback only where justified.

**Acceptance criteria:** Known diagnostic shapes adapt without public Scalar types; message heuristics are internal and conservative; unknown shapes produce adapter errors or unmapped evidence without fabricated values.

**Dependencies:** Issues 5.2 and 6.1.
**Complexity:** Medium

#### Issue 6.3 — Implement SourceIndex diagnostic correlation

**Description:** Correlate candidate-neutral location evidence to canonical source identity.

**Technical scope:** Resource/path normalization; pointers/object paths; referenced documents; transformed paths; duplicate occurrences; exact/partial/ambiguous/unavailable outcomes.

**Acceptance criteria:** Exact requires one supported URI+pointer; ambiguity is never resolved arbitrarily; transformed pointers remain provider evidence unless mapped through OAIT provenance.

**Dependencies:** Issues 3.4, 3.5, and 6.1.
**Complexity:** Large

#### Issue 6.4 — Implement diagnostic-to-rule mapping and deduplication handoff

**Description:** Map reviewed external evidence to OAIT rules and aggregate it with deterministic evidence outside the adapter.

**Technical scope:** Mapping registry; unmapped behavior; evidence equivalence; deduplication keys; provenance retention.

**Acceptance criteria:** Adapters do not assign final rule meaning; unmapped evidence gets no invented ID; duplicate evidence produces stable findings with both provenance sources.

**Dependencies:** Issues 5.3, 5.6, 6.2, and 6.3.
**Complexity:** Large

### Epic 7 issues

#### Issue 7.1 — Implement stable analysis result envelope

**Description:** Define the candidate-neutral aggregate returned to applications.

**Technical scope:** Processing outcome; findings; rule coverage; unmapped evidence policy; execution errors; document metadata; deterministic ordering.

**Acceptance criteria:** Applications need no parser/validator imports; partial results are explicit; serialization has a versioned OAIT contract.

**Dependencies:** Issues 5.6 and 6.4.
**Complexity:** Medium

#### Issue 7.2 — Implement console, JSON, and Markdown reporting

**Description:** Render analysis results without changing semantics.

**Technical scope:** Stable JSON; human-readable console/Markdown; source locations; privacy-safe errors; deterministic order.

**Acceptance criteria:** All formats represent the same finding identities and severities; JSON is machine stable; locationless findings remain representable.

**Dependencies:** Issue 7.1.
**Complexity:** Medium

#### Issue 7.3 — Implement the initial thin CLI workflow

**Description:** Compose source processing, semantic parsing, validation, rules, and reporting through a user-facing command.

**Technical scope:** Input/config handoff; cancellation/process signals; exit codes; output selection; no domain business logic.

**Acceptance criteria:** Supported local single/multi-file inputs run end to end; processing failure and conformance failure have documented exit behavior; CLI imports package APIs only.

**Dependencies:** Issue 7.2 and completed Epics 2–6.
**Complexity:** Large

### Epic 8 issues

#### Issue 8.1 — Establish production performance and memory baselines

**Description:** Adapt SPIKE-007 workloads to complete production workflows.

**Technical scope:** Cold/warm runs; single/multi-file; parse/index/normalize/validate/rules/report stages; peak memory; failure paths.

**Acceptance criteria:** Baselines are reproducible; failed or non-equivalent work is not credited; regressions have reviewed thresholds.

**Dependencies:** Epic 7.
**Complexity:** Medium

#### Issue 8.2 — Evaluate safe intermediate reuse

**Description:** Determine whether source, parser, or validator intermediates can avoid repeated work without weakening correctness.

**Technical scope:** Processing-session cache candidates; invalidation inputs; lifecycle/memory; Scalar load/validate behavior.

**Acceptance criteria:** Any reuse preserves source policy, candidate behavior, diagnostics, and deterministic output; no cache technology is selected without separate need.

**Dependencies:** Issue 8.1.
**Complexity:** Medium

#### Issue 8.3 — Add cross-platform and dependency qualification

**Description:** Establish Linux, macOS, and Windows verification plus dependency/security review.

**Technical scope:** CI matrix; lockfile audit; licenses; TypeScript declaration regression; parser/validator upgrade workflow.

**Acceptance criteria:** Supported platforms pass core suites; known declaration constraints are explicit; upgrades rerun accepted semantic and FP/FN controls.

**Dependencies:** Epic 7.
**Complexity:** Medium

#### Issue 8.4 — Add resource, privacy, and operational guardrails

**Description:** Bound untrusted-input processing and prevent sensitive source leakage.

**Technical scope:** Size/document/reference/diagnostic limits; timeouts/cancellation; logging policy; raw metadata bounds; optional external-process controls.

**Acceptance criteria:** Limit failures are structured and deterministic; source content is not logged by default; no candidate bypasses access policy.

**Dependencies:** Epics 2–7.
**Complexity:** Large

### Epic 9 issues

#### Issue 9.1 — Define normalized change and comparison contracts

**Description:** Establish stable entity matching and change evidence between two normalized documents.

**Technical scope:** Entity identity; before/after source provenance; additions/removals/modifications; unresolved/partial models.

**Acceptance criteria:** Reference movement without semantic change can be distinguished; both source locations remain available; candidate types are absent.

**Dependencies:** Epic 4 and Issue 7.1.
**Complexity:** Large

#### Issue 9.2 — Implement deterministic change detection

**Description:** Compare normalized documents and emit stable change records.

**Technical scope:** Operations, parameters, requests, responses, schemas, security; ordering and reference provenance.

**Acceptance criteria:** Version-pair fixtures produce reproducible change sets; YAML/JSON representation differences do not create changes.

**Dependencies:** Issue 9.1.
**Complexity:** Large

#### Issue 9.3 — Implement breaking-change classification

**Description:** Classify reviewed changes using OAIT-owned deterministic policies.

**Technical scope:** Applicability, severity, evidence, rule/change identity, unknown/partial handling.

**Acceptance criteria:** Breaking classifications are explainable and source-traceable; partial evidence is not silently classified as safe.

**Dependencies:** Issue 9.2 and rule/finding contracts.
**Complexity:** Large

#### Issue 9.4 — Implement deterministic release-note evidence generation

**Description:** Transform stable change evidence into categorized release-note input.

**Technical scope:** Categories; summaries based on deterministic fields; migration evidence; stable serialization.

**Acceptance criteria:** Generation consumes change records rather than reparsing; output retains links to before/after evidence; no AI dependency is required.

**Dependencies:** Issue 9.3 and reporting contracts.
**Complexity:** Medium

## 10. First Implementation Milestone

### Milestone: M1 — Authoritative Source Foundation

**Goal:** Produce the first buildable production workspace and an authoritative, tested source-processing result for single-file and multi-file YAML/JSON inputs.

### 10.1 First issues

1. Issue 1.1 — Scaffold the production TypeScript monorepo.
2. Issue 1.2 — Define package dependency and export boundaries.
3. Issue 1.3 — Establish production test and fixture conventions.
4. Issue 1.4 — Define common processing results and error taxonomy.
5. Issue 2.1 — Implement SourcePolicy and canonical URI handling.
6. Issue 2.2 — Implement immutable SourceLoader and format detection.
7. Issue 2.3 — Implement SourceDocumentRegistry and processing session.
8. Issue 3.1 — Implement RFC 6901 pointer and source-range primitives.
9. Issue 3.2 — Implement YAML source adapter.
10. Issue 3.3 — Implement strict JSON source adapter.

Issues 3.4 and 3.5 complete the broader Source Intelligence phase immediately after this milestone if they do not fit the first delivery boundary.

### 10.2 Expected outcome

At milestone completion:

- The repository is a buildable TypeScript monorepo.
- Core/source contracts are candidate neutral.
- Source access is policy controlled.
- Admitted YAML and JSON remain immutable.
- Canonical document identities, structural pointers, source ranges, and duplicate occurrences are available.
- Malformed inputs produce structured source errors and partial evidence where supported.
- No Scalar integration, rule engine, CLI feature, AI, or MCP implementation has bypassed source truth.

## 11. Risk Register

| Risk | Evidence/impact | Mitigation |
| --- | --- | --- |
| Workspace design drifts from ADR-002 | No production workspace exists; the aspirational tree could be copied mechanically. | Begin with cohesive minimum packages, enforce dependency direction, keep apps thin, and defer package proliferation. |
| Source identity mistakes become systemic | Findings, fixes, diff, and overlays depend on stable identity. | Implement URI/pointer/range primitives first; promote SPIKE-LOC-001 fixtures; make source invariants contract tests. |
| Duplicate or malformed syntax is collapsed | Canonical pointer alone cannot identify duplicate physical occurrences. | Preserve occurrence/range evidence and explicit partial/ambiguous states; never silently repair. |
| Filesystem/network policy bypass | Candidate default loaders may traverse outside the intended root or fetch remote content. | Admit and register resources before candidate use; test traversal, symlinks, schemes, hosts, and denied references. |
| Scalar dependency/API changes | Pinned baseline has declaration issues and candidate output may evolve. | Isolate behind adapters; pin versions; maintain contract fixtures; qualify upgrades before lockfile changes. |
| Parser semantics leak into the domain model | Replacement and version behavior become coupled to Scalar. | Keep candidate-neutral parser evidence and core contracts; add import-boundary and replacement tests. |
| Over-normalization loses schema/version meaning | Future diff and rules may need fields omitted by a narrow projection. | Preserve canonical schema values, version capabilities, unknown fields, raw handles, and reference origin. |
| Full dereference creates cycles or provenance loss | Recursive schemas can create cyclic objects and transformed pointers. | Preserve graph identities and edges; make optional transformation views bounded and noncanonical. |
| External validation gaps become silent passes | Scalar missed five tested invalid cases. | Track coverage explicitly; implement deterministic gaps; never equate provider success with conformance. |
| Diagnostic mapping fabricates certainty | Scalar source metadata is sparse and transformed paths may be noncanonical. | Implement four correlation states; require evidence for exact mapping; retain ambiguity and absence. |
| Rule/finding contracts diverge | Proposed rule schema is not executable and multiple evidence paths can duplicate findings. | Define registry, evidence, and finding contracts before implementing the catalog; centralize deduplication. |
| Repeated parsing increases latency/memory | SPIKE-007 found possible repeated load/validate work and high experimental RSS. | Instrument complete workflows; evaluate safe session reuse only after correctness contracts exist. |
| macOS-only operational confidence | Linux and Windows remain unqualified. | Add cross-platform contract/regression CI before v0.1 release qualification. |
| Dependency/security state changes | Audit and licenses are time sensitive. | Pin lockfiles; automate audit/license inventory; review transitive changes; retain adapters as containment boundaries. |
| Architecture drift during feature pressure | Comparison, AI, or CLI work could directly traverse raw documents. | Gate higher-level epics on normalized model/finding contracts; add architecture tests and PR checklist evidence. |

## 12. Testing Roadmap

### 12.1 Unit tests

Unit tests must cover deterministic OAIT-owned behavior:

- URI canonicalization and source policy.
- RFC 6901 encoding and root pointer.
- Source ranges and line/column conversion.
- Duplicate occurrences and logical-versus-physical identity.
- Source Registry and graph traversal.
- Version capabilities and normalized invariants.
- Rule applicability and execution states.
- Correlation-state selection.
- Finding identity, aggregation, severity, and ordering.

### 12.2 Adapter contract tests

Adapter contract tests isolate dependency-specific behavior:

- `yaml` and `jsonc-parser` structural/range/error contracts.
- Scalar parser input/output/error behavior.
- Scalar validation diagnostic shapes and known gaps.
- Scalar Diagnostic Adapter structured extraction and conservative fallback.
- Candidate-type leakage checks.
- Pinned-version and upgrade qualification.

### 12.3 Integration tests

Integration tests must exercise layer boundaries:

- Source admission through normalized model.
- Single-file and multi-file reference graphs.
- Parser plus SourceIndex correlation.
- External evidence plus deterministic rules.
- Diagnostic adaptation through finding generation.
- Complete, partial, and failed workflows.
- Reporting and CLI exit behavior.

### 12.4 Golden fixture tests

Stable golden artifacts should cover:

- SourceLocationIndex and reference graph.
- Candidate-neutral normalized model.
- Candidate-neutral diagnostic evidence.
- OAIT findings and result envelopes.
- JSON/Markdown reports where deterministic.

Provider-specific details belong in adapter goldens, not public result goldens. Goldens must have an explicit review/update process and must not obscure semantic assertions.

### 12.5 Regression tests mapped to spikes

| Evidence source | Production regression obligation |
| --- | --- |
| SPIKE-004 | Traditional operations, OAS 3.2 `query`, `additionalOperations`, exact additional method keys, `querystring`, referenced Path Items, cross-version controls. |
| SPIKE-005 | OAS 3.0 `nullable`, 3.1/3.2 booleans and multi-types, dialects, `$schema`, unknown keywords, `$ref` siblings, composition, external schemas, and recursion. |
| SPIKE-006 | Accepted valid controls, known FP/FN cases, duplicate parameters, duplicate `operationId`, undeclared security requirements, referenced-target violations, diagnostic identity/location, and unsupported-version behavior. |
| SPIKE-007 | Small/medium/large, single/multi-file, recursive, malformed/unresolved, cold/warm, repeated work, memory, headless operation, and platform qualification. |

SPIKE-LOC-001 additionally supplies foundational source-index regression cases for Unicode, LF/CRLF, BOM, duplicates, aliases, comments, malformed recovery, strict JSON, pointer escaping, and exact ranges.

### 12.6 Architecture contract tests

Architecture tests must verify:

- `core` does not import parser, validator, rules, reporting, or candidate packages.
- Candidate dependencies are imported only inside their designated adapters.
- Rules consume normalized concepts rather than raw YAML/JSON or Scalar structures.
- Reporting consumes only OAIT result contracts.
- Applications contain composition and interface logic, not duplicated domain behavior.
- Experiments are not production dependencies.
- Full dereference is not used as canonical model construction.

### 12.7 Nonfunctional qualification

- Reproducible performance and memory baselines.
- Resource-limit and cancellation tests.
- Filesystem/network security boundary tests.
- Privacy-safe logging tests.
- Linux, macOS, and Windows CI.
- Dependency/license/audit review.
- Determinism checks across repeated and reordered execution.

## 13. Immediate Next Actions

1. Review and accept this implementation roadmap as the execution backlog basis.
2. Create the M1 milestone: **Authoritative Source Foundation**.
3. Create and order Issues 1.1 through 3.3 from Section 10; do not create feature-layer issues as immediate work.
4. Implement Issue 1.1 as the first production change, preserving experiment isolation.
5. Establish package dependency checks and fixture conventions before source implementation spreads across modules.
6. Promote SPIKE-LOC-001 evidence into production-owned regression fixtures through copying/provenance, not imports from experiments.
7. Complete source admission, registry, pointer/range, YAML, and JSON contracts before integrating Scalar.
8. Schedule SourceLocationIndex and reference-graph completion immediately after M1.
9. Begin Scalar/domain implementation only after the source-processing exit criteria pass.
10. Defer comparison, AI, MCP, caching technology, service topology, and additional validators until their architectural prerequisites are met.

## 14. Roadmap Definition of Done

This roadmap is ready to drive issue creation when reviewers confirm that:

- The actual repository state is distinguished from the aspirational structure.
- Every accepted ADR-003 through ADR-008 boundary is preserved.
- Implementation order follows source truth, semantic normalization, conformance, diagnostics, and output dependencies.
- Each epic has a goal, scope, dependencies, deliverables, and acceptance criteria.
- Candidate issues have technical scope, acceptance criteria, dependencies, and complexity.
- The first milestone is independently valuable and contains 5–10 ordered issues.
- Testing maps back to SPIKE-004 through SPIKE-007 and source-location evidence.
- No new dependency, tool, parser, validator, cache, service, AI, or MCP decision is introduced.
- No production code, ADR, spike, experiment, or GitHub issue is created by this planning activity.

## 15. Final Execution Principle

> **Establish authoritative source evidence first, then build semantic and conformance intelligence on candidate-neutral contracts.**
