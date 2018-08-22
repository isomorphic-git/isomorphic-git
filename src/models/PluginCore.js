import { GitError, E } from './GitError'

const pluginSchemas = {
  'fs': ['lstat', 'mkdir', 'readdir', 'readFile', 'rmdir', 'stat', 'unlink', 'writeFile']
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
  }
}
