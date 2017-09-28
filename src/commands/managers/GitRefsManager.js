// @flow
// This is a convenience wrapper for reading and writing files in the 'refs' directory.
import path from 'path'
import { write } from './models/utils'

export class GitRefsManager {
  static async updateRemoteRefs ({ gitdir, remote, refs }) {
    // Validate input
    for (let [key, value] of refs) {
      if (!value.match(/[0-9a-f]{40}/)) {
        throw new Error(`Unexpected ref contents: '${value}'`)
      }
    }
    // Update files
    const normalizeValue = value => value.trim() + '\n'
    for (let [key, value] of refs) {
      await write(
        path.join(gitdir, 'refs', 'remotes', remote, key),
        normalizeValue(value),
        'utf8'
      )
    }
  } /*: { gitdir: string, remote: string, refs: Map<string, string> } */
}
