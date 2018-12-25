/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { deleteRef, listTags } = require('isomorphic-git')

describe('deleteRef', () => {
  it('deletes a loose tag', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-deleteRef')
    // Test
    await deleteRef({
      gitdir,
      ref: 'refs/tags/latest'
    })
    let refs = await listTags({
      gitdir
    })
    expect(refs.includes('latest')).toEqual(false)
  })
  it('deletes a packed tag', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-deleteRef')
    // Test
    await deleteRef({
      gitdir,
      ref: 'refs/tags/packed-tag'
    })
    let refs = await listTags({
      gitdir
    })
    expect(refs.includes('packed-tag')).toEqual(false)
  })
  it('deletes a packed and loose tag', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-deleteRef')
    // Test
    await deleteRef({
      gitdir,
      ref: 'refs/tags/packed-and-loose'
    })
    let refs = await listTags({
      gitdir
    })
    expect(refs.includes('packed-and-loose')).toEqual(false)
    expect(refs.includes('packed-tag')).toEqual(true)
  })
})
