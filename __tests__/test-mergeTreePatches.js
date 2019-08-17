/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-mergeTreePatches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { mergeTreePatches } = require('isomorphic-git/internal-apis')
// @ts-ignore
const { E, diffTree } = require('isomorphic-git')

describe('mergeTreePatches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  fit('merge two empty TreePatches', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff1 = await diffTree({ gitdir, before: 'master', after: 'master' })
    let diff2 = await diffTree({ gitdir, before: 'master', after: 'master' })
    let patch = await mergeTreePatches({ treePatches: [diff1, diff2]})
    expect(patch).toEqual({basename: ".", index: 0, ops: []})
  })

  fit('merge two conflicting TreePatches', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff1 = await diffTree({ gitdir, before: 'master', after: 'a-file' })
    let diff2 = await diffTree({ gitdir, before: 'master', after: 'a-folder' })
    let patch = await mergeTreePatches({ treePatches: [diff1, diff2]})
    expect(patch).toMatchSnapshot()
  })

  it('merge add-files and change-modes', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff1 = await diffTree({ gitdir, before: 'mainline', after: 'add-files' })
    let diff2 = await diffTree({ gitdir, before: 'mainline', after: 'change-modes' })
    let patchset = await mergeTreePatches({ treePatches: [diff1, diff2]})
    expect(patchset).toMatchSnapshot()
  })
  
  fit('merge add-files and remove-files', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff1 = await diffTree({ gitdir, before: 'mainline', after: 'add-files' })
    let diff2 = await diffTree({ gitdir, before: 'mainline', after: 'remofe-files' })
    let patch = await mergeTreePatches({ treePatches: [diff1, diff2]})
    expect(patch).toMatchSnapshot()
  })

})
