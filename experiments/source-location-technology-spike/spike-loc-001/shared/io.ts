import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export async function read(path: string) { return readFile(join(root, path), 'utf8') }
export async function writeResult(name: string, result: unknown) {
  await mkdir(join(root, 'results'), { recursive: true })
  await writeFile(join(root, 'results', `${name}.json`), `${JSON.stringify(result, null, 2)}\n`)
}
export async function fixtureHashes() {
  const hashes: Record<string, string> = {}
  async function walk(dir: string): Promise<void> {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, item.name)
      if (item.isDirectory()) await walk(path)
      else hashes[relative(root, path)] = createHash('sha256').update(await readFile(path)).digest('hex')
    }
  }
  await walk(join(root, 'fixtures'))
  return hashes
}
export async function packageVersions() {
  const manifest = JSON.parse(await read('package.json')) as { dependencies: Record<string, string>, devDependencies: Record<string, string> }
  return { ...manifest.dependencies, ...manifest.devDependencies }
}
