export class BaseError extends Error {
  constructor(message) {
    super(message)
    // Setting these here allows TS to infer that all git errors have
    // `caller`, `code`, and `data` properties and their types.
    this.caller = ''
    this.code = ''
    this.data = {}
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
