import { FileSystem } from 'isomorphic-git/internal-apis'
import pify from 'pify'

let browserFS = null
let browserFSwritable = null

export async function makeBrowserFS(dir) {
  if (browserFS === null) {
    const BrowserFS = await import('browserfs')
    const HTTPRequestFS = pify(BrowserFS.FileSystem.HTTPRequest.Create)
    const InMemoryFS = pify(BrowserFS.FileSystem.InMemory.Create)
    const OverlayFS = pify(BrowserFS.FileSystem.OverlayFS.Create)
    const index = await import('../../__fixtures__/index.json')
    const readable = await HTTPRequestFS({
      index,
      baseUrl: '/base/__tests__/__fixtures__/',
    })
    const writable = await InMemoryFS()
    const ofs = await OverlayFS({ readable, writable })
    BrowserFS.initialize(ofs)
    browserFS = BrowserFS.BFSRequire('fs')
    browserFSwritable = writable
  }
  const _fs = Object.assign({}, browserFS)
  browserFSwritable.empty()

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
