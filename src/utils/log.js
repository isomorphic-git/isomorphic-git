import debug from 'debug'

let _log = null

export function log (...args) {
  // Delay instantiating the logger until first use
  // This is necessary to please the static analysis used to perform
  // tree-shaking and dead code elimination.
  if (!_log) {
    _log = debug('isomorphic-git')
    _log.log = console.log.bind(console)
  }
  _log(...args)
}
