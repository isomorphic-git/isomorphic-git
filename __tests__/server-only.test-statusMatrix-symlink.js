/* eslint-env node, jasmine */
import * as path from 'path'

import { statusMatrix } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('statusMatrix with symlink', () => {
  it('statusMatrix with symlink targeting ignored directory', async () => {
    const { fs, dir, gitdir, _fs } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignored-dir\n')
    await fs.mkdir(path.join(dir, 'ignored-dir'))
    await fs.write(path.join(dir, 'ignored-dir', 'file.txt'), 'secret')
    await _fs.promises.symlink('ignored-dir', path.join(dir, 'symlink-to-ignored'))

    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['.gitignore', 0, 2, 0],
      ['symlink-to-ignored', 0, 2, 0],
    ])
  })
})
