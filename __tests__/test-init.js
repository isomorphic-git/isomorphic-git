/* eslint-env node, browser, jasmine */

import { init, getConfig, setConfig } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { makeWriteBlocklistFS } from './__helpers__/makeFailingFS.js'

describe('init', () => {
  it('init', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/hooks`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
  })
  it('init with noHooks', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir, noHooks: true })
    expect(await fs.exists(`${dir}/.git/hooks`)).toBe(false)
    expect(await fs.exists(`${dir}/.git/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
  })
  it('init with noHooks when the browser refuses to create .git/hooks', async () => {
    // Setup
    const { _fs, fs, dir } = await makeFixture('test-init')
    const blockedFs = makeWriteBlocklistFS(_fs, ['.git/hooks'])
    let error = null
    try {
      await init({ fs: blockedFs, dir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.name).toBe('SecurityError')
    // Test
    await init({ fs: blockedFs, dir, noHooks: true })
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
  })
  it('init with noConfig', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir, noConfig: true })
    expect(await fs.exists(`${dir}/.git/config`)).toBe(false)
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/tags`)).toBe(true)
  })
  it('init with noConfig does not overwrite an existing repository without config', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir, noConfig: true })
    await fs.write(`${dir}/.git/HEAD`, 'ref: refs/heads/feature\n')
    // Test
    await init({ fs, dir, noConfig: true })
    expect(await fs.read(`${dir}/.git/HEAD`, 'utf8')).toBe(
      'ref: refs/heads/feature\n'
    )
    expect(await fs.exists(`${dir}/.git/config`)).toBe(false)
  })
  it('init without noConfig adds a config to a repository without one', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir, noConfig: true })
    // Test
    await init({ fs, dir })
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
  })
  it('init with noHooks and noConfig when the browser refuses to write .git/hooks and .git/config', async () => {
    // Setup
    const { _fs, fs, dir } = await makeFixture('test-init')
    const blockedFs = makeWriteBlocklistFS(_fs, ['.git/hooks', '.git/config'])
    let error = null
    try {
      await init({ fs: blockedFs, dir, noHooks: true })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.name).toBe('SecurityError')
    // Test
    await init({ fs: blockedFs, dir, noHooks: true, noConfig: true })
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(false)
  })
  it('init --bare', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir, bare: true })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/HEAD`)).toBe(true)
  })
  it('init does not overwrite existing config', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    const name = 'me'
    const email = 'meme'
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
    await setConfig({ fs, dir, path: 'user.name', value: name })
    await setConfig({ fs, dir, path: 'user.email', value: email })
    // Test
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
    // check that the properties we added are still there.
    expect(await getConfig({ fs, dir, path: 'user.name' })).toEqual(name)
    expect(await getConfig({ fs, dir, path: 'user.email' })).toEqual(email)
  })
})
