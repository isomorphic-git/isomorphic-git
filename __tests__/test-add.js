/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init, add, listFiles } = require('isomorphic-git')

// NOTE: we cannot actually commit a real .gitignore file in fixtures or fixtures won't be included in this repo
const writeGitIgnore = async (fs, dir) =>
  fs.write(
    dir + '/.gitignore',
    ['*-pattern.js', 'i.txt', 'js_modules', '.DS_Store'].join('\n')
  )

describe('add', () => {
  it('file', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    await add({ fs, dir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(1)
    await add({ fs, dir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(1)
    await add({ fs, dir, filepath: 'a-copy.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(2)
    await add({ fs, dir, filepath: 'b.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(3)
  })
  it('ignored file', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ fs, dir })
    await add({ fs, dir, filepath: 'i.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(0)
  })
  it('non-existant file', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    let err = null
    try {
      await add({ fs, dir, filepath: 'asdf.txt' })
    } catch (e) {
      err = e
    }
    expect(err.caller).toEqual('git.add')
  })
  it('folder', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    expect((await listFiles({ fs, dir })).length).toEqual(0)
    await add({ fs, dir, filepath: 'c' })
    expect((await listFiles({ fs, dir })).length).toEqual(4)
  })
  it('folder with .gitignore', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ fs, dir })
    expect((await listFiles({ fs, dir })).length).toEqual(0)
    await add({ fs, dir, filepath: 'c' })
    expect((await listFiles({ fs, dir })).length).toEqual(3)
  })
  it('git add .', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ fs, dir })
    expect((await listFiles({ fs, dir })).length).toEqual(0)
    await add({ fs, dir, filepath: '.' })
    expect((await listFiles({ fs, dir })).length).toEqual(7)
  })
})
