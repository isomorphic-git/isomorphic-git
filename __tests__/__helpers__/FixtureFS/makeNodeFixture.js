import * as _fs from 'fs'
import * as os from 'os'
import { join, resolve } from 'path'

import findUp from 'find-up'
import { FileSystem } from 'isomorphic-git/internal-apis'
import onExit from 'signal-exit'

const TEMP_PATH = join(os.tmpdir(), 'jest-fixture-')
const TEMP_DIRS_CREATED = new Set()

export function cleanupTempDirs() {
  for (const tempDir of TEMP_DIRS_CREATED) {
    try {
      _fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (err) {}
  }
  TEMP_DIRS_CREATED.clear()
}

const testsDir = resolve(import.meta.dirname, '..')

export async function useTempDir(fixture) {
  const fixturePath = await findUp(join('__fixtures__', fixture), {
    cwd: testsDir,
  })

  const tempDir = await _fs.promises.mkdtemp(TEMP_PATH)
  TEMP_DIRS_CREATED.add(tempDir)

  if (fixturePath) {
    await _fs.promises.cp(fixturePath, tempDir, { recursive: true })
  }

  return tempDir
}

export async function makeNodeFixture(fixture) {
  onExit(cleanupTempDirs)

  const fs = new FileSystem(_fs)

  const dir = await useTempDir(fixture)
  const gitdir = await useTempDir(`${fixture}.git`)

  return { _fs, fs, dir, gitdir }
}
