/* eslint-env node, browser, jasmine */
const { isIgnored } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// NOTE: we cannot actually commit a real .gitignore file in fixtures or fixtures won't be included in this repo
const writeGitIgnore = async (fs, dir, patterns) =>
  fs.write(dir + '/.gitignore', patterns.join('\n'))

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
})
