const eio = filepath =>
  Object.assign(new Error(`EIO: i/o error, '${filepath}'`), { code: 'EIO' })

/**
 * Wrap a fixture's raw fs so readFile and readdir fail for the paths
 * `shouldFail` selects, like a disk or network error would.
 *
 * @param {any} _fs - The fixture's raw fs, as returned by makeFixture.
 * @param {(filepath: string) => boolean} shouldFail
 * @param {(filepath: string) => any} [makeError] - Defaults to an EIO error.
 */
export function makeFailingFS(_fs, shouldFail, makeError = eio) {
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
  return {
    promises: {
      readFile: failing('readFile'),
      readdir: failing('readdir'),
      writeFile: pass('writeFile'),
      mkdir: pass('mkdir'),
      rmdir: pass('rmdir'),
      unlink: pass('unlink'),
      stat: pass('stat'),
      lstat: pass('lstat'),
      readlink: pass('readlink'),
      symlink: pass('symlink'),
      ...(fs.rm ? { rm: pass('rm') } : {}),
    },
  }
}
