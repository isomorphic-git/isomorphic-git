/* eslint-env node, browser, jasmine */
import * as path from 'path'

import { statusMatrix } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// Git worktrees use a .git *file* (not a directory) containing an
// absolute gitdir: pointer. discoverGitdir must return these paths
// as-is rather than joining them with the .git file's parent directory.

describe('worktree', () => {
  it('statusMatrix works when .git is a file with an absolute gitdir path', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix')

    // Simulate worktree: write a .git file with absolute gitdir pointer
    const dotgitFile = path.join(dir, '.git')
    await fs.write(dotgitFile, `gitdir: ${gitdir}\n`)

    // Without explicit gitdir, discoverGitdir must follow the .git file
    const worktreeMatrix = await statusMatrix({ fs, dir })
    expect(worktreeMatrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
    ])
  })
})
