// @ts-check
import '../typedefs.js'

// The files git keeps in the git directory while a merge or cherry-pick that
// stopped on conflicts waits to be committed or aborted.
const MERGE_STATE_FILES = [
  'MERGE_HEAD',
  'MERGE_MSG',
  'MERGE_MODE',
  'CHERRY_PICK_HEAD',
  'AUTO_MERGE',
]

/**
 * The contents of MERGE_MSG: the prepared message followed by the list of
 * conflicted files as comment lines, the way git writes it.
 *
 * @param {string} message
 * @param {string[]} conflicts
 * @returns {string}
 */
export function formatMergeMessage(message, conflicts) {
  return `${message.replace(/\n*$/, '\n')}\n# Conflicts:\n${[...conflicts]
    .sort()
    .map(filepath => `#\t${filepath}\n`)
    .join('')}`
}

/**
 * The message from MERGE_MSG the way `git commit` takes it when the prepared
 * message is accepted as it is (`--cleanup=strip`): comment lines, which
 * include the conflict list `formatMergeMessage` appended, are dropped,
 * trailing whitespace is removed, runs of blank lines become one, and
 * leading and trailing blank lines go. Empty if nothing is left.
 *
 * @param {string} message
 * @returns {string}
 */
export function stripConflictsComment(message) {
  let stripped = ''
  let blank = false
  for (const line of message.split('\n')) {
    if (line.startsWith('#')) continue
    const text = line.replace(/[ \t\r]+$/, '')
    if (!text) {
      blank = stripped !== ''
      continue
    }
    stripped += `${blank ? '\n' : ''}${text}\n`
    blank = false
  }
  return stripped
}

/**
 * Which merge or cherry-pick is in progress, if any: the file that records
 * it.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @returns {Promise<'MERGE_HEAD'|'CHERRY_PICK_HEAD'|undefined>}
 */
export async function mergeInProgress({ fs, gitdir }) {
  if (await fs.exists(`${gitdir}/MERGE_HEAD`)) return 'MERGE_HEAD'
  if (await fs.exists(`${gitdir}/CHERRY_PICK_HEAD`)) return 'CHERRY_PICK_HEAD'
}

/**
 * Forget the merge or cherry-pick in progress. ORIG_HEAD stays, as in git.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 */
export async function clearMergeState({ fs, gitdir }) {
  for (const file of MERGE_STATE_FILES) {
    await fs.rm(`${gitdir}/${file}`)
  }
}
