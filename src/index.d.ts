// Type definitions for isomorphic-git 0.x.x
// Project: isomorphic-git
// Definitions by: William Hilton <wmhilton.com>

import { EventEmitter } from 'events';

export as namespace git;

export interface GitObjectDescription {
  oid: string;
  type?: 'blob' | 'tree' | 'commit' | 'tag';
  format: 'deflated' | 'wrapped' | 'content' | 'parsed';
  object: Buffer | CommitDescription | TreeDescription | TagDescription;
  source?: string;
}

export interface CommitDescription {
  oid: string; // SHA1 object id of this commit
  message: string; // Commit message
  tree: string; // SHA1 object id of corresponding file tree
  parent: string[]; // an array of zero or more SHA1 object ids
  author: {
    name: string; // The author's name
    email: string; // The author's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  committer: {
    name: string; // The committer's name
    email: string; // The committer's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  gpgsig?: string; // PGP signature (if present)
}

export interface CommitDescriptionWithPayload extends CommitDescription {
  payload: string;
}

export interface TreeDescription {
  entries: Array<TreeEntry>;
}

export interface TagDescription {
  object: string;
  type: 'blob' | 'tree' | 'commit' | 'tag';
  tag: string;
  tagger: {
    name: string; // The tagger's name
    email: string; // The tagger's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  message: string;
  signature?: string;
}

export interface TreeEntry {
  mode: string;
  path: string;
  oid: string;
  type?: string;
}

export interface PushResponse {
  ok?: string[];
  errors?: string[];
}

export interface FetchResponse {
  defaultBranch: string;
}

export interface RemoteDescription {
  capabilities: string[];
  refs?: {
    heads?: object;
    pull?: object;
    tags?: object;
  };
}

export interface MergeReport {
  oid: string;
  createdMergeCommit?: boolean;
  fastForward?: boolean;
}

export interface RemoteDescription {
  remote: string; // name of the remote
  url: string; // url of the remote
}

export type StatusMatrix = Array<[string, ...number[]]>;

export interface GitFsPlugin {
  readFile: any;
  writeFile: any;
  unlink: any;
  readdir: any;
  mkdir: any;
  rmdir: any;
  stat: any;
  lstat: any;
}

export type AnyGitPlugin = GitFsPlugin

export type GitPluginCore = Map<string, AnyGitPlugin>

export const plugins: GitPluginCore

export const cores: Map<string, GitPluginCore>

export function add(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  filepath: string;
}): Promise<void>;

export function addRemote(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  remote: string;
  url: string;
}): Promise<void>;

export function branch(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref: string;
}): Promise<void>;

export function deleteBranch(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref: string;
}): Promise<void>;

export function deleteRemote(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  remote: string;
}): Promise<void>;

export function checkout(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  remote?: string;
  ref?: string;
}): Promise<void>;

export function clone(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  emitter?: EventEmitter;
  url: string;
  corsProxy?: string;
  ref?: string;
  remote?: string;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  depth?: number;
  since?: Date;
  exclude?: string[];
  relative?: boolean;
  singleBranch?: boolean;
  noCheckout?: boolean;
}): Promise<void>;

export function commit(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  message: string;
  author: {
    name?: string;
    email?: string;
    date?: Date;
    timestamp?: number;
    timezoneOffset?: number;
  };
  committer?: {
    name?: string;
    email?: string;
    date?: Date;
    timestamp?: number;
    timezoneOffset?: number;
  };
}): Promise<string>;

export function config(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  path: string;
  value?: string | undefined;
}): Promise<any>;

export function currentBranch(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  fullname?: boolean;
}): Promise<string>;

export function expandRef(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref: string;
}): Promise<string>;

export function expandOid(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  oid: string;
}): Promise<string>;

export function fetch(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  emitter?: EventEmitter;
  url?: string;
  corsProxy?: string;
  ref?: string;
  remote?: string;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  depth?: number;
  since?: Date;
  exclude?: string[];
  relative?: boolean;
  tags?: boolean;
  singleBranch?: boolean;
}): Promise<FetchResponse>;

export function findRoot(args: { core?: string;
  fs?: any; filepath: string }): Promise<string>;

export function getRemoteInfo(args: {
  url: string;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  forPush?: boolean;
}): Promise<RemoteDescription>;

export function indexPack(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  filepath: string;
}): Promise<void>;

export function init(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
}): Promise<void>;

export function isDescendent(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  oid: string;
  ancestor: string;
  depth?: string;
}): Promise<boolean>;

export function listBranches(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  remote?: string;
}): Promise<Array<string>>;

export function listFiles(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
}): Promise<Array<string>>;

export function listRemotes(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
}): Promise<Array<RemoteDescription>>;

export function listTags(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
}): Promise<Array<string>>;

export function log(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
  depth?: number;
  since?: Date;
}): Promise<Array<CommitDescription>>;
export function log(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
  depth?: number;
  since?: Date;
  signing: false;
}): Promise<Array<CommitDescription>>;
export function log(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
  depth?: number;
  since?: Date;
  signing: true;
}): Promise<Array<CommitDescriptionWithPayload>>;

export function merge(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ours?: string;
  theirs: string;
  fastForwardOnly?: boolean;
}): Promise<MergeReport>;

export function pull(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
  singleBranch?: boolean;
  fastForwardOnly?: boolean;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  emitter?: EventEmitter;
}): Promise<void>;

export function push(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
  remoteRef?: string;
  remote?: string;
  url?: string;
  corsProxy?: string;
  force?: boolean;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
}): Promise<PushResponse>;

export function readObject(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  oid: string;
  format?: 'deflated' | 'wrapped' | 'content' | 'parsed';
  filepath?: string;
  encoding?: string;
}): Promise<GitObjectDescription>;

export function remove(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  filepath: string;
}): Promise<void>;

export function resetIndex(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  filepath: string,
  ref?: string
}): Promise<void>

export function resolveRef(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref: string;
  depth?: number;
}): Promise<string>;

export function sign(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  privateKeys: string;
}): Promise<string>;

export function status(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  filepath: string;
}): Promise<string>;

export function statusMatrix(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref?: string;
  pattern: string;
}): Promise<StatusMatrix>;

export function verify(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  ref: string;
  publickKeys: string;
}): Promise<false | Array<string>>;

export function version(): string;

export function writeObject(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  type?: 'blob' | 'tree' | 'commit' | 'tag';
  object: Buffer | CommitDescription | TreeDescription | TagDescription;
  format?: 'deflated' | 'wrapped' | 'content' | 'parsed';
  oid?: string;
  encoding?: string;
}): Promise<string>;
