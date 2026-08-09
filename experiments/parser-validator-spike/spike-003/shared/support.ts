import { createHash } from 'node:crypto'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { isMap, isScalar, isSeq, LineCounter, parseDocument, type Node } from 'yaml'

export type Status = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_SUPPORTED'
export type Classification = 'NATIVE' | 'DERIVABLE' | 'OAIT_OWNED_REQUIRED' | 'NOT_AVAILABLE'
export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export interface IndexedLocation {
  documentUri: string
  filePath: string
  pointer: string
  line: number
  column: number
  offset: number
}

export async function read(relativePath: string) {
  return readFile(join(root, relativePath), 'utf8')
}

export async function versions() {
  const manifest = JSON.parse(await read('package.json')) as {
    dependencies: Record<string, string>; devDependencies: Record<string, string>
  }
  return { ...manifest.dependencies, ...manifest.devDependencies }
}

export async function writeResult(name: string, value: unknown) {
  await writeFile(join(root, 'results', `${name}.json`), `${JSON.stringify(value, null, 2)}\n`)
}

export function errorInfo(error: unknown) {
  if (error instanceof Error) {
    const extra = error as Error & Record<string, unknown>
    return { type: error.constructor.name, message: error.message, code: extra.code ?? null,
      linePos: extra.linePos ?? null, pos: extra.pos ?? null }
  }
  return { type: typeof error, message: String(error), code: null, linePos: null, pos: null }
}

function escapeToken(value: string) {
  return value.replaceAll('~', '~0').replaceAll('/', '~1')
}

export async function buildIndex(relativePath: string) {
  const absolute = resolve(root, relativePath)
  const source = await read(relativePath)
  const lineCounter = new LineCounter()
  const document = parseDocument(source, { lineCounter, keepSourceTokens: true, prettyErrors: false })
  const locations = new Map<string, IndexedLocation>()
  const uri = pathToFileURL(absolute).href

  function add(pointer: string, offset: number) {
    const position = lineCounter.linePos(offset)
    locations.set(pointer, { documentUri: uri, filePath: relativePath, pointer,
      line: position.line, column: position.col, offset })
  }

  function walk(node: Node | null | undefined, pointer: string, anchor?: number) {
    if (!node) return
    const range = node.range
    add(pointer, anchor ?? range?.[0] ?? 0)
    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isScalar(pair.key)) continue
        const key = String(pair.key.value)
        walk(pair.value as Node | null, `${pointer}/${escapeToken(key)}`, pair.key.range?.[0])
      }
    } else if (isSeq(node)) {
      node.items.forEach((item, index) => walk(item as Node | null, `${pointer}/${index}`))
    }
  }
  walk(document.contents as Node | null, '')
  return { source, document, locations }
}

export async function locate(relativePath: string, pointer: string) {
  return (await buildIndex(relativePath)).locations.get(pointer) ?? null
}

export async function fixtureHashes() {
  const output: Record<string, string> = {}
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else output[relative(root, absolute)] = createHash('sha256').update(await readFile(absolute)).digest('hex')
    }
  }
  await visit(join(root, 'fixtures'))
  return output
}

export const targets = [
  { kind: 'root', pointer: '', yaml: [1, 1], json: [1, 1] },
  { kind: 'info', pointer: '/info', yaml: [2, 1], json: [3, 3] },
  { kind: 'tag', pointer: '/tags/0', yaml: [6, 5], json: [7, 12] },
  { kind: 'pathItem', pointer: '/paths/~1pets~1{petId}', yaml: [8, 3], json: [9, 5] },
  { kind: 'operation', pointer: '/paths/~1pets~1{petId}/get', yaml: [20, 5], json: [15, 7] },
  { kind: 'parameter0', pointer: '/paths/~1pets~1{petId}/parameters/0', yaml: [10, 9], json: [11, 9] },
  { kind: 'parameter1', pointer: '/paths/~1pets~1{petId}/parameters/1', yaml: [14, 9], json: [12, 9] },
  { kind: 'parameter2', pointer: '/paths/~1pets~1{petId}/parameters/2', yaml: [17, 9], json: [13, 9] },
  { kind: 'requestBody', pointer: '/paths/~1pets/post/requestBody', yaml: [38, 7], json: [27, 9] },
  { kind: 'response200', pointer: '/paths/~1pets~1{petId}/get/responses/200', yaml: [25, 9], json: [19, 11] },
  { kind: 'schema', pointer: '/components/schemas/Pet', yaml: [47, 5], json: [34, 7] },
  { kind: 'schemaProperty', pointer: '/components/schemas/Pet/properties/id', yaml: [50, 9], json: [34, 50] },
  { kind: 'escapedProperty', pointer: '/components/schemas/Pet/properties/a~1b~0c', yaml: [51, 9], json: [34, 107] },
  { kind: 'securityScheme', pointer: '/components/securitySchemes/ApiKeyAuth', yaml: [57, 5], json: [37, 26] },
  { kind: 'refDeclaration', pointer: '/paths/~1pets~1{petId}/get/responses/200/content/application~1json/schema/$ref', yaml: [29, 25], json: [19, 96] },
] as const

export async function feasibilityEvidence() {
  const yamlIndex = await buildIndex('fixtures/yaml/openapi.yaml')
  const jsonIndex = await buildIndex('fixtures/json/openapi.json')
  const samples = targets.map(target => {
    const yaml = yamlIndex.locations.get(target.pointer) ?? null
    const json = jsonIndex.locations.get(target.pointer) ?? null
    return {
      kind: target.kind, pointer: target.pointer, yaml, json,
      yamlExpected: { line: target.yaml[0], column: target.yaml[1] },
      jsonExpected: { line: target.json[0], column: target.json[1] },
      yamlExact: yaml?.line === target.yaml[0] && yaml?.column === target.yaml[1],
      jsonExact: json?.line === target.json[0] && json?.column === target.json[1],
    }
  })
  const whitespacePointer = '/paths/~1pets/get'
  const compact = await locate('fixtures/whitespace/compact.yaml', whitespacePointer)
  const expanded = await locate('fixtures/whitespace/expanded.yaml', whitespacePointer)
  const reordered = await locate('fixtures/whitespace/reordered.yaml', whitespacePointer)
  const duplicates = await Promise.all([
    '/paths/~1one/get/responses/200/description',
    '/paths/~1two/get/responses/200/description',
    '/components/schemas/Identifier/description',
  ].map(pointer => locate('fixtures/duplicate-values/openapi.yaml', pointer)))
  const hops = [
    {
      declaration: await locate('fixtures/references/openapi.yaml', '/components/schemas/Pet/$ref'),
      target: await locate('fixtures/references/models.yaml', '/Pet'),
    },
    {
      declaration: await locate('fixtures/references/models.yaml', '/Pet/properties/id/$ref'),
      target: await locate('fixtures/references/common.yaml', '/Identifier'),
    },
  ]
  return {
    technology: 'yaml@2.8.3 public parseDocument + LineCounter APIs (feasibility proof only)',
    classification: 'OAIT_OWNED_REQUIRED' as Classification,
    indexingConvention: 'RFC 6901 pointers; key-token anchor; 1-based line and column',
    samples,
    allYamlSamplesExact: samples.every(sample => sample.yamlExact),
    allJsonSamplesExact: samples.every(sample => sample.jsonExact),
    duplicateScalarLocations: duplicates,
    duplicateValuesRemainDistinct: new Set(duplicates.map(location => `${location?.line}:${location?.column}`)).size === 3,
    whitespace: { compact, expanded, reordered,
      pointerStable: [compact, expanded, reordered].every(location => location?.pointer === whitespacePointer),
      presentationMoved: new Set([compact?.line, expanded?.line, reordered?.line]).size === 3 },
    nestedReferenceHops: hops,
    multiFile: {
      operation: await locate('fixtures/multi-file/paths/pets.yaml', '/get'),
      refDeclaration: await locate('fixtures/multi-file/paths/pets.yaml', '/get/responses/200/content/application~1json/schema/$ref'),
      petTarget: await locate('fixtures/multi-file/schemas/Pet.yaml', ''),
      nestedDeclaration: await locate('fixtures/multi-file/schemas/Pet.yaml', '/properties/id/$ref'),
      identifierTarget: await locate('fixtures/multi-file/schemas/common.yaml', '/Identifier'),
    },
  }
}
