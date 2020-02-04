import { E, GitError } from '../models/GitError.js'

export function assertParameter (caller, name, value) {
  if (value === void 0) {
    throw new GitError(E.MissingRequiredParameterError, {
      function: caller,
      parameter: name
    })
  }
}
