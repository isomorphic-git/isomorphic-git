// Type definitions for isomorphic-git 0.x.x
// Project: isomorphic-git
// Definitions by: William Hilton <wmhilton.com>

import { EventEmitter } from 'events';

export as namespace git;

// Basic building blocks
type WorkDir = { dir: string }
type ExplicitGitDir = { gitdir: string }
type ImplicitGitDir = { dir: string }
type GitDir = ExplicitGitDir | ImplicitGitDir

export interface GitObjectDescription {
  oid: string;
  type?: 'blob' | 'tree' | 'commit' | 'tag';
  format: 'deflated' | 'wrapped' | 'content' | 'parsed';
  object: Buffer | CommitDescription | TreeDescription | TagDescription;
  source?: string;
}

export interface ReadBlobResult {
  oid: string;
  blob: Buffer;
}

export interface ReadCommitResult {
  oid: string;
  commit: CommitObject;
  payload: string; // PGP payload
}

export interface CommitObject {
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
  gpgsig?: string; // PGP signature (if signed)
}

export interface ReadTreeResult {
  oid: string;
  tree: TreeObject;
}

export type TreeObject = TreeEntry[];

export interface ReadTagResult {
  oid: string;
  commit: TagObject;
  payload: string; // PGP payload
}

export interface TagObject {
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

export interface CommitDescriptionWithOid extends CommitDescription {
  oid: string; // SHA1 object id of this commit
}

export interface CommitDescriptionWithPayload extends CommitDescriptionWithOid {
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
  type: string;
}

export interface PackObjectsResponse {
  filename: string;
  packfile?: Buffer;
}

export interface PushResponse {
  ok?: string[];
  errors?: string[];
  headers?: object;
}

export interface FetchResponse {
  defaultBranch: string;
  fetchHead: string | null;
  fetchHeadDescription: string | null;
  headers?: object;
  pruned?: string[];
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
  oid?: string;
  alreadyMerged?: boolean;
  fastForward?: boolean;
  mergeCommit?: boolean;
  tree?: string;
}

export interface RemoteDefinition {
  remote: string; // name of the remote
  url: string; // url of the remote
}

export interface Walker {}

export interface WalkerTree {
  fullpath: string;
  basename: string;
  exists: boolean;
  populateStat: () => Promise<void>;
  type?: 'tree' | 'blob' | 'special';
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

export interface WalkerEntry2 {
  fullpath: string;
  basename: string;
  exists: boolean;
  type: () => Promise<'tree' | 'blob' | 'special'>;
  mode: () => Promise<number>;
  oid: () => Promise<string>;
  content: () => Promise<Buffer|undefined>;
  stat: () => Promise<{
    ctimeSeconds: number;
    mtimeSeconds: number;
    mtimeNanoseconds: number;
    dev: number;
    ino: number;
    mode: number;
    uid: number;
    gid: number;
    size: number;
  }>;
}

export interface GitCredentialManagerPlugin {
  fill: any;
  approved: any;
  rejected: any;
}

export interface GitEmitterPlugin {
  emit: any;
}

export interface GitFsPromisesPlugin {
  promises: GitFsPlugin;
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

export type HttpRequest = {
  url: string;
  method?: string;
  headers?: {
    [key: string]: string;
  };
  body?: AsyncIterableIterator<Uint8Array>;
};

export type HttpResponse = HttpRequest & {
  statusCode: number;
  statusMessage: string;
}

export type GitHttpPlugin = (
  request: HttpRequest & {
    core?: string,
    emitter?: GitEmitterPlugin,
    emitterPrefix?: string
  }
) => HttpResponse;

export type GitPluginName = "credentialManager" | "emitter" | "fs" | "pgp" | "http"

export type AnyGitPlugin = GitFsPlugin | GitFsPromisesPlugin | GitCredentialManagerPlugin | GitEmitterPlugin | GitPgpPlugin | GitHttpPlugin

export type GitPluginCore = Map<GitPluginName, AnyGitPlugin>

export type StatusMatrix = Array<[string, number, number, number]>;

export type WalkerEntry = WalkerTree[];

export const plugins: GitPluginCore

export const cores: {
  get: (arg: string) => GitPluginCore;
  create: (arg: string) => GitPluginCore;
}

export { E } from './errors';

export function WORKDIR(args: {
  fs?: any;
  dir: string;
  gitdir: string;
}): Walker;

export function TREE(args: {
  fs?: any;
  gitdir: string;
  ref: string;
}): Walker;

export function STAGE(args: {
  fs?: any;
  gitdir: string;
}): Walker;

export function add(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  filepath: string;
}): Promise<void>;

export function addNote(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  oid: string;
  note: any;
  author?: {
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
  force?: boolean;
}): Promise<string>;

export function addRemote(args: GitDir & {
  core?: string;
  fs?: any;
  force?: boolean;
  remote: string;
  url: string;
}): Promise<void>;

export function annotatedTag(args: GitDir & {
  core?: string;
  fs?: any;
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

export function branch(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
  checkout?: boolean;
}): Promise<void>;

export function checkout(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  emitter?: EventEmitter;
  emitterPrefix?: string;
  remote?: string;
  ref: string;
  filepaths?: string[];
  pattern?: string;
  noSubmodules?: boolean;
  newSubmoduleBehavior?: boolean;
}): Promise<void>;

export function clone(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
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
  noSubmodules?: boolean;
  newSubmoduleBehavior?: boolean;
  noGitSuffix?: boolean;
  noTags?: boolean;
  headers?: { [key: string]: string };
  autoTranslateSSH?: boolean;
}): Promise<void>;

export function commit(args: GitDir & {
  core?: string;
  fs?: any;
  message: string;
  author?: {
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
  noUpdateBranch?: boolean;
  dryRun?: boolean;
  ref?: string;
  parent?: string[];
  tree?: string;
}): Promise<string>;

export function config(args: GitDir & {
  core?: string;
  fs?: any;
  path: string;
  all?: boolean;
  value?: string | boolean | number | undefined;
}): Promise<any>;

export function currentBranch(args: GitDir & {
  core?: string;
  fs?: any;
  fullname?: boolean;
}): Promise<string | undefined>;

export function deleteBranch(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
}): Promise<void>;

export function deleteRef(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
}): Promise<void>;

export function deleteRemote(args: GitDir & {
  core?: string;
  fs?: any;
  remote: string;
}): Promise<void>;

export function deleteTag(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
}): Promise<void>;

export function expandRef(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
}): Promise<string>;

export function expandOid(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
}): Promise<string>;

export function fastCheckout(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  emitter?: EventEmitter;
  emitterPrefix?: string;
  remote?: string;
  ref?: string;
  filepaths?: string[];
  dryRun?: boolean;
  debug?: boolean;
  force?: boolean;
  noCheckout?: boolean;
  noUpdateHead?: boolean;
  noSubmodules?: boolean;
  newSubmoduleBehavior?: boolean;
}): Promise<void>;

export function fetch(args: GitDir & {
  core?: string;
  fs?: any;
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
  noGitSuffix?: boolean;
  prune?: boolean;
  pruneTags?: boolean;
  headers?: { [key: string]: string };
  autoTranslateSSH?: boolean;
}): Promise<FetchResponse>;

export function findRoot(args: {
  core?: string;
  fs?: any;
  filepath: string
}): Promise<string>;

export function getRemoteInfo(args: {
  core?: string;
  url: string;
  corsProxy?: string;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  forPush?: boolean;
  noGitSuffix?: boolean;
  headers?: { [key: string]: string };
}): Promise<RemoteDescription>;

export function indexPack(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  emitter?: EventEmitter;
  emitterPrefix?: string;
  filepath: string;
}): Promise<void>;

export function init(args: GitDir & {
  core?: string;
  fs?: any;
  bare?: boolean;
  noOverwrite?: boolean;
}): Promise<void>;

export function isDescendent(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
  ancestor: string;
  depth?: number;
}): Promise<boolean>;

export function listBranches(args: GitDir & {
  core?: string;
  fs?: any;
  remote?: string;
}): Promise<Array<string>>;

export function listFiles(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
}): Promise<Array<string>>;

export function listNotes(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  oid?: string;
}): Promise<Array<{ oid: string, path: string }>>;

export function listRemotes(args: GitDir & {
  core?: string;
  fs?: any;
}): Promise<Array<RemoteDefinition>>;

export function listTags(args: GitDir & {
  core?: string;
  fs?: any;
}): Promise<Array<string>>;

export function log(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  depth?: number;
  since?: Date;
}): Promise<Array<CommitDescriptionWithOid>>;
export function log(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  depth?: number;
  since?: Date;
  signing: false;
}): Promise<Array<CommitDescriptionWithOid>>;
export function log(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  depth?: number;
  since?: Date;
  signing: true;
}): Promise<Array<CommitDescriptionWithPayload>>;

export function merge(args: GitDir & {
  core?: string;
  fs?: any;
  ours?: string;
  theirs: string;
  fastForwardOnly?: boolean;
  dryRun?: boolean;
  noUpdateBranch?: boolean;
  message?: string;
  author?: {
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
}): Promise<MergeReport>;

export function packObjects(args: GitDir & {
  core?: string;
  fs?: any;
  oids: string[];
  write?: boolean;
}): Promise<PackObjectsResponse>;

export function pull(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  corsProxy?: string;
  singleBranch?: boolean;
  fastForwardOnly?: boolean;
  noGitSuffix?: boolean;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  headers?: { [key: string]: string };
  emitter?: EventEmitter;
  emitterPrefix?: string;
  autoTranslateSSH?: boolean;
  author?: {
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
  noSubmodules?: boolean;
}): Promise<void>;

export function push(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  remoteRef?: string;
  remote?: string;
  url?: string;
  corsProxy?: string;
  force?: boolean;
  delete?: boolean;
  noGitSuffix?: boolean;
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: 'github' | 'bitbucket' | 'gitlab';
  headers?: { [key: string]: string };
  emitter?: EventEmitter;
  emitterPrefix?: string;
  autoTranslateSSH?: boolean;
}): Promise<PushResponse>;

export function readBlob(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
  filepath?: string;
}): Promise<ReadBlobResult>;

export function readCommit(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
}): Promise<ReadCommitResult>;

export function readNote(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  oid: string;
}): Promise<Buffer>;

export function readObject(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
  format?: 'deflated' | 'wrapped' | 'content' | 'parsed';
  filepath?: string;
  encoding?: string;
}): Promise<GitObjectDescription>;

export function readTag(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
}): Promise<ReadTagResult>;

export function readTree(args: GitDir & {
  core?: string;
  fs?: any;
  oid: string;
  filepath?: string;
}): Promise<ReadTreeResult>;

export function remove(args: GitDir & {
  core?: string;
  fs?: any;
  filepath: string;
}): Promise<void>;

export function removeNote(args: GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  oid: string;
  author?: {
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

export function resetIndex(args: Partial<WorkDir> & GitDir & {
  core?: string;
  fs?: any,
  filepath: string,
  ref?: string
}): Promise<void>

export function resolveRef(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
  depth?: number;
}): Promise<string>;

export function sign(args: GitDir & {
  core?: string;
  fs?: any;
  privateKeys: string;
}): Promise<string>;

export function status(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  filepath: string;
}): Promise<string>;

export function statusMatrix(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  ref?: string;
  filepaths?: string[];
  pattern?: string;
  noSubmodules?: boolean;
}): Promise<StatusMatrix>;

export function tag(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
  object?: string;
  force?: boolean;
}): Promise<void>;

export function verify(args: GitDir & {
  core?: string;
  fs?: any;
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

export function walkBeta2<T, Q>(args: WorkDir & GitDir & {
  core?: string;
  fs?: any;
  trees: Walker[];
  filter?: (entries: WalkerEntry2[]) => Promise<boolean>;
  map?: (fullpath: string, entries: WalkerEntry2[]) => Promise<T | undefined>;
  reduce?: (parent: T | undefined, children: Q[]) => Promise<Q>;
  iterate?: (walk: (parent: WalkerEntry2[]) => Promise<Q>, children: Iterable<WalkerEntry2[]>) => Promise<Array<Q|undefined>>;
}): Promise<Q|undefined>;

export function writeBlob(args: GitDir & {
  core?: string;
  fs?: any;
  blob: Uint8Array;
}): Promise<string>;

export function writeCommit(args: GitDir & {
  core?: string;
  fs?: any;
  commit: CommitObject;
}): Promise<string>;

export function writeObject(args: GitDir & {
  core?: string;
  fs?: any;
  type?: 'blob' | 'tree' | 'commit' | 'tag';
  object: string | Buffer | CommitDescription | TreeDescription | TagDescription;
  format?: 'deflated' | 'wrapped' | 'content' | 'parsed';
  oid?: string;
  encoding?: string;
}): Promise<string>;

export function writeTag(args: GitDir & {
  core?: string;
  fs?: any;
  tag: TagObject;
}): Promise<string>;

export function writeTree(args: GitDir & {
  core?: string;
  fs?: any;
  tree: TreeObject;
}): Promise<string>;

type HashBlobResult = {
  oid: string;
  type: 'blob';
  object: Buffer;
  format: 'wrapped';
}

export function hashBlob(args: {
  core?: string;
  object: string | Buffer | CommitDescription | TreeDescription | TagDescription;
}): Promise<HashBlobResult>;

export function writeRef(args: GitDir & {
  core?: string;
  fs?: any;
  ref: string;
  value: string;
  force?: boolean;
  symbolic?: boolean;
}): Promise<void>;
