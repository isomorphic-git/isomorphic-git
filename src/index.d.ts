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
  oid?: string; // SHA1 object id of this commit
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
  headers?: object;
}

export interface FetchResponse {
  defaultBranch: string;
  fetchHead: string | null;
  headers?: object;
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
  alreadyMerged?: boolean;
  fastForward?: boolean;
}

export interface RemoteDescription {
  remote: string; // name of the remote
  url: string; // url of the remote
}

export interface Walker {}

export interface WalkerTree {
  fullpath: string;
  basename: string;
  exists: boolean;
  populateStat: () => Promise<void>;
  type?: 'tree' | 'blob';
  ctimeSeconds?: number;
  mtimeSeconds?: number;
  mtimeNanoseconds?: number;
  dev?: number;
  ino?: number;
  mode?: number;
  uid?: number;
  gid?: number;
  size?: number;
  populateContent: () => Promise<void>;
  content?: Buffer;
  populateHash: () => Promise<void>;
  oid?: string;
}

export interface GitCredentialManagerPlugin {
  fill: any;
  approved: any;
  rejected: any;
}

export interface GitEmitterPlugin {
  emit: any;
}

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

export interface GitPgpPlugin {
  sign: any;
  verify: any;
}

export type GitPluginName = "credentialManager" | "emitter" | "fs" | "pgp"

export type AnyGitPlugin = GitFsPlugin | GitCredentialManagerPlugin | GitEmitterPlugin | GitPgpPlugin

export type GitPluginCore = Map<GitPluginName, AnyGitPlugin>

export type StatusMatrix = Array<[string, number, number, number]>;

export type WalkerEntry = WalkerTree[];

export const plugins: GitPluginCore

export const cores: {
  get: (string) => GitPluginCore;
  create: (string) => GitPluginCore;
}

export const E: {
  [key: string]: string;
};

export function WORKDIR(args: {
  fs: any;
  dir: string;
  gitdir: string;
}): Walker;

export function TREE(args: {
  fs: any;
  gitdir: string;
  ref: string;
}): Walker;

export function STAGE(args: {
  fs: any;
  gitdir: string;
}): Walker;

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
  dir?: string;
  gitdir?: string;
  remote: string;
  url: string;
}): Promise<void>;

export function annotatedTag(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
  message: string;
  object?: string;
  tagger?: {
    name?: string;
    email?: string;
    date?: Date;
    timestamp?: number;
    timezoneOffset?: number;
  };
  signature?: string;
  signingKey?: string;
  force?: boolean;
}): Promise<void>;

export function branch(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
  checkout?: boolean;
}): Promise<void>;

export function checkout(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  emitter?: EventEmitter;
  emitterPrefix?: string;
  remote?: string;
  ref?: string;
}): Promise<void>;

export function clone(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  emitter?: EventEmitter;
  emitterPrefix?: string;
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
  noTags?: boolean;
  headers?: { [key: string]: string };
}): Promise<void>;

export function commit(args: {
  core?: string;
  fs?: any;
  dir?: string;
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
  signingKey?: string;
}): Promise<string>;

export function config(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  path: string;
  all?: boolean;
  value?: string | boolean | number | undefined;
}): Promise<any>;

export function currentBranch(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  fullname?: boolean;
}): Promise<string | undefined>;

export function deleteBranch(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
}): Promise<void>;

export function deleteRef(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
}): Promise<void>;

export function deleteRemote(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  remote: string;
}): Promise<void>;

export function deleteTag(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
}): Promise<void>;

export function expandRef(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
}): Promise<string>;

export function expandOid(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  oid: string;
}): Promise<string>;

export function fetch(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  emitter?: EventEmitter;
  emitterPrefix?: string;
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
  headers?: { [key: string]: string };
}): Promise<FetchResponse>;

export function findRoot(args: { core?: string;
  fs?: any; filepath: string }): Promise<string>;

export function getRemoteInfo(args: {
  url: string;
  corsProxy?: string;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  forPush?: boolean;
  headers?: { [key: string]: string };
}): Promise<RemoteDescription>;

export function indexPack(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  emitter?: EventEmitter;
  emitterPrefix?: string;
  filepath: string;
}): Promise<void>;

export function init(args: {
  core?: string;
  fs?: any;
  dir: string;
  gitdir?: string;
  bare?: boolean;
}): Promise<void>;

export function isDescendent(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  oid: string;
  ancestor: string;
  depth?: string;
}): Promise<boolean>;

export function listBranches(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  remote?: string;
}): Promise<Array<string>>;

export function listFiles(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref?: string;
}): Promise<Array<string>>;

export function listRemotes(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
}): Promise<Array<RemoteDescription>>;

export function listTags(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
}): Promise<Array<string>>;

export function log(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref?: string;
  depth?: number;
  since?: Date;
}): Promise<Array<CommitDescription>>;
export function log(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref?: string;
  depth?: number;
  since?: Date;
  signing: false;
}): Promise<Array<CommitDescription>>;
export function log(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref?: string;
  depth?: number;
  since?: Date;
  signing: true;
}): Promise<Array<CommitDescriptionWithPayload>>;

export function merge(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ours?: string;
  theirs: string;
  fastForwardOnly?: boolean;
}): Promise<MergeReport>;

export function pull(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref?: string;
  singleBranch?: boolean;
  fastForwardOnly?: boolean;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  headers?: { [key: string]: string };
  emitter?: EventEmitter;
  emitterPrefix?: string;
}): Promise<void>;

export function push(args: {
  core?: string;
  fs?: any;
  dir?: string;
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
  headers?: { [key: string]: string };
  emitter?: EventEmitter;
  emitterPrefix?: string;
}): Promise<PushResponse>;

export function readObject(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  oid: string;
  format?: 'deflated' | 'wrapped' | 'content' | 'parsed';
  filepath?: string;
  encoding?: string;
}): Promise<GitObjectDescription>;

export function remove(args: {
  core?: string;
  fs?: any;
  dir?: string;
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
  dir?: string;
  gitdir?: string;
  ref: string;
  depth?: number;
}): Promise<string>;

export function sign(args: {
  core?: string;
  fs?: any;
  dir?: string;
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
  pattern?: string;
}): Promise<StatusMatrix>;

export function tag(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
  object?: string;
  force?: boolean;
}): Promise<void>;

export function verify(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
  publicKeys: string;
}): Promise<false | Array<string>>;

export function version(): string;

export function walkBeta1<T, Q>(args: {
  core?: string;
  trees: Walker[];
  filter?: (entry: WalkerEntry) => Promise<boolean>;
  map?: (entry: WalkerEntry) => Promise<T | undefined>;
  reduce?: (parent: T | undefined, children: Q[]) => Promise<Q>;
  iterate?: (walk: (parent: WalkerEntry) => Promise<Q>, children: Iterable<WalkerEntry>) => Promise<Array<Q|undefined>>;
}): Promise<Q|undefined>;

export function writeObject(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  type?: 'blob' | 'tree' | 'commit' | 'tag';
  object: string | Buffer | CommitDescription | TreeDescription | TagDescription;
  format?: 'deflated' | 'wrapped' | 'content' | 'parsed';
  oid?: string;
  encoding?: string;
}): Promise<string>;

export function writeRef(args: {
  core?: string;
  fs?: any;
  dir?: string;
  gitdir?: string;
  ref: string;
  value: string;
  force?: boolean;
  symbolic?: boolean;
}): Promise<void>;
