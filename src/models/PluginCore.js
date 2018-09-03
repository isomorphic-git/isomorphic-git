import { GitError, E } from './GitError'

const pluginSchemas = {
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
  credentialManager: ['fill', 'approved', 'rejected']
}

function verifySchema (key, value) {
  if (!pluginSchemas.hasOwnProperty(key)) {
    throw new GitError(E.PluginUnrecognized, { plugin: key })
  }
  for (let method of pluginSchemas[key]) {
    if (value[method] === undefined) {
      throw new GitError(E.PluginSchemaViolation, { plugin: key, method })
    }
  }
}

export class PluginCore extends Map {
  set (key, value) {
    verifySchema(key, value)
    if (key === 'fs') {
      // There can be only one.
      super.set(key, value)
    }
    if (key === 'credentialManager') {
      // There can be only one.
      super.set(key, value)
    }
  }
  get (key) {
    if (!super.has(key)) {
      throw new GitError(E.PluginUndefined, { plugin: key })
    }
    return super.get(key)
  }
}
