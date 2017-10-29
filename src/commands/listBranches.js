import { fs, read, readDirAsFlatFileList } from '../utils'
import pify from 'pify'

// Note: this function will get more interesting once we add support for
// packed-refs.
export async function listBranches ({ gitdir }) {
  let files = await readDirAsFlatFileList(`${gitdir}/refs/heads`)
  files = files.map(x => x.replace(`${gitdir}/refs/heads/`, ''))
  let text = await read(`${gitdir}/packed-refs`, { encoding: 'utf8' })
  if (text) {
    let refs = text
      .trim()
      .split('\n')
      .filter(x => x.includes('refs/heads'))
      .map(x => x.replace(/^.+ refs\/heads\//, '').trim())
      .filter(x => !files.includes(x)) // remove duplicates
    files = files.concat(refs)
  }
  return files
}
