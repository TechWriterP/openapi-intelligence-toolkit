# JSON source adapter

`@oait/parser` owns the strict JSON adapter and its pinned
`jsonc-parser@3.3.1` dependency. ADR-005 selected this library and version from
SPIKE-LOC-001 evidence. `@oait/core` remains candidate-neutral and has no JSON
parser dependency or parser-specific contract.

## Selected approach

`parseJsonSource(loadedSource)` accepts an authoritative `LoadedSource` already
acquired and admitted by OAIT. It invokes the documented public `parseTree` API
with comments disallowed, trailing commas disallowed, and empty input disallowed.
This enforces standard JSON syntax without using the YAML grammar as a substitute.

The adapter performs no file or network access, reference resolution, OpenAPI
interpretation, schema processing, validation, indexing, or YAML parsing.

## Public result

`ParsedJsonSource` contains only:

- canonical source identity;
- representation (`json`);
- document count (`1`);
- content presence (`true` for every valid JSON value, including `null`).
- an immutable candidate-neutral structural event sequence.

The immutable result establishes syntax state and structural evidence. It does not expose
a converted JavaScript object because that would prematurely define value semantics
and discard source evidence. Candidate AST nodes, node kinds, offsets, ranges,
parse errors, and other `jsonc-parser` types terminate inside the adapter.

## Structural mapping

The adapter walks candidate nodes internally and emits frozen OAIT-owned evidence
for document, object, property, array, item, and scalar structures. Scalar evidence
may contain only JSON primitives: string, number, boolean, or null. No generic
object model is returned.

Every event carries an RFC 6901 `JsonPointer` created by `@oait/core`. Object keys
become string segments, array positions become numeric segments, and core owns `/`
and `~` escaping. Each event also carries an immutable, end-exclusive UTF-16
`SourceRange` created by core. Properties retain key and available value ranges;
items retain their value range.

Duplicate properties are not collapsed. They produce separate physical property
and value events with the same logical pointer and distinct ranges. No occurrence
identifier or SourceIndex is introduced here.

When `jsonc-parser` returns a recoverable tree with syntax errors, the adapter
returns a `partial` `ProcessingResult`: safe tree evidence is retained and
`parser.invalid_json` remains explicit. An absent tree is a failed result. Candidate
error offsets and lengths stay private.

Future SourceIndex construction, occurrence identifiers, presentation positions,
diagnostic correlation, and equivalence orchestration with YAML remain deferred.

## Error translation

- `parser.invalid_json`: syntax is invalid, input is empty, or strict JSON rejects
  a comment or trailing comma.
- `parser.unsupported_json_representation`: `LoadedSource.format` is not `json`.
- `parser.execution_failed`: candidate invocation threw unexpectedly.

Errors use OAIT `ProcessingResult` and `ProcessingError`. Candidate diagnostics and
exceptions do not escape. Structured parse errors contribute only their numeric
code converted to bounded scalar cause metadata; offsets, lengths, messages, stacks,
AST nodes, and error objects remain private to the adapter.
