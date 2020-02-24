const messages = {}

export const E = {}

function renderTemplate(template, values) {
  let result = template
  for (const key of Object.keys(values)) {
    let subs
    if (Array.isArray(values[key])) {
      subs = values[key].join(', ')
    } else {
      subs = String(values[key])
    }
    result = result.replace(new RegExp(`{ ${key} }`, 'g'), subs)
  }
  return result
}

export class GitError extends Error {
  constructor(code, data) {
    super()
    this.name = code
    this.code = code
    this.data = data
    this.message = renderTemplate(messages[code], data || {})
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      code: this.code,
      data: this.data,
      caller: this.caller,
      message: this.message,
    }
  }

  toString() {
    return this.stack.toString()
  }
}
