const path = require('path')

const { plugins } = require('isomorphic-git')
const { FileSystem } = require('isomorphic-git/internal-apis')

async function makeNodeFixture (fixture) {
  const _fs = require('fs')
  plugins.set('fs', _fs)
  const fs = new FileSystem(_fs)
  const {
    getFixturePath,
    createTempDir,
    copyFixtureIntoTempDir
  } = require('jest-fixtures')
  let testsDir = path.resolve(__dirname, '..')
  let dir = (await getFixturePath(testsDir, fixture))
    ? await copyFixtureIntoTempDir(testsDir, fixture)
    : await createTempDir()
  let gitdir = (await getFixturePath(testsDir, `${fixture}.git`))
    ? await copyFixtureIntoTempDir(testsDir, `${fixture}.git`)
    : await createTempDir()
  return { _fs, fs, dir, gitdir }
}

module.exports.makeNodeFixture = makeNodeFixture
