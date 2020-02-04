import { E, GitError } from '../models/GitError.js'

export function assertParameter (name, value) {
  if (value === void 0) {
    throw new GitError(E.MissingRequiredParameterError, {
      parameter: name
    })
  }
}
