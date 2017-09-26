// @flow
// This is modeled after the lockfile strategy used by the git source code.
import pify from 'pify'
import fs from './fs'
import { sleep } from './sleep'
const delayedReleases = new Map()

export async function lock (
  filename /*: string */,
  triesLeft /*: number */ = 3
) {
  // check to see if we still have it
  if (delayedReleases.has(filename)) {
    clearTimeout(delayedReleases.get(filename))
    delayedReleases.delete(filename)
    return
  }
  if (triesLeft === 0) {
    throw new Error(
      `Unable to acquire lockfile '${filename}'. Exhausted tries.`
    )
  }
  try {
    await pify(fs().mkdir)(`${filename}.lock`)
  } catch (err) {
    if (err.code === 'EEXIST') {
      await sleep(100)
      await lock(filename, triesLeft - 1)
    }
  }
}

export async function unlock (
  filename /*: string */,
  delayRelease /*: number */ = 50
) {
  if (delayedReleases.has(filename)) {
    throw new Error('Cannot double-release lockfile')
  }
  // Basically, we lie and say it was deleted ASAP.
  // But really we wait a bit to see if you want to acquire it again.
  delayedReleases.set(
    filename,
    setTimeout(async () => {
      delayedReleases.delete(filename)
      await pify(fs().rmdir)(`${filename}.lock`)
    })
  )
}
