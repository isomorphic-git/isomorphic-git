export class BaseError extends Error {
  constructor(message) {
    super(message)
    // Setting this here allows TS to infer that all git errors have a `caller` property and
    // that its type is string.
    this.caller = ''
  }

  toJSON() {
    // Error objects aren't normally serializable. So we do something about that.
    return {
      code: this.code,
      data: this.data,
      caller: this.caller,
      message: this.message,
      stack: this.stack,
    }
  }

  fromJSON(json) {
    const e = new BaseError(json.message)
    e.code = json.code
    e.data = json.data
    e.caller = json.caller
    e.stack = json.stack
    return e
  }

  get isIsomorphicGitError() {
    return true
  }
}
