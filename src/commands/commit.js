// @ts-check
import '../typedefs.js'

import { EmptyCommitError } from '../errors/EmptyCommitError.js'
import { MergeInProgressError } from '../errors/MergeInProgressError.js'
import { MissingNameError } from '../errors/MissingNameError.js'
import { MissingParameterError } from '../errors/MissingParameterError.js'
import { NoCommitError } from '../errors/NoCommitError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { GitTree } from '../models/GitTree.js'
import { hasObject } from '../storage/hasObject.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'
import { flatFileListToDirectoryStructure } from '../utils/flatFileListToDirectoryStructure.js'
import { clearMergeState, stripConflictsComment } from '../utils/mergeState.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { normalizeCommitterObject } from '../utils/normalizeCommitterObject.js'

import { _readCommit as readCommit } from './readCommit.js'

const EMPTY_TREE_OID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/**
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} args.gitdir
 * @param {string} [args.message]
 * @param {Object} [args.author]
 * @param {string} [args.author.name]
 * @param {string} [args.author.email]
 * @param {number} [args.author.timestamp]
 * @param {number} [args.author.timezoneOffset]
 * @param {Object} [args.committer]
 * @param {string} [args.committer.name]
 * @param {string} [args.committer.email]
 * @param {number} [args.committer.timestamp]
 * @param {number} [args.committer.timezoneOffset]
 * @param {string} [args.signingKey]
 * @param {boolean} [args.amend = false]
 * @param {boolean} [args.dryRun = false]
 * @param {boolean} [args.noUpdateBranch = false]
 * @param {boolean} [args.disallowEmpty = false]
 * @param {string} [args.ref]
 * @param {string[]} [args.parent]
 * @param {string} [args.tree]
 * @param {boolean} [args.finishMerge = false] - Finish a merge or cherry-pick in progress, like `git commit`
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit.
 */
export async function _commit({
  fs,
  cache,
  onSign,
  gitdir,
  message,
  author: _author,
  committer: _committer,
  signingKey,
  amend = false,
  dryRun = false,
  noUpdateBranch = false,
  disallowEmpty = false,
  ref,
  parent,
  tree,
  finishMerge = false,
}) {
  // Determine ref and the commit pointed to by ref, and if it is the initial commit
  let initialCommit = false
  let detachedHead = false
  if (!ref) {
    const headContent = await fs.read(`${gitdir}/HEAD`, { encoding: 'utf8' })
    detachedHead = !headContent.startsWith('ref:')
    ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2,
    })
  }

  // A merge or cherry-pick that stopped on conflicts is finished by the next
  // commit on HEAD, like `git commit` does: its other parents come from
  // MERGE_HEAD, its message from MERGE_MSG, and a cherry-pick keeps the picked
  // commit's author. The commits merge and cherryPick make themselves leave
  // it alone.
  const onHead =
    finishMerge &&
    ref === (await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD', depth: 2 }))
  const readState = async file =>
    /** @type {string|null} */ (
      await fs.read(`${gitdir}/${file}`, { encoding: 'utf8' })
    )
  const mergeHead = onHead ? await readState('MERGE_HEAD') : null
  const cherryPickHead = onHead ? await readState('CHERRY_PICK_HEAD') : null
  // Like git, refuse to amend in the middle of one.
  if (amend && (mergeHead || cherryPickHead)) {
    throw new MergeInProgressError(
      mergeHead ? 'MERGE_HEAD' : 'CHERRY_PICK_HEAD'
    )
  }
  // Like git, a merge in progress wins: its commit is the current user's.
  const pickedCommit =
    cherryPickHead && !mergeHead
      ? (await readCommit({ fs, gitdir, oid: cherryPickHead.trim(), cache }))
          .commit
      : undefined
  // MERGE_MSG supplies the default message, without the conflict list that
  // was appended to it as comments.
  if (!message && !amend) {
    const mergeMsg =
      (mergeHead || cherryPickHead) && (await readState('MERGE_MSG'))
    if (mergeMsg) message = stripConflictsComment(mergeMsg)
    if (!message) throw new MissingParameterError('message')
  }

  let refOid, refCommit
  try {
    refOid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref,
    })
  } catch (err) {
    if (!(err instanceof NotFoundError)) throw err
    // We assume that there's no commit and this is the initial commit
    initialCommit = true
  }

  if (!initialCommit && (amend || disallowEmpty)) {
    refCommit = await readCommit({ fs, gitdir, oid: refOid, cache })
  }

  if (amend && initialCommit) {
    throw new NoCommitError(ref)
  }

  // Determine author and committer information
  const author = !amend
    ? await normalizeAuthorObject({
        fs,
        gitdir,
        author: _author,
        commit: pickedCommit,
      })
    : await normalizeAuthorObject({
        fs,
        gitdir,
        author: _author,
        commit: refCommit.commit,
      })
  if (!author) throw new MissingNameError('author')

  // Whoever commits is the committer, as in git: the committer defaults to
  // the author the caller gave, never to the one taken from a picked commit.
  const committer = !amend
    ? await normalizeCommitterObject({
        fs,
        gitdir,
        author: pickedCommit ? _author : author,
        committer: _committer,
      })
    : await normalizeCommitterObject({
        fs,
        gitdir,
        author,
        committer: _committer,
        commit: refCommit.commit,
      })
  if (!committer) throw new MissingNameError('committer')

  return GitIndexManager.acquire(
    { fs, gitdir, cache, allowUnmerged: false },
    async function (index) {
      // Entries added with `git add --intent-to-add` are not part of the tree
      const inodes = flatFileListToDirectoryStructure(
        index.entries.filter(entry => !entry.flags.intentToAdd)
      )
      const inode = inodes.get('.')
      if (!tree) {
        tree = await constructTree({ fs, gitdir, inode, dryRun })
      }

      // Determine parents of this commit. Those in MERGE_HEAD are peeled like
      // given ones, since git writes an annotated tag there as it is.
      if (!parent && mergeHead) {
        parent = [
          ...(refOid ? [refOid] : []),
          ...mergeHead.split('\n').filter(Boolean),
        ]
      }
      if (!parent) {
        if (!amend) {
          parent = refOid ? [refOid] : []
        } else {
          parent = refCommit.commit.parent
        }
      } else {
        // ensure that the parents are oids, not refs
        parent = await Promise.all(
          parent.map(async p => {
            let oid = await GitRefManager.resolve({ fs, gitdir, ref: p })
            // If `p` is an annotated tag, use the commit it points to.
            // Parents are not required to exist locally.
            while (await hasObject({ fs, cache, gitdir, oid })) {
              const { type, object } = await readObject({
                fs,
                cache,
                gitdir,
                oid,
              })
              if (type === 'commit') break
              if (type !== 'tag') {
                throw new ObjectTypeError(oid, type, 'commit')
              }
              oid = GitAnnotatedTag.from(object).parse().object
            }
            return oid
          })
        )
      }

      if (
        disallowEmpty &&
        !amend &&
        ((initialCommit && tree === EMPTY_TREE_OID) ||
          (!initialCommit && tree === refCommit.commit.tree))
      ) {
        throw new EmptyCommitError()
      }

      // Determine message of this commit
      if (!message && amend) {
        message = refCommit.commit.message
      }

      // Create and write new Commit object
      let comm = GitCommit.from({
        tree,
        parent,
        author,
        committer,
        message,
      })
      if (signingKey) {
        comm = await GitCommit.sign(comm, onSign, signingKey)
      }
      const oid = await writeObject({
        fs,
        gitdir,
        type: 'commit',
        object: comm.toObject(),
        dryRun,
      })
      if (!noUpdateBranch && !dryRun) {
        // Update branch pointer (or HEAD directly if detached)
        await GitRefManager.writeRef({
          fs,
          gitdir,
          ref: detachedHead ? 'HEAD' : ref,
          value: oid,
        })
        if (onHead) await clearMergeState({ fs, gitdir })
      }
      return oid
    }
  )
}

async function constructTree({ fs, gitdir, inode, dryRun }) {
  // use depth first traversal
  const children = inode.children
  for (const inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000'
      inode.metadata.oid = await constructTree({ fs, gitdir, inode, dryRun })
    }
  }
  const entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type,
  }))
  const tree = GitTree.from(entries)
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'tree',
    object: tree.toObject(),
    dryRun,
  })
  return oid
}
