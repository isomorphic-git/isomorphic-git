import { E, GitError } from '../models/GitError'

// A collection of plugins is called a core.
// 99.99% of the time you will only need a single core,
// Because if you load isomorphic-git in an entirely new execution context
// (say a WebWorker) you'll have an entirely separate instance of the module itself
// and therefore a separate core. HOWEVER, for testing purposes, or a weird
// multi-tenant environment where you need two distinct instances of isomorphic-git's
// plugin stack but they share the same module instance - IDK maybe you are writing
// a tool that copies git objects between different filesystems so you want two
// cores with different filesystem modules. Anyway, it is architected that way.

class PluginCore extends Map {
  set (key, value) {
    const verifySchema = (key, value) => {
      // ugh. this sucks
      if (
        key === 'fs' &&
        Object.getOwnPropertyDescriptor(value, 'promises') &&
        Object.getOwnPropertyDescriptor(value, 'promises').enumerable
      ) {
        value = value.promises
      }
      const pluginSchemas = {
        credentialManager: ['fill', 'approved', 'rejected'],
        emitter: ['emit'],
        fs: [
          'lstat',
          'mkdir',
          'readdir',
          'readFile',
          'rmdir',
          'stat',
          'unlink',
          'writeFile'
        ],
        pgp: ['sign', 'verify'],
        http: []
      }
      if (!pluginSchemas.hasOwnProperty(key)) {
        throw new GitError(E.PluginUnrecognized, { plugin: key })
      }
      for (let method of pluginSchemas[key]) {
        if (value[method] === undefined) {
          throw new GitError(E.PluginSchemaViolation, { plugin: key, method })
        }
      }
    }
    verifySchema(key, value)
    // There can be only one.
    super.set(key, value)
  }
  get (key) {
    // Critical plugins throw an error instead of returning undefined.
    const critical = new Set(['credentialManager', 'fs', 'pgp'])
    if (!super.has(key) && critical.has(key)) {
      throw new GitError(E.PluginUndefined, { plugin: key })
    }
    return super.get(key)
  }
}

// 99.99% of the time you can simply import { plugins } instead of cores.
export const plugins = new PluginCore()

const _cores = new Map([['default', plugins]])

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
