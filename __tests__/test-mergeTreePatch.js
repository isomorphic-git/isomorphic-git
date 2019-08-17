/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-diffTree.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { mergeTreePatches } = require('isomorphic-git/internal-apis')
// @ts-ignore
const { E, diffTree } = require('isomorphic-git')

describe('mergeTreePatches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('merge two empty patchsets', async () => {
    let patchset = await mergeTreePatches({ patchsets: [[], []]})
    expect(patchset).toEqual([])
  })

  it('merge two conflicting patchsets', async () => {
    let error = null
    try {
      await mergeTreePatches({ patchsets: [
        [{ filepath: 'a' }],
        [{ filepath: 'a' }]
      ]})
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.MergeConflict)
  })

  it('merge add-files and change-modes', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff1 = await diffTree({ gitdir, before: 'mainline', after: 'add-files' })
    let diff2 = await diffTree({ gitdir, before: 'mainline', after: 'change-modes' })
    let patchset = await mergeTreePatches({ patchsets: [diff1, diff2]})
    expect(patchset).toMatchSnapshot()
  })
  
  it('merge add-files and remove-files', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff1 = await diffTree({ gitdir, before: 'mainline', after: 'add-files' })
    let diff2 = await diffTree({ gitdir, before: 'mainline', after: 'remofe-files' })
    let patchset = await mergeTreePatches({ patchsets: [diff1, diff2]})
    expect(patchset).toMatchSnapshot()
  })

})
