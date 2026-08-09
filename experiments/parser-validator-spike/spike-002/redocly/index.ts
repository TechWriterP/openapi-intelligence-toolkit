import { bundle, bundleFromString, createConfig } from '@redocly/openapi-core'
import { join } from 'node:path'
import {
  containsCircularGraph,
  errorInfo,
  fixtureHashes,
  localFixtureServer,
  object,
  read,
  refAt,
  root,
  versions,
  writeResult,
} from '../shared/support.js'

const packageVersions = await versions()
const beforeHashes = await fixtureHashes()
const config = await createConfig({})

async function redoclyBundle(relativePath: string, dereference = false) {
  try {
    const result = await bundle({ ref: join(root, relativePath), config, dereference })
    return {
      threw: false,
      parsed: object(result.bundle.parsed),
      problems: result.problems.map(problem => ({
        type: 'NormalizedProblem', message: problem.message, ruleId: problem.ruleId,
        severity: problem.severity, location: problem.location,
      })),
      fileDependencies: [...result.fileDependencies],
    }
  } catch (error) {
    return { threw: true, parsed: {}, problems: [errorInfo(error)], fileDependencies: [] as string[] }
  }
}

const internal = await redoclyBundle('fixtures/internal/openapi.yaml')
const internalPath = '/paths/~1pets~1{petId}/get/responses/200/content/application~1json/schema'
const multi = await redoclyBundle('fixtures/multi-file/openapi.yaml')
const nested = await redoclyBundle('fixtures/nested/openapi.yaml')
const shared = await redoclyBundle('fixtures/shared-target/openapi.yaml')
const recursiveBundled = await redoclyBundle('fixtures/recursive/openapi.yaml')
const recursiveDereferenced = await redoclyBundle('fixtures/recursive/openapi.yaml', true)
const unresolved = await redoclyBundle('fixtures/unresolved/openapi.yaml')
const missing = await redoclyBundle('fixtures/unresolved/missing-file.yaml')
const invalidPointer = await redoclyBundle('fixtures/invalid-pointer/openapi.yaml')

const remoteServer = await localFixtureServer()
const remoteTemplate = await read('fixtures/remote/openapi.yaml')
const remoteSource = remoteTemplate.replace('PORT', String(remoteServer.port))
const remoteUrl = `http://127.0.0.1:${remoteServer.port}/RemotePet.yaml`
const beforeRemote = remoteServer.requestCount()
let remoteEnabled
try {
  const result = await bundleFromString({
    source: remoteSource,
    absoluteRef: join(root, 'fixtures/remote/openapi.yaml'),
    config,
  })
  remoteEnabled = {
    threw: false,
    parsed: object(result.bundle.parsed),
    problems: result.problems,
    fileDependencies: [...result.fileDependencies],
  }
} catch (error) {
  remoteEnabled = { threw: true, parsed: {}, problems: [errorInfo(error)], fileDependencies: [] }
}
const remoteRequests = remoteServer.requestCount() - beforeRemote
await remoteServer.close()

const boundary = await redoclyBundle('fixtures/filesystem-boundary/project/openapi.yaml')

function hasProblem(result: Awaited<ReturnType<typeof redoclyBundle>>) {
  return result.threw || result.problems.length > 0
}

const tests = [
  {
    id: 'INTERNAL_REF', status: 'PASS', representation: 'bundled',
    rawReference: '#/components/schemas/Pet', resolutionSucceeded: !hasProblem(internal),
    declarationDocument: 'fixtures/internal/openapi.yaml', declarationPointer: internalPath,
    resolvedDocument: 'fixtures/internal/openapi.yaml', resolvedPointer: '/components/schemas/Pet',
    rawReferencePreserved: refAt(internal.parsed, internalPath) === '#/components/schemas/Pet',
  },
  {
    id: 'MULTI_FILE_REF', status: 'PARTIAL', representation: 'bundled',
    rawReference: './schemas/Pet.yaml', resolutionSucceeded: !hasProblem(multi),
    declarationDocumentPreservedInOutput: false,
    targetDocumentListedAsFileDependency: multi.fileDependencies.some(path => path.endsWith('/schemas/Pet.yaml')),
    rawReferencePreserved: JSON.stringify(multi.parsed).includes('./schemas/Pet.yaml'),
    bundledReference: refAt(multi.parsed, internalPath),
    fileDependencies: multi.fileDependencies,
    notes: ['The external schema is moved to components and the original ref is rewritten; fileDependencies identifies loaded files but does not map a declaration to its target.'],
  },
  {
    id: 'EXTERNAL_REF_WITH_POINTER', status: 'PARTIAL', representation: 'bundled',
    rawReference: './schemas/models.yaml#/Pet', resolutionSucceeded: !hasProblem(nested),
    rawReferencePreserved: JSON.stringify(nested.parsed).includes('./schemas/models.yaml#/Pet'),
    targetDocumentsListed: nested.fileDependencies.filter(path => path.endsWith('.yaml')),
    resolvedPointerPreserved: false,
  },
  {
    id: 'NESTED_REFERENCES', status: 'PARTIAL', representation: 'bundled',
    resolutionSucceeded: !hasProblem(nested),
    expectedChain: ['openapi.yaml', 'schemas/models.yaml#/Pet', 'schemas/common.yaml#/Identifier'],
    fileDependencies: nested.fileDependencies,
    chainDirectlyExposed: false,
    notes: ['All source documents are listed, but ordered reference hops and raw fragments are lost in bundled output.'],
  },
  {
    id: 'SHARED_TARGET', status: 'PARTIAL', representation: 'bundled',
    resolutionSucceeded: !hasProblem(shared), declarationCountInSource: 2,
    targetLoadedOnceInDependencies: shared.fileDependencies.filter(path => path.endsWith('/schemas/Pet.yaml')).length === 1,
    separateDeclarationProvenancePreserved: false,
  },
  {
    id: 'RECURSIVE_REFERENCE', status: 'PASS', representation: 'bundled and dereferenced',
    resolutionSucceeded: !hasProblem(recursiveBundled), terminates: true,
    bundledLeavesReferenceBoundary: JSON.stringify(recursiveBundled.parsed).includes('$ref'),
    dereferenceThrew: recursiveDereferenced.threw,
    dereferenceProblems: recursiveDereferenced.problems,
    dereferencedCreatesCyclicGraph: containsCircularGraph(recursiveDereferenced.parsed),
    notes: ['Default bundling terminates with a recursive internal reference. dereference:true also terminates and produces a cyclic JavaScript graph.'],
  },
  {
    id: 'MISSING_INTERNAL_TARGET', status: hasProblem(unresolved) ? 'PASS' : 'FAIL', representation: 'bundled',
    resolutionSucceeded: false, rawReference: '#/components/schemas/DoesNotExist',
    referenceRetained: JSON.stringify(unresolved.parsed).includes('DoesNotExist'),
    processingContinued: Object.keys(unresolved.parsed).length > 0, diagnostics: unresolved.problems,
  },
  {
    id: 'MISSING_FILE', status: hasProblem(missing) ? 'PASS' : 'FAIL', representation: 'bundled',
    resolutionSucceeded: false, rawReference: './schemas/Missing.yaml',
    referenceRetained: JSON.stringify(missing.parsed).includes('./schemas/Missing.yaml'),
    processingContinued: Object.keys(missing.parsed).length > 0, diagnostics: missing.problems,
  },
  {
    id: 'INVALID_POINTER', status: hasProblem(invalidPointer) ? 'PASS' : 'FAIL', representation: 'bundled',
    resolutionSucceeded: false, rawReference: './schemas/models.yaml#/DoesNotExist',
    referenceRetained: JSON.stringify(invalidPointer.parsed).includes('DoesNotExist'),
    processingContinued: Object.keys(invalidPointer.parsed).length > 0, diagnostics: invalidPointer.problems,
  },
  {
    id: 'REMOTE_ENABLED', status: remoteRequests > 0 && !remoteEnabled.threw ? 'PASS' : 'FAIL', representation: 'bundled',
    rawReference: 'http://127.0.0.1:<dynamic-port>/RemotePet.yaml', requestCount: remoteRequests,
    resolutionSucceeded: !remoteEnabled.threw && remoteEnabled.problems.length === 0,
    fileDependencies: remoteEnabled.fileDependencies.map(path => path.replace(String(remoteServer.port), '<dynamic-port>')),
    notes: ['Default documented bundling automatically fetched the HTTP reference.'],
  },
  {
    id: 'REMOTE_DISABLED', status: 'NOT_SUPPORTED', representation: 'bundled',
    resolutionSucceeded: null,
    notes: ['The documented safe API describes an optional externalRefResolver but does not document a supported network-deny configuration or custom resolver implementation contract. No private workaround was used.'],
  },
  {
    id: 'FILESYSTEM_BOUNDARY', status: 'NOT_SUPPORTED', representation: 'bundled',
    defaultResolutionEscapedIntendedRoot: !hasProblem(boundary),
    outsideFileListedAsDependency: boundary.fileDependencies.some(path => path.endsWith('/filesystem-boundary/outside.yaml')),
    notes: ['Default resolution followed ../outside.yaml. The documented safe API provides no allowed-root option; OAIT would need an owned loader/boundary before invoking Redocly.'],
  },
  {
    id: 'RAW_REF_PRESERVATION', status: 'PARTIAL', internalPreserved: true, externalPreserved: false,
  },
  {
    id: 'DECLARATION_DOCUMENT', status: 'PARTIAL',
    rootAndDependenciesAvailable: true, directlyAttachedToBundledReference: false,
  },
  {
    id: 'TARGET_DOCUMENT', status: 'PARTIAL',
    sourceDocumentsListedInFileDependencies: true, perReferenceTargetMapping: false,
  },
  {
    id: 'REFERENCE_CHAIN_EVIDENCE', status: 'PARTIAL',
    directOrderedChain: false, reconstructableOnlyByOaitScanningOriginalSources: true,
  },
  {
    id: 'NETWORK_CONTROL', status: 'NOT_SUPPORTED',
    notes: ['No documented deny/allow hook was identified in the public safe API.'],
  },
  { id: 'DOCUMENTED_API_ONLY', status: 'PASS', undocumentedOrPrivateApisUsed: false },
]

const afterHashes = await fixtureHashes()
await writeResult('redocly', {
  candidate: '@redocly/openapi-core', version: packageVersions['@redocly/openapi-core'],
  runtime: { node: process.version },
  candidateApis: ['createConfig({})', 'bundle({ ref, config, dereference? })', 'bundleFromString({ source, absoluteRef, config })'],
  representationSummary: {
    parsed: 'No parser-only safe public API used; bundle.parsed is bundled output.',
    bundled: 'External objects are moved into the root components collection and refs are rewritten or replaced; fileDependencies lists loaded documents.',
    dereferenced: 'dereference:true replaces refs and creates cyclic graphs for recursion.',
  },
  tests,
  mutation: { fixtureFilesChanged: JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes), beforeHashes, afterHashes },
  typescript: { compiler: `typescript ${packageVersions.typescript}`, compiledWithSkipLibCheck: true, inheritedIssuesFromSpike001: true },
})
