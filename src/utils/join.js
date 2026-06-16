/*!
 * This code for `path.join` is directly copied from @zenfs/core/path for bundle size improvements.
 * SPDX-License-Identifier: LGPL-3.0-or-later
 * Copyright (c) James Prevett and other ZenFS contributors.
 *
 * Windows support added:
 *   - Backslashes are normalised to forward slashes before processing.
 *   - Drive-letter prefixes (e.g. "C:") are detected and preserved through
 *     normalisation, so absolute Windows paths are handled correctly.
 *   - An absolute argument passed to join() resets the accumulated path,
 *     matching Node behaviour and handling worktree gitdir paths properly.
 *
 * Limitation: UNC paths (e.g. \\server\share) are not supported. The leading
 *   backslashes are normalised to forward slashes and then collapsed by
 *   normalizeString, losing the UNC root. Git on Windows works with
 *   drive-letter paths, so this is not expected to be a practical issue.
 */

function normalizeString(path, aar) {
  let res = ''
  let lastSegmentLength = 0
  let lastSlash = -1
  let dots = 0
  let char = '\x00'
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) char = path[i]
    else if (char === '/') break
    else char = '/'

    if (char === '/') {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.at(-1) !== '.' ||
          res.at(-2) !== '.'
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf('/')
            if (lastSlashIndex === -1) {
              res = ''
              lastSegmentLength = 0
            } else {
              res = res.slice(0, lastSlashIndex)
              lastSegmentLength = res.length - 1 - res.lastIndexOf('/')
            }
            lastSlash = i
            dots = 0
            continue
          } else if (res.length !== 0) {
            res = ''
            lastSegmentLength = 0
            lastSlash = i
            dots = 0
            continue
          }
        }
        if (aar) {
          res += res.length > 0 ? '/..' : '..'
          lastSegmentLength = 2
        }
      } else {
        if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i)
        else res = path.slice(lastSlash + 1, i)
        lastSegmentLength = i - lastSlash - 1
      }
      lastSlash = i
      dots = 0
    } else if (char === '.' && dots !== -1) {
      ++dots
    } else {
      dots = -1
    }
  }
  return res
}

// Returns the Windows drive prefix ("C:") if present, otherwise null.
function getWindowsDrivePrefix(path) {
  if (path.length >= 2 && /^[a-zA-Z]:/.test(path)) {
    return path.slice(0, 2) // e.g. "C:"
  }
  return null
}

function normalize(path) {
  if (!path.length) return '.'

  // Normalise backslashes to forward slashes before any other processing.
  path = path.replace(/\\/g, '/')

  const drivePrefix = getWindowsDrivePrefix(path)
  // isAbsolute: Unix root ('/foo') OR Windows drive+slash ('C:/foo').
  const isAbsolute =
    path[0] === '/' || (drivePrefix !== null && path[2] === '/')
  const trailingSeparator = path.at(-1) === '/'

  // Strip the drive prefix before feeding into normalizeString so that the
  // core algorithm only ever sees a plain POSIX-style string.
  const pathBody = drivePrefix ? path.slice(2) : path

  let normalized = normalizeString(pathBody, !isAbsolute)

  if (!normalized.length) {
    const root = drivePrefix
      ? isAbsolute
        ? drivePrefix + '/'
        : drivePrefix
      : isAbsolute
        ? '/'
        : '.'
    return trailingSeparator && !isAbsolute ? root + '/' : root
  }
  if (trailingSeparator) normalized += '/'

  if (drivePrefix) {
    return isAbsolute
      ? `${drivePrefix}/${normalized}`
      : `${drivePrefix}${normalized}`
  }
  return isAbsolute ? `/${normalized}` : normalized
}

export function join(...args) {
  if (args.length === 0) return '.'
  let joined
  for (let i = 0; i < args.length; ++i) {
    // Normalise separators before processing.
    const arg = args[i].replace(/\\/g, '/')
    if (arg.length === 0) continue

    // A Windows drive-letter path (e.g. "C:/worktrees/foo") cannot be
    // meaningfully appended to any base, so it resets the accumulator.
    // Unix absolute paths (leading '/') are NOT reset here — that would be
    // path.resolve() semantics; path.join('foo', '/bar') must yield 'foo/bar'.
    if (/^[a-zA-Z]:\//.test(arg)) {
      joined = arg
    } else {
      if (joined === undefined) joined = arg
      else joined += '/' + arg
    }
  }
  if (joined === undefined) return '.'
  return normalize(joined)
}
