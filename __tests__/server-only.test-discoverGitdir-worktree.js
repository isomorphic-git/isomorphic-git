/* eslint-env node, browser, jasmine */

import * as _fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { FileSystem, discoverGitdir } from 'isomorphic-git/internal-apis'

describe('discoverGitdir', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await _fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'jest-discoverGitdir-')
    )
  })

  afterEach(async () => {
    await _fs.promises.rm(tmpDir, { recursive: true, force: true })
  })

  it('returns dotgit as-is when it is a directory', async () => {
    const fsp = new FileSystem(_fs)
    const dotgit = path.join(tmpDir, '.git')
    await _fs.promises.mkdir(dotgit)

    const result = await discoverGitdir({ fsp, dotgit })
    expect(result).toEqual(dotgit)
  })

  it('resolves relative gitdir path (submodule style)', async () => {
    const fsp = new FileSystem(_fs)
    const submoduleDir = path.join(tmpDir, 'mysubmodule')
    await _fs.promises.mkdir(submoduleDir)
    const dotgit = path.join(submoduleDir, '.git')
    await _fs.promises.writeFile(
      dotgit,
      'gitdir: ../.git/modules/mysubmodule\n'
    )

    const result = await discoverGitdir({ fsp, dotgit })
    expect(result).toContain('.git/modules/mysubmodule')
  })

  it('returns absolute gitdir path directly (worktree style)', async () => {
    const fsp = new FileSystem(_fs)
    const worktreeDir = path.join(tmpDir, 'my-worktree')
    await _fs.promises.mkdir(worktreeDir)
    const dotgit = path.join(worktreeDir, '.git')

    const mainGitdir = path.join(
      tmpDir,
      'main-repo',
      '.git',
      'worktrees',
      'my-worktree'
    )
    await _fs.promises.mkdir(mainGitdir, { recursive: true })
    await _fs.promises.writeFile(dotgit, `gitdir: ${mainGitdir}\n`)

    const result = await discoverGitdir({ fsp, dotgit })
    expect(result).toEqual(mainGitdir)
  })

  it('does not corrupt absolute paths by joining with dirname', async () => {
    const fsp = new FileSystem(_fs)
    const worktreeDir = path.join(tmpDir, 'worktree-checkout')
    await _fs.promises.mkdir(worktreeDir)
    const dotgit = path.join(worktreeDir, '.git')

    const absoluteGitdir = '/some/absolute/path/.git/worktrees/my-branch'
    await _fs.promises.writeFile(dotgit, `gitdir: ${absoluteGitdir}\n`)

    const result = await discoverGitdir({ fsp, dotgit })
    expect(result).toEqual(absoluteGitdir)
    expect(result).not.toContain(worktreeDir)
  })
})
