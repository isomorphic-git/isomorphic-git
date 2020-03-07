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
})
