export type Format = 'yaml' | 'json'
export type Status = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_SUPPORTED' | 'NOT_APPLICABLE'
export type Recovery = 'FULL_RECOVERY' | 'PARTIAL_RECOVERY' | 'DIAGNOSTIC_ONLY' | 'THROWS_WITH_STRUCTURE' | 'THROWS_MESSAGE_ONLY' | 'UNUSABLE'
export interface Entry {
  pointer: string
  offset: number
  length: number
  line: number
  column: number
  anchor: 'key-start' | 'item-start' | 'node-start'
}
export interface Diagnostic {
  code: string
  offset?: number
  length?: number
  line?: number
  column?: number
  message?: string
}
export interface IndexResult {
  entries: Entry[]
  diagnostics: Diagnostic[]
  recovery: Recovery
  metadata?: Record<string, unknown>
}
export interface Parsed<T = unknown> {
  tree: T
  diagnostics: Diagnostic[]
  recovery: Recovery
  metadata?: Record<string, unknown>
}
export interface ExperimentalAdapter<T = unknown> {
  name: string
  parse(source: string, format: Format): Parsed<T>
  index(source: string, parsed: Parsed<T>, format: Format): IndexResult
}

export function encodePointer(segments: Array<string | number>) {
  return segments.length === 0 ? '' : `/${segments.map(segment => String(segment).replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`
}

export function lineColumn(source: string, offset: number) {
  const prefix = source.slice(0, offset)
  const lines = prefix.split(/\r\n|\n|\r/)
  return { line: lines.length, column: [...(lines.at(-1) ?? '')].length + 1 }
}

export function entry(source: string, segments: Array<string | number>, offset: number, length: number, anchor: Entry['anchor']): Entry {
  return { pointer: encodePointer(segments), offset, length, ...lineColumn(source, offset), anchor }
}

export function entryFactory(source: string) {
  const lineStarts = [0]
  for (let index = 0; index < source.length; index++) {
    if (source[index] === '\r') { if (source[index + 1] === '\n') index++; lineStarts.push(index + 1) }
    else if (source[index] === '\n') lineStarts.push(index + 1)
  }
  return (segments: Array<string | number>, offset: number, length: number, anchor: Entry['anchor']): Entry => {
    let low = 0, high = lineStarts.length
    while (low < high) { const middle = (low + high) >>> 1; if (lineStarts[middle]! <= offset) low = middle + 1; else high = middle }
    const lineIndex = Math.max(0, low - 1); const start = lineStarts[lineIndex]!
    return { pointer: encodePointer(segments), offset, length, line: lineIndex + 1, column: [...source.slice(start, offset)].length + 1, anchor }
  }
}
