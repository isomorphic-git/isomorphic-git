/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init } = require('..')

describe('init', () => {
  it('init', async () => {
    let { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir })
    expect(fs.existsSync(dir)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/refs/heads`)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/HEAD`)).toBe(true)
  })
})
