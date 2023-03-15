import { BaseError } from './BaseError.js'

export class NoRefspecError extends BaseError {
  /**
   * @param {string} remote
   */
  constructor(remote) {
    super(`Could not find a fetch refspec for remote "${remote}". Make sure the config file has an entry like the following:
[remote "${remote}"]
\tfetch = +refs/heads/*:refs/remotes/origin/*
`)
    this.code = this.name = NoRefspecError.code
    this.data = { remote }
  }
}
/** @type {'NoRefspecError'} */
NoRefspecError.code = 'NoRefspecError'
