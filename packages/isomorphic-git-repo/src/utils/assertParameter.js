import { MissingParameterError } from '../errors/MissingParameterError.js'

export function assertParameter(name, value) {
  if (value === undefined) {
    throw new MissingParameterError(name)
  }
}
