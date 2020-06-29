import { GitPktLine } from '../models/GitPktLine.js'
import { pkg } from '../utils/pkg.js'

/**
 * @param {object} args
 * @param {string} [args.prefix] - Only list refs that start with this prefix
 * @param {boolean} [args.symrefs = false] - Include symbolic ref targets
 * @param {boolean} [args.peelTags = false] - Include peeled tags values
 * @returns {Uint8Array[]}
 */
export async function writeListRefsRequest({ prefix, symrefs, peelTags }) {
  const packstream = []
  // command
  packstream.push(GitPktLine.encode('command=ls-refs\n'))
  // capability-list
  packstream.push(GitPktLine.encode(`agent=${pkg.agent}\n`))
  // [command-args]
  if (peelTags || symrefs || prefix) {
    packstream.push(GitPktLine.delim())
  }
  if (peelTags) packstream.push(GitPktLine.encode('peel'))
  if (symrefs) packstream.push(GitPktLine.encode('symrefs'))
  if (prefix) packstream.push(GitPktLine.encode(`ref-prefix ${prefix}`))
  packstream.push(GitPktLine.flush())
  return packstream
}
