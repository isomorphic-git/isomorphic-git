/* eslint-env node, browser, jasmine */

const { E } = require('isomorphic-git')
const { GitError, errors } = require('isomorphic-git/internal-apis')

describe('GitError', () => {
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
    expect(e.toJSON()).toMatchInlineSnapshot(`
      Object {
        "caller": undefined,
        "code": "FileReadError",
        "data": Object {
          "filepath": "foobar.txt",
        },
        "message": "Could not read file \\"foobar.txt\\".",
      }
    `)
  })
  it('create a FileReadError', async () => {
    let e = null
    try {
      throw new errors.FileReadError('foobar.txt')
    } catch (err) {
      e = err
    }
    expect(e).not.toBeNull()
    expect(e.code).toBe('FileReadError')
    expect(e instanceof Error).toBe(true)
    e = e.toJSON()
    delete e.stack
    expect(e).toMatchInlineSnapshot(`
      Object {
        "caller": "",
        "code": "FileReadError",
        "data": Object {
          "filepath": "foobar.txt",
        },
        "message": "Could not read file \\"foobar.txt\\".",
      }
    `)
  })
})
