// modeled after Therror https://github.com/therror/therror/
// but with the goal of being much lighter weight.

const messages = {
  FileReadError: `Could not read file "{ filepath }".`,
  MissingRequiredParameterError: `The function requires a "{ parameter }" parameter but none was provided.`,
  InvalidRefNameError: `Failed to { verb } { noun } "{ ref }" because that name would not be a valid git reference. A valid alternative would be "{ suggestion }".`,
  InvalidParameterCombinationError: `The function doesn't take these parameters simultaneously: { parameters }`,
  RefExistsError: `Failed to create { noun } "{ ref }" because { noun } "{ ref }" already exists.`,
  RefNotExistsError: `Failed to { verb } { noun } "{ ref }" because { noun } "{ ref }" does not exists.`,
  BranchDeleteError: `Failed to delete branch "{ ref }" because branch "{ ref }" checked out now.`,
  NoHeadCommitError: `Failed to create { noun } "{ ref }" because the HEAD ref could not be resolved to a commit.`,
  CommitNotFetchedError: `Failed to checkout "{ ref }" because commit { oid } is not available locally. Do a git fetch to make the branch available locally.`,
  ObjectTypeUnknownFail: `Object { oid } has unknown type "{ type }".`,
  ObjectTypeAssertionFail: `Object { oid } was anticipated to be a { expected } but it is a { type }. This is probably a bug deep in isomorphic-git!`,
  ObjectTypeAssertionInTreeFail: `Object { oid } in tree for "{ entrypath }" was an unexpected object type "{ type }".`,
  ObjectTypeAssertionInRefFail: `{ ref } is not pointing to a "{ expected }" object but a "{ type }" object.`,
  ObjectTypeAssertionInPathFail: `Found a blob { oid } in the path "{ path }" where a tree was expected.`,
  MissingAuthorError: `Author name and email must be specified as an argument or in the .git/config file.`,
  MissingCommitterError: `Committer name and email must be specified if a committer object is passed.`,
  MissingTaggerError: `Tagger name and email must be specified as an argument or in the .git/config file.`,
  GitRootNotFoundError: `Unable to find git root for { filepath }.`,
  UnparseableServerResponseFail: `Unparsable response from server! Expected "unpack ok" or "unpack [error message]" but received "{ line }".`,
  InvalidDepthParameterError: `Invalid value for depth parameter: { depth }`,
  RemoteDoesNotSupportShallowFail: `Remote does not support shallow fetches.`,
  RemoteDoesNotSupportDeepenSinceFail: `Remote does not support shallow fetches by date.`,
  RemoteDoesNotSupportDeepenNotFail: `Remote does not support shallow fetches excluding commits reachable by refs.`,
  RemoteDoesNotSupportDeepenRelativeFail: `Remote does not support shallow fetches relative to the current shallow depth.`,
  RemoteDoesNotSupportSmartHTTP: `Remote did not reply using the "smart" HTTP protocol. Expected "001e# service=git-upload-pack" but received: { preview }`,
  CorruptShallowOidFail: `non-40 character shallow oid: { oid }`,
  FastForwardFail: `A simple fast-forward merge was not possible.`,
  MergeNotSupportedFail: `Merges with conflicts are not supported yet.`,
  DirectorySeparatorsError: `"filepath" parameter should not include leading or trailing directory separators because these can cause problems on some platforms`,
  ResolveTreeError: `Could not resolve { oid } to a tree.`,
  ResolveCommitError: `Could not resolve { oid } to a commit.`,
  DirectoryIsAFileError: `Unable to read "{ oid }:{ filepath }" because encountered a file where a directory was expected.`,
  TreeOrBlobNotFoundError: `No file or directory found at "{ oid }:{ filepath }".`,
  NotImplementedFail: `TODO: { thing } still needs to be implemented!`,
  ReadObjectFail: `Failed to read git object with oid { oid }`,
  NotAnOidFail: `Expected a 40-char hex object id but saw "{ value }".`,
  NoRefspecConfiguredError: `Could not find a fetch refspec for remote "{ remote }".\\nMake sure the config file has an entry like the following:\\n[remote "{ remote }"]\\nfetch = +refs/heads/*:refs/remotes/origin/*`,
  MismatchRefValueError: `Provided oldValue doesn\\'t match the actual value of "{ ref }".`,
  ResolveRefError: `Could not resolve reference "{ ref }".`,
  ExpandRefError: `Could not expand reference "{ ref }".`,
  EmptyServerResponseFail: `Empty response from git server.`,
  AssertServerResponseFail: `Expected "{ expected }" but got "{ actual }".`,
  HTTPError: `HTTP Error: { statusCode } { statusMessage }`,
  RemoteUrlParseError: `Cannot parse remote URL: "{ url }"`,
  UnknownTransportError: `Git remote "{ url }" uses an unrecognized transport protocol: "{ transport }"`,
  AcquireLockFileFail: `Unable to acquire lockfile "{ filename }". Exhausted tries.`,
  DoubleReleaseLockFileFail: `Cannot double-release lockfile "{ filename }".`,
  InternalFail: `An internal error caused this command to fail. Please file a bug report at https://github.com/isomorphic-git/isomorphic-git/issues with this error message: { message }`,
  MaxSearchDepthExceeded: `Maximum search depth of { depth } exceeded.`,
  PushRejectedNonFastForward: `Push rejected because it was not a simple fast-forward. Use "force: true" to override.`,
  PushRejectedTagExists: `Push rejected because tag already exists. Use "force: true" to override.`,
  AddingRemoteWouldOverwrite: `Adding remote { remote } would overwrite the existing remote. Use "force: true" to override.`,
  PluginUndefined: `A command required the "{ plugin }" plugin but it was undefined.`,
  CoreNotFound: `No plugin core with the name "{ core }" is registered.`,
  PluginSchemaViolation: `Schema check failed for "{ plugin }" plugin; missing { method } method.`,
  PluginUnrecognized: `Unrecognized plugin type "{ plugin }"`,
  AmbiguousShortOid: `Found multiple oids matching "{ short }" ({ matches }). Use a longer abbreviation length to disambiguate them.`,
  ShortOidNotFound: `Could not find an object matching "{ short }".`,
  CheckoutConflictError: `Your local changes to the following files would be overwritten by checkout: { filepaths }`,
  NoteAlreadyExistsError: `A note object { note } already exists on object { oid }. Use 'force: true' parameter to overwrite existing notes.`,
  GitPushError: `One or more branches were not updated: { prettyDetails }`,
}

export const E = {
  /** @type {'FileReadError'} */
  FileReadError: `FileReadError`,
  /** @type {'MissingRequiredParameterError'} */
  MissingRequiredParameterError: `MissingRequiredParameterError`,
  /** @type {'InvalidRefNameError'} */
  InvalidRefNameError: `InvalidRefNameError`,
  /** @type {'InvalidParameterCombinationError'} */
  InvalidParameterCombinationError: `InvalidParameterCombinationError`,
  /** @type {'RefExistsError'} */
  RefExistsError: `RefExistsError`,
  /** @type {'RefNotExistsError'} */
  RefNotExistsError: `RefNotExistsError`,
  /** @type {'BranchDeleteError'} */
  BranchDeleteError: `BranchDeleteError`,
  /** @type {'NoHeadCommitError'} */
  NoHeadCommitError: `NoHeadCommitError`,
  /** @type {'CommitNotFetchedError'} */
  CommitNotFetchedError: `CommitNotFetchedError`,
  /** @type {'ObjectTypeUnknownFail'} */
  ObjectTypeUnknownFail: `ObjectTypeUnknownFail`,
  /** @type {'ObjectTypeAssertionFail'} */
  ObjectTypeAssertionFail: `ObjectTypeAssertionFail`,
  /** @type {'ObjectTypeAssertionInTreeFail'} */
  ObjectTypeAssertionInTreeFail: `ObjectTypeAssertionInTreeFail`,
  /** @type {'ObjectTypeAssertionInRefFail'} */
  ObjectTypeAssertionInRefFail: `ObjectTypeAssertionInRefFail`,
  /** @type {'ObjectTypeAssertionInPathFail'} */
  ObjectTypeAssertionInPathFail: `ObjectTypeAssertionInPathFail`,
  /** @type {'MissingAuthorError'} */
  MissingAuthorError: `MissingAuthorError`,
  /** @type {'MissingCommitterError'} */
  MissingCommitterError: `MissingCommitterError`,
  /** @type {'MissingTaggerError'} */
  MissingTaggerError: `MissingTaggerError`,
  /** @type {'GitRootNotFoundError'} */
  GitRootNotFoundError: `GitRootNotFoundError`,
  /** @type {'UnparseableServerResponseFail'} */
  UnparseableServerResponseFail: `UnparseableServerResponseFail`,
  /** @type {'InvalidDepthParameterError'} */
  InvalidDepthParameterError: `InvalidDepthParameterError`,
  /** @type {'RemoteDoesNotSupportShallowFail'} */
  RemoteDoesNotSupportShallowFail: `RemoteDoesNotSupportShallowFail`,
  /** @type {'RemoteDoesNotSupportDeepenSinceFail'} */
  RemoteDoesNotSupportDeepenSinceFail: `RemoteDoesNotSupportDeepenSinceFail`,
  /** @type {'RemoteDoesNotSupportDeepenNotFail'} */
  RemoteDoesNotSupportDeepenNotFail: `RemoteDoesNotSupportDeepenNotFail`,
  /** @type {'RemoteDoesNotSupportDeepenRelativeFail'} */
  RemoteDoesNotSupportDeepenRelativeFail: `RemoteDoesNotSupportDeepenRelativeFail`,
  /** @type {'RemoteDoesNotSupportSmartHTTP'} */
  RemoteDoesNotSupportSmartHTTP: `RemoteDoesNotSupportSmartHTTP`,
  /** @type {'CorruptShallowOidFail'} */
  CorruptShallowOidFail: `CorruptShallowOidFail`,
  /** @type {'FastForwardFail'} */
  FastForwardFail: `FastForwardFail`,
  /** @type {'MergeNotSupportedFail'} */
  MergeNotSupportedFail: `MergeNotSupportedFail`,
  /** @type {'DirectorySeparatorsError'} */
  DirectorySeparatorsError: `DirectorySeparatorsError`,
  /** @type {'ResolveTreeError'} */
  ResolveTreeError: `ResolveTreeError`,
  /** @type {'ResolveCommitError'} */
  ResolveCommitError: `ResolveCommitError`,
  /** @type {'DirectoryIsAFileError'} */
  DirectoryIsAFileError: `DirectoryIsAFileError`,
  /** @type {'TreeOrBlobNotFoundError'} */
  TreeOrBlobNotFoundError: `TreeOrBlobNotFoundError`,
  /** @type {'NotImplementedFail'} */
  NotImplementedFail: `NotImplementedFail`,
  /** @type {'ReadObjectFail'} */
  ReadObjectFail: `ReadObjectFail`,
  /** @type {'NotAnOidFail'} */
  NotAnOidFail: `NotAnOidFail`,
  /** @type {'NoRefspecConfiguredError'} */
  NoRefspecConfiguredError: `NoRefspecConfiguredError`,
  /** @type {'MismatchRefValueError'} */
  MismatchRefValueError: `MismatchRefValueError`,
  /** @type {'ResolveRefError'} */
  ResolveRefError: `ResolveRefError`,
  /** @type {'ExpandRefError'} */
  ExpandRefError: `ExpandRefError`,
  /** @type {'EmptyServerResponseFail'} */
  EmptyServerResponseFail: `EmptyServerResponseFail`,
  /** @type {'AssertServerResponseFail'} */
  AssertServerResponseFail: `AssertServerResponseFail`,
  /** @type {'HTTPError'} */
  HTTPError: `HTTPError`,
  /** @type {'RemoteUrlParseError'} */
  RemoteUrlParseError: `RemoteUrlParseError`,
  /** @type {'UnknownTransportError'} */
  UnknownTransportError: `UnknownTransportError`,
  /** @type {'AcquireLockFileFail'} */
  AcquireLockFileFail: `AcquireLockFileFail`,
  /** @type {'DoubleReleaseLockFileFail'} */
  DoubleReleaseLockFileFail: `DoubleReleaseLockFileFail`,
  /** @type {'InternalFail'} */
  InternalFail: `InternalFail`,
  /** @type {'MaxSearchDepthExceeded'} */
  MaxSearchDepthExceeded: `MaxSearchDepthExceeded`,
  /** @type {'PushRejectedNonFastForward'} */
  PushRejectedNonFastForward: `PushRejectedNonFastForward`,
  /** @type {'PushRejectedTagExists'} */
  PushRejectedTagExists: `PushRejectedTagExists`,
  /** @type {'AddingRemoteWouldOverwrite'} */
  AddingRemoteWouldOverwrite: `AddingRemoteWouldOverwrite`,
  /** @type {'PluginUndefined'} */
  PluginUndefined: `PluginUndefined`,
  /** @type {'CoreNotFound'} */
  CoreNotFound: `CoreNotFound`,
  /** @type {'PluginSchemaViolation'} */
  PluginSchemaViolation: `PluginSchemaViolation`,
  /** @type {'PluginUnrecognized'} */
  PluginUnrecognized: `PluginUnrecognized`,
  /** @type {'AmbiguousShortOid'} */
  AmbiguousShortOid: `AmbiguousShortOid`,
  /** @type {'ShortOidNotFound'} */
  ShortOidNotFound: `ShortOidNotFound`,
  /** @type {'CheckoutConflictError'} */
  CheckoutConflictError: `CheckoutConflictError`,
  /** @type {'NoteAlreadyExistsError'} */
  NoteAlreadyExistsError: `NoteAlreadyExistsError`,
  /** @type {'GitPushError'} */
  GitPushError: `GitPushError`,
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
