import { E, GitError } from '../models/GitError.js'
import { PluginCore } from '../models/PluginCore.js'

// A collection of plugins is called a core.
// 99.99% of the time you will only need a single core,
// Because if you load isomorphic-git in an entirely new execution context
// (say a WebWorker) you'll have an entirely separate instance of the module itself
// and therefore a separate core. HOWEVER, for testing purposes, or a weird
// multi-tenant environment where you need two distinct instances of isomorphic-git's
// plugin stack but they share the same module instance - IDK maybe you are writing
// a tool that copies git objects between different filesystems so you want two
// cores with different filesystem modules. Anyway, it is architected that way.
const _cores = new Map()
const defaultCore = new PluginCore()
_cores.set('default', defaultCore)
// 99.99% of the time you can simply import { plugins } instead of cores.
export const plugins = defaultCore

export const cores = {
  // 'get' validates that a core has been registered
  get (key) {
    if (_cores.has(key)) {
      return _cores.get(key)
    } else {
      throw new GitError(E.CoreNotFound, { core: key })
    }
  },
  // 'create' works just like get but will create the core if it doesn't exist yet
  create (key) {
    if (_cores.has(key)) {
      return _cores.get(key)
    } else {
      _cores.set(key, new Map())
      return _cores.get(key)
    }
  }
}
