/* eslint-env node, browser, jasmine */
import { Errors, deleteTag, listTags } from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('deleteTag', () => {
  it('deletes the latest tag to HEAD', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteTag')
    // Test
    await deleteTag({
      fs,
      gitdir,
      ref: 'latest',
    })
    const refs = await listTags({
      fs,
      gitdir,
    })
    expect(refs).toEqual(['prev'])
  })

  it('missing ref argument', async () => {
    // Setup
    const { dir, gitdir } = await makeFixtureAsSubmodule('test-deleteTag')
    let error = null
    // Test
    try {
      // @ts-ignore
      await deleteTag({ dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
})
