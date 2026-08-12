import type {
  CanonicalSourceUri,
  LoadedSource,
  ProcessingError,
  ProcessingResult,
} from "@oait/core";
import { parseTree, type ParseError } from "jsonc-parser";

export interface ParsedJsonSource {
  readonly documentUri: CanonicalSourceUri;
  readonly representation: "json";
  readonly documentCount: 1;
  readonly hasContent: true;
}

function parserFailure(
  code: string,
  message: string,
  cause?: ProcessingError["cause"],
): ProcessingResult<never> {
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

    if (errors.length > 0 || tree === undefined) {
      return parserFailure(
        "invalid_json",
        "JSON source contains invalid syntax.",
        parseErrorCause(errors[0]),
      );
    }

    return {
      status: "complete",
      value: Object.freeze({
        documentUri: source.documentUri,
        representation: "json",
        documentCount: 1,
        hasContent: true,
      }),
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
