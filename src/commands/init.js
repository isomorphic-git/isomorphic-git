import { write, mkdirs, fs as defaultfs, setfs } from '../utils'

export async function init ({ gitdir, fs = defaultfs() }) {
  setfs(fs)
  let folders = [
    'hooks',
    'info',
    'objects/info',
    'objects/pack',
    'refs/heads',
    'refs/tags'
  ]
  folders = folders.map(dir => gitdir + '/' + dir)
  await mkdirs(folders)
  await write(
    gitdir + '/config',
    '[core]\n' +
      '\trepositoryformatversion = 0\n' +
      '\tfilemode = false\n' +
      '\tbare = false\n' +
      '\tlogallrefupdates = true\n' +
      '\tsymlinks = false\n' +
      '\tignorecase = true\n'
  )
  await write(gitdir + '/HEAD', 'ref: refs/heads/master\n')
  // await write(gitdir + '/refs/heads/master', '')
}
