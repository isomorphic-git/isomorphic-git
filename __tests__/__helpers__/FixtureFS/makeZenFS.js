const { FileSystem } = require('isomorphic-git/internal-apis')

async function makeZenFS(dir) {
  const ZenFS = await import('@zenfs/core')
  const index = require('../../__fixtures__/index.json')
  await ZenFS.configureSingle({
    backend: ZenFS.Overlay,
    readable: ZenFS.Fetch.create({
      index,
      baseUrl: '/base/__tests__/__fixtures__/',
    }),
    writable: ZenFS.InMemory.create({}),
  })

  const fs = new FileSystem(ZenFS.fs)

  dir = `/${dir}`
  const gitdir = `/${dir}.git`
  await fs.mkdir(dir)
  await fs.mkdir(gitdir)
  return {
    _fs: ZenFS.fs,
    fs,
    dir,
    gitdir,
  }
}

module.exports.makeZenFS = makeZenFS
