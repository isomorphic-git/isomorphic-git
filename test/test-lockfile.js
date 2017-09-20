import test from 'ava'
import fs from 'fs'
import { tmpdir, exists } from './_helpers.js'
import { lock, unlock } from '../lib/utils/lockfile'
import sleep from '../lib/utils/sleep'

test('make lockfile', async t => {
  let dir = await tmpdir()
  await lock(dir)
  t.true(exists(`${dir}.lock`))
})

test('cannot double-acquire lockfile', async t => {
  let dir = await tmpdir()
  await lock(dir)
  t.true(exists(`${dir}.lock`))
  try {
    await lock(dir)
    t.fail('Double-acquired lock')
  } catch (err) {
    t.pass()
  }
})

test('can release lockfile', async t => {
  let dir = await tmpdir()
  await lock(dir)
  t.true(exists(`${dir}.lock`))
  await unlock(dir)
  await lock(dir)
  t.true(exists(`${dir}.lock`))
  await unlock(dir)
  await sleep(100)
  t.false(exists(`${dir}.lock`))
})

test('cannot double-release lockfile', async t => {
  let dir = await tmpdir()
  await lock(dir)
  t.true(exists(`${dir}.lock`))
  await unlock(dir)
  try {
    await unlock(dir)
    t.fail('Was able to double-release lockfile')
  } catch (err) {
    t.pass()
  }
})

test('can retry until acquire lockfile', async t => {
  let dir = await tmpdir()
  await lock(dir)
  t.true(exists(`${dir}.lock`))
  setTimeout(() => fs.rmdir(`${dir}.lock`), 100)
  try {
    await lock(dir)
    t.pass()
  } catch (err) {
    t.fail('Could not acquire lock even after lockfile deleted.')
  }
})
