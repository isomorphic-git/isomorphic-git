/* eslint-env node, browser, jasmine */
const path = require('path')

const { statusMatrix, add, remove } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('statusMatrix', () => {
  it('statusMatrix', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix')
    // Test
    let matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
    ])

    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    await remove({ fs, dir, gitdir, filepath: 'c.txt' })
    await add({ fs, dir, gitdir, filepath: 'd.txt' })
    matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 2],
      ['c.txt', 1, 0, 0],
      ['d.txt', 0, 2, 2],
    ])

    // And finally the weirdo cases
    const acontent = await fs.read(path.join(dir, 'a.txt'))
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await fs.write(path.join(dir, 'a.txt'), acontent)
    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['a.txt'] })
    expect(matrix).toEqual([['a.txt', 1, 1, 3]])

    await remove({ fs, dir, gitdir, filepath: 'a.txt' })
    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['a.txt'] })
    expect(matrix).toEqual([['a.txt', 1, 1, 0]])

    await fs.write(path.join(dir, 'e.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'e.txt' })
    await fs.rm(path.join(dir, 'e.txt'))
    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['e.txt'] })
    expect(matrix).toEqual([['e.txt', 0, 0, 3]])
  })

  it('statusMatrix in an fresh git repo with no commits', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await fs.write(path.join(dir, 'b.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    // Test
    const a = await statusMatrix({ fs, dir, gitdir, filepaths: ['a.txt'] })
    expect(a).toEqual([['a.txt', 0, 2, 0]])
    const b = await statusMatrix({ fs, dir, gitdir, filepaths: ['b.txt'] })
    expect(b).toEqual([['b.txt', 0, 2, 2]])
  })

  it('statusMatrix in an fresh git repo with no commits and .gitignore', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')
    await add({ fs, dir, gitdir, filepath: '.' })
    // Test
    const a = await statusMatrix({ fs, dir, gitdir })
    expect(a).toEqual([['.gitignore', 0, 2, 2]])
  })

  it('does not return ignored files already in the index', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')

    // Test
    const a = await statusMatrix({ fs, dir, gitdir })
    expect(a).toEqual([['.gitignore', 0, 2, 2]])
  })

  it('returns ignored files already in the index if ignored:true', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')

    // Test
    const a = await statusMatrix({ fs, dir, gitdir, ignored: true })
    expect(a).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 0],
    ])
  })

  it('ignored:true works with multiple added files ', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(
      path.join(dir, '.gitignore'),
      'ignoreme.txt\nignoreme2.txt\n'
    )
    await add({ fs, dir, gitdir, filepath: '.' })
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')
    await fs.write(path.join(dir, 'ignoreme2.txt'), 'ignored')

    // Test
    const a = await statusMatrix({ fs, dir, gitdir, ignored: true })
    expect(a).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 0],
      ['ignoreme2.txt', 0, 2, 0],
    ])
  })

  describe('ignored:true works supports multiple filepaths', () => {
    let fs, dir, gitdir
    const ignoredFolder = 'ignoreThisFolder'
    const nonIgnoredFolder = 'nonIgnoredFolder'

    beforeAll(async () => {
      // Setup
      const output = await makeFixture('test-empty')
      fs = output.fs
      dir = output.dir
      gitdir = output.gitdir

      await fs.write(path.join(dir, '.gitignore'), `${ignoredFolder}/*\n`)
      await add({ fs, dir, gitdir, filepath: '.' })
      await fs.mkdir(path.join(dir, ignoredFolder))
      await fs.mkdir(path.join(dir, nonIgnoredFolder))
      await fs.write(
        path.join(dir, nonIgnoredFolder, 'notIgnored.txt'),
        'notIgnored'
      )
      await fs.write(path.join(dir, ignoredFolder, 'ignoreme.txt'), 'ignored')
      await fs.write(path.join(dir, 'notIgnored.txt'), 'notIgnored')
    })

    it('base case: no filepaths', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        ignored: true,
      })
      expect(result).toEqual([
        ['.gitignore', 0, 2, 2],
        [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
        [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
        ['notIgnored.txt', 0, 2, 0],
      ])
    })

    it('filepaths on ignored folder should return empty', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: [ignoredFolder],
      })
      expect(result).toEqual([])
    })

    it('shows nonignored file and folder', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: [ignoredFolder, 'notIgnored.txt', nonIgnoredFolder],
      })
      expect(result).toEqual([
        [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
        ['notIgnored.txt', 0, 2, 0],
      ])
    })

    it('filepaths on ignored folder and non-ignored file should show all files with ignored:true ', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: [ignoredFolder, 'notIgnored.txt', nonIgnoredFolder],
        ignored: true,
      })
      expect(result).toEqual([
        [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
        [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
        ['notIgnored.txt', 0, 2, 0],
      ])
    })

    describe('all files, ignored:true, test order permutation', () => {
      it('file, ignored, notignored', async () => {
        const result = await statusMatrix({
          fs,
          dir,
          gitdir,
          filepaths: ['notIgnored.txt', ignoredFolder, nonIgnoredFolder],
          ignored: true,
        })
        expect(result).toEqual([
          [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
          [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
          ['notIgnored.txt', 0, 2, 0],
        ])
      })
      it('ignored, notignored, file', async () => {
        const result = await statusMatrix({
          fs,
          dir,
          gitdir,
          filepaths: [ignoredFolder, nonIgnoredFolder, 'notIgnored.txt'],
          ignored: true,
        })
        expect(result).toEqual([
          [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
          [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
          ['notIgnored.txt', 0, 2, 0],
        ])
      })
      it('notignored, ignored, file', async () => {
        const result = await statusMatrix({
          fs,
          dir,
          gitdir,
          filepaths: [nonIgnoredFolder, ignoredFolder, 'notIgnored.txt'],
          ignored: true,
        })
        expect(result).toEqual([
          [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
          [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
          ['notIgnored.txt', 0, 2, 0],
        ])
      })
    })
  })
  it('ignored: true has no impact when file is already in index', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')
    await add({ fs, dir, gitdir, filepath: '.', force: true })
    // Test
    const a = await statusMatrix({ fs, dir, gitdir, ignored: true })
    expect(a).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 2],
    ])
    // Test
    const b = await statusMatrix({ fs, dir, gitdir, ignored: false })
    expect(b).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 2],
    ])
  })

  it('statusMatrix with filepaths', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Test
    let matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
      ['g/g.txt', 0, 2, 0],
      ['h/h.txt', 0, 2, 0],
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])

    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['i'] })
    expect(matrix).toEqual([
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])

    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: [] })
    expect(matrix).toBeUndefined()

    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['i', 'h'] })
    expect(matrix).toEqual([
      ['h/h.txt', 0, 2, 0],
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])
  })

  it('statusMatrix with filter', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Test
    let matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filter: filepath => !filepath.includes('/') && filepath.endsWith('.txt'),
    })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
    ])

    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filter: filepath => filepath.endsWith('.gitignore'),
    })
    expect(matrix).toEqual([['i/.gitignore', 0, 2, 0]])

    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filter: filepath => filepath.endsWith('.txt'),
      filepaths: ['i'],
    })
    expect(matrix).toEqual([['i/i.txt', 0, 2, 0]])
  })

  it('statusMatrix with removed folder and created file with same name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-statusMatrix-tree-blob-collision'
    )
    // Test
    await fs.rmdir(path.join(dir, 'a'), { recursive: true })
    await fs.write(path.join(dir, 'a'), 'Hi')
    let matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a', 0, 2, 0],
      ['a/a.txt', 1, 0, 1],
      ['b', 1, 1, 1],
    ])
    await remove({ fs, dir, gitdir, filepath: 'a/a.txt' })
    await add({ fs, dir, gitdir, filepath: 'a' })
    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a', 0, 2, 2],
      ['a/a.txt', 1, 0, 0],
      ['b', 1, 1, 1],
    ])
  })

  it('statusMatrix with removed file and created folder with same name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-statusMatrix-blob-tree-collision'
    )
    // Test
    await fs.rm(path.join(dir, 'b'))
    await fs.mkdir(path.join(dir, 'b'))
    await fs.write(path.join(dir, 'b/b.txt'), 'Hi')
    let matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a/a.txt', 1, 1, 1],
      ['b', 1, 0, 1],
      ['b/b.txt', 0, 2, 0],
    ])
    await remove({ fs, dir, gitdir, filepath: 'b' })
    await add({ fs, dir, gitdir, filepath: 'b/b.txt' })
    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a/a.txt', 1, 1, 1],
      ['b', 1, 0, 0],
      ['b/b.txt', 0, 2, 2],
    ])
  })
})
