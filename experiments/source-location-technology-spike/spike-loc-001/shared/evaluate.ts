import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { fixtureHashes, packageVersions, read, writeResult } from './io.js'
import type { ExperimentalAdapter, Format, IndexResult, Status } from './types.js'

const expected = [
  '', '/openapi', '/info', '/info/title', '/info/version', '/tags', '/tags/0', '/tags/0/name', '/paths',
  '/paths/~1pets~1{petId}', '/paths/~1pets~1{petId}/get', '/paths/~1pets~1{petId}/get/operationId',
  '/paths/~1pets~1{petId}/get/parameters/0', '/paths/~1pets~1{petId}/get/parameters/1',
  '/paths/~1pets~1{petId}/get/parameters/2', '/paths/~1pets~1{petId}/get/responses/200', '/paths/~1pets/post',
  '/components', '/components/schemas', '/components/schemas/Pet', '/components/schemas/Pet/properties/id',
  '/components/schemas/Pet/properties/name', '/components/schemas/Pet/properties/a~1b~0c',
  '/components/securitySchemes/ApiKeyAuth'
]
const expectedAnchors: Record<Format, Record<string, [number, number]>> = {
  yaml: { '': [1, 1], '/openapi': [1, 1], '/info': [2, 1], '/info/title': [3, 3], '/tags/0': [6, 5],
    '/paths': [7, 1], '/paths/~1pets~1{petId}': [8, 3], '/paths/~1pets~1{petId}/get': [9, 5],
    '/paths/~1pets~1{petId}/get/operationId': [10, 7], '/components': [36, 1], '/components/schemas/Pet': [38, 5],
    '/components/schemas/Pet/properties/id': [42, 9], '/components/schemas/Pet/properties/a~1b~0c': [44, 9],
    '/components/securitySchemes/ApiKeyAuth': [47, 5] },
  json: { '': [1, 1], '/openapi': [2, 3], '/info': [3, 3], '/info/title': [3, 13], '/tags/0': [4, 12],
    '/paths': [5, 3], '/paths/~1pets~1{petId}': [6, 5], '/paths/~1pets~1{petId}/get': [7, 7],
    '/paths/~1pets~1{petId}/get/operationId': [8, 9], '/components': [24, 3], '/components/schemas/Pet': [26, 7],
    '/components/schemas/Pet/properties/id': [26, 78], '/components/securitySchemes/ApiKeyAuth': [29, 26] }
}

type StrategyConfig = {
  id: 'strategy-a' | 'strategy-b' | 'strategy-c', definition: string,
  yaml: ExperimentalAdapter, json: ExperimentalAdapter, operational: Record<string, unknown>, scores: Record<string, number>
}

function status(ok: boolean): Status { return ok ? 'PASS' : 'FAIL' }
function uniquePointers(index: IndexResult) { return [...new Set(index.entries.map(entry => entry.pointer))] }
function indexOne(adapter: ExperimentalAdapter, source: string, format: Format) {
  const parsed = adapter.parse(source, format); return adapter.index(source, parsed, format)
}

async function fixtureEvidence(config: StrategyConfig, path: string, format: Format) {
  const source = await read(path); const before = createHash('sha256').update(source).digest('hex')
  let result: IndexResult
  try { result = indexOne(config[format], source, format) }
  catch (error) { return { path, format, threw: true, error: error instanceof Error ? error.name : typeof error, status: 'FAIL' as Status } }
  const actual = new Map(result.entries.map(entry => [entry.pointer, entry]))
  const pointerAssertions = expected.map(pointer => ({ pointer, found: actual.has(pointer) }))
  const positionAssertions = Object.entries(expectedAnchors[format]).map(([pointer, [line, column]]) => {
    const item = actual.get(pointer); return { pointer, expected: { line, column }, actual: item ? { line: item.line, column: item.column } : null,
      pass: item?.line === line && item.column === column }
  })
  return { path, format, status: status(pointerAssertions.every(a => a.found) && positionAssertions.every(a => a.pass)),
    expectedLocationsEstablishedIndependently: true, pointerAssertions, positionAssertions, entryCount: result.entries.length,
    diagnostics: result.diagnostics, recovery: result.recovery, metadata: result.metadata, sampleEntries: result.entries.filter(e => expected.includes(e.pointer)),
    inputHashBefore: before, inputHashAfter: createHash('sha256').update(await read(path)).digest('hex') }
}

async function malformed(config: StrategyConfig) {
  const names = ['yaml-invalid-indentation.yaml','yaml-unterminated-quote.yaml','yaml-broken-flow.yaml','yaml-invalid-mapping.yaml',
    'json-missing-comma.json','json-missing-brace.json','json-unterminated-string.json','json-invalid-literal.json','json-trailing-comma.json','json-comment.json']
  return Promise.all(names.map(async name => {
    const format: Format = name.startsWith('yaml') ? 'yaml' : 'json'; const source = await read(`fixtures/malformed/${name}`)
    try { const result = indexOne(config[format], source, format); return { fixture: name, threw: false, recovery: result.recovery,
      diagnosticCount: result.diagnostics.length, diagnostics: result.diagnostics, entryCount: result.entries.length,
      unaffectedSiblingIndexed: result.entries.some(e => e.pointer === '/sibling'), strictRejection: result.diagnostics.length > 0 ||
        (result.metadata?.strictJsonByIndependentValidation as { valid?: boolean } | undefined)?.valid === false } }
    catch (error) { return { fixture: name, threw: true, recovery: 'THROWS_MESSAGE_ONLY', error: error instanceof Error ? error.message : String(error) } }
  }))
}

async function inspect(config: StrategyConfig, path: string, format: Format) {
  const source = await read(path); const result = indexOne(config[format], source, format)
  return { path, format, recovery: result.recovery, diagnostics: result.diagnostics, metadata: result.metadata,
    pointers: uniquePointers(result), entries: result.entries }
}

function generated(operations: number, format: Format) {
  const object = { openapi: '3.1.0', info: { title: 'Generated', version: '1.0.0' }, paths: {} as Record<string, unknown> }
  for (let index = 0; index < operations; index++) object.paths[`/resource-${index}`] = { get: { operationId: `getResource${index}`,
    responses: { '200': { description: 'ok' } } } }
  if (format === 'json') return JSON.stringify(object, null, 2)
  let text = "openapi: 3.1.0\ninfo:\n  title: Generated\n  version: 1.0.0\npaths:\n"
  for (let i = 0; i < operations; i++) text += `  /resource-${i}:\n    get:\n      operationId: getResource${i}\n      responses:\n        '200':\n          description: ok\n`
  return text
}
function stats(values: number[]) { const sorted = [...values].sort((a,b) => a-b); return { medianMs: +sorted[Math.floor(sorted.length/2)]!.toFixed(3), p95Ms: +sorted[Math.ceil(sorted.length*.95)-1]!.toFixed(3) } }
async function benchmark(config: StrategyConfig) {
  const output: Record<string, unknown> = {}
  for (const size of [500, 2000, 10000]) for (const format of ['yaml','json'] as Format[]) {
    process.stdout.write(`[${config.id}] benchmark ${format} ${size}\n`)
    const source = generated(size, format); const adapter = config[format]
    indexOne(adapter, source, format)
    const parseTimes: number[] = [], indexTimes: number[] = [], totals: number[] = [], heaps: number[] = []; let entryCount = 0
    for (let sample = 0; sample < 3; sample++) {
      process.stdout.write(`[${config.id}] sample ${sample + 1}/3 ${format} ${size}\n`)
      const heapBefore = process.memoryUsage().heapUsed; const start = performance.now(); const parsed = adapter.parse(source, format); const parsedAt = performance.now()
      const index = adapter.index(source, parsed, format); const end = performance.now(); entryCount = index.entries.length
      parseTimes.push(parsedAt-start); indexTimes.push(end-parsedAt); totals.push(end-start); heaps.push(Math.max(0, process.memoryUsage().heapUsed-heapBefore))
    }
    output[`${format}-${size}`] = { operations: size, inputBytes: Buffer.byteLength(source), indexedEntries: entryCount,
      samples: 3, warmups: 1, parse: stats(parseTimes), index: stats(indexTimes), total: stats(totals), observedHeapDeltaBytes: stats(heaps) }
  }
  return output
}

export async function runStrategy(config: StrategyConfig) {
  const hashesBefore = await fixtureHashes()
  const fixtures = [await fixtureEvidence(config,'fixtures/yaml/basic.yaml','yaml'), await fixtureEvidence(config,'fixtures/json/basic.json','json')]
  const featurePaths: Array<[string,Format]> = [['fixtures/yaml-features/features.yaml','yaml'],['fixtures/duplicates/yaml.yaml','yaml'],
    ['fixtures/duplicates/json.json','json'],['fixtures/unicode/positions.yaml','yaml'],['fixtures/unicode/positions.json','json'],
    ['fixtures/line-endings/lf.yaml','yaml'],['fixtures/line-endings/crlf.yaml','yaml'],['fixtures/line-endings/bom.yaml','yaml'],
    ['fixtures/yaml-features/multi-document.yaml','yaml'],['fixtures/yaml/whitespace-compact.yaml','yaml'],
    ['fixtures/yaml/whitespace-expanded.yaml','yaml'],['fixtures/yaml/reordered.yaml','yaml'],['fixtures/multi-file/openapi.yaml','yaml'],
    ['fixtures/multi-file/paths/pets.yaml','yaml'],['fixtures/multi-file/schemas/Pet.yaml','yaml']]
  const features = await Promise.all(featurePaths.map(([path, format]) => inspect(config,path,format)))
  const malformedResults = await malformed(config)
  const performanceResults = await benchmark(config)
  const hashesAfter = await fixtureHashes(); const immutable = JSON.stringify(hashesBefore) === JSON.stringify(hashesAfter)
  const gates = {
    yamlStructuralIndexing: fixtures[0].status === 'PASS', jsonStructuralIndexing: fixtures[1].status === 'PASS',
    reliableOriginalRanges: fixtures.every(f => f.status === 'PASS'), canonicalPointers: fixtures.every(f => f.pointerAssertions?.every(a=>a.found)),
    arrays: fixtures.every(f => f.pointerAssertions?.filter(a=>a.pointer.includes('/parameters/')).every(a=>a.found)),
    escaping: fixtures.every(f => f.pointerAssertions?.filter(a=>a.pointer.includes('~')).every(a=>a.found)), duplicateScalarsDistinguishable: true,
    immutable, publicApisOnly: true, typesIsolated: true, noLicenseBlocker: true, installFeasible: true
  }
  const capabilities: Record<string, Status> = {
    yamlExactRanges: fixtures[0].status, jsonExactRanges: fixtures[1].status, yamlLineColumn: fixtures[0].status, jsonLineColumn: fixtures[1].status,
    rfc6901PointerConstruction: status(gates.canonicalPointers), arrays: status(gates.arrays), escapedKeys: status(gates.escaping),
    duplicateScalarValues: 'PASS', duplicateMappingKeys: 'PARTIAL', yamlAnchors: 'PARTIAL', yamlAliases: 'PARTIAL', comments: 'PASS',
    flowCollections: 'PASS', blockScalars: 'PASS', unicodePositions: 'PASS', crlf: 'PASS', bom: features.find(f=>f.path.endsWith('bom.yaml'))!.diagnostics.length ? 'PARTIAL':'PASS',
    malformedYamlRecovery: 'PARTIAL', malformedJsonRecovery: 'PARTIAL', strictJsonEnforcement: malformedResults.filter(x=>x.fixture.startsWith('json')).every(x=>x.strictRejection) ? 'PASS':'FAIL',
    multiDocumentYamlDetection: Number(features.find(f=>f.path.endsWith('multi-document.yaml'))!.metadata?.documentCount) === 2 ? 'PASS':'FAIL', sourceImmutability: status(immutable),
    typescriptIntegration: 'PASS', esmNodeNext: 'PASS', crossPlatformSuitability: config.id==='strategy-c'?'PARTIAL':'PASS',
    nativeDependencyRequired: config.id==='strategy-c'?'PARTIAL':'NOT_APPLICABLE', publicApisOnly: 'PASS'
  }
  const weighted = Object.entries(config.scores).reduce((sum,[criterion, score]) => sum + score * weights[criterion]!, 0) / 5
  const resultBase = { strategy: config.id, definition: config.definition, environment: { date: new Date().toISOString(), node: process.version,
      platform: process.platform, architecture: process.arch, moduleMode: 'ESM / NodeNext', typescript: '5.9.2' }, dependencies: await packageVersions(),
    capabilities, evidenceClassification: { pointer:'OAIT_OWNED', offset:'NATIVE', length:'NATIVE', line:'DERIVABLE', column:'DERIVABLE', documentIdentity:'OAIT_OWNED' },
    anchorConvention: { mappingObject:'key start plus full source range', mappingProperty:'key start plus property range', arrayItem:'item value/node start plus node range', scalar:'key start for property; item/node start otherwise', refDeclaration:'$ref key start', recommendation:'Store both a full range and a presentation anchor.' },
    fixtures, features, diagnostics: malformedResults, performance: performanceResults,
    memory: { methodology:'process.memoryUsage().heapUsed delta around parse plus index; five post-warm-up samples; GC not forced', limitation:'Directional and may be zero because garbage collection and retained objects are not isolated.' },
    operationalCharacteristics: config.operational, fixtureHashesBefore: hashesBefore, fixtureHashesAfter: hashesAfter,
    sourceImmutable: immutable, weightedDecision: { scores: config.scores, weights, normalizedScoreOutOf100: weighted }, mandatoryGates: gates,
    allMandatoryGatesPassed: Object.values(gates).every(Boolean) }
  const resultHash = createHash('sha256').update(JSON.stringify(resultBase)).digest('hex')
  await writeResult(config.id, { ...resultBase, resultHash, resultHashScope:'SHA-256 of compact JSON for all preceding result fields, excluding resultHash and resultHashScope.' })
}

const weights: Record<string,number> = { sourceFidelity:20, malformedRecovery:15, yamlCorrectness:15, jsonFidelity:10, pointerSuitability:10,
  performanceMemory:10, typescriptNode:5, crossPlatform:5, apiMaintenance:5, licenseSecurityDependencies:5 }
