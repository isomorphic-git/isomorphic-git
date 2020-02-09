/* eslint-env node, browser, jasmine */
// @ts-ignore
const snapshots = require('./__snapshots__/test-GitError.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { E } = require('isomorphic-git')
const { GitError } = require('isomorphic-git/internal-apis')

describe('GitError', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('creates an Error', async () => {
    let e = null
    try {
      throw new GitError(E.FileReadError, { filepath: 'foobar.txt' })
    } catch (err) {
      e = err
    }
    expect(e).not.toBeNull()
    expect(e.code).toBe(E.FileReadError)
    expect(e instanceof Error).toBe(true)
    expect(e instanceof GitError).toBe(true)
    expect(new Error() instanceof Error).toBe(true)
    expect(new Error() instanceof GitError).toBe(false)
    expect(e.toJSON()).toMatchSnapshot()
  })
})
