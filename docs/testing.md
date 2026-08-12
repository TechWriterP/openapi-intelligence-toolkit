# Production testing and fixture conventions

OAIT production tests use the Node.js built-in test runner. The repository-owned
discovery script scans only `apps/`, `packages/`, and `tests/`; experimental tests
and dependencies are never part of `npm test`.

## Test locations

| Scope | Location | Purpose |
| --- | --- | --- |
| Unit | `<workspace>/test/**/*.test.mjs` | Isolated OAIT-owned behavior adjacent to its owner |
| Adapter contract | Owning package's `test/contract/**/*.test.mjs` | Pinned candidate or adapter boundary behavior |
| Integration | `tests/integration/**/*.test.mjs` | Cross-package and complete workflow behavior |
| Architecture | `tests/architecture/**/*.test.mjs` | Repository and dependency invariants |
| Regression | `tests/regression/**/*.test.mjs` | Reproduction of an accepted defect or spike obligation |
| Performance | `tests/performance/**/*.test.mjs` | Reviewed workloads and explicit performance baselines |

Test files use the suffix `.test.mjs`. Name tests by observable behavior, not an
implementation method. A package-local test may import only its package's public
API or its own source under test. Cross-package tests use public package roots.

`npm test` discovers the scopes above in stable path order and fails if no tests
are found. The initial tests are foundation smoke tests, not production feature
tests. Future packages may add package-specific commands only when independently
running that package provides real value; the root command remains authoritative.

## Fixture layout

Shared deterministic inputs live under `test-data/`:

```text
test-data/
├── source-processing/
├── domain-model/
├── validation/
└── regression/
    ├── stable/
    └── provider-specific/
```

Use a directory for a multi-file API, keeping its entry document and referenced
files together. Use lowercase kebab-case names that describe the behavior. Put
malformed inputs in the owning capability directory and identify the intended
failure in provenance; do not “fix” malformed evidence during loading.

Every promoted fixture must include provenance in an adjacent
`<fixture-name>.provenance.json` file or, for a multi-file directory, in
`provenance.json`. Record at least:

- a stable fixture identifier and purpose;
- origin (`authored`, an issue, or an accepted spike and case identifier);
- applicable OpenAPI version and expected test scope;
- whether content was copied, reduced, or independently reconstructed;
- expected observable behavior, without candidate-internal types;
- the reviewed date and any relevant license or attribution.

Fixtures must be self-contained, deterministic, free of secrets, and independent
of wall-clock time, machine paths, uncontrolled network access, and environment
state. Preserve meaningful encoding, BOM, newline, whitespace, and malformed-byte
properties. Tests must not rewrite source fixtures.

## Goldens and regression evidence

Candidate-neutral outputs belong in `test-data/regression/stable/`.
Provider-specific diagnostic shapes and other adapter evidence belong in
`test-data/regression/provider-specific/<provider>/`; they must never be treated
as stable OAIT contracts.

Goldens are reviewed artifacts, not automatically refreshed snapshots. An update
must explain the semantic change, update provenance, and be reviewed with the code
that consumes it. Prefer focused semantic assertions when a complete golden would
hide the behavior being tested. Generated timestamps, absolute paths, unstable
ordering, and machine-specific values are prohibited.

Experimental fixtures are evidence sources, not production fixtures. Promote only
the smallest required case by copying or reconstructing it under `test-data/`,
recording provenance, and adding production assertions. Production tests and
fixtures must never import or read directly from `experiments/`.
