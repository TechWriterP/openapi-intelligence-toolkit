# Source loader and format detection

`@oait/core` provides the first controlled source-acquisition boundary. The file
loader canonicalizes a requested identifier, evaluates `SourcePolicy`, establishes
real-path evidence when required, and only then reads source bytes. It does not
register documents, resolve references, parse YAML or JSON, or interpret OpenAPI.

## Supported acquisition

The initial implementation supports local `file:` resources only. A remote URI may
be admitted by policy for a future loader, but the file loader returns
`source.unsupported_acquisition` without issuing a network request. No candidate
parser receives authority to acquire sources independently.

Symlink-aware loading rejects scheme and path-form violations before acquisition.
When policy requires real-path evidence, the loader resolves the path, canonicalizes that
identity, repeats containment evaluation, and reads only after admission succeeds.
Callers must provide an explicit base URI for relative identifiers; the current
working directory is never an implicit identity source.

Every loader has a required positive `maxSourceBytes` limit. Files exceeding it
return a structured source error. This is a retained-content bound, not a promise
that the platform performs no temporary allocation while reading; streaming and
broader workflow limits remain future work.

## Immutable representation

A successful `LoadedSource` preserves:

- canonical physical document identity;
- requested identifier and admission evidence;
- original UTF-8 bytes and byte length;
- decoded source text, including an initial UTF-8 BOM;
- BOM presence, detected representation, and SHA-256 content fingerprint.

The object and admission evidence are frozen. Original bytes are held privately,
and `bytes()` returns a new defensive copy on every call. The SHA-256 fingerprint
supports reproducibility and mutation detection but does not replace URI identity.

Only strict UTF-8 is accepted. Empty input and undecodable bytes produce structured
errors; source bytes are never sanitized or rewritten.

## Format detection

Detection identifies a representation path, not semantic validity:

- `.json` and `.jsonc` identify the JSON path;
- `.yaml` and `.yml` identify the YAML path;
- leading `{` or `[` identifies JSON when no known extension exists;
- YAML document/directive markers identify YAML when no known extension exists;
- other content is `unknown` and loading fails with `source.unsupported_format`.

Malformed content with a recognized representation remains assigned to that path;
future syntax adapters own detailed YAML or JSON diagnostics. No OpenAPI fields are
inspected.
