// @flow
import write from '../utils/write'
import { mkdirs } from '../utils/mkdirs'

export default async function init (dirpath /*: string */) {
  let folders = [
    '.git/hooks',
    '.git/info',
    '.git/objects/info',
    '.git/objects/pack',
    '.git/refs/heads',
    '.git/refs/tags'
  ]
  folders = folders.map(dir => dirpath + '/' + dir)
  await mkdirs(folders)
  await write(
    dirpath + '/.git/config',
    '[core]\n' +
      '\trepositoryformatversion = 0\n' +
      '\tfilemode = false\n' +
      '\tbare = false\n' +
      '\tlogallrefupdates = true\n' +
      '\tsymlinks = false\n' +
      '\tignorecase = true\n'
  )
  await write(dirpath + '/.git/HEAD', 'ref: refs/heads/master\n')
}
