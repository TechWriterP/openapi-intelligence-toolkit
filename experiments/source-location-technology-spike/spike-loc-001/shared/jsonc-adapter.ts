import { parseTree, type Node, type ParseError } from 'jsonc-parser'
import type { ExperimentalAdapter, IndexResult, Parsed, Recovery } from './types.js'
import { entryFactory } from './types.js'

export const jsoncAdapter: ExperimentalAdapter<Node | undefined> = {
  name: 'jsonc-parser@3.3.1',
  parse(source): Parsed<Node | undefined> {
    const errors: ParseError[] = []
    const tree = parseTree(source, errors, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false })
    const diagnostics = errors.map(error => ({ code: `jsonc-parser:${error.error}`, offset: error.offset, length: error.length,
      ...position(source, error.offset) }))
    const recovery: Recovery = errors.length === 0 ? 'FULL_RECOVERY' : tree ? 'PARTIAL_RECOVERY' : 'DIAGNOSTIC_ONLY'
    return { tree, diagnostics, recovery, metadata: { strictOptions: { disallowComments: true, allowTrailingComma: false } } }
  },
  index(source, parsed): IndexResult {
    const entries = [] as IndexResult['entries']
    const entry = entryFactory(source)
    function walk(node: Node | undefined, segments: Array<string | number>) {
      if (!node) return
      entries.push(entry(segments, node.offset, node.length, segments.length === 0 ? 'node-start' : typeof segments.at(-1) === 'number' ? 'item-start' : 'key-start'))
      if (node.type === 'object') for (const property of node.children ?? []) {
        const [key, value] = property.children ?? []
        if (!key || !value) continue
        const keyValue = String(key.value)
        entries.push(entry([...segments, keyValue], property.offset, property.length, 'key-start'))
        walkChildren(value, [...segments, keyValue])
      }
      else if (node.type === 'array') (node.children ?? []).forEach((child, index) => { entries.push(entry([...segments, index], child.offset, child.length, 'item-start')); walkChildren(child, [...segments, index]) })
    }
    function walkChildren(node: Node, segments: Array<string | number>) {
      if (node.type === 'object' || node.type === 'array') {
        if (node.type === 'object') for (const property of node.children ?? []) {
          const [key, value] = property.children ?? []; if (!key || !value) continue
          const next = [...segments, String(key.value)]
          entries.push(entry(next, property.offset, property.length, 'key-start')); walkChildren(value, next)
        }
        else (node.children ?? []).forEach((child, index) => { const next = [...segments, index]; entries.push(entry(next, child.offset, child.length, 'item-start')); walkChildren(child, next) })
      }
    }
    walk(parsed.tree, [])
    return { entries, diagnostics: parsed.diagnostics, recovery: parsed.recovery, metadata: parsed.metadata }
  },
}
function position(source: string, offset: number) {
  const prefix = source.slice(0, offset), lines = prefix.split(/\r\n|\n|\r/)
  return { line: lines.length, column: [...(lines.at(-1) ?? '')].length + 1 }
}
