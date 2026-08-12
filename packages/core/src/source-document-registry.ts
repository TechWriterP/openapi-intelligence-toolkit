import type { ProcessingResult } from "./processing-result.js";
import type { LoadedSource } from "./source-loader.js";
import type { CanonicalSourceUri } from "./source-uri.js";

export interface SourceDocumentRegistry {
  readonly size: number;
  get(documentUri: CanonicalSourceUri): LoadedSource | undefined;
  has(documentUri: CanonicalSourceUri): boolean;
  register(document: LoadedSource): ProcessingResult<LoadedSource>;
  documents(): readonly LoadedSource[];
}

function registryFailure(code: string, message: string): ProcessingResult<never> {
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

class InMemorySourceDocumentRegistry implements SourceDocumentRegistry {
  readonly #documents = new Map<CanonicalSourceUri, LoadedSource>();

  get size(): number {
    return this.#documents.size;
  }

  get(documentUri: CanonicalSourceUri): LoadedSource | undefined {
    return this.#documents.get(documentUri);
  }

  has(documentUri: CanonicalSourceUri): boolean {
    return this.#documents.has(documentUri);
  }

  register(document: LoadedSource): ProcessingResult<LoadedSource> {
    if (
      !Object.isFrozen(document)
      || !Object.isFrozen(document.admission)
      || !document.admission.admitted
      || document.documentUri !== document.admission.evaluatedUri
    ) {
      return registryFailure(
        "invalid_registration",
        "Registered source must be immutable, admitted, and match its evaluated identity.",
      );
    }

    const existing = this.#documents.get(document.documentUri);
    if (existing !== undefined) {
      if (existing.contentHash === document.contentHash) {
        return { status: "complete", value: existing, errors: [] };
      }
      return registryFailure(
        "document_conflict",
        "Canonical document identity is already registered with different content.",
      );
    }

    this.#documents.set(document.documentUri, document);
    return { status: "complete", value: document, errors: [] };
  }

  documents(): readonly LoadedSource[] {
    const documents = [...this.#documents.values()]
      .sort((left, right) => {
        if (left.documentUri < right.documentUri) return -1;
        if (left.documentUri > right.documentUri) return 1;
        return 0;
      });
    return Object.freeze(documents);
  }
}

export function createSourceDocumentRegistry(): SourceDocumentRegistry {
  return Object.freeze(new InMemorySourceDocumentRegistry());
}
