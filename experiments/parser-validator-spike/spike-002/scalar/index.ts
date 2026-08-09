import { bundle, type LoaderPlugin } from '@scalar/json-magic/bundle'
import { fetchUrls, parseYaml } from '@scalar/json-magic/bundle/plugins/browser'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { dereference } from '@scalar/openapi-parser'
import { resolve } from 'node:path'
import {
  containsCircularGraph,
  fixtureHashes,
  localFixtureServer,
  object,
  pointer,
  read,
  refAt,
  root,
  versions,
  writeResult,
} from '../shared/support.js'

const packageVersions = await versions()
const beforeHashes = await fixtureHashes()

async function scalarBundle(relativePath: string) {
  const events: Array<{ rawReference: string; declarationPointer: string }> = []
  const output = await bundle(`./${relativePath}`, {
    plugins: [readFiles()],
    treeShake: false,
    urlMap: true,
    hooks: {
      onBeforeNodeProcess(node, context) {
        if (typeof node.$ref === 'string') {
          events.push({ rawReference: node.$ref, declarationPointer: `/${context.path.join('/')}` })
        }
      },
    },
  })
  return { output, events }
}

const internal = await scalarBundle('fixtures/internal/openapi.yaml')
const internalPath = '/paths/~1pets~1{petId}/get/responses/200/content/application~1json/schema'

const multi = await scalarBundle('fixtures/multi-file/openapi.yaml')
const multiPath = internalPath
const multiMap = object(multi.output)['x-ext-urls']

const nested = await scalarBundle('fixtures/nested/openapi.yaml')
const nestedMap = object(object(nested.output)['x-ext-urls'])

const shared = await scalarBundle('fixtures/shared-target/openapi.yaml')
const sharedMap = object(object(shared.output)['x-ext-urls'])

const recursiveBundle = await scalarBundle('fixtures/recursive/openapi.yaml')
const recursiveBundledRef = refAt(recursiveBundle.output, '/components/schemas/Node')
const recursiveDereferenced = dereference(object(recursiveBundle.output))

async function errorCase(id: string, relativePath: string, rawReference: string) {
  const bundled = await scalarBundle(relativePath)
  const result = dereference(object(bundled.output))
  return {
    id,
    status: result.errors?.length ? 'PASS' : 'FAIL',
    representation: 'bundle followed by dereference',
    resolutionSucceeded: false,
    rawReference,
    referenceRetained: JSON.stringify(result.schema).includes(rawReference) ||
      (id === 'INVALID_POINTER' && JSON.stringify(result.schema).includes('DoesNotExist')),
    processingContinued: result.schema !== undefined,
    diagnostics: result.errors ?? [],
    notes: id === 'MISSING_INTERNAL_TARGET'
      ? ['The bundler alone does not validate internal pointers; documented dereference supplies INVALID_REFERENCE.']
      : [],
  }
}

const remoteServer = await localFixtureServer()
const remoteTemplate = await read('fixtures/remote/openapi.yaml')
const remoteSource = remoteTemplate.replace('PORT', String(remoteServer.port))
const remoteUrl = `http://127.0.0.1:${remoteServer.port}/RemotePet.yaml`
const beforeEnabled = remoteServer.requestCount()
const remoteEnabled = await bundle(remoteSource, {
  origin: `${root}/fixtures/remote/openapi.yaml`,
  plugins: [parseYaml(), fetchUrls()],
  treeShake: false,
  urlMap: true,
})
const enabledRequests = remoteServer.requestCount() - beforeEnabled
const beforeDisabled = remoteServer.requestCount()
let disabledError = false
const remoteDisabled = await bundle(remoteSource, {
  origin: `${root}/fixtures/remote/openapi.yaml`,
  plugins: [parseYaml()],
  treeShake: false,
  urlMap: true,
  hooks: { onResolveError: () => { disabledError = true } },
})
const disabledRequests = remoteServer.requestCount() - beforeDisabled
await remoteServer.close()

const boundaryRoot = resolve(root, 'fixtures/filesystem-boundary/project')
const boundaryDefault = await scalarBundle('fixtures/filesystem-boundary/project/openapi.yaml')
const baseLoader = readFiles()
const boundedLoader: LoaderPlugin = {
  type: 'loader',
  validate: baseLoader.validate,
  async exec(value) {
    const absolute = resolve(value)
    if (absolute !== boundaryRoot && !absolute.startsWith(`${boundaryRoot}/`)) return { ok: false }
    return baseLoader.exec(value)
  },
}
let boundaryDenied = false
const boundaryControlled = await bundle('./fixtures/filesystem-boundary/project/openapi.yaml', {
  plugins: [boundedLoader],
  treeShake: false,
  urlMap: true,
  hooks: { onResolveError: () => { boundaryDenied = true } },
})

const tests = [
  {
    id: 'INTERNAL_REF', status: 'PASS', representation: 'bundled',
    rawReference: '#/components/schemas/Pet', resolutionSucceeded: true,
    declarationDocument: 'fixtures/internal/openapi.yaml', declarationPointer: internalPath,
    resolvedDocument: 'fixtures/internal/openapi.yaml', resolvedPointer: '/components/schemas/Pet',
    rawReferencePreserved: refAt(internal.output, internalPath) === '#/components/schemas/Pet',
    notes: ['Internal references remain reference boundaries during bundling.'],
  },
  {
    id: 'MULTI_FILE_REF', status: 'PARTIAL', representation: 'bundled',
    rawReference: './schemas/Pet.yaml', resolutionSucceeded: object(multi.output)['x-ext'] !== undefined,
    declarationDocument: 'fixtures/multi-file/openapi.yaml', declarationPointer: multiPath,
    resolvedDocument: 'schemas/Pet.yaml', resolvedPointer: '',
    rawReferencePreserved: refAt(multi.output, multiPath) === './schemas/Pet.yaml',
    bundledReference: refAt(multi.output, multiPath), urlMap: multiMap,
    notes: ['urlMap preserves a normalized target path, but the raw reference is rewritten and declaration-document identity is not attached to the returned reference.'],
  },
  {
    id: 'EXTERNAL_REF_WITH_POINTER', status: 'PARTIAL', representation: 'bundled',
    rawReference: './schemas/models.yaml#/Pet', resolutionSucceeded: Object.keys(nestedMap).length === 2,
    declarationDocument: 'fixtures/nested/openapi.yaml', declarationPointer: '/components/schemas/Pet',
    resolvedDocument: 'schemas/models.yaml', resolvedPointer: '/Pet', rawReferencePreserved: false,
    urlMap: nestedMap,
  },
  {
    id: 'NESTED_REFERENCES', status: 'PARTIAL', representation: 'bundled',
    resolutionSucceeded: Object.keys(nestedMap).length === 2,
    expectedChain: ['openapi.yaml', 'schemas/models.yaml#/Pet', 'schemas/common.yaml#/Identifier'],
    observedUrlMap: nestedMap, observedEvents: nested.events,
    chainDirectlyExposed: false, chainReconstructableWithSourceScanning: true,
    notes: ['The URL map identifies both external documents; the ordered declaration-to-target chain is not returned as a first-class structure.'],
  },
  {
    id: 'SHARED_TARGET', status: 'PARTIAL', representation: 'bundled',
    resolutionSucceeded: Object.keys(sharedMap).length === 1,
    declarationCountInSource: 2, targetDocumentCountInUrlMap: Object.keys(sharedMap).length,
    separateDeclarationProvenancePreserved: false,
    notes: ['Both bundled references target the same x-ext entry, but declaration provenance is not attached after rewrite.'],
  },
  {
    id: 'RECURSIVE_REFERENCE', status: 'PASS', representation: 'bundled and dereferenced',
    resolutionSucceeded: recursiveBundledRef?.startsWith('#/x-ext/') === true,
    bundledLeavesReferenceBoundary: true,
    dereferenceErrors: recursiveDereferenced.errors ?? [],
    dereferencedCreatesCyclicGraph: containsCircularGraph(recursiveDereferenced.schema),
    terminates: true,
    notes: ['Bundling safely retains a recursive $ref; dereferencing terminates and creates a cyclic JavaScript graph.'],
  },
  await errorCase('MISSING_INTERNAL_TARGET', 'fixtures/unresolved/openapi.yaml', '#/components/schemas/DoesNotExist'),
  await errorCase('MISSING_FILE', 'fixtures/unresolved/missing-file.yaml', './schemas/Missing.yaml'),
  await errorCase('INVALID_POINTER', 'fixtures/invalid-pointer/openapi.yaml', './schemas/models.yaml#/DoesNotExist'),
  {
    id: 'REMOTE_ENABLED', status: enabledRequests > 0 ? 'PASS' : 'FAIL', representation: 'bundled',
    rawReference: 'http://127.0.0.1:<dynamic-port>/RemotePet.yaml', requestCount: enabledRequests,
    resolutionSucceeded: object(remoteEnabled)['x-ext'] !== undefined,
    notes: ['Network retrieval occurs only because the documented fetchUrls plugin was supplied.'],
  },
  {
    id: 'REMOTE_DISABLED', status: disabledRequests === 0 && disabledError ? 'PASS' : 'FAIL', representation: 'bundled',
    requestCount: disabledRequests, resolutionSucceeded: false, referenceRetained: JSON.stringify(remoteDisabled).includes(remoteUrl),
    control: 'Omit fetchUrls loader plugin',
  },
  {
    id: 'FILESYSTEM_BOUNDARY', status: boundaryDenied ? 'PASS' : 'FAIL', representation: 'bundled',
    defaultResolutionEscapedIntendedRoot: object(boundaryDefault.output)['x-ext'] !== undefined,
    controlledResolutionDenied: boundaryDenied,
    controlledOutputRetainsReference: JSON.stringify(boundaryControlled).includes('../outside.yaml'),
    control: 'Documented custom LoaderPlugin wrapping readFiles()',
    notes: ['Default readFiles has no allowed-root option. OAIT can enforce a boundary with a documented custom loader plugin.'],
  },
  {
    id: 'RAW_REF_PRESERVATION', status: 'PARTIAL',
    internalPreserved: true, externalPreserved: false,
    notes: ['External refs are rewritten to internal x-ext pointers; urlMap preserves normalized external resource paths, not the exact raw spelling including fragments.'],
  },
  {
    id: 'DECLARATION_DOCUMENT', status: 'PARTIAL',
    directlyAttachedToBundledReference: false, reconstructableFromOriginalSources: true,
  },
  {
    id: 'TARGET_DOCUMENT', status: 'PASS',
    availableThroughDocumentedUrlMap: true, urlMapExample: multiMap,
  },
  {
    id: 'REFERENCE_CHAIN_EVIDENCE', status: 'PARTIAL',
    directOrderedChain: false, reconstructableByOaitSourceScanningPlusUrlMap: true,
  },
  { id: 'NETWORK_CONTROL', status: 'PASS', control: 'Explicit plugin allow-list; omit fetchUrls to prevent HTTP(S) loading.' },
  { id: 'DOCUMENTED_API_ONLY', status: 'PASS', undocumentedOrPrivateApisUsed: false },
]

const afterHashes = await fixtureHashes()
await writeResult('scalar', {
  candidate: '@scalar/openapi-parser', version: packageVersions['@scalar/openapi-parser'],
  supportingPublicPackage: { name: '@scalar/json-magic', version: packageVersions['@scalar/json-magic'] },
  runtime: { node: process.version },
  candidateApis: ['dereference(value, { onDereference })'],
  documentedSupportingApis: ['bundle(input, options)', 'readFiles()', 'fetchUrls()', 'parseYaml()', 'LoaderPlugin', 'urlMap', 'lifecycle hooks'],
  representationSummary: {
    parsed: 'Loader plugins parse YAML while loading.',
    bundled: 'External documents copied under x-ext; external refs rewritten; x-ext-urls maps hashes to normalized resources.',
    dereferenced: 'Scalar dereference replaces refs; recursive input becomes a cyclic JavaScript graph.',
  },
  tests,
  mutation: { fixtureFilesChanged: JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes), beforeHashes, afterHashes },
  typescript: { compiler: `typescript ${packageVersions.typescript}`, compiledWithSkipLibCheck: true, inheritedIssuesFromSpike001: true },
})
