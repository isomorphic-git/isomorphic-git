import test from 'ava'
import GitIndex from '../lib/models/GitIndex'
import read from '../lib/utils/read'

test('GitIndex', async t => {
  let buffer = await read('test/fixtures/index')
  let index = GitIndex.from(buffer)
  let rendering = index.render()
  console.log(rendering)
  t.snapshot(rendering)
  let buffer2 = index.toObject()
  t.deepEqual(buffer.slice(0, buffer2.length), buffer2)
})