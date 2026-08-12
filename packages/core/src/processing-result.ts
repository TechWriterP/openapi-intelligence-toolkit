import type { ProcessingError } from "./processing-error.js";

export interface CompleteProcessingResult<T> {
  readonly status: "complete";
  readonly value: T;
  readonly errors: readonly [];
}

export interface PartialProcessingResult<T> {
  readonly status: "partial";
  readonly value: T;
  readonly errors: readonly [ProcessingError, ...ProcessingError[]];
}

export interface FailedProcessingResult {
  readonly status: "failed";
  readonly errors: readonly [ProcessingError, ...ProcessingError[]];
}

/**
 * Candidate-neutral outcome for an operation that can retain useful partial work.
 * Exceptions are translated at package or adapter boundaries before entering this result.
 */
export type ProcessingResult<T> =
  | CompleteProcessingResult<T>
  | PartialProcessingResult<T>
  | FailedProcessingResult;
