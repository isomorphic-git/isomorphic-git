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

  // conflict.txt conflicts; theirs also edits w.txt, which was chmod +x
  // locally. Like git, that mode change is a local change, unless
  // core.filemode is false.
  async function chmodRepo(name, filemode) {
    const { fs, dir, gitdir } = await makeFixture(name)
    await git.init({ fs, dir, gitdir })
    await git.setConfig({ fs, gitdir, path: 'core.filemode', value: filemode })
    await fs.write(join(dir, 'conflict.txt'), 'one\ntwo\nthree\n')
    await fs.write(join(dir, 'w.txt'), 'w\n')
    await git.add({ fs, dir, gitdir, filepath: '.' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    await git.branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
    await fs.write(join(dir, 'w.txt'), 'theirs\n')
    await git.add({ fs, dir, gitdir, filepath: 'w.txt' })
    const pick = await git.commit({ fs, dir, gitdir, message: 'w', author })
    await fs.write(join(dir, 'conflict.txt'), 'one\nfeature\nthree\n')
    await git.add({ fs, dir, gitdir, filepath: 'conflict.txt' })
    await git.commit({ fs, dir, gitdir, message: 'feature', author })
    await git.checkout({ fs, dir, gitdir, ref: 'master' })
    await fs.write(join(dir, 'conflict.txt'), 'one\nmaster\nthree\n')
    await git.add({ fs, dir, gitdir, filepath: 'conflict.txt' })
    await git.commit({ fs, dir, gitdir, message: 'master', author })
    await fsp.chmod(join(dir, 'w.txt'), 0o755)
    return { fs, dir, gitdir, pick }
  }

  itExec('merge refuses to overwrite a local mode change', async () => {
    for (const filemode of [true, false]) {
      const { fs, dir, gitdir } = await chmodRepo(
        `test-merge-exec-bit-local-${filemode}`,
        filemode
      )
      let error = null
      try {
        await git.merge({
          fs,
          dir,
          gitdir,
          theirs: 'feature',
          abortOnConflict: false,
          author,
        })
      } catch (e) {
        error = e
      }
      if (filemode) {
        expect(error.code).toBe(git.Errors.MergeLocalChangesError.code)
        expect(error.data.filepaths).toEqual(['w.txt'])
        expect(await fs.read(join(dir, 'w.txt'), 'utf8')).toBe('w\n')
      } else {
        expect(error.code).toBe(git.Errors.MergeConflictError.code)
      }
    }
  })

  itExec('cherryPick refuses to overwrite a local mode change', async () => {
    for (const filemode of [true, false]) {
      const { fs, dir, gitdir, pick } = await chmodRepo(
        `test-cherry-exec-bit-local-${filemode}`,
        filemode
      )
      let error = null
      try {
        await git.cherryPick({ fs, dir, gitdir, oid: pick, committer: author })
      } catch (e) {
        error = e
      }
      if (filemode) {
        expect(error.code).toBe(git.Errors.CherryPickLocalChangesError.code)
        expect(error.data.filepaths).toEqual(['w.txt'])
        expect(await fs.read(join(dir, 'w.txt'), 'utf8')).toBe('w\n')
      } else {
        expect(error).toBeNull()
      }
    }
  })
})
