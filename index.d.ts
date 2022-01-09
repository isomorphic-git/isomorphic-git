export default index;
export type TreeEntry = {
    /**
     * - the 6 digit hexadecimal mode
     */
    mode: string;
    /**
     * - the name of the file or directory
     */
    path: string;
    /**
     * - the SHA-1 object id of the blob or tree
     */
    oid: string;
    /**
     * - the type of object
     */
    type: "blob" | "tree" | "commit";
};
/**
 * - The object returned has the following schema:
 */
export type ReadTreeResult = {
    /**
     * - SHA-1 object id of this tree
     */
    oid: string;
    /**
     * - the parsed tree object
     */
    tree: TreeEntry[];
};
/**
 * - The object returned has the following schema:
 */
export type FetchResult = {
    /**
     * - The branch that is cloned if no branch is specified
     */
    defaultBranch: string | null;
    /**
     * - The SHA-1 object id of the fetched head commit
     */
    fetchHead: string | null;
    /**
     * - a textual description of the branch that was fetched
     */
    fetchHeadDescription: string | null;
    /**
     * - The HTTP response headers returned by the git server
     */
    headers?: {
        [x: string]: string;
    };
    /**
     * - A list of branches that were pruned, if you provided the `prune` parameter
     */
    pruned?: string[];
};
/**
 * - Returns an object with a schema like this:
 */
export type MergeResult = {
    /**
     * - The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
     */
    oid?: string;
    /**
     * - True if the branch was already merged so no changes were made
     */
    alreadyMerged?: boolean;
    /**
     * - True if it was a fast-forward merge
     */
    fastForward?: boolean;
    /**
     * - True if merge resulted in a merge commit
     */
    mergeCommit?: boolean;
    /**
     * - The SHA-1 object id of the tree resulting from a merge commit
     */
    tree?: string;
};
/**
 * - The object returned has the following schema:
 */
export type GetRemoteInfoResult = {
    /**
     * - The list of capabilities returned by the server (part of the Git protocol)
     */
    capabilities: string[];
    refs?: any;
    /**
     * - The default branch of the remote
     */
    HEAD?: string;
    /**
     * - The branches on the remote
     */
    heads?: {
        [x: string]: string;
    };
    /**
     * - The special branches representing pull requests (non-standard)
     */
    pull?: {
        [x: string]: string;
    };
    /**
     * - The tags on the remote
     */
    tags?: {
        [x: string]: string;
    };
};
/**
 * - This object has the following schema:
 */
export type GetRemoteInfo2Result = {
    /**
     * - Git protocol version the server supports
     */
    protocolVersion: 1 | 2;
    /**
     * - An object of capabilities represented as keys and values
     */
    capabilities: {
        [x: string]: string | true;
    };
    /**
     * - Server refs (they get returned by protocol version 1 whether you want them or not)
     */
    refs?: ServerRef[];
};
/**
 * - The object returned has the following schema:
 */
export type HashBlobResult = {
    /**
     * - The SHA-1 object id
     */
    oid: string;
    /**
     * - The type of the object
     */
    type: "blob";
    /**
     * - The wrapped git object (the thing that is hashed)
     */
    object: Uint8Array;
    /**
     * - The format of the object
     */
    format: "wrapped";
};
/**
 * - This object has the following schema:
 */
export type ServerRef = {
    /**
     * - The name of the ref
     */
    ref: string;
    /**
     * - The SHA-1 object id the ref points to
     */
    oid: string;
    /**
     * - The target ref pointed to by a symbolic ref
     */
    target?: string;
    /**
     * - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
     */
    peeled?: string;
};
/**
 * The packObjects command returns an object with two properties:
 */
export type PackObjectsResult = {
    /**
     * - The suggested filename for the packfile if you want to save it to disk somewhere. It includes the packfile SHA.
     */
    filename: string;
    /**
     * - The packfile contents. Not present if `write` parameter was true, in which case the packfile was written straight to disk.
     */
    packfile?: Uint8Array;
};
/**
 * - The object returned has the following schema:
 */
export type ReadBlobResult = {
    oid: string;
    blob: Uint8Array;
};
export type DeflatedObject = {
    oid: string;
    type: "deflated";
    format: "deflated";
    object: Uint8Array;
    source?: string;
};
export type WrappedObject = {
    oid: string;
    type: "wrapped";
    format: "wrapped";
    object: Uint8Array;
    source?: string;
};
export type RawObject = {
    oid: string;
    type: "blob" | "tree" | "commit" | "tag";
    format: "content";
    object: Uint8Array;
    source?: string;
};
export type ParsedBlobObject = {
    oid: string;
    type: "blob";
    format: "parsed";
    object: string;
    source?: string;
};
export type ParsedCommitObject = {
    oid: string;
    type: "commit";
    format: "parsed";
    object: CommitObject;
    source?: string;
};
export type ParsedTreeObject = {
    oid: string;
    type: "tree";
    format: "parsed";
    object: TreeEntry[];
    source?: string;
};
export type ParsedTagObject = {
    oid: string;
    type: "tag";
    format: "parsed";
    object: TagObject;
    source?: string;
};
export type ParsedObject = ParsedBlobObject | ParsedCommitObject | ParsedTreeObject | ParsedTagObject;
export type ReadObjectResult = ParsedBlobObject | ParsedCommitObject | ParsedTreeObject | ParsedTagObject | DeflatedObject | WrappedObject | RawObject;
/**
 * - The object returned has the following schema:
 */
export type ReadTagResult = {
    /**
     * - SHA-1 object id of this tag
     */
    oid: string;
    /**
     * - the parsed tag object
     */
    tag: TagObject;
    /**
     * - PGP signing payload
     */
    payload: string;
};
export type WalkerMap = (filename: string, entries: (WalkerEntry | null)[]) => Promise<any>;
export type WalkerReduce = (parent: any, children: any[]) => Promise<any>;
export type WalkerIterateCallback = (entries: WalkerEntry[]) => Promise<any[]>;
export type WalkerIterate = (walk: WalkerIterateCallback, children: any) => Promise<any[]>;
export type GitProgressEvent = {
    phase: string;
    loaded: number;
    total: number;
};
export type ProgressCallback = (progress: GitProgressEvent) => void | Promise<void>;
export type GitHttpRequest = {
    /**
     * - The URL to request
     */
    url: string;
    /**
     * - The HTTP method to use
     */
    method?: string;
    /**
     * - Headers to include in the HTTP request
     */
    headers?: {
        [x: string]: string;
    };
    /**
     * - An async iterator of Uint8Arrays that make up the body of POST requests
     */
    body?: any;
    /**
     * - Reserved for future use (emitting `GitProgressEvent`s)
     */
    onProgress?: ProgressCallback;
    /**
     * - Reserved for future use (canceling a request)
     */
    signal?: any;
};
export type GitHttpResponse = {
    /**
     * - The final URL that was fetched after any redirects
     */
    url: string;
    /**
     * - The HTTP method that was used
     */
    method?: string;
    /**
     * - HTTP response headers
     */
    headers?: {
        [x: string]: string;
    };
    /**
     * - An async iterator of Uint8Arrays that make up the body of the response
     */
    body?: any;
    /**
     * - The HTTP status code
     */
    statusCode: number;
    /**
     * - The HTTP status message
     */
    statusMessage: string;
};
export type HttpFetch = (request: GitHttpRequest) => Promise<GitHttpResponse>;
export type HttpClient = {
    request: HttpFetch;
};
/**
 * A git commit object.
 */
export type CommitObject = {
    /**
     * Commit message
     */
    message: string;
    /**
     * SHA-1 object id of corresponding file tree
     */
    tree: string;
    /**
     * an array of zero or more SHA-1 object ids
     */
    parent: string[];
    author: {
        /**
         * The author's name
         */
        name: string;
        /**
         * The author's email
         */
        email: string;
        /**
         * UTC Unix timestamp in seconds
         */
        timestamp: number;
        /**
         * Timezone difference from UTC in minutes
         */
        timezoneOffset: number;
    };
    committer: {
        /**
         * The committer's name
         */
        name: string;
        /**
         * The committer's email
         */
        email: string;
        /**
         * UTC Unix timestamp in seconds
         */
        timestamp: number;
        /**
         * Timezone difference from UTC in minutes
         */
        timezoneOffset: number;
    };
    /**
     * PGP signature (if present)
     */
    gpgsig?: string;
};
/**
 * A git tree object. Trees represent a directory snapshot.
 */
export type TreeObject = TreeEntry[];
/**
 * A git annotated tag object.
 */
export type TagObject = {
    /**
     * SHA-1 object id of object being tagged
     */
    object: string;
    /**
     * the type of the object being tagged
     */
    type: "blob" | "tree" | "commit" | "tag";
    /**
     * the tag name
     */
    tag: string;
    tagger: {
        /**
         * the tagger's name
         */
        name: string;
        /**
         * the tagger's email
         */
        email: string;
        /**
         * UTC Unix timestamp in seconds
         */
        timestamp: number;
        /**
         * timezone difference from UTC in minutes
         */
        timezoneOffset: number;
    };
    /**
     * tag message
     */
    message: string;
    /**
     * PGP signature (if present)
     */
    gpgsig?: string;
};
export type ReadCommitResult = {
    /**
     * - SHA-1 object id of this commit
     */
    oid: string;
    /**
     * - the parsed commit object
     */
    commit: CommitObject;
    /**
     * - PGP signing payload
     */
    payload: string;
};
export type Walker = {
    /**
     * ('GitWalkerSymbol')
     */
    Symbol: Symbol;
};
/**
 * Normalized subset of filesystem `stat` data:
 */
export type Stat = {
    ctimeSeconds: number;
    ctimeNanoseconds: number;
    mtimeSeconds: number;
    mtimeNanoseconds: number;
    dev: number;
    ino: number;
    mode: number;
    uid: number;
    gid: number;
    size: number;
};
/**
 * The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.
 */
export type WalkerEntry = {
    type: () => Promise<"blob" | "tree" | "commit" | "special">;
    mode: () => Promise<number>;
    oid: () => Promise<string>;
    content: () => Promise<void | Uint8Array>;
    stat: () => Promise<Stat>;
};
export type CallbackFsClient = {
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
     */
    readFile: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
     */
    writeFile: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback
     */
    unlink: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback
     */
    readdir: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback
     */
    mkdir: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback
     */
    rmdir: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback
     */
    stat: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback
     */
    lstat: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback
     */
    readlink?: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback
     */
    symlink?: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback
     */
    chmod?: Function;
};
export type PromiseFsClient = {
    promises: {
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
         */
        readFile: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
         */
        writeFile: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
         */
        unlink: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
         */
        readdir: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
         */
        mkdir: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path
         */
        rmdir: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
         */
        stat: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
         */
        lstat: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
         */
        readlink?: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
         */
        symlink?: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
         */
        chmod?: Function;
    };
};
export type FsClient = CallbackFsClient | PromiseFsClient;
export type MessageCallback = (message: string) => void | Promise<void>;
export type GitAuth = {
    username?: string;
    password?: string;
    headers?: {
        [x: string]: string;
    };
    /**
     * Tells git to throw a `UserCanceledError` (instead of an `HttpError`).
     */
    cancel?: boolean;
};
export type AuthCallback = (url: string, auth: GitAuth) => void | GitAuth | Promise<void | GitAuth>;
export type AuthFailureCallback = (url: string, auth: GitAuth) => void | GitAuth | Promise<void | GitAuth>;
export type AuthSuccessCallback = (url: string, auth: GitAuth) => void | Promise<void>;
export type SignParams = {
    /**
     * - a plaintext message
     */
    payload: string;
    /**
     * - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
     */
    secretKey: string;
};
export type SignCallback = (args: SignParams) => {
    signature: string;
} | Promise<{
    signature: string;
}>;
export type RefUpdateStatus = {
    ok: boolean;
    error: string;
};
export type PushResult = {
    ok: boolean;
    error: string | null;
    refs: {
        [x: string]: RefUpdateStatus;
    };
    headers?: {
        [x: string]: string;
    };
};
export type HeadStatus = 0 | 1;
export type WorkdirStatus = 0 | 1 | 2;
export type StageStatus = 0 | 1 | 2 | 3;
export type StatusRow = [string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3];
export type types = number;
declare namespace index {
    export { Errors };
    export { STAGE };
    export { TREE };
    export { WORKDIR };
    export { add };
    export { addNote };
    export { addRemote };
    export { annotatedTag };
    export { branch };
    export { checkout };
    export { clone };
    export { commit };
    export { getConfig };
    export { getConfigAll };
    export { setConfig };
    export { currentBranch };
    export { deleteBranch };
    export { deleteRef };
    export { deleteRemote };
    export { deleteTag };
    export { expandOid };
    export { expandRef };
    export { fastForward };
    export { fetch };
    export { findMergeBase };
    export { findRoot };
    export { getRemoteInfo };
    export { getRemoteInfo2 };
    export { hashBlob };
    export { indexPack };
    export { init };
    export { isDescendent };
    export { isIgnored };
    export { listBranches };
    export { listFiles };
    export { listNotes };
    export { listRemotes };
    export { listServerRefs };
    export { listTags };
    export { log };
    export { merge };
    export { packObjects };
    export { pull };
    export { push };
    export { readBlob };
    export { readCommit };
    export { readNote };
    export { readObject };
    export { readTag };
    export { readTree };
    export { remove };
    export { removeNote };
    export { renameBranch };
    export { resetIndex };
    export { resolveRef };
    export { status };
    export { statusMatrix };
    export { tag };
    export { version };
    export { walk };
    export { writeBlob };
    export { writeCommit };
    export { writeObject };
    export { writeRef };
    export { writeTag };
    export { writeTree };
}
export var Errors: Readonly<{
    __proto__: null;
    AlreadyExistsError: typeof AlreadyExistsError;
    AmbiguousError: typeof AmbiguousError;
    CheckoutConflictError: typeof CheckoutConflictError;
    CommitNotFetchedError: typeof CommitNotFetchedError;
    EmptyServerResponseError: typeof EmptyServerResponseError;
    FastForwardError: typeof FastForwardError;
    GitPushError: typeof GitPushError;
    HttpError: typeof HttpError;
    InternalError: typeof InternalError;
    InvalidFilepathError: typeof InvalidFilepathError;
    InvalidOidError: typeof InvalidOidError;
    InvalidRefNameError: typeof InvalidRefNameError;
    MaxDepthError: typeof MaxDepthError;
    MergeNotSupportedError: typeof MergeNotSupportedError;
    MissingNameError: typeof MissingNameError;
    MissingParameterError: typeof MissingParameterError;
    NoRefspecError: typeof NoRefspecError;
    NotFoundError: typeof NotFoundError;
    ObjectTypeError: typeof ObjectTypeError;
    ParseError: typeof ParseError;
    PushRejectedError: typeof PushRejectedError;
    RemoteCapabilityError: typeof RemoteCapabilityError;
    SmartHttpError: typeof SmartHttpError;
    UnknownTransportError: typeof UnknownTransportError;
    UnsafeFilepathError: typeof UnsafeFilepathError;
    UrlParseError: typeof UrlParseError;
    UserCanceledError: typeof UserCanceledError;
}>;
/**
 * @returns {Walker}
 */
export function STAGE(): Walker;
/**
 * @param {object} args
 * @param {string} [args.ref='HEAD']
 * @returns {Walker}
 */
export function TREE({ ref }: {
    ref?: string;
}): Walker;
/**
 * @returns {Walker}
 */
export function WORKDIR(): Walker;
/**
 * Add a file to the git index (aka staging area)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to add to the index
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await fs.promises.writeFile('/tutorial/README.md', `# TEST`)
 * await git.add({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log('done')
 *
 */
export function add({ fs: _fs, dir, gitdir, filepath, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir: string;
    gitdir?: string;
    filepath: string;
    cache?: any;
}): Promise<void>;
/**
 * Add or update an object note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid - The SHA-1 object id of the object to add the note to.
 * @param {string|Uint8Array} args.note - The note to add
 * @param {boolean} [args.force] - Over-write note if it already exists.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {number} [args.author.timestamp=Math.floor(Date.now()/1000)] - Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the note committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - Sign the note commit using this private PGP key.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the commit object for the added note.
 */
export function addNote({ fs: _fs, onSign, dir, gitdir, ref, oid, note, force, author: _author, committer: _committer, signingKey, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onSign?: SignCallback;
    dir?: string;
    gitdir?: string;
    ref?: string;
    oid: string;
    note: string | Uint8Array;
    force?: boolean;
    author?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    committer?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    signingKey?: string;
    cache?: any;
}): Promise<string>;
/**
 * Add or update a remote
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.remote - The name of the remote
 * @param {string} args.url - The URL of the remote
 * @param {boolean} [args.force = false] - Instead of throwing an error if a remote named `remote` already exists, overwrite the existing remote.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.addRemote({
 *   fs,
 *   dir: '/tutorial',
 *   remote: 'upstream',
 *   url: 'https://github.com/isomorphic-git/isomorphic-git'
 * })
 * console.log('done')
 *
 */
export function addRemote({ fs, dir, gitdir, remote, url, force, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    remote: string;
    url: string;
    force?: boolean;
}): Promise<void>;
/**
 * Create an annotated tag.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the tag
 * @param {string} [args.message = ref] - The tag message to use.
 * @param {string} [args.object = 'HEAD'] - The SHA-1 object id the tag points to. (Will resolve to a SHA-1 object id if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used.
 * @param {object} [args.tagger] - The details about the tagger.
 * @param {string} [args.tagger.name] - Default is `user.name` config.
 * @param {string} [args.tagger.email] - Default is `user.email` config.
 * @param {number} [args.tagger.timestamp=Math.floor(Date.now()/1000)] - Set the tagger timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.tagger.timezoneOffset] - Set the tagger timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.gpgsig] - The gpgsig attatched to the tag object. (Mutually exclusive with the `signingKey` option.)
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key. (Mutually exclusive with the `gpgsig` option.)
 * @param {boolean} [args.force = false] - Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag. Note that this option does not modify the original tag object itself.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.annotatedTag({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'test-tag',
 *   message: 'This commit is awesome',
 *   tagger: {
 *     name: 'Mr. Test',
 *     email: 'mrtest@example.com'
 *   }
 * })
 * console.log('done')
 *
 */
export function annotatedTag({ fs: _fs, onSign, dir, gitdir, ref, tagger: _tagger, message, gpgsig, object, signingKey, force, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onSign?: SignCallback;
    dir?: string;
    gitdir?: string;
    ref: string;
    message?: string;
    object?: string;
    tagger?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    gpgsig?: string;
    signingKey?: string;
    force?: boolean;
    cache?: any;
}): Promise<void>;
/**
 * Create a branch
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the branch
 * @param {boolean} [args.checkout = false] - Update `HEAD` to point at the newly created branch
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.branch({ fs, dir: '/tutorial', ref: 'develop' })
 * console.log('done')
 *
 */
export function branch({ fs, dir, gitdir, ref, checkout, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
    checkout?: boolean;
}): Promise<void>;
/**
 * Checkout a branch
 *
 * If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - Source to checkout files from
 * @param {string[]} [args.filepaths] - Limit the checkout to the given files and directories
 * @param {string} [args.remote = 'origin'] - Which remote repository to use
 * @param {boolean} [args.noCheckout = false] - If true, will update HEAD but won't update the working directory
 * @param {boolean} [args.noUpdateHead] - If true, will update the working directory but won't update HEAD. Defaults to `false` when `ref` is provided, and `true` if `ref` is not provided.
 * @param {boolean} [args.dryRun = false] - If true, simulates a checkout so you can test whether it would succeed.
 * @param {boolean} [args.force = false] - If true, conflicts will be ignored and files will be overwritten regardless of local changes.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * // switch to the main branch
 * await git.checkout({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'main'
 * })
 * console.log('done')
 *
 * @example
 * // restore the 'docs' and 'src/docs' folders to the way they were, overwriting any changes
 * await git.checkout({
 *   fs,
 *   dir: '/tutorial',
 *   force: true,
 *   filepaths: ['docs', 'src/docs']
 * })
 * console.log('done')
 *
 * @example
 * // restore the 'docs' and 'src/docs' folders to the way they are in the 'develop' branch, overwriting any changes
 * await git.checkout({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'develop',
 *   noUpdateHead: true,
 *   force: true,
 *   filepaths: ['docs', 'src/docs']
 * })
 * console.log('done')
 */
export function checkout({ fs, onProgress, dir, gitdir, remote, ref: _ref, filepaths, noCheckout, noUpdateHead, dryRun, force, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onProgress?: ProgressCallback;
    dir: string;
    gitdir?: string;
    ref?: string;
    filepaths?: string[];
    remote?: string;
    noCheckout?: boolean;
    noUpdateHead?: boolean;
    dryRun?: boolean;
    force?: boolean;
    cache?: any;
}): Promise<void>;
/**
 * Clone a repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.url - The URL of the remote repository
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Value is stored in the git config file for that repo.
 * @param {string} [args.ref] - Which branch to checkout. By default this is the designated "main branch" of the repository.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.noCheckout = false] - If true, clone will only fetch the repo, not check out a branch. Skipping checkout can save a lot of time normally spent writing files to disk.
 * @param {boolean} [args.noTags = false] - By default clone will fetch all tags. `noTags` disables that behavior.
 * @param {string} [args.remote = 'origin'] - What to name the remote that is created.
 * @param {number} [args.depth] - Integer. Determines how much of the git repository's history to retrieve
 * @param {Date} [args.since] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude = []] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.relative = false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {Object<string, string>} [args.headers = {}] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully when clone completes
 *
 * @example
 * await git.clone({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   corsProxy: 'https://cors.isomorphic-git.org',
 *   url: 'https://github.com/isomorphic-git/isomorphic-git',
 *   singleBranch: true,
 *   depth: 1
 * })
 * console.log('done')
 *
 */
export function clone({ fs, http, onProgress, onMessage, onAuth, onAuthSuccess, onAuthFailure, dir, gitdir, url, corsProxy, ref, remote, depth, since, exclude, relative, singleBranch, noCheckout, noTags, headers, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    http: HttpClient;
    onProgress?: ProgressCallback;
    onMessage?: MessageCallback;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    dir: string;
    gitdir?: string;
    url: string;
    corsProxy?: string;
    ref?: string;
    singleBranch?: boolean;
    noCheckout?: boolean;
    noTags?: boolean;
    remote?: string;
    depth?: number;
    since?: Date;
    exclude?: string[];
    relative?: boolean;
    headers?: {
        [x: string]: string;
    };
    cache?: any;
}): Promise<void>;
/**
 * Create a new commit
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.message - The commit message to use.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {number} [args.author.timestamp=Math.floor(Date.now()/1000)] - Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key.
 * @param {boolean} [args.dryRun = false] - If true, simulates making a commit so you can test whether it would succeed. Implies `noUpdateBranch`.
 * @param {boolean} [args.noUpdateBranch = false] - If true, does not update the branch pointer after creating the commit.
 * @param {string} [args.ref] - The fully expanded name of the branch to commit to. Default is the current branch pointed to by HEAD. (TODO: fix it so it can expand branch names without throwing if the branch doesn't exist yet.)
 * @param {string[]} [args.parent] - The SHA-1 object ids of the commits to use as parents. If not specified, the commit pointed to by `ref` is used.
 * @param {string} [args.tree] - The SHA-1 object id of the tree to use. If not specified, a new tree object is created from the current git index.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit.
 *
 * @example
 * let sha = await git.commit({
 *   fs,
 *   dir: '/tutorial',
 *   author: {
 *     name: 'Mr. Test',
 *     email: 'mrtest@example.com',
 *   },
 *   message: 'Added the a.txt file'
 * })
 * console.log(sha)
 *
 */
export function commit({ fs: _fs, onSign, dir, gitdir, message, author: _author, committer: _committer, signingKey, dryRun, noUpdateBranch, ref, parent, tree, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onSign?: SignCallback;
    dir?: string;
    gitdir?: string;
    message: string;
    author?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    committer?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    signingKey?: string;
    dryRun?: boolean;
    noUpdateBranch?: boolean;
    ref?: string;
    parent?: string[];
    tree?: string;
    cache?: any;
}): Promise<string>;
/**
 * Get the name of the branch currently pointed to by .git/HEAD
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.fullname = false] - Return the full path (e.g. "refs/heads/main") instead of the abbreviated form.
 * @param {boolean} [args.test = false] - If the current branch doesn't actually exist (such as right after git init) then return `undefined`.
 *
 * @returns {Promise<string|void>} The name of the current branch or undefined if the HEAD is detached.
 *
 * @example
 * // Get the current branch name
 * let branch = await git.currentBranch({
 *   fs,
 *   dir: '/tutorial',
 *   fullname: false
 * })
 * console.log(branch)
 *
 */
export function currentBranch({ fs, dir, gitdir, fullname, test, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    fullname?: boolean;
    test?: boolean;
}): Promise<string | void>;
/**
 * Delete a local branch
 *
 * > Note: This only deletes loose branches - it should be fixed in the future to delete packed branches as well.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The branch to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteBranch({ fs, dir: '/tutorial', ref: 'local-branch' })
 * console.log('done')
 *
 */
export function deleteBranch({ fs, dir, gitdir, ref, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
}): Promise<void>;
/**
 * Delete a local ref
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteRef({ fs, dir: '/tutorial', ref: 'refs/tags/test-tag' })
 * console.log('done')
 *
 */
export function deleteRef({ fs, dir, gitdir, ref }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
}): Promise<void>;
/**
 * Removes the local config entry for a given remote
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.remote - The name of the remote to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteRemote({ fs, dir: '/tutorial', remote: 'upstream' })
 * console.log('done')
 *
 */
export function deleteRemote({ fs, dir, gitdir, remote, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    remote: string;
}): Promise<void>;
/**
 * Delete a local tag ref
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The tag to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteTag({ fs, dir: '/tutorial', ref: 'test-tag' })
 * console.log('done')
 *
 */
export function deleteTag({ fs, dir, gitdir, ref }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
}): Promise<void>;
/**
 * Expand and resolve a short oid into a full oid
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The shortened oid prefix to expand (like "0414d2a")
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<string>} Resolves successfully with the full oid (like "0414d2a286d7bbc7a4a326a61c1f9f888a8ab87f")
 *
 * @example
 * let oid = await git.expandOid({ fs, dir: '/tutorial', oid: '0414d2a'})
 * console.log(oid)
 *
 */
export function expandOid({ fs, dir, gitdir, oid, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    cache?: any;
}): Promise<string>;
/**
 * Expand an abbreviated ref to its full name
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to expand (like "v1.0.0")
 *
 * @returns {Promise<string>} Resolves successfully with a full ref name ("refs/tags/v1.0.0")
 *
 * @example
 * let fullRef = await git.expandRef({ fs, dir: '/tutorial', ref: 'main'})
 * console.log(fullRef)
 *
 */
export function expandRef({ fs, dir, gitdir, ref }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
}): Promise<string>;
/**
 * Like `pull`, but hard-coded with `fastForward: true` so there is no need for an `author` parameter.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch to merge into. By default this is the currently checked out branch.
 * @param {string} [args.url] - (Added in 1.1.0) The URL of the remote repository. The default is the value set in the git config for that remote.
 * @param {string} [args.remote] - (Added in 1.1.0) If URL is not specified, determines which remote to use.
 * @param {string} [args.remoteRef] - (Added in 1.1.0) The name of the branch on the remote to fetch. By default this is the configured remote tracking branch.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully when pull operation completes
 *
 * @example
 * await git.fastForward({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   ref: 'main',
 *   singleBranch: true
 * })
 * console.log('done')
 *
 */
export function fastForward({ fs, http, onProgress, onMessage, onAuth, onAuthSuccess, onAuthFailure, dir, gitdir, ref, url, remote, remoteRef, corsProxy, singleBranch, headers, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    http: HttpClient;
    onProgress?: ProgressCallback;
    onMessage?: MessageCallback;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    dir: string;
    gitdir?: string;
    ref?: string;
    url?: string;
    remote?: string;
    remoteRef?: string;
    corsProxy?: string;
    singleBranch?: boolean;
    headers?: {
        [x: string]: string;
    };
    cache?: any;
}): Promise<void>;
/**
 *
 * @typedef {object} FetchResult - The object returned has the following schema:
 * @property {string | null} defaultBranch - The branch that is cloned if no branch is specified
 * @property {string | null} fetchHead - The SHA-1 object id of the fetched head commit
 * @property {string | null} fetchHeadDescription - a textual description of the branch that was fetched
 * @property {Object<string, string>} [headers] - The HTTP response headers returned by the git server
 * @property {string[]} [pruned] - A list of branches that were pruned, if you provided the `prune` parameter
 *
 */
/**
 * Fetch commits from a remote repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.url] - The URL of the remote repository. The default is the value set in the git config for that remote.
 * @param {string} [args.remote] - If URL is not specified, determines which remote to use.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {string} [args.ref] - Which branch to fetch if `singleBranch` is true. By default this is the current branch or the remote's default branch.
 * @param {string} [args.remoteRef] - The name of the branch on the remote to fetch if `singleBranch` is true. By default this is the configured remote tracking branch.
 * @param {boolean} [args.tags = false] - Also fetch tags
 * @param {number} [args.depth] - Integer. Determines how much of the git repository's history to retrieve
 * @param {boolean} [args.relative = false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {Date} [args.since] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude = []] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.prune] - Delete local remote-tracking branches that are not present on the remote
 * @param {boolean} [args.pruneTags] - Prune local tags that don’t exist on the remote, and force-update those tags that differ
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<FetchResult>} Resolves successfully when fetch completes
 * @see FetchResult
 *
 * @example
 * let result = await git.fetch({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   corsProxy: 'https://cors.isomorphic-git.org',
 *   url: 'https://github.com/isomorphic-git/isomorphic-git',
 *   ref: 'main',
 *   depth: 1,
 *   singleBranch: true,
 *   tags: false
 * })
 * console.log(result)
 *
 */
export function fetch({ fs, http, onProgress, onMessage, onAuth, onAuthSuccess, onAuthFailure, dir, gitdir, ref, remote, remoteRef, url, corsProxy, depth, since, exclude, relative, tags, singleBranch, headers, prune, pruneTags, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    http: HttpClient;
    onProgress?: ProgressCallback;
    onMessage?: MessageCallback;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    dir?: string;
    gitdir?: string;
    url?: string;
    remote?: string;
    singleBranch?: boolean;
    ref?: string;
    remoteRef?: string;
    tags?: boolean;
    depth?: number;
    relative?: boolean;
    since?: Date;
    exclude?: string[];
    prune?: boolean;
    pruneTags?: boolean;
    corsProxy?: string;
    headers?: {
        [x: string]: string;
    };
    cache?: any;
}): Promise<FetchResult>;
/**
 * Find the merge base for a set of commits
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids - Which commits
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 */
export function findMergeBase({ fs, dir, gitdir, oids, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oids: string[];
    cache?: any;
}): Promise<any[]>;
/**
 * Find the root git directory
 *
 * Starting at `filepath`, walks upward until it finds a directory that contains a subdirectory called '.git'.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.filepath - The file directory to start searching in.
 *
 * @returns {Promise<string>} Resolves successfully with a root git directory path
 * @throws {NotFoundError}
 *
 * @example
 * let gitroot = await git.findRoot({
 *   fs,
 *   filepath: '/tutorial/src/utils'
 * })
 * console.log(gitroot)
 *
 */
export function findRoot({ fs, filepath }: {
    fs: CallbackFsClient | PromiseFsClient;
    filepath: string;
}): Promise<string>;
/**
 * Read an entry from the git config files.
 *
 * *Caveats:*
 * - Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
 * - The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The key of the git config entry
 *
 * @returns {Promise<any>} Resolves with the config value
 *
 * @example
 * // Read config value
 * let value = await git.getConfig({
 *   fs,
 *   dir: '/tutorial',
 *   path: 'remote.origin.url'
 * })
 * console.log(value)
 *
 */
export function getConfig({ fs, dir, gitdir, path }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    path: string;
}): Promise<any>;
/**
 * Read a multi-valued entry from the git config files.
 *
 * *Caveats:*
 * - Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
 * - The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The key of the git config entry
 *
 * @returns {Promise<Array<any>>} Resolves with the config value
 *
 */
export function getConfigAll({ fs, dir, gitdir, path, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    path: string;
}): Promise<any[]>;
/**
 *
 * @typedef {Object} GetRemoteInfoResult - The object returned has the following schema:
 * @property {string[]} capabilities - The list of capabilities returned by the server (part of the Git protocol)
 * @property {Object} [refs]
 * @property {string} [HEAD] - The default branch of the remote
 * @property {Object<string, string>} [refs.heads] - The branches on the remote
 * @property {Object<string, string>} [refs.pull] - The special branches representing pull requests (non-standard)
 * @property {Object<string, string>} [refs.tags] - The tags on the remote
 *
 */
/**
 * List a remote servers branches, tags, and capabilities.
 *
 * This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
 * It just communicates to a remote git server, using the first step of the `git-upload-pack` handshake, but stopping short of fetching the packfile.
 *
 * @param {object} args
 * @param {HttpClient} args.http - an HTTP client
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.url - The URL of the remote repository. Will be gotten from gitconfig if absent.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.forPush = false] - By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 *
 * @returns {Promise<GetRemoteInfoResult>} Resolves successfully with an object listing the branches, tags, and capabilities of the remote.
 * @see GetRemoteInfoResult
 *
 * @example
 * let info = await git.getRemoteInfo({
 *   http,
 *   url:
 *     "https://cors.isomorphic-git.org/github.com/isomorphic-git/isomorphic-git.git"
 * });
 * console.log(info);
 *
 */
export function getRemoteInfo({ http, onAuth, onAuthSuccess, onAuthFailure, corsProxy, url, headers, forPush, }: {
    http: HttpClient;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    url: string;
    corsProxy?: string;
    forPush?: boolean;
    headers?: {
        [x: string]: string;
    };
}): Promise<GetRemoteInfoResult>;
/**
 * @typedef {Object} GetRemoteInfo2Result - This object has the following schema:
 * @property {1 | 2} protocolVersion - Git protocol version the server supports
 * @property {Object<string, string | true>} capabilities - An object of capabilities represented as keys and values
 * @property {ServerRef[]} [refs] - Server refs (they get returned by protocol version 1 whether you want them or not)
 */
/**
 * List a remote server's capabilities.
 *
 * This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
 * It just communicates to a remote git server, determining what protocol version, commands, and features it supports.
 *
 * > The successor to [`getRemoteInfo`](./getRemoteInfo.md), this command supports Git Wire Protocol Version 2.
 * > Therefore its return type is more complicated as either:
 * >
 * > - v1 capabilities (and refs) or
 * > - v2 capabilities (and no refs)
 * >
 * > are returned.
 * > If you just care about refs, use [`listServerRefs`](./listServerRefs.md)
 *
 * @param {object} args
 * @param {HttpClient} args.http - an HTTP client
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.url - The URL of the remote repository. Will be gotten from gitconfig if absent.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.forPush = false] - By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {1 | 2} [args.protocolVersion = 2] - Which version of the Git Protocol to use.
 *
 * @returns {Promise<GetRemoteInfo2Result>} Resolves successfully with an object listing the capabilities of the remote.
 * @see GetRemoteInfo2Result
 * @see ServerRef
 *
 * @example
 * let info = await git.getRemoteInfo2({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git"
 * });
 * console.log(info);
 *
 */
export function getRemoteInfo2({ http, onAuth, onAuthSuccess, onAuthFailure, corsProxy, url, headers, forPush, protocolVersion, }: {
    http: HttpClient;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    url: string;
    corsProxy?: string;
    forPush?: boolean;
    headers?: {
        [x: string]: string;
    };
    protocolVersion?: 1 | 2;
}): Promise<GetRemoteInfo2Result>;
/**
 *
 * @typedef {object} HashBlobResult - The object returned has the following schema:
 * @property {string} oid - The SHA-1 object id
 * @property {'blob'} type - The type of the object
 * @property {Uint8Array} object - The wrapped git object (the thing that is hashed)
 * @property {'wrapped'} format - The format of the object
 *
 */
/**
 * Compute what the SHA-1 object id of a file would be
 *
 * @param {object} args
 * @param {Uint8Array|string} args.object - The object to write. If `object` is a String then it will be converted to a Uint8Array using UTF-8 encoding.
 *
 * @returns {Promise<HashBlobResult>} Resolves successfully with the SHA-1 object id and the wrapped object Uint8Array.
 * @see HashBlobResult
 *
 * @example
 * let { oid, type, object, format } = await git.hashBlob({
 *   object: 'Hello world!',
 * })
 *
 * console.log('oid', oid)
 * console.log('type', type)
 * console.log('object', object)
 * console.log('format', format)
 *
 */
export function hashBlob({ object }: {
    object: string | Uint8Array;
}): Promise<HashBlobResult>;
/**
 * Create the .idx file for a given .pack file
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the .pack file to index
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<{oids: string[]}>} Resolves with a list of the SHA-1 object ids contained in the packfile
 *
 * @example
 * let packfiles = await fs.promises.readdir('/tutorial/.git/objects/pack')
 * packfiles = packfiles.filter(name => name.endsWith('.pack'))
 * console.log('packfiles', packfiles)
 *
 * const { oids } = await git.indexPack({
 *   fs,
 *   dir: '/tutorial',
 *   filepath: `.git/objects/pack/${packfiles[0]}`,
 *   async onProgress (evt) {
 *     console.log(`${evt.phase}: ${evt.loaded} / ${evt.total}`)
 *   }
 * })
 * console.log(oids)
 *
 */
export function indexPack({ fs, onProgress, dir, gitdir, filepath, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onProgress?: ProgressCallback;
    dir: string;
    gitdir?: string;
    filepath: string;
    cache?: any;
}): Promise<{
    oids: string[];
}>;
/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.bare = false] - Initialize a bare repository
 * @param {string} [args.defaultBranch = 'master'] - The name of the default branch (might be changed to a required argument in 2.0.0)
 * @returns {Promise<void>}  Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.init({ fs, dir: '/tutorial' })
 * console.log('done')
 *
 */
export function init({ fs, bare, dir, gitdir, defaultBranch, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    bare?: boolean;
    defaultBranch?: string;
}): Promise<void>;
/**
 * Check whether a git commit is descended from another
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The descendent commit
 * @param {string} args.ancestor - The (proposed) ancestor commit
 * @param {number} [args.depth = -1] - Maximum depth to search before giving up. -1 means no maximum depth.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<boolean>} Resolves to true if `oid` is a descendent of `ancestor`
 *
 * @example
 * let oid = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
 * let ancestor = await git.resolveRef({ fs, dir: '/tutorial', ref: 'v0.20.0' })
 * console.log(oid, ancestor)
 * await git.isDescendent({ fs, dir: '/tutorial', oid, ancestor, depth: -1 })
 *
 */
export function isDescendent({ fs, dir, gitdir, oid, ancestor, depth, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    ancestor: string;
    depth?: number;
    cache?: any;
}): Promise<boolean>;
/**
 * Test whether a filepath should be ignored (because of .gitignore or .git/exclude)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The filepath to test
 *
 * @returns {Promise<boolean>} Resolves to true if the file should be ignored
 *
 * @example
 * await git.isIgnored({ fs, dir: '/tutorial', filepath: 'docs/add.md' })
 *
 */
export function isIgnored({ fs, dir, gitdir, filepath, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir: string;
    gitdir?: string;
    filepath: string;
}): Promise<boolean>;
/**
 * List branches
 *
 * By default it lists local branches. If a 'remote' is specified, it lists the remote's branches. When listing remote branches, the HEAD branch is not filtered out, so it may be included in the list of results.
 *
 * Note that specifying a remote does not actually contact the server and update the list of branches.
 * If you want an up-to-date list, first do a `fetch` to that remote.
 * (Which branch you fetch doesn't matter - the list of branches available on the remote is updated during the fetch handshake.)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.remote] - Instead of the branches in `refs/heads`, list the branches in `refs/remotes/${remote}`.
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of branch names
 *
 * @example
 * let branches = await git.listBranches({ fs, dir: '/tutorial' })
 * console.log(branches)
 * let remoteBranches = await git.listBranches({ fs, dir: '/tutorial', remote: 'origin' })
 * console.log(remoteBranches)
 *
 */
export function listBranches({ fs, dir, gitdir, remote, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    remote?: string;
}): Promise<string[]>;
/**
 * List all the files in the git index or a commit
 *
 * > Note: This function is efficient for listing the files in the staging area, but listing all the files in a commit requires recursively walking through the git object store.
 * > If you do not require a complete list of every file, better performance can be achieved by using [walk](./walk) and ignoring subdirectories you don't care about.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Return a list of all the files in the commit at `ref` instead of the files currently in the git index (aka staging area)
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of filepaths
 *
 * @example
 * // All the files in the previous commit
 * let files = await git.listFiles({ fs, dir: '/tutorial', ref: 'HEAD' })
 * console.log(files)
 * // All the files in the current staging area
 * files = await git.listFiles({ fs, dir: '/tutorial' })
 * console.log(files)
 *
 */
export function listFiles({ fs, dir, gitdir, ref, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref?: string;
    cache?: any;
}): Promise<string[]>;
/**
 * List all the object notes
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<{target: string, note: string}>>} Resolves successfully with an array of entries containing SHA-1 object ids of the note and the object the note targets
 */
export function listNotes({ fs, dir, gitdir, ref, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref?: string;
    cache?: any;
}): Promise<{
    target: string;
    note: string;
}[]>;
/**
 * List remotes
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 *
 * @returns {Promise<Array<{remote: string, url: string}>>} Resolves successfully with an array of `{remote, url}` objects
 *
 * @example
 * let remotes = await git.listRemotes({ fs, dir: '/tutorial' })
 * console.log(remotes)
 *
 */
export function listRemotes({ fs, dir, gitdir }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
}): Promise<{
    remote: string;
    url: string;
}[]>;
/**
 * Fetch a list of refs (branches, tags, etc) from a server.
 *
 * This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
 * It just requires an `http` argument.
 *
 * ### About `protocolVersion`
 *
 * There's a rather fun trade-off between Git Protocol Version 1 and Git Protocol Version 2.
 * Version 2 actually requires 2 HTTP requests instead of 1, making it similar to fetch or push in that regard.
 * However, version 2 supports server-side filtering by prefix, whereas that filtering is done client-side in version 1.
 * Which protocol is most efficient therefore depends on the number of refs on the remote, the latency of the server, and speed of the network connection.
 * For an small repos (or fast Internet connections), the requirement to make two trips to the server makes protocol 2 slower.
 * But for large repos (or slow Internet connections), the decreased payload size of the second request makes up for the additional request.
 *
 * Hard numbers vary by situation, but here's some numbers from my machine:
 *
 * Using isomorphic-git in a browser, with a CORS proxy, listing only the branches (refs/heads) of https://github.com/isomorphic-git/isomorphic-git
 * - Protocol Version 1 took ~300ms and transfered 84 KB.
 * - Protocol Version 2 took ~500ms and transfered 4.1 KB.
 *
 * Using isomorphic-git in a browser, with a CORS proxy, listing only the branches (refs/heads) of https://gitlab.com/gitlab-org/gitlab
 * - Protocol Version 1 took ~4900ms and transfered 9.41 MB.
 * - Protocol Version 2 took ~1280ms and transfered 433 KB.
 *
 * Finally, there is a fun quirk regarding the `symrefs` parameter.
 * Protocol Version 1 will generally only return the `HEAD` symref and not others.
 * Historically, this meant that servers don't use symbolic refs except for `HEAD`, which is used to point at the "default branch".
 * However Protocol Version 2 can return *all* the symbolic refs on the server.
 * So if you are running your own git server, you could take advantage of that I guess.
 *
 * #### TL;DR
 * If you are _not_ taking advantage of `prefix` I would recommend `protocolVersion: 1`.
 * Otherwise, I recommend to use the default which is `protocolVersion: 2`.
 *
 * @param {object} args
 * @param {HttpClient} args.http - an HTTP client
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.url - The URL of the remote repository. Will be gotten from gitconfig if absent.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.forPush = false] - By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {1 | 2} [args.protocolVersion = 2] - Which version of the Git Protocol to use.
 * @param {string} [args.prefix] - Only list refs that start with this prefix
 * @param {boolean} [args.symrefs = false] - Include symbolic ref targets
 * @param {boolean} [args.peelTags = false] - Include annotated tag peeled targets
 *
 * @returns {Promise<ServerRef[]>} Resolves successfully with an array of ServerRef objects
 * @see ServerRef
 *
 * @example
 * // List all the branches on a repo
 * let refs = await git.listServerRefs({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git",
 *   prefix: "refs/heads/",
 * });
 * console.log(refs);
 *
 * @example
 * // Get the default branch on a repo
 * let refs = await git.listServerRefs({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git",
 *   prefix: "HEAD",
 *   symrefs: true,
 * });
 * console.log(refs);
 *
 * @example
 * // List all the tags on a repo
 * let refs = await git.listServerRefs({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git",
 *   prefix: "refs/tags/",
 *   peelTags: true,
 * });
 * console.log(refs);
 *
 * @example
 * // List all the pull requests on a repo
 * let refs = await git.listServerRefs({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git",
 *   prefix: "refs/pull/",
 * });
 * console.log(refs);
 *
 */
export function listServerRefs({ http, onAuth, onAuthSuccess, onAuthFailure, corsProxy, url, headers, forPush, protocolVersion, prefix, symrefs, peelTags, }: {
    http: HttpClient;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    url: string;
    corsProxy?: string;
    forPush?: boolean;
    headers?: {
        [x: string]: string;
    };
    protocolVersion?: 1 | 2;
    prefix?: string;
    symrefs?: boolean;
    peelTags?: boolean;
}): Promise<ServerRef[]>;
/**
 * List tags
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of tag names
 *
 * @example
 * let tags = await git.listTags({ fs, dir: '/tutorial' })
 * console.log(tags)
 *
 */
export function listTags({ fs, dir, gitdir }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
}): Promise<string[]>;
/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string=} args.filepath optional get the commit for the filepath only
 * @param {string} [args.ref = 'HEAD'] - The commit to begin walking backwards through the history from
 * @param {number=} [args.depth] - Limit the number of commits returned. No limit by default.
 * @param {Date} [args.since] - Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
 * @param {boolean=} [args.force=false] do not throw error if filepath is not exist (works only for a single file). defaults to false
 * @param {boolean=} [args.follow=false] Continue listing the history of a file beyond renames (works only for a single file). defaults to false
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<ReadCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.log({
 *   fs,
 *   dir: '/tutorial',
 *   depth: 5,
 *   ref: 'main'
 * })
 * console.log(commits)
 *
 */
export function log({ fs, dir, gitdir, filepath, ref, depth, since, force, follow, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    filepath?: string | undefined;
    ref?: string;
    depth?: number | undefined;
    since?: Date;
    force?: boolean | undefined;
    follow?: boolean | undefined;
    cache?: any;
}): Promise<ReadCommitResult[]>;
/**
 *
 * @typedef {Object} MergeResult - Returns an object with a schema like this:
 * @property {string} [oid] - The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
 * @property {boolean} [alreadyMerged] - True if the branch was already merged so no changes were made
 * @property {boolean} [fastForward] - True if it was a fast-forward merge
 * @property {boolean} [mergeCommit] - True if merge resulted in a merge commit
 * @property {string} [tree] - The SHA-1 object id of the tree resulting from a merge commit
 *
 */
/**
 * Merge two branches
 *
 * ## Limitations
 *
 * Currently it does not support incomplete merges. That is, if there are merge conflicts it cannot solve
 * with the built in diff3 algorithm it will not modify the working dir, and will throw a [`MergeNotSupportedError`](./errors.md#mergenotsupportedError) error.
 *
 * Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)
 *
 * Currently it does not support selecting alternative merge strategies.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ours] - The branch receiving the merge. If undefined, defaults to the current branch.
 * @param {string} args.theirs - The branch to be merged
 * @param {boolean} [args.fastForwardOnly = false] - If true, then non-fast-forward merges will throw an Error instead of performing a merge.
 * @param {boolean} [args.dryRun = false] - If true, simulates a merge so you can test whether it would succeed.
 * @param {boolean} [args.noUpdateBranch = false] - If true, does not update the branch pointer after creating the commit.
 * @param {string} [args.message] - Overrides the default auto-generated merge commit message
 * @param {Object} [args.author] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {number} [args.author.timestamp=Math.floor(Date.now()/1000)] - Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<MergeResult>} Resolves to a description of the merge operation
 * @see MergeResult
 *
 * @example
 * let m = await git.merge({
 *   fs,
 *   dir: '/tutorial',
 *   ours: 'main',
 *   theirs: 'remotes/origin/main'
 * })
 * console.log(m)
 *
 */
export function merge({ fs: _fs, onSign, dir, gitdir, ours, theirs, fastForwardOnly, dryRun, noUpdateBranch, message, author: _author, committer: _committer, signingKey, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onSign?: SignCallback;
    dir?: string;
    gitdir?: string;
    ours?: string;
    theirs: string;
    fastForwardOnly?: boolean;
    dryRun?: boolean;
    noUpdateBranch?: boolean;
    message?: string;
    author?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    committer?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    signingKey?: string;
    cache?: any;
}): Promise<MergeResult>;
/**
 *
 * @typedef {Object} PackObjectsResult The packObjects command returns an object with two properties:
 * @property {string} filename - The suggested filename for the packfile if you want to save it to disk somewhere. It includes the packfile SHA.
 * @property {Uint8Array} [packfile] - The packfile contents. Not present if `write` parameter was true, in which case the packfile was written straight to disk.
 */
/**
 * Create a packfile from an array of SHA-1 object ids
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids - An array of SHA-1 object ids to be included in the packfile
 * @param {boolean} [args.write = false] - Whether to save the packfile to disk or not
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<PackObjectsResult>} Resolves successfully when the packfile is ready with the filename and buffer
 * @see PackObjectsResult
 *
 * @example
 * // Create a packfile containing only an empty tree
 * let { packfile } = await git.packObjects({
 *   fs,
 *   dir: '/tutorial',
 *   oids: ['4b825dc642cb6eb9a060e54bf8d69288fbee4904']
 * })
 * console.log(packfile)
 *
 */
export function packObjects({ fs, dir, gitdir, oids, write, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oids: string[];
    write?: boolean;
    cache?: any;
}): Promise<PackObjectsResult>;
/**
 * Fetch and merge commits from a remote repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch to merge into. By default this is the currently checked out branch.
 * @param {string} [args.url] - (Added in 1.1.0) The URL of the remote repository. The default is the value set in the git config for that remote.
 * @param {string} [args.remote] - (Added in 1.1.0) If URL is not specified, determines which remote to use.
 * @param {string} [args.remoteRef] - (Added in 1.1.0) The name of the branch on the remote to fetch. By default this is the configured remote tracking branch.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.fastForwardOnly = false] - Only perform simple fast-forward merges. (Don't create merge commits.)
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {number} [args.author.timestamp=Math.floor(Date.now()/1000)] - Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully when pull operation completes
 *
 * @example
 * await git.pull({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   ref: 'main',
 *   singleBranch: true
 * })
 * console.log('done')
 *
 */
export function pull({ fs: _fs, http, onProgress, onMessage, onAuth, onAuthSuccess, onAuthFailure, dir, gitdir, ref, url, remote, remoteRef, fastForwardOnly, corsProxy, singleBranch, headers, author: _author, committer: _committer, signingKey, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    http: HttpClient;
    onProgress?: ProgressCallback;
    onMessage?: MessageCallback;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    dir: string;
    gitdir?: string;
    ref?: string;
    url?: string;
    remote?: string;
    remoteRef?: string;
    corsProxy?: string;
    singleBranch?: boolean;
    fastForwardOnly?: boolean;
    headers?: {
        [x: string]: string;
    };
    author?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    committer?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    signingKey?: string;
    cache?: any;
}): Promise<void>;
/**
 * Push a branch or tag
 *
 * The push command returns an object that describes the result of the attempted push operation.
 * *Notes:* If there were no errors, then there will be no `errors` property. There can be a mix of `ok` messages and `errors` messages.
 *
 * | param  | type [= default] | description                                                                                                                                                                                                      |
 * | ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | ok     | Array\<string\>  | The first item is "unpack" if the overall operation was successful. The remaining items are the names of refs that were updated successfully.                                                                    |
 * | errors | Array\<string\>  | If the overall operation threw and error, the first item will be "unpack {Overall error message}". The remaining items are individual refs that failed to be updated in the format "{ref name} {error message}". |
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch to push. By default this is the currently checked out branch.
 * @param {string} [args.url] - The URL of the remote repository. The default is the value set in the git config for that remote.
 * @param {string} [args.remote] - If URL is not specified, determines which remote to use.
 * @param {string} [args.remoteRef] - The name of the receiving branch on the remote. By default this is the configured remote tracking branch.
 * @param {boolean} [args.force = false] - If true, behaves the same as `git push --force`
 * @param {boolean} [args.delete = false] - If true, delete the remote ref
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<PushResult>} Resolves successfully when push completes with a detailed description of the operation from the server.
 * @see PushResult
 * @see RefUpdateStatus
 *
 * @example
 * let pushResult = await git.push({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   remote: 'origin',
 *   ref: 'main',
 *   onAuth: () => ({ username: process.env.GITHUB_TOKEN }),
 * })
 * console.log(pushResult)
 *
 */
export function push({ fs, http, onProgress, onMessage, onAuth, onAuthSuccess, onAuthFailure, dir, gitdir, ref, remoteRef, remote, url, force, delete: _delete, corsProxy, headers, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    http: HttpClient;
    onProgress?: ProgressCallback;
    onMessage?: MessageCallback;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    dir?: string;
    gitdir?: string;
    ref?: string;
    url?: string;
    remote?: string;
    remoteRef?: string;
    force?: boolean;
    delete?: boolean;
    corsProxy?: string;
    headers?: {
        [x: string]: string;
    };
    cache?: any;
}): Promise<PushResult>;
/**
 *
 * @typedef {Object} ReadBlobResult - The object returned has the following schema:
 * @property {string} oid
 * @property {Uint8Array} blob
 *
 */
/**
 * Read a blob object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get. Annotated tags, commits, and trees are peeled.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the blob object at that filepath.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<ReadBlobResult>} Resolves successfully with a blob object description
 * @see ReadBlobResult
 *
 * @example
 * // Get the contents of 'README.md' in the main branch.
 * let commitOid = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
 * console.log(commitOid)
 * let { blob } = await git.readBlob({
 *   fs,
 *   dir: '/tutorial',
 *   oid: commitOid,
 *   filepath: 'README.md'
 * })
 * console.log(Buffer.from(blob).toString('utf8'))
 *
 */
export function readBlob({ fs, dir, gitdir, oid, filepath, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    filepath?: string;
    cache?: any;
}): Promise<ReadBlobResult>;
/**
 * Read a commit object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get. Annotated tags are peeled.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<ReadCommitResult>} Resolves successfully with a git commit object
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * // Read a commit object
 * let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
 * console.log(sha)
 * let commit = await git.readCommit({ fs, dir: '/tutorial', oid: sha })
 * console.log(commit)
 *
 */
export function readCommit({ fs, dir, gitdir, oid, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    cache?: any;
}): Promise<ReadCommitResult>;
/**
 * Read the contents of a note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid - The SHA-1 object id of the object to get the note for.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Uint8Array>} Resolves successfully with note contents as a Buffer.
 */
export function readNote({ fs, dir, gitdir, ref, oid, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref?: string;
    oid: string;
    cache?: any;
}): Promise<Uint8Array>;
/**
 *
 * @typedef {Object} DeflatedObject
 * @property {string} oid
 * @property {'deflated'} type
 * @property {'deflated'} format
 * @property {Uint8Array} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {Object} WrappedObject
 * @property {string} oid
 * @property {'wrapped'} type
 * @property {'wrapped'} format
 * @property {Uint8Array} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {Object} RawObject
 * @property {string} oid
 * @property {'blob'|'commit'|'tree'|'tag'} type
 * @property {'content'} format
 * @property {Uint8Array} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {Object} ParsedBlobObject
 * @property {string} oid
 * @property {'blob'} type
 * @property {'parsed'} format
 * @property {string} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {Object} ParsedCommitObject
 * @property {string} oid
 * @property {'commit'} type
 * @property {'parsed'} format
 * @property {CommitObject} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {Object} ParsedTreeObject
 * @property {string} oid
 * @property {'tree'} type
 * @property {'parsed'} format
 * @property {TreeObject} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {Object} ParsedTagObject
 * @property {string} oid
 * @property {'tag'} type
 * @property {'parsed'} format
 * @property {TagObject} object
 * @property {string} [source]
 *
 */
/**
 *
 * @typedef {ParsedBlobObject | ParsedCommitObject | ParsedTreeObject | ParsedTagObject} ParsedObject
 */
/**
 *
 * @typedef {DeflatedObject | WrappedObject | RawObject | ParsedObject } ReadObjectResult
 */
/**
 * Read a git object directly by its SHA-1 object id
 *
 * Regarding `ReadObjectResult`:
 *
 * - `oid` will be the same as the `oid` argument unless the `filepath` argument is provided, in which case it will be the oid of the tree or blob being returned.
 * - `type` of deflated objects is `'deflated'`, and `type` of wrapped objects is `'wrapped'`
 * - `format` is usually, but not always, the format you requested. Packfiles do not store each object individually compressed so if you end up reading the object from a packfile it will be returned in format 'content' even if you requested 'deflated' or 'wrapped'.
 * - `object` will be an actual Object if format is 'parsed' and the object is a commit, tree, or annotated tag. Blobs are still formatted as Buffers unless an encoding is provided in which case they'll be strings. If format is anything other than 'parsed', object will be a Buffer.
 * - `source` is the name of the packfile or loose object file where the object was found.
 *
 * The `format` parameter can have the following values:
 *
 * | param      | description                                                                                                                                                                                               |
 * | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | 'deflated' | Return the raw deflate-compressed buffer for an object if possible. Useful for efficiently shuffling around loose objects when you don't care about the contents and can save time by not inflating them. |
 * | 'wrapped'  | Return the inflated object buffer wrapped in the git object header if possible. This is the raw data used when calculating the SHA-1 object id of a git object.                                           |
 * | 'content'  | Return the object buffer without the git header.                                                                                                                                                          |
 * | 'parsed'   | Returns a parsed representation of the object.                                                                                                                                                            |
 *
 * The result will be in one of the following schemas:
 *
 * ## `'deflated'` format
 *
 * {@link DeflatedObject typedef}
 *
 * ## `'wrapped'` format
 *
 * {@link WrappedObject typedef}
 *
 * ## `'content'` format
 *
 * {@link RawObject typedef}
 *
 * ## `'parsed'` format
 *
 * ### parsed `'blob'` type
 *
 * {@link ParsedBlobObject typedef}
 *
 * ### parsed `'commit'` type
 *
 * {@link ParsedCommitObject typedef}
 * {@link CommitObject typedef}
 *
 * ### parsed `'tree'` type
 *
 * {@link ParsedTreeObject typedef}
 * {@link TreeObject typedef}
 * {@link TreeEntry typedef}
 *
 * ### parsed `'tag'` type
 *
 * {@link ParsedTagObject typedef}
 * {@link TagObject typedef}
 *
 * @deprecated
 * > This command is overly complicated.
 * >
 * > If you know the type of object you are reading, use [`readBlob`](./readBlob.md), [`readCommit`](./readCommit.md), [`readTag`](./readTag.md), or [`readTree`](./readTree.md).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get
 * @param {'deflated' | 'wrapped' | 'content' | 'parsed'} [args.format = 'parsed'] - What format to return the object in. The choices are described in more detail below.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath. To return the root directory of a tree set filepath to `''`
 * @param {string} [args.encoding] - A convenience argument that only affects blobs. Instead of returning `object` as a buffer, it returns a string parsed using the given encoding.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<ReadObjectResult>} Resolves successfully with a git object description
 * @see ReadObjectResult
 *
 * @example
 * // Given a ransom SHA-1 object id, figure out what it is
 * let { type, object } = await git.readObject({
 *   fs,
 *   dir: '/tutorial',
 *   oid: '0698a781a02264a6f37ba3ff41d78067eaf0f075'
 * })
 * switch (type) {
 *   case 'commit': {
 *     console.log(object)
 *     break
 *   }
 *   case 'tree': {
 *     console.log(object)
 *     break
 *   }
 *   case 'blob': {
 *     console.log(object)
 *     break
 *   }
 *   case 'tag': {
 *     console.log(object)
 *     break
 *   }
 * }
 *
 */
export function readObject({ fs: _fs, dir, gitdir, oid, format, filepath, encoding, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    format?: "parsed" | "deflated" | "content" | "wrapped";
    filepath?: string;
    encoding?: string;
    cache?: any;
}): Promise<ParsedBlobObject | ParsedCommitObject | ParsedTreeObject | ParsedTagObject | DeflatedObject | WrappedObject | RawObject>;
/**
 *
 * @typedef {Object} ReadTagResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tag
 * @property {TagObject} tag - the parsed tag object
 * @property {string} payload - PGP signing payload
 */
/**
 * Read an annotated tag object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<ReadTagResult>} Resolves successfully with a git object description
 * @see ReadTagResult
 * @see TagObject
 *
 */
export function readTag({ fs, dir, gitdir, oid, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    cache?: any;
}): Promise<ReadTagResult>;
/**
 *
 * @typedef {Object} ReadTreeResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tree
 * @property {TreeObject} tree - the parsed tree object
 */
/**
 * Read a tree object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get. Annotated tags and commits are peeled.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the tree object at that filepath.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<ReadTreeResult>} Resolves successfully with a git tree object
 * @see ReadTreeResult
 * @see TreeObject
 * @see TreeEntry
 *
 */
export function readTree({ fs, dir, gitdir, oid, filepath, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    oid: string;
    filepath?: string;
    cache?: any;
}): Promise<ReadTreeResult>;
/**
 * Remove a file from the git index (aka staging area)
 *
 * Note that this does NOT delete the file in the working directory.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to remove from the index
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await git.remove({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log('done')
 *
 */
export function remove({ fs: _fs, dir, gitdir, filepath, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    filepath: string;
    cache?: any;
}): Promise<void>;
/**
 * Remove an object note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid - The SHA-1 object id of the object to remove the note from.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {number} [args.author.timestamp=Math.floor(Date.now()/1000)] - Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the note committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the commit object for the note removal.
 */
export function removeNote({ fs: _fs, onSign, dir, gitdir, ref, oid, author: _author, committer: _committer, signingKey, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    onSign?: SignCallback;
    dir?: string;
    gitdir?: string;
    ref?: string;
    oid: string;
    author?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    committer?: {
        name?: string;
        email?: string;
        timestamp?: number;
        timezoneOffset?: number;
    };
    signingKey?: string;
    cache?: any;
}): Promise<string>;
/**
 * Rename a branch
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the branch
 * @param {string} args.oldref - What the name of the branch was
 * @param {boolean} [args.checkout = false] - Update `HEAD` to point at the newly created branch
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.renameBranch({ fs, dir: '/tutorial', ref: 'main', oldref: 'master' })
 * console.log('done')
 *
 */
export function renameBranch({ fs, dir, gitdir, ref, oldref, checkout, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
    oldref: string;
    checkout?: boolean;
}): Promise<void>;
/**
 * Reset a file in the git index (aka staging area)
 *
 * Note that this does NOT modify the file in the working directory.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to reset in the index
 * @param {string} [args.ref = 'HEAD'] - A ref to the commit to use
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await git.resetIndex({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log('done')
 *
 */
export function resetIndex({ fs: _fs, dir, gitdir, filepath, ref, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    filepath: string;
    ref?: string;
    cache?: any;
}): Promise<void>;
/**
 * Get the value of a symbolic ref or resolve a ref to its SHA-1 object id
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to resolve
 * @param {number} [args.depth = undefined] - How many symbolic references to follow before returning
 *
 * @returns {Promise<string>} Resolves successfully with a SHA-1 object id or the value of a symbolic ref
 *
 * @example
 * let currentCommit = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
 * console.log(currentCommit)
 * let currentBranch = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD', depth: 2 })
 * console.log(currentBranch)
 *
 */
export function resolveRef({ fs, dir, gitdir, ref, depth, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
    depth?: number;
}): Promise<string>;
/**
 * Write an entry to the git config files.
 *
 * *Caveats:*
 * - Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
 * - The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The key of the git config entry
 * @param {string | boolean | number | void} args.value - A value to store at that path. (Use `undefined` as the value to delete a config entry.)
 * @param {boolean} [args.append = false] - If true, will append rather than replace when setting (use with multi-valued config options).
 *
 * @returns {Promise<void>} Resolves successfully when operation completed
 *
 * @example
 * // Write config value
 * await git.setConfig({
 *   fs,
 *   dir: '/tutorial',
 *   path: 'user.name',
 *   value: 'Mr. Test'
 * })
 *
 * // Print out config file
 * let file = await fs.promises.readFile('/tutorial/.git/config', 'utf8')
 * console.log(file)
 *
 * // Delete a config entry
 * await git.setConfig({
 *   fs,
 *   dir: '/tutorial',
 *   path: 'user.name',
 *   value: undefined
 * })
 *
 * // Print out config file
 * file = await fs.promises.readFile('/tutorial/.git/config', 'utf8')
 * console.log(file)
 */
export function setConfig({ fs: _fs, dir, gitdir, path, value, append, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    path: string;
    value: string | number | boolean | void;
    append?: boolean;
}): Promise<void>;
/**
 * Tell whether a file has been changed
 *
 * The possible resolve values are:
 *
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"ignored"`           | file ignored by a .gitignore rule                                                     |
 * | `"unmodified"`        | file unchanged from HEAD commit                                                       |
 * | `"*modified"`         | file has modifications, not yet staged                                                |
 * | `"*deleted"`          | file has been removed, but the removal is not yet staged                              |
 * | `"*added"`            | file is untracked, not yet staged                                                     |
 * | `"absent"`            | file not present in HEAD commit, staging area, or working dir                         |
 * | `"modified"`          | file has modifications, staged                                                        |
 * | `"deleted"`           | file has been removed, staged                                                         |
 * | `"added"`             | previously untracked file, staged                                                     |
 * | `"*unmodified"`       | working dir and HEAD commit match, but index differs                                  |
 * | `"*absent"`           | file not present in working dir or HEAD commit, but present in the index              |
 * | `"*undeleted"`        | file was deleted from the index, but is still in the working dir                      |
 * | `"*undeletemodified"` | file was deleted from the index, but is present with modifications in the working dir |
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to query
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<'ignored'|'unmodified'|'*modified'|'*deleted'|'*added'|'absent'|'modified'|'deleted'|'added'|'*unmodified'|'*absent'|'*undeleted'|'*undeletemodified'>} Resolves successfully with the file's git status
 *
 * @example
 * let status = await git.status({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log(status)
 *
 */
export function status({ fs: _fs, dir, gitdir, filepath, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir: string;
    gitdir?: string;
    filepath: string;
    cache?: any;
}): Promise<"modified" | "ignored" | "unmodified" | "*modified" | "*deleted" | "*added" | "absent" | "deleted" | "added" | "*unmodified" | "*absent" | "*undeleted" | "*undeletemodified">;
/**
 * Efficiently get the status of multiple files at once.
 *
 * The returned `StatusMatrix` is admittedly not the easiest format to read.
 * However it conveys a large amount of information in dense format that should make it easy to create reports about the current state of the repository;
 * without having to do multiple, time-consuming isomorphic-git calls.
 * My hope is that the speed and flexibility of the function will make up for the learning curve of interpreting the return value.
 *
 * ```js live
 * // get the status of all the files in 'src'
 * let status = await git.statusMatrix({
 *   fs,
 *   dir: '/tutorial',
 *   filter: f => f.startsWith('src/')
 * })
 * console.log(status)
 * ```
 *
 * ```js live
 * // get the status of all the JSON and Markdown files
 * let status = await git.statusMatrix({
 *   fs,
 *   dir: '/tutorial',
 *   filter: f => f.endsWith('.json') || f.endsWith('.md')
 * })
 * console.log(status)
 * ```
 *
 * The result is returned as a 2D array.
 * The outer array represents the files and/or blobs in the repo, in alphabetical order.
 * The inner arrays describe the status of the file:
 * the first value is the filepath, and the next three are integers
 * representing the HEAD status, WORKDIR status, and STAGE status of the entry.
 *
 * ```js
 * // example StatusMatrix
 * [
 *   ["a.txt", 0, 2, 0], // new, untracked
 *   ["b.txt", 0, 2, 2], // added, staged
 *   ["c.txt", 0, 2, 3], // added, staged, with unstaged changes
 *   ["d.txt", 1, 1, 1], // unmodified
 *   ["e.txt", 1, 2, 1], // modified, unstaged
 *   ["f.txt", 1, 2, 2], // modified, staged
 *   ["g.txt", 1, 2, 3], // modified, staged, with unstaged changes
 *   ["h.txt", 1, 0, 1], // deleted, unstaged
 *   ["i.txt", 1, 0, 0], // deleted, staged
 * ]
 * ```
 *
 * - The HEAD status is either absent (0) or present (1).
 * - The WORKDIR status is either absent (0), identical to HEAD (1), or different from HEAD (2).
 * - The STAGE status is either absent (0), identical to HEAD (1), identical to WORKDIR (2), or different from WORKDIR (3).
 *
 * ```ts
 * type Filename      = string
 * type HeadStatus    = 0 | 1
 * type WorkdirStatus = 0 | 1 | 2
 * type StageStatus   = 0 | 1 | 2 | 3
 *
 * type StatusRow     = [Filename, HeadStatus, WorkdirStatus, StageStatus]
 *
 * type StatusMatrix  = StatusRow[]
 * ```
 *
 * > Think of the natural progression of file modifications as being from HEAD (previous) -> WORKDIR (current) -> STAGE (next).
 * > Then HEAD is "version 1", WORKDIR is "version 2", and STAGE is "version 3".
 * > Then, imagine a "version 0" which is before the file was created.
 * > Then the status value in each column corresponds to the oldest version of the file it is identical to.
 * > (For a file to be identical to "version 0" means the file is deleted.)
 *
 * Here are some examples of queries you can answer using the result:
 *
 * #### Q: What files have been deleted?
 * ```js
 * const FILE = 0, WORKDIR = 2
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[WORKDIR] === 0)
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files have unstaged changes?
 * ```js
 * const FILE = 0, WORKDIR = 2, STAGE = 3
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[WORKDIR] !== row[STAGE])
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files have been modified since the last commit?
 * ```js
 * const FILE = 0, HEAD = 1, WORKDIR = 2
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[HEAD] !== row[WORKDIR])
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files will NOT be changed if I commit right now?
 * ```js
 * const FILE = 0, HEAD = 1, STAGE = 3
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[HEAD] === row[STAGE])
 *   .map(row => row[FILE])
 * ```
 *
 * For reference, here are all possible combinations:
 *
 * | HEAD | WORKDIR | STAGE | `git status --short` equivalent |
 * | ---- | ------- | ----- | ------------------------------- |
 * | 0    | 0       | 0     | ``                              |
 * | 0    | 0       | 3     | `AD`                            |
 * | 0    | 2       | 0     | `??`                            |
 * | 0    | 2       | 2     | `A `                            |
 * | 0    | 2       | 3     | `AM`                            |
 * | 1    | 0       | 0     | `D `                            |
 * | 1    | 0       | 1     | ` D`                            |
 * | 1    | 0       | 3     | `MD`                            |
 * | 1    | 1       | 0     | `D ` + `??`                     |
 * | 1    | 1       | 1     | ``                              |
 * | 1    | 1       | 3     | `MM`                            |
 * | 1    | 2       | 0     | `D ` + `??`                     |
 * | 1    | 2       | 1     | ` M`                            |
 * | 1    | 2       | 2     | `M `                            |
 * | 1    | 2       | 3     | `MM`                            |
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - Optionally specify a different commit to compare against the workdir and stage instead of the HEAD
 * @param {string[]} [args.filepaths = ['.']] - Limit the query to the given files and directories
 * @param {function(string): boolean} [args.filter] - Filter the results to only those whose filepath matches a function.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<StatusRow>>} Resolves with a status matrix, described below.
 * @see StatusRow
 */
export function statusMatrix({ fs: _fs, dir, gitdir, ref, filepaths, filter, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir: string;
    gitdir?: string;
    ref?: string;
    filepaths?: string[];
    filter?: (arg0: string) => boolean;
    cache?: any;
}): Promise<[string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3][]>;
/**
 * Create a lightweight tag
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the tag
 * @param {string} [args.object = 'HEAD'] - What oid the tag refers to. (Will resolve to oid if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used.
 * @param {boolean} [args.force = false] - Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.tag({ fs, dir: '/tutorial', ref: 'test-tag' })
 * console.log('done')
 *
 */
export function tag({ fs: _fs, dir, gitdir, ref, object, force, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
    object?: string;
    force?: boolean;
}): Promise<void>;
/**
 * Return the version number of isomorphic-git
 *
 * I don't know why you might need this. I added it just so I could check that I was getting
 * the correct version of the library and not a cached version.
 *
 * @returns {string} the version string taken from package.json at publication time
 *
 * @example
 * console.log(git.version())
 *
 */
export function version(): string;
/**
 * @callback WalkerMap
 * @param {string} filename
 * @param {Array<WalkerEntry | null>} entries
 * @returns {Promise<any>}
 */
/**
 * @callback WalkerReduce
 * @param {any} parent
 * @param {any[]} children
 * @returns {Promise<any>}
 */
/**
 * @callback WalkerIterateCallback
 * @param {WalkerEntry[]} entries
 * @returns {Promise<any[]>}
 */
/**
 * @callback WalkerIterate
 * @param {WalkerIterateCallback} walk
 * @param {IterableIterator<WalkerEntry[]>} children
 * @returns {Promise<any[]>}
 */
/**
 * A powerful recursive tree-walking utility.
 *
 * The `walk` API simplifies gathering detailed information about a tree or comparing all the filepaths in two or more trees.
 * Trees can be git commits, the working directory, or the or git index (staging area).
 * As long as a file or directory is present in at least one of the trees, it will be traversed.
 * Entries are traversed in alphabetical order.
 *
 * The arguments to `walk` are the `trees` you want to traverse, and 3 optional transform functions:
 *  `map`, `reduce`, and `iterate`.
 *
 * ## `TREE`, `WORKDIR`, and `STAGE`
 *
 * Tree walkers are represented by three separate functions that can be imported:
 *
 * ```js
 * import { TREE, WORKDIR, STAGE } from 'isomorphic-git'
 * ```
 *
 * These functions return opaque handles called `Walker`s.
 * The only thing that `Walker` objects are good for is passing into `walk`.
 * Here are the three `Walker`s passed into `walk` by the `statusMatrix` command for example:
 *
 * ```js
 * let ref = 'HEAD'
 *
 * let trees = [TREE({ ref }), WORKDIR(), STAGE()]
 * ```
 *
 * For the arguments, see the doc pages for [TREE](./TREE.md), [WORKDIR](./WORKDIR.md), and [STAGE](./STAGE.md).
 *
 * `map`, `reduce`, and `iterate` allow you control the recursive walk by pruning and transforming `WalkerEntry`s into the desired result.
 *
 * ## WalkerEntry
 *
 * {@link WalkerEntry typedef}
 *
 * `map` receives an array of `WalkerEntry[]` as its main argument, one `WalkerEntry` for each `Walker` in the `trees` argument.
 * The methods are memoized per `WalkerEntry` so calling them multiple times in a `map` function does not adversely impact performance.
 * By only computing these values if needed, you build can build lean, mean, efficient walking machines.
 *
 * ### WalkerEntry#type()
 *
 * Returns the kind as a string. This is normally either `tree` or `blob`.
 *
 * `TREE`, `STAGE`, and `WORKDIR` walkers all return a string.
 *
 * Possible values:
 *
 * - `'tree'` directory
 * - `'blob'` file
 * - `'special'` used by `WORKDIR` to represent irregular files like sockets and FIFOs
 * - `'commit'` used by `TREE` to represent submodules
 *
 * ```js
 * await entry.type()
 * ```
 *
 * ### WalkerEntry#mode()
 *
 * Returns the file mode as a number. Use this to distinguish between regular files, symlinks, and executable files.
 *
 * `TREE`, `STAGE`, and `WORKDIR` walkers all return a number for all `type`s of entries.
 *
 * It has been normalized to one of the 4 values that are allowed in git commits:
 *
 * - `0o40000` directory
 * - `0o100644` file
 * - `0o100755` file (executable)
 * - `0o120000` symlink
 *
 * Tip: to make modes more readable, you can print them to octal using `.toString(8)`.
 *
 * ```js
 * await entry.mode()
 * ```
 *
 * ### WalkerEntry#oid()
 *
 * Returns the SHA-1 object id for blobs and trees.
 *
 * `TREE` walkers return a string for `blob` and `tree` entries.
 *
 * `STAGE` and `WORKDIR` walkers return a string for `blob` entries and `undefined` for `tree` entries.
 *
 * ```js
 * await entry.oid()
 * ```
 *
 * ### WalkerEntry#content()
 *
 * Returns the file contents as a Buffer.
 *
 * `TREE` and `WORKDIR` walkers return a Buffer for `blob` entries and `undefined` for `tree` entries.
 *
 * `STAGE` walkers always return `undefined` since the file contents are never stored in the stage.
 *
 * ```js
 * await entry.content()
 * ```
 *
 * ### WalkerEntry#stat()
 *
 * Returns a normalized subset of filesystem Stat data.
 *
 * `WORKDIR` walkers return a `Stat` for `blob` and `tree` entries.
 *
 * `STAGE` walkers return a `Stat` for `blob` entries and `undefined` for `tree` entries.
 *
 * `TREE` walkers return `undefined` for all entry types.
 *
 * ```js
 * await entry.stat()
 * ```
 *
 * {@link Stat typedef}
 *
 * ## map(string, Array<WalkerEntry|null>) => Promise<any>
 *
 * {@link WalkerMap typedef}
 *
 * This is the function that is called once per entry BEFORE visiting the children of that node.
 *
 * If you return `null` for a `tree` entry, then none of the children of that `tree` entry will be walked.
 *
 * This is a good place for query logic, such as examining the contents of a file.
 * Ultimately, compare all the entries and return any values you are interested in.
 * If you do not return a value (or return undefined) that entry will be filtered from the results.
 *
 * Example 1: Find all the files containing the word 'foo'.
 * ```js
 * async function map(filepath, [head, workdir]) {
 *   let content = (await workdir.content()).toString('utf8')
 *   if (content.contains('foo')) {
 *     return {
 *       filepath,
 *       content
 *     }
 *   }
 * }
 * ```
 *
 * Example 2: Return the difference between the working directory and the HEAD commit
 * ```js
 * const diff = require('diff-lines')
 * async function map(filepath, [head, workdir]) {
 *   return {
 *     filepath,
 *     oid: await head.oid(),
 *     diff: diff((await head.content()).toString('utf8'), (await workdir.content()).toString('utf8'))
 *   }
 * }
 * ```
 *
 * Example 3:
 * ```js
 * let path = require('path')
 * // Only examine files in the directory `cwd`
 * let cwd = 'src/app'
 * async function map (filepath, [head, workdir, stage]) {
 *   if (
 *     // don't skip the root directory
 *     head.fullpath !== '.' &&
 *     // return true for 'src' and 'src/app'
 *     !cwd.startsWith(filepath) &&
 *     // return true for 'src/app/*'
 *     path.dirname(filepath) !== cwd
 *   ) {
 *     return null
 *   } else {
 *     return filepath
 *   }
 * }
 * ```
 *
 * ## reduce(parent, children)
 *
 * {@link WalkerReduce typedef}
 *
 * This is the function that is called once per entry AFTER visiting the children of that node.
 *
 * Default: `async (parent, children) => parent === undefined ? children.flat() : [parent, children].flat()`
 *
 * The default implementation of this function returns all directories and children in a giant flat array.
 * You can define a different accumulation method though.
 *
 * Example: Return a hierarchical structure
 * ```js
 * async function reduce (parent, children) {
 *   return Object.assign(parent, { children })
 * }
 * ```
 *
 * ## iterate(walk, children)
 *
 * {@link WalkerIterate typedef}
 *
 * {@link WalkerIterateCallback typedef}
 *
 * Default: `(walk, children) => Promise.all([...children].map(walk))`
 *
 * The default implementation recurses all children concurrently using Promise.all.
 * However you could use a custom function to traverse children serially or use a global queue to throttle recursion.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {Walker[]} args.trees - The trees you want to traverse
 * @param {WalkerMap} [args.map] - Transform `WalkerEntry`s into a result form
 * @param {WalkerReduce} [args.reduce] - Control how mapped entries are combined with their parent result
 * @param {WalkerIterate} [args.iterate] - Fine-tune how entries within a tree are iterated over
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<any>} The finished tree-walking result
 */
export function walk({ fs, dir, gitdir, trees, map, reduce, iterate, cache, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    trees: Walker[];
    map?: WalkerMap;
    reduce?: WalkerReduce;
    iterate?: WalkerIterate;
    cache?: any;
}): Promise<any>;
/**
 * Write a blob object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {Uint8Array} args.blob - The blob object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 *
 * @example
 * // Manually create a blob.
 * let oid = await git.writeBlob({
 *   fs,
 *   dir: '/tutorial',
 *   blob: new Uint8Array([])
 * })
 *
 * console.log('oid', oid) // should be 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'
 *
 */
export function writeBlob({ fs, dir, gitdir, blob }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    blob: Uint8Array;
}): Promise<string>;
/**
 * Write a commit object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {CommitObject} args.commit - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 * @see CommitObject
 *
 */
export function writeCommit({ fs, dir, gitdir, commit, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    commit: CommitObject;
}): Promise<string>;
/**
 * Write a git object directly
 *
 * `format` can have the following values:
 *
 * | param      | description                                                                                                                                                      |
 * | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | 'deflated' | Treat `object` as the raw deflate-compressed buffer for an object, meaning can be written to `.git/objects/**` as-is.                                           |
 * | 'wrapped'  | Treat `object` as the inflated object buffer wrapped in the git object header. This is the raw buffer used when calculating the SHA-1 object id of a git object. |
 * | 'content'  | Treat `object` as the object buffer without the git header.                                                                                                      |
 * | 'parsed'   | Treat `object` as a parsed representation of the object.                                                                                                         |
 *
 * If `format` is `'parsed'`, then `object` must match one of the schemas for `CommitObject`, `TreeObject`, `TagObject`, or a `string` (for blobs).
 *
 * {@link CommitObject typedef}
 *
 * {@link TreeObject typedef}
 *
 * {@link TagObject typedef}
 *
 * If `format` is `'content'`, `'wrapped'`, or `'deflated'`, `object` should be a `Uint8Array`.
 *
 * @deprecated
 * > This command is overly complicated.
 * >
 * > If you know the type of object you are writing, use [`writeBlob`](./writeBlob.md), [`writeCommit`](./writeCommit.md), [`writeTag`](./writeTag.md), or [`writeTree`](./writeTree.md).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string | Uint8Array | CommitObject | TreeObject | TagObject} args.object - The object to write.
 * @param {'blob'|'tree'|'commit'|'tag'} [args.type] - The kind of object to write.
 * @param {'deflated' | 'wrapped' | 'content' | 'parsed'} [args.format = 'parsed'] - What format the object is in. The possible choices are listed below.
 * @param {string} [args.oid] - If `format` is `'deflated'` then this param is required. Otherwise it is calculated.
 * @param {string} [args.encoding] - If `type` is `'blob'` then `object` will be converted to a Uint8Array using `encoding`.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object.
 *
 * @example
 * // Manually create an annotated tag.
 * let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
 * console.log('commit', sha)
 *
 * let oid = await git.writeObject({
 *   fs,
 *   dir: '/tutorial',
 *   type: 'tag',
 *   object: {
 *     object: sha,
 *     type: 'commit',
 *     tag: 'my-tag',
 *     tagger: {
 *       name: 'your name',
 *       email: 'email@example.com',
 *       timestamp: Math.floor(Date.now()/1000),
 *       timezoneOffset: new Date().getTimezoneOffset()
 *     },
 *     message: 'Optional message'
 *   }
 * })
 *
 * console.log('tag', oid)
 *
 */
export function writeObject({ fs: _fs, dir, gitdir, type, object, format, oid, encoding, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    object: string | Uint8Array | TreeEntry[] | CommitObject | TagObject;
    type?: "blob" | "tree" | "commit" | "tag";
    format?: "parsed" | "deflated" | "content" | "wrapped";
    oid?: string;
    encoding?: string;
}): Promise<string>;
/**
 * Write a ref which refers to the specified SHA-1 object id, or a symbolic ref which refers to the specified ref.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The name of the ref to write
 * @param {string} args.value - When `symbolic` is false, a ref or an SHA-1 object id. When true, a ref starting with `refs/`.
 * @param {boolean} [args.force = false] - Instead of throwing an error if a ref named `ref` already exists, overwrite the existing ref.
 * @param {boolean} [args.symbolic = false] - Whether the ref is symbolic or not.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.writeRef({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'refs/heads/another-branch',
 *   value: 'HEAD'
 * })
 * await git.writeRef({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'HEAD',
 *   value: 'refs/heads/another-branch',
 *   force: true,
 *   symbolic: true
 * })
 * console.log('done')
 *
 */
export function writeRef({ fs: _fs, dir, gitdir, ref, value, force, symbolic, }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    ref: string;
    value: string;
    force?: boolean;
    symbolic?: boolean;
}): Promise<void>;
/**
 * Write an annotated tag object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {TagObject} args.tag - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 * @see TagObject
 *
 * @example
 * // Manually create an annotated tag.
 * let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
 * console.log('commit', sha)
 *
 * let oid = await git.writeTag({
 *   fs,
 *   dir: '/tutorial',
 *   tag: {
 *     object: sha,
 *     type: 'commit',
 *     tag: 'my-tag',
 *     tagger: {
 *       name: 'your name',
 *       email: 'email@example.com',
 *       timestamp: Math.floor(Date.now()/1000),
 *       timezoneOffset: new Date().getTimezoneOffset()
 *     },
 *     message: 'Optional message'
 *   }
 * })
 *
 * console.log('tag', oid)
 *
 */
export function writeTag({ fs, dir, gitdir, tag }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    tag: TagObject;
}): Promise<string>;
/**
 * Write a tree object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {TreeObject} args.tree - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object.
 * @see TreeObject
 * @see TreeEntry
 *
 */
export function writeTree({ fs, dir, gitdir, tree }: {
    fs: CallbackFsClient | PromiseFsClient;
    dir?: string;
    gitdir?: string;
    tree: TreeEntry[];
}): Promise<string>;
declare class AlreadyExistsError extends BaseError {
    /**
     * @param {'note'|'remote'|'tag'|'branch'} noun
     * @param {string} where
     * @param {boolean} canForce
     */
    constructor(noun: "tag" | "remote" | "note" | "branch", where: string, canForce?: boolean);
    code: "AlreadyExistsError";
    name: "AlreadyExistsError";
    data: {
        noun: "tag" | "remote" | "note" | "branch";
        where: string;
        canForce: boolean;
    };
}
declare namespace AlreadyExistsError {
    export const code: 'AlreadyExistsError';
}
declare class AmbiguousError extends BaseError {
    /**
     * @param {'oids'|'refs'} nouns
     * @param {string} short
     * @param {string[]} matches
     */
    constructor(nouns: "refs" | "oids", short: string, matches: string[]);
    code: "AmbiguousError";
    name: "AmbiguousError";
    data: {
        nouns: "refs" | "oids";
        short: string;
        matches: string[];
    };
}
declare namespace AmbiguousError {
    const code_1: 'AmbiguousError';
    export { code_1 as code };
}
declare class CheckoutConflictError extends BaseError {
    /**
     * @param {string[]} filepaths
     */
    constructor(filepaths: string[]);
    code: "CheckoutConflictError";
    name: "CheckoutConflictError";
    data: {
        filepaths: string[];
    };
}
declare namespace CheckoutConflictError {
    const code_2: 'CheckoutConflictError';
    export { code_2 as code };
}
declare class CommitNotFetchedError extends BaseError {
    /**
     * @param {string} ref
     * @param {string} oid
     */
    constructor(ref: string, oid: string);
    code: "CommitNotFetchedError";
    name: "CommitNotFetchedError";
    data: {
        ref: string;
        oid: string;
    };
}
declare namespace CommitNotFetchedError {
    const code_3: 'CommitNotFetchedError';
    export { code_3 as code };
}
declare class EmptyServerResponseError extends BaseError {
    code: "EmptyServerResponseError";
    name: "EmptyServerResponseError";
    data: {};
}
declare namespace EmptyServerResponseError {
    const code_4: 'EmptyServerResponseError';
    export { code_4 as code };
}
declare class FastForwardError extends BaseError {
    code: "FastForwardError";
    name: "FastForwardError";
    data: {};
}
declare namespace FastForwardError {
    const code_5: 'FastForwardError';
    export { code_5 as code };
}
declare class GitPushError extends BaseError {
    /**
     * @param {string} prettyDetails
     * @param {PushResult} result
     */
    constructor(prettyDetails: string, result: PushResult);
    code: "GitPushError";
    name: "GitPushError";
    data: {
        prettyDetails: string;
        result: PushResult;
    };
}
declare namespace GitPushError {
    const code_6: 'GitPushError';
    export { code_6 as code };
}
declare class HttpError extends BaseError {
    /**
     * @param {number} statusCode
     * @param {string} statusMessage
     * @param {string} response
     */
    constructor(statusCode: number, statusMessage: string, response: string);
    code: "HttpError";
    name: "HttpError";
    data: {
        statusCode: number;
        statusMessage: string;
        response: string;
    };
}
declare namespace HttpError {
    const code_7: 'HttpError';
    export { code_7 as code };
}
declare class InternalError extends BaseError {
    /**
     * @param {string} message
     */
    constructor(message: string);
    code: "InternalError";
    name: "InternalError";
    data: {
        message: string;
    };
}
declare namespace InternalError {
    const code_8: 'InternalError';
    export { code_8 as code };
}
declare class InvalidFilepathError extends BaseError {
    /**
     * @param {'leading-slash'|'trailing-slash'} [reason]
     */
    constructor(reason?: "leading-slash" | "trailing-slash" | undefined);
    code: "InvalidFilepathError";
    name: "InvalidFilepathError";
    data: {
        reason: "leading-slash" | "trailing-slash" | undefined;
    };
}
declare namespace InvalidFilepathError {
    const code_9: 'InvalidFilepathError';
    export { code_9 as code };
}
declare class InvalidOidError extends BaseError {
    /**
     * @param {string} value
     */
    constructor(value: string);
    code: "InvalidOidError";
    name: "InvalidOidError";
    data: {
        value: string;
    };
}
declare namespace InvalidOidError {
    const code_10: 'InvalidOidError';
    export { code_10 as code };
}
declare class InvalidRefNameError extends BaseError {
    /**
     * @param {string} ref
     * @param {string} suggestion
     * @param {boolean} canForce
     */
    constructor(ref: string, suggestion: string);
    code: "InvalidRefNameError";
    name: "InvalidRefNameError";
    data: {
        ref: string;
        suggestion: string;
    };
}
declare namespace InvalidRefNameError {
    const code_11: 'InvalidRefNameError';
    export { code_11 as code };
}
declare class MaxDepthError extends BaseError {
    /**
     * @param {number} depth
     */
    constructor(depth: number);
    code: "MaxDepthError";
    name: "MaxDepthError";
    data: {
        depth: number;
    };
}
declare namespace MaxDepthError {
    const code_12: 'MaxDepthError';
    export { code_12 as code };
}
declare class MergeNotSupportedError extends BaseError {
    code: "MergeNotSupportedError";
    name: "MergeNotSupportedError";
    data: {};
}
declare namespace MergeNotSupportedError {
    const code_13: 'MergeNotSupportedError';
    export { code_13 as code };
}
declare class MissingNameError extends BaseError {
    /**
     * @param {'author'|'committer'|'tagger'} role
     */
    constructor(role: "author" | "committer" | "tagger");
    code: "MissingNameError";
    name: "MissingNameError";
    data: {
        role: "author" | "committer" | "tagger";
    };
}
declare namespace MissingNameError {
    const code_14: 'MissingNameError';
    export { code_14 as code };
}
declare class MissingParameterError extends BaseError {
    /**
     * @param {string} parameter
     */
    constructor(parameter: string);
    code: "MissingParameterError";
    name: "MissingParameterError";
    data: {
        parameter: string;
    };
}
declare namespace MissingParameterError {
    const code_15: 'MissingParameterError';
    export { code_15 as code };
}
declare class NoRefspecError extends BaseError {
    /**
     * @param {string} remote
     */
    constructor(remote: string);
    code: "NoRefspecError";
    name: "NoRefspecError";
    data: {
        remote: string;
    };
}
declare namespace NoRefspecError {
    const code_16: 'NoRefspecError';
    export { code_16 as code };
}
declare class NotFoundError extends BaseError {
    /**
     * @param {string} what
     */
    constructor(what: string);
    code: "NotFoundError";
    name: "NotFoundError";
    data: {
        what: string;
    };
}
declare namespace NotFoundError {
    const code_17: 'NotFoundError';
    export { code_17 as code };
}
declare class ObjectTypeError extends BaseError {
    /**
     * @param {string} oid
     * @param {'blob'|'commit'|'tag'|'tree'} actual
     * @param {'blob'|'commit'|'tag'|'tree'} expected
     * @param {string} [filepath]
     */
    constructor(oid: string, actual: "blob" | "tree" | "commit" | "tag", expected: "blob" | "tree" | "commit" | "tag", filepath?: string | undefined);
    code: "ObjectTypeError";
    name: "ObjectTypeError";
    data: {
        oid: string;
        actual: "blob" | "tree" | "commit" | "tag";
        expected: "blob" | "tree" | "commit" | "tag";
        filepath: string | undefined;
    };
}
declare namespace ObjectTypeError {
    const code_18: 'ObjectTypeError';
    export { code_18 as code };
}
declare class ParseError extends BaseError {
    /**
     * @param {string} expected
     * @param {string} actual
     */
    constructor(expected: string, actual: string);
    code: "ParseError";
    name: "ParseError";
    data: {
        expected: string;
        actual: string;
    };
}
declare namespace ParseError {
    const code_19: 'ParseError';
    export { code_19 as code };
}
declare class PushRejectedError extends BaseError {
    /**
     * @param {'not-fast-forward'|'tag-exists'} reason
     */
    constructor(reason: "not-fast-forward" | "tag-exists");
    code: "PushRejectedError";
    name: "PushRejectedError";
    data: {
        reason: "not-fast-forward" | "tag-exists";
    };
}
declare namespace PushRejectedError {
    const code_20: 'PushRejectedError';
    export { code_20 as code };
}
declare class RemoteCapabilityError extends BaseError {
    /**
     * @param {'shallow'|'deepen-since'|'deepen-not'|'deepen-relative'} capability
     * @param {'depth'|'since'|'exclude'|'relative'} parameter
     */
    constructor(capability: "shallow" | "deepen-since" | "deepen-not" | "deepen-relative", parameter: "depth" | "since" | "exclude" | "relative");
    code: "RemoteCapabilityError";
    name: "RemoteCapabilityError";
    data: {
        capability: "shallow" | "deepen-since" | "deepen-not" | "deepen-relative";
        parameter: "depth" | "since" | "exclude" | "relative";
    };
}
declare namespace RemoteCapabilityError {
    const code_21: 'RemoteCapabilityError';
    export { code_21 as code };
}
declare class SmartHttpError extends BaseError {
    /**
     * @param {string} preview
     * @param {string} response
     */
    constructor(preview: string, response: string);
    code: "SmartHttpError";
    name: "SmartHttpError";
    data: {
        preview: string;
        response: string;
    };
}
declare namespace SmartHttpError {
    const code_22: 'SmartHttpError';
    export { code_22 as code };
}
declare class UnknownTransportError extends BaseError {
    /**
     * @param {string} url
     * @param {string} transport
     * @param {string} suggestion
     */
    constructor(url: string, transport: string, suggestion: string);
    code: "UnknownTransportError";
    name: "UnknownTransportError";
    data: {
        url: string;
        transport: string;
        suggestion: string;
    };
}
declare namespace UnknownTransportError {
    const code_23: 'UnknownTransportError';
    export { code_23 as code };
}
declare class UnsafeFilepathError extends BaseError {
    /**
     * @param {string} filepath
     */
    constructor(filepath: string);
    code: "UnsafeFilepathError";
    name: "UnsafeFilepathError";
    data: {
        filepath: string;
    };
}
declare namespace UnsafeFilepathError {
    const code_24: 'UnsafeFilepathError';
    export { code_24 as code };
}
declare class UrlParseError extends BaseError {
    /**
     * @param {string} url
     */
    constructor(url: string);
    code: "UrlParseError";
    name: "UrlParseError";
    data: {
        url: string;
    };
}
declare namespace UrlParseError {
    const code_25: 'UrlParseError';
    export { code_25 as code };
}
declare class UserCanceledError extends BaseError {
    code: "UserCanceledError";
    name: "UserCanceledError";
    data: {};
}
declare namespace UserCanceledError {
    const code_26: 'UserCanceledError';
    export { code_26 as code };
}
/**
 * @typedef {Object} GitProgressEvent
 * @property {string} phase
 * @property {number} loaded
 * @property {number} total
 */
/**
 * @callback ProgressCallback
 * @param {GitProgressEvent} progress
 * @returns {void | Promise<void>}
 */
/**
 * @typedef {Object} GitHttpRequest
 * @property {string} url - The URL to request
 * @property {string} [method='GET'] - The HTTP method to use
 * @property {Object<string, string>} [headers={}] - Headers to include in the HTTP request
 * @property {AsyncIterableIterator<Uint8Array>} [body] - An async iterator of Uint8Arrays that make up the body of POST requests
 * @property {ProgressCallback} [onProgress] - Reserved for future use (emitting `GitProgressEvent`s)
 * @property {object} [signal] - Reserved for future use (canceling a request)
 */
/**
 * @typedef {Object} GitHttpResponse
 * @property {string} url - The final URL that was fetched after any redirects
 * @property {string} [method] - The HTTP method that was used
 * @property {Object<string, string>} [headers] - HTTP response headers
 * @property {AsyncIterableIterator<Uint8Array>} [body] - An async iterator of Uint8Arrays that make up the body of the response
 * @property {number} statusCode - The HTTP status code
 * @property {string} statusMessage - The HTTP status message
 */
/**
 * @callback HttpFetch
 * @param {GitHttpRequest} request
 * @returns {Promise<GitHttpResponse>}
 */
/**
 * @typedef {Object} HttpClient
 * @property {HttpFetch} request
 */
/**
 * A git commit object.
 *
 * @typedef {Object} CommitObject
 * @property {string} message Commit message
 * @property {string} tree SHA-1 object id of corresponding file tree
 * @property {string[]} parent an array of zero or more SHA-1 object ids
 * @property {Object} author
 * @property {string} author.name The author's name
 * @property {string} author.email The author's email
 * @property {number} author.timestamp UTC Unix timestamp in seconds
 * @property {number} author.timezoneOffset Timezone difference from UTC in minutes
 * @property {Object} committer
 * @property {string} committer.name The committer's name
 * @property {string} committer.email The committer's email
 * @property {number} committer.timestamp UTC Unix timestamp in seconds
 * @property {number} committer.timezoneOffset Timezone difference from UTC in minutes
 * @property {string} [gpgsig] PGP signature (if present)
 */
/**
 * An entry from a git tree object. Files are called 'blobs' and directories are called 'trees'.
 *
 * @typedef {Object} TreeEntry
 * @property {string} mode the 6 digit hexadecimal mode
 * @property {string} path the name of the file or directory
 * @property {string} oid the SHA-1 object id of the blob or tree
 * @property {'commit'|'blob'|'tree'} type the type of object
 */
/**
 * A git tree object. Trees represent a directory snapshot.
 *
 * @typedef {TreeEntry[]} TreeObject
 */
/**
 * A git annotated tag object.
 *
 * @typedef {Object} TagObject
 * @property {string} object SHA-1 object id of object being tagged
 * @property {'blob' | 'tree' | 'commit' | 'tag'} type the type of the object being tagged
 * @property {string} tag the tag name
 * @property {Object} tagger
 * @property {string} tagger.name the tagger's name
 * @property {string} tagger.email the tagger's email
 * @property {number} tagger.timestamp UTC Unix timestamp in seconds
 * @property {number} tagger.timezoneOffset timezone difference from UTC in minutes
 * @property {string} message tag message
 * @property {string} [gpgsig] PGP signature (if present)
 */
/**
 * @typedef {Object} ReadCommitResult
 * @property {string} oid - SHA-1 object id of this commit
 * @property {CommitObject} commit - the parsed commit object
 * @property {string} payload - PGP signing payload
 */
/**
 * @typedef {Object} ServerRef - This object has the following schema:
 * @property {string} ref - The name of the ref
 * @property {string} oid - The SHA-1 object id the ref points to
 * @property {string} [target] - The target ref pointed to by a symbolic ref
 * @property {string} [peeled] - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
 */
/**
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */
/**
 * Normalized subset of filesystem `stat` data:
 *
 * @typedef {Object} Stat
 * @property {number} ctimeSeconds
 * @property {number} ctimeNanoseconds
 * @property {number} mtimeSeconds
 * @property {number} mtimeNanoseconds
 * @property {number} dev
 * @property {number} ino
 * @property {number} mode
 * @property {number} uid
 * @property {number} gid
 * @property {number} size
 */
/**
 * The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.
 *
 * @typedef {Object} WalkerEntry
 * @property {function(): Promise<'tree'|'blob'|'special'|'commit'>} type
 * @property {function(): Promise<number>} mode
 * @property {function(): Promise<string>} oid
 * @property {function(): Promise<Uint8Array|void>} content
 * @property {function(): Promise<Stat>} stat
 */
/**
 * @typedef {Object} CallbackFsClient
 * @property {function} readFile - https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
 * @property {function} writeFile - https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
 * @property {function} unlink - https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback
 * @property {function} readdir - https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback
 * @property {function} mkdir - https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback
 * @property {function} rmdir - https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback
 * @property {function} stat - https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback
 * @property {function} lstat - https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback
 * @property {function} [readlink] - https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback
 * @property {function} [symlink] - https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback
 * @property {function} [chmod] - https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback
 */
/**
 * @typedef {Object} PromiseFsClient
 * @property {Object} promises
 * @property {function} promises.readFile - https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
 * @property {function} promises.writeFile - https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
 * @property {function} promises.unlink - https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
 * @property {function} promises.readdir - https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
 * @property {function} promises.mkdir - https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
 * @property {function} promises.rmdir - https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path
 * @property {function} promises.stat - https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
 * @property {function} promises.lstat - https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
 * @property {function} [promises.readlink] - https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
 * @property {function} [promises.symlink] - https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
 * @property {function} [promises.chmod] - https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
 */
/**
 * @typedef {CallbackFsClient | PromiseFsClient} FsClient
 */
/**
 * @callback MessageCallback
 * @param {string} message
 * @returns {void | Promise<void>}
 */
/**
 * @typedef {Object} GitAuth
 * @property {string} [username]
 * @property {string} [password]
 * @property {Object<string, string>} [headers]
 * @property {boolean} [cancel] Tells git to throw a `UserCanceledError` (instead of an `HttpError`).
 */
/**
 * @callback AuthCallback
 * @param {string} url
 * @param {GitAuth} auth Might have some values if the URL itself originally contained a username or password.
 * @returns {GitAuth | void | Promise<GitAuth | void>}
 */
/**
 * @callback AuthFailureCallback
 * @param {string} url
 * @param {GitAuth} auth The credentials that failed
 * @returns {GitAuth | void | Promise<GitAuth | void>}
 */
/**
 * @callback AuthSuccessCallback
 * @param {string} url
 * @param {GitAuth} auth
 * @returns {void | Promise<void>}
 */
/**
 * @typedef {Object} SignParams
 * @property {string} payload - a plaintext message
 * @property {string} secretKey - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
 */
/**
 * @callback SignCallback
 * @param {SignParams} args
 * @return {{signature: string} | Promise<{signature: string}>} - an 'ASCII armor' encoded "detached" signature
 */
/**
 * @callback WalkerMap
 * @param {string} filename
 * @param {WalkerEntry[]} entries
 * @returns {Promise<any>}
 */
/**
 * @callback WalkerReduce
 * @param {any} parent
 * @param {any[]} children
 * @returns {Promise<any>}
 */
/**
 * @callback WalkerIterateCallback
 * @param {WalkerEntry[]} entries
 * @returns {Promise<any[]>}
 */
/**
 * @callback WalkerIterate
 * @param {WalkerIterateCallback} walk
 * @param {IterableIterator<WalkerEntry[]>} children
 * @returns {Promise<any[]>}
 */
/**
 * @typedef {Object} RefUpdateStatus
 * @property {boolean} ok
 * @property {string} error
 */
/**
 * @typedef {Object} PushResult
 * @property {boolean} ok
 * @property {?string} error
 * @property {Object<string, RefUpdateStatus>} refs
 * @property {Object<string, string>} [headers]
 */
/**
 * @typedef {0|1} HeadStatus
 */
/**
 * @typedef {0|1|2} WorkdirStatus
 */
/**
 * @typedef {0|1|2|3} StageStatus
 */
/**
 * @typedef {[string, HeadStatus, WorkdirStatus, StageStatus]} StatusRow
 */
declare class BaseError extends Error {
    constructor(message: any);
    caller: string;
    toJSON(): {
        code: any;
        data: any;
        caller: string;
        message: string;
        stack: string | undefined;
    };
    fromJSON(json: any): BaseError;
    get isIsomorphicGitError(): boolean;
}
