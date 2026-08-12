import type { ProcessingResult } from "./processing-result.js";

declare const jsonPointerBrand: unique symbol;

/** Canonical RFC 6901 JSON Pointer string. The empty string identifies the root. */
export type JsonPointer = string & {
  readonly [jsonPointerBrand]: true;
};

export type JsonPointerSegment = string | number;

function pointerFailure(code: string, message: string): ProcessingResult<never> {
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

function encodeToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

function decodeToken(token: string): string {
  return token.replace(/~[01]/gu, (escape) => escape === "~0" ? "~" : "/");
}

/** Creates a canonical pointer from structural string tokens or array indices. */
export function createJsonPointer(
  segments: readonly JsonPointerSegment[],
): ProcessingResult<JsonPointer> {
  const tokens: string[] = [];
  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!Number.isSafeInteger(segment) || segment < 0) {
        return pointerFailure(
          "invalid_pointer_segment",
          "A numeric JSON Pointer segment must be a non-negative safe integer.",
        );
      }
      tokens.push(String(segment));
    } else {
      tokens.push(encodeToken(segment));
    }
  }

  const pointer = tokens.length === 0 ? "" : `/${tokens.join("/")}`;
  return { status: "complete", value: pointer as JsonPointer, errors: [] };
}

/** Validates an RFC 6901 pointer and returns its canonical string representation. */
export function parseJsonPointer(input: string): ProcessingResult<JsonPointer> {
  if (input === "") return { status: "complete", value: input as JsonPointer, errors: [] };
  if (!input.startsWith("/")) {
    return pointerFailure("invalid_json_pointer", "A non-root JSON Pointer must begin with '/'.");
  }

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== "~") continue;
    const escaped = input[index + 1];
    if (escaped !== "0" && escaped !== "1") {
      return pointerFailure(
        "invalid_json_pointer",
        "A JSON Pointer '~' must be followed by '0' or '1'.",
      );
    }
    index += 1;
  }

  return { status: "complete", value: input as JsonPointer, errors: [] };
}

/** Returns decoded structural tokens; it does not navigate or inspect a document. */
export function jsonPointerSegments(pointer: JsonPointer): readonly string[] {
  if (pointer === "") return Object.freeze([]);
  return Object.freeze(pointer.slice(1).split("/").map(decodeToken));
}

export function sameJsonPointer(left: JsonPointer, right: JsonPointer): boolean {
  return left === right;
}
