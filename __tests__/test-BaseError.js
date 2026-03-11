/* eslint-env node, browser, jasmine */

// Importing directly from src/ so that tsc --checkJs catches type errors
// in BaseError.js (e.g. undeclared properties used in toJSON/fromJSON).
import { BaseError } from '../src/errors/BaseError.js'

describe('BaseError', () => {
  it('toJSON includes code and data', () => {
    const e = new BaseError('test')
    e.code = 'TestError'
    e.data = { foo: 1 }
    const json = e.toJSON()
    expect(json.code).toBe('TestError')
    expect(json.data).toEqual({ foo: 1 })
    expect(json.caller).toBe('')
    expect(json.message).toBe('test')
  })

  it('fromJSON round-trips', () => {
    const original = new BaseError('test')
    original.code = 'TestError'
    original.data = { foo: 1 }
    original.caller = 'myCaller'
    const restored = original.fromJSON(original.toJSON())
    expect(restored.code).toBe('TestError')
    expect(restored.data).toEqual({ foo: 1 })
    expect(restored.caller).toBe('myCaller')
    expect(restored.message).toBe('test')
  })
})
