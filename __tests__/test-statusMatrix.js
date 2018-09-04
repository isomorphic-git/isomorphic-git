/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const pify = require('pify')
const { plugins, statusMatrix, add, remove } = require('isomorphic-git')

describe('statusMatrix', () => {
  it('statusMatrix', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-statusMatrix')
    plugins.set('fs', fs)
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
    let acontent = await pify(fs.readFile)(path.join(dir, 'a.txt'))
    await pify(fs.writeFile)(path.join(dir, 'a.txt'), 'Hi')
    await add({ dir, gitdir, filepath: 'a.txt' })
    await pify(fs.writeFile)(path.join(dir, 'a.txt'), acontent)
    matrix = await statusMatrix({ dir, gitdir, pattern: 'a.txt' })
    expect(matrix).toEqual([['a.txt', 1, 1, 3]])

    await remove({ dir, gitdir, filepath: 'a.txt' })
    matrix = await statusMatrix({ dir, gitdir, pattern: 'a.txt' })
    expect(matrix).toEqual([['a.txt', 1, 1, 0]])

    await pify(fs.writeFile)(path.join(dir, 'e.txt'), 'Hi')
    await add({ dir, gitdir, filepath: 'e.txt' })
    await pify(fs.unlink)(path.join(dir, 'e.txt'))
    matrix = await statusMatrix({ dir, gitdir, pattern: 'e.txt' })
    expect(matrix).toEqual([['e.txt', 0, 0, 3]])
  })
})
