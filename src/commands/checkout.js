import GitCommit from '../models/GitCommit'
import GitTree from '../models/GitTree'
import GitObjectManager from '../managers/GitObjectManager'
import { write } from '../utils/write'
import { resolveRef } from '../utils/resolveRef'

async function writeTreeToDisk ({ gitdir, dirpath, tree }) {
  for (let entry of tree) {
    let { type, object } = await GitObjectManager.read({
      gitdir,
      oid: entry.oid
    })
    let entrypath = `${dirpath}/${entry.path}`
    switch (type) {
      case 'blob':
        await write(entrypath, object)
        break
      case 'tree':
        let tree = GitTree.from(object)
        await writeTreeToDisk({ gitdir, dirpath: entrypath, tree })
        break
      default:
        throw new Error(
          `Unexpected object type ${type} found in tree for '${dirpath}'`
        )
    }
  }
}

export async function checkout ({ workdir, gitdir, remote, ref }) {
  // Get tree oid
  let oid
  try {
    oid = await resolveRef({ gitdir, ref })
  } catch (e) {
    oid = await resolveRef({ gitdir, ref: `${remote}/${ref}` })
    await write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
  }
  let commit = await GitObjectManager.read({ gitdir, oid })
  if (commit.type !== 'commit') {
    throw new Error(`Unexpected type: ${commit.type}`)
  }
  let comm = GitCommit.from(commit.object.toString('utf8'))
  let sha = comm.headers().tree
  // Get top-level tree
  let { type, object } = await GitObjectManager.read({ gitdir, oid: sha })
  if (type !== 'tree') throw new Error(`Unexpected type: ${type}`)
  let tree = GitTree.from(object)
  // Write files. TODO: Write them atomically
  await writeTreeToDisk({ gitdir, dirpath: workdir, tree })
  // Update HEAD TODO: Handle non-branch cases
  write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`)
}
