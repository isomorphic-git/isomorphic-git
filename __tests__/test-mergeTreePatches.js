/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-mergeTreePatches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { mergeTreePatches } = require('isomorphic-git/internal-apis')
// @ts-ignore
const { diffTree } = require('isomorphic-git')

describe('mergeTreePatches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('merge two empty TreePatches', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({ gitdir, before: 'master', after: 'master' })
    const diff2 = await diffTree({ gitdir, before: 'master', after: 'master' })
    const patch = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(patch).toEqual({ basename: '.', index: 0, ops: [] })
  })

  it('merge two conflicting TreePatches', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({ gitdir, before: 'master', after: 'a-file' })
    const diff2 = await diffTree({ gitdir, before: 'master', after: 'a-folder' })
    const patch = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(patch).toMatchSnapshot()
  })

  it('merge add-files and change-modes', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({ gitdir, before: 'mainline', after: 'add-files' })
    const diff2 = await diffTree({ gitdir, before: 'mainline', after: 'change-modes' })
    const patchset = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(patchset).toMatchSnapshot()
  })

  it('merge add-files and remove-files', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({ gitdir, before: 'mainline', after: 'add-files' })
    const diff2 = await diffTree({ gitdir, before: 'mainline', after: 'remofe-files' })
    const patch = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(patch).toMatchSnapshot()
  })
})
