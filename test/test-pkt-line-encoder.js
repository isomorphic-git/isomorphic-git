import test from 'ava'
import { GitPktLine } from '../dist/for-node/models'

test('pkt-line encode string', async t => {
  let foo = GitPktLine.encode('hello world\n')
  t.truthy(foo)
  t.true(Buffer.compare(foo, Buffer.from('0010hello world\n')) === 0)
})

test('pkt-line encode empty', async t => {
  let foo = GitPktLine.encode('')
  t.truthy(foo)
  t.true(Buffer.compare(foo, Buffer.from('0004')) === 0)
})

test('pkt-line flush', async t => {
  let foo = GitPktLine.flush()
  t.truthy(foo)
  t.true(Buffer.compare(foo, Buffer.from('0000')) === 0)
})
