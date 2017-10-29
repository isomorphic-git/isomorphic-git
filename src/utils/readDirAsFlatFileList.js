import fs from './fs'
import pify from 'pify'

// Based on an elegant concurrent recursive solution from SO
// https://stackoverflow.com/a/45130990/2168416
export async function readDirAsFlatFileList (dir) {
  const subdirs = await pify(fs().readdir)(dir)
  const files = await Promise.all(
    subdirs.map(async subdir => {
      const res = dir + '/' + subdir
      return (await pify(fs().stat)(res)).isDirectory()
        ? readDirAsFlatFileList(res)
        : res
    })
  )
  return files.reduce((a, f) => a.concat(f), [])
}
