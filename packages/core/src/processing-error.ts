/** Candidate-neutral classifications for failures of OAIT processing. */
export const processingErrorCategories = [
  "configuration",
  "source",
  "parser",
  "reference",
  "validator_execution",
  "internal",
] as const;

export type ProcessingErrorCategory = typeof processingErrorCategories[number];

/** Processing stages are explicit so orchestration and serialization need not infer them. */
export const processingStages = [
  "configuration",
  "source",
  "parser",
  "reference",
  "validator_execution",
  "internal",
] as const;

export type ProcessingStage = typeof processingStages[number];

/** Stable codes are owned and namespaced by OAIT, never copied from a provider. */
export type ProcessingErrorCode = `${ProcessingErrorCategory}.${string}`;

/**
 * A bounded description of an underlying failure.
 *
 * Adapters may copy safe scalar evidence into this shape. They must not attach a
 * candidate exception, stack, arbitrary object, or candidate-specific type.
 */
export interface ProcessingErrorCause {
  readonly name?: string;
  readonly code?: string;
  readonly message?: string;
}

/** A processing-system failure, distinct from a diagnostic or conformance finding. */
export interface ProcessingError {
  readonly category: ProcessingErrorCategory;
  readonly stage: ProcessingStage;
  readonly code: ProcessingErrorCode;
  readonly message: string;
  readonly cause?: ProcessingErrorCause;
}
