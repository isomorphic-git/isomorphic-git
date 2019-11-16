/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init } = require('isomorphic-git')
const { config } = require('isomorphic-git')

describe('init', () => {
  it('init', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
  })
  it('init --bare', async () => {
    const { fs, dir } = await makeFixture('test-init')
    await init({ dir, bare: true })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/HEAD`)).toBe(true)
  })
  it('init config init overwrite', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    const name = 'me'
    const email = 'meme'
    await init({ dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
    await config({ dir, path: 'user.name', value: name })
    await config({ dir, path: 'user.email', value: email })
    // Test
    await init({ dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
    // check that the properties we added got removed
    expect(await config({ dir, path: 'user.name' })).toBeUndefined()
    expect(await config({ dir, path: 'user.email' })).toBeUndefined()
  })
  it('init config init no overwrite', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    const name = 'me'
    const email = 'meme'
    await init({ dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
    await config({ dir, path: 'user.name', value: name })
    await config({ dir, path: 'user.email', value: email })
    // Test
    await init({ dir, noOverwrite: true })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/config`)).toBe(true)
    // check that the properties we added are still there.
    expect(await config({ dir, path: 'user.name' })).toEqual(name)
    expect(await config({ dir, path: 'user.email' })).toEqual(email)
  })
})
