// @ts-check
import '../typedefs.js'

import { checkout } from '../api/checkout.js'
import { readCommit } from '../api/readCommit.js'
import { writeRef } from '../api/writeRef.js'
import { MissingNameError } from '../errors/MissingNameError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { appendToFile } from '../utils/appendToFile.js'
import { join } from '../utils/join.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import {
  writeTreeChanges,
  applyTreeChanges,
} from '../utils/walkerToTreeEntryMap.js'

import { STAGE } from './STAGE.js'
import { TREE } from './TREE.js'
import { _currentBranch } from './currentBranch.js'
import { _readCommit } from './readCommit.js'
import { _writeCommit } from './writeCommit.js'

function _getTimezoneOffsetForRefLogEntry() {
  const offsetMinutes = new Date().getTimezoneOffset()
  const offsetHours = Math.abs(Math.floor(offsetMinutes / 60))
  const offsetMinutesFormatted = Math.abs(offsetMinutes % 60)
    .toString()
    .padStart(2, '0')
  const sign = offsetMinutes > 0 ? '-' : '+'
  return `${sign}${offsetHours
    .toString()
    .padStart(2, '0')}${offsetMinutesFormatted}`
}

async function _writeStashReflog(fs, gitdir, author, stashCommit, message) {
  const reflogPath = _getRefLogStashPath(gitdir)
  const nameNoSpace = author.name.replace(/\s/g, '')

  const z40 = '0000000000000000000000000000000000000000' // hard code for now, works with `git stash list`
  const timestamp = Math.floor(Date.now() / 1000)
  const timezoneOffset = _getTimezoneOffsetForRefLogEntry()
  const reflogEntry = `${z40} ${stashCommit} ${nameNoSpace} ${author.email} ${timestamp} ${timezoneOffset}\t${message}\n`

  await appendToFile(fs, reflogPath, reflogEntry)
}

async function _readStashReflogs(fs, gitdir) {
  const reflogEntries = []
  const reflogPath = _getRefLogStashPath(gitdir)
  if (!(await fs.exists(reflogPath))) {
    return reflogEntries
  }

  const reflogBuffer = await fs.read(reflogPath)
  const reflogString = reflogBuffer.toString()
  const reflogLines = reflogString.split('\n')
  reflogLines.forEach(line => {
    if (line) {
      reflogEntries.push(line)
    }
  })

  return reflogEntries
}

const _getRefStashPath = gitdir => join(gitdir, 'refs/stash')
const _getRefLogStashPath = gitdir => join(gitdir, 'logs/refs/stash')

export async function _stashPush({ fs, dir, gitdir }) {
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

  const author = await normalizeAuthorObject({
    fs,
    gitdir,
    author: {},
  })
  if (!author) throw new MissingNameError('author')

  const indexTree = await writeTreeChanges(fs, dir, gitdir, [
    TREE({ ref: 'HEAD' }),
    'stage',
  ])
  if (indexTree) {
    // this indexTree will be the tree of the stash commit
    // create a commit from the index tree, which has one parent, the current branch HEAD
    const stashCommitOne = await _writeCommit({
      fs,
      gitdir,
      commit: {
        message: `stash-Index: WIP on ${branch} - ${new Date().toISOString()}`,
        tree: indexTree, // stashCommitTree
        parent: stashCommitParents,
        author,
        committer: author,
      },
    })
    stashCommitParents.push(stashCommitOne)
    stashCommitTree = indexTree
    workDirCompareBase = STAGE()
  }

  const workingTree = await writeTreeChanges(fs, dir, gitdir, [
    workDirCompareBase,
    'workdir',
  ])
  if (workingTree) {
    // create a commit from the working directory tree, which has one parent, either the one we just had, or the headCommit
    const workingHeadCommit = await _writeCommit({
      fs,
      gitdir,
      commit: {
        message: `stash-WorkDir: WIP on ${branch} - ${new Date().toISOString()}`,
        tree: workingTree,
        parent: [stashCommitParents[stashCommitParents.length - 1]],
        author,
        committer: author,
      },
    })
    stashCommitParents.push(workingHeadCommit)
    stashCommitTree = workingTree
  }

  if (stashCommitTree === null) {
    throw new NotFoundError('changes, nothing to stash')
  }

  // create another commit from the tree, which has three parents: HEAD and the commit we just made:
  const stashCommit = await _writeCommit({
    fs,
    gitdir,
    commit: {
      message: `stash: WIP on ${branch} - ${new Date().toISOString()}`,
      tree: stashCommitTree,
      parent: stashCommitParents,
      author,
      committer: author,
    },
  })

  // next, write this commit into .git/refs/stash:
  await writeRef({
    fs,
    gitdir,
    ref: 'refs/stash',
    value: stashCommit,
    force: true,
  })

  // write the stash commit to the logs
  await _writeStashReflog(
    fs,
    gitdir,
    author,
    stashCommit,
    `WIP on ${branch}: ${headCommit.substring(0, 7)} ${headMsg}`
  )

  // finally, go back to a clean working directory
  await checkout({
    fs,
    dir,
    gitdir,
    ref: branch,
    track: false,
    force: true, // force checkout to discard changes
  })
}

export async function _stashApply({ fs, dir, gitdir }) {
  if (!(await fs.exists(_getRefStashPath(gitdir)))) {
    return
  }

  const stashSHA = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'refs/stash',
  })

  // get the stash commit object
  const stashCommit = await _readCommit({
    fs,
    cache: {},
    gitdir,
    oid: stashSHA,
  })
  const { parent: stashParents } = stashCommit.commit

  // compare the stash commit tree with its parent commit
  for (let i = 0; i < stashParents.length - 1; i++) {
    const applyingCommit = await _readCommit({
      fs,
      cache: {},
      gitdir,
      oid: stashParents[i + 1],
    })
    const wasStaged = applyingCommit.commit.message.startsWith('stash-Index')

    await applyTreeChanges(
      fs,
      dir,
      gitdir,
      stashParents[i + 1],
      stashParents[i],
      wasStaged
    )
  }
}

export async function _stashDrop({ fs, dir, gitdir }) {
  // remove stash ref first
  const stashRefPath = _getRefStashPath(gitdir)
  if (await fs.exists(stashRefPath)) {
    await fs.rm(stashRefPath)
  }

  // read from stash reflog and list the stash commits
  const reflogEntries = await _readStashReflogs(fs, gitdir)
  if (!reflogEntries.length) {
    return // no stash reflog entry
  }

  // remove the last stash reflog entry from reflogEntries, then update the stash reflog
  reflogEntries.pop()

  const stashReflogPath = _getRefLogStashPath(gitdir)
  if (reflogEntries.length) {
    await fs.write(stashReflogPath, reflogEntries.join('\n'), 'utf8')

    const lastStashCommit = reflogEntries[reflogEntries.length - 1].split(
      ' '
    )[1]
    await writeRef({
      fs,
      gitdir,
      ref: 'refs/stash',
      value: lastStashCommit,
      force: true,
    })
  } else {
    // remove the stash reflog file if no entry left
    await fs.rm(stashReflogPath)
  }
}

export async function _stashList({ fs, dir, gitdir }) {
  const stashReader = []
  const reflogEntries = await _readStashReflogs(fs, gitdir)
  if (reflogEntries.length > 0) {
    for (let i = reflogEntries.length - 1; i >= 0; i--) {
      const entryParts = reflogEntries[i].split('\t')
      stashReader.push(
        `stash@{${reflogEntries.length - 1 - i}}: ${entryParts[1]}`
      )
    }
  }
  return stashReader
}

export async function _stashClear({ fs, dir, gitdir }) {
  const stashRefPath = [_getRefStashPath(gitdir), _getRefLogStashPath(gitdir)]

  await Promise.all(
    stashRefPath.map(async path => {
      if (await fs.exists(path)) {
        return fs.rm(path)
      }
    })
  )
}

export async function _stashPop({ fs, dir, gitdir }) {
  await _stashApply({ fs, dir, gitdir })
  await _stashDrop({ fs, dir, gitdir })
}
