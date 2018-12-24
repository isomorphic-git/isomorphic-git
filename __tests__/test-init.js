/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { FileSystem } = require('isomorphic-git/internal-apis')

const { plugins, init } = require('isomorphic-git')

describe('init', () => {
  it('init', async () => {
    let { fs, dir } = await makeFixture('test-init')
    plugins.set('fs', fs)
    fs = new FileSystem(fs)
    await init({ dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/.git/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/.git/HEAD`)).toBe(true)
  })
  it('init --bare', async () => {
    let { fs, dir } = await makeFixture('test-init')
    plugins.set('fs', fs)
    fs = new FileSystem(fs)
    await init({ dir, bare: true })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/HEAD`)).toBe(true)
  })
})
