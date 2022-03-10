const path = require('path')

const { FileSystem } = require('isomorphic-git/internal-apis')

async function makeNodeFixture(fixture) {
  const _fs = Object.assign({}, require('fs'))

  const fs = new FileSystem(_fs)

  const {
    getFixturePath,
    createTempDir,
    copyFixtureIntoTempDir,
  } = require('@wmhilton/jest-fixtures')

  const testsDir = path.resolve(__dirname, '..')

  const dir = (await getFixturePath(testsDir, fixture))
    ? await copyFixtureIntoTempDir(testsDir, fixture)
    : await createTempDir()

  const gitdir = (await getFixturePath(testsDir, `${fixture}.git`))
    ? await copyFixtureIntoTempDir(testsDir, `${fixture}.git`)
    : await createTempDir()

  return { _fs, fs, dir, gitdir }
}

module.exports.makeNodeFixture = makeNodeFixture
