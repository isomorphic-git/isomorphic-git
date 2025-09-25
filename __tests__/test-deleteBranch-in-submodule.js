/* eslint-env node, browser, jasmine */
const {
  Errors,
  deleteBranch,
  currentBranch,
  listBranches,
  listTags,
  getConfig,
} = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('deleteBranch', () => {
  ;(process.browser ? xit : it)('delete branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteBranch')
    // Test
    await deleteBranch({ fs, gitdir, ref: 'test' })
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('test')).toBe(false)
  })
  ;(process.browser ? xit : it)(
    'deletes the branch when an identically named tag exists',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteBranch')
      // Test
      await deleteBranch({ fs, gitdir, ref: 'collision' })
      const branches = await listBranches({ fs, gitdir })
      expect(branches.includes('collision')).toBe(false)
      const tags = await listTags({ fs, gitdir })
      expect(tags.includes('collision')).toBe(true)
    }
  )
  ;(process.browser ? xit : it)('branch not exist', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteBranch')
    let error = null
    // Test
    try {
      await deleteBranch({ fs, gitdir, ref: 'branch-not-exist' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NotFoundError).toBe(true)
  })
  ;(process.browser ? xit : it)('missing ref argument', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteBranch')
    let error = null
    // Test
    try {
      // @ts-ignore
      await deleteBranch({ fs, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
  ;(process.browser ? xit : it)('checked out branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteBranch')
    // Test
    await deleteBranch({ fs, gitdir, ref: 'master' })
    const head = await currentBranch({ fs, gitdir })
    expect(head).toBeUndefined()
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('master')).toBe(false)
  })
  ;(process.browser ? xit : it)(
    'delete branch and its entry in config',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-deleteBranch')
      // Test
      await deleteBranch({ fs, gitdir, ref: 'remote' })
      const branches = await listBranches({ fs, gitdir })
      expect(branches.includes('remote')).toBe(false)
      expect(
        await getConfig({ fs, gitdir, path: 'branch.remote.remote' })
      ).toBeUndefined()
      expect(
        await getConfig({ fs, gitdir, path: 'branch.remote.merge' })
      ).toBeUndefined()
    }
  )
})
