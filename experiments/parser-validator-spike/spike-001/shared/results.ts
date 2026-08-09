import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type Status = 'PASS' | 'PARTIAL' | 'FAIL'
export type JsonObject = Record<string, unknown>

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const validFixtures = [
  ['openapi-3.0.yaml', '3.0.4'],
  ['openapi-3.0.json', '3.0.4'],
  ['openapi-3.1.yaml', '3.1.2'],
  ['openapi-3.1.json', '3.1.2'],
  ['openapi-3.2.yaml', '3.2.0'],
  ['openapi-3.2.json', '3.2.0'],
] as const

export function inspectDocument(document: JsonObject) {
  const info = asObject(document.info)
  const paths = asObject(document.paths)
  const pathItem = asObject(paths['/pets/{petId}'])
  const get = asObject(pathItem.get)
  const parameters = Array.isArray(get.parameters) ? get.parameters : []
  const petId = parameters.map(asObject).find(
    (parameter) => parameter.name === 'petId' && parameter.in === 'path',
  )
  const responses = asObject(get.responses)
  const components = asObject(document.components)
  const schemas = asObject(components.schemas)
  const securitySchemes = asObject(components.securitySchemes)
  const response200 = asObject(responses['200'])
  const content = asObject(response200.content)
  const jsonContent = asObject(content['application/json'])
  const responseSchema = asObject(jsonContent.schema)

  return {
    openapi: stringValue(document.openapi),
    title: stringValue(info.title),
    apiVersion: stringValue(info.version),
    pathFound: Object.keys(pathItem).length > 0,
    getOperationFound: Object.keys(get).length > 0,
    operationId: stringValue(get.operationId),
    summary: stringValue(get.summary),
    parameterFound: petId !== undefined,
    parameterRequired: petId?.required === true,
    response200Found: Object.hasOwn(responses, '200'),
    petSchemaFound: Object.hasOwn(schemas, 'Pet'),
    securitySchemeFound: Object.hasOwn(securitySchemes, 'ApiKeyAuth'),
    responseSchemaReferencePreserved:
      responseSchema.$ref === '#/components/schemas/Pet',
  }
}

export function determineStatus(
  processingSucceeded: boolean,
  declaredVersion: string,
  observed: ReturnType<typeof inspectDocument> | null,
): Status {
  if (!processingSucceeded || observed === null) return 'FAIL'
  const expected =
    observed.openapi === declaredVersion &&
    observed.title === 'OAIT Parser Spike API' &&
    observed.apiVersion === '1.0.0' &&
    observed.pathFound &&
    observed.getOperationFound &&
    observed.operationId === 'getPet' &&
    observed.summary === 'Get a pet' &&
    observed.parameterFound &&
    observed.parameterRequired &&
    observed.response200Found &&
    observed.petSchemaFound &&
    observed.securitySchemeFound
  return expected ? 'PASS' : 'PARTIAL'
}

export function diagnostic(error: unknown) {
  if (error instanceof Error) {
    const value = error as Error & Record<string, unknown>
    return {
      type: error.constructor.name,
      message: error.message,
      location: value.location ?? value.loc ?? null,
      code: value.code ?? null,
    }
  }
  return { type: typeof error, message: String(error), location: null, code: null }
}

export async function fixtureSource(file: string) {
  return readFile(join(root, 'fixtures', file), 'utf8')
}

export async function installedVersions() {
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }
  return { ...packageJson.dependencies, ...packageJson.devDependencies }
}

export async function writeResults(file: string, result: unknown) {
  await writeFile(join(root, 'results', file), `${JSON.stringify(result, null, 2)}\n`)
}

export function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}
