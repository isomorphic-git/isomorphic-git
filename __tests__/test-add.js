/* eslint-env node, browser, jasmine */
const {
  init,
  add,
  listFiles,
  readBlob,
  walk,
  STAGE,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// NOTE: we cannot actually commit a real .gitignore file in fixtures or fixtures won't be included in this repo
const writeGitIgnore = async (fs, dir) =>
  fs.write(
    dir + '/.gitignore',
    ['*-pattern.js', 'i.txt', 'js_modules', '.DS_Store'].join('\n')
  )

// NOTE: we cannot actually commit a real symlink in fixtures because it relies on core.symlinks being enabled
const writeSymlink = async (fs, dir) =>
  fs._symlink('c/e.txt', dir + '/e-link.txt')

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
  it('symlink', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // it's not currently possible to tests symlinks in the browser since there's no way to create them
    const symlinkCreated = await writeSymlink(fs, dir)
      .then(() => true)
      .catch(() => false)
    // Test
    await init({ fs, dir })
    await add({ fs, dir, filepath: 'c/e.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(1)
    if (!symlinkCreated) return
    await add({ fs, dir, filepath: 'e-link.txt' })
    expect((await listFiles({ fs, dir })).length).toEqual(2)
    const walkResult = await walk({
      fs,
      dir,
      trees: [STAGE()],
      map: async (filepath, [stage]) =>
        filepath === 'e-link.txt' && stage ? stage.oid() : undefined,
    })
    expect(walkResult.length).toEqual(1)
    const oid = walkResult[0]
    const { blob: symlinkTarget } = await readBlob({ fs, dir, oid })
    let symlinkTargetStr = Buffer.from(symlinkTarget).toString('utf8')
    if (symlinkTargetStr.startsWith('./')) {
      symlinkTargetStr = symlinkTargetStr.substr(2)
    }
    expect(symlinkTargetStr).toEqual('c/e.txt')
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
