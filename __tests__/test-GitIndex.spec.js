/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitIndex.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')
const path = require('path')

const { models } = require('isomorphic-git/internal-apis')
const { GitIndex } = models

describe('GitIndex', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('GitIndex.from(buffer) - Simple', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitIndex')
    let buffer = await pify(fs.readFile)(path.join(dir, 'simple-index'))
    let index = GitIndex.from(buffer)
    let rendering = index.render()
    expect(rendering).toMatchSnapshot2()
    let buffer2 = index.toObject()
    expect(buffer.slice(0, buffer2.length - 20).buffer).toEqual(
      buffer2.slice(0, -20).buffer
    )
  })

  it('GitIndex.from(buffer)', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitIndex')
    let buffer = await pify(fs.readFile)(path.join(dir, 'index'))
    let index = GitIndex.from(buffer)
    let rendering = index.render()
    expect(rendering).toMatchSnapshot2()
    let buffer2 = index.toObject()
    expect(buffer.slice(0, buffer2.length - 20).buffer).toEqual(
      buffer2.slice(0, -20).buffer
    )
  })

  it('GitIndex round trip', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitIndex')
    let buffer = await pify(fs.readFile)(path.join(dir, 'index'))
    let index = GitIndex.from(buffer)
    let buffer2 = index.toObject()
    let index2 = GitIndex.from(buffer2)
    let buffer3 = index2.toObject()
    expect(buffer2.buffer).toEqual(buffer3.buffer)
  })
})
