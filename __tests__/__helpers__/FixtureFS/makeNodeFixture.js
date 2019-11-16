const path = require('path')

const { cores, plugins } = require('isomorphic-git')
const { FileSystem } = require('isomorphic-git/internal-apis')

let i = 0

async function makeNodeFixture (fixture) {
  const _fs = Object.assign({}, require('fs'))
  const core = `core-node-${i++}`
  cores.create(core).set('fs', _fs)
  plugins.set('fs', _fs) // deprecated

  const fs = new FileSystem(_fs)

  const {
    getFixturePath,
    createTempDir,
    copyFixtureIntoTempDir
  } = require('jest-fixtures')

  const testsDir = path.resolve(__dirname, '..')

  const dir = (await getFixturePath(testsDir, fixture))
    ? await copyFixtureIntoTempDir(testsDir, fixture)
    : await createTempDir()

  const gitdir = (await getFixturePath(testsDir, `${fixture}.git`))
    ? await copyFixtureIntoTempDir(testsDir, `${fixture}.git`)
    : await createTempDir()

  return { _fs, fs, dir, gitdir, core }
}

module.exports.makeNodeFixture = makeNodeFixture
