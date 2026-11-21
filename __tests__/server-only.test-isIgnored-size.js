/* eslint-env node, jasmine */
import { GitIgnoreManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

// git skips a rule file of 100 MiB (104857600 bytes) or more. (node-only: the
// test builds 100 MB strings.)
describe('isIgnored strict mode and rule file size', () => {
  it('answers false for a rule file git skips because of its size', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-isIgnored')
    await fs.write(`${dir}/.gitignore`, '*.lock\n')
    await fs.write(`${gitdir}/info/exclude`, '*.lock\n')
    // Replace what a rule file reads as, without writing 100 MB to disk.
    const readFile = fs._readFile
    let replace = {}
    fs._readFile = async (filepath, options) =>
      filepath in replace ? replace[filepath] : readFile(filepath, options)
    const strictlyIgnored = () =>
      GitIgnoreManager.isIgnored({
        fs,
        dir,
        gitdir,
        filepath: 'a.lock',
        strict: true,
      })
    const limit = 100 * 1024 * 1024
    const rules = bytes => '#'.repeat(bytes - 8) + '\n*.lock\n'
    // Test
    expect(await strictlyIgnored()).toBe(true)
    for (const file of [`${dir}/.gitignore`, `${gitdir}/info/exclude`]) {
      replace = { [file]: rules(limit - 1) }
      expect(await strictlyIgnored()).toBe(true)
      replace = { [file]: rules(limit) }
      expect(await strictlyIgnored()).toBe(false)
      // the limit is in bytes: 'é' is one UTF-16 unit but two UTF-8 bytes
      replace = { [file]: '#é' + rules(limit - 3) }
      expect(await strictlyIgnored()).toBe(false)
    }
  })
})
