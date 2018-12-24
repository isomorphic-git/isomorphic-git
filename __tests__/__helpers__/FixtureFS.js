/* eslint-env node, browser, jasmine */
const path = require('path')
const pify = require('pify')
const setTestTimeout = require('./set-test-timeout')
setTestTimeout(60000)

async function makeFixture (dir) {
  return process.browser ? makeBrowserFixture(dir) : makeNodeFixture(dir)
}

async function makeBrowserFixture (dir) {
  // enable / disable console.log statements
  // window.localStorage.debug = 'isomorphic-git'

  const FS = require('@isomorphic-git/lightning-fs')
  const fs = new FS(`testfs`, {
    wipe: true,
    url: 'http://localhost:9876/base/__tests__/__fixtures__'
  })
  dir = `/${dir}`
  let gitdir = `/${dir}.git`
  try {
    await pify(fs.stat.bind(fs))(dir)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    await pify(fs.mkdir.bind(fs))(dir)
  }
  try {
    await pify(fs.stat.bind(fs))(gitdir)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    await pify(fs.mkdir.bind(fs))(gitdir)
  }
  return { fs, dir, gitdir }
}

async function makeNodeFixture (fixture) {
  const fs = require('fs')
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
  return { fs, dir, gitdir }
}

module.exports.makeFixture = makeFixture
