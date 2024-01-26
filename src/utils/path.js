// This module is necessary because Webpack doesn't ship with
// a version of path-browserify that includes path.posix, yet path-browserify IS path.posix
import _path from 'path'

export const path = _path.posix === undefined ? _path : _path.posix
