/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// A symlink cannot be rewritten in place, so checkout has to replace one whose
// target changed, like git does. (node-only: needs real symlinks.)
describe('checkout symlink', () => {
  for (const nonBlocking of [false, true]) {
    it(`replaces a symlink whose target changed${
      nonBlocking ? ' (nonBlocking)' : ''
    }`, async () => {
      const { fs, dir, gitdir } = await makeFixture('test-checkout-symlink')
      const author = {
        name: 't',
        email: 't@t',
        timestamp: 1000,
        timezoneOffset: 0,
      }
      await git.init({ fs, dir, gitdir })
      await fs.write(join(dir, 'a.txt'), 'a\n')
      await fs.write(join(dir, 'b.txt'), 'b\n')
      await fsp.symlink('a.txt', join(dir, 'link'))
      await git.add({ fs, dir, gitdir, filepath: '.' })
      await git.commit({ fs, dir, gitdir, message: 'base', author })
      await git.branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fsp.unlink(join(dir, 'link'))
      await fsp.symlink('b.txt', join(dir, 'link'))
      await git.add({ fs, dir, gitdir, filepath: 'link' })
      await git.commit({ fs, dir, gitdir, message: 'feature', author })

      await git.checkout({ fs, dir, gitdir, ref: 'master', nonBlocking })

      expect(await fsp.readlink(join(dir, 'link'))).toBe('a.txt')
      expect(await fs.read(join(dir, 'b.txt'), 'utf8')).toBe('b\n')
      const matrix = await git.statusMatrix({ fs, dir, gitdir })
      expect(matrix.every(row => row.slice(1).join() === '1,1,1')).toBe(true)
    })
  }
  // Since 2.32, git does not read a .gitignore that is a symbolic link, so
  // the file it would ignore is not ignored and blocks the checkout.
  for (const gitignore of ['.gitignore', 'sub/.gitignore']) {
    it(`keeps a file ignored only by a symlinked ${gitignore}`, async () => {
      const { fs, dir, gitdir } = await makeFixture('test-checkout-symlink')
      const author = {
        name: 't',
        email: 't@t',
        timestamp: 1000,
        timezoneOffset: 0,
      }
      await git.init({ fs, dir, gitdir })
      await fs.write(join(dir, 'rules'), '*.lock\n')
      await fs.mkdir(join(dir, 'sub'))
      await fsp.symlink(
        gitignore === '.gitignore' ? 'rules' : '../rules',
        join(dir, gitignore)
      )
      await git.add({ fs, dir, gitdir, filepath: '.' })
      await git.commit({ fs, dir, gitdir, message: 'base', author })
      await git.branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(join(dir, 'sub/a.lock'), 'theirs\n')
      await git.add({ fs, dir, gitdir, filepath: 'sub/a.lock', force: true })
      await git.commit({ fs, dir, gitdir, message: 'feature', author })
      await git.checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(join(dir, 'sub/a.lock'), 'mine\n')

      let error = null
      try {
        await git.checkout({ fs, dir, gitdir, ref: 'feature' })
      } catch (e) {
        error = e
      }
      expect(error && error.code).toBe(git.Errors.CheckoutConflictError.code)
      expect(await fs.read(join(dir, 'sub/a.lock'), 'utf8')).toBe('mine\n')
    })
  }
})
