import pako from 'pako'
import GitObject from '../models/GitObject'
import GitCommit from '../models/GitCommit'
import GitBlob from '../models/GitBlob'
import GitTree from '../models/GitTree'
import commitSha from '../utils/commitSha'
import wrapCommit from '../utils/wrapCommit'
import unwrapObject from '../utils/unwrapObject'
import write from '../utils/write'
import read from '../utils/read'
import resolveRef from '../utils/resolveRef'
import fs from 'fs'
import pify from 'pify'
import {Buffer} from 'buffer'

async function checkoutTree({dir, oid}) {

  let {type, object} = await GitObject.read({dir, oid})
  console.log(type, object.toString('utf8'))

}

export default async function checkout ({dir, remote, ref}) {
  // Get tree
  try {
    ref = await resolveRef({dir, ref})
  } catch (e) {
    ref = await resolveRef({dir, ref: `${remote}/${ref}`})
  }
  let {type, object} = await GitObject.read({dir, oid: ref})
  let comm = GitCommit.from(object.toString('utf8'))
  let sha = comm.headers().tree
  console.log('tree: ', sha)
  // Get objects + recurse
  await checkoutTree({dir, oid: sha})
  // Write files. Preferably atomically.
  
}