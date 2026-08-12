# YAML source adapter

`@oait/parser` owns the initial YAML adapter and its pinned `yaml@2.8.3`
dependency. ADR-005 selected this library and version from SPIKE-LOC-001 evidence;
Issue #37 does not select another parser technology. `@oait/core` remains
candidate-neutral and has no YAML dependency.

## Boundary

`parseYamlSource(loadedSource)` accepts an authoritative `LoadedSource` already
acquired and admitted by OAIT. The adapter invokes the documented public
`parseAllDocuments` API with YAML 1.2, strict parsing, unique-key checks, and
candidate pretty errors disabled.

The adapter performs no file or network access, reference resolution, OpenAPI
interpretation, schema processing, validation, indexing, or JSON parsing.

## Public result

`ParsedYamlSource` deliberately contains only:

- canonical source identity;
- representation (`yaml`);
- supported document count (`1`);
- whether the document has content.

This result establishes that the source passed the current YAML syntax and
single-document boundary. It does not expose a generic JavaScript value because
conversion would lose YAML source evidence and prematurely define semantic
behavior. It does not expose `yaml` documents, nodes, ranges, warnings, errors, or
other candidate types. Future structural traversal and SourceIndex work must extend
the adapter through separately reviewed OAIT-owned contracts.

An empty stream contains zero candidate documents and is unsupported, consistent
with the authoritative loader's existing empty-source rejection. An explicit YAML
null scalar is a valid document and produces `hasContent: true`. Multiple YAML
documents are currently an unsupported representation.

## Error translation

- `parser.invalid_yaml`: the candidate returned one or more structured syntax errors.
- `parser.unsupported_yaml_representation`: the loaded format is not YAML or the
  stream does not contain exactly one document.
- `parser.execution_failed`: candidate invocation threw unexpectedly.

Errors use OAIT `ProcessingResult` and `ProcessingError`. Candidate exceptions and
diagnostics remain inside the adapter. Optional cause evidence is bounded to scalar
`name` and `code`; candidate messages, stacks, node types, and error objects do not
cross the boundary.
