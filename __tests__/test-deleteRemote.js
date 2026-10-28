/* eslint-env node, browser, jasmine */
import { Errors, deleteRemote, listRemotes } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { makeFailingFS } from './__helpers__/makeFailingFS.js'

describe('deleteRemote', () => {
  it('deleteRemote', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-deleteRemote')
    const remote = 'foo'
    // Test
    await deleteRemote({ fs, dir, gitdir, remote })
    const a = await listRemotes({ fs, dir, gitdir })
    expect(a).toEqual([{ remote: 'bar', url: 'git@github.com:bar/bar.git' }])
  })
  it('deleteRemote of a remote that is not in the config does not write the config', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeFixture('test-deleteRemote')
    const configReadOnlyFs = makeFailingFS(
      _fs,
      filepath => /[\\/]config$/.test(filepath),
      filepath =>
        new DOMException(`Blocked write to '${filepath}'`, 'SecurityError'),
      ['writeFile']
    )
    // Test
    await deleteRemote({ fs: configReadOnlyFs, dir, gitdir, remote: 'baz' })
    expect((await listRemotes({ fs, dir, gitdir })).length).toBe(2)
  })
  it('deleteRemote in a repository without a config file', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-deleteRemote')
    await fs.rm(`${gitdir}/config`)
    // Test
    await deleteRemote({ fs, dir, gitdir, remote: 'foo' })
    expect(await fs.exists(`${gitdir}/config`)).toBe(false)
  })
  it('missing argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-addRemote')
    // Test
    let error = null
    try {
      // @ts-ignore
      await deleteRemote({ fs, dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
})
