/* globals describe it expect */
const { FixtureFS } = require('./__helpers__/FixtureFS.js')

const { models } = process.browser
  ? require('../dist/internal.umd.min.js')
  : require('../dist/for-node/internal-apis')
const { GitPktLine } = models

describe('pkt-line-encoder', () => {
  it('pkt-line encode string', async () => {
    let foo = GitPktLine.encode('hello world\n')
    expect(foo).toBeTruthy()
    expect(Buffer.compare(foo, Buffer.from('0010hello world\n')) === 0).toBe(
      true
    )
  })

  it('pkt-line encode empty', async () => {
    let foo = GitPktLine.encode('')
    expect(foo).toBeTruthy()
    expect(Buffer.compare(foo, Buffer.from('0004')) === 0).toBe(true)
  })

  it('pkt-line flush', async () => {
    let foo = GitPktLine.flush()
    expect(foo).toBeTruthy()
    expect(Buffer.compare(foo, Buffer.from('0000')) === 0).toBe(true)
  })
})
