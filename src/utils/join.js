/*!
 * The POSIX core below - `assertPath`, `normalizeStringPosix` and the body of
 * `normalize` - comes from path-browserify, which extracted it from Node.js.
 * Reformatted to this project's style (`const`/`let`, no semicolons); the
 * algorithm is unchanged.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2013 James Halliday
 * Copyright Joyent, Inc. and other Node contributors.
 *
 * @see https://github.com/browserify/path-browserify
 *
 * The Windows handling is this project's own, added in #2302. path-browserify
 * is the POSIX part of `path` only, so `normalize` and `join` are wrapped with:
 *   - Backslashes are normalised to forward slashes before processing.
 *   - Drive-letter prefixes (e.g. "C:") are detected and preserved through
 *     normalisation, so absolute Windows paths are handled correctly.
 *   - A drive-letter argument passed to join() resets the accumulated path,
 *     matching Node behaviour and handling worktree gitdir paths properly.
 *
 * Limitation: UNC paths (e.g. \\server\share) are not supported. The leading
 *   backslashes are normalised to forward slashes and then collapsed by
 *   normalizeStringPosix, losing the UNC root. Git on Windows works with
 *   drive-letter paths, so this is not expected to be a practical issue.
 */

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError(
      'Path must be a string. Received ' + JSON.stringify(path)
    )
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  let res = ''
  let lastSegmentLength = 0
  let lastSlash = -1
  let dots = 0
  let code
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i)
    else if (code === 47 /* / */) break
    else code = 47 /* / */
    if (code === 47 /* / */) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== 46 /* . */ ||
          res.charCodeAt(res.length - 2) !== 46 /* . */
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf('/')
            if (lastSlashIndex !== res.length - 1) {
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
            }
          } else if (res.length === 2 || res.length === 1) {
            res = ''
            lastSegmentLength = 0
            lastSlash = i
            dots = 0
            continue
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += '/..'
          else res = '..'
          lastSegmentLength = 2
        }
      } else {
        if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i)
        else res = path.slice(lastSlash + 1, i)
        lastSegmentLength = i - lastSlash - 1
      }
      lastSlash = i
      dots = 0
    } else if (code === 46 /* . */ && dots !== -1) {
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
  assertPath(path)

  if (path.length === 0) return '.'

  // Normalise backslashes to forward slashes before any other processing.
  path = path.replace(/\\/g, '/')

  const drivePrefix = getWindowsDrivePrefix(path)
  // isAbsolute: Unix root ('/foo') OR Windows drive+slash ('C:/foo').
  const isAbsolute =
    path.charCodeAt(0) === 47 /* / */ ||
    (drivePrefix !== null && path.charCodeAt(2) === 47) /* / */
  const trailingSeparator = path.charCodeAt(path.length - 1) === 47 /* / */

  // Strip the drive prefix before normalizing so that the core algorithm only
  // ever sees a plain POSIX-style string.
  let normalized = normalizeStringPosix(
    drivePrefix ? path.slice(2) : path,
    !isAbsolute
  )

  if (normalized.length === 0 && !isAbsolute) normalized = '.'
  if (normalized.length > 0 && trailingSeparator) normalized += '/'

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
    assertPath(args[i])
    // Normalise separators before processing.
    const arg = args[i].replace(/\\/g, '/')
    if (arg.length === 0) continue

    // A Windows drive-letter path (e.g. "C:/worktrees/foo") cannot be
    // meaningfully appended to any base, so it resets the accumulator.
    // Unix absolute paths (leading '/') are NOT reset here - that would be
    // path.resolve() semantics; path.join('foo', '/bar') must yield 'foo/bar'.
    if (/^[a-zA-Z]:\//.test(arg)) {
      joined = arg
    } else if (joined === undefined) {
      joined = arg
    } else {
      joined += '/' + arg
    }
  }
  if (joined === undefined) return '.'
  return normalize(joined)
}
