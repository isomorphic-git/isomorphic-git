import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { WORKDIR } from '../models/GitWalkerFs.js'
import { STAGE } from '../models/GitWalkerIndex.js'
import { TREE } from '../models/GitWalkerRepo.js'
import { compareStats } from '../utils/compareStats.js'

import { walk } from './walk.js'

/**
 * Summarize the differences between a commit, the working dir, and the stage
 *
 * @link https://isomorphic-git.github.io/docs/status.html
 */
export async function status2 ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref = 'HEAD'
}) {
  try {
    const fs = new FileSystem(_fs)
    let results = await walk({
      fs,
      dir,
      gitdir,
      trees: [TREE(ref), WORKDIR, STAGE],
      map: async function ([head, workdir, stage]) {
        let H = 0
        let W = 0
        let S = 0
        // First order approximation
        if (!head.empty) H = 1
        if (!workdir.empty) W = 2
        if (!stage.empty) S = 3
        // Second order approximation
        if (!workdir.empty && !stage.empty) {
          await workdir.populateStat()
          await stage.populateStat()
          // For now, just bail on directories
          if (workdir.type === 'tree' || stage.type === 'tree') {
            return null
          }
          if (compareStats(workdir, stage)) {
            console.log('LOTS OF WORK OH NO!!!')
            await workdir.populateHash()
            await stage.populateHash()
          } else {
            // Fake the oid rather than compute it
            workdir.oid = stage.oid
          }
        }
        await head.populateHash()
        if (!head.empty && !workdir.empty && head.oid === workdir.oid) W = H
        if (!head.empty && !stage.empty && head.oid === stage.oid) S = H
        if (!workdir.empty && !stage.empty && workdir.oid === stage.oid) S = W
        // console.log(head.fullpath, H, W, S)
        let fullpath = head.fullpath || workdir.fullpath || stage.fullpath
        return [fullpath, H, W, S]
      }
    })
    console.table(results.filter(x => x !== null))
  } catch (err) {
    err.caller = 'git.status2'
    throw err
  }
}
