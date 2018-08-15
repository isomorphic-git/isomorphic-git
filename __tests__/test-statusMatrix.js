/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const pify = require('pify')
const { statusMatrix, add, remove } = require('isomorphic-git')

describe('statusMatrix', () => {
  it('statusMatrix', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-statusMatrix')
    // Test
    let matrix = await statusMatrix({fs, dir, gitdir})
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0]
    ])

    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    await remove({ fs, dir, gitdir, filepath: 'c.txt' })
    await add({ fs, dir, gitdir, filepath: 'd.txt' })
    matrix = await statusMatrix({fs, dir, gitdir})
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 2],
      ['c.txt', 1, 0, 0],
      ['d.txt', 0, 2, 2]
    ])

    // And finally the weirdo cases
    let acontent = await pify(fs.readFile)(path.join(dir, 'a.txt'))
    await pify(fs.writeFile)(path.join(dir, 'a.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await pify(fs.writeFile)(path.join(dir, 'a.txt'), acontent)
    matrix = await statusMatrix({fs, dir, gitdir, pattern: 'a.txt'})
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 3]
    ])

    await remove({ fs, dir, gitdir, filepath: 'a.txt' })
    matrix = await statusMatrix({fs, dir, gitdir, pattern: 'a.txt'})
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 0]
    ])

    await pify(fs.writeFile)(path.join(dir, 'e.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'e.txt' })
    await pify(fs.unlink)(path.join(dir, 'e.txt'))
    matrix = await statusMatrix({fs, dir, gitdir, pattern: 'e.txt'})
    expect(matrix).toEqual([
      ['e.txt', 0, 0, 3]
    ])
  })
})
