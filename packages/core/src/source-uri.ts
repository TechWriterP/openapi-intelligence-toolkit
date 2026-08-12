import type { ProcessingResult } from "./processing-result.js";

interface RuntimeUrl {
  hash: string;
  href: string;
  hostname: string;
  password: string;
  protocol: string;
  search: string;
  username: string;
}

declare const URL: {
  new(input: string, base?: string): RuntimeUrl;
};

declare const canonicalSourceUriBrand: unique symbol;

/** Absolute, normalized physical source identity without a fragment. */
export type CanonicalSourceUri = string & {
  readonly [canonicalSourceUriBrand]: true;
};

export interface CanonicalizeSourceUriOptions {
  /** Canonical directory URI used to resolve a relative path or URI. */
  readonly baseUri?: CanonicalSourceUri;
}

const windowsDrivePath = /^([a-zA-Z]):[\\/](.*)$/;
const windowsUncPath = /^\\\\([^\\/]+)[\\/](.*)$/;
const unreservedPercentEncoding = /%([0-9a-fA-F]{2})/g;

function normalizePercentEncoding(value: string): string {
  return value.replace(unreservedPercentEncoding, (encoded, hexadecimal) => {
    const character = String.fromCharCode(Number.parseInt(hexadecimal, 16));
    return /^[A-Za-z0-9._~-]$/.test(character)
      ? character
      : `%${hexadecimal.toUpperCase()}`;
  });
}

function pathSegments(value: string): string {
  return value
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function pathToPortableFileUri(input: string): string | undefined {
  const drive = windowsDrivePath.exec(input);
  if (drive) {
    return `file:///${drive[1]!.toUpperCase()}:/${pathSegments(drive[2]!)}`;
  }

  const unc = windowsUncPath.exec(input);
  if (unc) {
    return `file://${unc[1]!}/${pathSegments(unc[2]!)}`;
  }

  if (input.startsWith("/")) return `file://${pathSegments(input)}`;
  return undefined;
}

function sourceError(code: string, message: string): ProcessingResult<never> {
  return {
    status: "failed",
    errors: [{
      category: "source",
      stage: "source",
      code: `source.${code}`,
      message,
    }],
  };
}

/**
 * Canonicalizes identity syntax only. It performs no filesystem or network I/O,
 * does not resolve references, and does not establish symlink identity.
 */
export function canonicalizeSourceUri(
  input: string,
  options: CanonicalizeSourceUriOptions = {},
): ProcessingResult<CanonicalSourceUri> {
  const trimmed = input.trim();
  if (trimmed.length === 0) return sourceError("empty_identifier", "Source identifier must not be empty.");

  try {
    const portableFileUri = pathToPortableFileUri(trimmed);
    const uri = portableFileUri === undefined
      ? new URL(trimmed, options.baseUri)
      : new URL(portableFileUri);

    if (uri.hash.length > 0) {
      return sourceError("fragment_not_allowed", "A physical source identity must not contain a URI fragment.");
    }
    if (uri.protocol === "file:" && (uri.search.length > 0 || uri.username || uri.password)) {
      return sourceError("invalid_file_uri", "A file URI must not contain query or credential data.");
    }

    uri.protocol = uri.protocol.toLowerCase();
    uri.hostname = uri.hostname.toLowerCase();
    const canonical = normalizePercentEncoding(uri.href);
    return { status: "complete", value: canonical as CanonicalSourceUri, errors: [] };
  } catch {
    return sourceError(
      options.baseUri === undefined ? "relative_without_base" : "invalid_identifier",
      options.baseUri === undefined
        ? "A relative source identifier requires a canonical base URI."
        : "Source identifier is not a valid path or URI.",
    );
  }
}

export function sameSourceUri(left: CanonicalSourceUri, right: CanonicalSourceUri): boolean {
  return left === right;
}
