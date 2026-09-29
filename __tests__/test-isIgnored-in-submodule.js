/* eslint-env node, browser, jasmine */
import { isIgnored } from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

// NOTE: we cannot actually commit a real .gitignore file in fixtures or fixtures won't be included in this repo
const writeGitIgnore = async (fs, dir, patterns) =>
  fs.write(dir + '/.gitignore', patterns.join('\n'))

const writeExclude = async (fs, gitdir, patterns) =>
  fs.write(gitdir + '/info/exclude', patterns.join('\n'))

describe('isIgnored', () => {
  it('should check .gitignore', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixtureAsSubmodule('test-isIgnored')
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
    const { fs, gitdir, dir } = await makeFixtureAsSubmodule('test-isIgnored')
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
    const { fs, gitdir, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-isIgnored')
    await writeExclude(fs, gitdirsmfullpath, ['*.tmp', 'cache/'])
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
    const { fs, gitdir, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-isIgnored')
    await writeExclude(fs, gitdirsmfullpath, [
      '/build',
      '/docs/gen.txt',
      'lib/keep/',
    ])
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
    const { fs, gitdir, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-isIgnored')
    await writeExclude(fs, gitdirsmfullpath, ['*.log'])
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
})
