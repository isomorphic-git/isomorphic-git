// modeled after Therror https://github.com/therror/therror/
// but with the goal of being much lighter weight.

import nick from 'nick'

import { t } from '../utils'

const translate = obj => {
  for (const [key, value] of Object.entries(obj)) {
    obj[key] = nick(t(value))
  }
  return obj
}

const messages = translate({
  FileReadError: `Could not read file "{ filepath }".`,
  MissingRequiredParameterError: `The function "{ function }" requires a "{ parameter }" parameter but none was provided.`,
  InvalidRefNameError: `Failed to { verb } { noun } "{ ref }" because that name would not be a valid git reference. A valid alternative would be "{ suggestion }".`,
  RefExistsError: `Failed to create { noun } "{ ref }" because { noun } "{ ref }" already exists.`,
  NoHeadCommitError: `Failed to create { noun } "{ ref }" because the HEAD ref could not be resolved to a commit.`,
  CommitNotFetchedError: `Failed to checkout "{ ref }" because commit { oid } is not available locally. Do a git fetch to make the branch available locally.`,
  ObjectTypeAssertionFail: `Object { oid } was anticipated to be a { expected } but it is a { type }. This is probably a bug deep in isomorphic-git!`,
  ObjectTypeAssertionInTreeFail: `Object { oid } in tree for "{ entrypath }" was an unexpected object type "{ type }".`,
  MissingAuthorError: `Author name and email must be specified as an argument or in the .git/config file.`,
  GitRootNotFoundError: `Unable to find git root for { filepath }.`,
  UnparseableServerResponseFail: `Unparsable response from server! Expected "unpack ok" or "unpack [error message]" but received "{ line }".`
})

export const E = {
  FileReadError: 'FileReadError',
  MissingRequiredParameterError: 'MissingRequiredParameterError',
  InvalidRefNameError: 'InvalidRefNameError',
  RefExistsError: 'RefExistsError',
  NoHeadCommitError: 'NoHeadCommitError',
  CommitNotFetchedError: 'CommitNotFetchedError',
  ObjectTypeAssertionFail: 'ObjectTypeAssertionFail',
  ObjectTypeAssertionInTreeFail: 'ObjectTypeAssertionInTreeFail',
  MissingAuthorError: 'MissingAuthorError',
  GitRootNotFoundError: 'GitRootNotFoundError',
  UnparseableServerResponseFail: 'UnparseableServerResponseFail'
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
