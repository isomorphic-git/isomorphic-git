/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const pify = require('pify')
const { plugins, init, add, listFiles } = require('isomorphic-git')

// NOTE: we cannot actually commit a real .gitignore file in fixtures or fixtures won't be included in this repo
const writeGitIgnore = async (fs, dir) => pify(fs.writeFile)(
  path.join(dir, '.gitignore'),
  ['*-pattern.js', 'i.txt', 'js_modules', '.DS_Store'].join('\n')
)

describe('add', () => {
  it('file', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    // Test
    await init({ dir })
    await add({ dir, filepath: 'a.txt' })
    expect((await listFiles({ dir })).length).toEqual(1)
    await add({ dir, filepath: 'a.txt' })
    expect((await listFiles({ dir })).length).toEqual(1)
    await add({ dir, filepath: 'a-copy.txt' })
    expect((await listFiles({ dir })).length).toEqual(2)
    await add({ dir, filepath: 'b.txt' })
    expect((await listFiles({ dir })).length).toEqual(3)
  })
  it('ignored file', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    await writeGitIgnore(fs, dir)
    // Test
    await init({ dir })
    await add({ dir, filepath: 'i.txt' })
    expect((await listFiles({ dir })).length).toEqual(0)
  })
  it('non-existant file', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    // Test
    await init({ dir })
    let err = null
    try {
      await add({ dir, filepath: 'asdf.txt' })
    } catch (e) {
      err = e
    }
    expect(err.caller).toEqual('git.add')
  })
  it('folder', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    // Test
    await init({ dir })
    expect((await listFiles({ dir })).length).toEqual(0)
    await add({ dir, filepath: 'c' })
    expect((await listFiles({ dir })).length).toEqual(4)
  })
  it('folder with .gitignore', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    await writeGitIgnore(fs, dir)
    // Test
    await init({ dir })
    expect((await listFiles({ dir })).length).toEqual(0)
    await add({ dir, filepath: 'c' })
    expect((await listFiles({ dir })).length).toEqual(3)
  })
  it('git add .', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    await writeGitIgnore(fs, dir)
    // Test
    await init({ dir })
    expect((await listFiles({ dir })).length).toEqual(0)
    await add({ dir, filepath: '.' })
    expect((await listFiles({ dir })).length).toEqual(7)
  })
})
