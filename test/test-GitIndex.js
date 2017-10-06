import test from 'ava'
import { GitIndex } from '../dist/for-node/models'
import { read } from '../dist/for-node/utils'

test('GitIndex.from(buffer) - Simple', async t => {
  let buffer = await read('test/fixtures/test-GitIndex/simple-index')
  let index = GitIndex.from(buffer)
  let rendering = index.render()
  t.snapshot(rendering)
  let buffer2 = index.toObject()
  t.deepEqual(buffer.slice(0, buffer2.length - 20), buffer2.slice(0, -20))
})

test('GitIndex.from(buffer)', async t => {
  let buffer = await read('test/fixtures/test-GitIndex/index')
  let index = GitIndex.from(buffer)
  let rendering = index.render()
  t.snapshot(rendering)
  let buffer2 = index.toObject()
  t.deepEqual(buffer.slice(0, buffer2.length - 20), buffer2.slice(0, -20))
})

test('GitIndex round trip', async t => {
  let buffer = await read('test/fixtures/test-GitIndex/index')
  let index = GitIndex.from(buffer)
  let buffer2 = index.toObject()
  let index2 = GitIndex.from(buffer2)
  let buffer3 = index2.toObject()
  t.deepEqual(buffer2, buffer3)
})
