/* eslint-env node, browser, jasmine */
const { deleteRef, listTags } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('deleteRef', () => {
  ;(process.browser ? xit : it)('deletes a loose tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteRef')
    // Test
    await deleteRef({
      fs,
      gitdir,
      ref: 'refs/tags/latest',
    })
    const refs = await listTags({ fs, gitdir })
    expect(refs.includes('latest')).toEqual(false)
  })
  ;(process.browser ? xit : it)('deletes a packed tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteRef')
    // Test
    await deleteRef({
      fs,
      gitdir,
      ref: 'refs/tags/packed-tag',
    })
    const refs = await listTags({ fs, gitdir })
    expect(refs.includes('packed-tag')).toEqual(false)
  })
  ;(process.browser ? xit : it)('deletes a packed and loose tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteRef')
    // Test
    await deleteRef({
      fs,
      gitdir,
      ref: 'refs/tags/packed-and-loose',
    })
    const refs = await listTags({ fs, gitdir })
    expect(refs.includes('packed-and-loose')).toEqual(false)
    expect(refs.includes('packed-tag')).toEqual(true)
  })
})
