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

async function writeTreeToDisk({gitdir, dirpath, tree}) {
  for (let entry of tree) {
    let {type, object} = await GitObject.read({gitdir, oid: entry.oid})
    let entrypath = `${dirpath}/${entry.path}`
    console.log(`I'm writing out ${entrypath}`)
    switch (type) {
      case 'blob':
        await write(entrypath, object)
        break
      case 'tree': 
        let tree = GitTree.from(object)
        await writeTreeToDisk({gitdir, dirpath: entrypath, tree})
        break
      default:
        throw new Error(`Unexpected object type ${type} found in tree for '${dirpath}'`)
    }
  }
}

export default async function checkout ({workdir, gitdir, remote, ref}) {
  // Get tree oid
  let oid
  try {
    oid = await resolveRef({gitdir, ref})
  } catch (e) {
    oid = await resolveRef({gitdir, ref: `${remote}/${ref}`})
    await write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
  }
  var {type, object} = await GitObject.read({gitdir, oid})
  let comm = GitCommit.from(object.toString('utf8'))
  let sha = comm.headers().tree
  console.log('tree: ', sha)
  // Get top-level tree
  var {type, object} = await GitObject.read({gitdir, oid: sha})
  console.log(type, object.toString('utf8'))
  let tree = GitTree.from(object)
  // Write files. TODO: Write them atomically
  await writeTreeToDisk({gitdir, dirpath: workdir, tree})
  // Update HEAD TODO: Handle non-branch cases
  write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`)
}