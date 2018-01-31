/* globals describe test expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
import { init, add, listFiles } from '..'

/** @test {add} */
describe('add', () => {
  test('file', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir, gitdir })
    let orig = (await listFiles({ fs, dir, gitdir })).length
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir, gitdir })).length === 1).toBe(true)
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir, gitdir })).length === 1).toBe(true)
    await add({ fs, dir, gitdir, filepath: 'a-copy.txt' })
    expect((await listFiles({ fs, dir, gitdir })).length === 2).toBe(true)
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    expect((await listFiles({ fs, dir, gitdir })).length === 3).toBe(true)
  })
})
