const messages = {
  InvalidParameterCombinationError: `The function doesn't take these parameters simultaneously: { parameters }`,
  RefNotExistsError: `Failed to { verb } { noun } "{ ref }" because { noun } "{ ref }" does not exists.`,
  BranchDeleteError: `Failed to delete branch "{ ref }" because branch "{ ref }" checked out now.`,
  CommitNotFetchedError: `Failed to checkout "{ ref }" because commit { oid } is not available locally. Do a git fetch to make the branch available locally.`,
  ObjectTypeUnknownFail: `Object { oid } has unknown type "{ type }".`,
  ObjectTypeAssertionInTreeFail: `Object { oid } in tree for "{ entrypath }" was an unexpected object type "{ type }".`,
  ObjectTypeAssertionInPathFail: `Found a blob { oid } in the path "{ path }" where a tree was expected.`,
  GitRootNotFoundError: `Unable to find git root for { filepath }.`,
  UnparseableServerResponseFail: `Unparsable response from server! Expected "unpack ok" or "unpack [error message]" but received "{ line }".`,
  RemoteDoesNotSupportSmartHTTP: `Remote did not reply using the "smart" HTTP protocol. Expected "001e# service=git-upload-pack" but received: { preview }`,
  CorruptShallowOidFail: `non-40 character shallow oid: { oid }`,
  FastForwardFail: `A simple fast-forward merge was not possible.`,
  DirectorySeparatorsError: `"filepath" parameter should not include leading or trailing directory separators because these can cause problems on some platforms`,
  ResolveTreeError: `Could not resolve { oid } to a tree.`,
  ResolveCommitError: `Could not resolve { oid } to a commit.`,
  DirectoryIsAFileError: `Unable to read "{ oid }:{ filepath }" because encountered a file where a directory was expected.`,
  ReadObjectFail: `Failed to read git object with oid { oid }`,
  NotAnOidFail: `Expected a 40-char hex object id but saw "{ value }".`,
  NoRefspecConfiguredError: `Could not find a fetch refspec for remote "{ remote }".\\nMake sure the config file has an entry like the following:\\n[remote "{ remote }"]\\nfetch = +refs/heads/*:refs/remotes/origin/*`,
  AssertServerResponseFail: `Expected "{ expected }" but got "{ actual }".`,
}

export const E = {
  /** @type {'InvalidParameterCombinationError'} */
  InvalidParameterCombinationError: `InvalidParameterCombinationError`,
  /** @type {'RefExistsError'} */
  RefExistsError: `RefExistsError`,
  /** @type {'RefNotExistsError'} */
  RefNotExistsError: `RefNotExistsError`,
  /** @type {'BranchDeleteError'} */
  BranchDeleteError: `BranchDeleteError`,
  /** @type {'CommitNotFetchedError'} */
  CommitNotFetchedError: `CommitNotFetchedError`,
  /** @type {'ObjectTypeUnknownFail'} */
  ObjectTypeUnknownFail: `ObjectTypeUnknownFail`,
  /** @type {'ObjectTypeAssertionInTreeFail'} */
  ObjectTypeAssertionInTreeFail: `ObjectTypeAssertionInTreeFail`,
  /** @type {'ObjectTypeAssertionInPathFail'} */
  ObjectTypeAssertionInPathFail: `ObjectTypeAssertionInPathFail`,
  /** @type {'GitRootNotFoundError'} */
  GitRootNotFoundError: `GitRootNotFoundError`,
  /** @type {'UnparseableServerResponseFail'} */
  UnparseableServerResponseFail: `UnparseableServerResponseFail`,
  /** @type {'RemoteDoesNotSupportSmartHTTP'} */
  RemoteDoesNotSupportSmartHTTP: `RemoteDoesNotSupportSmartHTTP`,
  /** @type {'CorruptShallowOidFail'} */
  CorruptShallowOidFail: `CorruptShallowOidFail`,
  /** @type {'FastForwardFail'} */
  FastForwardFail: `FastForwardFail`,
  /** @type {'DirectorySeparatorsError'} */
  DirectorySeparatorsError: `DirectorySeparatorsError`,
  /** @type {'ResolveTreeError'} */
  ResolveTreeError: `ResolveTreeError`,
  /** @type {'ResolveCommitError'} */
  ResolveCommitError: `ResolveCommitError`,
  /** @type {'DirectoryIsAFileError'} */
  DirectoryIsAFileError: `DirectoryIsAFileError`,
  /** @type {'ReadObjectFail'} */
  ReadObjectFail: `ReadObjectFail`,
  /** @type {'NotAnOidFail'} */
  NotAnOidFail: `NotAnOidFail`,
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
