// modeled after Therror https://github.com/therror/therror/
// but with the goal of being much lighter weight.

import nick from 'nick'
import { t } from '../utils'

const messages = {
  FileReadError: nick(t(`Could not read file "{ filepath }"`))
}

export const E = {
  FileReadError: 'FileReadError'
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
      message: this.message
    }
  }
  toString () {
    return this.stack.toString()
  }
}
