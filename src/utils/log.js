import debug from 'debug'

export const log = debug('isomorphic-git')

log.log = console.log.bind(console)
