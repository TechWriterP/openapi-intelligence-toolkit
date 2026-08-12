import type {
  CanonicalSourceUri,
  LoadedSource,
  ProcessingError,
  ProcessingResult,
} from "@oait/core";
import { parseAllDocuments } from "yaml";

export interface ParsedYamlSource {
  readonly documentUri: CanonicalSourceUri;
  readonly representation: "yaml";
  readonly documentCount: 1;
  readonly hasContent: boolean;
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

function boundedCause(error: unknown): ProcessingError["cause"] | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { readonly name?: unknown; readonly code?: unknown };
  const cause: { name?: string; code?: string } = {};
  if (typeof candidate.name === "string") cause.name = candidate.name;
  if (typeof candidate.code === "string") cause.code = candidate.code;
  return Object.keys(cause).length === 0 ? undefined : cause;
}

/**
 * Validates one authoritative YAML representation through the candidate adapter.
 * Candidate documents, nodes, errors, warnings, and ranges terminate here.
 */
export function parseYamlSource(source: LoadedSource): ProcessingResult<ParsedYamlSource> {
  if (source.format !== "yaml") {
    return parserFailure(
      "unsupported_yaml_representation",
      "YAML adapter requires a source detected as YAML.",
    );
  }

  try {
    const documents = parseAllDocuments(source.sourceText, {
      prettyErrors: false,
      strict: true,
      uniqueKeys: true,
      version: "1.2",
    });

    if (documents.length !== 1) {
      return parserFailure(
        "unsupported_yaml_representation",
        "YAML adapter requires exactly one YAML document.",
      );
    }

    const document = documents[0]!;
    if (document.errors.length > 0) {
      return parserFailure(
        "invalid_yaml",
        "YAML source contains invalid syntax.",
        boundedCause(document.errors[0]),
      );
    }

    return {
      status: "complete",
      value: Object.freeze({
        documentUri: source.documentUri,
        representation: "yaml",
        documentCount: 1,
        hasContent: document.contents !== null,
      }),
      errors: [],
    };
  } catch (error) {
    return parserFailure(
      "execution_failed",
      "YAML parser execution failed.",
      boundedCause(error),
    );
  }
}
