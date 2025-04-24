import * as nodeFs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { FileSystem } from 'isomorphic-git/internal-apis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function makeNodeFixture(fixture) {
  const _fs = Object.assign({}, nodeFs)

  const fs = new FileSystem(_fs)

  const {
    getFixturePath,
    createTempDir,
    copyFixtureIntoTempDir,
  } = await import('@wmhilton/jest-fixtures')

  const testsDir = path.resolve(__dirname, '..')

  const dir = (await getFixturePath(testsDir, fixture))
    ? await copyFixtureIntoTempDir(testsDir, fixture)
    : await createTempDir()

  const gitdir = (await getFixturePath(testsDir, `${fixture}.git`))
    ? await copyFixtureIntoTempDir(testsDir, `${fixture}.git`)
    : await createTempDir()

  return { _fs, fs, dir, gitdir }
}
