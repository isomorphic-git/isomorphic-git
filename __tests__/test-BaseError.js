/* eslint-env node, browser, jasmine */

import { Errors } from 'isomorphic-git'

describe('BaseError', () => {
  it('fromJSON round-trips code and data', () => {
    const e = new Errors.NotFoundError('test')
    const restored = e.fromJSON(e.toJSON())
    expect(restored.caller).toBe('')
    expect(restored.code).toBe('NotFoundError')
    expect(restored.data).toEqual({ what: 'test' })
  })
})
