/* eslint-env node, browser, jasmine */
const {
  init,
  add,
  listFiles,
  readBlob,
  walk,
  STAGE,
  status,
  getConfig,
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
  it('multiple files', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    await add({ fs, dir, filepath: ['a.txt', 'a-copy.txt', 'b.txt'] })
    expect((await listFiles({ fs, dir })).length).toEqual(3)
  })
  it('multiple files with parallel=false', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    await add({
      fs,
      dir,
      filepath: ['a.txt', 'a-copy.txt', 'b.txt'],
      parallel: false,
    })
    expect((await listFiles({ fs, dir })).length).toEqual(3)
  })
  it('multiple files with one failure (normal error)', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    let err = null
    try {
      await add({ fs, dir, filepath: ['a.txt', 'a-copy.txt', 'non-existent'] })
    } catch (e) {
      err = e
    }
    expect(err.caller).toEqual('git.add')
    expect(err.name).toEqual('NotFoundError')
  })
  it('multiple files with 2 failures (MultipleGitError) and an ignored file', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)

    // Test
    await init({ fs, dir })
    let err = null
    try {
      await add({
        fs,
        dir,
        filepath: ['a.txt', 'i.txt', 'non-existent', 'also-non-existent'],
      })
    } catch (e) {
      err = e
    }
    expect(err.caller).toEqual('git.add')
    expect(err.name).toEqual('MultipleGitError')
    expect(err.errors.length).toEqual(2)
    err.errors.forEach(e => {
      expect(e.name).toEqual('NotFoundError')
    })
  })
  it('multiple files with 1 ignored', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)

    // Test
    await init({ fs, dir })
    await add({
      fs,
      dir,
      filepath: ['a.txt', 'i.txt'],
    })
  })
  it('multiple files with 1 ignored and force:true', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)

    // Test
    await init({ fs, dir })
    await add({
      fs,
      dir,
      filepath: ['a.txt', 'i.txt'],
      force: true,
    })
    expect((await listFiles({ fs, dir })).length).toEqual(2)
    expect(await listFiles({ fs, dir })).toEqual(['a.txt', 'i.txt'])
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
  it('ignored file but with force=true', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ fs, dir })
    await add({ fs, dir, filepath: 'i.txt', force: true })
    expect((await listFiles({ fs, dir })).length).toEqual(1)
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
  it('folder with .gitignore and force', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ fs, dir })
    expect((await listFiles({ fs, dir })).length).toEqual(0)
    await add({ fs, dir, filepath: 'c', force: true })
    expect((await listFiles({ fs, dir })).length).toEqual(4)
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
  it('git add . with parallel=false', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-add')
    await writeGitIgnore(fs, dir)
    // Test
    await init({ fs, dir })
    expect((await listFiles({ fs, dir })).length).toEqual(0)
    await add({ fs, dir, filepath: '.', parallel: false })
    expect((await listFiles({ fs, dir })).length).toEqual(7)
  })
  it('git add . with core.autocrlf=true does not break binary files', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-add-autocrlf')
    expect(await getConfig({ fs, dir, gitdir, path: 'core.autocrlf' })).toEqual(
      'true'
    )
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchInlineSnapshot(`
      Array [
        "20thcenturyfoodcourt.png",
        "Test.md",
      ]
    `)
    const index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchInlineSnapshot(`
      Array [
        "20thcenturyfoodcourt.png",
        "Test.md",
      ]
    `)
    expect(new TextDecoder().decode(await fs.read(`${dir}/Test.md`))).toContain(
      `\r\n`
    )
    await fs.write(`${dir}/README.md`, '# test')

    await add({ fs, dir, gitdir, filepath: '.' })

    expect(
      await status({ fs, dir, gitdir, filepath: '20thcenturyfoodcourt.png' })
    ).toEqual('unmodified')
    expect(await status({ fs, dir, gitdir, filepath: 'Test.md' })).toEqual(
      'unmodified'
    )
    expect(await status({ fs, dir, gitdir, filepath: 'README.md' })).toEqual(
      'added'
    )
  })
})
