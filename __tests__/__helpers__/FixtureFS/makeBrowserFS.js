const pify = require('pify')

const { plugins } = require('isomorphic-git')
const { FileSystem } = require('isomorphic-git/internal-apis')

let browserFS = null
let browserFSwritable = null
async function makeBrowserFS (dir) {
  // This is all in a conditional so that Jest won't attempt to
  // instrument BrowserFS with coverage collection which slows
  // it down in Travis to >10min which causes Travis builds to fail.
  if (process.browser) {
    if (browserFS === null) {
      const BrowserFS = require('browserfs')
      const HTTPRequestFS = pify(BrowserFS.FileSystem.HTTPRequest.Create)
      const InMemoryFS = pify(BrowserFS.FileSystem.InMemory.Create)
      const OverlayFS = pify(BrowserFS.FileSystem.OverlayFS.Create)
      const index = require('../../__fixtures__/index.json')
      let readable = await HTTPRequestFS({
        index,
        baseUrl: 'http://localhost:9876/base/__tests__/__fixtures__/'
      })
      let writable = await InMemoryFS()
      let ofs = await OverlayFS({ readable, writable })
      BrowserFS.initialize(ofs)
      browserFS = BrowserFS.BFSRequire('fs')
      browserFSwritable = writable
    }
    const _fs = browserFS
    browserFSwritable.empty()
    plugins.set('fs', _fs)
    const fs = new FileSystem(_fs)
    dir = `/${dir}`
    let gitdir = `/${dir}.git`
    await fs.mkdir(dir)
    await fs.mkdir(gitdir)
    return {
      _fs,
      fs,
      dir,
      gitdir
    }
  }
}

module.exports.makeBrowserFS = makeBrowserFS
