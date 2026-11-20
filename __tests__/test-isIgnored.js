/* eslint-env node, browser, jasmine */
import { isIgnored, setConfig } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// NOTE: we cannot actually commit a real .gitignore file in fixtures or fixtures won't be included in this repo
const writeGitIgnore = async (fs, dir, patterns) =>
  fs.write(dir + '/.gitignore', patterns.join('\n'))

const writeExclude = async (fs, gitdir, patterns) =>
  fs.write(gitdir + '/info/exclude', patterns.join('\n'))

describe('isIgnored', () => {
  it('should check .gitignore', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeGitIgnore(fs, dir, ['a.txt', 'c/*', '!c/d.txt', 'd/'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'a.txt' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'b.txt' })).toBe(false)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/d.txt' })).toBe(
      false
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/e.txt' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'd/' })).toBe(true)
  })
  it('should check .gitignore in sub directory', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeGitIgnore(fs, dir, ['a.txt'])
    await writeGitIgnore(fs, dir + '/c', ['d.txt'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'a.txt' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'b.txt' })).toBe(false)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/d.txt' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/e.txt' })).toBe(
      false
    )
  })
  it('should check .git/info/exclude', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeExclude(fs, gitdir, ['*.tmp', 'cache/'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'a.tmp' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/f/a.tmp' })).toBe(
      true
    )
    expect(
      await isIgnored({ fs, gitdir, dir, filepath: 'c/cache/a.txt' })
    ).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'a.txt' })).toBe(false)
  })
  it('should anchor .git/info/exclude patterns to the working directory', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeExclude(fs, gitdir, ['/build', '/docs/gen.txt', 'lib/keep/'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'build' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'build/a.js' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'src/build' })).toBe(
      false
    )
    expect(
      await isIgnored({ fs, gitdir, dir, filepath: 'src/build/a.js' })
    ).toBe(false)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'docs/gen.txt' })).toBe(
      true
    )
    expect(
      await isIgnored({ fs, gitdir, dir, filepath: 'src/docs/gen.txt' })
    ).toBe(false)
    expect(
      await isIgnored({ fs, gitdir, dir, filepath: 'lib/keep/a.txt' })
    ).toBe(true)
    expect(
      await isIgnored({ fs, gitdir, dir, filepath: 'src/lib/keep/a.txt' })
    ).toBe(false)
  })
  it('should let .gitignore files re-include what .git/info/exclude ignores', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeExclude(fs, gitdir, ['*.log'])
    await writeGitIgnore(fs, dir, ['!b/keep.log'])
    await writeGitIgnore(fs, dir + '/c', ['!keep.log'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'a.log' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'b/other.log' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'b/keep.log' })).toBe(
      false
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/other.log' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/keep.log' })).toBe(
      false
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'c/f/keep.log' })).toBe(
      false
    )
  })
  it('should respect core.ignorecase=false', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await setConfig({ fs, gitdir, path: 'core.ignorecase', value: false })
    await writeGitIgnore(fs, dir, ['README.md'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'README.md' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'readme.md' })).toBe(
      false
    )
  })
  it('should match case-insensitively when core.ignorecase is true', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await setConfig({ fs, gitdir, path: 'core.ignorecase', value: true })
    await writeGitIgnore(fs, dir, ['README.md'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'README.md' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'readme.md' })).toBe(
      true
    )
  })
  it('should treat [!a] as a negated character class', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeGitIgnore(fs, dir, ['[!a]*'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'abc' })).toBe(false)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'xyz' })).toBe(true)
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'bcd' })).toBe(true)
  })
  it('should respect core.ignorecase = 0', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await setConfig({ fs, gitdir, path: 'core.ignorecase', value: '0' })
    await writeGitIgnore(fs, dir, ['README.md'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'README.md' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'readme.md' })).toBe(
      false
    )
  })
  it('should respect core.ignorecase = 1', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await setConfig({ fs, gitdir, path: 'core.ignorecase', value: '1' })
    await writeGitIgnore(fs, dir, ['README.md'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'README.md' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'readme.md' })).toBe(
      true
    )
  })
  it('should respect core.ignoreCase = false (mixed-case key)', async () => {
    // Setup — canonical git preserves the case the user typed, so the key
    // can be written `ignoreCase`; it must still decode to boolean false.
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await setConfig({ fs, gitdir, path: 'core.ignoreCase', value: false })
    await writeGitIgnore(fs, dir, ['README.md'])
    // Test
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'README.md' })).toBe(
      true
    )
    expect(await isIgnored({ fs, gitdir, dir, filepath: 'readme.md' })).toBe(
      false
    )
  })
  it('should read core.ignorecase from the shared config in a linked worktree', async () => {
    // Setup — build a linked-worktree layout by hand, as canonical
    // `git worktree add` writes it: the worktree `.git` file points at the
    // private gitdir, whose `commondir` file names the shared config
    // directory (relative to the private gitdir).
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await setConfig({ fs, gitdir, path: 'core.ignorecase', value: false })
    const worktreeDir = dir + '/wt'
    const privateGitdir = gitdir + '/worktrees/topic'
    await fs.write(worktreeDir + '/.git', `gitdir: ${privateGitdir}\n`)
    await fs.write(privateGitdir + '/commondir', '../..\n')
    await fs.write(privateGitdir + '/gitdir', worktreeDir + '/.git\n')
    await writeGitIgnore(fs, worktreeDir, ['README.md'])
    // Test
    expect(
      await isIgnored({
        fs,
        dir: worktreeDir,
        gitdir: worktreeDir + '/.git',
        filepath: 'README.md',
      })
    ).toBe(true)
    expect(
      await isIgnored({
        fs,
        dir: worktreeDir,
        gitdir: worktreeDir + '/.git',
        filepath: 'readme.md',
      })
    ).toBe(false)
  })
  it('should read .git/info/exclude from the shared config directory in a linked worktree', async () => {
    // Setup — same linked-worktree layout; canonical git reads
    // info/exclude from the common directory, not the private gitdir.
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    const worktreeDir = dir + '/wt'
    const privateGitdir = gitdir + '/worktrees/topic'
    await fs.write(worktreeDir + '/.git', `gitdir: ${privateGitdir}\n`)
    await fs.write(privateGitdir + '/commondir', '../..\n')
    await fs.write(privateGitdir + '/gitdir', worktreeDir + '/.git\n')
    await writeExclude(fs, gitdir, ['*.tmp'])
    // Test
    expect(
      await isIgnored({
        fs,
        dir: worktreeDir,
        gitdir: worktreeDir + '/.git',
        filepath: 'a.tmp',
      })
    ).toBe(true)
    expect(
      await isIgnored({
        fs,
        dir: worktreeDir,
        gitdir: worktreeDir + '/.git',
        filepath: 'a.txt',
      })
    ).toBe(false)
  })
  it('should keep a trailing space in the commondir path', async () => {
    // Setup — a common directory whose name ends in a space: canonical
    // git strips only trailing CR/LF from the commondir file, so the
    // space is part of the path and the shared info/exclude must be read
    // from it.
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    const worktreeDir = dir + '/wt'
    const privateGitdir = gitdir + '/worktrees/topic'
    const sharedDir = gitdir + '/common '
    await fs.write(worktreeDir + '/.git', `gitdir: ${privateGitdir}\n`)
    await fs.write(privateGitdir + '/commondir', `${sharedDir}\n`)
    await fs.write(privateGitdir + '/gitdir', worktreeDir + '/.git\n')
    await writeExclude(fs, sharedDir, ['*.tmp'])
    // Test
    expect(
      await isIgnored({
        fs,
        dir: worktreeDir,
        gitdir: worktreeDir + '/.git',
        filepath: 'a.tmp',
      })
    ).toBe(true)
    expect(
      await isIgnored({
        fs,
        dir: worktreeDir,
        gitdir: worktreeDir + '/.git',
        filepath: 'a.txt',
      })
    ).toBe(false)
  })
  it('should not throw when .git/info/exclude disappears after the existence check', async () => {
    // Setup — simulate info/exclude vanishing between `exists` and `read`:
    // the existence check succeeds but the read comes back empty.
    const { fs, gitdir, dir } = await makeFixture('test-isIgnored')
    await writeGitIgnore(fs, dir, ['a.txt'])
    const flakyFs = new Proxy(fs, {
      get(target, prop) {
        if (prop === 'exists') {
          return async filepath =>
            filepath.endsWith('info/exclude') ? true : target.exists(filepath)
        }
        if (prop === 'read') {
          return async (filepath, options) =>
            filepath.endsWith('info/exclude')
              ? null
              : target.read(filepath, options)
        }
        const value = target[prop]
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    // Test — the .gitignore rules must still be evaluated.
    expect(
      await isIgnored({ fs: flakyFs, gitdir, dir, filepath: 'a.txt' })
    ).toBe(true)
    expect(
      await isIgnored({ fs: flakyFs, gitdir, dir, filepath: 'b.txt' })
    ).toBe(false)
  })
})
