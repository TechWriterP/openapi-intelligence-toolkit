import type { CanonicalSourceUri } from "./source-uri.js";

interface RuntimeUrl {
  readonly hostname: string;
  readonly protocol: string;
}

declare const URL: {
  new(input: string): RuntimeUrl;
};

export type SourceKind = "file" | "remote";

export interface SourcePolicy {
  readonly allowedSchemes: readonly string[];
  readonly allowedFileRoots: readonly CanonicalSourceUri[];
  readonly allowAbsoluteFilePaths: boolean;
  readonly allowRelativeFilePaths: boolean;
  readonly network: {
    readonly enabled: boolean;
    readonly allowedHosts: readonly string[];
  };
  /** Require the loader to supply real-path identity before admitting a file. */
  readonly requireRealPath: boolean;
}

export type SourceAdmissionReason =
  | "admitted"
  | "absolute_path_denied"
  | "host_denied"
  | "network_denied"
  | "outside_allowed_root"
  | "real_path_required"
  | "relative_path_denied"
  | "scheme_denied";

export interface SourceAdmissionRequest {
  readonly requestedIdentifier: string;
  readonly canonicalUri: CanonicalSourceUri;
  readonly realPathUri?: CanonicalSourceUri;
}

export interface SourceAdmissionDecision {
  readonly admitted: boolean;
  readonly kind: SourceKind;
  readonly canonicalUri: CanonicalSourceUri;
  readonly evaluatedUri: CanonicalSourceUri;
  readonly reason: SourceAdmissionReason;
}

function isWithinRoot(uri: CanonicalSourceUri, root: CanonicalSourceUri): boolean {
  const rootWithSlash = root.endsWith("/") ? root : `${root}/`;
  return uri === root || uri.startsWith(rootWithSlash);
}

function isRelativePath(identifier: string): boolean {
  const value = identifier.trim();
  const hasUriScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value);
  const isPosixAbsolute = value.startsWith("/");
  const isWindowsAbsolute = /^[a-zA-Z]:[\\/]/.test(value) || /^\\\\/.test(value);
  return !hasUriScheme && !isPosixAbsolute && !isWindowsAbsolute;
}

function decision(
  request: SourceAdmissionRequest,
  kind: SourceKind,
  evaluatedUri: CanonicalSourceUri,
  admitted: boolean,
  reason: SourceAdmissionReason,
): SourceAdmissionDecision {
  return { admitted, kind, canonicalUri: request.canonicalUri, evaluatedUri, reason };
}

/** Pure policy evaluation. This function never loads, stats, or resolves a source. */
export function evaluateSourceAdmission(
  policy: SourcePolicy,
  request: SourceAdmissionRequest,
): SourceAdmissionDecision {
  const uri = new URL(request.canonicalUri);
  const scheme = uri.protocol.slice(0, -1).toLowerCase();
  const kind: SourceKind = scheme === "file" ? "file" : "remote";
  const evaluatedUri = request.realPathUri ?? request.canonicalUri;

  if (!policy.allowedSchemes.map((value) => value.toLowerCase()).includes(scheme)) {
    return decision(request, kind, evaluatedUri, false, "scheme_denied");
  }

  if (kind === "remote") {
    if (!policy.network.enabled) return decision(request, kind, evaluatedUri, false, "network_denied");
    const allowedHosts = policy.network.allowedHosts.map((host) => host.toLowerCase());
    if (!allowedHosts.includes(uri.hostname.toLowerCase())) {
      return decision(request, kind, evaluatedUri, false, "host_denied");
    }
    return decision(request, kind, evaluatedUri, true, "admitted");
  }

  const relativePath = isRelativePath(request.requestedIdentifier);
  if (relativePath && !policy.allowRelativeFilePaths) {
    return decision(request, kind, evaluatedUri, false, "relative_path_denied");
  }
  if (!relativePath && !policy.allowAbsoluteFilePaths) {
    return decision(request, kind, evaluatedUri, false, "absolute_path_denied");
  }
  if (policy.requireRealPath && request.realPathUri === undefined) {
    return decision(request, kind, evaluatedUri, false, "real_path_required");
  }
  if (!policy.allowedFileRoots.some((root) => isWithinRoot(evaluatedUri, root))) {
    return decision(request, kind, evaluatedUri, false, "outside_allowed_root");
  }
  return decision(request, kind, evaluatedUri, true, "admitted");
}
