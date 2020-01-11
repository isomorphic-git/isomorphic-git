/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-deleteTag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { E, deleteTag, listTags } = require('isomorphic-git')

describe('deleteTag', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('deletes the latest tag to HEAD', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-deleteTag')
    // Test
    await deleteTag({
      gitdir,
      ref: 'latest'
    })
    const refs = await listTags({
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })

  it('missing ref argument', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-deleteTag')
    let error = null
    // Test
    try {
      // @ts-ignore
      await deleteTag({ dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.MissingRequiredParameterError)
  })
})
