/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init, add, listFiles } = require('..')

/** @test {add} */
describe('add', () => {
  it('file', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    let orig = (await listFiles({ fs, dir })).length
    await add({ fs, dir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir })).length === 1).toBe(true)
    await add({ fs, dir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir })).length === 1).toBe(true)
    await add({ fs, dir, filepath: 'a-copy.txt' })
    expect((await listFiles({ fs, dir })).length === 2).toBe(true)
    await add({ fs, dir, filepath: 'b.txt' })
    expect((await listFiles({ fs, dir })).length === 3).toBe(true)
  })
})
