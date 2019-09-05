/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init } = require('isomorphic-git')

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
})
