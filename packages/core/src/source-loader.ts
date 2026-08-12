import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { ProcessingError } from "./processing-error.js";
import type { ProcessingResult } from "./processing-result.js";
import {
  evaluateSourceAdmission,
  type SourceAdmissionDecision,
  type SourceAdmissionRequest,
  type SourcePolicy,
} from "./source-policy.js";
import {
  canonicalizeSourceUri,
  type CanonicalSourceUri,
} from "./source-uri.js";

interface RuntimeTextDecoder {
  decode(input: Uint8Array): string;
}

declare const TextDecoder: {
  new(label: "utf-8", options: { readonly fatal: true; readonly ignoreBOM: true }): RuntimeTextDecoder;
};

export type SourceFormat = "json" | "yaml" | "unknown";

export interface SourceLoadRequest {
  readonly identifier: string;
  readonly baseUri?: CanonicalSourceUri;
}

export interface SourceLoaderOptions {
  /** Positive upper bound applied to every acquired source. */
  readonly maxSourceBytes: number;
}

export interface LoadedSource {
  readonly documentUri: CanonicalSourceUri;
  readonly requestedIdentifier: string;
  readonly format: Exclude<SourceFormat, "unknown">;
  readonly sourceText: string;
  readonly byteLength: number;
  readonly contentHash: string;
  readonly hasUtf8Bom: boolean;
  readonly admission: SourceAdmissionDecision;
  /** Returns a fresh copy so callers cannot mutate retained source truth. */
  bytes(): Uint8Array;
}

export interface SourceLoader {
  load(request: SourceLoadRequest): Promise<ProcessingResult<LoadedSource>>;
}

function sourceFailure(code: string, message: string, cause?: ProcessingError["cause"]): ProcessingResult<never> {
  const error: ProcessingError = cause === undefined
    ? { category: "source", stage: "source", code: `source.${code}`, message }
    : { category: "source", stage: "source", code: `source.${code}`, message, cause };
  return { status: "failed", errors: [error] };
}

function denialFailure(decision: SourceAdmissionDecision): ProcessingResult<never> {
  return sourceFailure("admission_denied", `Source admission denied: ${decision.reason}.`);
}

function safeCause(error: unknown): ProcessingError["cause"] | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { readonly name?: unknown; readonly code?: unknown };
  const cause: { name?: string; code?: string } = {};
  if (typeof candidate.name === "string") cause.name = candidate.name;
  if (typeof candidate.code === "string") cause.code = candidate.code;
  return Object.keys(cause).length === 0 ? undefined : cause;
}

function extensionOf(documentUri: CanonicalSourceUri): string {
  const pathname = documentUri.split(/[?#]/u, 1)[0]!.toLowerCase();
  const match = /\.([a-z0-9]+)$/u.exec(pathname);
  return match?.[1] ?? "";
}

/** Representation-level detection only; no YAML or JSON parser is invoked. */
export function detectSourceFormat(
  documentUri: CanonicalSourceUri,
  sourceText: string,
): SourceFormat {
  const extension = extensionOf(documentUri);
  if (extension === "json" || extension === "jsonc") return "json";
  if (extension === "yaml" || extension === "yml") return "yaml";

  const content = sourceText.replace(/^\uFEFF/u, "").trimStart();
  if (content.startsWith("{") || content.startsWith("[")) return "json";
  if (content.startsWith("---") || content.startsWith("%YAML")) return "yaml";
  return "unknown";
}

class ImmutableLoadedSource implements LoadedSource {
  readonly documentUri: CanonicalSourceUri;
  readonly requestedIdentifier: string;
  readonly format: "json" | "yaml";
  readonly sourceText: string;
  readonly byteLength: number;
  readonly contentHash: string;
  readonly hasUtf8Bom: boolean;
  readonly admission: SourceAdmissionDecision;
  readonly #bytes: Uint8Array;

  constructor(
    request: SourceLoadRequest,
    bytes: Uint8Array,
    sourceText: string,
    format: "json" | "yaml",
    admission: SourceAdmissionDecision,
  ) {
    this.documentUri = admission.evaluatedUri;
    this.requestedIdentifier = request.identifier;
    this.format = format;
    this.sourceText = sourceText;
    this.byteLength = bytes.byteLength;
    this.contentHash = createHash("sha256").update(bytes).digest("hex");
    this.hasUtf8Bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
    this.admission = Object.freeze({ ...admission });
    this.#bytes = Uint8Array.from(bytes);
    Object.freeze(this);
  }

  bytes(): Uint8Array {
    return Uint8Array.from(this.#bytes);
  }
}

export function createFileSourceLoader(
  policy: SourcePolicy,
  options: SourceLoaderOptions,
): SourceLoader {
  if (!Number.isSafeInteger(options.maxSourceBytes) || options.maxSourceBytes <= 0) {
    throw new RangeError("maxSourceBytes must be a positive safe integer.");
  }

  return Object.freeze({
    async load(request: SourceLoadRequest): Promise<ProcessingResult<LoadedSource>> {
      const canonical = request.baseUri === undefined
        ? canonicalizeSourceUri(request.identifier)
        : canonicalizeSourceUri(request.identifier, { baseUri: request.baseUri });
      if (canonical.status !== "complete") return { status: "failed", errors: canonical.errors };

      const admissionRequest: SourceAdmissionRequest = {
        requestedIdentifier: request.identifier,
        canonicalUri: canonical.value,
      };
      let admission = evaluateSourceAdmission(policy, admissionRequest);
      if (!admission.admitted && admission.reason !== "real_path_required") return denialFailure(admission);
      if (admission.kind !== "file") {
        return sourceFailure("unsupported_acquisition", "This loader supports admitted file sources only.");
      }

      let path: string;
      try {
        path = fileURLToPath(canonical.value);
      } catch (error) {
        return sourceFailure("invalid_file_uri", "Canonical file URI cannot be converted to a platform path.", safeCause(error));
      }

      if (policy.requireRealPath) {
        try {
          const resolvedPath = await realpath(path);
          const realPathResult = canonicalizeSourceUri(resolvedPath);
          if (realPathResult.status !== "complete") {
            return { status: "failed", errors: realPathResult.errors };
          }
          admission = evaluateSourceAdmission(policy, { ...admissionRequest, realPathUri: realPathResult.value });
        } catch (error) {
          return sourceFailure("real_path_failed", "Unable to establish real-path source identity.", safeCause(error));
        }
        if (!admission.admitted) return denialFailure(admission);
        path = fileURLToPath(admission.evaluatedUri);
      }

      let acquired: Uint8Array;
      try {
        acquired = await readFile(path);
      } catch (error) {
        return sourceFailure("read_failed", "Unable to read admitted source bytes.", safeCause(error));
      }
      if (acquired.byteLength > options.maxSourceBytes) {
        return sourceFailure("size_limit_exceeded", "Source exceeds the configured byte limit.");
      }
      if (acquired.byteLength === 0) return sourceFailure("empty", "Source is empty.");

      const retainedBytes = Uint8Array.from(acquired);
      let sourceText: string;
      try {
        sourceText = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(retainedBytes);
      } catch (error) {
        return sourceFailure("invalid_utf8", "Source is not valid UTF-8.", safeCause(error));
      }

      const format = detectSourceFormat(admission.evaluatedUri, sourceText);
      if (format === "unknown") {
        return sourceFailure("unsupported_format", "Source representation is neither identifiable JSON nor YAML.");
      }

      return {
        status: "complete",
        value: new ImmutableLoadedSource(request, retainedBytes, sourceText, format, admission),
        errors: [],
      };
    },
  });
}
