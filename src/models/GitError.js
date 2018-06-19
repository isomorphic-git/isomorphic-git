// modeled after Therror https://github.com/therror/therror/
// but with the goal of being much lighter weight.

import nick from 'nick'
import { t } from '../utils'

const messages = {
  FileReadError: nick(t(`Could not read file "{ filepath }".`)),
  MissingRequiredParameterError: nick(t(`The function "{ function }" requires a "{ parameter }" parameter but none was provided.`)),
  InvalidRefNameError: nick(t(`Failed to { verb } { noun } "{ ref }" because that name would not be a valid git reference. A valid alternative would be "{ suggestion }".`)),
  RefExistsError: nick(t(`Failed to create { noun } "{ ref }" because { noun } "{ ref }" already exists.`)),
  NoHeadCommitError: nick(t(`Failed to create { noun } "{ ref }" because the HEAD ref could not be resolved to a commit.`)),
  CommitNotFetchedError: nick(t(`Failed to checkout "{ ref }" because commit { oid } is not available locally. Do a git fetch to make the branch available locally.`)),
  ObjectTypeAssertionFail: nick(t(`Object { oid } was anticipated to be a { expected } but it is a { type }. This is probably a bug deep in isomorphic-git!`)),
  ObjectTypeAssertionInTreeFail: nick(t(`Object { oid } in tree for "{ entrypath }" was an unexpected object type "{ type }".`))
}

export const E = {
  FileReadError: 'FileReadError',
  MissingRequiredParameterError: 'MissingRequiredParameterError',
  InvalidRefNameError: 'InvalidRefNameError',
  RefExistsError: 'RefExistsError',
  NoHeadCommitError: 'NoHeadCommitError',
  CommitNotFetchedError: 'CommitNotFetchedError',
  ObjectTypeAssertionFail: 'ObjectTypeAssertionFail',
  ObjectTypeAssertionInTreeFail: 'ObjectTypeAssertionInTreeFail'
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
