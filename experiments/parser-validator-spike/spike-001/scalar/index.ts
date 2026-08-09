import { validate } from '@scalar/openapi-parser'
import {
  asObject,
  determineStatus,
  diagnostic,
  fixtureSource,
  inspectDocument,
  installedVersions,
  validFixtures,
  writeResults,
} from '../shared/results.js'

const versions = await installedVersions()
const fixtures = []

for (const [file, declaredOpenApiVersion] of validFixtures) {
  const source = await fixtureSource(file)
  const before = source
  try {
    const result = await validate(source)
    const document = asObject(result.specification)
    const observed = inspectDocument(document)
    const processingSucceeded = result.valid
    fixtures.push({
      file,
      format: file.endsWith('.json') ? 'JSON' : 'YAML',
      declaredOpenApiVersion,
      processingSucceeded,
      status: determineStatus(processingSucceeded, declaredOpenApiVersion, observed),
      observed,
      diagnostics: (result.errors ?? []).map((error) => ({
        type: 'ErrorObject',
        message: error.message,
        path: error.path ?? null,
        code: error.code ?? null,
      })),
      mutation: {
        inputMutated: source !== before,
        outputRepresentation: 'parsed JavaScript object',
        declaredVersionPreserved: observed.openapi === declaredOpenApiVersion,
        internalReferencePreserved: observed.responseSchemaReferencePreserved,
        appearsToTransformSemanticContent: !observed.responseSchemaReferencePreserved,
      },
    })
  } catch (error) {
    fixtures.push({
      file,
      format: file.endsWith('.json') ? 'JSON' : 'YAML',
      declaredOpenApiVersion,
      processingSucceeded: false,
      status: 'FAIL',
      observed: null,
      diagnostics: [diagnostic(error)],
      mutation: { inputMutated: source !== before },
    })
  }
}

const invalidSource = await fixtureSource('invalid.yaml')
let invalid
try {
  const result = await validate(invalidSource)
  invalid = {
    file: 'invalid.yaml',
    threw: false,
    returnedStructuredError: !result.valid && Array.isArray(result.errors),
    processingSucceeded: result.valid,
    diagnostics: (result.errors ?? []).map((error) => ({
      type: 'ErrorObject',
      message: error.message,
      path: error.path ?? null,
      code: error.code ?? null,
      locationAvailable: Array.isArray(error.path) && error.path.length > 0,
    })),
  }
} catch (error) {
  invalid = {
    file: 'invalid.yaml',
    threw: true,
    returnedStructuredError: false,
    processingSucceeded: false,
    diagnostics: [diagnostic(error)],
  }
}

await writeResults('scalar.json', {
  candidate: '@scalar/openapi-parser',
  installedVersion: versions['@scalar/openapi-parser'],
  runtime: { node: process.version },
  apiUsed: 'validate(source)',
  apiDocumentation: 'Package README, Validate section',
  undocumentedOrPrivateApisNeeded: false,
  typescript: {
    compiler: `typescript ${versions.typescript}`,
    compiled: true,
    issues: [
      'Full dependency declaration checking failed: @scalar/openapi-types uses extensionless relative imports under NodeNext and Scalar declarations reference unresolved @scalar/types/utils.',
      'Experiment source compiles with skipLibCheck=true.',
    ],
  },
  fixtures,
  invalidFixture: invalid,
})
