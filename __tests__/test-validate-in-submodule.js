/* eslint-env node, browser, jasmine */
const path = require('path')

const { Errors, status, add } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('invalid .git/index', () => {
  ;(process.browser ? xit : it)('empty file', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-empty'
    )
    const file = 'a.txt'

    await fs.write(path.join(dir, file), 'Hi', 'utf8')
    await add({ fs, dir, filepath: file })
    await fs.write(path.join(gitdirsmfullpath, 'index'), '', 'utf8')

    // Test
    let error = null
    try {
      await status({ fs, dir, filepath: file })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InternalError).toBe(true)
    expect(error.data.message).toEqual('Index file is empty (.git/index)')
  })
  ;(process.browser ? xit : it)('no magic number', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-empty'
    )
    const file = 'a.txt'

    await fs.write(path.join(dir, file), 'Hi', 'utf8')
    await add({ fs, dir, filepath: file })
    await fs.write(
      path.join(gitdirsmfullpath, 'index'),
      'no-magic-number',
      'utf8'
    )

    // Test
    let error = null
    try {
      await status({ fs, dir, filepath: file })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InternalError).toBe(true)
    expect(error.data.message).toContain('Invalid dircache magic file number')
  })
  ;(process.browser ? xit : it)('wrong checksum', async () => {
    // Setup
    const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-empty'
    )
    const file = 'a.txt'

    await fs.write(path.join(dir, file), 'Hi', 'utf8')
    await add({ fs, dir, filepath: file })
    await fs.write(path.join(gitdirsmfullpath, 'index'), 'DIRCxxxxx', 'utf8')

    // Test
    let error = null
    try {
      await status({ fs, dir, filepath: file })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InternalError).toBe(true)
    expect(error.data.message).toContain(
      'Invalid checksum in GitIndex buffer: expected 444952437878787878 but saw da39a3ee5e6b4b0d3255bfef95601890afd80709'
    )
  })
})
