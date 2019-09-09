/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const { status, add, remove } = require('isomorphic-git')

describe('status', () => {
  it('status', async () => {
    // Setup
    const { core, fs, dir, gitdir } = await makeFixture('test-status')
    // Test
    const a = await status({ core, dir, gitdir, filepath: 'a.txt' })
    const b = await status({ core, dir, gitdir, filepath: 'b.txt' })
    const c = await status({ core, dir, gitdir, filepath: 'c.txt' })
    const d = await status({ core, dir, gitdir, filepath: 'd.txt' })
    const e = await status({ core, dir, gitdir, filepath: 'e.txt' })
    expect(a).toEqual('unmodified')
    expect(b).toEqual('*modified')
    expect(c).toEqual('*deleted')
    expect(d).toEqual('*added')
    expect(e).toEqual('absent')

    await add({ core, dir, gitdir, filepath: 'a.txt' })
    await add({ core, dir, gitdir, filepath: 'b.txt' })
    await remove({ core, dir, gitdir, filepath: 'c.txt' })
    await add({ core, dir, gitdir, filepath: 'd.txt' })
    const a2 = await status({ core, dir, gitdir, filepath: 'a.txt' })
    const b2 = await status({ core, dir, gitdir, filepath: 'b.txt' })
    const c2 = await status({ core, dir, gitdir, filepath: 'c.txt' })
    const d2 = await status({ core, dir, gitdir, filepath: 'd.txt' })
    expect(a2).toEqual('unmodified')
    expect(b2).toEqual('modified')
    expect(c2).toEqual('deleted')
    expect(d2).toEqual('added')

    // And finally the weirdo cases
    const acontent = await fs.read(path.join(dir, 'a.txt'))
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await add({ core, dir, gitdir, filepath: 'a.txt' })
    await fs.write(path.join(dir, 'a.txt'), acontent)
    const a3 = await status({ core, dir, gitdir, filepath: 'a.txt' })
    expect(a3).toEqual('*unmodified')

    await remove({ core, dir, gitdir, filepath: 'a.txt' })
    const a4 = await status({ core, dir, gitdir, filepath: 'a.txt' })
    expect(a4).toEqual('*undeleted')

    await fs.write(path.join(dir, 'e.txt'), 'Hi')
    await add({ core, dir, gitdir, filepath: 'e.txt' })
    await fs.rm(path.join(dir, 'e.txt'))
    const e3 = await status({ core, dir, gitdir, filepath: 'e.txt' })
    expect(e3).toEqual('*absent')

    // Yay .gitignore!
    // NOTE: make_http_index does not include hidden files, so
    // I had to insert test-status/.gitignore and test-status/i/.gitignore
    // manually into the JSON.
    const f = await status({ core, dir, gitdir, filepath: 'f.txt' })
    const g = await status({ core, dir, gitdir, filepath: 'g/g.txt' })
    const h = await status({ core, dir, gitdir, filepath: 'h/h.txt' })
    const i = await status({ core, dir, gitdir, filepath: 'i/i.txt' })
    expect(f).toEqual('ignored')
    expect(g).toEqual('ignored')
    expect(h).toEqual('ignored')
    expect(i).toEqual('*added')
  })

  it('status in an fresh git repo with no commits', async () => {
    // Setup
    const { core, fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await fs.write(path.join(dir, 'b.txt'), 'Hi')
    await add({ core, dir, gitdir, filepath: 'b.txt' })
    // Test
    const a = await status({ core, dir, gitdir, filepath: 'a.txt' })
    expect(a).toEqual('*added')
    const b = await status({ core, dir, gitdir, filepath: 'b.txt' })
    expect(b).toEqual('added')
  })
})
