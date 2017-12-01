/* global test describe expect */
import fs from 'fs'
import path from 'path'
import { read, write, rm } from '../dist/for-node/utils'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { createClass } from '../dist/for-node/utils'
import { status, add, remove } from '../dist/for-node/commands'

const Git = createClass({ status, add, remove })

describe('status', () => {
  test('status', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-status.git')
    let workdir = await copyFixtureIntoTempDir(__dirname, 'test-status')
    const repo = new Git({ fs, gitdir, workdir })
    const a = await repo.status({ filepath: 'a.txt' })
    const b = await repo.status({ filepath: 'b.txt' })
    const c = await repo.status({ filepath: 'c.txt' })
    const d = await repo.status({ filepath: 'd.txt' })
    const e = await repo.status({ filepath: 'e.txt' })
    expect(a).toEqual('unmodified')
    expect(b).toEqual('*modified')
    expect(c).toEqual('*deleted')
    expect(d).toEqual('*added')
    expect(e).toBe('absent')

    await repo.add({ filepath: 'a.txt' })
    await repo.add({ filepath: 'b.txt' })
    await repo.remove({ filepath: 'c.txt' })
    await repo.add({ filepath: 'd.txt' })
    const a2 = await repo.status({ filepath: 'a.txt' })
    const b2 = await repo.status({ filepath: 'b.txt' })
    const c2 = await repo.status({ filepath: 'c.txt' })
    const d2 = await repo.status({ filepath: 'd.txt' })
    expect(a2).toEqual('unmodified')
    expect(b2).toEqual('modified')
    expect(c2).toEqual('deleted')
    expect(d2).toEqual('added')

    // And finally the weirdo cases
    let acontent = await read(path.join(workdir, 'a.txt'))
    await write(path.join(workdir, 'a.txt'), 'Hi')
    await repo.add({ filepath: 'a.txt' })
    await write(path.join(workdir, 'a.txt'), acontent)
    let a3 = await repo.status({ filepath: 'a.txt' })
    expect(a3).toEqual('*unmodified')

    await repo.remove({ filepath: 'a.txt' })
    let a4 = await repo.status({ filepath: 'a.txt' })
    expect(a4).toEqual('*undeleted')

    await write(path.join(workdir, 'e.txt'), 'Hi')
    await repo.add({ filepath: 'e.txt' })
    await rm(path.join(workdir, 'e.txt'))
    let e3 = await repo.status({ filepath: 'e.txt' })
    expect(e3).toEqual('*absent')

    // Yay .gitignore!
    let f = await repo.status({ filepath: 'f.txt' })
    let g = await repo.status({ filepath: 'g/g.txt' })
    let h = await repo.status({ filepath: 'h/h.txt' })
    let i = await repo.status({ filepath: 'i/i.txt' })
    expect(f).toEqual('ignored')
    expect(g).toEqual('ignored')
    expect(h).toEqual('ignored')
    expect(i).toEqual('*added')
  })
})
