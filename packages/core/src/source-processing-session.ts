import {
  createSourceDocumentRegistry,
  type SourceDocumentRegistry,
} from "./source-document-registry.js";
import type { CanonicalSourceUri } from "./source-uri.js";

export interface SourceProcessingSession {
  readonly entryDocumentUri: CanonicalSourceUri;
  readonly registry: SourceDocumentRegistry;
}

/** Creates one isolated, in-memory source-processing lifecycle boundary. */
export function createSourceProcessingSession(
  entryDocumentUri: CanonicalSourceUri,
): SourceProcessingSession {
  return Object.freeze({
    entryDocumentUri,
    registry: createSourceDocumentRegistry(),
  });
}
