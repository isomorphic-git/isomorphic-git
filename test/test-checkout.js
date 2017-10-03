import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import path from 'path'
import fs from 'fs'
import { tmpdir } from './_helpers'

test(async t => {
  let dir = await tmpdir()
  await pify(ncp)('fixtures/test-checkout.git', path.join(dir, '.git'))
  await git(dir).checkout('test-branch')
  let files = await pify(fs.readdir)(dir)
  t.snapshot(files)
  let index = await git(dir).list()
  t.snapshot(index)
})
