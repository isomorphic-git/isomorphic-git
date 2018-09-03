import globrex from 'globrex'
import path from 'path'

import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { WORKDIR } from '../models/GitWalkerFs.js'
import { STAGE } from '../models/GitWalkerIndex.js'
import { TREE } from '../models/GitWalkerRepo.js'
import { patternRoot } from '../utils/patternRoot.js'
import { cores } from '../utils/plugins.js'
import { worthWalking } from '../utils/worthWalking.js'

import { walkBeta1 } from './walkBeta1.js'

/**
 * Summarize the differences between a commit, the working dir, and the stage
 *
 * @link https://isomorphic-git.github.io/docs/statusMatrix.html
 */
export async function statusMatrix ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref = 'HEAD',
  pattern = null
}) {
  try {
    const fs = new FileSystem(_fs)
    let patternGlobrex =
      pattern && globrex(pattern, { globstar: true, extended: true })
    let patternBase = pattern && patternRoot(pattern)
    let results = await walkBeta1({
      fs,
      dir,
      gitdir,
      trees: [
        TREE({ fs, gitdir, ref }),
        WORKDIR({ fs, dir, gitdir }),
        STAGE({ fs, gitdir })
      ],
      filter: async function ([head, workdir, stage]) {
        // We need an awkward exception for the root directory
        if (head.fullpath === '.') return true
        // Ignore ignored files, but only if they are not already tracked.
        if (!head.exists && !stage.exists && workdir.exists) {
          if (
            await GitIgnoreManager.isIgnored({
              fs,
              dir,
              filepath: workdir.fullpath
            })
          ) {
            return false
          }
        }
        // match against 'pattern' parameter
        if (pattern === null) return true
        return worthWalking(head.fullpath, patternBase)
      },
      map: async function ([head, workdir, stage]) {
        // Late filter against file names
        if (patternGlobrex && !patternGlobrex.regex.test(head.fullpath)) return
        // For now, just bail on directories
        await head.populateStat()
        if (head.type === 'tree') return
        await workdir.populateStat()
        if (workdir.type === 'tree') return
        await stage.populateStat()
        if (stage.type === 'tree') return
        // Figure out the oids, using the staged oid for the working dir oid if the stats match.
        await head.populateHash()
        await stage.populateHash()
        if (!head.exists && workdir.exists && !stage.exists) {
          // We don't actually NEED the sha. Any sha will do
          // TODO: update this logic to handle N trees instead of just 3.
          workdir.oid = 42
        } else if (workdir.exists) {
          await workdir.populateHash()
        }
        let entry = [undefined, head.oid, workdir.oid, stage.oid]
        let result = entry.map(value => entry.indexOf(value))
        result.shift() // remove leading undefined entry
        let fullpath = head.fullpath || workdir.fullpath || stage.fullpath
        return [fullpath, ...result]
      }
    })
    return results
  } catch (err) {
    err.caller = 'git.statusMatrix'
    throw err
  }
}
