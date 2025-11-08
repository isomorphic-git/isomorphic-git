/*!
 * This code for `path.join` is directly copied from @zenfs/core/path for bundle size improvements.
 * SPDX-License-Identifier: LGPL-3.0-or-later
 * Copyright (c) James Prevett and other ZenFS contributors.
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

function normalize(path) {
  if (!path.length) return '.'

  const isAbsolute = path[0] === '/'
  const trailingSeparator = path.at(-1) === '/'

  path = normalizeString(path, !isAbsolute)

  if (!path.length) {
    if (isAbsolute) return '/'
    return trailingSeparator ? './' : '.'
  }
  if (trailingSeparator) path += '/'

  return isAbsolute ? `/${path}` : path
}

export function join(...args) {
  if (args.length === 0) return '.'
  let joined
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]
    if (arg.length > 0) {
      if (joined === undefined) joined = arg
      else joined += '/' + arg
    }
  }
  if (joined === undefined) return '.'
  return normalize(joined)
}
