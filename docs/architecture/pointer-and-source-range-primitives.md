# JSON Pointer and source-range primitives

`@oait/core` owns candidate-neutral structural pointer and physical range values.
They provide deterministic correlation vocabulary only; they do not parse source,
navigate values, extract locations, build a SourceIndex, or create diagnostics.

## RFC 6901 JSON Pointer

`JsonPointer` is a branded canonical RFC 6901 string:

- `""` identifies the complete document root; `/` identifies one empty-key token.
- Every non-root pointer begins with `/`.
- Within a token, `~` is encoded as `~0` and `/` as `~1`, in that order.
- Numeric segments are non-negative safe integers serialized in decimal form.
- Repeated separators are preserved because they represent empty tokens.
- Invalid prefixes, dangling `~`, and escapes other than `~0` or `~1` return a
  structured processing failure.

Creation from structural segments owns canonical escaping. Parsing validates an
already serialized pointer and preserves its exact valid string form. Equality is
exact canonical-string equality. Decoding returns a frozen token array and never
inspects or navigates a JSON/YAML value.

## Source ranges

`SourceRange` is an immutable half-open interval:

```text
[startOffset, endOffset)
```

Both boundaries are zero-based non-negative safe integers in JavaScript UTF-16 code
units over the decoded original source text. The start is inclusive and the end is
exclusive. Therefore length is `endOffset - startOffset`, an empty range has equal
boundaries, and a non-BMP character such as an emoji occupies two units.

This model matches the selected YAML and JSON indexing adapters while remaining
candidate-neutral. It is not a UTF-8 byte range or Unicode-code-point range.

Ranges compare deterministically by start offset and then end offset. Creation
rejects negative, fractional, unsafe, or reversed boundaries.

## Presentation coordinates

Line and column are derived presentation data, not fields in `SourceRange`. Future
line-map work will derive one-based lines and one-based Unicode-aware columns from
the immutable source text. It must not replace the authoritative UTF-16 range or
allow parser-native coordinates to define OAIT's public contract.

Occurrence identifiers, presentation anchors, extraction adapters, and SourceIndex
records remain later source-index work.

## Structured failures

- `source.invalid_json_pointer`: invalid serialized RFC 6901 syntax.
- `source.invalid_pointer_segment`: invalid numeric structural segment.
- `source.invalid_source_range`: invalid offset boundary or ordering.
