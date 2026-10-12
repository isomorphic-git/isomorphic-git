/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// The executable bit on disk. (node-only, and not on Windows, which has no
// executable bit.)
const itExec = process.platform === 'win32' ? it.skip : it

describe('merge executable bit', () => {
  const author = {
    name: 't',
    email: 't@t',
    timestamp: 1000,
    timezoneOffset: 0,
  }
  const isExecutable = async path =>
    ((await fsp.lstat(path)).mode & 0o111) !== 0

  itExec('a clean cherry-pick writes the executable bit', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-cherry-exec-bit')
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'mode.sh'), 'run\n')
    await git.add({ fs, dir, gitdir, filepath: '.' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    await git.branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
    await fs.rm(join(dir, 'mode.sh'))
    await fs.write(join(dir, 'mode.sh'), 'run\n', { mode: 0o777 })
    await fs.write(join(dir, 'new.sh'), 'new\n', { mode: 0o777 })
    await git.add({ fs, dir, gitdir, filepath: '.' })
    const oid = await git.commit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })
    await git.checkout({ fs, dir, gitdir, ref: 'master' })
    expect(await isExecutable(join(dir, 'mode.sh'))).toBe(false)

    await git.cherryPick({ fs, dir, gitdir, oid, committer: author })

    expect(await isExecutable(join(dir, 'mode.sh'))).toBe(true)
    expect(await isExecutable(join(dir, 'new.sh'))).toBe(true)
  })
})
