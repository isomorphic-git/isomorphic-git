// @ts-check
import '../typedefs.js'

import { checkout } from '../api/checkout.js'
import { readCommit } from '../api/readCommit.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitStashManager } from '../managers/GitStashManager.js'
import {
  writeTreeChanges,
  applyTreeChanges,
  acquireLock,
} from '../utils/walkerToTreeEntryMap.js'

import { STAGE } from './STAGE.js'
import { TREE } from './TREE.js'
import { _currentBranch } from './currentBranch.js'
import { _readCommit } from './readCommit.js'

export async function _stashPush({ fs, dir, gitdir, message = '' }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir })

  await stashMgr.getAuthor() // ensure there is an author
  const branch = await _currentBranch({
    fs,
    gitdir,
    fullname: false,
  })

  // prepare the stash commit: first parent is the current branch HEAD
  const headCommit = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'HEAD',
  })

  const headCommitObj = await readCommit({ fs, dir, gitdir, oid: headCommit })
  const headMsg = headCommitObj.commit.message

  const stashCommitParents = [headCommit]
  let stashCommitTree = null
  let workDirCompareBase = TREE({ ref: 'HEAD' })

  const indexTree = await writeTreeChanges({
    fs,
    dir,
    gitdir,
    treePair: [TREE({ ref: 'HEAD' }), 'stage'],
  })
  if (indexTree) {
    // this indexTree will be the tree of the stash commit
    // create a commit from the index tree, which has one parent, the current branch HEAD
    const stashCommitOne = await stashMgr.writeStashCommit({
      message: `stash-Index: WIP on ${branch} - ${new Date().toISOString()}`,
      tree: indexTree, // stashCommitTree
      parent: stashCommitParents,
    })
    stashCommitParents.push(stashCommitOne)
    stashCommitTree = indexTree
    workDirCompareBase = STAGE()
  }

  const workingTree = await writeTreeChanges({
    fs,
    dir,
    gitdir,
    treePair: [workDirCompareBase, 'workdir'],
  })
  if (workingTree) {
    // create a commit from the working directory tree, which has one parent, either the one we just had, or the headCommit
    const workingHeadCommit = await stashMgr.writeStashCommit({
      message: `stash-WorkDir: WIP on ${branch} - ${new Date().toISOString()}`,
      tree: workingTree,
      parent: [stashCommitParents[stashCommitParents.length - 1]],
    })

    stashCommitParents.push(workingHeadCommit)
    stashCommitTree = workingTree
  }

  if (!stashCommitTree || (!indexTree && !workingTree)) {
    throw new NotFoundError('changes, nothing to stash')
  }

  // create another commit from the tree, which has three parents: HEAD and the commit we just made:
  const stashMsg =
    (message.trim() || `WIP on ${branch}`) +
    `: ${headCommit.substring(0, 7)} ${headMsg}`

  const stashCommit = await stashMgr.writeStashCommit({
    message: stashMsg,
    tree: stashCommitTree,
    parent: stashCommitParents,
  })

  // next, write this commit into .git/refs/stash:
  await stashMgr.writeStashRef(stashCommit)

  // write the stash commit to the logs
  await stashMgr.writeStashReflogEntry({
    stashCommit,
    message: stashMsg,
  })

  // finally, go back to a clean working directory
  await checkout({
    fs,
    dir,
    gitdir,
    ref: branch,
    track: false,
    force: true, // force checkout to discard changes
  })

  return stashCommit
}

export async function _stashApply({ fs, dir, gitdir, refIdx = 0 }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir })

  // get the stash commit object
  const stashCommit = await stashMgr.readStashCommit(refIdx)
  const { parent: stashParents = null } = stashCommit.commit
    ? stashCommit.commit
    : {}
  if (!stashParents || !Array.isArray(stashParents)) {
    return // no stash found
  }

  // compare the stash commit tree with its parent commit
  for (let i = 0; i < stashParents.length - 1; i++) {
    const applyingCommit = await _readCommit({
      fs,
      cache: {},
      gitdir,
      oid: stashParents[i + 1],
    })
    const wasStaged = applyingCommit.commit.message.startsWith('stash-Index')

    await applyTreeChanges({
      fs,
      dir,
      gitdir,
      stashCommit: stashParents[i + 1],
      parentCommit: stashParents[i],
      wasStaged,
    })
  }
}

export async function _stashDrop({ fs, dir, gitdir, refIdx = 0 }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir })
  const stashCommit = await stashMgr.readStashCommit(refIdx)
  if (!stashCommit.commit) {
    return // no stash found
  }
  // remove stash ref first
  const stashRefPath = stashMgr.refStashPath
  await acquireLock(stashRefPath, async () => {
    if (await fs.exists(stashRefPath)) {
      await fs.rm(stashRefPath)
    }
  })

  // read from stash reflog and list the stash commits
  const reflogEntries = await stashMgr.readStashReflogs({ parsed: false })
  if (!reflogEntries.length) {
    return // no stash reflog entry
  }

  // remove the specified stash reflog entry from reflogEntries, then update the stash reflog
  reflogEntries.splice(refIdx, 1)

  const stashReflogPath = stashMgr.refLogsStashPath
  await acquireLock({ reflogEntries, stashReflogPath, stashMgr }, async () => {
    if (reflogEntries.length) {
      await fs.write(stashReflogPath, reflogEntries.join('\n'), 'utf8')
      const lastStashCommit = reflogEntries[reflogEntries.length - 1].split(
        ' '
      )[1]
      await stashMgr.writeStashRef(lastStashCommit)
    } else {
      // remove the stash reflog file if no entry left
      await fs.rm(stashReflogPath)
    }
  })
}

export async function _stashList({ fs, dir, gitdir }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir })
  return stashMgr.readStashReflogs({ parsed: true })
}

export async function _stashClear({ fs, dir, gitdir }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir })
  const stashRefPath = [stashMgr.refStashPath, stashMgr.refLogsStashPath]

  await acquireLock(stashRefPath, async () => {
    await Promise.all(
      stashRefPath.map(async path => {
        if (await fs.exists(path)) {
          return fs.rm(path)
        }
      })
    )
  })
}

export async function _stashPop({ fs, dir, gitdir, refIdx = 0 }) {
  await _stashApply({ fs, dir, gitdir, refIdx })
  await _stashDrop({ fs, dir, gitdir, refIdx })
}
