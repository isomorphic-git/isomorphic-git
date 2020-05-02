export class BaseError extends Error {
  #name;

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

  // work around "the override mistake"
  get name() {
	return this.#name;
  }
  set name(value) {
	this.#name = value;
  }
  get isIsomorphicGitError() {
    return true
  }
}
