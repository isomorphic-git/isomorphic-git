import test from 'ava'
import sh from 'shelljs'
import resolveRef from '../lib/utils/resolveRef'
import {exists, tmpdir, cleanup} from './_helpers'

var dir

test.before(async t => {
  dir = await tmpdir()
  sh.exec(`git clone https://github.com/wmhilton/esgit ${dir}`)
  sh.cd(dir)
  // TODO: Support reading from packfiles
  sh.mv('.git/objects/pack/pack-*.pack', '.')
  let output = sh.exec('cat pack-*.pack | git unpack-objects')
  console.log(output)
})

test('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async t => {
  let ref = await resolveRef({dir: '.', ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'})
  t.snapshot(ref)
})
test('test-branch', async t => {
  let ref = await resolveRef({dir: '.', ref: 'origin/test-branch'})
  t.snapshot(ref)
})
test('test-tag', async t => {
  let ref = await resolveRef({dir: '.', ref: 'test-tag'})
  t.snapshot(ref)
})
