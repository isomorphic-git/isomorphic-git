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
    const { core, dir } = await makeFixture('test-add')
    // Test
    await init({ core, dir })
    await add({ core, dir, filepath: 'a.txt' })
    expect((await listFiles({ core, dir })).length).toEqual(1)
    await add({ core, dir, filepath: 'a.txt' })
    expect((await listFiles({ core, dir })).length).toEqual(1)
    await add({ core, dir, filepath: 'a-copy.txt' })
    expect((await listFiles({ core, dir })).length).toEqual(2)
    await add({ core, dir, filepath: 'b.txt' })
    expect((await listFiles({ core, dir })).length).toEqual(3)
  })
  it('ignored file', async () => {
    // Setup
    const { fs, core, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ core, dir })
    await add({ core, dir, filepath: 'i.txt' })
    expect((await listFiles({ core, dir })).length).toEqual(0)
  })
  it('non-existant file', async () => {
    // Setup
    const { core, dir } = await makeFixture('test-add')
    // Test
    await init({ core, dir })
    let err = null
    try {
      await add({ core, dir, filepath: 'asdf.txt' })
    } catch (e) {
      err = e
    }
    expect(err.caller).toEqual('git.add')
  })
  it('folder', async () => {
    // Setup
    const { core, dir } = await makeFixture('test-add')
    // Test
    await init({ core, dir })
    expect((await listFiles({ core, dir })).length).toEqual(0)
    await add({ core, dir, filepath: 'c' })
    expect((await listFiles({ core, dir })).length).toEqual(4)
  })
  it('folder with .gitignore', async () => {
    // Setup
    const { fs, core, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ core, dir })
    expect((await listFiles({ core, dir })).length).toEqual(0)
    await add({ core, dir, filepath: 'c' })
    expect((await listFiles({ core, dir })).length).toEqual(3)
  })
  it('git add .', async () => {
    // Setup
    const { fs, core, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ core, dir })
    expect((await listFiles({ core, dir })).length).toEqual(0)
    await add({ core, dir, filepath: '.' })
    expect((await listFiles({ core, dir })).length).toEqual(7)
  })
})
