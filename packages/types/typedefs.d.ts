/**
 * A git commit object.
 */
type CommitObject = {
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
        name: string;
        email: string;
        timestamp: number;
        timezoneOffset: number;
    };
    committer: {
        name: string;
        email: string;
        timestamp: number;
        timezoneOffset: number;
    };
    /**
     * PGP signature (if present)
     */
    gpgsig?: string;
};
/**
 * An entry from a git tree object. Files are called 'blobs' and directories are called 'trees'.
 */
type TreeEntry = {
    /**
     * the 6 digit hexadecimal mode
     */
    mode: string;
    /**
     * the name of the file or directory
     */
    path: string;
    /**
     * the SHA-1 object id of the blob or tree
     */
    oid: string;
    /**
     * the type of object
     */
    type: "commit" | "blob" | "tree";
};
/**
 * A git tree object. Trees represent a directory snapshot.
 */
type TreeObject = TreeEntry[];
/**
 * A git annotated tag object.
 */
type TagObject = {
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
        name: string;
        email: string;
        timestamp: number;
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
type ReadCommitResult = {
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
/**
 * - This object has the following schema:
 */
type ServerRef = {
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
type Walker = {
    /**
     * ('GitWalkerSymbol')
     */
    Symbol: Symbol;
};
/**
 * Normalized subset of filesystem `stat` data:
 */
type Stat = {
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
type WalkerEntry = {
    type: () => Promise<"tree" | "blob" | "special" | "commit">;
    mode: () => Promise<number>;
    oid: () => Promise<string>;
    content: () => Promise<Uint8Array | void>;
    stat: () => Promise<Stat>;
};
type CallbackFsClient = {
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
type PromiseFsClient = {
    promises: {
        readFile: Function;
        writeFile: Function;
        unlink: Function;
        readdir: Function;
        mkdir: Function;
        rmdir: Function;
        stat: Function;
        lstat: Function;
        readlink?: Function;
        symlink?: Function;
        chmod?: Function;
    };
};
type FsClient = CallbackFsClient | PromiseFsClient;
type MessageCallback = (message: string) => void | Promise<void>;
type GitAuth = {
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
type AuthCallback = (url: string, auth: GitAuth) => GitAuth | void | Promise<GitAuth | void>;
type AuthFailureCallback = (url: string, auth: GitAuth) => GitAuth | void | Promise<GitAuth | void>;
type AuthSuccessCallback = (url: string, auth: GitAuth) => void | Promise<void>;
type SignParams = {
    /**
     * - a plaintext message
     */
    payload: string;
    /**
     * - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
     */
    secretKey: string;
};
type SignCallback = (args: SignParams) => {
    signature: string;
} | Promise<{
    signature: string;
}>;
type MergeDriverParams = {
    branches: Array<string>;
    contents: Array<string>;
    path: string;
};
type MergeDriverCallback = (args: MergeDriverParams) => {
    cleanMerge: boolean;
    mergedText: string;
} | Promise<{
    cleanMerge: boolean;
    mergedText: string;
}>;
type WalkerMap = (filename: string, entries: WalkerEntry[]) => Promise<any>;
type WalkerReduce = (parent: any, children: any[]) => Promise<any>;
type WalkerIterateCallback = (entries: WalkerEntry[]) => Promise<any[]>;
type WalkerIterate = (walk: WalkerIterateCallback, children: IterableIterator<WalkerEntry[]>) => Promise<any[]>;
type RefUpdateStatus = {
    ok: boolean;
    error: string;
};
type PushResult = {
    ok: boolean;
    error: string | null;
    refs: {
        [x: string]: RefUpdateStatus;
    };
    headers?: {
        [x: string]: string;
    };
};
type HeadStatus = 0 | 1;
type WorkdirStatus = 0 | 1 | 2;
type StageStatus = 0 | 1 | 2 | 3;
type StatusRow = [string, HeadStatus, WorkdirStatus, StageStatus];
/**
 * the type of stash ops
 */
type StashOp = "push" | "pop" | "apply" | "drop" | "list" | "clear";
/**
 * - when compare WORDIR to HEAD, 'remove' could mean 'untracked'
 */
type StashChangeType = "equal" | "modify" | "add" | "remove" | "unknown";
type ClientRef = {
    /**
     * The name of the ref
     */
    ref: string;
    /**
     * The SHA-1 object id the ref points to
     */
    oid: string;
};
type PrePushParams = {
    /**
     * The expanded name of target remote
     */
    remote: string;
    /**
     * The URL address of target remote
     */
    url: string;
    /**
     * The ref which the client wants to push to the remote
     */
    localRef: ClientRef;
    /**
     * The ref which is known by the remote
     */
    remoteRef: ClientRef;
};
type PrePushCallback = (args: PrePushParams) => boolean | Promise<boolean>;
type PostCheckoutParams = {
    /**
     * The SHA-1 object id of HEAD before checkout
     */
    previousHead: string;
    /**
     * The SHA-1 object id of HEAD after checkout
     */
    newHead: string;
    /**
     * flag determining whether a branch or a set of files was checked
     */
    type: "branch" | "file";
};
type PostCheckoutCallback = (args: PostCheckoutParams) => void | Promise<void>;
