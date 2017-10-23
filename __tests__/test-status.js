/* global test describe expect */
import git from '..'
import path from 'path'
import { read, write, rm } from '../dist/for-node/utils'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

describe('status', () => {
  test('status', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-status.git')
    let workdir = await copyFixtureIntoTempDir(__dirname, 'test-status')
    const repo = git()
      .gitdir(gitdir)
      .workdir(workdir)
    const a = await repo.status('a.txt')
    const b = await repo.status('b.txt')
    const c = await repo.status('c.txt')
    const d = await repo.status('d.txt')
    const e = await repo.status('e.txt')
    expect(a).toEqual('unmodified')
    expect(b).toEqual('*modified')
    expect(c).toEqual('*deleted')
    expect(d).toEqual('*added')
    expect(e).toBe('absent')

    await repo.add('a.txt')
    await repo.add('b.txt')
    await repo.remove('c.txt')
    await repo.add('d.txt')
    const a2 = await repo.status('a.txt')
    const b2 = await repo.status('b.txt')
    const c2 = await repo.status('c.txt')
    const d2 = await repo.status('d.txt')
    expect(a2).toEqual('unmodified')
    expect(b2).toEqual('modified')
    expect(c2).toEqual('deleted')
    expect(d2).toEqual('added')

    // And finally the weirdo cases
    let acontent = await read(path.join(workdir, 'a.txt'))
    await write(path.join(workdir, 'a.txt'), 'Hi')
    await repo.add('a.txt')
    await write(path.join(workdir, 'a.txt'), acontent)
    let a3 = await repo.status('a.txt')
    expect(a3).toEqual('*unmodified')

    await write(path.join(workdir, 'e.txt'), 'Hi')
    await repo.add('e.txt')
    await rm(path.join(workdir, 'e.txt'))
    let e3 = await repo.status('e.txt')
    expect(e3).toEqual('*absent')

    // Yay .gitignore!
    let f = await repo.status('f.txt')
    let g = await repo.status('g/g.txt')
    let h = await repo.status('h/h.txt')
    let i = await repo.status('i/i.txt')
    expect(f).toEqual('ignored')
    expect(g).toEqual('ignored')
    expect(h).toEqual('ignored')
    expect(i).toEqual('*added')
  })
})
