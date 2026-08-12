import type { ProcessingResult } from "./processing-result.js";

export interface SourceRange {
  /** Zero-based offset in JavaScript UTF-16 code units. */
  readonly startOffset: number;
  /** End-exclusive zero-based offset in JavaScript UTF-16 code units. */
  readonly endOffset: number;
  readonly unit: "utf16-code-unit";
}

function rangeFailure(message: string): ProcessingResult<never> {
  return {
    status: "failed",
    errors: [{
      category: "source",
      stage: "source",
      code: "source.invalid_source_range",
      message,
    }],
  };
}

/** Creates an immutable half-open range [startOffset, endOffset). */
export function createSourceRange(
  startOffset: number,
  endOffset: number,
): ProcessingResult<SourceRange> {
  if (!Number.isSafeInteger(startOffset) || startOffset < 0) {
    return rangeFailure("Source range start must be a non-negative safe integer.");
  }
  if (!Number.isSafeInteger(endOffset) || endOffset < startOffset) {
    return rangeFailure("Source range end must be a safe integer at or after its start.");
  }

  return {
    status: "complete",
    value: Object.freeze({ startOffset, endOffset, unit: "utf16-code-unit" }),
    errors: [],
  };
}

export function sourceRangeLength(range: SourceRange): number {
  return range.endOffset - range.startOffset;
}

/** Deterministic ascending comparison by start offset, then end offset. */
export function compareSourceRanges(left: SourceRange, right: SourceRange): number {
  if (left.startOffset < right.startOffset) return -1;
  if (left.startOffset > right.startOffset) return 1;
  if (left.endOffset < right.endOffset) return -1;
  if (left.endOffset > right.endOffset) return 1;
  return 0;
}
