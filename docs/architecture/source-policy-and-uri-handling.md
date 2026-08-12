# Source policy and canonical URI handling

`@oait/core` owns candidate-neutral source identity and admission contracts.
Canonicalization and policy evaluation are pure operations: they do not read files,
resolve symbolic links, fetch network resources, resolve references, or register
documents.

## Canonical identity

`CanonicalSourceUri` is an absolute URI without a fragment. The canonicalizer:

- resolves relative identifiers only against an explicit canonical base URI;
- converts absolute POSIX, Windows drive, and UNC paths to `file:` URIs;
- removes URI dot segments through standard URL resolution;
- normalizes schemes, hosts, Windows drive letters, percent escapes, and default ports;
- encodes path data without using the current working directory;
- rejects fragments and file-URI query or credential data.

Identity comparison is exact equality between canonical strings. Physical document
identity excludes a JSON Pointer fragment; reference-target identity remains future
reference-handling work.

The utility is syntax-based and deliberately does not consult platform filesystem
case rules. Case-sensitive and case-insensitive resources must be reconciled using
loader-supplied real-path identity under an explicit deployment policy rather than
guessed from the machine running a pure contract test.

## Admission policy

`SourcePolicy` specifies allowed schemes, file roots, absolute/relative path rules,
network enablement and hosts, and whether real-path evidence is mandatory. Every
evaluation returns preserved evidence containing the canonical URI, the URI used
for containment, source kind, admission decision, and deterministic reason.

Remote access is deny-by-default: both the scheme and network policy must allow it,
and the normalized host must appear explicitly in `allowedHosts`. The policy does
not perform DNS resolution or network access.

File admission requires containment within an allowed canonical root. Comparison
uses a path-segment boundary, so `/allowed-api` does not match `/allowed`. Lexical
`..` traversal is normalized before this decision.

## Symlink boundary

Canonical URI normalization cannot establish a filesystem real path without I/O.
When `requireRealPath` is true, policy denies admission until a future loader supplies
`realPathUri`. Containment is then evaluated using that identity, preventing a
lexically in-root path from being admitted when a symlink resolves outside the root.
This contract establishes the boundary but does not implement the loader or call a
filesystem API.

Candidate parsers and validators receive only sources admitted by these OAIT-owned
rules. They may not independently load files or URLs outside this policy.
