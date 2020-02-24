/* eslint-env node, browser, jasmine */

const { Errors } = require('isomorphic-git')

describe('Errors', () => {
  it('have the correct value for their static property code', async () => {
    for (const [name, Value] of Object.entries(Errors)) {
      // @ts-ignore
      expect(name).toBe(Value.code)
    }
  })
  it('create a FileReadError', async () => {
    let e = null
    try {
      throw new Errors.FileReadError('foobar.txt')
    } catch (err) {
      e = err
    }
    expect(e).not.toBeNull()
    expect(e.code).toBe('FileReadError')
    expect(e instanceof Error).toBe(true)
    expect(e instanceof Errors.FileReadError).toBe(true)
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
