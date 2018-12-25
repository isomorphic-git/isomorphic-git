/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitIndex.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const path = require('path')

const { GitIndex } = require('isomorphic-git/internal-apis')

describe('GitIndex', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('GitIndex.from(buffer) - Simple', async () => {
    let { fs, dir } = await makeFixture('test-GitIndex')
    let buffer = await fs.read(path.join(dir, 'simple-index'))
    let index = GitIndex.from(buffer)
    let rendering = index.render()
    expect(rendering).toMatchSnapshot()
    let buffer2 = index.toObject()
    expect(buffer.slice(0, buffer2.length - 20).buffer).toEqual(
      buffer2.slice(0, -20).buffer
    )
  })

  it('GitIndex.from(buffer)', async () => {
    let { fs, dir } = await makeFixture('test-GitIndex')
    let buffer = await fs.read(path.join(dir, 'index'))
    let index = GitIndex.from(buffer)
    let rendering = index.render()
    expect(rendering).toMatchSnapshot()
    let buffer2 = index.toObject()
    expect(buffer.slice(0, buffer2.length - 20).buffer).toEqual(
      buffer2.slice(0, -20).buffer
    )
  })

  it('GitIndex round trip', async () => {
    let { fs, dir } = await makeFixture('test-GitIndex')
    let buffer = await fs.read(path.join(dir, 'index'))
    let index = GitIndex.from(buffer)
    let buffer2 = index.toObject()
    let index2 = GitIndex.from(buffer2)
    let buffer3 = index2.toObject()
    expect(buffer2.buffer).toEqual(buffer3.buffer)
  })
})
