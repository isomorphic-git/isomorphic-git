// @ts-check

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _walk } from '../commands/walk.js'
import { InternalError } from '../errors/InternalError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { readObjectLoose } from '../storage/readObjectLoose.js'
import { _writeObject } from '../storage/writeObject'

import { join } from './join.js'
import { posixifyPathBuffer } from './posixifyPathBuffer.js'

async function mapFuncBase(filepath, [A, B], typeCondition, mixinFunc) {
  // ignore directories
  if (filepath === '.') {
    return
  }
  const aType = A ? await A.type() : ''
  const bType = B ? await B.type() : ''

  if (!typeCondition(aType, bType)) {
    return
  }

  // generate object ids
  const aObjId = A ? await A.oid() : undefined
  const bObjId = B ? await B.oid() : undefined

  // determine modification type
  let type = 'equal'
  if (aObjId !== bObjId) {
    type = 'modify'
  }
  if (aObjId === undefined) {
    type = 'add'
  }
  if (bObjId === undefined) {
    type = 'remove'
  }
  if (aObjId === undefined && bObjId === undefined) {
    type = 'unknown' // this should never happen
    return
  }

  if (!(await mixinFunc(type, filepath, aObjId))) {
    return
  }

  const mode = await A.mode()
  return {
    mode: mode.toString(8),
    path: filepath,
    oid: aObjId || '',
    type: aType,
  }
}

function typeConditionDefault(aType, bType) {
  if (aType === 'special' || bType === 'special') {
    return false
  }
  return !(aType === 'commit' || bType === 'commit')
}

async function writeBlobByFile(fs, gitdir, dir, filepath, oid = null) {
  const currentFilepath = join(dir, filepath)
  const stats = await fs.lstat(currentFilepath)
  if (!stats) throw new NotFoundError(currentFilepath)
  if (stats.isDirectory())
    throw new InternalError(
      `${currentFilepath}: file expected, but found directory`
    )

  // Look for it in the loose object directory.
  const objContent = oid
    ? await readObjectLoose({ fs, gitdir, oid })
    : undefined
  let retOid = objContent ? oid : undefined
  if (!objContent) {
    const object = stats.isSymbolicLink()
      ? await fs.readlink(currentFilepath).then(posixifyPathBuffer)
      : await fs.read(currentFilepath)

    if (object === null) throw new NotFoundError(currentFilepath)

    retOid = await _writeObject({ fs, gitdir, type: 'blob', object })
    if (retOid !== oid && oid !== null) {
      throw new InternalError(
        `SHA check failed: Expected ${oid}, created ${retOid}`
      )
    }
  }

  return retOid
}

export async function getTreeObjArrayStage(fs, dir, gitdir) {
  let hasStagedChanges = false
  const mapFuncStaged = async (filepath, [A, B]) => {
    const mixinStaged = async (type, _filepath, aObjId) => {
      if (aObjId === undefined || type === 'remove') {
        return false
      }

      if (!hasStagedChanges && type !== 'equal') {
        hasStagedChanges = true // yeah, I know, this is a side effect, leave it for now, only internal to this function
      }
      return true
    }

    return mapFuncBase(filepath, [A, B], typeConditionDefault, mixinStaged)
  }

  const indexTreeObj = await _walk({
    fs,
    cache: {},
    dir,
    gitdir,
    trees: [STAGE(), TREE({ ref: 'HEAD' })],
    map: mapFuncStaged,
  })

  return hasStagedChanges ? indexTreeObj : []
}

export async function getTreeObjArrayWorkDir(
  fs,
  dir,
  gitdir,
  workDirCompareBase
) {
  let hasWorkingChanges = false

  const mapFuncWorkDir = async (filepath, [A, B]) => {
    const mixinWorkDir = async (type, filepath, aObjId) => {
      if (type === 'remove') {
        return false
      }

      if (type !== 'equal') {
        // needs to make sure the blob object exists
        await writeBlobByFile(fs, gitdir, dir, filepath, aObjId)
        hasWorkingChanges = true
      }
      return true
    }
    return mapFuncBase(filepath, [A, B], typeConditionDefault, mixinWorkDir)
  }

  const workTreeObj = await _walk({
    fs,
    cache: {},
    dir,
    gitdir,
    trees: [WORKDIR(), workDirCompareBase],
    map: mapFuncWorkDir,
  })

  return hasWorkingChanges ? workTreeObj : []
}
