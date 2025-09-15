import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { fileURLToPath } from 'url'

import findUp from 'find-up'
import { FileSystem } from 'isomorphic-git/internal-apis'
import onExit from 'signal-exit'

const TEMP_PATH = path.join(os.tmpdir(), 'jest-fixture-')
const TEMP_DIRS_CREATED = []

/**
 * @param {string} cwd
 * @param  {...string} fileParts
 */
export function getFixturePath(cwd, ...fileParts) {
  return findUp(path.join('__fixtures__', ...fileParts), { cwd })
}

export async function createTempDir() {
  const tempDir = await fs.promises.mkdtemp(TEMP_PATH)
  TEMP_DIRS_CREATED.push(tempDir)
  return tempDir
}

export function cleanupTempDirs() {
  for (const tempDir of TEMP_DIRS_CREATED) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (err) {}
  }

  TEMP_DIRS_CREATED.length = 0
}

/**
 * @param {string} cwd
 * @param  {...string} fileParts
 */
export async function copyFixtureIntoTempDir(cwd, ...fileParts) {
  const fixturePath = await getFixturePath(cwd, ...fileParts)
  const tempDir = await createTempDir()
  await fs.promises.cp(fixturePath, tempDir, { recursive: true })
  return tempDir
}

export async function makeNodeFixture(fixture) {
  const _fs = await import('fs')
  onExit(cleanupTempDirs)

  const fs = new FileSystem(_fs)

  /** @todo Use `import.meta.dirname` and `..` once support for Node 18 is dropped */
  const testsDir = path.resolve(fileURLToPath(import.meta.url), '../..')

  const dir = (await getFixturePath(testsDir, fixture))
    ? await copyFixtureIntoTempDir(testsDir, fixture)
    : await createTempDir()

  const gitdir = (await getFixturePath(testsDir, `${fixture}.git`))
    ? await copyFixtureIntoTempDir(testsDir, `${fixture}.git`)
    : await createTempDir()

  return { _fs, fs, dir, gitdir }
}
