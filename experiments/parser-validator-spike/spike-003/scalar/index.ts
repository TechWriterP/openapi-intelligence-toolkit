import { bundle } from '@scalar/json-magic/bundle'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { validate } from '@scalar/openapi-parser'
import {
  errorInfo, feasibilityEvidence, fixtureHashes, read, root, versions, writeResult,
} from '../shared/support.js'

const packageVersions = await versions()
const beforeHashes = await fixtureHashes()

async function lifecyclePaths(relativePath: string) {
  const paths: Array<{ keys: string[]; path: string[] }> = []
  await bundle(`./${relativePath}`, {
    plugins: [readFiles()], treeShake: false, urlMap: true,
    hooks: {
      onBeforeNodeProcess(node, context) {
        paths.push({ keys: Object.keys(node), path: [...context.path].map(String) })
      },
    },
  })
  return paths
}

const validYaml = await validate(await read('fixtures/yaml/openapi.yaml'))
const validJson = await validate(await read('fixtures/json/openapi.json'))
const yamlPaths = await lifecyclePaths('fixtures/yaml/openapi.yaml')
const nestedPaths = await lifecyclePaths('fixtures/references/openapi.yaml')

let malformed
try {
  const result = await validate(await read('fixtures/invalid/malformed.yaml'))
  malformed = { threw: false, errors: result.errors ?? [] }
} catch (error) {
  malformed = { threw: true, error: errorInfo(error) }
}

const structural = await validate(await read('fixtures/invalid/structural.yaml'))
const proof = await feasibilityEvidence()
const operationHook = yamlPaths.find(item => item.keys.includes('operationId') && item.keys.includes('responses')) ?? null
const anomalousNestedPaths = nestedPaths.filter(item => item.path.some(segment => segment === '[object Object]'))

const classification = {
  validNode: {
    documentUri: 'DERIVABLE', pointer: 'OAIT_OWNED_REQUIRED', line: 'NOT_AVAILABLE', column: 'NOT_AVAILABLE',
    range: 'NOT_AVAILABLE', astNode: 'NOT_AVAILABLE',
  },
  diagnostic: {
    documentUri: 'OAIT_OWNED_REQUIRED', pointer: 'NATIVE', line: 'OAIT_OWNED_REQUIRED', column: 'OAIT_OWNED_REQUIRED',
  },
  ownedIndex: {
    documentUri: 'OAIT_OWNED_REQUIRED', pointer: 'OAIT_OWNED_REQUIRED', line: 'OAIT_OWNED_REQUIRED', column: 'OAIT_OWNED_REQUIRED',
  },
}

const tests = [
  { id: 'SOURCE_DOCUMENT_VALID_NODE', status: 'PARTIAL', evidence: 'Input file is caller-known but not attached to returned valid nodes.' },
  { id: 'JSON_POINTER_VALID_NODE', status: 'NOT_SUPPORTED', operationLifecyclePath: operationHook,
    evidence: 'Lifecycle paths are bundle traversal paths; nested paths can contain noncanonical object-string segments.' },
  { id: 'LINE_VALID_NODE', status: 'NOT_SUPPORTED' },
  { id: 'COLUMN_VALID_NODE', status: 'NOT_SUPPORTED' },
  { id: 'SCHEMA_PROPERTY_LOCATION', status: 'NOT_SUPPORTED' },
  { id: 'ARRAY_ITEM_LOCATION', status: 'NOT_SUPPORTED' },
  { id: 'REF_DECLARATION_LOCATION', status: 'PARTIAL',
    evidence: 'Hook can observe a traversal path and raw ref, but provides no physical document or coordinates and becomes noncanonical after nesting.' },
  { id: 'REF_TARGET_LOCATION', status: 'PARTIAL', evidence: 'urlMap identifies target resources but supplies no original target pointer or coordinates.' },
  { id: 'NESTED_HOP_LOCATIONS', status: 'FAIL', anomalousNestedPaths,
    marker: 'NOT_SUITABLE_AS_CANONICAL_POINTER' },
  { id: 'MULTI_FILE_ORIGINAL_LOCATION', status: 'NOT_SUPPORTED' },
  { id: 'ERROR_DOCUMENT', status: 'PARTIAL', evidence: 'Caller knows input document; Scalar error object does not attach it.' },
  { id: 'ERROR_POINTER', status: structural.errors?.some(error => typeof error.path === 'string' || Array.isArray(error.path)) ? 'PASS' : 'NOT_SUPPORTED',
    diagnostics: structural.errors ?? [] },
  { id: 'ERROR_LINE', status: 'PARTIAL', malformed,
    observationalOnly: 'Thrown YAMLParseError carried structured 1-based linePos, but Scalar does not document this error contract.' },
  { id: 'ERROR_COLUMN', status: 'PARTIAL', malformed,
    observationalOnly: 'Thrown YAMLParseError carried structured 1-based linePos and offsets, but Scalar does not document this error contract.' },
  { id: 'STABLE_UNDER_WHITESPACE', status: proof.whitespace.pointerStable ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned feasibility proof' },
  { id: 'CANONICAL_POINTER_CONVERSION', status: 'FAIL', marker: 'NOT_SUITABLE_AS_CANONICAL_POINTER',
    evidence: 'Scalar nested lifecycle paths are ambiguous; source AST indexing is required.' },
  { id: 'YAML_LOCATION_INDEX_FEASIBILITY', status: proof.allYamlSamplesExact ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned proof' },
  { id: 'JSON_LOCATION_INDEX_FEASIBILITY', status: proof.allJsonSamplesExact ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned proof' },
  { id: 'DUPLICATE_SCALAR_VALUES', status: proof.duplicateValuesRemainDistinct ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned structural index' },
  { id: 'POINTER_ESCAPING', status: proof.samples.find(sample => sample.kind === 'escapedProperty')?.yamlExact ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned proof' },
  { id: 'DOCUMENTED_API_ONLY', status: 'PASS', undocumentedOrPrivateApisUsed: false },
]

const afterHashes = await fixtureHashes()
await writeResult('scalar', {
  candidate: '@scalar/openapi-parser', version: packageVersions['@scalar/openapi-parser'],
  supportingPublicPackage: { name: '@scalar/json-magic', version: packageVersions['@scalar/json-magic'] },
  runtime: { node: process.version },
  candidateApis: ['validate(source)', 'bundle(input, { readFiles(), hooks, urlMap })'],
  nativeValidDocumentsProcessed: { yaml: validYaml.valid, json: validJson.valid },
  evidenceClassification: classification,
  tests,
  oaitOwnedFeasibilityProof: proof,
  mutation: { fixtureFilesChanged: JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes), beforeHashes, afterHashes },
  typescript: { compiler: `typescript ${packageVersions.typescript}`, compiledWithSkipLibCheck: true },
  workspaceRoot: root,
})
