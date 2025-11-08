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
})
