# Processing results and error taxonomy

## Purpose

`@oait/core` owns the candidate-neutral contracts used to report whether an OAIT
processing operation completed, retained safe partial work, or failed. These
contracts describe processing-system outcomes. They do not describe OpenAPI
conformance and must not be used as findings.

## Result contract

`ProcessingResult<T>` is a discriminated union:

| Status | Value | Errors | Meaning |
| --- | --- | --- | --- |
| `complete` | Required | Empty | The operation produced its complete contractually valid value. |
| `partial` | Required | At least one | The operation produced a value whose documented partial invariants remain safe. |
| `failed` | Absent | At least one | The operation could not produce a usable value. |

Callers branch on `status`; exceptions are not the primary domain result model.
The contract deliberately contains no timestamps, provider results, diagnostics,
findings, source-document structures, or serialization envelope.

## Error taxonomy

Every `ProcessingError` has an OAIT-owned category, stage, deterministic namespaced
code, user-safe message, and optional bounded cause metadata.

| Category | Owner and boundary |
| --- | --- |
| `configuration` | The package interpreting OAIT configuration creates errors for invalid or conflicting settings. |
| `source` | The source-processing owner creates errors for admission, access, decoding, format, syntax, policy, or source-limit failures. |
| `parser` | The parser package translates semantic-parser invocation, output-shape, and normalization-input failures. |
| `reference` | The source/reference owner creates errors for missing or denied targets, invalid fragments, schemes, or resolution limits. |
| `validator_execution` | The validator package translates failures to obtain external validation evidence. It never converts them into conformance findings. |
| `internal` | The package detecting an unexpected OAIT invariant or implementation failure creates the error; public messages must not expose sensitive internals. |

Codes use `<category>.<stable-name>`, for example `source.unreadable`. Code names
are stable OAIT identifiers, not provider codes. Detailed code catalogs remain
with the feature that owns them and are added only when that behavior is built.

## Ownership and propagation

- `@oait/core` owns only the shared types and category vocabulary.
- Capability packages create errors in the category they own and return them in a
  `ProcessingResult`; they do not require consumers to deep-import implementations.
- Adapters catch dependency exceptions at their boundary. They may copy only safe
  scalar `name`, `code`, and `message` values into `ProcessingErrorCause`.
- Raw exceptions, stacks, arbitrary provider metadata, candidate types, and
  candidate diagnostics never cross the adapter as shared errors.
- Provider diagnostics remain bounded evidence. OAIT findings remain separately
  owned conformance conclusions. Neither is a `ProcessingError`.
- A `partial` result is permitted only when its producing contract documents safe
  partial invariants and its consumer explicitly accepts them.
- Unexpected thrown values are caught by the nearest owning boundary and translated
  to an appropriate category; uncaught programming faults may still terminate the
  process, but are not a substitute for the result contract.

Future source evidence or serialized result envelopes must extend these contracts
through separately reviewed public types. They must not add candidate-specific
fields or weaken the complete/partial/failed invariants.
