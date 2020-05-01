import { MissingParameterError } from 'errors/MissingParameterError'

export function assertParameter(name, value) {
  if (value === undefined) {
    throw new MissingParameterError(name)
  }
}
