import * as _fs from 'fs'
import * as os from 'os'
import { join, resolve } from 'path'

import findUp from 'find-up'
import { FileSystem } from 'isomorphic-git/internal-apis'
import onExit from 'signal-exit'

const TEMP_DIRS_CREATED = new Set()

export function cleanupTempDirs() {
  for (const tempDir of TEMP_DIRS_CREATED) {
    try {
      _fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (err) {}
  }
  TEMP_DIRS_CREATED.clear()
}

export async function useTempDir(fixture) {
  // Computed lazily (not at module scope) so this Node-only helper can be part
  // of the browser test bundle without executing Node APIs — `os.tmpdir()` and
  // `import.meta.dirname` — when the module is merely imported. `useTempDir` is
  // only ever called from the Node code path.
  const testsDir = resolve(import.meta.dirname, '..')
  const TEMP_PATH = join(os.tmpdir(), 'jest-fixture-')

  const fixturePath = await findUp(join('__fixtures__', fixture), {
    cwd: testsDir,
  })

  const tempDir = await _fs.promises.mkdtemp(TEMP_PATH)
  TEMP_DIRS_CREATED.add(tempDir)

  if (fixturePath) {
    await _fs.promises.cp(fixturePath, tempDir, {
      recursive: true,
      verbatimSymlinks: true,
    })
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
