/* eslint-env node, browser, jasmine */

import { init, getConfig, setConfig } from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('init', () => {
  it('init', async () => {
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/HEAD`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/hooks`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
  })
  it('init with noHooks', async () => {
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, noHooks: true })
    expect(await fs.exists(`${gitdirsmfullpath}/hooks`)).toBe(false)
    expect(await fs.exists(`${gitdirsmfullpath}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/HEAD`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
  })
  it('init with noConfig', async () => {
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, noConfig: true })
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(false)
    expect(await fs.exists(`${gitdirsmfullpath}/HEAD`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/refs/tags`)).toBe(true)
  })
  it('init with noConfig does not overwrite an existing repository without config', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, noConfig: true })
    await fs.write(`${gitdirsmfullpath}/HEAD`, 'ref: refs/heads/feature\n')
    // Test
    await init({ fs, dir, noConfig: true })
    expect(await fs.read(`${gitdirsmfullpath}/HEAD`, 'utf8')).toBe(
      'ref: refs/heads/feature\n'
    )
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(false)
  })
  it('init with noConfig restores missing folders of a repository without config', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, noConfig: true })
    await fs.rmdir(`${gitdirsmfullpath}/refs/heads`)
    // Test
    await init({ fs, dir, noConfig: true })
    expect(await fs.exists(`${gitdirsmfullpath}/refs/heads`)).toBe(true)
  })
  it('init without noConfig adds a config to a repository without one', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, noConfig: true })
    // Test
    await init({ fs, dir })
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
  })
  it('init without noConfig keeps the HEAD of a repository without config', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, noConfig: true })
    await fs.write(`${gitdirsmfullpath}/HEAD`, 'ref: refs/heads/feature\n')
    // Test
    await init({ fs, dir })
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
    expect(await fs.read(`${gitdirsmfullpath}/HEAD`, 'utf8')).toBe(
      'ref: refs/heads/feature\n'
    )
  })
  it('init --bare', async () => {
    const { fs, dir } = await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, bare: true })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/HEAD`)).toBe(true)
  })
  it('init does not overwrite existing config', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    const name = 'me'
    const email = 'meme'
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
    await setConfig({ fs, dir, path: 'user.name', value: name })
    await setConfig({ fs, dir, path: 'user.email', value: email })
    // Test
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
    // check that the properties we added are still there.
    expect(await getConfig({ fs, dir, path: 'user.name' })).toEqual(name)
    expect(await getConfig({ fs, dir, path: 'user.email' })).toEqual(email)
  })
})
