import { E, GitError } from '../models/GitError.js'

export function assertParameter(name, value) {
  if (value === undefined) {
    throw new GitError(E.MissingRequiredParameterError, {
      parameter: name,
    })
  }
}
