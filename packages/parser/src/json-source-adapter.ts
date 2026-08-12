import type {
  CanonicalSourceUri,
  FailedProcessingResult,
  JsonPointer,
  LoadedSource,
  ProcessingError,
  ProcessingResult,
  SourceRange,
} from "@oait/core";
import { createJsonPointer, createSourceRange } from "@oait/core";
import { parseTree, type Node, type ParseError } from "jsonc-parser";

export type JsonStructuralKind =
  | "document"
  | "object"
  | "property"
  | "array"
  | "item"
  | "scalar";

export type JsonScalarValue = string | number | boolean | null;

export interface JsonStructuralEvidence {
  readonly kind: JsonStructuralKind;
  readonly pointer: JsonPointer;
  readonly range: SourceRange;
  readonly keyRange?: SourceRange;
  readonly valueRange?: SourceRange;
  readonly scalarValue?: JsonScalarValue;
}

export interface ParsedJsonSource {
  readonly documentUri: CanonicalSourceUri;
  readonly representation: "json";
  readonly documentCount: 1;
  readonly hasContent: true;
  readonly structures: readonly JsonStructuralEvidence[];
}

function parserFailure(
  code: string,
  message: string,
  cause?: ProcessingError["cause"],
): FailedProcessingResult {
  const error: ProcessingError = cause === undefined
    ? { category: "parser", stage: "parser", code: `parser.${code}`, message }
    : { category: "parser", stage: "parser", code: `parser.${code}`, message, cause };
  return { status: "failed", errors: [error] };
}

function parseErrorCause(error: ParseError | undefined): ProcessingError["cause"] | undefined {
  return error === undefined ? undefined : { code: String(error.error) };
}

function boundedCause(error: unknown): ProcessingError["cause"] | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { readonly name?: unknown; readonly code?: unknown };
  const cause: { name?: string; code?: string } = {};
  if (typeof candidate.name === "string") cause.name = candidate.name;
  if (typeof candidate.code === "string") cause.code = candidate.code;
  return Object.keys(cause).length === 0 ? undefined : cause;
}

function requiredPointer(segments: readonly (string | number)[]): JsonPointer {
  const result = createJsonPointer(segments);
  if (result.status !== "complete") throw new Error("Invalid adapter pointer segments.");
  return result.value;
}

function requiredRange(node: Pick<Node, "offset" | "length">): SourceRange {
  const result = createSourceRange(node.offset, node.offset + node.length);
  if (result.status !== "complete") throw new Error("Invalid candidate node range.");
  return result.value;
}

function evidence(
  kind: JsonStructuralKind,
  segments: readonly (string | number)[],
  range: SourceRange,
  options: {
    readonly keyRange?: SourceRange;
    readonly valueRange?: SourceRange;
    readonly scalarValue?: JsonScalarValue;
  } = {},
): JsonStructuralEvidence {
  return Object.freeze({ kind, pointer: requiredPointer(segments), range, ...options });
}

function walkNode(
  node: Node,
  segments: readonly (string | number)[],
  structures: JsonStructuralEvidence[],
): void {
  if (node.type === "object") {
    structures.push(evidence("object", segments, requiredRange(node)));
    for (const property of node.children ?? []) {
      const keyNode = property.children?.[0];
      const valueNode = property.children?.[1];
      if (property.type !== "property" || keyNode?.type !== "string" || typeof keyNode.value !== "string") continue;
      const propertySegments = [...segments, keyNode.value];
      const propertyOptions = valueNode === undefined
        ? { keyRange: requiredRange(keyNode) }
        : { keyRange: requiredRange(keyNode), valueRange: requiredRange(valueNode) };
      structures.push(evidence("property", propertySegments, requiredRange(property), propertyOptions));
      if (valueNode !== undefined) walkNode(valueNode, propertySegments, structures);
    }
    return;
  }

  if (node.type === "array") {
    structures.push(evidence("array", segments, requiredRange(node)));
    for (const [index, child] of (node.children ?? []).entries()) {
      const itemSegments = [...segments, index];
      const childRange = requiredRange(child);
      structures.push(evidence("item", itemSegments, childRange, { valueRange: childRange }));
      walkNode(child, itemSegments, structures);
    }
    return;
  }

  if (["string", "number", "boolean", "null"].includes(node.type)) {
    const scalarValue: JsonScalarValue = node.type === "null" ? null : node.value as JsonScalarValue;
    structures.push(evidence("scalar", segments, requiredRange(node), { scalarValue }));
  }
}

function extractStructures(tree: Node): readonly JsonStructuralEvidence[] {
  const structures: JsonStructuralEvidence[] = [
    evidence("document", [], requiredRange(tree)),
  ];
  walkNode(tree, [], structures);
  return Object.freeze(structures);
}

/**
 * Validates one authoritative source using strict JSON syntax rules.
 * Candidate trees, errors, offsets, and ranges terminate inside this adapter.
 */
export function parseJsonSource(source: LoadedSource): ProcessingResult<ParsedJsonSource> {
  if (source.format !== "json") {
    return parserFailure(
      "unsupported_json_representation",
      "JSON adapter requires a source detected as JSON.",
    );
  }

  try {
    const errors: ParseError[] = [];
    const tree = parseTree(source.sourceText, errors, {
      allowTrailingComma: false,
      disallowComments: true,
      allowEmptyContent: false,
    });

    if (tree === undefined) {
      return parserFailure(
        "invalid_json",
        "JSON source contains invalid syntax.",
        parseErrorCause(errors[0]),
      );
    }

    const structures = extractStructures(tree);

    const value: ParsedJsonSource = Object.freeze({
      documentUri: source.documentUri,
      representation: "json",
      documentCount: 1,
      hasContent: true,
      structures,
    });

    if (errors.length > 0) {
      const failure = parserFailure(
        "invalid_json",
        "JSON source contains invalid syntax.",
        parseErrorCause(errors[0]),
      );
      return { status: "partial", value, errors: failure.errors };
    }

    return {
      status: "complete",
      value,
      errors: [],
    };
  } catch (error) {
    return parserFailure(
      "execution_failed",
      "JSON parser execution failed.",
      boundedCause(error),
    );
  }
}
