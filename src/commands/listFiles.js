import path from 'path'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

import { readObject } from './readObject'
import { resolveRef } from './resolveRef'

/**
 * List all the files in the git index
 *
 * @link https://isomorphic-git.github.io/docs/listFiles.html
 */
export async function listFiles ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    let filenames
    if (ref) {
      const oid = await resolveRef({ gitdir, fs, ref })
      filenames = []
      await accumulateFilesFromOid({ gitdir, fs, oid, filenames, prefix: '' })
    } else {
      await GitIndexManager.acquire(
        { fs, filepath: `${gitdir}/index` },
        async function (index) {
          filenames = index.entries.map(x => x.path)
        }
      )
    }
    return filenames
  } catch (err) {
    err.caller = 'git.listFiles'
    throw err
  }
}

async function accumulateFilesFromOid ({ gitdir, fs, oid, filenames, prefix }) {
  const { object } = await readObject({ gitdir, fs, oid, filepath: '' })
  // Note: this isn't parallelized because I'm too lazy to figure that out right now
  for (const entry of object.entries) {
    if (entry.type === 'tree') {
      await accumulateFilesFromOid({
        gitdir,
        fs,
        oid: entry.oid,
        filenames,
        prefix: posixJoin(prefix, entry.path)
      })
    } else {
      filenames.push(posixJoin(prefix, entry.path))
    }
  }
}

// For some reason path.posix.join is undefined in webpack?
const posixJoin = (prefix, filename) =>
  prefix ? `${prefix}/${filename}` : filename
