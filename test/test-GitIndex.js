import test from 'ava'
import GitIndex from '../lib/models/GitIndex'
import read from '../lib/utils/read'

test('GitIndex.from(buffer) - Simple', async t => {
  let buffer = await read('test/fixtures/simple-index')
  let index = GitIndex.from(buffer)
  let rendering = index.render()
  t.snapshot(rendering)
  let buffer2 = index.toObject()
  t.deepEqual(buffer.slice(0, buffer2.length), buffer2)
})

test('GitIndex.from(buffer)', async t => {
  let buffer = await read('test/fixtures/index')
  let index = GitIndex.from(buffer)
  let rendering = index.render()
  t.snapshot(rendering)
  let buffer2 = index.toObject()
  t.deepEqual(buffer.slice(0, buffer2.length), buffer2)
})
