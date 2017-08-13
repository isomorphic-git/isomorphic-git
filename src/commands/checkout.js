import pako from 'pako'
import GitObject from '../models/GitObject'
import GitCommit from '../models/GitCommit'
import GitBlob from '../models/GitBlob'
import GitTree from '../models/GitTree'
import write from '../utils/write'
import read from '../utils/read'
import resolveRef from '../utils/resolveRef'
import fs from 'fs'
import pify from 'pify'
import {Buffer} from 'buffer'

async function writeTreeToDisk({dir, dirpath, tree}) {
  for (let entry of tree) {
    let {type, object} = await GitObject.read({dir, oid: entry.oid})
    let entrypath = `${dirpath}/${entry.path}`
    console.log(`I'm writing out ${entrypath}`)
    switch (type) {
      case 'blob':
        await write(entrypath, object)
        break
      case 'tree': 
        let tree = GitTree.from(object)
        await writeTreeToDisk({dir, dirpath: entrypath, tree})
        break
      default:
        throw new Error(`Unexpected object type ${type} found in tree for '${dirpath}'`)
    }
  }
}

export default async function checkout ({dir, remote, ref}) {
  // Get tree oid
  let oid
  try {
    oid = await resolveRef({dir, ref})
  } catch (e) {
    oid = await resolveRef({dir, ref: `${remote}/${ref}`})
    await write(`${dir}/.git/refs/heads/${ref}`, oid + '\n')
  }
  var {type, object} = await GitObject.read({dir, oid})
  let comm = GitCommit.from(object.toString('utf8'))
  let sha = comm.headers().tree
  console.log('tree: ', sha)
  // Get top-level tree
  var {type, object} = await GitObject.read({dir, oid: sha})
  console.log(type, object.toString('utf8'))
  let tree = GitTree.from(object)
  // Write files. TODO: Write them atomically
  await writeTreeToDisk({dir, dirpath: dir, tree})
  // Update HEAD TODO: Handle non-branch cases
  write(`${dir}/.git/HEAD`, `ref: refs/heads/${ref}`)
}