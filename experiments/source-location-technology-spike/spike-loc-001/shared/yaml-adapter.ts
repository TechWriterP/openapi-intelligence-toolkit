import { isMap, isScalar, isSeq, LineCounter, parseAllDocuments, parseDocument, type Document, type Node } from 'yaml'
import type { Diagnostic, ExperimentalAdapter, Format, IndexResult, Parsed, Recovery } from './types.js'
import { entryFactory } from './types.js'

type Tree = { documents: Document.Parsed[], lineCounter: LineCounter }

function diagnostics(documents: Document.Parsed[], counter: LineCounter): Diagnostic[] {
  return documents.flatMap(document => [...document.errors, ...document.warnings].map(error => {
    const offset = error.pos?.[0]
    const pos = offset === undefined ? undefined : counter.linePos(offset)
    return { code: error.code, offset, length: error.pos ? error.pos[1] - error.pos[0] : undefined,
      line: pos?.line, column: pos?.col }
  }))
}

export const yamlAdapter: ExperimentalAdapter<Tree> = {
  name: 'yaml@2.8.3',
  parse(source: string, format: Format): Parsed<Tree> {
    const lineCounter = new LineCounter()
    const documents = format === 'yaml'
      ? parseAllDocuments(source, { lineCounter, keepSourceTokens: true, prettyErrors: false, uniqueKeys: true })
      : [parseDocument(source, { lineCounter, keepSourceTokens: true, prettyErrors: false, uniqueKeys: true, version: '1.2' })]
    const errors = diagnostics(documents, lineCounter)
    const recovery: Recovery = errors.length === 0 ? 'FULL_RECOVERY' : documents.some(doc => doc.contents) ? 'PARTIAL_RECOVERY' : 'DIAGNOSTIC_ONLY'
    return { tree: { documents, lineCounter }, diagnostics: errors, recovery,
      metadata: { documentCount: documents.length, strictJsonByIndependentValidation: format === 'json' ? strictJson(source) : undefined } }
  },
  index(source: string, parsed: Parsed<Tree>): IndexResult {
    const entries = [] as IndexResult['entries']
    const entry = entryFactory(source)
    const document = parsed.tree.documents[0]
    function walk(node: Node | null | undefined, segments: Array<string | number>, anchor?: number, fullEnd?: number) {
      if (!node) return
      const offset = anchor ?? node.range?.[0] ?? 0
      const end = fullEnd ?? node.range?.[2] ?? node.range?.[1] ?? offset
      entries.push(entry(segments, offset, Math.max(0, end - offset), segments.length === 0 ? 'node-start' : typeof segments.at(-1) === 'number' ? 'item-start' : 'key-start'))
      if (isMap(node)) for (const pair of node.items) {
        if (!isScalar(pair.key)) continue
        const key = String(pair.key.value)
        const value = pair.value as Node | null
        walk(value, [...segments, key], pair.key.range?.[0], value?.range?.[2] ?? value?.range?.[1])
      }
      else if (isSeq(node)) node.items.forEach((item, index) => walk(item as Node | null, [...segments, index]))
    }
    walk(document?.contents as Node | null, [])
    return { entries, diagnostics: parsed.diagnostics, recovery: parsed.recovery, metadata: parsed.metadata }
  },
}

function strictJson(source: string) {
  try { JSON.parse(source); return { valid: true, error: null } }
  catch (error) { return { valid: false, error: error instanceof Error ? error.name : typeof error } }
}
