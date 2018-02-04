/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init } = require('..')

/** @test {init} */
describe('init', () => {
  it('init', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-init')
    // Test
    await init({ fs, dir })
    expect(fs.existsSync(dir)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/refs/heads`)).toBe(true)
    expect(fs.existsSync(`${dir}/.git/HEAD`)).toBe(true)
  })
})
