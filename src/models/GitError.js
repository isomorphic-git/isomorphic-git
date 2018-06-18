// modeled after Therror https://github.com/therror/therror/
// but with the goal of being much lighter weight.

import nick from 'nick'
import { t } from '../utils'

const messages = {
  FileReadError: nick(t(`Could not read file "{ filepath }"`)),
  MissingRequiredParameterError: nick(t(`The function "{ function }" requires a "{ parameter }" parameter but none was provided.`)),
  InvalidRefNameError: nick(t(`Failed to { verb } { noun } "{ ref }" because that name would not be a valid git reference. A valid alternative would be "{ suggestion }".`)),
  RefExistsError: nick(t(`Failed to create { noun } "{ ref }" because { noun } "{ ref }" already exists.`)),
  NoHeadCommitError: nick(t(`Failed to create { noun } "{ ref }" because the HEAD ref could not be resolved to a commit.`))
}

export const E = {
  FileReadError: 'FileReadError',
  MissingRequiredParameterError: 'MissingRequiredParameterError',
  InvalidRefNameError: 'InvalidRefNameError',
  RefExistsError: 'RefExistsError',
  NoHeadCommitError: 'NoHeadCommitError'
}

export class GitError extends Error {
  constructor (code, data) {
    super()
    this.name = code
    this.code = code
    this.data = data
    this.message = messages[code](data || {})
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor)
  }
  toJSON () {
    return {
      code: this.code,
      data: this.data,
      caller: this.caller,
      message: this.message
    }
  }
  toString () {
    return this.stack.toString()
  }
}
