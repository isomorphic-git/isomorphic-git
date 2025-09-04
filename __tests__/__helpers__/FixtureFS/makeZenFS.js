import {
  configureSingle,
  CopyOnWrite,
  Fetch,
  InMemory,
  fs as _fs,
} from '@zenfs/core'

const { FileSystem } = require('isomorphic-git/internal-apis')

async function makeZenFS(dir) {
  const index = require('../../__fixtures__/index.json')
  await configureSingle({
    backend: CopyOnWrite,
    readable: {
      backend: Fetch,
      index,
      baseUrl: '/base/__tests__/__fixtures__/',
    },
    writable: InMemory,
  })

  const fs = new FileSystem(_fs)

  dir = `/${dir}`
  const gitdir = `/${dir}.git`
  await fs.mkdir(dir)
  await fs.mkdir(gitdir)
  return {
    _fs,
    fs,
    dir,
    gitdir,
  }
}

module.exports.makeZenFS = makeZenFS
