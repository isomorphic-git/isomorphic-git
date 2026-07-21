import {
  fs as _fs,
  configureSingle,
  CopyOnWrite,
  Fetch,
  InMemory,
} from '@zenfs/core'
import { FileSystem } from 'isomorphic-git/internal-apis'

export async function makeZenFS(dir) {
  // Use a dynamic import instead of `require` (this is an ES module). Kept inside
  // the function — and eagerly inlined by webpack — so it is only evaluated in the
  // browser, where `makeZenFS` is actually called.
  const { default: index } = await import(
    /* webpackMode: "eager" */ '../../__fixtures__/index.json'
  )
  await configureSingle({
    backend: CopyOnWrite,
    readable: {
      backend: Fetch,
      index,
      // ZenFS' Fetch backend builds request URLs with `new URL()`, which requires
      // an absolute base. Karma serves the fixtures under `/base/…` on its own
      // origin, so anchor the base URL to it.
      baseUrl: `${globalThis.location.origin}/base/__tests__/__fixtures__/`,
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
