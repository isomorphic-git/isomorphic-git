import '@isomorphic-git/types';
import { InternalError, GitIndexManager, flatFileListToDirectoryStructure, normalizeStats, GitWalkSymbol, compareStats, shasum, GitObject, GitConfigManager, _readObject, GitAnnotatedTag, ObjectTypeError, GitCommit, GitTree, _writeObject, NotFoundError, readObjectLoose, GitIgnoreManager, _walk, TREE, normalizeAuthorObject, MissingNameError, InvalidRefNameError, GitRefManager } from './GitShallowManager.js';
import { compareStrings, join } from './join.js';
import AsyncLock from 'async-lock';

/**
 *
 * @param {number} mode
 */
function mode2type(mode) {
  // prettier-ignore
  switch (mode) {
    case 0o040000: return 'tree'
    case 0o100644: return 'blob'
    case 0o100755: return 'blob'
    case 0o120000: return 'blob'
    case 0o160000: return 'commit'
  }
  throw new InternalError(`Unexpected GitTree entry mode: ${mode.toString(8)}`)
}

class GitWalkerIndex {
  constructor({ fs, gitdir, cache }) {
    this.treePromise = GitIndexManager.acquire(
      { fs, gitdir, cache },
      async function(index) {
        return flatFileListToDirectoryStructure(index.entries)
      }
    );
    const walker = this;
    this.ConstructEntry = class StageEntry {
      constructor(fullpath) {
        this._fullpath = fullpath;
        this._type = false;
        this._mode = false;
        this._stat = false;
        this._oid = false;
      }

      async type() {
        return walker.type(this)
      }

      async mode() {
        return walker.mode(this)
      }

      async stat() {
        return walker.stat(this)
      }

      async content() {
        return walker.content(this)
      }

      async oid() {
        return walker.oid(this)
      }
    };
  }

  async readdir(entry) {
    const filepath = entry._fullpath;
    const tree = await this.treePromise;
    const inode = tree.get(filepath);
    if (!inode) return null
    if (inode.type === 'blob') return null
    if (inode.type !== 'tree') {
      throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    }
    const names = inode.children.map(inode => inode.fullpath);
    names.sort(compareStrings);
    return names
  }

  async type(entry) {
    if (entry._type === false) {
      await entry.stat();
    }
    return entry._type
  }

  async mode(entry) {
    if (entry._mode === false) {
      await entry.stat();
    }
    return entry._mode
  }

  async stat(entry) {
    if (entry._stat === false) {
      const tree = await this.treePromise;
      const inode = tree.get(entry._fullpath);
      if (!inode) {
        throw new Error(
          `ENOENT: no such file or directory, lstat '${entry._fullpath}'`
        )
      }
      const stats = inode.type === 'tree' ? {} : normalizeStats(inode.metadata);
      entry._type = inode.type === 'tree' ? 'tree' : mode2type(stats.mode);
      entry._mode = stats.mode;
      if (inode.type === 'tree') {
        entry._stat = undefined;
      } else {
        entry._stat = stats;
      }
    }
    return entry._stat
  }

  async content(_entry) {
    // Cannot get content for an index entry
  }

  async oid(entry) {
    if (entry._oid === false) {
      const tree = await this.treePromise;
      const inode = tree.get(entry._fullpath);
      entry._oid = inode.metadata.oid;
    }
    return entry._oid
  }
}

// @ts-check

/**
 * @returns {Walker}
 */
function STAGE() {
  const o = Object.create(null);
  Object.defineProperty(o, GitWalkSymbol, {
    value: function({ fs, gitdir, cache }) {
      return new GitWalkerIndex({ fs, gitdir, cache })
    },
  });
  Object.freeze(o);
  return o
}

class GitWalkerFs {
  constructor({ fs, dir, gitdir, cache }) {
    this.fs = fs;
    this.cache = cache;
    this.dir = dir;
    this.gitdir = gitdir;

    this.config = null;
    const walker = this;
    this.ConstructEntry = class WorkdirEntry {
      constructor(fullpath) {
        this._fullpath = fullpath;
        this._type = false;
        this._mode = false;
        this._stat = false;
        this._content = false;
        this._oid = false;
      }

      async type() {
        return walker.type(this)
      }

      async mode() {
        return walker.mode(this)
      }

      async stat() {
        return walker.stat(this)
      }

      async content() {
        return walker.content(this)
      }

      async oid() {
        return walker.oid(this)
      }
    };
  }

  async readdir(entry) {
    const filepath = entry._fullpath;
    const { fs, dir } = this;
    const names = await fs.readdir(join(dir, filepath));
    if (names === null) return null
    return names.map(name => join(filepath, name))
  }

  async type(entry) {
    if (entry._type === false) {
      await entry.stat();
    }
    return entry._type
  }

  async mode(entry) {
    if (entry._mode === false) {
      await entry.stat();
    }
    return entry._mode
  }

  async stat(entry) {
    if (entry._stat === false) {
      const { fs, dir } = this;
      let stat = await fs.lstat(`${dir}/${entry._fullpath}`);
      if (!stat) {
        throw new Error(
          `ENOENT: no such file or directory, lstat '${entry._fullpath}'`
        )
      }
      let type = stat.isDirectory() ? 'tree' : 'blob';
      if (type === 'blob' && !stat.isFile() && !stat.isSymbolicLink()) {
        type = 'special';
      }
      entry._type = type;
      stat = normalizeStats(stat);
      entry._mode = stat.mode;
      // workaround for a BrowserFS edge case
      if (stat.size === -1 && entry._actualSize) {
        stat.size = entry._actualSize;
      }
      entry._stat = stat;
    }
    return entry._stat
  }

  async content(entry) {
    if (entry._content === false) {
      const { fs, dir, gitdir } = this;
      if ((await entry.type()) === 'tree') {
        entry._content = undefined;
      } else {
        const config = await this._getGitConfig(fs, gitdir);
        const autocrlf = await config.get('core.autocrlf');
        const content = await fs.read(`${dir}/${entry._fullpath}`, { autocrlf });
        // workaround for a BrowserFS edge case
        entry._actualSize = content.length;
        if (entry._stat && entry._stat.size === -1) {
          entry._stat.size = entry._actualSize;
        }
        entry._content = new Uint8Array(content);
      }
    }
    return entry._content
  }

  async oid(entry) {
    if (entry._oid === false) {
      const self = this;
      const { fs, gitdir, cache } = this;
      let oid;
      // See if we can use the SHA1 hash in the index.
      await GitIndexManager.acquire({ fs, gitdir, cache }, async function(
        index
      ) {
        const stage = index.entriesMap.get(entry._fullpath);
        const stats = await entry.stat();
        const config = await self._getGitConfig(fs, gitdir);
        const filemode = await config.get('core.filemode');
        const trustino =
          typeof process !== 'undefined'
            ? !(process.platform === 'win32')
            : true;
        if (!stage || compareStats(stats, stage, filemode, trustino)) {
          const content = await entry.content();
          if (content === undefined) {
            oid = undefined;
          } else {
            oid = await shasum(
              GitObject.wrap({ type: 'blob', object: content })
            );
            // Update the stats in the index so we will get a "cache hit" next time
            // 1) if we can (because the oid and mode are the same)
            // 2) and only if we need to (because other stats differ)
            if (
              stage &&
              oid === stage.oid &&
              (!filemode || stats.mode === stage.mode) &&
              compareStats(stats, stage, filemode, trustino)
            ) {
              index.insert({
                filepath: entry._fullpath,
                stats,
                oid: oid,
              });
            }
          }
        } else {
          // Use the index SHA1 rather than compute it
          oid = stage.oid;
        }
      });
      entry._oid = oid;
    }
    return entry._oid
  }

  async _getGitConfig(fs, gitdir) {
    if (this.config) {
      return this.config
    }
    this.config = await GitConfigManager.get({ fs, gitdir });
    return this.config
  }
}

// @ts-check

/**
 * @returns {Walker}
 */
function WORKDIR() {
  const o = Object.create(null);
  Object.defineProperty(o, GitWalkSymbol, {
    value: function({ fs, dir, gitdir, cache }) {
      return new GitWalkerFs({ fs, dir, gitdir, cache })
    },
  });
  Object.freeze(o);
  return o
}

function posixifyPathBuffer(buffer) {
  let idx;
  while (~(idx = buffer.indexOf(92))) buffer[idx] = 47;
  return buffer
}

async function resolveCommit({ fs, cache, gitdir, oid }) {
  const { type, object } = await _readObject({ fs, cache, gitdir, oid });
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object;
    return resolveCommit({ fs, cache, gitdir, oid })
  }
  if (type !== 'commit') {
    throw new ObjectTypeError(oid, type, 'commit')
  }
  return { commit: GitCommit.from(object), oid }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 *
 * @returns {Promise<ReadCommitResult>} Resolves successfully with a git commit object
 * @see ReadCommitResult
 * @see CommitObject
 *
 */
async function _readCommit({ fs, cache, gitdir, oid }) {
  const { commit, oid: commitOid } = await resolveCommit({
    fs,
    cache,
    gitdir,
    oid,
  });
  const result = {
    oid: commitOid,
    commit: commit.parse(),
    payload: commit.withoutSignature(),
  };
  // @ts-ignore
  return result
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {TreeObject} args.tree
 *
 * @returns {Promise<string>}
 */
async function _writeTree({ fs, gitdir, tree }) {
  // Convert object to buffer
  const object = GitTree.from(tree).toObject();
  const oid = await _writeObject({
    fs,
    gitdir,
    type: 'tree',
    object,
    format: 'content',
  });
  return oid
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {CommitObject} args.commit
 *
 * @returns {Promise<string>}
 * @see CommitObject
 *
 */
async function _writeCommit({ fs, gitdir, commit }) {
  // Convert object to buffer
  const object = GitCommit.from(commit).toObject();
  const oid = await _writeObject({
    fs,
    gitdir,
    type: 'commit',
    object,
    format: 'content',
  });
  return oid
}

class GitRefStash {
  // constructor removed

  static get timezoneOffsetForRefLogEntry() {
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetMinutesFormatted = Math.abs(offsetMinutes % 60)
      .toString()
      .padStart(2, '0');
    const sign = offsetMinutes > 0 ? '-' : '+';
    return `${sign}${offsetHours
      .toString()
      .padStart(2, '0')}${offsetMinutesFormatted}`
  }

  static createStashReflogEntry(author, stashCommit, message) {
    const nameNoSpace = author.name.replace(/\s/g, '');
    const z40 = '0000000000000000000000000000000000000000'; // hard code for now, works with `git stash list`
    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneOffset = GitRefStash.timezoneOffsetForRefLogEntry;
    return `${z40} ${stashCommit} ${nameNoSpace} ${author.email} ${timestamp} ${timezoneOffset}\t${message}\n`
  }

  static getStashReflogEntry(reflogString, parsed = false) {
    const reflogLines = reflogString.split('\n');
    const entries = reflogLines
      .filter(l => l)
      .reverse()
      .map((line, idx) =>
        parsed ? `stash@{${idx}}: ${line.split('\t')[1]}` : line
      );
    return entries
  }
}

const _TreeMap = {
  stage: STAGE,
  workdir: WORKDIR,
};

let lock;
async function acquireLock(ref, callback) {
  if (lock === undefined) lock = new AsyncLock();
  return lock.acquire(ref, callback)
}

// make sure filepath, blob type and blob object (from loose objects) plus oid are in sync and valid
async function checkAndWriteBlob(fs, gitdir, dir, filepath, oid = null) {
  const currentFilepath = join(dir, filepath);
  const stats = await fs.lstat(currentFilepath);
  if (!stats) throw new NotFoundError(currentFilepath)
  if (stats.isDirectory())
    throw new InternalError(
      `${currentFilepath}: file expected, but found directory`
    )

  // Look for it in the loose object directory.
  const objContent = oid
    ? await readObjectLoose({ fs, gitdir, oid })
    : undefined;
  let retOid = objContent ? oid : undefined;
  if (!objContent) {
    await acquireLock({ fs, gitdir, currentFilepath }, async () => {
      const object = stats.isSymbolicLink()
        ? await fs.readlink(currentFilepath).then(posixifyPathBuffer)
        : await fs.read(currentFilepath);

      if (object === null) throw new NotFoundError(currentFilepath)

      retOid = await _writeObject({ fs, gitdir, type: 'blob', object });
    });
  }

  return retOid
}

async function processTreeEntries({ fs, dir, gitdir, entries }) {
  // make sure each tree entry has valid oid
  async function processTreeEntry(entry) {
    if (entry.type === 'tree') {
      if (!entry.oid) {
        // Process children entries if the current entry is a tree
        const children = await Promise.all(entry.children.map(processTreeEntry));
        // Write the tree with the processed children
        entry.oid = await _writeTree({
          fs,
          gitdir,
          tree: children,
        });
        entry.mode = 0o40000; // directory
      }
    } else if (entry.type === 'blob') {
      entry.oid = await checkAndWriteBlob(
        fs,
        gitdir,
        dir,
        entry.path,
        entry.oid
      );
      entry.mode = 0o100644; // file
    }

    // remove path from entry.path
    entry.path = entry.path.split('/').pop();
    return entry
  }

  return Promise.all(entries.map(processTreeEntry))
}

async function writeTreeChanges({
  fs,
  dir,
  gitdir,
  treePair, // [TREE({ ref: 'HEAD' }), 'STAGE'] would be the equivalent of `git write-tree`
}) {
  const isStage = treePair[1] === 'stage';
  const trees = treePair.map(t => (typeof t === 'string' ? _TreeMap[t]() : t));

  const changedEntries = [];
  // transform WalkerEntry objects into the desired format
  const map = async (filepath, [head, stage]) => {
    if (
      filepath === '.' ||
      (await GitIgnoreManager.isIgnored({ fs, dir, gitdir, filepath }))
    ) {
      return
    }

    if (stage) {
      if (
        !head ||
        ((await head.oid()) !== (await stage.oid()) &&
          (await stage.oid()) !== undefined)
      ) {
        changedEntries.push([head, stage]);
      }
      return {
        mode: await stage.mode(),
        path: filepath,
        oid: await stage.oid(),
        type: await stage.type(),
      }
    }
  };

  // combine mapped entries with their parent results
  const reduce = async (parent, children) => {
    children = children.filter(Boolean); // Remove undefined entries
    if (!parent) {
      return children.length > 0 ? children : undefined
    } else {
      parent.children = children;
      return parent
    }
  };

  // if parent is skipped, skip the children
  const iterate = async (walk, children) => {
    const filtered = [];
    for (const child of children) {
      const [head, stage] = child;
      if (isStage) {
        if (stage) {
          // for deleted file in work dir, it also needs to be added on stage
          if (await fs.exists(`${dir}/${stage.toString()}`)) {
            filtered.push(child);
          } else {
            changedEntries.push([null, stage]); // record the change (deletion) while stop the iteration
          }
        }
      } else if (head) {
        // for deleted file in workdir, "stage" (workdir in our case) will be undefined
        if (!stage) {
          changedEntries.push([head, null]); // record the change (deletion) while stop the iteration
        } else {
          filtered.push(child); // workdir, tracked only
        }
      }
    }
    return filtered.length ? Promise.all(filtered.map(walk)) : []
  };

  const entries = await _walk({
    fs,
    cache: {},
    dir,
    gitdir,
    trees,
    map,
    reduce,
    iterate,
  });

  if (changedEntries.length === 0 || entries.length === 0) {
    return null // no changes found to stash
  }

  const processedEntries = await processTreeEntries({
    fs,
    dir,
    gitdir,
    entries,
  });

  const treeEntries = processedEntries.filter(Boolean).map(entry => ({
    mode: entry.mode,
    path: entry.path,
    oid: entry.oid,
    type: entry.type,
  }));

  return _writeTree({ fs, gitdir, tree: treeEntries })
}

async function applyTreeChanges({
  fs,
  dir,
  gitdir,
  stashCommit,
  parentCommit,
  wasStaged,
}) {
  const dirRemoved = [];
  const stageUpdated = [];

  // analyze the changes
  const ops = await _walk({
    fs,
    cache: {},
    dir,
    gitdir,
    trees: [TREE({ ref: parentCommit }), TREE({ ref: stashCommit })],
    map: async (filepath, [parent, stash]) => {
      if (
        filepath === '.' ||
        (await GitIgnoreManager.isIgnored({ fs, dir, gitdir, filepath }))
      ) {
        return
      }
      const type = stash ? await stash.type() : await parent.type();
      if (type !== 'tree' && type !== 'blob') {
        return
      }

      // deleted tree or blob
      if (!stash && parent) {
        const method = type === 'tree' ? 'rmdir' : 'rm';
        if (type === 'tree') dirRemoved.push(filepath);
        if (type === 'blob' && wasStaged)
          stageUpdated.push({ filepath, oid: await parent.oid() }); // stats is undefined, will stage the deletion with index.insert
        return { method, filepath }
      }

      const oid = await stash.oid();
      if (!parent || (await parent.oid()) !== oid) {
        // only apply changes if changed from the parent commit or doesn't exist in the parent commit
        if (type === 'tree') {
          return { method: 'mkdir', filepath }
        } else {
          if (wasStaged)
            stageUpdated.push({
              filepath,
              oid,
              stats: await fs.lstat(join(dir, filepath)),
            });
          return {
            method: 'write',
            filepath,
            oid,
          }
        }
      }
    },
  });

  // apply the changes to work dir
  await acquireLock({ fs, gitdir, dirRemoved, ops }, async () => {
    for (const op of ops) {
      const currentFilepath = join(dir, op.filepath);
      switch (op.method) {
        case 'rmdir':
          await fs.rmdir(currentFilepath);
          break
        case 'mkdir':
          await fs.mkdir(currentFilepath);
          break
        case 'rm':
          await fs.rm(currentFilepath);
          break
        case 'write':
          // only writes if file is not in the removedDirs
          if (
            !dirRemoved.some(removedDir =>
              currentFilepath.startsWith(removedDir)
            )
          ) {
            const { object } = await _readObject({
              fs,
              cache: {},
              gitdir,
              oid: op.oid,
            });
            // just like checkout, since mode only applicable to create, not update, delete first
            if (await fs.exists(currentFilepath)) {
              await fs.rm(currentFilepath);
            }
            await fs.write(currentFilepath, object); // only handles regular files for now
          }
          break
      }
    }
  });

  // update the stage
  await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
    stageUpdated.forEach(({ filepath, stats, oid }) => {
      index.insert({ filepath, stats, oid });
    });
  });
}

class GitStashManager {
  /**
   * Creates an instance of GitStashManager.
   *
   * @param {Object} args
   * @param {FSClient} args.fs - A file system implementation.
   * @param {string} args.dir - The working directory.
   * @param {string}[args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
   */
  constructor({ fs, dir, gitdir = join(dir, '.git') }) {
    Object.assign(this, {
      fs,
      dir,
      gitdir,
      _author: null,
    });
  }

  /**
   * Gets the reference name for the stash.
   *
   * @returns {string} - The stash reference name.
   */
  static get refStash() {
    return 'refs/stash'
  }

  /**
   * Gets the reference name for the stash reflogs.
   *
   * @returns {string} - The stash reflogs reference name.
   */
  static get refLogsStash() {
    return 'logs/refs/stash'
  }

  /**
   * Gets the file path for the stash reference.
   *
   * @returns {string} - The file path for the stash reference.
   */
  get refStashPath() {
    return join(this.gitdir, GitStashManager.refStash)
  }

  /**
   * Gets the file path for the stash reflogs.
   *
   * @returns {string} - The file path for the stash reflogs.
   */
  get refLogsStashPath() {
    return join(this.gitdir, GitStashManager.refLogsStash)
  }

  /**
   * Retrieves the author information for the stash.
   *
   * @returns {Promise<Object>} - The author object.
   * @throws {MissingNameError} - If the author name is missing.
   */
  async getAuthor() {
    if (!this._author) {
      this._author = await normalizeAuthorObject({
        fs: this.fs,
        gitdir: this.gitdir,
        author: {},
      });
      if (!this._author) throw new MissingNameError('author')
    }
    return this._author
  }

  /**
   * Gets the SHA of a stash entry by its index.
   *
   * @param {number} refIdx - The index of the stash entry.
   * @param {string[]} [stashEntries] - Optional preloaded stash entries.
   * @returns {Promise<string|null>} - The SHA of the stash entry or `null` if not found.
   */
  async getStashSHA(refIdx, stashEntries) {
    if (!(await this.fs.exists(this.refStashPath))) {
      return null
    }

    const entries =
      stashEntries || (await this.readStashReflogs({ parsed: false }));
    return entries[refIdx].split(' ')[1]
  }

  /**
   * Writes a stash commit to the repository.
   *
   * @param {Object} args
   * @param {string} args.message - The commit message.
   * @param {string} args.tree - The tree object ID.
   * @param {string[]} args.parent - The parent commit object IDs.
   * @returns {Promise<string>} - The object ID of the written commit.
   */
  async writeStashCommit({ message, tree, parent }) {
    return _writeCommit({
      fs: this.fs,
      gitdir: this.gitdir,
      commit: {
        message,
        tree,
        parent,
        author: await this.getAuthor(),
        committer: await this.getAuthor(),
      },
    })
  }

  /**
   * Reads a stash commit by its index.
   *
   * @param {number} refIdx - The index of the stash entry.
   * @returns {Promise<Object>} - The stash commit object.
   * @throws {InvalidRefNameError} - If the index is invalid.
   */
  async readStashCommit(refIdx) {
    const stashEntries = await this.readStashReflogs({ parsed: false });
    if (refIdx !== 0) {
      // non-default case, throw exceptions if not valid
      if (refIdx < 0 || refIdx > stashEntries.length - 1) {
        throw new InvalidRefNameError(
          `stash@${refIdx}`,
          'number that is in range of [0, num of stash pushed]'
        )
      }
    }

    const stashSHA = await this.getStashSHA(refIdx, stashEntries);
    if (!stashSHA) {
      return {} // no stash found
    }

    // get the stash commit object
    return _readCommit({
      fs: this.fs,
      cache: {},
      gitdir: this.gitdir,
      oid: stashSHA,
    })
  }

  /**
   * Writes a stash reference to the repository.
   *
   * @param {string} stashCommit - The object ID of the stash commit.
   * @returns {Promise<void>}
   */
  async writeStashRef(stashCommit) {
    return GitRefManager.writeRef({
      fs: this.fs,
      gitdir: this.gitdir,
      ref: GitStashManager.refStash,
      value: stashCommit,
    })
  }

  /**
   * Writes a reflog entry for a stash commit.
   *
   * @param {Object} args
   * @param {string} args.stashCommit - The object ID of the stash commit.
   * @param {string} args.message - The reflog message.
   * @returns {Promise<void>}
   */
  async writeStashReflogEntry({ stashCommit, message }) {
    const author = await this.getAuthor();
    const entry = GitRefStash.createStashReflogEntry(
      author,
      stashCommit,
      message
    );
    const filepath = this.refLogsStashPath;

    await acquireLock({ filepath, entry }, async () => {
      const appendTo = (await this.fs.exists(filepath))
        ? await this.fs.read(filepath, 'utf8')
        : '';
      await this.fs.write(filepath, appendTo + entry, 'utf8');
    });
  }

  /**
   * Reads the stash reflogs.
   *
   * @param {Object} args
   * @param {boolean} [args.parsed=false] - Whether to parse the reflog entries.
   * @returns {Promise<string[]|Object[]>} - The reflog entries as strings or parsed objects.
   */
  async readStashReflogs({ parsed = false }) {
    if (!(await this.fs.exists(this.refLogsStashPath))) {
      return []
    }

    const reflogBuffer = await this.fs.read(this.refLogsStashPath);
    const reflogString = reflogBuffer.toString();

    return GitRefStash.getStashReflogEntry(reflogString, parsed)
  }
}

export { GitStashManager, STAGE, WORKDIR, _readCommit, _writeCommit, _writeTree, acquireLock, applyTreeChanges, posixifyPathBuffer, writeTreeChanges };
