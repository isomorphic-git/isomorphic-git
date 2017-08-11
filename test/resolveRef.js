import test from 'ava'
import fs from 'fs'
import del from 'delete'
let exists = fs.existsSync
import resolveRef from '../lib/utils/resolveRef'

test('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async t => {
  let ref = await resolveRef({dir: '.', ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'})
  t.snapshot(ref)
})
test('master', async t => {
  let ref = await resolveRef({dir: '.', ref: 'master'})
  t.snapshot(ref)
})
test('origin/master', async t => {
  let ref = await resolveRef({dir: '.', ref: 'origin/master'})
  t.snapshot(ref)
})