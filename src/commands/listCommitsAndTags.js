import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { cores } from '../utils/plugins.js'

export async function listCommitsAndTags ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  start,
  finish
}) {
  const fs = new FileSystem(_fs)
  let startingSet = new Set()
  let finishingSet = new Set()
  for (let ref of start) {
    startingSet.add(await GitRefManager.resolve({ fs, gitdir, ref }))
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await GitRefManager.resolve({ fs, gitdir, ref })
      finishingSet.add(oid)
    } catch (err) {}
  }
  let visited = new Set()
  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await readObject({ fs, gitdir, oid })
    // Recursively resolve annotated tags
    if (type === 'tag') {
      let tag = GitAnnotatedTag.from(object)
      let commit = tag.headers().object
      return walk(commit)
    }
    if (type !== 'commit') {
      throw new GitError(E.ObjectTypeAssertionFail, {
        oid,
        type,
        expected: 'commit'
      })
    }
    let commit = GitCommit.from(object)
    let parents = commit.headers().parent
    for (oid of parents) {
      if (!finishingSet.has(oid) && !visited.has(oid)) {
        await walk(oid)
      }
    }
  }
  // Let's go walking!
  for (let oid of startingSet) {
    await walk(oid)
  }
  return visited
}
