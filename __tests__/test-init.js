/* eslint-env node, browser, jasmine */

const { init } = require('isomorphic-git')
const { getConfig, setConfig } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('init', () => {
  it('init', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
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
