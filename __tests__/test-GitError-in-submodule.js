/* eslint-env node, browser, jasmine */

import { Errors } from 'isomorphic-git'

describe('Errors', () => {
  it('have the correct value for their static property code', async () => {
    for (const [name, Value] of Object.entries(Errors)) {
      // @ts-ignore
      expect(name).toBe(Value.code)
    }
  })
  it('create a NotFoundError', async () => {
    let e = null
    try {
      throw new Errors.NotFoundError('foobar.txt')
    } catch (err) {
      e = err
    }
    expect(e).not.toBeNull()
    expect(e.code).toBe('NotFoundError')
    expect(e instanceof Error).toBe(true)
    expect(e instanceof Errors.NotFoundError).toBe(true)
    e = e.toJSON()
    delete e.stack
    expect(e).toMatchInlineSnapshot(`
      {
        "caller": "",
        "code": "NotFoundError",
        "data": {
          "what": "foobar.txt",
        },
        "message": "Could not find foobar.txt.",
      }
    `)
  })
  it('serializes a DecompressionError without library-bug guidance', async () => {
    const error = new Errors.DecompressionError('buffer error')
    error.caller = 'git.readTree'
    expect(error instanceof Errors.DecompressionError).toBe(true)
    expect(error.isIsomorphicGitError).toBe(true)
    expect(error.code).toBe('DecompressionError')
    expect(error.message).toBe('Invalid compressed buffer: buffer error')
    expect(error.message).not.toMatch(/internal error|file an issue/)
    const json = JSON.parse(JSON.stringify(error))
    expect(json.data).toEqual({ message: 'buffer error' })
    const restored = error.fromJSON(json)
    expect(restored.toJSON().code).toBe(error.code)
    expect(restored.toJSON().data).toEqual(error.data)
    expect(restored.caller).toBe(error.caller)
    expect(restored.message).toBe(error.message)
  })
  it('create an InternalError with actionable reporting guidance', async () => {
    const e = new Errors.InternalError('Something unexpected happened.')

    expect(e.message).toContain(
      "If you're using an application that depends on isomorphic-git"
    )
    expect(e.message).toContain(
      "If you're a developer and you believe this is a bug in isomorphic-git"
    )
    expect(e.message).toContain('Something unexpected happened.')
  })
})
