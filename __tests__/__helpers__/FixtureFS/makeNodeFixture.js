const path = require('path')

const { cores, plugins } = require('isomorphic-git')
const { FileSystem } = require('isomorphic-git/internal-apis')

let i = 0

async function makeNodeFixture (fixture) {
  const _fs = require('fs')
  const core = `core-node-${i++}`
  cores.create(core).set('fs', Object.assign({}, _fs))
  plugins.set('fs', Object.assign({}, _fs)) // deprecated
  
  const fs = new FileSystem(Object.assign({}, _fs))

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

  return { _fs, fs, dir, gitdir, core }
}

module.exports.makeNodeFixture = makeNodeFixture
