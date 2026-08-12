# Source document registry and processing session

`@oait/core` owns an in-memory registry containing one authoritative loaded source
for each canonical physical document URI during one processing session. The registry
does not load, parse, index, traverse, or resolve sources.

## Registered document

The registry reuses Issue #34's immutable `LoadedSource` directly. It already
preserves canonical and requested identity, format, source text, original bytes,
byte length, content hash, BOM evidence, and admission evidence. Introducing a
second `SourceDocument` record now would duplicate authoritative bytes or add
speculative parser/index lifecycle fields.

Future indexes and parse state must remain separately owned and must not mutate the
registered `LoadedSource`.

## Registration behavior

Canonical URI is the registry key and exact identity rule. Registration is
first-write authoritative:

- A new URI registers the supplied `LoadedSource`.
- The same URI and content hash is idempotent. Registration returns the existing
  authoritative record and does not add or replace an entry.
- The same URI with a different content hash returns
  `source.document_conflict`; the original record remains authoritative.
- A mutable, denied, or identity-inconsistent source returns
  `source.invalid_registration` and changes no state.

Registry operations use `ProcessingResult` for expected conflicts. No operation
performs implicit loading or catches platform/candidate exceptions because no I/O
or candidate code exists at this boundary.

## Lookup, enumeration, and immutability

Lookup and membership use exact `CanonicalSourceUri` equality. Enumeration returns
a new frozen array sorted lexicographically by canonical URI, independent of
registration order. Callers never receive the internal map or a mutable collection,
and an earlier enumeration snapshot does not change after later registrations.

Production callers are expected to register `LoadedSource` values produced by
`SourceLoader`. The registry validates only its owned registration invariants:
the object and admission evidence are frozen, admission succeeded, and document
identity matches evaluated identity. Because `LoadedSource` is a structurally public
TypeScript interface, these checks do not establish runtime provenance for an
arbitrary structurally supplied object. The registry does not create additional
full-source copies.

## Processing session

`createSourceProcessingSession(entryDocumentUri)` creates a frozen session boundary
with one entry-document identity and a new private registry. There is no session ID,
timestamp, global registry, singleton, persistence, cache, diagnostic collection,
reference graph, parser output, or workflow state. Two sessions using the same entry
URI cannot observe each other's registrations.

Future SourceIndex and reference components may be coordinated by this lifecycle,
but require separately reviewed contracts.
