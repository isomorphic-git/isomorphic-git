/* eslint-disable */
/* eslint-env node, browser, jasmine */
const pify = require('pify')
const concat = require('simple-concat')

const { asyncIterableToStream } = require('isomorphic-git/internal-apis')

describe('asyncIterableToStream', () => {
  it('simple', async () => {

    let iterator = async function * () {
      yield '1'
      yield '2'
      yield '3'
      yield Buffer.from('4')
      return '5'
    }
    let iterable = iterator()
    let stream = asyncIterableToStream(iterable)
    let result = await pify(concat)(stream)
    expect(result).toEqual(Buffer.from('12345'))
  })
})
