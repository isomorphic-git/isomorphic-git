/* eslint-env node, browser, jasmine */
import {
  Errors,
  deleteBranch,
  currentBranch,
  listBranches,
  listTags,
  getConfig,
} from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { makeFailingFS } from './__helpers__/makeFailingFS.js'

describe('deleteBranch', () => {
  it('delete branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
    // Test
    await deleteBranch({ fs, gitdir, ref: 'test' })
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('test')).toBe(false)
  })

  it('deletes the branch when an identically named tag exists', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
    // Test
    await deleteBranch({ fs, gitdir, ref: 'collision' })
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('collision')).toBe(false)
    const tags = await listTags({ fs, gitdir })
    expect(tags.includes('collision')).toBe(true)
  })

  it('branch not exist', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
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

  it('missing ref argument', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
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

  it('checked out branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
    // Test
    await deleteBranch({ fs, gitdir, ref: 'master' })
    const head = await currentBranch({ fs, gitdir })
    expect(head).toBeUndefined()
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('master')).toBe(false)
  })

  it('delete branch and its entry in config', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
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
  })

  it('delete branch without an entry in config does not write the config', async () => {
    // Setup
    const { _fs, fs, gitdir } = await makeFixture('test-deleteBranch')
    const configReadOnlyFs = makeFailingFS(
      _fs,
      filepath => /[\\/]config$/.test(filepath),
      filepath =>
        new DOMException(`Blocked write to '${filepath}'`, 'SecurityError'),
      ['writeFile']
    )
    // Test
    await deleteBranch({ fs: configReadOnlyFs, gitdir, ref: 'test' })
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('test')).toBe(false)
  })

  it('delete branch in a repository without a config file', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-deleteBranch')
    await fs.rm(`${gitdir}/config`)
    // Test
    await deleteBranch({ fs, gitdir, ref: 'test' })
    const branches = await listBranches({ fs, gitdir })
    expect(branches.includes('test')).toBe(false)
    expect(await fs.exists(`${gitdir}/config`)).toBe(false)
  })
})
