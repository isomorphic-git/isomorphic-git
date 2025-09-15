import * as path from 'path'
import { fileURLToPath } from 'url'

import { FileSystem } from 'isomorphic-git/internal-apis'

export async function makeNodeFixture(fixture) {
  const {
    getFixturePath,
    createTempDir,
    copyFixtureIntoTempDir,
  } = await import('./_jestUtils.js')

  const _fs = await import('fs')

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
