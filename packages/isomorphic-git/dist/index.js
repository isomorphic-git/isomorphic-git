import '@isomorphic-git/types';
import { WORKDIR, STAGE, posixifyPathBuffer, _readCommit, _writeTree, GitStashManager, writeTreeChanges, applyTreeChanges, acquireLock, _writeCommit } from './internal/GitStashManager.js';
import { MissingParameterError, TREE, GitIndexManager, _walk, IndexResetError, GitConfigManager, GitIgnoreManager, NotFoundError, _writeObject, MultipleGitError, GitRefManager, NoCommitError, normalizeAuthorObject, MissingNameError, flatFileListToDirectoryStructure, GitCommit, GitTree, InvalidFilepathError, resolveTree, _readObject, ObjectTypeError, AlreadyExistsError, InvalidRefNameError, GitAnnotatedTag, CommitNotFetchedError, CheckoutConflictError, InternalError, flat, readPackIndex, forAwait, GitRemoteManager, RemoteCapabilityError, GitShallowManager, collect, GitPackIndex, request, AmbiguousError, MergeNotSupportedError, FastForwardError, MergeConflictError, _getConfig, GitObject, shasum, MaxDepthError, GitPktLine, GitRemoteHTTP, UserCanceledError, PushRejectedError, GitPushError, compareStats } from './internal/GitShallowManager.js';
export { index as Errors } from './internal/GitShallowManager.js';
import { FileSystem } from './internal/FileSystem.js';
import { join, dirname } from './internal/join.js';
import { modified, normalizeCommitterObject, FIFO, pkg, writeUploadPackRequest, parseUploadPackResponse, mergeTree, _pack, listObjects, listCommitsAndTags, writeReceivePackRequest, GitSideBand, parseReceivePackResponse } from './internal/writeReceivePackRequest.js';
import cleanGitRef from 'clean-git-ref';
import 'async-lock';
import 'crc-32';
import 'pako';
import 'ignore';
import 'sha.js/sha1.js';
import 'pify';
import 'path-browserify';
import 'diff3';

// @ts-check

// @ts-check

// @ts-check

function assertParameter(name, value) {
  if (value === undefined) {
    throw new MissingParameterError(name)
  }
}

// @ts-check

/**
 * Abort a merge in progress.
 *
 * Based on the behavior of git reset --merge, i.e.  "Resets the index and updates the files in the working tree that are different between <commit> and HEAD, but keeps those which are different between the index and working tree (i.e. which have changes which have not been added). If a file that is different between <commit> and the index has unstaged changes, reset is aborted."
 *
 * Essentially, abortMerge will reset any files affected by merge conflicts to their last known good version at HEAD.
 * Any unstaged changes are saved and any staged changes are reset as well.
 *
 * NOTE: The behavior of this command differs slightly from canonical git in that an error will be thrown if a file exists in the index and nowhere else.
 * Canonical git will reset the file and continue aborting the merge in this case.
 *
 * **WARNING:** Running git merge with non-trivial uncommitted changes is discouraged: while possible, it may leave you in a state that is hard to back out of in the case of a conflict.
 * If there were uncommitted changes when the merge started (and especially if those changes were further modified after the merge was started), `git.abortMerge` will in some cases be unable to reconstruct the original (pre-merge) changes.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.commit='HEAD'] - commit to reset the index and worktree to, defaults to HEAD
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 */
async function abortMerge({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  commit = 'HEAD',
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('dir', dir);
    assertParameter('gitdir', gitdir);

    const fs = new FileSystem(_fs);
    const trees = [TREE({ ref: commit }), WORKDIR(), STAGE()];
    let unmergedPaths = [];

    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      unmergedPaths = index.unmergedPaths;
    });

    const results = await _walk({
      fs,
      cache,
      dir,
      gitdir,
      trees,
      map: async function(path, [head, workdir, index]) {
        const staged = !(await modified(workdir, index));
        const unmerged = unmergedPaths.includes(path);
        const unmodified = !(await modified(index, head));

        if (staged || unmerged) {
          return head
            ? {
                path,
                mode: await head.mode(),
                oid: await head.oid(),
                type: await head.type(),
                content: await head.content(),
              }
            : undefined
        }

        if (unmodified) return false
        else throw new IndexResetError(path)
      },
    });

    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      // Reset paths in index and worktree, this can't be done in _walk because the
      // STAGE walker acquires its own index lock.

      for (const entry of results) {
        if (entry === false) continue

        // entry is not false, so from here we can assume index = workdir
        if (!entry) {
          await fs.rmdir(`${dir}/${entry.path}`, { recursive: true });
          index.delete({ filepath: entry.path });
          continue
        }

        if (entry.type === 'blob') {
          const content = new TextDecoder().decode(entry.content);
          await fs.write(`${dir}/${entry.path}`, content, { mode: entry.mode });
          index.insert(// @ts-expect-error There are wrong types
            {
              filepath: entry.path,     oid: entry.oid,            stage: 0,
            });
        }
      }
    });
  } catch (err) {
    err.caller = 'git.abortMerge';
    throw err
  }
}

// @ts-check

/**
 * Add a file to the git index (aka staging area)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string|string[]} args.filepath - The path to the file to add to the index
 * @param {object} [args.cache] - a [cache](cache.md) object
 * @param {boolean} [args.force=false] - add to index even if matches gitignore. Think `git add --force`
 * @param {boolean} [args.parallel=false] - process each input file in parallel. Parallel processing will result in more memory consumption but less process time
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await fs.promises.writeFile('/tutorial/README.md', `# TEST`)
 * await git.add({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log('done')
 *
 */
async function add({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  cache = {},
  force = false,
  parallel = true,
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('dir', dir);
    assertParameter('gitdir', gitdir);
    assertParameter('filepath', filepath);

    const fs = new FileSystem(_fs);
    await GitIndexManager.acquire({ fs, gitdir, cache }, async index => {
      const config = await GitConfigManager.get({ fs, gitdir });
      const autocrlf = await config.get('core.autocrlf');
      return addToIndex({
        dir,
        gitdir,
        fs,
        filepath,
        index,
        force,
        parallel,
        autocrlf,
      })
    });
  } catch (err) {
    err.caller = 'git.add';
    throw err
  }
}

async function addToIndex({
  dir,
  gitdir,
  fs,
  filepath,
  index,
  force,
  parallel,
  autocrlf,
}) {
  // TODO: Should ignore UNLESS it's already in the index.
  filepath = Array.isArray(filepath) ? filepath : [filepath];
  const promises = filepath.map(async currentFilepath => {
    if (!force) {
      const ignored = await GitIgnoreManager.isIgnored({
        fs,
        dir,
        gitdir,
        filepath: currentFilepath,
      });
      if (ignored) return
    }
    const stats = await fs.lstat(join(dir, currentFilepath));
    if (!stats) throw new NotFoundError(currentFilepath)

    if (stats.isDirectory()) {
      const children = await fs.readdir(join(dir, currentFilepath));
      if (parallel) {
        const promises = children.map(child =>
          addToIndex({
            dir,
            gitdir,
            fs,
            filepath: [join(currentFilepath, child)],
            index,
            force,
            parallel,
            autocrlf,
          })
        );
        await Promise.all(promises);
      } else {
        for (const child of children) {
          await addToIndex({
            dir,
            gitdir,
            fs,
            filepath: [join(currentFilepath, child)],
            index,
            force,
            parallel,
            autocrlf,
          });
        }
      }
    } else {
      const object = stats.isSymbolicLink()
        ? await fs.readlink(join(dir, currentFilepath)).then(posixifyPathBuffer)
        : await fs.read(join(dir, currentFilepath), { autocrlf });
      if (object === null) throw new NotFoundError(currentFilepath)
      const oid = await _writeObject({ fs, gitdir, type: 'blob', object });
      index.insert({ filepath: currentFilepath, stats, oid });
    }
  });

  const settledPromises = await Promise.allSettled(promises);
  const rejectedPromises = settledPromises
    .filter(settle => settle.status === 'rejected')
    .map(settle => settle.reason);
  if (rejectedPromises.length > 1) {
    throw new MultipleGitError(rejectedPromises)
  }
  if (rejectedPromises.length === 1) {
    throw rejectedPromises[0]
  }

  const fulfilledPromises = settledPromises
    .filter(settle => settle.status === 'fulfilled' && settle.value)
    .map(settle => settle.value);

  return fulfilledPromises
}

// @ts-check

/**
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} args.gitdir
 * @param {string} [args.message]
 * @param {Object} [args.author]
 * @param {string} [args.author.name]
 * @param {string} [args.author.email]
 * @param {number} [args.author.timestamp]
 * @param {number} [args.author.timezoneOffset]
 * @param {Object} [args.committer]
 * @param {string} [args.committer.name]
 * @param {string} [args.committer.email]
 * @param {number} [args.committer.timestamp]
 * @param {number} [args.committer.timezoneOffset]
 * @param {string} [args.signingKey]
 * @param {boolean} [args.amend = false]
 * @param {boolean} [args.dryRun = false]
 * @param {boolean} [args.noUpdateBranch = false]
 * @param {string} [args.ref]
 * @param {string[]} [args.parent]
 * @param {string} [args.tree]
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit.
 */
async function _commit({
  fs,
  cache,
  onSign,
  gitdir,
  message,
  author: _author,
  committer: _committer,
  signingKey,
  amend = false,
  dryRun = false,
  noUpdateBranch = false,
  ref,
  parent,
  tree,
}) {
  // Determine ref and the commit pointed to by ref, and if it is the initial commit
  let initialCommit = false;
  if (!ref) {
    ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2,
    });
  }

  let refOid, refCommit;
  try {
    refOid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref,
    });
    refCommit = await _readCommit({ fs, gitdir, oid: refOid, cache: {} });
  } catch {
    // We assume that there's no commit and this is the initial commit
    initialCommit = true;
  }

  if (amend && initialCommit) {
    throw new NoCommitError(ref)
  }

  // Determine author and committer information
  const author = !amend
    ? await normalizeAuthorObject({ fs, gitdir, author: _author })
    : await normalizeAuthorObject({
        fs,
        gitdir,
        author: _author,
        commit: refCommit.commit,
      });
  if (!author) throw new MissingNameError('author')

  const committer = !amend
    ? await normalizeCommitterObject({
        fs,
        gitdir,
        author,
        committer: _committer,
      })
    : await normalizeCommitterObject({
        fs,
        gitdir,
        author,
        committer: _committer,
        commit: refCommit.commit,
      });
  if (!committer) throw new MissingNameError('committer')

  return GitIndexManager.acquire(
    { fs, gitdir, cache, allowUnmerged: false },
    async function(index) {
      const inodes = flatFileListToDirectoryStructure(index.entries);
      const inode = inodes.get('.');
      if (!tree) {
        tree = await constructTree({ fs, gitdir, inode, dryRun });
      }

      // Determine parents of this commit
      if (!parent) {
        if (!amend) {
          parent = refOid ? [refOid] : [];
        } else {
          parent = refCommit.commit.parent;
        }
      } else {
        // ensure that the parents are oids, not refs
        parent = await Promise.all(
          parent.map(p => {
            return GitRefManager.resolve({ fs, gitdir, ref: p })
          })
        );
      }

      // Determine message of this commit
      if (!message) {
        if (!amend) {
          throw new MissingParameterError('message')
        } else {
          message = refCommit.commit.message;
        }
      }

      // Create and write new Commit object
      let comm = GitCommit.from({
        tree,
        parent,
        author,
        committer,
        message,
      });
      if (signingKey) {
        comm = await GitCommit.sign(comm, onSign, signingKey);
      }
      const oid = await _writeObject({
        fs,
        gitdir,
        type: 'commit',
        object: comm.toObject(),
        dryRun,
      });
      if (!noUpdateBranch && !dryRun) {
        // Update branch pointer
        await GitRefManager.writeRef({
          fs,
          gitdir,
          ref,
          value: oid,
        });
      }
      return oid
    }
  )
}

async function constructTree({ fs, gitdir, inode, dryRun }) {
  // use depth first traversal
  const children = inode.children;
  for (const inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000';
      inode.metadata.oid = await constructTree({ fs, gitdir, inode, dryRun });
    }
  }
  const entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type,
  }));
  const tree = GitTree.from(entries);
  const oid = await _writeObject({
    fs,
    gitdir,
    type: 'tree',
    object: tree.toObject(),
    dryRun,
  });
  return oid
}

// @ts-check

async function resolveFilepath({ fs, cache, gitdir, oid, filepath }) {
  // Ensure there are no leading or trailing directory separators.
  // I was going to do this automatically, but then found that the Git Terminal for Windows
  // auto-expands --filepath=/src/utils to --filepath=C:/Users/Will/AppData/Local/Programs/Git/src/utils
  // so I figured it would be wise to promote the behavior in the application layer not just the library layer.
  if (filepath.startsWith('/')) {
    throw new InvalidFilepathError('leading-slash')
  } else if (filepath.endsWith('/')) {
    throw new InvalidFilepathError('trailing-slash')
  }
  const _oid = oid;
  const result = await resolveTree({ fs, cache, gitdir, oid });
  const tree = result.tree;
  if (filepath === '') {
    oid = result.oid;
  } else {
    const pathArray = filepath.split('/');
    oid = await _resolveFilepath({
      fs,
      cache,
      gitdir,
      tree,
      pathArray,
      oid: _oid,
      filepath,
    });
  }
  return oid
}

async function _resolveFilepath({
  fs,
  cache,
  gitdir,
  tree,
  pathArray,
  oid,
  filepath,
}) {
  const name = pathArray.shift();
  for (const entry of tree) {
    if (entry.path === name) {
      if (pathArray.length === 0) {
        return entry.oid
      } else {
        const { type, object } = await _readObject({
          fs,
          cache,
          gitdir,
          oid: entry.oid,
        });
        if (type !== 'tree') {
          throw new ObjectTypeError(oid, type, 'tree', filepath)
        }
        tree = GitTree.from(object);
        return _resolveFilepath({
          fs,
          cache,
          gitdir,
          tree,
          pathArray,
          oid,
          filepath,
        })
      }
    }
  }
  throw new NotFoundError(`file or directory found at "${oid}:${filepath}"`)
}

// @ts-check

/**
 *
 * @typedef {Object} ReadTreeResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tree
 * @property {TreeObject} tree - the parsed tree object
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} [args.filepath]
 *
 * @returns {Promise<ReadTreeResult>}
 */
async function _readTree({
  fs,
  cache,
  gitdir,
  oid,
  filepath = undefined,
}) {
  if (filepath !== undefined) {
    oid = await resolveFilepath({ fs, cache, gitdir, oid, filepath });
  }
  const { tree, oid: treeOid } = await resolveTree({ fs, cache, gitdir, oid });
  const result = {
    oid: treeOid,
    tree: tree.entries(),
  };
  return result
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} args.oid
 * @param {string|Uint8Array} args.note
 * @param {boolean} [args.force]
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey]
 *
 * @returns {Promise<string>}
 */

async function _addNote({
  fs,
  cache,
  onSign,
  gitdir,
  ref,
  oid,
  note,
  force,
  author,
  committer,
  signingKey,
}) {
  // Get the current note commit
  let parent;
  try {
    parent = await GitRefManager.resolve({ gitdir, fs, ref });
  } catch (err) {
    if (!(err instanceof NotFoundError)) {
      throw err
    }
  }

  // I'm using the "empty tree" magic number here for brevity
  const result = await _readTree({
    fs,
    cache,
    gitdir,
    oid: parent || '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  });
  let tree = result.tree;

  // Handle the case where a note already exists
  if (force) {
    tree = tree.filter(entry => entry.path !== oid);
  } else {
    for (const entry of tree) {
      if (entry.path === oid) {
        throw new AlreadyExistsError('note', oid)
      }
    }
  }

  // Create the note blob
  if (typeof note === 'string') {
    note = Buffer.from(note, 'utf8');
  }
  const noteOid = await _writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: note,
    format: 'content',
  });

  // Create the new note tree
  tree.push({ mode: '100644', path: oid, oid: noteOid, type: 'blob' });
  const treeOid = await _writeTree({
    fs,
    gitdir,
    tree,
  });

  // Create the new note commit
  const commitOid = await _commit({
    fs,
    cache,
    onSign,
    gitdir,
    ref,
    tree: treeOid,
    parent: parent && [parent],
    message: `Note added by 'isomorphic-git addNote'\n`,
    author,
    committer,
    signingKey,
  });

  return commitOid
}

// @ts-check

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

async function addNote({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  oid,
  note,
  force,
  author: _author,
  committer: _committer,
  signingKey,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);
    assertParameter('note', note);
    if (signingKey) {
      assertParameter('onSign', onSign);
    }
    const fs = new FileSystem(_fs);

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author });
    if (!author) throw new MissingNameError('author')

    const committer = await normalizeCommitterObject({
      fs,
      gitdir,
      author,
      committer: _committer,
    });
    if (!committer) throw new MissingNameError('committer')

    return await _addNote({
      fs: new FileSystem(fs),
      cache,
      onSign,
      gitdir,
      ref,
      oid,
      note,
      force,
      author,
      committer,
      signingKey,
    })
  } catch (err) {
    err.caller = 'git.addNote';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.remote
 * @param {string} args.url
 * @param {boolean} args.force
 *
 * @returns {Promise<void>}
 *
 */
async function _addRemote({ fs, gitdir, remote, url, force }) {
  if (remote !== cleanGitRef.clean(remote)) {
    throw new InvalidRefNameError(remote, cleanGitRef.clean(remote))
  }
  const config = await GitConfigManager.get({ fs, gitdir });
  if (!force) {
    // Check that setting it wouldn't overwrite.
    const remoteNames = await config.getSubsections('remote');
    if (remoteNames.includes(remote)) {
      // Throw an error if it would overwrite an existing remote,
      // but not if it's simply setting the same value again.
      if (url !== (await config.get(`remote.${remote}.url`))) {
        throw new AlreadyExistsError('remote', remote)
      }
    }
  }
  await config.set(`remote.${remote}.url`, url);
  await config.set(
    `remote.${remote}.fetch`,
    `+refs/heads/*:refs/remotes/${remote}/*`
  );
  await GitConfigManager.save({ fs, gitdir, config });
}

// @ts-check

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
async function addRemote({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  remote,
  url,
  force = false,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('remote', remote);
    assertParameter('url', url);
    return await _addRemote({
      fs: new FileSystem(fs),
      gitdir,
      remote,
      url,
      force,
    })
  } catch (err) {
    err.caller = 'git.addRemote';
    throw err
  }
}

// @ts-check

/**
 * Create an annotated tag.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} [args.message = ref]
 * @param {string} [args.object = 'HEAD']
 * @param {object} [args.tagger]
 * @param {string} args.tagger.name
 * @param {string} args.tagger.email
 * @param {number} args.tagger.timestamp
 * @param {number} args.tagger.timezoneOffset
 * @param {string} [args.gpgsig]
 * @param {string} [args.signingKey]
 * @param {boolean} [args.force = false]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.annotatedTag({
 *   dir: '$input((/))',
 *   ref: '$input((test-tag))',
 *   message: '$input((This commit is awesome))',
 *   tagger: {
 *     name: '$input((Mr. Test))',
 *     email: '$input((mrtest@example.com))'
 *   }
 * })
 * console.log('done')
 *
 */
async function _annotatedTag({
  fs,
  cache,
  onSign,
  gitdir,
  ref,
  tagger,
  message = ref,
  gpgsig,
  object,
  signingKey,
  force = false,
}) {
  ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`;

  if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
    throw new AlreadyExistsError('tag', ref)
  }

  // Resolve passed value
  const oid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: object || 'HEAD',
  });

  const { type } = await _readObject({ fs, cache, gitdir, oid });
  let tagObject = GitAnnotatedTag.from({
    object: oid,
    type,
    tag: ref.replace('refs/tags/', ''),
    tagger,
    message,
    gpgsig,
  });
  if (signingKey) {
    tagObject = await GitAnnotatedTag.sign(tagObject, onSign, signingKey);
  }
  const value = await _writeObject({
    fs,
    gitdir,
    type: 'tag',
    object: tagObject.toObject(),
  });

  await GitRefManager.writeRef({ fs, gitdir, ref, value });
}

// @ts-check

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
 * @param {string} [args.gpgsig] - The gpgsig attached to the tag object. (Mutually exclusive with the `signingKey` option.)
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
async function annotatedTag({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  tagger: _tagger,
  message = ref,
  gpgsig,
  object,
  signingKey,
  force = false,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);
    if (signingKey) {
      assertParameter('onSign', onSign);
    }
    const fs = new FileSystem(_fs);

    // Fill in missing arguments with default values
    const tagger = await normalizeAuthorObject({ fs, gitdir, author: _tagger });
    if (!tagger) throw new MissingNameError('tagger')

    return await _annotatedTag({
      fs,
      cache,
      onSign,
      gitdir,
      ref,
      tagger,
      message,
      gpgsig,
      object,
      signingKey,
      force,
    })
  } catch (err) {
    err.caller = 'git.annotatedTag';
    throw err
  }
}

// @ts-check

/**
 * Create a branch
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} [args.object = 'HEAD']
 * @param {boolean} [args.checkout = false]
 * @param {boolean} [args.force = false]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.branch({ dir: '$input((/))', ref: '$input((develop))' })
 * console.log('done')
 *
 */
async function _branch({
  fs,
  gitdir,
  ref,
  object,
  checkout = false,
  force = false,
}) {
  if (ref !== cleanGitRef.clean(ref)) {
    throw new InvalidRefNameError(ref, cleanGitRef.clean(ref))
  }

  const fullref = `refs/heads/${ref}`;

  if (!force) {
    const exist = await GitRefManager.exists({ fs, gitdir, ref: fullref });
    if (exist) {
      throw new AlreadyExistsError('branch', ref, false)
    }
  }

  // Get current HEAD tree oid
  let oid;
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: object || 'HEAD' });
  } catch (e) {
    // Probably an empty repo
  }

  // Create a new ref that points at the current commit
  if (oid) {
    await GitRefManager.writeRef({ fs, gitdir, ref: fullref, value: oid });
  }

  if (checkout) {
    // Update HEAD
    await GitRefManager.writeSymbolicRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: fullref,
    });
  }
}

// @ts-check

/**
 * Create a branch
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the branch
 * @param {string} [args.object = 'HEAD'] - What oid to use as the start point. Accepts a symbolic ref.
 * @param {boolean} [args.checkout = false] - Update `HEAD` to point at the newly created branch
 * @param {boolean} [args.force = false] - Instead of throwing an error if a branched named `ref` already exists, overwrite the existing branch.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.branch({ fs, dir: '/tutorial', ref: 'develop' })
 * console.log('done')
 *
 */
async function branch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  object,
  checkout = false,
  force = false,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);
    return await _branch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
      object,
      checkout,
      force,
    })
  } catch (err) {
    err.caller = 'git.branch';
    throw err
  }
}

const worthWalking = (filepath, root) => {
  if (filepath === '.' || root == null || root.length === 0 || root === '.') {
    return true
  }
  if (root.length >= filepath.length) {
    return root.startsWith(filepath)
  } else {
    return filepath.startsWith(root)
  }
};

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {ProgressCallback} [args.onProgress]
 * @param {PostCheckoutCallback} [args.onPostCheckout]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string[]} [args.filepaths]
 * @param {string} args.remote
 * @param {boolean} args.noCheckout
 * @param {boolean} [args.noUpdateHead]
 * @param {boolean} [args.dryRun]
 * @param {boolean} [args.force]
 * @param {boolean} [args.track]
 * @param {boolean} [args.nonBlocking]
 * @param {number} [args.batchSize]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 */
async function _checkout({
  fs,
  cache,
  onProgress,
  onPostCheckout,
  dir,
  gitdir,
  remote,
  ref,
  filepaths,
  noCheckout,
  noUpdateHead,
  dryRun,
  force,
  track = true,
  nonBlocking = false,
  batchSize = 100,
}) {
  // oldOid is defined only if onPostCheckout hook is attached
  let oldOid;
  if (onPostCheckout) {
    try {
      oldOid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' });
    } catch (err) {
      oldOid = '0000000000000000000000000000000000000000';
    }
  }

  // Get tree oid
  let oid;
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref });
    // TODO: Figure out what to do if both 'ref' and 'remote' are specified, ref already exists,
    // and is configured to track a different remote.
  } catch (err) {
    if (ref === 'HEAD') throw err
    // If `ref` doesn't exist, create a new remote tracking branch
    // Figure out the commit to checkout
    const remoteRef = `${remote}/${ref}`;
    oid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: remoteRef,
    });
    if (track) {
      // Set up remote tracking branch
      const config = await GitConfigManager.get({ fs, gitdir });
      await config.set(`branch.${ref}.remote`, remote);
      await config.set(`branch.${ref}.merge`, `refs/heads/${ref}`);
      await GitConfigManager.save({ fs, gitdir, config });
    }
    // Create a new branch that points at that same commit
    await GitRefManager.writeRef({
      fs,
      gitdir,
      ref: `refs/heads/${ref}`,
      value: oid,
    });
  }

  // Update working dir
  if (!noCheckout) {
    let ops;
    // First pass - just analyze files (not directories) and figure out what needs to be done
    try {
      ops = await analyze({
        fs,
        cache,
        onProgress,
        dir,
        gitdir,
        ref,
        force,
        filepaths,
      });
    } catch (err) {
      // Throw a more helpful error message for this common mistake.
      if (err instanceof NotFoundError && err.data.what === oid) {
        throw new CommitNotFetchedError(ref, oid)
      } else {
        throw err
      }
    }

    // Report conflicts
    const conflicts = ops
      .filter(([method]) => method === 'conflict')
      .map(([method, fullpath]) => fullpath);
    if (conflicts.length > 0) {
      throw new CheckoutConflictError(conflicts)
    }

    // Collect errors
    const errors = ops
      .filter(([method]) => method === 'error')
      .map(([method, fullpath]) => fullpath);
    if (errors.length > 0) {
      throw new InternalError(errors.join(', '))
    }

    if (dryRun) {
      // Since the format of 'ops' is in flux, I really would rather folk besides myself not start relying on it
      // return ops

      if (onPostCheckout) {
        await onPostCheckout({
          previousHead: oldOid,
          newHead: oid,
          type: filepaths != null && filepaths.length > 0 ? 'file' : 'branch',
        });
      }
      return
    }

    // Second pass - execute planned changes
    // The cheapest semi-parallel solution without computing a full dependency graph will be
    // to just do ops in 4 dumb phases: delete files, delete dirs, create dirs, write files

    let count = 0;
    const total = ops.length;
    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      await Promise.all(
        ops
          .filter(
            ([method]) => method === 'delete' || method === 'delete-index'
          )
          .map(async function([method, fullpath]) {
            const filepath = `${dir}/${fullpath}`;
            if (method === 'delete') {
              await fs.rm(filepath);
            }
            index.delete({ filepath: fullpath });
            if (onProgress) {
              await onProgress({
                phase: 'Updating workdir',
                loaded: ++count,
                total,
              });
            }
          })
      );
    });

    // Note: this is cannot be done naively in parallel
    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      for (const [method, fullpath] of ops) {
        if (method === 'rmdir' || method === 'rmdir-index') {
          const filepath = `${dir}/${fullpath}`;
          try {
            if (method === 'rmdir') {
              await fs.rmdir(filepath);
            }
            index.delete({ filepath: fullpath });
            if (onProgress) {
              await onProgress({
                phase: 'Updating workdir',
                loaded: ++count,
                total,
              });
            }
          } catch (e) {
            if (e.code === 'ENOTEMPTY') {
              console.log(
                `Did not delete ${fullpath} because directory is not empty`
              );
            } else {
              throw e
            }
          }
        }
      }
    });

    await Promise.all(
      ops
        .filter(([method]) => method === 'mkdir' || method === 'mkdir-index')
        .map(async function([_, fullpath]) {
          const filepath = `${dir}/${fullpath}`;
          await fs.mkdir(filepath);
          if (onProgress) {
            await onProgress({
              phase: 'Updating workdir',
              loaded: ++count,
              total,
            });
          }
        })
    );

    if (nonBlocking) {
      // Filter eligible operations first
      const eligibleOps = ops.filter(
        ([method]) =>
          method === 'create' ||
          method === 'create-index' ||
          method === 'update' ||
          method === 'mkdir-index'
      );

      const updateWorkingDirResults = await batchAllSettled(
        'Update Working Dir',
        eligibleOps.map(([method, fullpath, oid, mode, chmod]) => () =>
          updateWorkingDir({ fs, cache, gitdir, dir }, [
            method,
            fullpath,
            oid,
            mode,
            chmod,
          ])
        ),
        onProgress,
        batchSize
      );

      await GitIndexManager.acquire(
        { fs, gitdir, cache, allowUnmerged: true },
        async function(index) {
          await batchAllSettled(
            'Update Index',
            updateWorkingDirResults.map(([fullpath, oid, stats]) => () =>
              updateIndex$1({ index, fullpath, oid, stats })
            ),
            onProgress,
            batchSize
          );
        }
      );
    } else {
      await GitIndexManager.acquire(
        { fs, gitdir, cache, allowUnmerged: true },
        async function(index) {
          await Promise.all(
            ops
              .filter(
                ([method]) =>
                  method === 'create' ||
                  method === 'create-index' ||
                  method === 'update' ||
                  method === 'mkdir-index'
              )
              .map(async function([method, fullpath, oid, mode, chmod]) {
                const filepath = `${dir}/${fullpath}`;
                try {
                  if (method !== 'create-index' && method !== 'mkdir-index') {
                    const { object } = await _readObject({
                      fs,
                      cache,
                      gitdir,
                      oid,
                    });
                    if (chmod) {
                      // Note: the mode option of fs.write only works when creating files,
                      // not updating them. Since the `fs` plugin doesn't expose `chmod` this
                      // is our only option.
                      await fs.rm(filepath);
                    }
                    if (mode === 0o100644) {
                      // regular file
                      await fs.write(filepath, object);
                    } else if (mode === 0o100755) {
                      // executable file
                      await fs.write(filepath, object, { mode: 0o777 });
                    } else if (mode === 0o120000) {
                      // symlink
                      await fs.writelink(filepath, object);
                    } else {
                      throw new InternalError(
                        `Invalid mode 0o${mode.toString(
                          8
                        )} detected in blob ${oid}`
                      )
                    }
                  }

                  const stats = await fs.lstat(filepath);
                  // We can't trust the executable bit returned by lstat on Windows,
                  // so we need to preserve this value from the TREE.
                  // TODO: Figure out how git handles this internally.
                  if (mode === 0o100755) {
                    stats.mode = 0o755;
                  }
                  // Submodules are present in the git index but use a unique mode different from trees
                  if (method === 'mkdir-index') {
                    stats.mode = 0o160000;
                  }
                  index.insert({
                    filepath: fullpath,
                    stats,
                    oid,
                  });
                  if (onProgress) {
                    await onProgress({
                      phase: 'Updating workdir',
                      loaded: ++count,
                      total,
                    });
                  }
                } catch (e) {
                  console.log(e);
                }
              })
          );
        }
      );
    }

    if (onPostCheckout) {
      await onPostCheckout({
        previousHead: oldOid,
        newHead: oid,
        type: filepaths != null && filepaths.length > 0 ? 'file' : 'branch',
      });
    }
  }

  // Update HEAD
  if (!noUpdateHead) {
    const fullRef = await GitRefManager.expand({ fs, gitdir, ref });
    if (fullRef.startsWith('refs/heads')) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir,
        ref: 'HEAD',
        value: fullRef,
      });
    } else {
      // detached head
      await GitRefManager.writeRef({ fs, gitdir, ref: 'HEAD', value: oid });
    }
  }
}

async function analyze({
  fs,
  cache,
  onProgress,
  dir,
  gitdir,
  ref,
  force,
  filepaths,
}) {
  let count = 0;
  return _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref }), WORKDIR(), STAGE()],
    map: async function(fullpath, [commit, workdir, stage]) {
      if (fullpath === '.') return
      // match against base paths
      if (filepaths && !filepaths.some(base => worthWalking(fullpath, base))) {
        return null
      }
      // Emit progress event
      if (onProgress) {
        await onProgress({ phase: 'Analyzing workdir', loaded: ++count });
      }

      // This is a kind of silly pattern but it worked so well for me in the past
      // and it makes intuitively demonstrating exhaustiveness so *easy*.
      // This checks for the presence and/or absence of each of the 3 entries,
      // converts that to a 3-bit binary representation, and then handles
      // every possible combination (2^3 or 8 cases) with a lookup table.
      const key = [!!stage, !!commit, !!workdir].map(Number).join('');
      switch (key) {
        // Impossible case.
        case '000':
          return
        // Ignore workdir files that are not tracked and not part of the new commit.
        case '001':
          // OK, make an exception for explicitly named files.
          if (force && filepaths && filepaths.includes(fullpath)) {
            return ['delete', fullpath]
          }
          return
        // New entries
        case '010': {
          switch (await commit.type()) {
            case 'tree': {
              return ['mkdir', fullpath]
            }
            case 'blob': {
              return [
                'create',
                fullpath,
                await commit.oid(),
                await commit.mode(),
              ]
            }
            case 'commit': {
              return [
                'mkdir-index',
                fullpath,
                await commit.oid(),
                await commit.mode(),
              ]
            }
            default: {
              return [
                'error',
                `new entry Unhandled type ${await commit.type()}`,
              ]
            }
          }
        }
        // New entries but there is already something in the workdir there.
        case '011': {
          switch (`${await commit.type()}-${await workdir.type()}`) {
            case 'tree-tree': {
              return // noop
            }
            case 'tree-blob':
            case 'blob-tree': {
              return ['conflict', fullpath]
            }
            case 'blob-blob': {
              // Is the incoming file different?
              if ((await commit.oid()) !== (await workdir.oid())) {
                if (force) {
                  return [
                    'update',
                    fullpath,
                    await commit.oid(),
                    await commit.mode(),
                    (await commit.mode()) !== (await workdir.mode()),
                  ]
                } else {
                  return ['conflict', fullpath]
                }
              } else {
                // Is the incoming file a different mode?
                if ((await commit.mode()) !== (await workdir.mode())) {
                  if (force) {
                    return [
                      'update',
                      fullpath,
                      await commit.oid(),
                      await commit.mode(),
                      true,
                    ]
                  } else {
                    return ['conflict', fullpath]
                  }
                } else {
                  return [
                    'create-index',
                    fullpath,
                    await commit.oid(),
                    await commit.mode(),
                  ]
                }
              }
            }
            case 'commit-tree': {
              // TODO: submodule
              // We'll ignore submodule directories for now.
              // Users prefer we not throw an error for lack of submodule support.
              // gitlinks
              return
            }
            case 'commit-blob': {
              // TODO: submodule
              // But... we'll complain if there is a *file* where we would
              // put a submodule if we had submodule support.
              return ['conflict', fullpath]
            }
            default: {
              return ['error', `new entry Unhandled type ${commit.type}`]
            }
          }
        }
        // Something in stage but not in the commit OR the workdir.
        // Note: I verified this behavior against canonical git.
        case '100': {
          return ['delete-index', fullpath]
        }
        // Deleted entries
        // TODO: How to handle if stage type and workdir type mismatch?
        case '101': {
          switch (await stage.type()) {
            case 'tree': {
              return ['rmdir-index', fullpath]
            }
            case 'blob': {
              // Git checks that the workdir.oid === stage.oid before deleting file
              if ((await stage.oid()) !== (await workdir.oid())) {
                if (force) {
                  return ['delete', fullpath]
                } else {
                  return ['conflict', fullpath]
                }
              } else {
                return ['delete', fullpath]
              }
            }
            case 'commit': {
              return ['rmdir-index', fullpath]
            }
            default: {
              return [
                'error',
                `delete entry Unhandled type ${await stage.type()}`,
              ]
            }
          }
        }
        /* eslint-disable no-fallthrough */
        // File missing from workdir
        case '110':
        // Possibly modified entries
        case '111': {
          /* eslint-enable no-fallthrough */
          switch (`${await stage.type()}-${await commit.type()}`) {
            case 'tree-tree': {
              return
            }
            case 'blob-blob': {
              // If the file hasn't changed, there is no need to do anything.
              // Existing file modifications in the workdir can be be left as is.
              if (
                (await stage.oid()) === (await commit.oid()) &&
                (await stage.mode()) === (await commit.mode()) &&
                !force
              ) {
                return
              }

              // Check for local changes that would be lost
              if (workdir) {
                // Note: canonical git only compares with the stage. But we're smart enough
                // to compare to the stage AND the incoming commit.
                if (
                  (await workdir.oid()) !== (await stage.oid()) &&
                  (await workdir.oid()) !== (await commit.oid())
                ) {
                  if (force) {
                    return [
                      'update',
                      fullpath,
                      await commit.oid(),
                      await commit.mode(),
                      (await commit.mode()) !== (await workdir.mode()),
                    ]
                  } else {
                    return ['conflict', fullpath]
                  }
                }
              } else if (force) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  (await commit.mode()) !== (await stage.mode()),
                ]
              }
              // Has file mode changed?
              if ((await commit.mode()) !== (await stage.mode())) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  true,
                ]
              }
              // TODO: HANDLE SYMLINKS
              // Has the file content changed?
              if ((await commit.oid()) !== (await stage.oid())) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  false,
                ]
              } else {
                return
              }
            }
            case 'tree-blob': {
              return ['update-dir-to-blob', fullpath, await commit.oid()]
            }
            case 'blob-tree': {
              return ['update-blob-to-tree', fullpath]
            }
            case 'commit-commit': {
              return [
                'mkdir-index',
                fullpath,
                await commit.oid(),
                await commit.mode(),
              ]
            }
            default: {
              return [
                'error',
                `update entry Unhandled type ${await stage.type()}-${await commit.type()}`,
              ]
            }
          }
        }
      }
    },
    // Modify the default flat mapping
    reduce: async function(parent, children) {
      children = flat(children);
      if (!parent) {
        return children
      } else if (parent && parent[0] === 'rmdir') {
        children.push(parent);
        return children
      } else {
        children.unshift(parent);
        return children
      }
    },
  })
}

async function updateIndex$1({ index, fullpath, stats, oid }) {
  try {
    index.insert({
      filepath: fullpath,
      stats,
      oid,
    });
  } catch (e) {
    console.warn(`Error inserting ${fullpath} into index:`, e);
  }
}
async function updateWorkingDir(
  { fs, cache, gitdir, dir },
  [method, fullpath, oid, mode, chmod]
) {
  const filepath = `${dir}/${fullpath}`;
  if (method !== 'create-index' && method !== 'mkdir-index') {
    const { object } = await _readObject({ fs, cache, gitdir, oid });
    if (chmod) {
      await fs.rm(filepath);
    }
    if (mode === 0o100644) {
      // regular file
      await fs.write(filepath, object);
    } else if (mode === 0o100755) {
      // executable file
      await fs.write(filepath, object, { mode: 0o777 });
    } else if (mode === 0o120000) {
      // symlink
      await fs.writelink(filepath, object);
    } else {
      throw new InternalError(
        `Invalid mode 0o${mode.toString(8)} detected in blob ${oid}`
      )
    }
  }
  const stats = await fs.lstat(filepath);
  if (mode === 0o100755) {
    stats.mode = 0o755;
  }
  if (method === 'mkdir-index') {
    stats.mode = 0o160000;
  }
  return [fullpath, oid, stats]
}

async function batchAllSettled(operationName, tasks, onProgress, batchSize) {
  const results = [];
  try {
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize).map(task => task());
      const batchResults = await Promise.allSettled(batch);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') results.push(result.value);
      });
      if (onProgress) {
        await onProgress({
          phase: 'Updating workdir',
          loaded: i + batch.length,
          total: tasks.length,
        });
      }
    }

    return results
  } catch (error) {
    console.error(`Error during ${operationName}: ${error}`);
  }

  return results
}

// @ts-check

/**
 * Checkout a branch
 *
 * If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {PostCheckoutCallback} [args.onPostCheckout] - optional post-checkout hook callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - Source to checkout files from
 * @param {string[]} [args.filepaths] - Limit the checkout to the given files and directories
 * @param {string} [args.remote = 'origin'] - Which remote repository to use
 * @param {boolean} [args.noCheckout = false] - If true, will update HEAD but won't update the working directory
 * @param {boolean} [args.noUpdateHead] - If true, will update the working directory but won't update HEAD. Defaults to `false` when `ref` is provided, and `true` if `ref` is not provided.
 * @param {boolean} [args.dryRun = false] - If true, simulates a checkout so you can test whether it would succeed.
 * @param {boolean} [args.force = false] - If true, conflicts will be ignored and files will be overwritten regardless of local changes.
 * @param {boolean} [args.track = true] - If false, will not set the remote branch tracking information. Defaults to true.
 * @param {object} [args.cache] - a [cache](cache.md) object
 * @param {boolean} [args.nonBlocking = false] - If true, will use non-blocking file system operations to allow for better performance in certain environments (For example, in Browsers)
 * @param {number} [args.batchSize = 100] - If args.nonBlocking is true, batchSize is the number of files to process at a time avoid blocking the executing thread. The default value of 100 is a good starting point.
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
async function checkout({
  fs,
  onProgress,
  onPostCheckout,
  dir,
  gitdir = join(dir, '.git'),
  remote = 'origin',
  ref: _ref,
  filepaths,
  noCheckout = false,
  noUpdateHead = _ref === undefined,
  dryRun = false,
  force = false,
  track = true,
  cache = {},
  nonBlocking = false,
  batchSize = 100,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('dir', dir);
    assertParameter('gitdir', gitdir);

    const ref = _ref || 'HEAD';
    return await _checkout({
      fs: new FileSystem(fs),
      cache,
      onProgress,
      onPostCheckout,
      dir,
      gitdir,
      remote,
      ref,
      filepaths,
      noCheckout,
      noUpdateHead,
      dryRun,
      force,
      track,
      nonBlocking,
      batchSize,
    })
  } catch (err) {
    err.caller = 'git.checkout';
    throw err
  }
}

// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
const abbreviateRx = new RegExp('^refs/(heads/|tags/|remotes/)?(.*)');

function abbreviateRef(ref) {
  const match = abbreviateRx.exec(ref);
  if (match) {
    if (match[1] === 'remotes/' && ref.endsWith('/HEAD')) {
      return match[2].slice(0, -5)
    } else {
      return match[2]
    }
  }
  return ref
}

// @ts-check

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {boolean} [args.fullname = false] - Return the full path (e.g. "refs/heads/main") instead of the abbreviated form.
 * @param {boolean} [args.test = false] - If the current branch doesn't actually exist (such as right after git init) then return `undefined`.
 *
 * @returns {Promise<string|void>} The name of the current branch or undefined if the HEAD is detached.
 *
 */
async function _currentBranch({
  fs,
  gitdir,
  fullname = false,
  test = false,
}) {
  const ref = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'HEAD',
    depth: 2,
  });
  if (test) {
    try {
      await GitRefManager.resolve({ fs, gitdir, ref });
    } catch (_) {
      return
    }
  }
  // Return `undefined` for detached HEAD
  if (!ref.startsWith('refs/')) return
  return fullname ? ref : abbreviateRef(ref)
}

async function hasObjectLoose({ fs, gitdir, oid }) {
  const source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`;
  return fs.exists(`${gitdir}/${source}`)
}

async function hasObjectPacked({
  fs,
  cache,
  gitdir,
  oid,
  getExternalRefDelta,
}) {
  // Check to see if it's in a packfile.
  // Iterate through all the .idx files
  let list = await fs.readdir(join(gitdir, 'objects/pack'));
  list = list.filter(x => x.endsWith('.idx'));
  for (const filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`;
    const p = await readPackIndex({
      fs,
      cache,
      filename: indexFile,
      getExternalRefDelta,
    });
    if (p.error) throw new InternalError(p.error)
    // If the packfile DOES have the oid we're looking for...
    if (p.offsets.has(oid)) {
      return true
    }
  }
  // Failed to find it
  return false
}

async function hasObject({
  fs,
  cache,
  gitdir,
  oid,
  format = 'content',
}) {
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => _readObject({ fs, cache, gitdir, oid });

  // Look for it in the loose object directory.
  let result = await hasObjectLoose({ fs, gitdir, oid });
  // Check to see if it's in a packfile.
  if (!result) {
    result = await hasObjectPacked({
      fs,
      cache,
      gitdir,
      oid,
      getExternalRefDelta,
    });
  }
  // Finally
  return result
}

// TODO: make a function that just returns obCount. then emptyPackfile = () => sizePack(pack) === 0
function emptyPackfile(pack) {
  const pheader = '5041434b';
  const version = '00000002';
  const obCount = '00000000';
  const header = pheader + version + obCount;
  return pack.slice(0, 12).toString('hex') === header
}

function filterCapabilities(server, client) {
  const serverNames = server.map(cap => cap.split('=', 1)[0]);
  return client.filter(cap => {
    const name = cap.split('=', 1)[0];
    return serverNames.includes(name)
  })
}

// Note: progress messages are designed to be written directly to the terminal,
// so they are often sent with just a carriage return to overwrite the last line of output.
// But there are also messages delimited with newlines.
// I also include CRLF just in case.
function findSplit(str) {
  const r = str.indexOf('\r');
  const n = str.indexOf('\n');
  if (r === -1 && n === -1) return -1
  if (r === -1) return n + 1 // \n
  if (n === -1) return r + 1 // \r
  if (n === r + 1) return n + 1 // \r\n
  return Math.min(r, n) + 1 // \r or \n
}

function splitLines(input) {
  const output = new FIFO();
  let tmp = ''
  ;(async () => {
    await forAwait(input, chunk => {
      chunk = chunk.toString('utf8');
      tmp += chunk;
      while (true) {
        const i = findSplit(tmp);
        if (i === -1) break
        output.write(tmp.slice(0, i));
        tmp = tmp.slice(i);
      }
    });
    if (tmp.length > 0) {
      output.write(tmp);
    }
    output.end();
  })();
  return output
}

// @ts-check

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
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {string} args.gitdir
 * @param {string|void} [args.url]
 * @param {string} [args.corsProxy]
 * @param {string} [args.ref]
 * @param {string} [args.remoteRef]
 * @param {string} [args.remote]
 * @param {boolean} [args.singleBranch = false]
 * @param {boolean} [args.tags = false]
 * @param {number} [args.depth]
 * @param {Date} [args.since]
 * @param {string[]} [args.exclude = []]
 * @param {boolean} [args.relative = false]
 * @param {Object<string, string>} [args.headers]
 * @param {boolean} [args.prune]
 * @param {boolean} [args.pruneTags]
 *
 * @returns {Promise<FetchResult>}
 * @see FetchResult
 */
async function _fetch({
  fs,
  cache,
  http = { request },
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  gitdir,
  ref: _ref,
  remoteRef: _remoteRef,
  remote: _remote,
  url: _url,
  corsProxy,
  depth = 0,
  since = new Date(),
  exclude = [],
  relative = false,
  tags = false,
  singleBranch = false,
  headers = {},
  prune = false,
  pruneTags = false,
}) {
  const ref = _ref || (await _currentBranch({ fs, gitdir, test: true }));
  const config = await GitConfigManager.get({ fs, gitdir });
  // Figure out what remote to use.
  const remote =
    _remote || (ref && (await config.get(`branch.${ref}.remote`))) || 'origin';
  // Lookup the URL for the given remote.
  const url = _url || (await config.get(`remote.${remote}.url`));
  if (typeof url === 'undefined') {
    throw new MissingParameterError('remote OR url')
  }
  // Figure out what remote ref to use.
  const remoteRef =
    _remoteRef ||
    (ref && (await config.get(`branch.${ref}.merge`))) ||
    _ref ||
    'HEAD';

  if (corsProxy === undefined) {
    corsProxy = await config.get('http.corsProxy');
  }

  const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url });
  const remoteHTTP = await GitRemoteHTTP.discover({
    http,
    onAuth,
    onAuthSuccess,
    onAuthFailure,
    corsProxy,
    service: 'git-upload-pack',
    url,
    headers,
    protocolVersion: 1,
  });
  const auth = remoteHTTP.auth; // hack to get new credentials from CredentialManager API
  const remoteRefs = remoteHTTP.refs;
  // For the special case of an empty repository with no refs, return null.
  if (remoteRefs.size === 0) {
    return {
      defaultBranch: null,
      fetchHead: null,
      fetchHeadDescription: null,
    }
  }
  // Check that the remote supports the requested features
  if (depth !== null && !remoteHTTP.capabilities.has('shallow')) {
    throw new RemoteCapabilityError('shallow', 'depth')
  }
  if (since !== null && !remoteHTTP.capabilities.has('deepen-since')) {
    throw new RemoteCapabilityError('deepen-since', 'since')
  }
  if (exclude.length > 0 && !remoteHTTP.capabilities.has('deepen-not')) {
    throw new RemoteCapabilityError('deepen-not', 'exclude')
  }
  if (relative === true && !remoteHTTP.capabilities.has('deepen-relative')) {
    throw new RemoteCapabilityError('deepen-relative', 'relative')
  }
  // Figure out the SHA for the requested ref
  const { oid, fullref } = GitRefManager.resolveAgainstMap({
    ref: remoteRef,
    map: remoteRefs,
  });
  // Filter out refs we want to ignore: only keep ref we're cloning, HEAD, branches, and tags (if we're keeping them)
  for (const remoteRef of remoteRefs.keys()) {
    if (
      remoteRef === fullref ||
      remoteRef === 'HEAD' ||
      remoteRef.startsWith('refs/heads/') ||
      (tags && remoteRef.startsWith('refs/tags/'))
    ) {
      continue
    }
    remoteRefs.delete(remoteRef);
  }
  // Assemble the application/x-git-upload-pack-request
  const capabilities = filterCapabilities(
    [...remoteHTTP.capabilities],
    [
      'multi_ack_detailed',
      'no-done',
      'side-band-64k',
      // Note: I removed 'thin-pack' option since our code doesn't "fatten" packfiles,
      // which is necessary for compatibility with git. It was the cause of mysterious
      // 'fatal: pack has [x] unresolved deltas' errors that plagued us for some time.
      // isomorphic-git is perfectly happy with thin packfiles in .git/objects/pack but
      // canonical git it turns out is NOT.
      'ofs-delta',
      `agent=${pkg.agent}`,
    ]
  );
  if (relative) capabilities.push('deepen-relative');
  // Start figuring out which oids from the remote we want to request
  const wants = singleBranch ? [oid] : remoteRefs.values();
  // Come up with a reasonable list of oids to tell the remote we already have
  // (preferably oids that are close ancestors of the branch heads we're fetching)
  const haveRefs = singleBranch
    ? [ref]
    : await GitRefManager.listRefs({
        fs,
        gitdir,
        filepath: `refs`,
      });
  let haves = [];
  for (let ref of haveRefs) {
    try {
      ref = await GitRefManager.expand({ fs, gitdir, ref });
      const oid = await GitRefManager.resolve({ fs, gitdir, ref });
      if (await hasObject({ fs, cache, gitdir, oid })) {
        haves.push(oid);
      }
    } catch (err) {}
  }
  haves = [...new Set(haves)];
  const oids = await GitShallowManager.read({ fs, gitdir });
  const shallows = remoteHTTP.capabilities.has('shallow') ? [...oids] : [];
  const packstream = writeUploadPackRequest({
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude,
  });
  // CodeCommit will hang up if we don't send a Content-Length header
  // so we can't stream the body.
  const packbuffer = Buffer.from(await collect(packstream));
  const raw = await GitRemoteHTTP.connect({
    http,
    onProgress,
    corsProxy,
    service: 'git-upload-pack',
    url,
    auth,
    body: [packbuffer],
    headers,
  });
  const response = await parseUploadPackResponse(raw.body);
  if (raw.headers) {
    response.headers = raw.headers;
  }
  // Apply all the 'shallow' and 'unshallow' commands
  for (const oid of response.shallows) {
    if (!oids.has(oid)) {
      // this is in a try/catch mostly because my old test fixtures are missing objects
      try {
        // server says it's shallow, but do we have the parents?
        const { object } = await _readObject({ fs, cache, gitdir, oid });
        const commit = new GitCommit(object);
        const hasParents = await Promise.all(
          commit
            .headers()
            .parent.map(oid => hasObject({ fs, cache, gitdir, oid }))
        );
        const haveAllParents =
          hasParents.length === 0 || hasParents.every(has => has);
        if (!haveAllParents) {
          oids.add(oid);
        }
      } catch (err) {
        oids.add(oid);
      }
    }
  }
  for (const oid of response.unshallows) {
    oids.delete(oid);
  }
  await GitShallowManager.write({ fs, gitdir, oids });
  // Update local remote refs
  if (singleBranch) {
    const refs = new Map([[fullref, oid]]);
    // But wait, maybe it was a symref, like 'HEAD'!
    // We need to save all the refs in the symref chain (sigh).
    const symrefs = new Map();
    let bail = 10;
    let key = fullref;
    while (bail--) {
      const value = remoteHTTP.symrefs.get(key);
      if (value === undefined) break
      symrefs.set(key, value);
      key = value;
    }
    // final value must not be a symref but a real ref
    const realRef = remoteRefs.get(key);
    // There may be no ref at all if we've fetched a specific commit hash
    if (realRef) {
      refs.set(key, realRef);
    }
    const { pruned } = await GitRefManager.updateRemoteRefs({
      fs,
      gitdir,
      remote,
      refs,
      symrefs,
      tags,
      prune,
    });
    if (prune) {
      response.pruned = pruned;
    }
  } else {
    const { pruned } = await GitRefManager.updateRemoteRefs({
      fs,
      gitdir,
      remote,
      refs: remoteRefs,
      symrefs: remoteHTTP.symrefs,
      tags,
      prune,
      pruneTags,
    });
    if (prune) {
      response.pruned = pruned;
    }
  }
  // We need this value later for the `clone` command.
  response.HEAD = remoteHTTP.symrefs.get('HEAD');
  // AWS CodeCommit doesn't list HEAD as a symref, but we can reverse engineer it
  // Find the SHA of the branch called HEAD
  if (response.HEAD === undefined) {
    const { oid } = GitRefManager.resolveAgainstMap({
      ref: 'HEAD',
      map: remoteRefs,
    });
    // Use the name of the first branch that's not called HEAD that has
    // the same SHA as the branch called HEAD.
    for (const [key, value] of remoteRefs.entries()) {
      if (key !== 'HEAD' && value === oid) {
        response.HEAD = key;
        break
      }
    }
  }
  const noun = fullref.startsWith('refs/tags') ? 'tag' : 'branch';
  response.FETCH_HEAD = {
    oid,
    description: `${noun} '${abbreviateRef(fullref)}' of ${url}`,
  };

  if (onProgress || onMessage) {
    const lines = splitLines(response.progress);
    forAwait(lines, async line => {
      if (onMessage) await onMessage(line);
      if (onProgress) {
        const matches = line.match(/([^:]*).*\((\d+?)\/(\d+?)\)/);
        if (matches) {
          await onProgress({
            phase: matches[1].trim(),
            loaded: parseInt(matches[2], 10),
            total: parseInt(matches[3], 10),
          });
        }
      }
    });
  }
  const packfile = Buffer.from(await collect(response.packfile));
  if (raw.body.error) throw raw.body.error
  const packfileSha = packfile.slice(-20).toString('hex');
  const res = {
    defaultBranch: response.HEAD,
    fetchHead: response.FETCH_HEAD.oid,
    fetchHeadDescription: response.FETCH_HEAD.description,
  };
  if (response.headers) {
    res.headers = response.headers;
  }
  if (prune) {
    res.pruned = response.pruned;
  }
  // This is a quick fix for the empty .git/objects/pack/pack-.pack file error,
  // which due to the way `git-list-pack` works causes the program to hang when it tries to read it.
  // TODO: Longer term, we should actually:
  // a) NOT concatenate the entire packfile into memory (line 78),
  // b) compute the SHA of the stream except for the last 20 bytes, using the same library used in push.js, and
  // c) compare the computed SHA with the last 20 bytes of the stream before saving to disk, and throwing a "packfile got corrupted during download" error if the SHA doesn't match.
  if (packfileSha !== '' && !emptyPackfile(packfile)) {
    res.packfile = `objects/pack/pack-${packfileSha}.pack`;
    const fullpath = join(gitdir, res.packfile);
    await fs.write(fullpath, packfile);
    const getExternalRefDelta = oid => _readObject({ fs, cache, gitdir, oid });
    const idx = await GitPackIndex.fromPack({
      pack: packfile,
      getExternalRefDelta,
      onProgress,
    });
    await fs.write(fullpath.replace(/\.pack$/, '.idx'), await idx.toBuffer());
  }
  return res
}

// @ts-check

/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} [args.dir]
 * @param {string} [args.gitdir]
 * @param {boolean} [args.bare = false]
 * @param {string} [args.defaultBranch = 'master']
 * @returns {Promise<void>}
 */
async function _init({
  fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  defaultBranch = 'master',
}) {
  // Don't overwrite an existing config
  if (await fs.exists(gitdir + '/config')) return

  let folders = [
    'hooks',
    'info',
    'objects/info',
    'objects/pack',
    'refs/heads',
    'refs/tags',
  ];
  folders = folders.map(dir => gitdir + '/' + dir);
  for (const folder of folders) {
    await fs.mkdir(folder);
  }

  await fs.write(
    gitdir + '/config',
    '[core]\n' +
      '\trepositoryformatversion = 0\n' +
      '\tfilemode = false\n' +
      `\tbare = ${bare}\n` +
      (bare ? '' : '\tlogallrefupdates = true\n') +
      '\tsymlinks = false\n' +
      '\tignorecase = true\n'
  );
  await fs.write(gitdir + '/HEAD', `ref: refs/heads/${defaultBranch}\n`);
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {PostCheckoutCallback} [args.onPostCheckout]
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {string} args.url
 * @param {string} args.corsProxy
 * @param {string} args.ref
 * @param {boolean} args.singleBranch
 * @param {boolean} args.noCheckout
 * @param {boolean} args.noTags
 * @param {string} args.remote
 * @param {number} args.depth
 * @param {Date} args.since
 * @param {string[]} args.exclude
 * @param {boolean} args.relative
 * @param {Object<string, string>} args.headers
 * @param {boolean} [args.nonBlocking]
 * @param {number} [args.batchSize]
 *
 * @returns {Promise<void>} Resolves successfully when clone completes
 *
 */
async function _clone({
  fs,
  cache,
  http = { request },
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  onPostCheckout,
  dir,
  gitdir,
  url,
  corsProxy,
  ref,
  remote,
  depth,
  since,
  exclude,
  relative,
  singleBranch,
  noCheckout,
  noTags,
  headers,
  nonBlocking,
  batchSize = 100,
}) {
  try {
    await _init({ fs, gitdir });
    await _addRemote({ fs, gitdir, remote, url, force: false });
    if (corsProxy) {
      const config = await GitConfigManager.get({ fs, gitdir });
      await config.set(`http.corsProxy`, corsProxy);
      await GitConfigManager.save({ fs, gitdir, config });
    }
    const { defaultBranch, fetchHead } = await _fetch({
      fs,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      gitdir,
      ref,
      remote,
      corsProxy,
      depth,
      since,
      exclude,
      relative,
      singleBranch,
      headers,
      tags: !noTags,
    });
    if (fetchHead === null) return
    ref = ref || defaultBranch;
    ref = ref.replace('refs/heads/', '');
    // Checkout that branch
    await _checkout({
      fs,
      cache,
      onProgress,
      onPostCheckout,
      dir,
      gitdir,
      ref,
      remote,
      noCheckout,
      nonBlocking,
      batchSize,
    });
  } catch (err) {
    // Remove partial local repository, see #1283
    // Ignore any error as we are already failing.
    // The catch is necessary so the original error is not masked.
    await fs
      .rmdir(gitdir, { recursive: true, maxRetries: 10 })
      .catch(() => undefined);
    throw err
  }
}

// @ts-check

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
 * @param {PostCheckoutCallback} [args.onPostCheckout] - optional post-checkout hook callback
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
 * @param {boolean} [args.nonBlocking = false] - if true, checkout will happen non-blockingly (useful for long-running operations blocking the thread in browser environments)
 * @param {number} [args.batchSize = 100] - If args.nonBlocking is true, batchSize is the number of files to process at a time avoid blocking the executing thread. The default value of 100 is a good starting point.
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
async function clone({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  onPostCheckout,
  dir,
  gitdir = join(dir, '.git'),
  url,
  corsProxy = undefined,
  ref = undefined,
  remote = 'origin',
  depth = undefined,
  since = undefined,
  exclude = [],
  relative = false,
  singleBranch = false,
  noCheckout = false,
  noTags = false,
  headers = {},
  cache = {},
  nonBlocking = false,
  batchSize = 100,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('http', http);
    assertParameter('gitdir', gitdir);
    if (!noCheckout) {
      assertParameter('dir', dir);
    }
    assertParameter('url', url);

    return await _clone({
      fs: new FileSystem(fs),
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      onPostCheckout,
      dir,
      gitdir,
      url,
      corsProxy,
      ref,
      remote,
      depth,
      since,
      exclude,
      relative,
      singleBranch,
      noCheckout,
      noTags,
      headers,
      nonBlocking,
      batchSize,
    })
  } catch (err) {
    err.caller = 'git.clone';
    throw err
  }
}

// @ts-check
/**
 * Create a new commit
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.message] - The commit message to use. Required, unless `amend === true`
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
 * @param {boolean} [args.amend = false] - If true, replaces the last commit pointed to by `ref` with a new commit.
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
async function commit({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  message,
  author,
  committer,
  signingKey,
  amend = false,
  dryRun = false,
  noUpdateBranch = false,
  ref,
  parent,
  tree,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    if (!amend) {
      assertParameter('message', message);
    }
    if (signingKey) {
      assertParameter('onSign', onSign);
    }
    const fs = new FileSystem(_fs);

    return await _commit({
      fs,
      cache,
      onSign,
      gitdir,
      message,
      author,
      committer,
      signingKey,
      amend,
      dryRun,
      noUpdateBranch,
      ref,
      parent,
      tree,
    })
  } catch (err) {
    err.caller = 'git.commit';
    throw err
  }
}

// @ts-check

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
async function currentBranch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  fullname = false,
  test = false,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    return await _currentBranch({
      fs: new FileSystem(fs),
      gitdir,
      fullname,
      test,
    })
  } catch (err) {
    err.caller = 'git.currentBranch';
    throw err
  }
}

// @ts-check

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref
 *
 * @returns {Promise<void>}
 */
async function _deleteBranch({ fs, gitdir, ref }) {
  ref = ref.startsWith('refs/heads/') ? ref : `refs/heads/${ref}`;
  const exist = await GitRefManager.exists({ fs, gitdir, ref });
  if (!exist) {
    throw new NotFoundError(ref)
  }

  const fullRef = await GitRefManager.expand({ fs, gitdir, ref });
  const currentRef = await _currentBranch({ fs, gitdir, fullname: true });
  if (fullRef === currentRef) {
    // detach HEAD
    const value = await GitRefManager.resolve({ fs, gitdir, ref: fullRef });
    await GitRefManager.writeRef({ fs, gitdir, ref: 'HEAD', value });
  }

  // Delete a specified branch
  await GitRefManager.deleteRef({ fs, gitdir, ref: fullRef });

  // Delete branch config entries
  const abbrevRef = abbreviateRef(ref);
  const config = await GitConfigManager.get({ fs, gitdir });
  await config.deleteSection('branch', abbrevRef);
  await GitConfigManager.save({ fs, gitdir, config });
}

// @ts-check

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
async function deleteBranch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('ref', ref);
    return await _deleteBranch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.deleteBranch';
    throw err
  }
}

// @ts-check

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
async function deleteRef({ fs, dir, gitdir = join(dir, '.git'), ref }) {
  try {
    assertParameter('fs', fs);
    assertParameter('ref', ref);
    await GitRefManager.deleteRef({ fs: new FileSystem(fs), gitdir, ref });
  } catch (err) {
    err.caller = 'git.deleteRef';
    throw err
  }
}

// @ts-check

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.remote
 *
 * @returns {Promise<void>}
 */
async function _deleteRemote({ fs, gitdir, remote }) {
  const config = await GitConfigManager.get({ fs, gitdir });
  await config.deleteSection('remote', remote);
  await GitConfigManager.save({ fs, gitdir, config });
}

// @ts-check

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
async function deleteRemote({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  remote,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('remote', remote);
    return await _deleteRemote({
      fs: new FileSystem(fs),
      gitdir,
      remote,
    })
  } catch (err) {
    err.caller = 'git.deleteRemote';
    throw err
  }
}

// @ts-check

/**
 * Delete a local tag ref
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref - The tag to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteTag({ dir: '$input((/))', ref: '$input((test-tag))' })
 * console.log('done')
 *
 */
async function _deleteTag({ fs, gitdir, ref }) {
  ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`;
  await GitRefManager.deleteRef({ fs, gitdir, ref });
}

// @ts-check

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
async function deleteTag({ fs, dir, gitdir = join(dir, '.git'), ref }) {
  try {
    assertParameter('fs', fs);
    assertParameter('ref', ref);
    return await _deleteTag({
      fs: new FileSystem(fs),
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.deleteTag';
    throw err
  }
}

async function expandOidLoose({ fs, gitdir, oid: short }) {
  const prefix = short.slice(0, 2);
  const objectsSuffixes = await fs.readdir(`${gitdir}/objects/${prefix}`);
  return objectsSuffixes
    .map(suffix => `${prefix}${suffix}`)
    .filter(_oid => _oid.startsWith(short))
}

async function expandOidPacked({
  fs,
  cache,
  gitdir,
  oid: short,
  getExternalRefDelta,
}) {
  // Iterate through all the .pack files
  const results = [];
  let list = await fs.readdir(join(gitdir, 'objects/pack'));
  list = list.filter(x => x.endsWith('.idx'));
  for (const filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`;
    const p = await readPackIndex({
      fs,
      cache,
      filename: indexFile,
      getExternalRefDelta,
    });
    if (p.error) throw new InternalError(p.error)
    // Search through the list of oids in the packfile
    for (const oid of p.offsets.keys()) {
      if (oid.startsWith(short)) results.push(oid);
    }
  }
  return results
}

async function _expandOid({ fs, cache, gitdir, oid: short }) {
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => _readObject({ fs, cache, gitdir, oid });

  const results = await expandOidLoose({ fs, gitdir, oid: short });
  const packedOids = await expandOidPacked({
    fs,
    cache,
    gitdir,
    oid: short,
    getExternalRefDelta,
  });
  // Objects can exist in a pack file as well as loose, make sure we only get a list of unique oids.
  for (const packedOid of packedOids) {
    if (results.indexOf(packedOid) === -1) {
      results.push(packedOid);
    }
  }

  if (results.length === 1) {
    return results[0]
  }
  if (results.length > 1) {
    throw new AmbiguousError('oids', short, results)
  }
  throw new NotFoundError(`an object matching "${short}"`)
}

// @ts-check

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
async function expandOid({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);
    return await _expandOid({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
    })
  } catch (err) {
    err.caller = 'git.expandOid';
    throw err
  }
}

// @ts-check

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
async function expandRef({ fs, dir, gitdir = join(dir, '.git'), ref }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);
    return await GitRefManager.expand({
      fs: new FileSystem(fs),
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.expandRef';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string[]} args.oids
 *
 */
async function _findMergeBase({ fs, cache, gitdir, oids }) {
  // Note: right now, the tests are geared so that the output should match that of
  // `git merge-base --all --octopus`
  // because without the --octopus flag, git's output seems to depend on the ORDER of the oids,
  // and computing virtual merge bases is just too much for me to fathom right now.

  // If we start N independent walkers, one at each of the given `oids`, and walk backwards
  // through ancestors, eventually we'll discover a commit where each one of these N walkers
  // has passed through. So we just need to keep track of which walkers have visited each commit
  // until we find a commit that N distinct walkers has visited.
  const visits = {};
  const passes = oids.length;
  let heads = oids.map((oid, index) => ({ index, oid }));
  while (heads.length) {
    // Count how many times we've passed each commit
    const result = new Set();
    for (const { oid, index } of heads) {
      if (!visits[oid]) visits[oid] = new Set();
      visits[oid].add(index);
      if (visits[oid].size === passes) {
        result.add(oid);
      }
    }
    if (result.size > 0) {
      return [...result]
    }
    // We haven't found a common ancestor yet
    const newheads = new Map();
    for (const { oid, index } of heads) {
      try {
        const { object } = await _readObject({ fs, cache, gitdir, oid });
        const commit = GitCommit.from(object);
        const { parent } = commit.parseHeaders();
        for (const oid of parent) {
          if (!visits[oid] || !visits[oid].has(index)) {
            newheads.set(oid + ':' + index, { oid, index });
          }
        }
      } catch (err) {
        // do nothing
      }
    }
    heads = Array.from(newheads.values());
  }
  return []
}

// @ts-check

// import diff3 from 'node-diff3'
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
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.gitdir
 * @param {string} [args.ours]
 * @param {string} args.theirs
 * @param {boolean} args.fastForward
 * @param {boolean} args.fastForwardOnly
 * @param {boolean} args.dryRun
 * @param {boolean} args.noUpdateBranch
 * @param {boolean} args.abortOnConflict
 * @param {string} [args.message]
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey]
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {MergeDriverCallback} [args.mergeDriver]
 * @param {boolean} args.allowUnrelatedHistories
 *
 * @returns {Promise<MergeResult>} Resolves to a description of the merge operation
 *
 */
async function _merge({
  fs,
  cache,
  dir,
  gitdir,
  ours,
  theirs,
  fastForward = true,
  fastForwardOnly = false,
  dryRun = false,
  noUpdateBranch = false,
  abortOnConflict = true,
  message,
  author,
  committer,
  signingKey,
  onSign,
  mergeDriver,
  allowUnrelatedHistories = false,
}) {
  if (ours === undefined) {
    ours = await _currentBranch({ fs, gitdir, fullname: true });
  }
  ours = await GitRefManager.expand({
    fs,
    gitdir,
    ref: ours,
  });
  theirs = await GitRefManager.expand({
    fs,
    gitdir,
    ref: theirs,
  });
  const ourOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: ours,
  });
  const theirOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: theirs,
  });
  // find most recent common ancestor of ref a and ref b
  const baseOids = await _findMergeBase({
    fs,
    cache,
    gitdir,
    oids: [ourOid, theirOid],
  });
  if (baseOids.length !== 1) {
    if (baseOids.length === 0 && allowUnrelatedHistories) {
      // 4b825…  == the empty tree used by git
      baseOids.push('4b825dc642cb6eb9a060e54bf8d69288fbee4904');
    } else {
      // TODO: Recursive Merge strategy
      throw new MergeNotSupportedError()
    }
  }
  const baseOid = baseOids[0];
  // handle fast-forward case
  if (baseOid === theirOid) {
    return {
      oid: ourOid,
      alreadyMerged: true,
    }
  }
  if (fastForward && baseOid === ourOid) {
    if (!dryRun && !noUpdateBranch) {
      await GitRefManager.writeRef({ fs, gitdir, ref: ours, value: theirOid });
    }
    return {
      oid: theirOid,
      fastForward: true,
    }
  } else {
    // not a simple fast-forward
    if (fastForwardOnly) {
      throw new FastForwardError()
    }
    // try a fancier merge
    const tree = await GitIndexManager.acquire(
      { fs, gitdir, cache, allowUnmerged: false },
      async index => {
        return mergeTree({
          fs,
          cache,
          dir,
          gitdir,
          index,
          ourOid,
          theirOid,
          baseOid,
          ourName: abbreviateRef(ours),
          baseName: 'base',
          theirName: abbreviateRef(theirs),
          dryRun,
          abortOnConflict,
          mergeDriver,
        })
      }
    );

    // Defer throwing error until the index lock is relinquished and index is
    // written to filesystem
    if (tree instanceof MergeConflictError) throw tree

    if (!message) {
      message = `Merge branch '${abbreviateRef(theirs)}' into ${abbreviateRef(
        ours
      )}`;
    }
    const oid = await _commit({
      fs,
      cache,
      gitdir,
      message,
      ref: ours,
      tree,
      parent: [ourOid, theirOid],
      author,
      committer,
      signingKey,
      onSign,
      dryRun,
      noUpdateBranch,
    });
    return {
      oid,
      tree,
      mergeCommit: true,
    }
  }
}

// @ts-check


/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} [args.url]
 * @param {string} [args.remote]
 * @param {string} [args.remoteRef]
 * @param {boolean} [args.prune]
 * @param {boolean} [args.pruneTags]
 * @param {string} [args.corsProxy]
 * @param {boolean} args.singleBranch
 * @param {boolean} args.fastForward
 * @param {boolean} args.fastForwardOnly
 * @param {Object<string, string>} [args.headers]
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey]
 *
 * @returns {Promise<void>} Resolves successfully when pull operation completes
 *
 */
async function _pull({
  fs,
  cache,
  http = { request },
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir,
  ref,
  url,
  remote,
  remoteRef,
  prune,
  pruneTags,
  fastForward,
  fastForwardOnly,
  corsProxy,
  singleBranch,
  headers,
  author,
  committer,
  signingKey,
}) {
  try {
    // If ref is undefined, use 'HEAD'
    if (!ref) {
      const head = await _currentBranch({ fs, gitdir });
      // TODO: use a better error.
      if (!head) {
        throw new MissingParameterError('ref')
      }
      ref = head;
    }

    const { fetchHead, fetchHeadDescription } = await _fetch({
      fs,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      gitdir,
      corsProxy,
      ref,
      url,
      remote,
      remoteRef,
      singleBranch,
      headers,
      prune,
      pruneTags,
    });
    // Merge the remote tracking branch into the local one.
    await _merge({
      fs,
      cache,
      gitdir,
      ours: ref,
      theirs: fetchHead,
      fastForward,
      fastForwardOnly,
      message: `Merge ${fetchHeadDescription}`,
      author,
      committer,
      signingKey,
      dryRun: false,
      noUpdateBranch: false,
    });
    await _checkout({
      fs,
      cache,
      onProgress,
      dir,
      gitdir,
      ref,
      remote,
      noCheckout: false,
    });
  } catch (err) {
    err.caller = 'git.pull';
    throw err
  }
}

// @ts-check

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
async function fastForward({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  url,
  remote,
  remoteRef,
  corsProxy,
  singleBranch,
  headers = {},
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('http', http);
    assertParameter('gitdir', gitdir);

    const thisWillNotBeUsed = {
      name: '',
      email: '',
      timestamp: Date.now(),
      timezoneOffset: 0,
    };

    return await _pull({
      fs: new FileSystem(fs),
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      dir,
      gitdir,
      ref,
      url,
      remote,
      remoteRef,
      fastForwardOnly: true,
      corsProxy,
      singleBranch,
      headers,
      author: thisWillNotBeUsed,
      committer: thisWillNotBeUsed,
    })
  } catch (err) {
    err.caller = 'git.fastForward';
    throw err
  }
}

// @ts-check

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
 * @param {boolean} [args.prune = false] - Delete local remote-tracking branches that are not present on the remote
 * @param {boolean} [args.pruneTags = false] - Prune local tags that don’t exist on the remote, and force-update those tags that differ
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
async function fetch({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  remote,
  remoteRef,
  url,
  corsProxy,
  depth = null,
  since = null,
  exclude = [],
  relative = false,
  tags = false,
  singleBranch = false,
  headers = {},
  prune = false,
  pruneTags = false,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('http', http);
    assertParameter('gitdir', gitdir);

    return await _fetch({
      fs: new FileSystem(fs),
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      gitdir,
      ref,
      remote,
      remoteRef,
      url,
      corsProxy,
      depth,
      since,
      exclude,
      relative,
      tags,
      singleBranch,
      headers,
      prune,
      pruneTags,
    })
  } catch (err) {
    err.caller = 'git.fetch';
    throw err
  }
}

// @ts-check

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
async function findMergeBase({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oids,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oids', oids);

    return await _findMergeBase({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oids,
    })
  } catch (err) {
    err.caller = 'git.findMergeBase';
    throw err
  }
}

// @ts-check

/**
 * Find the root git directory
 *
 * Starting at `filepath`, walks upward until it finds a directory that contains a subdirectory called '.git'.
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.filepath
 *
 * @returns {Promise<string>} Resolves successfully with a root git directory path
 */
async function _findRoot({ fs, filepath }) {
  if (await fs.exists(join(filepath, '.git'))) {
    return filepath
  } else {
    const parent = dirname(filepath);
    if (parent === filepath) {
      throw new NotFoundError(`git root for ${filepath}`)
    }
    return _findRoot({ fs, filepath: parent })
  }
}

// @ts-check

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
async function findRoot({ fs, filepath }) {
  try {
    assertParameter('fs', fs);
    assertParameter('filepath', filepath);

    return await _findRoot({ fs: new FileSystem(fs), filepath })
  } catch (err) {
    err.caller = 'git.findRoot';
    throw err
  }
}

// @ts-check

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
async function getConfig({ fs, dir, gitdir = join(dir, '.git'), path }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('path', path);

    return await _getConfig({
      fs: new FileSystem(fs),
      gitdir,
      path,
    })
  } catch (err) {
    err.caller = 'git.getConfig';
    throw err
  }
}

// @ts-check

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * //TODO: Upgrade to native FileSystem API
 * @param {string} args.gitdir
 * @param {string} args.path
 *
 * @returns {Promise<Array<any>>} Resolves with an array of the config value
 *
 */
async function _getConfigAll({ fs, gitdir, path }) {
  const config = await GitConfigManager.get({ fs, gitdir });
  return config.getall(path)
}

// @ts-check

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
async function getConfigAll({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  path,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('path', path);

    return await _getConfigAll({
      fs: new FileSystem(fs),
      gitdir,
      path,
    })
  } catch (err) {
    err.caller = 'git.getConfigAll';
    throw err
  }
}

// @ts-check

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
async function getRemoteInfo({
  http,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  corsProxy,
  url,
  headers = {},
  forPush = false,
}) {
  try {
    assertParameter('http', http);
    assertParameter('url', url);

    const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url });
    const remote = await GitRemoteHTTP.discover({
      http,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      headers,
      protocolVersion: 1,
    });

    // Note: remote.capabilities, remote.refs, and remote.symrefs are Set and Map objects,
    // but one of the objectives of the public API is to always return JSON-compatible objects
    // so we must JSONify them.
    const result = {
      capabilities: [...remote.capabilities],
    };
    // Convert the flat list into an object tree, because I figure 99% of the time
    // that will be easier to use.
    for (const [ref, oid] of remote.refs) {
      const parts = ref.split('/');
      const last = parts.pop();
      let o = result;
      for (const part of parts) {
        o[part] = o[part] || {};
        o = o[part];
      }
      o[last] = oid;
    }
    // Merge symrefs on top of refs to more closely match actual git repo layouts
    for (const [symref, ref] of remote.symrefs) {
      const parts = symref.split('/');
      const last = parts.pop();
      let o = result;
      for (const part of parts) {
        o[part] = o[part] || {};
        o = o[part];
      }
      o[last] = ref;
    }
    return result
  } catch (err) {
    err.caller = 'git.getRemoteInfo';
    throw err
  }
}

// @ts-check

/**
 * @param {any} remote
 * @param {string} prefix
 * @param {boolean} symrefs
 * @param {boolean} peelTags
 * @returns {ServerRef[]}
 */
function formatInfoRefs(remote, prefix, symrefs, peelTags) {
  const refs = [];
  for (const [key, value] of remote.refs) {
    if (prefix && !key.startsWith(prefix)) continue

    if (key.endsWith('^{}')) {
      if (peelTags) {
        const _key = key.replace('^{}', '');
        // Peeled tags are almost always listed immediately after the original tag
        const last = refs[refs.length - 1];
        const r = last.ref === _key ? last : refs.find(x => x.ref === _key);
        if (r === undefined) {
          throw new Error('I did not expect this to happen')
        }
        r.peeled = value;
      }
      continue
    }
    /** @type ServerRef */
    const ref = { ref: key, oid: value };
    if (symrefs) {
      if (remote.symrefs.has(key)) {
        ref.target = remote.symrefs.get(key);
      }
    }
    refs.push(ref);
  }
  return refs
}

// @ts-check

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
async function getRemoteInfo2({
  http,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  corsProxy,
  url,
  headers = {},
  forPush = false,
  protocolVersion = 2,
}) {
  try {
    assertParameter('http', http);
    assertParameter('url', url);

    const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url });
    const remote = await GitRemoteHTTP.discover({
      http,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      headers,
      protocolVersion,
    });

    if (remote.protocolVersion === 2) {
      /** @type GetRemoteInfo2Result */
      return {
        protocolVersion: remote.protocolVersion,
        capabilities: remote.capabilities2,
      }
    }

    // Note: remote.capabilities, remote.refs, and remote.symrefs are Set and Map objects,
    // but one of the objectives of the public API is to always return JSON-compatible objects
    // so we must JSONify them.
    /** @type Object<string, true> */
    const capabilities = {};
    for (const cap of remote.capabilities) {
      const [key, value] = cap.split('=');
      if (value) {
        capabilities[key] = value;
      } else {
        capabilities[key] = true;
      }
    }
    /** @type GetRemoteInfo2Result */
    return {
      protocolVersion: 1,
      capabilities,
      refs: formatInfoRefs(remote, undefined, true, true),
    }
  } catch (err) {
    err.caller = 'git.getRemoteInfo2';
    throw err
  }
}

async function hashObject$1({
  type,
  object,
  format = 'content',
  oid = undefined,
}) {
  if (format !== 'deflated') {
    if (format !== 'wrapped') {
      object = GitObject.wrap({ type, object });
    }
    oid = await shasum(object);
  }
  return { oid, object }
}

// @ts-check

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
async function hashBlob({ object }) {
  try {
    assertParameter('object', object);

    // Convert object to buffer
    if (typeof object === 'string') {
      object = Buffer.from(object, 'utf8');
    } else if (!(object instanceof Uint8Array)) {
      object = new Uint8Array(object);
    }

    const type = 'blob';
    const { oid, object: _object } = await hashObject$1({
      type,
      format: 'content',
      object,
    });

    return { oid, type, object: _object, format: 'wrapped' }
  } catch (err) {
    err.caller = 'git.hashBlob';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {ProgressCallback} [args.onProgress]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.filepath
 *
 * @returns {Promise<{oids: string[]}>}
 */
async function _indexPack({
  fs,
  cache,
  onProgress,
  dir,
  gitdir,
  filepath,
}) {
  try {
    filepath = join(dir, filepath);
    const pack = await fs.read(filepath);
    const getExternalRefDelta = oid => _readObject({ fs, cache, gitdir, oid });
    const idx = await GitPackIndex.fromPack({
      pack,
      getExternalRefDelta,
      onProgress,
    });
    await fs.write(filepath.replace(/\.pack$/, '.idx'), await idx.toBuffer());
    return {
      oids: [...idx.hashes],
    }
  } catch (err) {
    err.caller = 'git.indexPack';
    throw err
  }
}

// @ts-check

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
async function indexPack({
  fs,
  onProgress,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('dir', dir);
    assertParameter('gitdir', dir);
    assertParameter('filepath', filepath);

    return await _indexPack({
      fs: new FileSystem(fs),
      cache,
      onProgress,
      dir,
      gitdir,
      filepath,
    })
  } catch (err) {
    err.caller = 'git.indexPack';
    throw err
  }
}

// @ts-check

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
async function init({
  fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  defaultBranch = 'master',
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    if (!bare) {
      assertParameter('dir', dir);
    }

    return await _init({
      fs: new FileSystem(fs),
      bare,
      dir,
      gitdir,
      defaultBranch,
    })
  } catch (err) {
    err.caller = 'git.init';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} args.ancestor
 * @param {number} args.depth - Maximum depth to search before giving up. -1 means no maximum depth.
 *
 * @returns {Promise<boolean>}
 */
async function _isDescendent({
  fs,
  cache,
  gitdir,
  oid,
  ancestor,
  depth,
}) {
  const shallows = await GitShallowManager.read({ fs, gitdir });
  if (!oid) {
    throw new MissingParameterError('oid')
  }
  if (!ancestor) {
    throw new MissingParameterError('ancestor')
  }
  // If you don't like this behavior, add your own check.
  // Edge cases are hard to define a perfect solution.
  if (oid === ancestor) return false
  // We do not use recursion here, because that would lead to depth-first traversal,
  // and we want to maintain a breadth-first traversal to avoid hitting shallow clone depth cutoffs.
  const queue = [oid];
  const visited = new Set();
  let searchdepth = 0;
  while (queue.length) {
    if (searchdepth++ === depth) {
      throw new MaxDepthError(depth)
    }
    const oid = queue.shift();
    const { type, object } = await _readObject({
      fs,
      cache,
      gitdir,
      oid,
    });
    if (type !== 'commit') {
      throw new ObjectTypeError(oid, type, 'commit')
    }
    const commit = GitCommit.from(object).parse();
    // Are any of the parents the sought-after ancestor?
    for (const parent of commit.parent) {
      if (parent === ancestor) return true
    }
    // If not, add them to heads (unless we know this is a shallow commit)
    if (!shallows.has(oid)) {
      for (const parent of commit.parent) {
        if (!visited.has(parent)) {
          queue.push(parent);
          visited.add(parent);
        }
      }
    }
    // Eventually, we'll travel entire tree to the roots where all the parents are empty arrays,
    // or hit the shallow depth and throw an error. Excluding the possibility of grafts, or
    // different branches cloned to different depths, you would hit this error at the same time
    // for all parents, so trying to continue is futile.
  }
  return false
}

// @ts-check

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
async function isDescendent({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  ancestor,
  depth = -1,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);
    assertParameter('ancestor', ancestor);

    return await _isDescendent({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
      ancestor,
      depth,
    })
  } catch (err) {
    err.caller = 'git.isDescendent';
    throw err
  }
}

// @ts-check

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
async function isIgnored({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('dir', dir);
    assertParameter('gitdir', gitdir);
    assertParameter('filepath', filepath);

    return GitIgnoreManager.isIgnored({
      fs: new FileSystem(fs),
      dir,
      gitdir,
      filepath,
    })
  } catch (err) {
    err.caller = 'git.isIgnored';
    throw err
  }
}

// @ts-check

/**
 * List branches
 *
 * By default it lists local branches. If a 'remote' is specified, it lists the remote's branches. When listing remote branches, the HEAD branch is not filtered out, so it may be included in the list of results.
 *
 * Note that specifying a remote does not actually contact the server and update the list of branches.
 * If you want an up-to-date list, first do a `fetch` to that remote.
 * (Which branch you fetch doesn't matter - the list of branches available on the remote is updated during the fetch handshake.)
 *
 * Also note, that a branch is a reference to a commit. If you initialize a new repository it has no commits, so the
 * `listBranches` function will return an empty list, until you create the first commit.
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
async function listBranches({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  remote,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);

    return GitRefManager.listBranches({
      fs: new FileSystem(fs),
      gitdir,
      remote,
    })
  } catch (err) {
    err.caller = 'git.listBranches';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.gitdir
 * @param {string} [args.ref]
 *
 * @returns {Promise<Array<string>>}
 */
async function _listFiles({ fs, gitdir, ref, cache }) {
  if (ref) {
    const oid = await GitRefManager.resolve({ gitdir, fs, ref });
    const filenames = [];
    await accumulateFilesFromOid({
      fs,
      cache,
      gitdir,
      oid,
      filenames,
      prefix: '',
    });
    return filenames
  } else {
    return GitIndexManager.acquire({ fs, gitdir, cache }, async function(
      index
    ) {
      return index.entries.map(x => x.path)
    })
  }
}

async function accumulateFilesFromOid({
  fs,
  cache,
  gitdir,
  oid,
  filenames,
  prefix,
}) {
  const { tree } = await _readTree({ fs, cache, gitdir, oid });
  // TODO: Use `walk` to do this. Should be faster.
  for (const entry of tree) {
    if (entry.type === 'tree') {
      await accumulateFilesFromOid({
        fs,
        cache,
        gitdir,
        oid: entry.oid,
        filenames,
        prefix: join(prefix, entry.path),
      });
    } else {
      filenames.push(join(prefix, entry.path));
    }
  }
}

// @ts-check

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
async function listFiles({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);

    return await _listFiles({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.listFiles';
    throw err
  }
}

// @ts-check

/**
 * List all the object notes
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.ref
 *
 * @returns {Promise<Array<{target: string, note: string}>>}
 */

async function _listNotes({ fs, cache, gitdir, ref }) {
  // Get the current note commit
  let parent;
  try {
    parent = await GitRefManager.resolve({ gitdir, fs, ref });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return []
    }
  }

  // Create the current note tree
  const result = await _readTree({
    fs,
    cache,
    gitdir,
    oid: parent,
  });

  // Format the tree entries
  const notes = result.tree.map(entry => ({
    target: entry.path,
    note: entry.oid,
  }));
  return notes
}

// @ts-check

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

async function listNotes({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);

    return await _listNotes({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.listNotes';
    throw err
  }
}

// @ts-check

/**
 * List refs
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.filepath] - [required] The refs path to list
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of ref names below the supplied `filepath`
 *
 * @example
 * let refs = await git.listRefs({ fs, dir: '/tutorial', filepath: 'refs/heads' })
 * console.log(refs)
 *
 */
async function listRefs({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    return GitRefManager.listRefs({ fs: new FileSystem(fs), gitdir, filepath })
  } catch (err) {
    err.caller = 'git.listRefs';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 *
 * @returns {Promise<Array<{remote: string, url: string}>>}
 */
async function _listRemotes({ fs, gitdir }) {
  const config = await GitConfigManager.get({ fs, gitdir });
  const remoteNames = await config.getSubsections('remote');
  const remotes = Promise.all(
    remoteNames.map(async remote => {
      const url = await config.get(`remote.${remote}.url`);
      return { remote, url }
    })
  );
  return remotes
}

// @ts-check

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
async function listRemotes({ fs, dir, gitdir = join(dir, '.git') }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);

    return await _listRemotes({
      fs: new FileSystem(fs),
      gitdir,
    })
  } catch (err) {
    err.caller = 'git.listRemotes';
    throw err
  }
}

/**
 * @typedef {Object} ServerRef - This object has the following schema:
 * @property {string} ref - The name of the ref
 * @property {string} oid - The SHA-1 object id the ref points to
 * @property {string} [target] - The target ref pointed to by a symbolic ref
 * @property {string} [peeled] - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
 */

async function parseListRefsResponse(stream) {
  const read = GitPktLine.streamReader(stream);

  // TODO: when we re-write everything to minimize memory usage,
  // we could make this a generator
  const refs = [];

  let line;
  while (true) {
    line = await read();
    if (line === true) break
    if (line === null) continue
    line = line.toString('utf8').replace(/\n$/, '');
    const [oid, ref, ...attrs] = line.split(' ');
    const r = { ref, oid };
    for (const attr of attrs) {
      const [name, value] = attr.split(':');
      if (name === 'symref-target') {
        r.target = value;
      } else if (name === 'peeled') {
        r.peeled = value;
      }
    }
    refs.push(r);
  }

  return refs
}

/**
 * @param {object} args
 * @param {string} [args.prefix] - Only list refs that start with this prefix
 * @param {boolean} [args.symrefs = false] - Include symbolic ref targets
 * @param {boolean} [args.peelTags = false] - Include peeled tags values
 * @returns {Uint8Array[]}
 */
async function writeListRefsRequest({ prefix, symrefs, peelTags }) {
  const packstream = [];
  // command
  packstream.push(GitPktLine.encode('command=ls-refs\n'));
  // capability-list
  packstream.push(GitPktLine.encode(`agent=${pkg.agent}\n`));
  // [command-args]
  if (peelTags || symrefs || prefix) {
    packstream.push(GitPktLine.delim());
  }
  if (peelTags) packstream.push(GitPktLine.encode('peel'));
  if (symrefs) packstream.push(GitPktLine.encode('symrefs'));
  if (prefix) packstream.push(GitPktLine.encode(`ref-prefix ${prefix}`));
  packstream.push(GitPktLine.flush());
  return packstream
}

// @ts-check

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
 * - Protocol Version 1 took ~300ms and transferred 84 KB.
 * - Protocol Version 2 took ~500ms and transferred 4.1 KB.
 *
 * Using isomorphic-git in a browser, with a CORS proxy, listing only the branches (refs/heads) of https://gitlab.com/gitlab-org/gitlab
 * - Protocol Version 1 took ~4900ms and transferred 9.41 MB.
 * - Protocol Version 2 took ~1280ms and transferred 433 KB.
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
async function listServerRefs({
  http,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  corsProxy,
  url,
  headers = {},
  forPush = false,
  protocolVersion = 2,
  prefix,
  symrefs,
  peelTags,
}) {
  try {
    assertParameter('http', http);
    assertParameter('url', url);

    const remote = await GitRemoteHTTP.discover({
      http,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      headers,
      protocolVersion,
    });

    if (remote.protocolVersion === 1) {
      return formatInfoRefs(remote, prefix, symrefs, peelTags)
    }

    // Protocol Version 2
    const body = await writeListRefsRequest({ prefix, symrefs, peelTags });

    const res = await GitRemoteHTTP.connect({
      http,
      auth: remote.auth,
      headers,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      body,
    });

    return parseListRefsResponse(res.body)
  } catch (err) {
    err.caller = 'git.listServerRefs';
    throw err
  }
}

// @ts-check

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
async function listTags({ fs, dir, gitdir = join(dir, '.git') }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    return GitRefManager.listTags({ fs: new FileSystem(fs), gitdir })
  } catch (err) {
    err.caller = 'git.listTags';
    throw err
  }
}

function compareAge(a, b) {
  return a.committer.timestamp - b.committer.timestamp
}

// @ts-check

// the empty file content object id
const EMPTY_OID = 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391';

async function resolveFileIdInTree({ fs, cache, gitdir, oid, fileId }) {
  if (fileId === EMPTY_OID) return
  const _oid = oid;
  let filepath;
  const result = await resolveTree({ fs, cache, gitdir, oid });
  const tree = result.tree;
  if (fileId === result.oid) {
    filepath = result.path;
  } else {
    filepath = await _resolveFileId({
      fs,
      cache,
      gitdir,
      tree,
      fileId,
      oid: _oid,
    });
    if (Array.isArray(filepath)) {
      if (filepath.length === 0) filepath = undefined;
      else if (filepath.length === 1) filepath = filepath[0];
    }
  }
  return filepath
}

async function _resolveFileId({
  fs,
  cache,
  gitdir,
  tree,
  fileId,
  oid,
  filepaths = [],
  parentPath = '',
}) {
  const walks = tree.entries().map(function(entry) {
    let result;
    if (entry.oid === fileId) {
      result = join(parentPath, entry.path);
      filepaths.push(result);
    } else if (entry.type === 'tree') {
      result = _readObject({
        fs,
        cache,
        gitdir,
        oid: entry.oid,
      }).then(function({ object }) {
        return _resolveFileId({
          fs,
          cache,
          gitdir,
          tree: GitTree.from(object),
          fileId,
          oid,
          filepaths,
          parentPath: join(parentPath, entry.path),
        })
      });
    }
    return result
  });

  await Promise.all(walks);
  return filepaths
}

// @ts-check

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string=} args.filepath optional get the commit for the filepath only
 * @param {string} args.ref
 * @param {number|void} args.depth
 * @param {boolean=} [args.force=false] do not throw error if filepath is not exist (works only for a single file). defaults to false
 * @param {boolean=} [args.follow=false] Continue listing the history of a file beyond renames (works only for a single file). defaults to false
 * @param {boolean=} args.follow Continue listing the history of a file beyond renames (works only for a single file). defaults to false
 *
 * @returns {Promise<Array<ReadCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.log({ dir: '$input((/))', depth: $input((5)), ref: '$input((master))' })
 * console.log(commits)
 *
 */
async function _log({
  fs,
  cache,
  gitdir,
  filepath,
  ref,
  depth,
  since,
  force,
  follow,
}) {
  const sinceTimestamp =
    typeof since === 'undefined'
      ? undefined
      : Math.floor(since.valueOf() / 1000);
  // TODO: In the future, we may want to have an API where we return a
  // async iterator that emits commits.
  const commits = [];
  const shallowCommits = await GitShallowManager.read({ fs, gitdir });
  const oid = await GitRefManager.resolve({ fs, gitdir, ref });
  const tips = [await _readCommit({ fs, cache, gitdir, oid })];
  let lastFileOid;
  let lastCommit;
  let isOk;

  function endCommit(commit) {
    if (isOk && filepath) commits.push(commit);
  }

  while (tips.length > 0) {
    const commit = tips.pop();

    // Stop the log if we've hit the age limit
    if (
      sinceTimestamp !== undefined &&
      commit.commit.committer.timestamp <= sinceTimestamp
    ) {
      break
    }

    if (filepath) {
      let vFileOid;
      try {
        vFileOid = await resolveFilepath({
          fs,
          cache,
          gitdir,
          oid: commit.commit.tree,
          filepath,
        });
        if (lastCommit && lastFileOid !== vFileOid) {
          commits.push(lastCommit);
        }
        lastFileOid = vFileOid;
        lastCommit = commit;
        isOk = true;
      } catch (e) {
        if (e instanceof NotFoundError) {
          let found = follow && lastFileOid;
          if (found) {
            found = await resolveFileIdInTree({
              fs,
              cache,
              gitdir,
              oid: commit.commit.tree,
              fileId: lastFileOid,
            });
            if (found) {
              if (Array.isArray(found)) {
                if (lastCommit) {
                  const lastFound = await resolveFileIdInTree({
                    fs,
                    cache,
                    gitdir,
                    oid: lastCommit.commit.tree,
                    fileId: lastFileOid,
                  });
                  if (Array.isArray(lastFound)) {
                    found = found.filter(p => lastFound.indexOf(p) === -1);
                    if (found.length === 1) {
                      found = found[0];
                      filepath = found;
                      if (lastCommit) commits.push(lastCommit);
                    } else {
                      found = false;
                      if (lastCommit) commits.push(lastCommit);
                      break
                    }
                  }
                }
              } else {
                filepath = found;
                if (lastCommit) commits.push(lastCommit);
              }
            }
          }
          if (!found) {
            if (isOk && lastFileOid) {
              commits.push(lastCommit);
              if (!force) break
            }
            if (!force && !follow) throw e
          }
          lastCommit = commit;
          isOk = false;
        } else throw e
      }
    } else {
      commits.push(commit);
    }

    // Stop the loop if we have enough commits now.
    if (depth !== undefined && commits.length === depth) {
      endCommit(commit);
      break
    }

    // If this is not a shallow commit...
    if (!shallowCommits.has(commit.oid)) {
      // Add the parents of this commit to the queue
      // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
      for (const oid of commit.commit.parent) {
        const commit = await _readCommit({ fs, cache, gitdir, oid });
        if (!tips.map(commit => commit.oid).includes(commit.oid)) {
          tips.push(commit);
        }
      }
    }

    // Stop the loop if there are no more commit parents
    if (tips.length === 0) {
      endCommit(commit);
    }

    // Process tips in order by age
    tips.sort((a, b) => compareAge(a.commit, b.commit));
  }
  return commits
}

// @ts-check

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
async function log({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  ref = 'HEAD',
  depth,
  since, // Date
  force,
  follow,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);

    return await _log({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      filepath,
      ref,
      depth,
      since,
      force,
      follow,
    })
  } catch (err) {
    err.caller = 'git.log';
    throw err
  }
}

// @ts-check

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
 * Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)
 *
 * Currently it does not support selecting alternative merge strategies.
 *
 * Currently it is not possible to abort an incomplete merge. To restore the worktree to a clean state, you will need to checkout an earlier commit.
 *
 * Currently it does not directly support the behavior of `git merge --continue`. To complete a merge after manual conflict resolution, you will need to add and commit the files manually, and specify the appropriate parent commits.
 *
 * ## Manually resolving merge conflicts
 * By default, if isomorphic-git encounters a merge conflict it cannot resolve using the builtin diff3 algorithm or provided merge driver, it will abort and throw a `MergeNotSupportedError`.
 * This leaves the index and working tree untouched.
 *
 * When `abortOnConflict` is set to `false`, and a merge conflict cannot be automatically resolved, a `MergeConflictError` is thrown and the results of the incomplete merge will be written to the working directory.
 * This includes conflict markers in files with unresolved merge conflicts.
 *
 * To complete the merge, edit the conflicting files as you see fit, and then add and commit the resolved merge.
 *
 * For a proper merge commit, be sure to specify the branches or commits you are merging in the `parent` argument to `git.commit`.
 * For example, say we are merging the branch `feature` into the branch `main` and there is a conflict we want to resolve manually.
 * The flow would look like this:
 *
 * ```
 * await git.merge({
 *   fs,
 *   dir,
 *   ours: 'main',
 *   theirs: 'feature',
 *   abortOnConflict: false,
 * }).catch(e => {
 *   if (e instanceof Errors.MergeConflictError) {
 *     console.log(
 *       'Automatic merge failed for the following files: '
 *       + `${e.data}. `
 *       + 'Resolve these conflicts and then commit your changes.'
 *     )
 *   } else throw e
 * })
 *
 * // This is the where we manually edit the files that have been written to the working directory
 * // ...
 * // Files have been edited and we are ready to commit
 *
 * await git.add({
 *   fs,
 *   dir,
 *   filepath: '.',
 * })
 *
 * await git.commit({
 *   fs,
 *   dir,
 *   ref: 'main',
 *   message: "Merge branch 'feature' into main",
 *   parent: ['main', 'feature'], // Be sure to specify the parents when creating a merge commit
 * })
 * ```
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ours] - The branch receiving the merge. If undefined, defaults to the current branch.
 * @param {string} args.theirs - The branch to be merged
 * @param {boolean} [args.fastForward = true] - If false, create a merge commit in all cases.
 * @param {boolean} [args.fastForwardOnly = false] - If true, then non-fast-forward merges will throw an Error instead of performing a merge.
 * @param {boolean} [args.dryRun = false] - If true, simulates a merge so you can test whether it would succeed.
 * @param {boolean} [args.noUpdateBranch = false] - If true, does not update the branch pointer after creating the commit.
 * @param {boolean} [args.abortOnConflict = true] - If true, merges with conflicts will not update the worktree or index.
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
 * @param {MergeDriverCallback} [args.mergeDriver] - a [merge driver](mergeDriver.md) implementation
 * @param {boolean} [args.allowUnrelatedHistories = false] - If true, allows merging histories of two branches that started their lives independently.
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
async function merge({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  ours,
  theirs,
  fastForward = true,
  fastForwardOnly = false,
  dryRun = false,
  noUpdateBranch = false,
  abortOnConflict = true,
  message,
  author: _author,
  committer: _committer,
  signingKey,
  cache = {},
  mergeDriver,
  allowUnrelatedHistories = false,
}) {
  try {
    assertParameter('fs', _fs);
    if (signingKey) {
      assertParameter('onSign', onSign);
    }
    const fs = new FileSystem(_fs);

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author });
    if (!author && (!fastForwardOnly || !fastForward)) {
      throw new MissingNameError('author')
    }

    const committer = await normalizeCommitterObject({
      fs,
      gitdir,
      author,
      committer: _committer,
    });
    if (!committer && (!fastForwardOnly || !fastForward)) {
      throw new MissingNameError('committer')
    }

    return await _merge({
      fs,
      cache,
      dir,
      gitdir,
      ours,
      theirs,
      fastForward,
      fastForwardOnly,
      dryRun,
      noUpdateBranch,
      abortOnConflict,
      message,
      author,
      committer,
      signingKey,
      onSign,
      mergeDriver,
      allowUnrelatedHistories,
    })
  } catch (err) {
    err.caller = 'git.merge';
    throw err
  }
}

// @ts-check

/**
 *
 * @typedef {Object} PackObjectsResult The packObjects command returns an object with two properties:
 * @property {string} filename - The suggested filename for the packfile if you want to save it to disk somewhere. It includes the packfile SHA.
 * @property {Uint8Array} [packfile] - The packfile contents. Not present if `write` parameter was true, in which case the packfile was written straight to disk.
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string[]} args.oids
 * @param {boolean} args.write
 *
 * @returns {Promise<PackObjectsResult>}
 * @see PackObjectsResult
 */
async function _packObjects({ fs, cache, gitdir, oids, write }) {
  const buffers = await _pack({ fs, cache, gitdir, oids });
  const packfile = Buffer.from(await collect(buffers));
  const packfileSha = packfile.slice(-20).toString('hex');
  const filename = `pack-${packfileSha}.pack`;
  if (write) {
    await fs.write(join(gitdir, `objects/pack/${filename}`), packfile);
    return { filename }
  }
  return {
    filename,
    packfile: new Uint8Array(packfile),
  }
}

// @ts-check

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
async function packObjects({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oids,
  write = false,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oids', oids);

    return await _packObjects({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oids,
      write,
    })
  } catch (err) {
    err.caller = 'git.packObjects';
    throw err
  }
}

// @ts-check

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
 * @param {boolean} [args.prune = false] - Delete local remote-tracking branches that are not present on the remote
 * @param {boolean} [args.pruneTags = false] - Prune local tags that don’t exist on the remote, and force-update those tags that differ
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.fastForward = true] -  If false, only create merge commits.
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
async function pull({
  fs: _fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  url,
  remote,
  remoteRef,
  prune = false,
  pruneTags = false,
  fastForward = true,
  fastForwardOnly = false,
  corsProxy,
  singleBranch,
  headers = {},
  author: _author,
  committer: _committer,
  signingKey,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);

    const fs = new FileSystem(_fs);

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author });
    if (!author) throw new MissingNameError('author')

    const committer = await normalizeCommitterObject({
      fs,
      gitdir,
      author,
      committer: _committer,
    });
    if (!committer) throw new MissingNameError('committer')

    return await _pull({
      fs,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      dir,
      gitdir,
      ref,
      url,
      remote,
      remoteRef,
      fastForward,
      fastForwardOnly,
      corsProxy,
      singleBranch,
      headers,
      author,
      committer,
      signingKey,
      prune,
      pruneTags,
    })
  } catch (err) {
    err.caller = 'git.pull';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {PrePushCallback} [args.onPrePush]
 * @param {string} args.gitdir
 * @param {string} [args.ref]
 * @param {string} [args.remoteRef]
 * @param {string} [args.remote]
 * @param {boolean} [args.force = false]
 * @param {boolean} [args.delete = false]
 * @param {string} [args.url]
 * @param {string} [args.corsProxy]
 * @param {Object<string, string>} [args.headers]
 *
 * @returns {Promise<PushResult>}
 */
async function _push({
  fs,
  cache,
  http = { request },
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  onPrePush,
  gitdir,
  ref: _ref,
  remoteRef: _remoteRef,
  remote="",
  url: _url,
  force = false,
  delete: _delete = false,
  corsProxy,
  headers = {},
}) {
  const ref = _ref || (await _currentBranch({ fs, gitdir }));
  if (typeof ref === 'undefined') {
    throw new MissingParameterError('ref')
  }
  const config = await GitConfigManager.get({ fs, gitdir });
  // Figure out what remote to use.
  remote =
    remote ||
    (await config.get(`branch.${ref}.pushRemote`)) ||
    (await config.get('remote.pushDefault')) ||
    (await config.get(`branch.${ref}.remote`)) ||
    'origin';
  // Lookup the URL for the given remote.
  const url =
    _url ||
    (await config.get(`remote.${remote}.pushurl`)) ||
    (await config.get(`remote.${remote}.url`));
  if (typeof url === 'undefined') {
    throw new MissingParameterError('remote OR url')
  }
  // Figure out what remote ref to use.
  const remoteRef = _remoteRef || (await config.get(`branch.${ref}.merge`));
  if (typeof url === 'undefined') {
    throw new MissingParameterError('remoteRef')
  }

  if (corsProxy === undefined) {
    corsProxy = await config.get('http.corsProxy');
  }

  const fullRef = await GitRefManager.expand({ fs, gitdir, ref });
  const oid = _delete
    ? '0000000000000000000000000000000000000000'
    : await GitRefManager.resolve({ fs, gitdir, ref: fullRef });

  /** @type typeof import("../managers/GitRemoteHTTP").GitRemoteHTTP */
  const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url });
  const httpRemote = await GitRemoteHTTP.discover({
    http,
    onAuth,
    onAuthSuccess,
    onAuthFailure,
    corsProxy,
    service: 'git-receive-pack',
    url,
    headers,
    protocolVersion: 1,
  });
  const auth = httpRemote.auth; // hack to get new credentials from CredentialManager API
  let fullRemoteRef;
  if (!remoteRef) {
    fullRemoteRef = fullRef;
  } else {
    try {
      fullRemoteRef = await GitRefManager.expandAgainstMap({
        ref: remoteRef,
        map: httpRemote.refs,
      });
    } catch (err) {
      if (err instanceof NotFoundError) {
        // The remote reference doesn't exist yet.
        // If it is fully specified, use that value. Otherwise, treat it as a branch.
        fullRemoteRef = remoteRef.startsWith('refs/')
          ? remoteRef
          : `refs/heads/${remoteRef}`;
      } else {
        throw err
      }
    }
  }
  const oldoid =
    httpRemote.refs.get(fullRemoteRef) ||
    '0000000000000000000000000000000000000000';

  if (onPrePush) {
    const hookCancel = await onPrePush({
      remote,
      url,
      localRef: { ref: _delete ? '(delete)' : fullRef, oid: oid },
      remoteRef: { ref: fullRemoteRef, oid: oldoid },
    });
    if (!hookCancel) throw new UserCanceledError()
  }

  // Remotes can always accept thin-packs UNLESS they specify the 'no-thin' capability
  const thinPack = !httpRemote.capabilities.has('no-thin');

  let objects = new Set();
  if (!_delete) {
    const finish = [...httpRemote.refs.values()];
    let skipObjects = new Set();

    // If remote branch is present, look for a common merge base.
    if (oldoid !== '0000000000000000000000000000000000000000') {
      // trick to speed up common force push scenarios
      const mergebase = await _findMergeBase({
        fs,
        cache,
        gitdir,
        oids: [oid, oldoid],
      });
      for (const oid of mergebase) finish.push(oid);
      if (thinPack) {
        skipObjects = await listObjects({ fs, cache, gitdir, oids: mergebase });
      }
    }

    // If remote does not have the commit, figure out the objects to send
    if (!finish.includes(oid)) {
      const commits = await listCommitsAndTags({
        fs,
        cache,
        gitdir,
        start: [oid],
        finish,
      });
      objects = await listObjects({ fs, cache, gitdir, oids: commits });
    }

    if (thinPack) {
      // If there's a default branch for the remote lets skip those objects too.
      // Since this is an optional optimization, we just catch and continue if there is
      // an error (because we can't find a default branch, or can't find a commit, etc)
      try {
        // Sadly, the discovery phase with 'forPush' doesn't return symrefs, so we have to
        // rely on existing ones.
        const ref = await GitRefManager.resolve({
          fs,
          gitdir,
          ref: `refs/remotes/${remote}/HEAD`,
          depth: 2,
        });
        const { oid } = await GitRefManager.resolveAgainstMap({
          ref: ref.replace(`refs/remotes/${remote}/`, ''),
          fullref: ref,
          map: httpRemote.refs,
        });
        const oids = [oid];
        for (const oid of await listObjects({ fs, cache, gitdir, oids })) {
          skipObjects.add(oid);
        }
      } catch (e) {}

      // Remove objects that we know the remote already has
      for (const oid of skipObjects) {
        objects.delete(oid);
      }
    }

    if (oid === oldoid) force = true;
    if (!force) {
      // Is it a tag that already exists?
      if (
        fullRef.startsWith('refs/tags') &&
        oldoid !== '0000000000000000000000000000000000000000'
      ) {
        throw new PushRejectedError('tag-exists')
      }
      // Is it a non-fast-forward commit?
      if (
        oid !== '0000000000000000000000000000000000000000' &&
        oldoid !== '0000000000000000000000000000000000000000' &&
        !(await _isDescendent({
          fs,
          cache,
          gitdir,
          oid,
          ancestor: oldoid,
          depth: -1,
        }))
      ) {
        throw new PushRejectedError('not-fast-forward')
      }
    }
  }
  // We can only safely use capabilities that the server also understands.
  // For instance, AWS CodeCommit aborts a push if you include the `agent`!!!
  const capabilities = filterCapabilities(
    [...httpRemote.capabilities],
    ['report-status', 'side-band-64k', `agent=${pkg.agent}`]
  );
  const packstream1 = await writeReceivePackRequest({
    capabilities,
    // @ts-expect-error This things are not typed
    triplets: [{ 
      oldoid, oid, fullRef: fullRemoteRef 
    }],
  });
  const packstream2 = _delete
    ? []
    : await _pack({
        fs,
        cache,
        gitdir,
        oids: [...objects],
      });
  const res = await GitRemoteHTTP.connect({
    http,
    onProgress,
    corsProxy,
    service: 'git-receive-pack',
    url,
    auth,
    headers,
    body: [...packstream1, ...packstream2],
  });
  const { packfile, progress } = await GitSideBand.demux(res.body);
  if (onMessage) {
    const lines = splitLines(progress);
    forAwait(lines, async line => {
      await onMessage(line);
    });
  }
  // Parse the response!
  const result = await parseReceivePackResponse(packfile);
  if (res.headers) {
    result.headers = res.headers;
  }

  // Update the local copy of the remote ref
  if (
    remote &&
    result.ok &&
    result.refs[fullRemoteRef].ok &&
    !fullRef.startsWith('refs/tags')
  ) {
    // TODO: I think this should actually be using a refspec transform rather than assuming 'refs/remotes/{remote}'
    const ref = `refs/remotes/${remote}/${fullRemoteRef.replace(
      'refs/heads',
      ''
    )}`;
    if (_delete) {
      await GitRefManager.deleteRef({ fs, gitdir, ref });
    } else {
      await GitRefManager.writeRef({ fs, gitdir, ref, value: oid });
    }
  }
  if (result.ok && Object.values(result.refs).every(result => result.ok)) {
    return result
  } else {
    const prettyDetails = Object.entries(result.refs)
      .filter(([k, v]) => !v.ok)
      .map(([k, v]) => `\n  - ${k}: ${v.error}`)
      .join('');
    throw new GitPushError(prettyDetails, result)
  }
}

// @ts-check

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
 * @param {PrePushCallback} [args.onPrePush] - optional pre-push hook callback
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch or tag to push. By default this is the currently checked out branch.
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
async function push({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  onPrePush,
  dir,
  gitdir = join(dir||"", '.git'),
  ref,
  remoteRef,
  remote = 'origin',
  url,
  force = false,
  delete: _delete = false,
  corsProxy,
  headers = {},
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('http', http);
    assertParameter('gitdir', gitdir);

    return await _push({
      fs: new FileSystem(fs),
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      onPrePush,
      gitdir,
      ref,
      remoteRef,
      remote,
      url,
      force,
      delete: _delete,
      corsProxy,
      headers,
    })
  } catch (err) {
    err.caller = 'git.push';
    throw err
  }
}

async function resolveBlob({ fs, cache, gitdir, oid }) {
  const { type, object } = await _readObject({ fs, cache, gitdir, oid });
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object;
    return resolveBlob({ fs, cache, gitdir, oid })
  }
  if (type !== 'blob') {
    throw new ObjectTypeError(oid, type, 'blob')
  }
  return { oid, blob: new Uint8Array(object) }
}

// @ts-check

/**
 *
 * @typedef {Object} ReadBlobResult - The object returned has the following schema:
 * @property {string} oid
 * @property {Uint8Array} blob
 *
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} [args.filepath]
 *
 * @returns {Promise<ReadBlobResult>} Resolves successfully with a blob object description
 * @see ReadBlobResult
 */
async function _readBlob({
  fs,
  cache,
  gitdir,
  oid,
  filepath = undefined,
}) {
  if (filepath !== undefined) {
    oid = await resolveFilepath({ fs, cache, gitdir, oid, filepath });
  }
  const blob = await resolveBlob({
    fs,
    cache,
    gitdir,
    oid,
  });
  return blob
}

// @ts-check

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
async function readBlob({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  filepath,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);

    return await _readBlob({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
      filepath,
    })
  } catch (err) {
    err.caller = 'git.readBlob';
    throw err
  }
}

// @ts-check

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
async function readCommit({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);

    return await _readCommit({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
    })
  } catch (err) {
    err.caller = 'git.readCommit';
    throw err
  }
}

// @ts-check

/**
 * Read the contents of a note
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid
 *
 * @returns {Promise<Uint8Array>} Resolves successfully with note contents as a Buffer.
 */

async function _readNote({
  fs,
  cache,
  gitdir,
  ref = 'refs/notes/commits',
  oid,
}) {
  const parent = await GitRefManager.resolve({ gitdir, fs, ref });
  const { blob } = await _readBlob({
    fs,
    cache,
    gitdir,
    oid: parent,
    filepath: oid,
  });

  return blob
}

// @ts-check

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

async function readNote({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  oid,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);
    assertParameter('oid', oid);

    return await _readNote({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      ref,
      oid,
    })
  } catch (err) {
    err.caller = 'git.readNote';
    throw err
  }
}

// @ts-check

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
async function readObject({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  format = 'parsed',
  filepath = undefined,
  encoding = undefined,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);

    const fs = new FileSystem(_fs);
    if (filepath !== undefined) {
      oid = await resolveFilepath({
        fs,
        cache,
        gitdir,
        oid,
        filepath,
      });
    }
    // GitObjectManager does not know how to parse content, so we tweak that parameter before passing it.
    const _format = format === 'parsed' ? 'content' : format;
    const result = await _readObject({
      fs,
      cache,
      gitdir,
      oid,
      format: _format,
    });
    result.oid = oid;
    if (format === 'parsed') {
      result.format = 'parsed';
      switch (result.type) {
        case 'commit':
          result.object = GitCommit.from(result.object).parse();
          break
        case 'tree':
          result.object = GitTree.from(result.object).entries();
          break
        case 'blob':
          // Here we consider returning a raw Buffer as the 'content' format
          // and returning a string as the 'parsed' format
          if (encoding) {
            result.object = result.object.toString(encoding);
          } else {
            result.object = new Uint8Array(result.object);
            result.format = 'content';
          }
          break
        case 'tag':
          result.object = GitAnnotatedTag.from(result.object).parse();
          break
        default:
          throw new ObjectTypeError(
            result.oid,
            result.type,
            'blob|commit|tag|tree'
          )
      }
    } else if (result.format === 'deflated' || result.format === 'wrapped') {
      result.type = result.format;
    }
    return result
  } catch (err) {
    err.caller = 'git.readObject';
    throw err
  }
}

// @ts-check

/**
 *
 * @typedef {Object} ReadTagResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tag
 * @property {TagObject} tag - the parsed tag object
 * @property {string} payload - PGP signing payload
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 *
 * @returns {Promise<ReadTagResult>}
 */
async function _readTag({ fs, cache, gitdir, oid }) {
  const { type, object } = await _readObject({
    fs,
    cache,
    gitdir,
    oid,
    format: 'content',
  });
  if (type !== 'tag') {
    throw new ObjectTypeError(oid, type, 'tag')
  }
  const tag = GitAnnotatedTag.from(object);
  const result = {
    oid,
    tag: tag.parse(),
    payload: tag.payload(),
  };
  // @ts-ignore
  return result
}

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
async function readTag({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);

    return await _readTag({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
    })
  } catch (err) {
    err.caller = 'git.readTag';
    throw err
  }
}

// @ts-check

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
async function readTree({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  filepath = undefined,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);

    return await _readTree({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
      filepath,
    })
  } catch (err) {
    err.caller = 'git.readTree';
    throw err
  }
}

// @ts-check

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
async function remove({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('filepath', filepath);

    await GitIndexManager.acquire(
      { fs: new FileSystem(_fs), gitdir, cache },
      async function(index) {
        index.delete({ filepath });
      }
    );
  } catch (err) {
    err.caller = 'git.remove';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} [args.dir]
 * @param {string} [args.gitdir=join(dir,'.git')]
 * @param {string} [args.ref]
 * @param {string} args.oid
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey]
 *
 * @returns {Promise<string>}
 */

async function _removeNote({
  fs,
  cache,
  onSign,
  gitdir,
  ref = 'refs/notes/commits',
  oid,
  author,
  committer,
  signingKey,
}) {
  // Get the current note commit
  let parent;
  try {
    parent = await GitRefManager.resolve({ gitdir, fs, ref });
  } catch (err) {
    if (!(err instanceof NotFoundError)) {
      throw err
    }
  }

  // I'm using the "empty tree" magic number here for brevity
  const result = await _readTree({
    fs,
    gitdir,
    oid: parent || '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  });
  let tree = result.tree;

  // Remove the note blob entry from the tree
  tree = tree.filter(entry => entry.path !== oid);

  // Create the new note tree
  const treeOid = await _writeTree({
    fs,
    gitdir,
    tree,
  });

  // Create the new note commit
  const commitOid = await _commit({
    fs,
    cache,
    onSign,
    gitdir,
    ref,
    tree: treeOid,
    parent: parent && [parent],
    message: `Note removed by 'isomorphic-git removeNote'\n`,
    author,
    committer,
    signingKey,
  });

  return commitOid
}

// @ts-check

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

async function removeNote({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  oid,
  author: _author,
  committer: _committer,
  signingKey,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('oid', oid);

    const fs = new FileSystem(_fs);

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author });
    if (!author) throw new MissingNameError('author')

    const committer = await normalizeCommitterObject({
      fs,
      gitdir,
      author,
      committer: _committer,
    });
    if (!committer) throw new MissingNameError('committer')

    return await _removeNote({
      fs,
      cache,
      onSign,
      gitdir,
      ref,
      oid,
      author,
      committer,
      signingKey,
    })
  } catch (err) {
    err.caller = 'git.removeNote';
    throw err
  }
}

// @ts-check

/**
 * Rename a branch
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref - The name of the new branch
 * @param {string} args.oldref - The name of the old branch
 * @param {boolean} [args.checkout = false]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 */
async function _renameBranch({
  fs,
  gitdir,
  oldref,
  ref,
  checkout = false,
}) {
  if (ref !== cleanGitRef.clean(ref)) {
    throw new InvalidRefNameError(ref, cleanGitRef.clean(ref))
  }

  if (oldref !== cleanGitRef.clean(oldref)) {
    throw new InvalidRefNameError(oldref, cleanGitRef.clean(oldref))
  }

  const fulloldref = `refs/heads/${oldref}`;
  const fullnewref = `refs/heads/${ref}`;

  const newexist = await GitRefManager.exists({ fs, gitdir, ref: fullnewref });

  if (newexist) {
    throw new AlreadyExistsError('branch', ref, false)
  }

  const value = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: fulloldref,
    depth: 1,
  });

  await GitRefManager.writeRef({ fs, gitdir, ref: fullnewref, value });
  await GitRefManager.deleteRef({ fs, gitdir, ref: fulloldref });

  const fullCurrentBranchRef = await _currentBranch({
    fs,
    gitdir,
    fullname: true,
  });
  const isCurrentBranch = fullCurrentBranchRef === fulloldref;

  if (checkout || isCurrentBranch) {
    // Update HEAD
    await GitRefManager.writeSymbolicRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: fullnewref,
    });
  }
}

// @ts-check

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
async function renameBranch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  oldref,
  checkout = false,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);
    assertParameter('oldref', oldref);
    return await _renameBranch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
      oldref,
      checkout,
    })
  } catch (err) {
    err.caller = 'git.renameBranch';
    throw err
  }
}

async function hashObject({ gitdir, type, object }) {
  return shasum(GitObject.wrap({ type, object }))
}

// @ts-check

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
async function resetIndex({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  ref,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('filepath', filepath);

    const fs = new FileSystem(_fs);

    let oid;
    let workdirOid;

    try {
      // Resolve commit
      oid = await GitRefManager.resolve({ fs, gitdir, ref: ref || 'HEAD' });
    } catch (e) {
      if (ref) {
        // Only throw the error if a ref is explicitly provided
        throw e
      }
    }

    // Not having an oid at this point means `resetIndex()` was called without explicit `ref` on a new git
    // repository. If that happens, we can skip resolving the file path.
    if (oid) {
      try {
        // Resolve blob
        oid = await resolveFilepath({
          fs,
          cache,
          gitdir,
          oid,
          filepath,
        });
      } catch (e) {
        // This means we're resetting the file to a "deleted" state
        oid = null;
      }
    }

    // For files that aren't in the workdir use zeros
    let stats = {
      ctime: new Date(0),
      mtime: new Date(0),
      dev: 0,
      ino: 0,
      mode: 0,
      uid: 0,
      gid: 0,
      size: 0,
    };
    // If the file exists in the workdir...
    const object = dir && (await fs.read(join(dir, filepath)));
    if (object) {
      // ... and has the same hash as the desired state...
      workdirOid = await hashObject({
        gitdir,
        type: 'blob',
        object,
      });
      if (oid === workdirOid) {
        // ... use the workdir Stats object
        stats = await fs.lstat(join(dir, filepath));
      }
    }
    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      index.delete({ filepath });
      if (oid) {
        index.insert({ filepath, stats, oid });
      }
    });
  } catch (err) {
    err.caller = 'git.reset';
    throw err
  }
}

// @ts-check

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
async function resolveRef({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  depth,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);

    const oid = await GitRefManager.resolve({
      fs: new FileSystem(fs),
      gitdir,
      ref,
      depth,
    });
    return oid
  } catch (err) {
    err.caller = 'git.resolveRef';
    throw err
  }
}

// @ts-check

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
async function setConfig({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  path,
  value,
  append = false,
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('path', path);
    // assertParameter('value', value) // We actually allow 'undefined' as a value to unset/delete

    const fs = new FileSystem(_fs);
    const config = await GitConfigManager.get({ fs, gitdir });
    if (append) {
      await config.append(path, value);
    } else {
      await config.set(path, value);
    }
    await GitConfigManager.save({ fs, gitdir, config });
  } catch (err) {
    err.caller = 'git.setConfig';
    throw err
  }
}

// @ts-check

async function _stashPush({ fs, dir, gitdir, message = '' }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir });

  await stashMgr.getAuthor(); // ensure there is an author
  const branch = await _currentBranch({
    fs,
    gitdir,
    fullname: false,
  });

  // prepare the stash commit: first parent is the current branch HEAD
  const headCommit = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'HEAD',
  });

  const headCommitObj = await readCommit({ fs, dir, gitdir, oid: headCommit });
  const headMsg = headCommitObj.commit.message;

  const stashCommitParents = [headCommit];
  let stashCommitTree = null;
  let workDirCompareBase = TREE({ ref: 'HEAD' });

  const indexTree = await writeTreeChanges({
    fs,
    dir,
    gitdir,
    treePair: [TREE({ ref: 'HEAD' }), 'stage'],
  });
  if (indexTree) {
    // this indexTree will be the tree of the stash commit
    // create a commit from the index tree, which has one parent, the current branch HEAD
    const stashCommitOne = await stashMgr.writeStashCommit({
      message: `stash-Index: WIP on ${branch} - ${new Date().toISOString()}`,
      tree: indexTree, // stashCommitTree
      parent: stashCommitParents,
    });
    stashCommitParents.push(stashCommitOne);
    stashCommitTree = indexTree;
    workDirCompareBase = STAGE();
  }

  const workingTree = await writeTreeChanges({
    fs,
    dir,
    gitdir,
    treePair: [workDirCompareBase, 'workdir'],
  });
  if (workingTree) {
    // create a commit from the working directory tree, which has one parent, either the one we just had, or the headCommit
    const workingHeadCommit = await stashMgr.writeStashCommit({
      message: `stash-WorkDir: WIP on ${branch} - ${new Date().toISOString()}`,
      tree: workingTree,
      parent: [stashCommitParents[stashCommitParents.length - 1]],
    });

    stashCommitParents.push(workingHeadCommit);
    stashCommitTree = workingTree;
  }

  if (!stashCommitTree || (!indexTree && !workingTree)) {
    throw new NotFoundError('changes, nothing to stash')
  }

  // create another commit from the tree, which has three parents: HEAD and the commit we just made:
  const stashMsg =
    (message.trim() || `WIP on ${branch}`) +
    `: ${headCommit.substring(0, 7)} ${headMsg}`;

  const stashCommit = await stashMgr.writeStashCommit({
    message: stashMsg,
    tree: stashCommitTree,
    parent: stashCommitParents,
  });

  // next, write this commit into .git/refs/stash:
  await stashMgr.writeStashRef(stashCommit);

  // write the stash commit to the logs
  await stashMgr.writeStashReflogEntry({
    stashCommit,
    message: stashMsg,
  });

  // finally, go back to a clean working directory
  await checkout({
    fs,
    dir,
    gitdir,
    ref: branch,
    track: false,
    force: true, // force checkout to discard changes
  });

  return stashCommit
}

async function _stashApply({ fs, dir, gitdir, refIdx = 0 }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir });

  // get the stash commit object
  const stashCommit = await stashMgr.readStashCommit(refIdx);
  const { parent: stashParents = null } = stashCommit.commit
    ? stashCommit.commit
    : {};
  if (!stashParents || !Array.isArray(stashParents)) {
    return // no stash found
  }

  // compare the stash commit tree with its parent commit
  for (let i = 0; i < stashParents.length - 1; i++) {
    const applyingCommit = await _readCommit({
      fs,
      cache: {},
      gitdir,
      oid: stashParents[i + 1],
    });
    const wasStaged = applyingCommit.commit.message.startsWith('stash-Index');

    await applyTreeChanges({
      fs,
      dir,
      gitdir,
      stashCommit: stashParents[i + 1],
      parentCommit: stashParents[i],
      wasStaged,
    });
  }
}

async function _stashDrop({ fs, dir, gitdir, refIdx = 0 }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir });
  const stashCommit = await stashMgr.readStashCommit(refIdx);
  if (!stashCommit.commit) {
    return // no stash found
  }
  // remove stash ref first
  const stashRefPath = stashMgr.refStashPath;
  await acquireLock(stashRefPath, async () => {
    if (await fs.exists(stashRefPath)) {
      await fs.rm(stashRefPath);
    }
  });

  // read from stash reflog and list the stash commits
  const reflogEntries = await stashMgr.readStashReflogs({ parsed: false });
  if (!reflogEntries.length) {
    return // no stash reflog entry
  }

  // remove the specified stash reflog entry from reflogEntries, then update the stash reflog
  reflogEntries.splice(refIdx, 1);

  const stashReflogPath = stashMgr.refLogsStashPath;
  await acquireLock({ reflogEntries, stashReflogPath, stashMgr }, async () => {
    if (reflogEntries.length) {
      await fs.write(stashReflogPath, reflogEntries.join('\n'), 'utf8');
      const lastStashCommit = reflogEntries[reflogEntries.length - 1].split(
        ' '
      )[1];
      await stashMgr.writeStashRef(lastStashCommit);
    } else {
      // remove the stash reflog file if no entry left
      await fs.rm(stashReflogPath);
    }
  });
}

async function _stashList({ fs, dir, gitdir }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir });
  return stashMgr.readStashReflogs({ parsed: true })
}

async function _stashClear({ fs, dir, gitdir }) {
  const stashMgr = new GitStashManager({ fs, dir, gitdir });
  const stashRefPath = [stashMgr.refStashPath, stashMgr.refLogsStashPath];

  await acquireLock(stashRefPath, async () => {
    await Promise.all(
      stashRefPath.map(async path => {
        if (await fs.exists(path)) {
          return fs.rm(path)
        }
      })
    );
  });
}

async function _stashPop({ fs, dir, gitdir, refIdx = 0 }) {
  await _stashApply({ fs, dir, gitdir, refIdx });
  await _stashDrop({ fs, dir, gitdir, refIdx });
}

// @ts-check

/**
 * stash api, supports  {'push' | 'pop' | 'apply' | 'drop' | 'list' | 'clear'} StashOp
 * _note_,
 * - all stash operations are done on tracked files only with loose objects, no packed objects
 * - when op === 'push', both working directory and index (staged) changes will be stashed, tracked files only
 * - when op === 'push', message is optional, and only applicable when op === 'push'
 * - when op === 'apply | pop', the stashed changes will overwrite the working directory, no abort when conflicts
 *
 * @param {object} args
 * @param {FsClient} args.fs - [required] a file system client
 * @param {string} [args.dir] - [required] The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [optional] The [git directory](dir-vs-gitdir.md) path
 * @param {'push' | 'pop' | 'apply' | 'drop' | 'list' | 'clear'} [args.op = 'push'] - [optional] name of stash operation, default to 'push'
 * @param {string} [args.message = ''] - [optional] message to be used for the stash entry, only applicable when op === 'push'
 * @param {number} [args.refIdx = 0] - [optional - Number] stash ref index of entry, only applicable when op === ['apply' | 'drop' | 'pop'], refIdx >= 0 and < num of stash pushed
 * @returns {Promise<string | void>}  Resolves successfully when stash operations are complete
 *
 * @example
 * // stash changes in the working directory and index
 * let dir = '/tutorial'
 * await fs.promises.writeFile(`${dir}/a.txt`, 'original content - a')
 * await fs.promises.writeFile(`${dir}/b.js`, 'original content - b')
 * await git.add({ fs, dir, filepath: [`a.txt`,`b.txt`] })
 * let sha = await git.commit({
 *   fs,
 *   dir,
 *   author: {
 *     name: 'Mr. Stash',
 *     email: 'mstasher@stash.com',
 *   },
 *   message: 'add a.txt and b.txt to test stash'
 * })
 * console.log(sha)
 *
 * await fs.promises.writeFile(`${dir}/a.txt`, 'stashed chang- a')
 * await git.add({ fs, dir, filepath: `${dir}/a.txt` })
 * await fs.promises.writeFile(`${dir}/b.js`, 'work dir change. not stashed - b')
 *
 * await git.stash({ fs, dir }) // default gitdir and op
 *
 * console.log(await git.status({ fs, dir, filepath: 'a.txt' })) // 'unmodified'
 * console.log(await git.status({ fs, dir, filepath: 'b.txt' })) // 'unmodified'
 *
 * const refLog = await git.stash({ fs, dir, op: 'list' })
 * console.log(refLog) // [{stash{#} message}]
 *
 * await git.stash({ fs, dir, op: 'apply' }) // apply the stash
 *
 * console.log(await git.status({ fs, dir, filepath: 'a.txt' })) // 'modified'
 * console.log(await git.status({ fs, dir, filepath: 'b.txt' })) // '*modified'
 */

async function stash({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  op = 'push',
  message = '',
  refIdx = 0,
}) {
  assertParameter('fs', fs);
  assertParameter('dir', dir);
  assertParameter('gitdir', gitdir);
  assertParameter('op', op);

  const stashMap = {
    push: _stashPush,
    apply: _stashApply,
    drop: _stashDrop,
    list: _stashList,
    clear: _stashClear,
    pop: _stashPop,
  };

  const opsNeedRefIdx = ['apply', 'drop', 'pop'];

  try {
    const _fs = new FileSystem(fs);
    const folders = ['refs', 'logs', 'logs/refs'];
    folders
      .map(f => join(gitdir, f))
      .forEach(async folder => {
        if (!(await _fs.exists(folder))) {
          await _fs.mkdir(folder);
        }
      });

    const opFunc = stashMap[op];
    if (opFunc) {
      if (opsNeedRefIdx.includes(op) && refIdx < 0) {
        throw new InvalidRefNameError(
          `stash@${refIdx}`,
          'number that is in range of [0, num of stash pushed]'
        )
      }
      return await opFunc({ fs: _fs, dir, gitdir, message, refIdx })
    }
    throw new Error(`To be implemented: ${op}`)
  } catch (err) {
    err.caller = 'git.stash';
    throw err
  }
}

// @ts-check

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
async function status({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('filepath', filepath);

    const fs = new FileSystem(_fs);
    const ignored = await GitIgnoreManager.isIgnored({
      fs,
      gitdir,
      dir,
      filepath,
    });
    if (ignored) {
      return 'ignored'
    }
    const headTree = await getHeadTree({ fs, cache, gitdir });
    const treeOid = await getOidAtPath({
      fs,
      cache,
      gitdir,
      tree: headTree,
      path: filepath,
    });
    const indexEntry = await GitIndexManager.acquire(
      { fs, gitdir, cache },
      async function(index) {
        for (const entry of index) {
          if (entry.path === filepath) return entry
        }
        return null
      }
    );
    const stats = await fs.lstat(join(dir, filepath));

    const H = treeOid !== null; // head
    const I = indexEntry !== null; // index
    const W = stats !== null; // working dir

    const getWorkdirOid = async () => {
      if (I && !compareStats(indexEntry, stats)) {
        return indexEntry.oid
      } else {
        const object = await fs.read(join(dir, filepath));
        const workdirOid = await hashObject({
          gitdir,
          type: 'blob',
          object,
        });
        // If the oid in the index === working dir oid but stats differed update cache
        if (I && indexEntry.oid === workdirOid) {
          // and as long as our fs.stats aren't bad.
          // size of -1 happens over a BrowserFS HTTP Backend that doesn't serve Content-Length headers
          // (like the Karma webserver) because BrowserFS HTTP Backend uses HTTP HEAD requests to do fs.stat
          if (stats.size !== -1) {
            // We don't await this so we can return faster for one-off cases.
            GitIndexManager.acquire({ fs, gitdir, cache }, async function(
              index
            ) {
              index.insert({ filepath, stats, oid: workdirOid });
            });
          }
        }
        return workdirOid
      }
    };

    if (!H && !W && !I) return 'absent' // ---
    if (!H && !W && I) return '*absent' // -A-
    if (!H && W && !I) return '*added' // --A
    if (!H && W && I) {
      const workdirOid = await getWorkdirOid();
      // @ts-ignore
      return workdirOid === indexEntry.oid ? 'added' : '*added' // -AA : -AB
    }
    if (H && !W && !I) return 'deleted' // A--
    if (H && !W && I) {
      // @ts-ignore
      return treeOid === indexEntry.oid ? '*deleted' : '*deleted' // AA- : AB-
    }
    if (H && W && !I) {
      const workdirOid = await getWorkdirOid();
      return workdirOid === treeOid ? '*undeleted' : '*undeletemodified' // A-A : A-B
    }
    if (H && W && I) {
      const workdirOid = await getWorkdirOid();
      if (workdirOid === treeOid) {
        // @ts-ignore
        return workdirOid === indexEntry.oid ? 'unmodified' : '*unmodified' // AAA : ABA
      } else {
        // @ts-ignore
        return workdirOid === indexEntry.oid ? 'modified' : '*modified' // ABB : AAB
      }
    }
    /*
    ---
    -A-
    --A
    -AA
    -AB
    A--
    AA-
    AB-
    A-A
    A-B
    AAA
    ABA
    ABB
    AAB
    */
  } catch (err) {
    err.caller = 'git.status';
    throw err
  }
}

async function getOidAtPath({ fs, cache, gitdir, tree, path }) {
  if (typeof path === 'string') path = path.split('/');
  const dirname = path.shift();
  for (const entry of tree) {
    if (entry.path === dirname) {
      if (path.length === 0) {
        return entry.oid
      }
      const { type, object } = await _readObject({
        fs,
        cache,
        gitdir,
        oid: entry.oid,
      });
      if (type === 'tree') {
        const tree = GitTree.from(object);
        return getOidAtPath({ fs, cache, gitdir, tree, path })
      }
      if (type === 'blob') {
        throw new ObjectTypeError(entry.oid, type, 'blob', path.join('/'))
      }
    }
  }
  return null
}

async function getHeadTree({ fs, cache, gitdir }) {
  // Get the tree from the HEAD commit.
  let oid;
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' });
  } catch (e) {
    // Handle fresh branches with no commits
    if (e instanceof NotFoundError) {
      return []
    }
  }
  const { tree } = await _readTree({ fs, cache, gitdir, oid });
  return tree
}

// @ts-check

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
 *   ["j.txt", 1, 2, 0], // deleted, staged, with unstaged-modified changes (new file of the same name)
 *   ["k.txt", 1, 1, 0], // deleted, staged, with unstaged changes (new file of the same name)
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
 * @param {boolean} [args.ignored = false] - include ignored files in the result
 *
 * @returns {Promise<Array<StatusRow>>} Resolves with a status matrix, described below.
 * @see StatusRow
 */
async function statusMatrix({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'HEAD',
  filepaths = ['.'],
  filter,
  cache = {},
  ignored: shouldIgnore = false,
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);

    const fs = new FileSystem(_fs);
    return await _walk({
      fs,
      cache,
      dir,
      gitdir,
      trees: [TREE({ ref }), WORKDIR(), STAGE()],
      map: async function(filepath, [head, workdir, stage]) {
        // Ignore ignored files, but only if they are not already tracked.
        if (!head && !stage && workdir) {
          if (!shouldIgnore) {
            const isIgnored = await GitIgnoreManager.isIgnored({
              fs,
              dir,
              filepath,
            });
            if (isIgnored) {
              return null
            }
          }
        }
        // match against base paths
        if (!filepaths.some(base => worthWalking(filepath, base))) {
          return null
        }
        // Late filter against file names
        if (filter) {
          if (!filter(filepath)) return
        }

        const [headType, workdirType, stageType] = await Promise.all([
          head && head.type(),
          workdir && workdir.type(),
          stage && stage.type(),
        ]);

        const isBlob = [headType, workdirType, stageType].includes('blob');

        // For now, bail on directories unless the file is also a blob in another tree
        if ((headType === 'tree' || headType === 'special') && !isBlob) return
        if (headType === 'commit') return null

        if ((workdirType === 'tree' || workdirType === 'special') && !isBlob)
          return

        if (stageType === 'commit') return null
        if ((stageType === 'tree' || stageType === 'special') && !isBlob) return

        // Figure out the oids for files, using the staged oid for the working dir oid if the stats match.
        const headOid = headType === 'blob' ? await head.oid() : undefined;
        const stageOid = stageType === 'blob' ? await stage.oid() : undefined;
        let workdirOid;
        if (
          headType !== 'blob' &&
          workdirType === 'blob' &&
          stageType !== 'blob'
        ) {
          // We don't actually NEED the sha. Any sha will do
          // TODO: update this logic to handle N trees instead of just 3.
          workdirOid = '42';
        } else if (workdirType === 'blob') {
          workdirOid = await workdir.oid();
        }
        const entry = [undefined, headOid, workdirOid, stageOid];
        const result = entry.map(value => entry.indexOf(value));
        result.shift(); // remove leading undefined entry
        return [filepath, ...result]
      },
    })
  } catch (err) {
    err.caller = 'git.statusMatrix';
    throw err
  }
}

// @ts-check

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
async function tag({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  object,
  force = false,
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);

    const fs = new FileSystem(_fs);

    if (ref === undefined) {
      throw new MissingParameterError('ref')
    }

    ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`;

    // Resolve passed object
    const value = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: object || 'HEAD',
    });

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new AlreadyExistsError('tag', ref)
    }

    await GitRefManager.writeRef({ fs, gitdir, ref, value });
  } catch (err) {
    err.caller = 'git.tag';
    throw err
  }
}

// @ts-check

/**
 * Register file contents in the working tree or object database to the git index (aka staging area).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - File to act upon.
 * @param {string} [args.oid] - OID of the object in the object database to add to the index with the specified filepath.
 * @param {number} [args.mode = 100644] - The file mode to add the file to the index.
 * @param {boolean} [args.add] - Adds the specified file to the index if it does not yet exist in the index.
 * @param {boolean} [args.remove] - Remove the specified file from the index if it does not exist in the workspace anymore.
 * @param {boolean} [args.force] - Remove the specified file from the index, even if it still exists in the workspace.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<string | void>} Resolves successfully with the SHA-1 object id of the object written or updated in the index, or nothing if the file was removed.
 *
 * @example
 * await git.updateIndex({
 *   fs,
 *   dir: '/tutorial',
 *   filepath: 'readme.md'
 * })
 *
 * @example
 * // Manually create a blob in the object database.
 * let oid = await git.writeBlob({
 *   fs,
 *   dir: '/tutorial',
 *   blob: new Uint8Array([])
 * })
 *
 * // Write the object in the object database to the index.
 * await git.updateIndex({
 *   fs,
 *   dir: '/tutorial',
 *   add: true,
 *   filepath: 'readme.md',
 *   oid
 * })
 */
async function updateIndex({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  cache = {},
  filepath,
  oid,
  mode,
  add,
  remove,
  force,
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('filepath', filepath);

    const fs = new FileSystem(_fs);

    if (remove) {
      return await GitIndexManager.acquire(
        { fs, gitdir, cache },
        async function(index) {
          if (!force) {
            // Check if the file is still present in the working directory
            const fileStats = await fs.lstat(join(dir, filepath));

            if (fileStats) {
              if (fileStats.isDirectory()) {
                // Removing directories should not work
                throw new InvalidFilepathError('directory')
              }

              // Do nothing if we don't force and the file still exists in the workdir
              return
            }
          }

          // Directories are not allowed, so we make sure the provided filepath exists in the index
          if (index.has({ filepath })) {
            index.delete({
              filepath,
            });
          }
        }
      )
    }

    // Test if it is a file and exists on disk if `remove` is not provided, only of no oid is provided
    let fileStats;

    if (!oid) {
      fileStats = await fs.lstat(join(dir, filepath));

      if (!fileStats) {
        throw new NotFoundError(
          `file at "${filepath}" on disk and "remove" not set`
        )
      }

      if (fileStats.isDirectory()) {
        throw new InvalidFilepathError('directory')
      }
    }

    return await GitIndexManager.acquire({ fs, gitdir, cache }, async function(
      index
    ) {
      if (!add && !index.has({ filepath })) {
        // If the index does not contain the filepath yet and `add` is not set, we should throw
        throw new NotFoundError(
          `file at "${filepath}" in index and "add" not set`
        )
      }

      let stats;
      if (!oid) {
        stats = fileStats;

        // Write the file to the object database
        const object = stats.isSymbolicLink()
          ? await fs.readlink(join(dir, filepath))
          : await fs.read(join(dir, filepath));

        oid = await _writeObject({
          fs,
          gitdir,
          type: 'blob',
          format: 'content',
          object,
        });
      } else {
        // By default we use 0 for the stats of the index file
        stats = {
          ctime: new Date(0),
          mtime: new Date(0),
          dev: 0,
          ino: 0,
          mode,
          uid: 0,
          gid: 0,
          size: 0,
        };
      }

      index.insert({
        filepath,
        oid: oid,
        stats,
      });

      return oid
    })
  } catch (err) {
    err.caller = 'git.updateIndex';
    throw err
  }
}

// @ts-check

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
function version() {
  try {
    return pkg.version
  } catch (err) {
    err.caller = 'git.version';
    throw err
  }
}

// @ts-check

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
 * const map = async (filepath, [head, workdir]) => {
 *   return {
 *     filepath,
 *     oid: await head?.oid(),
 *     diff: diff(
 *       (await head?.content())?.toString('utf8') || '',
 *       (await workdir?.content())?.toString('utf8') || ''
 *     )
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
async function walk({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  trees,
  map,
  reduce,
  iterate,
  cache = {},
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('trees', trees);

    return await _walk({
      fs: new FileSystem(fs),
      cache,
      dir,
      gitdir,
      trees,
      map,
      reduce,
      iterate,
    })
  } catch (err) {
    err.caller = 'git.walk';
    throw err
  }
}

// @ts-check

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
async function writeBlob({ fs, dir, gitdir = join(dir, '.git'), blob }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('blob', blob);

    return await _writeObject({
      fs: new FileSystem(fs),
      gitdir,
      type: 'blob',
      object: blob,
      format: 'content',
    })
  } catch (err) {
    err.caller = 'git.writeBlob';
    throw err
  }
}

// @ts-check

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
async function writeCommit({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  commit,
}) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('commit', commit);

    return await _writeCommit({
      fs: new FileSystem(fs),
      gitdir,
      commit,
    })
  } catch (err) {
    err.caller = 'git.writeCommit';
    throw err
  }
}

// @ts-check

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
async function writeObject({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  type,
  object,
  format = 'parsed',
  oid,
  encoding = undefined,
}) {
  try {
    const fs = new FileSystem(_fs);
    // Convert object to buffer
    if (format === 'parsed') {
      switch (type) {
        case 'commit':
          object = GitCommit.from(object).toObject();
          break
        case 'tree':
          object = GitTree.from(object).toObject();
          break
        case 'blob':
          object = Buffer.from(object, encoding);
          break
        case 'tag':
          object = GitAnnotatedTag.from(object).toObject();
          break
        default:
          throw new ObjectTypeError(oid || '', type, 'blob|commit|tag|tree')
      }
      // GitObjectManager does not know how to serialize content, so we tweak that parameter before passing it.
      format = 'content';
    }
    oid = await _writeObject({
      fs,
      gitdir,
      type,
      object,
      oid,
      format,
    });
    return oid
  } catch (err) {
    err.caller = 'git.writeObject';
    throw err
  }
}

// @ts-check

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
async function writeRef({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  value,
  force = false,
  symbolic = false,
}) {
  try {
    assertParameter('fs', _fs);
    assertParameter('gitdir', gitdir);
    assertParameter('ref', ref);
    assertParameter('value', value);

    const fs = new FileSystem(_fs);

    if (ref !== cleanGitRef.clean(ref)) {
      throw new InvalidRefNameError(ref, cleanGitRef.clean(ref))
    }

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new AlreadyExistsError('ref', ref)
    }

    if (symbolic) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir,
        ref,
        value,
      });
    } else {
      value = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: value,
      });
      await GitRefManager.writeRef({
        fs,
        gitdir,
        ref,
        value,
      });
    }
  } catch (err) {
    err.caller = 'git.writeRef';
    throw err
  }
}

// @ts-check

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {TagObject} args.tag
 *
 * @returns {Promise<string>}
 */
async function _writeTag({ fs, gitdir, tag }) {
  // Convert object to buffer
  const object = GitAnnotatedTag.from(tag).toObject();
  const oid = await _writeObject({
    fs,
    gitdir,
    type: 'tag',
    object,
    format: 'content',
  });
  return oid
}

// @ts-check

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
async function writeTag({ fs, dir, gitdir = join(dir, '.git'), tag }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('tag', tag);

    return await _writeTag({
      fs: new FileSystem(fs),
      gitdir,
      tag,
    })
  } catch (err) {
    err.caller = 'git.writeTag';
    throw err
  }
}

// @ts-check

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
async function writeTree({ fs, dir, gitdir = join(dir, '.git'), tree }) {
  try {
    assertParameter('fs', fs);
    assertParameter('gitdir', gitdir);
    assertParameter('tree', tree);

    return await _writeTree({
      fs: new FileSystem(fs),
      gitdir,
      tree,
    })
  } catch (err) {
    err.caller = 'git.writeTree';
    throw err
  }
}

export { STAGE, TREE, WORKDIR, abortMerge, add, addNote, addRemote, annotatedTag, branch, checkout, clone, commit, currentBranch, deleteBranch, deleteRef, deleteRemote, deleteTag, expandOid, expandRef, fastForward, fetch, findMergeBase, findRoot, getConfig, getConfigAll, getRemoteInfo, getRemoteInfo2, hashBlob, indexPack, init, isDescendent, isIgnored, listBranches, listFiles, listNotes, listRefs, listRemotes, listServerRefs, listTags, log, merge, packObjects, pull, push, readBlob, readCommit, readNote, readObject, readTag, readTree, remove, removeNote, renameBranch, resetIndex, resolveRef, setConfig, stash, status, statusMatrix, tag, updateIndex, version, walk, writeBlob, writeCommit, writeObject, writeRef, writeTag, writeTree };
