/* global test describe expect */
import _fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import path from 'path'
import { models } from '../dist/for-node/internal-apis'
import { status, add, remove } from '..'
const { FileSystem } = models
const fs = new FileSystem(_fs)

/** @test {status} */
describe('status', () => {
  test('status', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-status.git')
    let dir = await copyFixtureIntoTempDir(__dirname, 'test-status')
    const repo = { fs: _fs, dir, gitdir }
    const a = await status({ ...repo, filepath: 'a.txt' })
    const b = await status({ ...repo, filepath: 'b.txt' })
    const c = await status({ ...repo, filepath: 'c.txt' })
    const d = await status({ ...repo, filepath: 'd.txt' })
    const e = await status({ ...repo, filepath: 'e.txt' })
    expect(a).toEqual('unmodified')
    expect(b).toEqual('*modified')
    expect(c).toEqual('*deleted')
    expect(d).toEqual('*added')
    expect(e).toBe('absent')

    await add({ ...repo, filepath: 'a.txt' })
    await add({ ...repo, filepath: 'b.txt' })
    await remove({ ...repo, filepath: 'c.txt' })
    await add({ ...repo, filepath: 'd.txt' })
    const a2 = await status({ ...repo, filepath: 'a.txt' })
    const b2 = await status({ ...repo, filepath: 'b.txt' })
    const c2 = await status({ ...repo, filepath: 'c.txt' })
    const d2 = await status({ ...repo, filepath: 'd.txt' })
    expect(a2).toEqual('unmodified')
    expect(b2).toEqual('modified')
    expect(c2).toEqual('deleted')
    expect(d2).toEqual('added')

    // And finally the weirdo cases
    let acontent = await fs.read(path.join(dir, 'a.txt'))
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await add({ ...repo, filepath: 'a.txt' })
    await fs.write(path.join(dir, 'a.txt'), acontent)
    let a3 = await status({ ...repo, filepath: 'a.txt' })
    expect(a3).toEqual('*unmodified')

    await remove({ ...repo, filepath: 'a.txt' })
    let a4 = await status({ ...repo, filepath: 'a.txt' })
    expect(a4).toEqual('*undeleted')

    await fs.write(path.join(dir, 'e.txt'), 'Hi')
    await add({ ...repo, filepath: 'e.txt' })
    await fs.rm(path.join(dir, 'e.txt'))
    let e3 = await status({ ...repo, filepath: 'e.txt' })
    expect(e3).toEqual('*absent')

    // Yay .gitignore!
    let f = await status({ ...repo, filepath: 'f.txt' })
    let g = await status({ ...repo, filepath: 'g/g.txt' })
    let h = await status({ ...repo, filepath: 'h/h.txt' })
    let i = await status({ ...repo, filepath: 'i/i.txt' })
    expect(f).toEqual('ignored')
    expect(g).toEqual('ignored')
    expect(h).toEqual('ignored')
    expect(i).toEqual('*added')
  })
})
