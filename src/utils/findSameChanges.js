// @ts-check
import '../typedefs.js'

import { _readBlob } from '../commands/readBlob.js'
import { _readTree } from '../commands/readTree.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'

import { isBinary } from './isBinary.js'

const EMPTY_TREE_OID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/**
 * @typedef {Object} ChangeCommit
 * @property {string} oid
 * @property {string} tree - The commit's tree
 * @property {string} parentTree - The tree of its parent, or the empty tree for a root commit
 */

/**
 * The commits of `ours` whose whole change one of `theirs` makes too, the
 * way git's `--cherry-pick` matches them: by patch id, so the same edit
 * made to a version of a file that differs elsewhere matches too. Commits
 * that change nothing are never matched.
 *
 * Two changes match when they touch the same paths with the same modes, and
 * either go from the same old versions to the same new versions, or have the
 * same patch id (see `patchId`). Skipping a commit that git would apply
 * drops a real change, so a patch id is only trusted when diffing each file
 * from the start and from the end gives the same id: a good sign that git
 * lines the changes up the same way, though not a proof. git's diff is not
 * always the shortest one either, so a patch id is not used when the diff
 * keeps a line that repeats in the file between two changes (git may count
 * that line as changed), or has more than `MAX_EDITS` edits. Either way the
 * commit is then replayed, even where git would skip it.
 *
 * git also compares a file as binary (by its versions) when its attributes
 * say so (`binary`, `-diff`, a `diff` driver). Rather than read them, patch
 * ids are not used for a file that any attributes file could reach: a
 * `.gitattributes` in its directory or above (in either commit, in `trees`
 * or in the working tree), `.git/info/attributes`, or `core.attributesFile`. The
 * user's global attributes file is out of reach of the library.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {ChangeCommit[]} args.ours
 * @param {ChangeCommit[]} args.theirs
 * @param {string[]} [args.trees] - More trees whose `.gitattributes` count (HEAD's, the branch's)
 *
 * @returns {Promise<Set<string>>} the oids of the matched commits of `ours`
 */
export async function findSameChanges({
  fs,
  cache,
  dir,
  gitdir,
  ours,
  theirs,
  trees = [],
}) {
  // Our commits by the paths and modes they touch.
  const byShape = new Map()
  // Every path our commits touch, and the directories above them.
  const paths = new Set()
  for (const commit of ours) {
    const changes = await diffTrees({ fs, cache, gitdir, ...commit })
    if (!changes || !changes.length) continue
    const key = shape(changes)
    if (!byShape.has(key)) byShape.set(key, [])
    byShape.get(key).push({ oid: commit.oid, changes })
    for (const { path } of changes) {
      const parts = path.split('/')
      for (let i = 1; i <= parts.length; i++) {
        paths.add(parts.slice(0, i).join('/'))
      }
    }
  }
  const same = new Set()
  if (!byShape.size) return same
  const config = await GitConfigManager.get({ fs, gitdir })
  const usePatchIds =
    !(await config.get('core.attributesFile')) &&
    !(await fs.exists(`${gitdir}/info/attributes`))
  // Whether a .gitattributes sits in the directory `path` of the working
  // tree or of one of `trees`.
  const attributesIn = async path => {
    if (
      dir &&
      (await fs.exists(`${dir}/${path ? `${path}/` : ''}.gitattributes`))
    ) {
      return true
    }
    for (const tree of trees) {
      let oid = tree
      for (const name of path ? path.split('/') : []) {
        const entry = (await _readTree({ fs, cache, gitdir, oid })).tree.find(
          entry => entry.path === name && entry.type === 'tree'
        )
        oid = entry ? entry.oid : undefined
        if (!oid) break
      }
      if (
        oid &&
        (await _readTree({ fs, cache, gitdir, oid })).tree.some(
          entry => entry.path === '.gitattributes'
        )
      ) {
        return true
      }
    }
    return false
  }
  const ids = new Map()
  const idOf = async ({ oid, changes }) => {
    if (!ids.has(oid)) {
      let id = null
      if (usePatchIds && !changes.some(change => change.attributes)) {
        let attributes = false
        for (const { path } of changes) {
          const parts = path.split('/')
          for (let i = 0; i < parts.length && !attributes; i++) {
            attributes = await attributesIn(parts.slice(0, i).join('/'))
          }
        }
        if (!attributes) id = await patchId({ fs, cache, gitdir, changes })
      }
      ids.set(oid, id)
    }
    return ids.get(oid)
  }
  for (const commit of theirs) {
    // A commit that touches any other path cannot match, so its diff stops
    // there.
    const changes = await diffTrees({
      fs,
      cache,
      gitdir,
      ...commit,
      keep: path => paths.has(path),
    })
    if (!changes || !changes.length) continue
    const candidates = byShape.get(shape(changes)) || []
    const exact = versions(changes)
    for (const candidate of candidates) {
      if (same.has(candidate.oid)) continue
      if (versions(candidate.changes) === exact) {
        same.add(candidate.oid)
        continue
      }
      const id = await idOf(candidate)
      if (id !== null && id === (await idOf({ oid: commit.oid, changes }))) {
        same.add(candidate.oid)
      }
    }
  }
  return same
}

const shape = changes =>
  changes
    .map(({ path, oldMode, newMode }) => `${path}\0${oldMode}\0${newMode}`)
    .join('\n')

const versions = changes =>
  changes
    .map(
      ({ path, oldMode, oldOid, newMode, newOid }) =>
        `${path}\0${oldMode}\0${oldOid}\0${newMode}\0${newOid}`
    )
    .join('\n')

/**
 * @typedef {Object} FileChange
 * @property {string} path
 * @property {string} oldMode - Empty for a file that is added
 * @property {string} oldOid
 * @property {string} newMode - Empty for a file that is deleted
 * @property {string} newOid
 * @property {boolean} attributes - Whether a `.gitattributes` sits in its directory or above, in either tree
 */

/**
 * The files that differ between two trees, in path order, or `null` as soon
 * as one of them (or a directory holding it) fails `keep`.
 *
 * @returns {Promise<FileChange[] | null>}
 */
async function diffTrees({
  fs,
  cache,
  gitdir,
  parentTree,
  tree,
  keep = () => true,
  prefix = '',
  attributes = false,
  changes = [],
}) {
  if (parentTree === tree) return changes
  const entries = async oid =>
    new Map(
      oid !== EMPTY_TREE_OID
        ? (await _readTree({ fs, cache, gitdir, oid })).tree.map(entry => [
            entry.path,
            entry,
          ])
        : []
    )
  const before = await entries(parentTree)
  const after = await entries(tree)
  attributes =
    attributes || before.has('.gitattributes') || after.has('.gitattributes')
  const names = [...new Set([...before.keys(), ...after.keys()])].sort()
  for (const name of names) {
    const old = before.get(name)
    const next = after.get(name)
    if (old && next && old.oid === next.oid && old.mode === next.mode) continue
    const path = `${prefix}${name}`
    if (!keep(path)) return null
    const file = entry => (entry && entry.type !== 'tree' ? entry : undefined)
    const dir = entry =>
      entry && entry.type === 'tree' ? entry.oid : EMPTY_TREE_OID
    const oldFile = file(old)
    const newFile = file(next)
    if (oldFile || newFile) {
      changes.push({
        path,
        oldMode: oldFile ? oldFile.mode : '',
        oldOid: oldFile ? oldFile.oid : '',
        newMode: newFile ? newFile.mode : '',
        newOid: newFile ? newFile.oid : '',
        attributes,
      })
    }
    if (dir(old) !== dir(next)) {
      const inside = await diffTrees({
        fs,
        cache,
        gitdir,
        parentTree: dir(old),
        tree: dir(next),
        keep,
        prefix: `${path}/`,
        attributes,
        changes,
      })
      if (!inside) return null
    }
  }
  return changes
}

/**
 * The patch id of a set of file changes, as git defines one: each file's
 * diff with three lines of context, without line numbers and with all
 * whitespace removed, the files taken in path order. The text itself stands
 * in for the hash git takes of it. `null` when git may have diffed a file
 * differently: when the diff could be lined up in more than one way
 * (diffing from either end of the file disagrees), or keeps a repeated line
 * between two changes (see `keepsRepeatedLine`).
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.gitdir
 * @param {FileChange[]} args.changes
 * @returns {Promise<string | null>}
 */
async function patchId({ fs, cache, gitdir, changes }) {
  const files = []
  for (const change of changes) {
    const path = unspaced(change.path)
    let text = `diff--gita/${path}b/${path}`
    if (!change.oldMode) text += `newfilemode${change.newMode}`
    else if (!change.newMode) text += `deletedfilemode${change.oldMode}`
    else if (change.oldMode !== change.newMode) {
      text += `oldmode${change.oldMode}newmode${change.newMode}`
    }
    const before = await content({
      fs,
      cache,
      gitdir,
      mode: change.oldMode,
      oid: change.oldOid,
    })
    const after = await content({
      fs,
      cache,
      gitdir,
      mode: change.newMode,
      oid: change.newOid,
    })
    if (isBinary(before) || isBinary(after)) {
      // Like git, binary files are compared by their versions.
      text += `${change.oldOid || NULL_OID}${change.newOid || NULL_OID}`
    } else {
      text += change.oldMode ? `---a/${path}` : '---/dev/null'
      text += change.newMode ? `+++b/${path}` : '+++/dev/null'
      const a = lines(before)
      const b = lines(after)
      const forwardMarks = diffLines(a, b)
      const backwardMarks =
        forwardMarks && diffLines([...a].reverse(), [...b].reverse())
      // Too big a diff to work out: not trusted, so the commit is replayed.
      if (!backwardMarks) return null
      const forward = hunks(a, b, forwardMarks)
      const [removed, added] = backwardMarks
      const backward = hunks(a, b, [removed.reverse(), added.reverse()])
      if (forward !== backward) return null
      if (keepsRepeatedLine(a, b, forwardMarks)) return null
      text += forward
    }
    files.push(text)
  }
  return files.join('\n')
}

const NULL_OID = '0000000000000000000000000000000000000000'
const CONTEXT = 3

// The most edits a diff for a patch id may have (see `diffLines`). Past about
// 512 edits git's diff also stops looking for the shortest diff, so its
// patch ids can differ where these match.
const MAX_EDITS = 500

// The patch id leaves out all whitespace.
const unspaced = text => text.replace(/[ \t\n\r]/g, '')

async function content({ fs, cache, gitdir, mode, oid }) {
  if (!oid) return new Uint8Array(0)
  // A submodule is diffed as the line naming its commit.
  if (mode === '160000') {
    return new TextEncoder().encode(`Subproject commit ${oid}\n`)
  }
  return (await _readBlob({ fs, cache, gitdir, oid })).blob
}

// The lines of a file, each with its line feed, one character per byte so
// that no two different lines read the same.
function lines(bytes) {
  const result = []
  for (let start = 0; start < bytes.length; ) {
    let end = bytes.indexOf(10, start)
    end = end === -1 ? bytes.length : end + 1
    let line = ''
    for (let i = start; i < end; i += 8192) {
      line += String.fromCharCode(...bytes.subarray(i, Math.min(end, i + 8192)))
    }
    result.push(line)
    start = end
  }
  return result
}

// Whether the diff keeps, between two changes, a line found more than once
// in either file (more than twice in the two): git may count it as changed.
function keepsRepeatedLine(a, b, [removed, added]) {
  const counts = new Map()
  for (const line of [...a, ...b]) counts.set(line, (counts.get(line) || 0) + 1)
  let changed = false
  let repeated = false
  for (let i = 0, j = 0; i < a.length || j < b.length; ) {
    if (removed[i] || added[j]) {
      if (repeated) return true
      changed = true
      if (removed[i]) i++
      else j++
    } else {
      if (changed && counts.get(a[i]) > 2) repeated = true
      i++
      j++
    }
  }
  return false
}

/**
 * The lines of a unified diff with three lines of context and no hunk
 * headers, whitespace removed. Changes at most two contexts apart share a
 * hunk, so the context lines between them all appear once.
 *
 * @param {string[]} a
 * @param {string[]} b
 * @param {[boolean[], boolean[]]} marks - The removed lines of `a` and the added lines of `b`
 */
function hunks(a, b, [removed, added]) {
  // Each change: where it starts in both files, and how many lines go and come.
  const changes = []
  for (let i = 0, j = 0; i < a.length || j < b.length; ) {
    if (!removed[i] && !added[j]) {
      i++
      j++
      continue
    }
    const change = { i, j, gone: 0, come: 0 }
    for (; removed[i]; i++) change.gone++
    for (; added[j]; j++) change.come++
    changes.push(change)
  }
  let text = ''
  let k = 0
  while (k < changes.length) {
    let last = k
    while (
      last + 1 < changes.length &&
      changes[last + 1].i - (changes[last].i + changes[last].gone) <=
        2 * CONTEXT
    ) {
      last++
    }
    let j = Math.max(changes[k].j - CONTEXT, 0)
    for (let c = k; c <= last; c++) {
      const { i, j: at, gone, come } = changes[c]
      for (; j < at; j++) text += unspaced(b[j])
      for (let n = i; n < i + gone; n++) text += `-${unspaced(a[n])}`
      for (; j < at + come; j++) text += `+${unspaced(b[j])}`
    }
    const end = Math.min(j + CONTEXT, b.length)
    for (; j < end; j++) text += unspaced(b[j])
    k = last + 1
  }
  return text
}

/**
 * A shortest edit script from `a` to `b`, by Myers' O(ND) algorithm ("An
 * O(ND) Difference Algorithm and Its Variations", 1986): the furthest
 * reaching path on each diagonal for D = 0, 1, ... edits, then walked back.
 *
 * Gives up (`null`) past `MAX_EDITS` edits. That bounds its memory (the
 * saved paths grow with the square of the edits, here to about 1 MB) and its
 * time (at most about a thousand passes over the lines).
 *
 * @param {string[]} a
 * @param {string[]} b
 * @returns {[boolean[], boolean[]] | null} the lines of `a` removed and of `b` added
 */
function diffLines(a, b) {
  const removed = new Array(a.length).fill(false)
  const added = new Array(b.length).fill(false)
  const n = a.length
  const m = b.length
  const offset = n + m + 1
  const v = new Int32Array(2 * offset + 1)
  // v as it was before each D, for the walk back.
  const history = []
  let d = 0
  for (let done = false; !done; d++) {
    if (d > MAX_EDITS) return null
    history.push(v.slice(offset - d - 1, offset + d + 2))
    for (let k = -d; k <= d && !done; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[offset + k] = x
      done = x >= n && y >= m
    }
  }
  d--
  for (let x = n, y = m; d > 0; d--) {
    const before = history[d]
    const at = k => before[k + d + 1]
    const k = x - y
    const down = k === -d || (k !== d && at(k - 1) < at(k + 1))
    const previous = down ? k + 1 : k - 1
    const px = at(previous)
    const py = px - previous
    if (down) added[py] = true
    else removed[px] = true
    x = px
    y = py
  }
  return [removed, added]
}
