/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { plugins, init } = require('isomorphic-git')

describe('init', () => {
  it('init', async () => {
    let { fs, dir } = await makeFixture('test-init')
    plugins.set('fs', fs)
    await init({ dir })
    expect(fs.existsSync(dir)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/refs/heads`)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/HEAD`)).toBe(true)
  })
  it('init --bare', async () => {
    let { fs, dir } = await makeFixture('test-init')
    plugins.set('fs', fs)
    await init({ dir, bare: true })
    expect(fs.existsSync(dir)).toBe(true)
    expect(fs.existsSync(`${dir}/objects`)).toBe(true)
    expect(fs.existsSync(`${dir}/refs/heads`)).toBe(true)
    expect(fs.existsSync(`${dir}/HEAD`)).toBe(true)
  })
})
