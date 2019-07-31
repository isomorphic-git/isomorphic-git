const { cores, plugins } = require('isomorphic-git')
const { FileSystem } = require('isomorphic-git/internal-apis')

let i = 0;

async function makeLightningFS (dir) {
  const FS = require('@isomorphic-git/lightning-fs')
  const _fs = new FS(`testfs`, {
    wipe: true,
    url: 'http://localhost:9876/base/__tests__/__fixtures__'
  })
  const core = `core-lightningfs-${i++}`
  cores.create(core).set('fs', {..._fs})
  plugins.set('fs', {..._fs}) // deprecated
  const fs = new FileSystem({..._fs})
  dir = `/${dir}`
  let gitdir = `/${dir}.git`
  await fs.mkdir(dir)
  await fs.mkdir(gitdir)
  return { _fs, fs, dir, gitdir, core }
}

module.exports.makeLightningFS = makeLightningFS
