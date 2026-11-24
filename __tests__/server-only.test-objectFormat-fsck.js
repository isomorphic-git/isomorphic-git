/* eslint-env node, browser, jasmine */
import { execFileSync } from 'child_process'

import { Errors, add, commit, writeBlob, writeRef } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('object format', () => {
  it('leaves a SHA-256 repository that git fsck finds clean after refused writes', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-sha256')
    await fs.write(`${dir}/a.txt`, 'changed\n')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    // Test
    const attempts = [
      () => writeBlob({ fs, dir, gitdir, blob: new Uint8Array([1, 2, 3]) }),
      () =>
        writeRef({
          fs,
          dir,
          gitdir,
          ref: 'refs/heads/other',
          value: '0123456789abcdef0123456789abcdef01234567',
        }),
      () => add({ fs, dir, gitdir, filepath: 'a.txt' }),
      () => commit({ fs, dir, gitdir, message: 'nope', author }),
    ]
    for (const attempt of attempts) {
      await expect(attempt()).rejects.toMatchObject({
        code: Errors.UnsupportedObjectFormatError.code,
      })
    }
    const output = execFileSync(
      'git',
      ['--git-dir', gitdir, 'fsck', '--strict', '--no-dangling'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    )
    expect(output).toBe('')
  })
})
