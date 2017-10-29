import { fs } from '../utils'
import pify from 'pify'

const readdir = pify(fs().readdir)
const stat = pify(fs().stat)

// Based on an elegant concurrent recursive solution from SO
// https://stackoverflow.com/a/45130990/2168416
export async function readDirAsFlatFileList (dir) {
  const subdirs = await readdir(dir)
  const files = await Promise.all(
    subdirs.map(async subdir => {
      const res = dir + '/' + subdir
      return (await stat(res)).isDirectory() ? readDirAsFlatFileList(res) : res
    })
  )
  return files.reduce((a, f) => a.concat(f), [])
}
