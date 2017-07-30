//@flow
import fs from 'fs'
import pify from 'pify'
import path from 'path'
import write from 'write'
import mkdirp from 'mkdirp'

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
  await Promise.all(folders.map(x => pify(mkdirp)(x)))
  await write.promise(dirpath + '/.git/config', `[core]
  	repositoryformatversion = 0
  	filemode = false
  	bare = false
  	logallrefupdates = true
  	symlinks = false
  	ignorecase = true
`)
  await write.promise(dirpath + '/.git/HEAD', `ref: refs/heads/master
`)

}
