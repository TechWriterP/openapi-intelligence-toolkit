import { bundle, createConfig, lint, lintFromString } from '@redocly/openapi-core'
import { join } from 'node:path'
import {
  errorInfo, feasibilityEvidence, fixtureHashes, read, root, versions, writeResult,
} from '../shared/support.js'

const packageVersions = await versions()
const beforeHashes = await fixtureHashes()
const emptyConfig = await createConfig({})
const structuralConfig = await createConfig({ rules: { struct: 'error' } })

const yamlBundle = await bundle({ ref: join(root, 'fixtures/yaml/openapi.yaml'), config: emptyConfig })
const jsonBundle = await bundle({ ref: join(root, 'fixtures/json/openapi.json'), config: emptyConfig })
const multiBundle = await bundle({ ref: join(root, 'fixtures/multi-file/openapi.yaml'), config: emptyConfig })
const validLint = await lint({ ref: join(root, 'fixtures/yaml/openapi.yaml'), config: structuralConfig })
const structuralProblems = await lint({ ref: join(root, 'fixtures/invalid/structural.yaml'), config: structuralConfig })
const referenceBundle = await bundle({ ref: join(root, 'fixtures/invalid/unresolved-ref.yaml'), config: emptyConfig })

let malformed
try {
  const problems = await lintFromString({
    source: await read('fixtures/invalid/malformed.yaml'),
    absoluteRef: join(root, 'fixtures/invalid/malformed.yaml'), config: structuralConfig,
  })
  malformed = { threw: false, problems }
} catch (error) {
  malformed = { threw: true, error: errorInfo(error) }
}

function serializeProblem(problem: (typeof structuralProblems)[number]) {
  return {
    message: problem.message, ruleId: problem.ruleId, severity: problem.severity,
    reference: problem.reference ?? null,
    location: problem.location.map(location => ({
      document: location.source.absoluteRef,
      pointer: location.pointer ?? null,
      start: 'start' in location ? location.start : null,
      end: 'end' in location ? location.end ?? null : null,
      reportOnKey: location.reportOnKey ?? false,
    })),
  }
}

const diagnostics = referenceBundle.problems.map(serializeProblem)
const proof = await feasibilityEvidence()
const multiDependencies = [...multiBundle.fileDependencies]

const classification = {
  validNode: {
    documentUri: 'NOT_AVAILABLE', pointer: 'NOT_AVAILABLE', line: 'NOT_AVAILABLE', column: 'NOT_AVAILABLE',
    range: 'NOT_AVAILABLE', astNode: 'NOT_AVAILABLE',
  },
  diagnostic: {
    documentUri: 'NATIVE', pointer: 'NATIVE', line: 'OAIT_OWNED_REQUIRED', column: 'OAIT_OWNED_REQUIRED',
  },
  ownedIndex: {
    documentUri: 'OAIT_OWNED_REQUIRED', pointer: 'OAIT_OWNED_REQUIRED', line: 'OAIT_OWNED_REQUIRED', column: 'OAIT_OWNED_REQUIRED',
  },
}

const tests = [
  { id: 'SOURCE_DOCUMENT_VALID_NODE', status: 'NOT_SUPPORTED',
    evidence: 'bundle.parsed contains plain transformed values; fileDependencies is document-level, not node-level.' },
  { id: 'JSON_POINTER_VALID_NODE', status: 'NOT_SUPPORTED' },
  { id: 'LINE_VALID_NODE', status: 'NOT_SUPPORTED' },
  { id: 'COLUMN_VALID_NODE', status: 'NOT_SUPPORTED' },
  { id: 'SCHEMA_PROPERTY_LOCATION', status: 'NOT_SUPPORTED' },
  { id: 'ARRAY_ITEM_LOCATION', status: 'NOT_SUPPORTED' },
  { id: 'REF_DECLARATION_LOCATION', status: 'PARTIAL',
    evidence: 'Bundler diagnostics locate failed declarations natively; successful declarations are transformed without exposed location.' },
  { id: 'REF_TARGET_LOCATION', status: 'PARTIAL', fileDependencies: multiDependencies,
    evidence: 'Target files are listed, but original target pointer and coordinates are not mapped to successful nodes.' },
  { id: 'NESTED_HOP_LOCATIONS', status: 'NOT_SUPPORTED' },
  { id: 'MULTI_FILE_ORIGINAL_LOCATION', status: 'PARTIAL', fileDependencies: multiDependencies,
    bundledPointerWarning: 'Pointers in bundle.parsed refer to transformed root components, not original source pointers.' },
  { id: 'STRUCTURAL_PARAMETER_DIAGNOSTIC', status: structuralProblems.length > 0 ? 'PASS' : 'FAIL',
    diagnostics: structuralProblems.map(serializeProblem),
    evidence: 'Redocly struct lint did not report required:false for the path parameter in this version/configuration.' },
  { id: 'ERROR_DOCUMENT', status: diagnostics.some(problem => problem.location.some(location => location.document)) ? 'PASS' : 'FAIL', diagnostics },
  { id: 'ERROR_POINTER', status: diagnostics.some(problem => problem.location.some(location => location.pointer)) ? 'PASS' : 'FAIL', diagnostics },
  { id: 'ERROR_LINE', status: diagnostics.some(problem => problem.location.some(location => location.start)) ? 'PASS' : 'NOT_SUPPORTED', diagnostics },
  { id: 'ERROR_COLUMN', status: diagnostics.some(problem => problem.location.some(location => location.start)) ? 'PASS' : 'NOT_SUPPORTED', diagnostics,
    evidence: 'Documented lint result supplies source + pointer. No documented safe line/column conversion API was used.' },
  { id: 'MALFORMED_ERROR_LOCATION', status: 'PARTIAL', malformed,
    observationalOnly: 'Thrown parse error message may contain position text; no message parsing was performed.' },
  { id: 'VALID_VS_DIAGNOSTIC_LOCATION', status: 'PARTIAL', validDiagnosticCount: validLint.length,
    validNodesHaveLocations: false, invalidNodesHaveDiagnosticLocations: diagnostics.length > 0 },
  { id: 'STABLE_UNDER_WHITESPACE', status: proof.whitespace.pointerStable ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned feasibility proof' },
  { id: 'CANONICAL_POINTER_CONVERSION', status: 'NOT_SUPPORTED',
    evidence: 'Successful valid-node paths are not exposed through documented safe APIs.' },
  { id: 'YAML_LOCATION_INDEX_FEASIBILITY', status: proof.allYamlSamplesExact ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned proof' },
  { id: 'JSON_LOCATION_INDEX_FEASIBILITY', status: proof.allJsonSamplesExact ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned proof' },
  { id: 'DUPLICATE_SCALAR_VALUES', status: proof.duplicateValuesRemainDistinct ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned structural index' },
  { id: 'POINTER_ESCAPING', status: proof.samples.find(sample => sample.kind === 'escapedProperty')?.yamlExact ? 'PASS' : 'FAIL', evidenceSource: 'OAIT-owned proof' },
  { id: 'DOCUMENTED_API_ONLY', status: 'PASS', undocumentedOrPrivateApisUsed: false,
    note: 'Exported but undocumented location/AST helpers were intentionally not used.' },
]

const afterHashes = await fixtureHashes()
await writeResult('redocly', {
  candidate: '@redocly/openapi-core', version: packageVersions['@redocly/openapi-core'],
  runtime: { node: process.version },
  candidateApis: ['createConfig()', 'bundle()', 'lint()', 'lintFromString()'],
  nativeValidDocumentsProcessed: { yaml: yamlBundle.problems.length === 0, json: jsonBundle.problems.length === 0 },
  evidenceClassification: classification,
  tests,
  oaitOwnedFeasibilityProof: proof,
  mutation: { fixtureFilesChanged: JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes), beforeHashes, afterHashes },
  typescript: { compiler: `typescript ${packageVersions.typescript}`, compiledWithSkipLibCheck: true },
})
