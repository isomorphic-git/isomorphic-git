const messages = {
  InvalidParameterCombinationError: `The function doesn't take these parameters simultaneously: { parameters }`,
  BranchDeleteError: `Failed to delete branch "{ ref }" because branch "{ ref }" checked out now.`,
  CommitNotFetchedError: `Failed to checkout "{ ref }" because commit { oid } is not available locally. Do a git fetch to make the branch available locally.`,
  UnparseableServerResponseFail: `Unparsable response from server! Expected "unpack ok" or "unpack [error message]" but received "{ line }".`,
  CorruptShallowOidFail: `non-40 character shallow oid: { oid }`,
  FastForwardFail: `A simple fast-forward merge was not possible.`,
  DirectorySeparatorsError: `"filepath" parameter should not include leading or trailing directory separators because these can cause problems on some platforms`,
  NoRefspecConfiguredError: `Could not find a fetch refspec for remote "{ remote }".\\nMake sure the config file has an entry like the following:\\n[remote "{ remote }"]\\nfetch = +refs/heads/*:refs/remotes/origin/*`,
  AssertServerResponseFail: `Expected "{ expected }" but got "{ actual }".`,
}

export const E = {
  /** @type {'InvalidParameterCombinationError'} */
  InvalidParameterCombinationError: `InvalidParameterCombinationError`,
  /** @type {'RefExistsError'} */
  RefExistsError: `RefExistsError`,
  /** @type {'BranchDeleteError'} */
  BranchDeleteError: `BranchDeleteError`,
  /** @type {'CommitNotFetchedError'} */
  CommitNotFetchedError: `CommitNotFetchedError`,
  /** @type {'UnparseableServerResponseFail'} */
  UnparseableServerResponseFail: `UnparseableServerResponseFail`,
  /** @type {'CorruptShallowOidFail'} */
  CorruptShallowOidFail: `CorruptShallowOidFail`,
  /** @type {'FastForwardFail'} */
  FastForwardFail: `FastForwardFail`,
  /** @type {'DirectorySeparatorsError'} */
  DirectorySeparatorsError: `DirectorySeparatorsError`,
  /** @type {'NoRefspecConfiguredError'} */
  NoRefspecConfiguredError: `NoRefspecConfiguredError`,
  /** @type {'AssertServerResponseFail'} */
  AssertServerResponseFail: `AssertServerResponseFail`,
}

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
