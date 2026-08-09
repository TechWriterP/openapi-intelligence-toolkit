import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export type Status = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_SUPPORTED'
export type Json = Record<string, unknown>
export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export async function read(relativePath: string) {
  return readFile(join(root, relativePath), 'utf8')
}

export async function versions() {
  const manifest = JSON.parse(await read('package.json')) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }
  return { ...manifest.dependencies, ...manifest.devDependencies }
}

export async function writeResult(name: string, value: unknown) {
  await writeFile(join(root, 'results', `${name}.json`), `${JSON.stringify(value, null, 2)}\n`)
}

export function object(value: unknown): Json {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Json
    : {}
}

export function pointer(rootValue: unknown, path: string): unknown {
  return path.split('/').slice(1).reduce<unknown>((value, segment) => {
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~')
    return object(value)[key]
  }, rootValue)
}

export function refAt(rootValue: unknown, path: string) {
  const value = object(pointer(rootValue, path)).$ref
  return typeof value === 'string' ? value : null
}

export function errorInfo(error: unknown) {
  if (error instanceof Error) {
    const extra = error as Error & Record<string, unknown>
    return {
      type: error.constructor.name,
      message: error.message,
      code: extra.code ?? null,
      location: extra.location ?? extra.loc ?? null,
    }
  }
  return { type: typeof error, message: String(error), code: null, location: null }
}

export async function fixtureHashes() {
  const { readdir } = await import('node:fs/promises')
  const output: Record<string, string> = {}
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else {
        const key = relative(root, absolute)
        output[key] = createHash('sha256').update(await readFile(absolute)).digest('hex')
      }
    }
  }
  await visit(join(root, 'fixtures'))
  return output
}

export async function localFixtureServer() {
  let requests = 0
  const body = await read('fixtures/remote/RemotePet.yaml')
  const server = createServer((request, response) => {
    requests += 1
    if (request.url === '/RemotePet.yaml') {
      response.writeHead(200, { 'content-type': 'application/yaml' })
      response.end(body)
      return
    }
    response.writeHead(404)
    response.end('not found')
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('No TCP port')
  return {
    port: address.port,
    requestCount: () => requests,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    ),
  }
}

export function containsCircularGraph(value: unknown) {
  const seen = new WeakSet<object>()
  function walk(node: unknown): boolean {
    if (node === null || typeof node !== 'object') return false
    if (seen.has(node)) return true
    seen.add(node)
    return Object.values(node).some(walk)
  }
  return walk(value)
}
