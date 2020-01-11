const pify = require('pify')

const { cores, plugins } = require('isomorphic-git')
const { FileSystem } = require('isomorphic-git/internal-apis')

let i = 0

let browserFS = null
let browserFSwritable = null
async function makeBrowserFS (dir) {
  if (browserFS === null) {
    const BrowserFS = require('browserfs')
    const HTTPRequestFS = pify(BrowserFS.FileSystem.HTTPRequest.Create)
    const InMemoryFS = pify(BrowserFS.FileSystem.InMemory.Create)
    const OverlayFS = pify(BrowserFS.FileSystem.OverlayFS.Create)
    const index = require('../../__fixtures__/index.json')
    const readable = await HTTPRequestFS({
      index,
      baseUrl: '/base/__tests__/__fixtures__/'
    })
    const writable = await InMemoryFS()
    const ofs = await OverlayFS({ readable, writable })
    BrowserFS.initialize(ofs)
    browserFS = BrowserFS.BFSRequire('fs')
    browserFSwritable = writable
  }
  const _fs = Object.assign({}, browserFS)
  browserFSwritable.empty()

  const core = `core-browserfs-${i++}`
  cores.create(core).set('fs', _fs)
  plugins.set('fs', _fs) // deprecated

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
    core
  }
}

module.exports.makeBrowserFS = makeBrowserFS
