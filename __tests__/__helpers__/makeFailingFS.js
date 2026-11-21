const eio = filepath =>
  Object.assign(new Error(`EIO: i/o error, '${filepath}'`), { code: 'EIO' })

/**
 * Wrap a fixture's raw fs so the `failingMethods` (readFile and readdir by
 * default) fail for the paths `shouldFail` selects, like a disk or network
 * error would.
 *
 * @param {any} _fs - The fixture's raw fs, as returned by makeFixture.
 * @param {(filepath: string) => boolean} shouldFail
 * @param {(filepath: string) => any} [makeError] - Defaults to an EIO error.
 * @param {string[]} [failingMethods]
 */
export function makeFailingFS(
  _fs,
  shouldFail,
  makeError = eio,
  failingMethods = ['readFile', 'readdir']
) {
  const fs = _fs.promises
  const failing =
    method =>
    async (filepath, ...args) => {
      if (typeof filepath === 'string' && shouldFail(filepath)) {
        throw makeError(filepath)
      }
      return fs[method](filepath, ...args)
    }
  const pass =
    method =>
    (...args) =>
      fs[method](...args)
  const wrap = method =>
    failingMethods.includes(method) ? failing(method) : pass(method)
  return {
    promises: {
      readFile: wrap('readFile'),
      readdir: wrap('readdir'),
      writeFile: wrap('writeFile'),
      mkdir: wrap('mkdir'),
      rmdir: wrap('rmdir'),
      unlink: wrap('unlink'),
      stat: wrap('stat'),
      lstat: wrap('lstat'),
      readlink: wrap('readlink'),
      symlink: wrap('symlink'),
      ...(fs.rm ? { rm: wrap('rm') } : {}),
    },
  }
}

/**
 * Wrap a fixture's raw fs like Chrome's File System Access write blocklist:
 * creating or writing anything at or below one of `blockedPaths` (matched as
 * path components, ignoring case) rejects with a SecurityError. Reads work.
 *
 * @param {any} _fs - The fixture's raw fs, as returned by makeFixture.
 * @param {string[]} blockedPaths - For example `['.git/hooks']`.
 */
export function makeWriteBlocklistFS(_fs, blockedPaths) {
  const isBlocked = filepath => {
    const path = filepath.replace(/\\/g, '/').toLowerCase()
    return blockedPaths.some(
      blocked => path.endsWith(`/${blocked}`) || path.includes(`/${blocked}/`)
    )
  }
  const securityError = filepath =>
    new DOMException(`Blocked write to '${filepath}'`, 'SecurityError')
  return makeFailingFS(_fs, isBlocked, securityError, ['writeFile', 'mkdir'])
}
