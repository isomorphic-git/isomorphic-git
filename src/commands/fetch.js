import path from 'path'
import pify from 'pify'
import concat from 'simple-concat'
import split2 from 'split2'

import { FileSystem } from '../models'
import { fetchPackfile } from '../utils'

/**
 * Fetch commits from a remote repository
 *
 * @link https://isomorphic-git.github.io/docs/fetch.html
 */
export async function fetch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  ref = 'HEAD',
  refs,
  remote,
  url,
  authUsername,
  authPassword,
  depth,
  since,
  exclude,
  relative,
  tags,
  singleBranch,
  onprogress // deprecated
}) {
  try {
    if (onprogress !== undefined) {
      console.warn(
        'The `onprogress` callback has been deprecated. Please use the more generic `emitter` EventEmitter argument instead.'
      )
    }
    const fs = new FileSystem(_fs)
    let response = await fetchPackfile({
      gitdir,
      fs,
      ref,
      refs,
      remote,
      url,
      authUsername,
      authPassword,
      depth,
      since,
      exclude,
      relative,
      tags,
      singleBranch
    })
    // Note: progress messages are designed to be written directly to the terminal,
    // so they are often sent with just a carriage return to overwrite the last line of output.
    // But there are also messages delimited with newlines.
    // I also include CRLF just in case.
    response.progress.pipe(split2(/(\r\n)|\r|\n/)).on('data', line => {
      if (emitter) {
        emitter.emit('message', line.trim())
      }
      let matches = line.match(/\((\d+?)\/(\d+?)\)/)
      if (matches && emitter) {
        emitter.emit('progress', {
          loaded: parseInt(matches[1], 10),
          total: parseInt(matches[2], 10),
          lengthComputable: true
        })
      }
    })
    let packfile = await pify(concat)(response.packfile)
    let packfileSha = packfile.slice(-20).toString('hex')
    // This is a quick fix for the empty .git/objects/pack/pack-.pack file error,
    // which due to the way `git-list-pack` works causes the program to hang when it tries to read it.
    // TODO: Longer term, we should actually:
    // a) NOT concatenate the entire packfile into memory (line 78),
    // b) compute the SHA of the stream except for the last 20 bytes, using the same library used in push.js, and
    // c) compare the computed SHA with the last 20 bytes of the stream before saving to disk, and throwing a "packfile got corrupted during download" error if the SHA doesn't match.
    if (packfileSha !== '') {
      await fs.write(
        path.join(gitdir, `objects/pack/pack-${packfileSha}.pack`),
        packfile
      )
    }
    // TODO: Return more metadata?
    return {
      defaultBranch: response.HEAD,
      fetchHead: response.FETCH_HEAD
    }
  } catch (err) {
    err.caller = 'git.fetch'
    throw err
  }
}
