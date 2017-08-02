//@flow
import write from '../utils/write'
import {mkdir, mkdirs} from '../utils/mkdirs'

export default async function init (dirpath /*: string */) {
  let folders = [
    '.git/hooks',
    '.git/info',
    '.git/objects/info',
    '.git/objects/pack',
    '.git/refs/heads',
    '.git/refs/tags',
  ]
  folders = folders.map(dir => dirpath + '/' + dir)
  await mkdirs(folders)
  await write(dirpath + '/.git/config', `[core]
  	repositoryformatversion = 0
  	filemode = false
  	bare = false
  	logallrefupdates = true
  	symlinks = false
  	ignorecase = true
`)
  await write(dirpath + '/.git/HEAD', `ref: refs/heads/master
`)

}
