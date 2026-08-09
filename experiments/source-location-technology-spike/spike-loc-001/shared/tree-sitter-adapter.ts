import Parser, { type SyntaxNode } from 'tree-sitter'
import Yaml from '@tree-sitter-grammars/tree-sitter-yaml'
import Json from 'tree-sitter-json'
import type { ExperimentalAdapter, Format, IndexResult, Parsed, Recovery } from './types.js'
import { entryFactory } from './types.js'

type Tree = Parser.Tree
const yamlParser = new Parser(); yamlParser.setLanguage(Yaml)
const jsonParser = new Parser(); jsonParser.setLanguage(Json)

export const treeSitterAdapter: ExperimentalAdapter<Tree> = {
  name: 'tree-sitter@0.21.1 + YAML@0.6.1 + JSON@0.24.8',
  parse(source, format): Parsed<Tree> {
    // The documented callback input form avoids the runtime binding's observed
    // ~32 KiB direct-string input failure while preserving the original text.
    const ascii = Buffer.byteLength(source, 'utf8') === source.length
    const tree = (format === 'yaml' ? yamlParser : jsonParser).parse((byteOffset) => {
      const codeUnitOffset = ascii ? byteOffset : byteToCodeUnit(source, byteOffset)
      return source.slice(codeUnitOffset, codeUnitOffset + 8192)
    })
    const errorNodes: SyntaxNode[] = []
    collectErrors(tree.rootNode, errorNodes)
    const diagnostics = errorNodes.map(node => {
      const offset = byteToCodeUnit(source, node.startIndex)
      return { code: node.isMissing ? `MISSING_${node.type}` : node.type, offset,
        length: byteToCodeUnit(source, node.endIndex) - offset,
        line: node.startPosition.row + 1, column: byteColumnToCodePoint(source, node.startPosition.row, node.startPosition.column) + 1 }
    })
    const recovery: Recovery = diagnostics.length === 0 ? 'FULL_RECOVERY' : tree.rootNode.namedChildCount > 0 ? 'PARTIAL_RECOVERY' : 'DIAGNOSTIC_ONLY'
    return { tree, diagnostics, recovery, metadata: { nativeOffsets: 'UTF-8 bytes', nativeRowsAndColumns: '0-based rows and UTF-8 byte columns',
      inputMode: 'documented callback chunks (8192 UTF-16 code units)',
      documentCount: format === 'yaml' ? tree.rootNode.namedChildren.filter(node => node.type === 'document').length : 1 } }
  },
  index(source, parsed, format): IndexResult {
    const entries = [] as IndexResult['entries']
    const entry = entryFactory(source)
    const ascii = Buffer.byteLength(source, 'utf8') === source.length
    const offsetOf = (byteOffset: number) => ascii ? byteOffset : byteToCodeUnit(source, byteOffset)
    const root = format === 'yaml' ? firstYamlDocumentValue(parsed.tree.rootNode) : parsed.tree.rootNode.namedChildren[0]
    function add(node: SyntaxNode, segments: Array<string | number>, anchorNode = node, rangeNode = node) {
      const offset = offsetOf(anchorNode.startIndex)
      const end = offsetOf(rangeNode.endIndex)
      entries.push(entry(segments, offset, Math.max(0, end - offset), segments.length === 0 ? 'node-start' : typeof segments.at(-1) === 'number' ? 'item-start' : 'key-start'))
    }
    function walk(node: SyntaxNode | null | undefined, segments: Array<string | number>) {
      if (!node) return
      const semantic = format === 'yaml' ? unwrapYaml(node) : node
      if (!semantic) return
      if (segments.length === 0) add(semantic, segments)
      if (isMapping(semantic, format)) for (const pair of semantic.namedChildren.filter(child => pairTypes(format).has(child.type))) {
        const key = pair.childForFieldName('key') ?? pair.namedChildren[0]
        const value = pair.childForFieldName('value') ?? pair.namedChildren[1]
        if (!key || !value) continue
        const keyValue = format === 'json' ? decodeJsonKey(key.text) : decodeYamlKey(key.text)
        const next = [...segments, keyValue]
        add(value, next, key, pair); walk(value, next)
      }
      else if (isSequence(semantic, format)) {
        const children = sequenceValues(semantic, format)
        children.forEach((child, index) => { const value = format === 'yaml' ? unwrapYaml(child) ?? child : child; const next = [...segments, index]; add(value, next, value, value); walk(value, next) })
      }
    }
    walk(root, [])
    return { entries, diagnostics: parsed.diagnostics, recovery: parsed.recovery, metadata: parsed.metadata }
  },
}

function pairTypes(format: Format) { return new Set(format === 'yaml' ? ['block_mapping_pair', 'flow_pair'] : ['pair']) }
function isMapping(node: SyntaxNode, format: Format) { return format === 'yaml' ? ['block_mapping', 'flow_mapping'].includes(node.type) : node.type === 'object' }
function isSequence(node: SyntaxNode, format: Format) { return format === 'yaml' ? ['block_sequence', 'flow_sequence'].includes(node.type) : node.type === 'array' }
function sequenceValues(node: SyntaxNode, format: Format) {
  if (format === 'json') return node.namedChildren
  return node.type === 'block_sequence' ? node.namedChildren.map(item => item.namedChildren[0] ?? item) : node.namedChildren
}
function firstYamlDocumentValue(root: SyntaxNode) {
  const document = root.namedChildren.find(node => node.type === 'document')
  return document ? unwrapYaml(document) : null
}
function unwrapYaml(node: SyntaxNode): SyntaxNode | null {
  const semantic = new Set(['block_mapping', 'flow_mapping', 'block_sequence', 'flow_sequence', 'alias',
    'plain_scalar', 'single_quote_scalar', 'double_quote_scalar', 'block_scalar'])
  if (semantic.has(node.type)) return node
  for (const child of node.namedChildren) { const found = unwrapYaml(child); if (found) return found }
  return null
}
function decodeJsonKey(text: string) { try { return JSON.parse(text) as string } catch { return text.replace(/^"|"$/g, '') } }
function decodeYamlKey(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith('"')) { try { return JSON.parse(trimmed) as string } catch { return trimmed.slice(1, -1) } }
  if (trimmed.startsWith("'")) return trimmed.slice(1, -1).replaceAll("''", "'")
  return trimmed
}
function collectErrors(node: SyntaxNode, output: SyntaxNode[]) {
  if (node.type === 'ERROR' || node.isMissing) output.push(node)
  node.namedChildren.forEach(child => collectErrors(child, output))
}
function byteToCodeUnit(source: string, byteOffset: number) {
  const buffer = Buffer.from(source, 'utf8')
  return buffer.subarray(0, byteOffset).toString('utf8').length
}
function byteColumnToCodePoint(source: string, row: number, byteColumn: number) {
  const line = source.split(/\r\n|\n|\r/)[row] ?? ''
  return [...Buffer.from(line, 'utf8').subarray(0, byteColumn).toString('utf8')].length
}
