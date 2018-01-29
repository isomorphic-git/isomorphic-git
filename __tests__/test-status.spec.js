/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const pify = require('pify')
const { status, add, remove } = require('..')

describe('status', () => {
  it('status', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-status')
    // Test
    const a = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    const b = await status({ fs, dir, gitdir, filepath: 'b.txt' })
    const c = await status({ fs, dir, gitdir, filepath: 'c.txt' })
    const d = await status({ fs, dir, gitdir, filepath: 'd.txt' })
    const e = await status({ fs, dir, gitdir, filepath: 'e.txt' })
    expect(a).toEqual('unmodified')
    expect(b).toEqual('*modified')
    expect(c).toEqual('*deleted')
    expect(d).toEqual('*added')
    expect(e).toEqual('absent')

    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    await remove({ fs, dir, gitdir, filepath: 'c.txt' })
    await add({ fs, dir, gitdir, filepath: 'd.txt' })
    const a2 = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    const b2 = await status({ fs, dir, gitdir, filepath: 'b.txt' })
    const c2 = await status({ fs, dir, gitdir, filepath: 'c.txt' })
    const d2 = await status({ fs, dir, gitdir, filepath: 'd.txt' })
    expect(a2).toEqual('unmodified')
    expect(b2).toEqual('modified')
    expect(c2).toEqual('deleted')
    expect(d2).toEqual('added')

    // And finally the weirdo cases
    let acontent = await pify(fs.readFile)(path.join(dir, 'a.txt'))
    await pify(fs.writeFile)(path.join(dir, 'a.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await pify(fs.writeFile)(path.join(dir, 'a.txt'), acontent)
    let a3 = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(a3).toEqual('*unmodified')

    await remove({ fs, dir, gitdir, filepath: 'a.txt' })
    let a4 = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(a4).toEqual('*undeleted')

    await pify(fs.writeFile)(path.join(dir, 'e.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'e.txt' })
    await pify(fs.unlink)(path.join(dir, 'e.txt'))
    let e3 = await status({ fs, dir, gitdir, filepath: 'e.txt' })
    expect(e3).toEqual('*absent')

    // Yay .gitignore!
    // NOTE: make_http_index does not include hidden files, so
    // I had to insert test-status/.gitignore and test-status/i/.gitignore
    // manually into the JSON.
    let f = await status({ fs, dir, gitdir, filepath: 'f.txt' })
    let g = await status({ fs, dir, gitdir, filepath: 'g/g.txt' })
    let h = await status({ fs, dir, gitdir, filepath: 'h/h.txt' })
    let i = await status({ fs, dir, gitdir, filepath: 'i/i.txt' })
    expect(f).toEqual('ignored')
    expect(g).toEqual('ignored')
    expect(h).toEqual('ignored')
    expect(i).toEqual('*added')
  })
})
