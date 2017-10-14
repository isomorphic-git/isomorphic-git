// @flow
// This is a convenience wrapper for reading and writing files in the 'refs' directory.
import path from 'path'
import { write } from '../utils'

export class GitRefsManager {
  static async updateRemoteRefs ({ gitdir, remote, refs, symrefs } /*: {
      gitdir: string,
      remote: string,
      refs: Map<string, string>,
      symrefs: Map<string, string>
    } */) {
    // Validate input
    for (let [key, value] of refs) {
      if (!value.match(/[0-9a-f]{40}/)) {
        throw new Error(`Unexpected ref contents: '${value}'`)
      }
    }
    // Combine refs and symrefs giving symrefs priority
    let actualRefsToWrite = new Map()
    for (let [key, value] of refs) actualRefsToWrite.set(key, value)
    for (let [key, value] of symrefs) {
      let branch = value.replace(/^refs\/heads\//, '')
      actualRefsToWrite.set(key, `ref: refs/remotes/${remote}/${branch}`)
    }
    // Update files
    const normalizeValue = value => value.trim() + '\n'
    for (let [key, value] of actualRefsToWrite) {
      // For some reason we trim these
      key = key.replace(/^refs\/heads\//, '')
      key = key.replace(/^refs\/tags\//, '')
      await write(
        path.join(gitdir, 'refs', 'remotes', remote, key),
        normalizeValue(value),
        'utf8'
      )
    }
  }
}
