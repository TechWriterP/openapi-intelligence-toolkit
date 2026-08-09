import { bundleFromString, createConfig } from '@redocly/openapi-core'
import {
  asObject,
  determineStatus,
  diagnostic,
  fixtureSource,
  inspectDocument,
  installedVersions,
  root,
  validFixtures,
  writeResults,
} from '../shared/results.js'
import { join } from 'node:path'

const versions = await installedVersions()
const config = await createConfig({})
const fixtures = []

for (const [file, declaredOpenApiVersion] of validFixtures) {
  const source = await fixtureSource(file)
  const before = source
  try {
    const result = await bundleFromString({
      source,
      absoluteRef: join(root, 'fixtures', file),
      config,
    })
    const document = asObject(result.bundle.parsed)
    const observed = inspectDocument(document)
    const diagnostics = result.problems.map((problem) => ({
      type: 'NormalizedProblem',
      message: problem.message,
      ruleId: problem.ruleId,
      severity: problem.severity,
      location: problem.location,
    }))
    const processingSucceeded = Object.keys(document).length > 0
    const baseStatus = determineStatus(processingSucceeded, declaredOpenApiVersion, observed)
    fixtures.push({
      file,
      format: file.endsWith('.json') ? 'JSON' : 'YAML',
      declaredOpenApiVersion,
      processingSucceeded,
      status: diagnostics.length > 0 && baseStatus === 'PASS' ? 'PARTIAL' : baseStatus,
      observed,
      diagnostics,
      mutation: {
        inputMutated: source !== before,
        outputRepresentation: 'bundled parsed JavaScript object',
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
  const result = await bundleFromString({
    source: invalidSource,
    absoluteRef: join(root, 'fixtures', 'invalid.yaml'),
    config,
  })
  invalid = {
    file: 'invalid.yaml',
    threw: false,
    returnedStructuredError: result.problems.length > 0,
    processingSucceeded: false,
    diagnostics: result.problems.map((problem) => ({
      type: 'NormalizedProblem',
      message: problem.message,
      ruleId: problem.ruleId,
      severity: problem.severity,
      location: problem.location,
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

await writeResults('redocly.json', {
  candidate: '@redocly/openapi-core',
  installedVersion: versions['@redocly/openapi-core'],
  runtime: { node: process.version },
  apiUsed: 'createConfig({}), bundleFromString({ source, absoluteRef, config })',
  apiDocumentation: 'Package README, Bundle from memory section',
  undocumentedOrPrivateApisNeeded: false,
  typescript: {
    compiler: `typescript ${versions.typescript}`,
    compiled: true,
    issues: [
      'Full dependency declaration checking failed: transitive @redocly/config declarations reference undeclared React and @markdoc/markdoc types.',
      'Experiment source compiles with skipLibCheck=true.',
    ],
  },
  fixtures,
  invalidFixture: invalid,
})
