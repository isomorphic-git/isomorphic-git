import test from 'ava'
import resolveRef from '../lib/utils/resolveRef'

test('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async t => {
  let ref = await resolveRef({gitdir: 'fixtures/esgit.git', ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'})
  t.snapshot(ref)
})
test('test-branch', async t => {
  let ref = await resolveRef({gitdir: 'fixtures/esgit.git', ref: 'origin/test-branch'})
  t.snapshot(ref)
})
test('test-tag', async t => {
  let ref = await resolveRef({gitdir: 'fixtures/esgit.git', ref: 'test-tag'})
  t.snapshot(ref)
})
test('test-HEAD', async t => {
  let ref = await resolveRef({gitdir: 'fixtures/esgit.git', ref: 'HEAD'})
  t.snapshot(ref)
})
