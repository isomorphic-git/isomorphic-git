/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const { statusMatrix, add, remove } = require('isomorphic-git')

describe('statusMatrix', () => {
  it('statusMatrix', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix')
    // Test
    let matrix = await statusMatrix({ dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0]
    ])

    await add({ dir, gitdir, filepath: 'a.txt' })
    await add({ dir, gitdir, filepath: 'b.txt' })
    await remove({ dir, gitdir, filepath: 'c.txt' })
    await add({ dir, gitdir, filepath: 'd.txt' })
    matrix = await statusMatrix({ dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 2],
      ['c.txt', 1, 0, 0],
      ['d.txt', 0, 2, 2]
    ])

    // And finally the weirdo cases
    const acontent = await fs.read(path.join(dir, 'a.txt'))
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await add({ dir, gitdir, filepath: 'a.txt' })
    await fs.write(path.join(dir, 'a.txt'), acontent)
    matrix = await statusMatrix({ dir, gitdir, pattern: 'a.txt' })
    expect(matrix).toEqual([['a.txt', 1, 1, 3]])

    await remove({ dir, gitdir, filepath: 'a.txt' })
    matrix = await statusMatrix({ dir, gitdir, pattern: 'a.txt' })
    expect(matrix).toEqual([['a.txt', 1, 1, 0]])

    await fs.write(path.join(dir, 'e.txt'), 'Hi')
    await add({ dir, gitdir, filepath: 'e.txt' })
    await fs.rm(path.join(dir, 'e.txt'))
    matrix = await statusMatrix({ dir, gitdir, pattern: 'e.txt' })
    expect(matrix).toEqual([['e.txt', 0, 0, 3]])
  })

  it('statusMatrix in an fresh git repo with no commits', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await fs.write(path.join(dir, 'b.txt'), 'Hi')
    await add({ dir, gitdir, filepath: 'b.txt' })
    // Test
    const a = await statusMatrix({ dir, gitdir, pattern: 'a.txt' })
    expect(a).toEqual([['a.txt', 0, 2, 0]])
    const b = await statusMatrix({ dir, gitdir, pattern: 'b.txt' })
    expect(b).toEqual([['b.txt', 0, 2, 2]])
  })

  it('statusMatrix (pattern vs filepaths)', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Test
    let matrix = await statusMatrix({ dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
      ['g/g.txt', 0, 2, 0],
      ['h/h.txt', 0, 2, 0],
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0]
    ])

    matrix = await statusMatrix({ dir, gitdir, pattern: 'i' })
    expect(matrix).toEqual([])

    matrix = await statusMatrix({ dir, gitdir, filepaths: ['i'] })
    expect(matrix).toEqual([['i/.gitignore', 0, 2, 0], ['i/i.txt', 0, 2, 0]])

    matrix = await statusMatrix({ dir, gitdir, filepaths: [] })
    expect(matrix).toBeUndefined()

    matrix = await statusMatrix({ dir, gitdir, filepaths: ['i', 'h'] })
    expect(matrix).toEqual([
      ['h/h.txt', 0, 2, 0],
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0]
    ])
  })

  it('statusMatrix (pattern vs pattern + filepaths)', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Test
    let matrix = await statusMatrix({ dir, gitdir, pattern: '*.txt' })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0]
    ])

    matrix = await statusMatrix({
      dir,
      gitdir,
      pattern: '*.txt',
      filepaths: ['i']
    })
    expect(matrix).toEqual([['i/i.txt', 0, 2, 0]])

    matrix = await statusMatrix({
      dir,
      gitdir,
      pattern: '*.txt',
      filepaths: ['.', 'i']
    })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
      ['i/i.txt', 0, 2, 0]
    ])

    matrix = await statusMatrix({
      dir,
      gitdir,
      pattern: 'i/*.txt',
      filepaths: ['.', 'i']
    })
    expect(matrix).toEqual([['i/i.txt', 0, 2, 0]])

    matrix = await statusMatrix({
      dir,
      gitdir,
      pattern: 'i/*.txt',
      filepaths: ['i']
    })
    expect(matrix).toEqual([])
  })
})
