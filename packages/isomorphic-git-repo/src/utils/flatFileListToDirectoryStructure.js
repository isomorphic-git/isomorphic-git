import { basename } from '../utils/basename.js'
import { dirname } from '../utils/dirname.js'

/*::
type Node = {
  type: string,
  fullpath: string,
  basename: string,
  metadata: Object, // mode, oid
  parent?: Node,
  children: Array<Node>
}
*/

export function flatFileListToDirectoryStructure(files) {
  const inodes = new Map()
  const mkdir = function(name) {
    if (!inodes.has(name)) {
      const dir = {
        type: 'tree',
        fullpath: name,
        basename: basename(name),
        metadata: {},
        children: [],
      }
      inodes.set(name, dir)
      // This recursively generates any missing parent folders.
      // We do it after we've added the inode to the set so that
      // we don't recurse infinitely trying to create the root '.' dirname.
      dir.parent = mkdir(dirname(name))
      if (dir.parent && dir.parent !== dir) dir.parent.children.push(dir)
    }
    return inodes.get(name)
  }

  const mkfile = function(name, metadata) {
    if (!inodes.has(name)) {
      const file = {
        type: 'blob',
        fullpath: name,
        basename: basename(name),
        metadata: metadata,
        // This recursively generates any missing parent folders.
        parent: mkdir(dirname(name)),
        children: [],
      }
      if (file.parent) file.parent.children.push(file)
      inodes.set(name, file)
    }
    return inodes.get(name)
  }

  mkdir('.')
  for (const file of files) {
    mkfile(file.path, file)
  }
  return inodes
}
