/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-GitIndex.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const path = require('path')

const { GitIndex } = require('isomorphic-git/internal-apis')

describe('GitIndex', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('GitIndex.from(buffer) - Simple', async () => {
    const { fs, dir } = await makeFixture('test-GitIndex')
    const buffer = await fs.read(path.join(dir, 'simple-index'))
    const index = await GitIndex.from(buffer)
    const rendering = index.render()
    expect(rendering).toMatchSnapshot()
    const buffer2 = await index.toObject()
    expect(buffer.slice(0, buffer2.length - 20).buffer).toEqual(
      buffer2.slice(0, -20).buffer
    )
  })

  it('GitIndex.from(buffer)', async () => {
    const { fs, dir } = await makeFixture('test-GitIndex')
    const buffer = await fs.read(path.join(dir, 'index'))
    const index = await GitIndex.from(buffer)
    const rendering = index.render()
    expect(rendering).toMatchSnapshot()
    const buffer2 = await index.toObject()
    expect(buffer.slice(0, buffer2.length - 20).buffer).toEqual(
      buffer2.slice(0, -20).buffer
    )
  })

  it('GitIndex round trip', async () => {
    const { fs, dir } = await makeFixture('test-GitIndex')
    const buffer = await fs.read(path.join(dir, 'index'))
    const index = await GitIndex.from(buffer)
    const buffer2 = await index.toObject()
    const index2 = await GitIndex.from(buffer2)
    const buffer3 = await index2.toObject()
    expect(buffer2.buffer).toEqual(buffer3.buffer)
  })
})
