// modeled after Therror https://github.com/therror/therror/
// but with the goal of being much lighter weight.

import nick from 'nick'

import { t } from '../utils/t'

const translate = obj => {
  for (const [key, value] of Object.entries(obj)) {
    obj[key] = nick(t(value))
  }
  return obj
}

const messages = translate({
  FileReadError: `Could not read file "{ filepath }".`,
  MissingRequiredParameterError: `The function "{ function }" requires a "{ parameter }" parameter but none was provided.`,
  InvalidRefNameError: `Failed to { verb } { noun } "{ ref }" because that name would not be a valid git reference. A valid alternative would be "{ suggestion }".`,
  RefExistsError: `Failed to create { noun } "{ ref }" because { noun } "{ ref }" already exists.`,
  NoHeadCommitError: `Failed to create { noun } "{ ref }" because the HEAD ref could not be resolved to a commit.`,
  CommitNotFetchedError: `Failed to checkout "{ ref }" because commit { oid } is not available locally. Do a git fetch to make the branch available locally.`,
  ObjectTypeUnknownFail: `Object { oid } has unknown type "{ type }".`,
  ObjectTypeAssertionFail: `Object { oid } was anticipated to be a { expected } but it is a { type }. This is probably a bug deep in isomorphic-git!`,
  ObjectTypeAssertionInTreeFail: `Object { oid } in tree for "{ entrypath }" was an unexpected object type "{ type }".`,
  ObjectTypeAssertionInRefFail: `{ ref } is not pointing to a "commit" object but a "{ type }" object.`,
  ObjectTypeAssertionInPathFail: `Found a blob { oid } in the path "{ path }" where a tree was expected.`,
  MissingAuthorError: `Author name and email must be specified as an argument or in the .git/config file.`,
  GitRootNotFoundError: `Unable to find git root for { filepath }.`,
  UnparseableServerResponseFail: `Unparsable response from server! Expected "unpack ok" or "unpack [error message]" but received "{ line }".`,
  InvalidDepthParameterError: `Invalid value for depth parameter: { depth }`,
  RemoteDoesNotSupportShallowFail: `Remote does not support shallow fetches.`,
  RemoteDoesNotSupportDeepenSinceFail: `Remote does not support shallow fetches by date.`,
  RemoteDoesNotSupportDeepenNotFail: `Remote does not support shallow fetches excluding commits reachable by refs.`,
  RemoteDoesNotSupportDeepenRelativeFail: `Remote does not support shallow fetches relative to the current shallow depth.`,
  CorruptShallowOidFail: `non-40 character shallow oid: { oid }`,
  FastForwardFail: `A simple fast-forward merge was not possible.`,
  MergeNotSupportedFail: `Non-fast-forward merges are not supported yet.`,
  DirectorySeparatorsError: `"filepath" parameter should not include leading or trailing directory separators because these can cause problems on some platforms`,
  ResolveTreeError: `Could not resolve { oid } to a tree.`,
  DirectoryIsAFileError: `Unable to read "{ oid }:{ filepath }" because encountered a file where a directory was expected.`,
  TreeOrBlobNotFoundError: `No file or directory found at "{ oid }:{ filepath }".`,
  NotImplementedFail: `TODO: { thing } still needs to be implemented!`,
  ReadObjectFail: `Failed to read git object with oid { oid }`,
  ReadShallowObjectFail: `Failed to read git object with oid { oid } because it is a shallow commit`,
  NotAnOidFail: `Expected a 40-char hex object id but saw "{ value }".`,
  NoRefspecConfiguredError: `Could not find a fetch refspec for remote "{ remote }".\\nMake sure the config file has an entry like the following:\\n[remote "{ remote }"]\\nfetch = +refs/heads/*:refs/remotes/origin/*`,
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
  UnknownOauth2Format: `I do not know how { company } expects its Basic Auth headers to be formatted for OAuth2 usage. If you do, you can use the regular username and password parameters to set the basic auth header yourself.`,
  MissingPasswordTokenError: `Missing password or token`,
  MissingUsernameError: `Missing username`,
  MixPasswordTokenError: `Cannot mix "password" with "token"`,
  MixUsernamePasswordTokenError: `Cannot mix "username" and "password" with "token"`,
  MissingTokenError: `Missing token`,
  MixUsernameOauth2formatMissingTokenError: `Cannot mix "username" with "oauth2format". Missing token.`,
  MixPasswordOauth2formatMissingTokenError: `Cannot mix "password" with "oauth2format". Missing token.`,
  MixUsernamePasswordOauth2formatMissingTokenError: `Cannot mix "username" and "password" with "oauth2format". Missing token.`,
  MixUsernameOauth2formatTokenError: `Cannot mix "username" with "oauth2format" and "token"`,
  MixPasswordOauth2formatTokenError: `Cannot mix "password" with "oauth2format" and "token"`,
  MixUsernamePasswordOauth2formatTokenError: `Cannot mix "username" and "password" with "oauth2format" and "token"`
})

export const E = {
  FileReadError: `FileReadError`,
  MissingRequiredParameterError: `MissingRequiredParameterError`,
  InvalidRefNameError: `InvalidRefNameError`,
  RefExistsError: `RefExistsError`,
  NoHeadCommitError: `NoHeadCommitError`,
  CommitNotFetchedError: `CommitNotFetchedError`,
  ObjectTypeUnknownFail: `ObjectTypeUnknownFail`,
  ObjectTypeAssertionFail: `ObjectTypeAssertionFail`,
  ObjectTypeAssertionInTreeFail: `ObjectTypeAssertionInTreeFail`,
  ObjectTypeAssertionInRefFail: `ObjectTypeAssertionInRefFail`,
  ObjectTypeAssertionInPathFail: `ObjectTypeAssertionInPathFail`,
  MissingAuthorError: `MissingAuthorError`,
  GitRootNotFoundError: `GitRootNotFoundError`,
  UnparseableServerResponseFail: `UnparseableServerResponseFail`,
  InvalidDepthParameterError: `InvalidDepthParameterError`,
  RemoteDoesNotSupportShallowFail: `RemoteDoesNotSupportShallowFail`,
  RemoteDoesNotSupportDeepenSinceFail: `RemoteDoesNotSupportDeepenSinceFail`,
  RemoteDoesNotSupportDeepenNotFail: `RemoteDoesNotSupportDeepenNotFail`,
  RemoteDoesNotSupportDeepenRelativeFail: `RemoteDoesNotSupportDeepenRelativeFail`,
  CorruptShallowOidFail: `CorruptShallowOidFail`,
  FastForwardFail: `FastForwardFail`,
  MergeNotSupportedFail: `MergeNotSupportedFail`,
  DirectorySeparatorsError: `DirectorySeparatorsError`,
  ResolveTreeError: `ResolveTreeError`,
  DirectoryIsAFileError: `DirectoryIsAFileError`,
  TreeOrBlobNotFoundError: `TreeOrBlobNotFoundError`,
  NotImplementedFail: `NotImplementedFail`,
  ReadObjectFail: `ReadObjectFail`,
  ReadShallowObjectFail: `ReadShallowObjectFail`,
  NotAnOidFail: `NotAnOidFail`,
  NoRefspecConfiguredError: `NoRefspecConfiguredError`,
  ResolveRefError: `ResolveRefError`,
  ExpandRefError: `ExpandRefError`,
  EmptyServerResponseFail: `EmptyServerResponseFail`,
  AssertServerResponseFail: `AssertServerResponseFail`,
  HTTPError: `HTTPError`,
  RemoteUrlParseError: `RemoteUrlParseError`,
  UnknownTransportError: `UnknownTransportError`,
  AcquireLockFileFail: `AcquireLockFileFail`,
  DoubleReleaseLockFileFail: `DoubleReleaseLockFileFail`,
  InternalFail: `InternalFail`,
  UnknownOauth2Format: `UnknownOauth2Format`,
  MissingPasswordTokenError: `MissingPasswordTokenError`,
  MissingUsernameError: `MissingUsernameError`,
  MixPasswordTokenError: `MixPasswordTokenError`,
  MixUsernamePasswordTokenError: `MixUsernamePasswordTokenError`,
  MissingTokenError: `MissingTokenError`,
  MixUsernameOauth2formatMissingTokenError: `MixUsernameOauth2formatMissingTokenError`,
  MixPasswordOauth2formatMissingTokenError: `MixPasswordOauth2formatMissingTokenError`,
  MixUsernamePasswordOauth2formatMissingTokenError: `MixUsernamePasswordOauth2formatMissingTokenError`,
  MixUsernameOauth2formatTokenError: `MixUsernameOauth2formatTokenError`,
  MixPasswordOauth2formatTokenError: `MixPasswordOauth2formatTokenError`,
  MixUsernamePasswordOauth2formatTokenError: `MixUsernamePasswordOauth2formatTokenError`
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
      caller: this.caller,
      message: this.message
    }
  }
  toString () {
    return this.stack.toString()
  }
}
