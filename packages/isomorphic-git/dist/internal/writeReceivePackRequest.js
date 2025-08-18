import { _getConfig, assignDefined, GitPktLine, forAwait, InvalidOidError, TREE, _walk, basename, MergeNotSupportedError, GitTree, _writeObject, MergeConflictError, padHex, deflate, _readObject, GitShallowManager, GitRefManager, GitAnnotatedTag, ObjectTypeError, GitCommit, ParseError } from './GitShallowManager.js';
import '@isomorphic-git/types';
import { join } from './join.js';
import diff3Merge from 'diff3';
import Hash from 'sha.js/sha1.js';

// @ts-check
/**
 *
 * @param {WalkerEntry} entry
 * @param {WalkerEntry} base
 *
 */
async function modified(entry, base) {
  if (!entry && !base) return false
  if (entry && !base) return true
  if (!entry && base) return true
  if ((await entry.type()) === 'tree' && (await base.type()) === 'tree') {
    return false
  }
  if (
    (await entry.type()) === (await base.type()) &&
    (await entry.mode()) === (await base.mode()) &&
    (await entry.oid()) === (await base.oid())
  ) {
    return false
  }
  return true
}

/**
 * Return committer object by using properties with this priority:
 * (1) provided committer object
 * -> (2) provided author object
 * -> (3) committer of provided commit object
 * -> (4) Config and current date/time
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {Object} [args.author] - The author object.
 * @param {Object} [args.committer] - The committer object.
 * @param {CommitObject} [args.commit] - A commit object.
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
async function normalizeCommitterObject({
  fs,
  gitdir,
  author,
  committer,
  commit,
}) {
  const timestamp = Math.floor(Date.now() / 1000);

  const defaultCommitter = {
    name: await _getConfig({ fs, gitdir, path: 'user.name' }),
    email: (await _getConfig({ fs, gitdir, path: 'user.email' })) || '', // committer.email is allowed to be empty string
    timestamp,
    timezoneOffset: new Date(timestamp * 1000).getTimezoneOffset(),
  };

  const normalizedCommitter = assignDefined(
    {},
    defaultCommitter,
    commit ? commit.committer : undefined,
    author,
    committer
  );

  if (normalizedCommitter.name === undefined) {
    return undefined
  }
  return normalizedCommitter
}

const pkg = {
  name: 'isomorphic-git',
  version: '0.0.0-development',
  agent: 'git/isomorphic-git@0.0.0-development',
};

class FIFO {
  constructor() {
    this._queue = [];
  }

  write(chunk) {
    if (this._ended) {
      throw Error('You cannot write to a FIFO that has already been ended!')
    }
    if (this._waiting) {
      const resolve = this._waiting;
      this._waiting = null;
      resolve({ value: chunk });
    } else {
      this._queue.push(chunk);
    }
  }

  end() {
    this._ended = true;
    if (this._waiting) {
      const resolve = this._waiting;
      this._waiting = null;
      resolve({ done: true });
    }
  }

  destroy(err) {
    this.error = err;
    this.end();
  }

  async next() {
    if (this._queue.length > 0) {
      return { value: this._queue.shift() }
    }
    if (this._ended) {
      return { done: true }
    }
    if (this._waiting) {
      throw Error(
        'You cannot call read until the previous call to read has returned!'
      )
    }
    return new Promise(resolve => {
      this._waiting = resolve;
    })
  }
}

/*
If 'side-band' or 'side-band-64k' capabilities have been specified by
the client, the server will send the packfile data multiplexed.

Each packet starting with the packet-line length of the amount of data
that follows, followed by a single byte specifying the sideband the
following data is coming in on.

In 'side-band' mode, it will send up to 999 data bytes plus 1 control
code, for a total of up to 1000 bytes in a pkt-line.  In 'side-band-64k'
mode it will send up to 65519 data bytes plus 1 control code, for a
total of up to 65520 bytes in a pkt-line.

The sideband byte will be a '1', '2' or a '3'. Sideband '1' will contain
packfile data, sideband '2' will be used for progress information that the
client will generally print to stderr and sideband '3' is used for error
information.

If no 'side-band' capability was specified, the server will stream the
entire packfile without multiplexing.
*/

class GitSideBand {
  static demux(input) {
    const read = GitPktLine.streamReader(input);
    // And now for the ridiculous side-band or side-band-64k protocol
    const packetlines = new FIFO();
    const packfile = new FIFO();
    const progress = new FIFO();
    // TODO: Use a proper through stream?
    const nextBit = async function() {
      const line = await read();
      // Skip over flush packets
      if (line === null) return nextBit()
      // A made up convention to signal there's no more to read.
      if (line === true) {
        packetlines.end();
        progress.end();
        input.error ? packfile.destroy(input.error) : packfile.end();
        return
      }
      // Examine first byte to determine which output "stream" to use
      switch (line[0]) {
        case 1: {
          // pack data
          packfile.write(line.slice(1));
          break
        }
        case 2: {
          // progress message
          progress.write(line.slice(1));
          break
        }
        case 3: {
          // fatal error message just before stream aborts
          const error = line.slice(1);
          progress.write(error);
          packetlines.end();
          progress.end();
          packfile.destroy(new Error(error.toString('utf8')));
          return
        }
        default: {
          // Not part of the side-band-64k protocol
          packetlines.write(line);
        }
      }
      // Careful not to blow up the stack.
      // I think Promises in a tail-call position should be OK.
      nextBit();
    };
    nextBit();
    return {
      packetlines,
      packfile,
      progress,
    }
  }
  // static mux ({
  //   protocol, // 'side-band' or 'side-band-64k'
  //   packetlines,
  //   packfile,
  //   progress,
  //   error
  // }) {
  //   const MAX_PACKET_LENGTH = protocol === 'side-band-64k' ? 999 : 65519
  //   let output = new PassThrough()
  //   packetlines.on('data', data => {
  //     if (data === null) {
  //       output.write(GitPktLine.flush())
  //     } else {
  //       output.write(GitPktLine.encode(data))
  //     }
  //   })
  //   let packfileWasEmpty = true
  //   let packfileEnded = false
  //   let progressEnded = false
  //   let errorEnded = false
  //   let goodbye = Buffer.concat([
  //     GitPktLine.encode(Buffer.from('010A', 'hex')),
  //     GitPktLine.flush()
  //   ])
  //   packfile
  //     .on('data', data => {
  //       packfileWasEmpty = false
  //       const buffers = splitBuffer(data, MAX_PACKET_LENGTH)
  //       for (const buffer of buffers) {
  //         output.write(
  //           GitPktLine.encode(Buffer.concat([Buffer.from('01', 'hex'), buffer]))
  //         )
  //       }
  //     })
  //     .on('end', () => {
  //       packfileEnded = true
  //       if (!packfileWasEmpty) output.write(goodbye)
  //       if (progressEnded && errorEnded) output.end()
  //     })
  //   progress
  //     .on('data', data => {
  //       const buffers = splitBuffer(data, MAX_PACKET_LENGTH)
  //       for (const buffer of buffers) {
  //         output.write(
  //           GitPktLine.encode(Buffer.concat([Buffer.from('02', 'hex'), buffer]))
  //         )
  //       }
  //     })
  //     .on('end', () => {
  //       progressEnded = true
  //       if (packfileEnded && errorEnded) output.end()
  //     })
  //   error
  //     .on('data', data => {
  //       const buffers = splitBuffer(data, MAX_PACKET_LENGTH)
  //       for (const buffer of buffers) {
  //         output.write(
  //           GitPktLine.encode(Buffer.concat([Buffer.from('03', 'hex'), buffer]))
  //         )
  //       }
  //     })
  //     .on('end', () => {
  //       errorEnded = true
  //       if (progressEnded && packfileEnded) output.end()
  //     })
  //   return output
  // }
}

async function parseUploadPackResponse(stream) {
  const { packetlines, packfile, progress } = GitSideBand.demux(stream);
  const shallows = [];
  const unshallows = [];
  const acks = [];
  let nak = false;
  let done = false;
  return new Promise((resolve, reject) => {
    // Parse the response
    forAwait(packetlines, data => {
      const line = data.toString('utf8').trim();
      if (line.startsWith('shallow')) {
        const oid = line.slice(-41).trim();
        if (oid.length !== 40) {
          reject(new InvalidOidError(oid));
        }
        shallows.push(oid);
      } else if (line.startsWith('unshallow')) {
        const oid = line.slice(-41).trim();
        if (oid.length !== 40) {
          reject(new InvalidOidError(oid));
        }
        unshallows.push(oid);
      } else if (line.startsWith('ACK')) {
        const [, oid, status] = line.split(' ');
        acks.push({ oid, status });
        if (!status) done = true;
      } else if (line.startsWith('NAK')) {
        nak = true;
        done = true;
      } else {
        done = true;
        nak = true;
      }
      if (done) {
        stream.error
          ? reject(stream.error)
          : resolve({ shallows, unshallows, acks, nak, packfile, progress });
      }
    }).finally(() => {
      if (!done) {
        stream.error
          ? reject(stream.error)
          : resolve({ shallows, unshallows, acks, nak, packfile, progress });
      }
    });
  })
}

function writeUploadPackRequest({
  capabilities = [],
  wants = [],
  haves = [],
  shallows = [],
  depth = null,
  since = null,
  exclude = [],
}) {
  const packstream = [];
  wants = [...new Set(wants)]; // remove duplicates
  let firstLineCapabilities = ` ${capabilities.join(' ')}`;
  for (const oid of wants) {
    packstream.push(GitPktLine.encode(`want ${oid}${firstLineCapabilities}\n`));
    firstLineCapabilities = '';
  }
  for (const oid of shallows) {
    packstream.push(GitPktLine.encode(`shallow ${oid}\n`));
  }
  if (depth !== null) {
    packstream.push(GitPktLine.encode(`deepen ${depth}\n`));
  }
  if (since !== null) {
    packstream.push(
      GitPktLine.encode(`deepen-since ${Math.floor(since.valueOf() / 1000)}\n`)
    );
  }
  for (const oid of exclude) {
    packstream.push(GitPktLine.encode(`deepen-not ${oid}\n`));
  }
  packstream.push(GitPktLine.flush());
  for (const oid of haves) {
    packstream.push(GitPktLine.encode(`have ${oid}\n`));
  }
  packstream.push(GitPktLine.encode(`done\n`));
  return packstream
}

const LINEBREAKS = /^.*(\r?\n|$)/gm;

function mergeFile({ branches, contents }) {
  const ourName = branches[1];
  const theirName = branches[2];

  const baseContent = contents[0];
  const ourContent = contents[1];
  const theirContent = contents[2];

  const ours = ourContent.match(LINEBREAKS);
  const base = baseContent.match(LINEBREAKS);
  const theirs = theirContent.match(LINEBREAKS);

  // Here we let the diff3 library do the heavy lifting.
  const result = diff3Merge(ours, base, theirs);

  const markerSize = 7;

  // Here we note whether there are conflicts and format the results
  let mergedText = '';
  let cleanMerge = true;

  for (const item of result) {
    if (item.ok) {
      mergedText += item.ok.join('');
    }
    if (item.conflict) {
      cleanMerge = false;
      mergedText += `${'<'.repeat(markerSize)} ${ourName}\n`;
      mergedText += item.conflict.a.join('');

      mergedText += `${'='.repeat(markerSize)}\n`;
      mergedText += item.conflict.b.join('');
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`;
    }
  }
  return { cleanMerge, mergedText }
}

// @ts-check

/**
 * Create a merged tree
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ourOid - The SHA-1 object id of our tree
 * @param {string} args.baseOid - The SHA-1 object id of the base tree
 * @param {string} args.theirOid - The SHA-1 object id of their tree
 * @param {string} [args.ourName='ours'] - The name to use in conflicted files for our hunks
 * @param {string} [args.baseName='base'] - The name to use in conflicted files (in diff3 format) for the base hunks
 * @param {string} [args.theirName='theirs'] - The name to use in conflicted files for their hunks
 * @param {boolean} [args.dryRun=false]
 * @param {boolean} [args.abortOnConflict=false]
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 * @returns {Promise<string>} - The SHA-1 object id of the merged tree
 *
 */
async function mergeTree({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  index,
  ourOid,
  baseOid,
  theirOid,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  dryRun = false,
  abortOnConflict = true,
  mergeDriver,
}) {
  const ourTree = TREE({ ref: ourOid });
  const baseTree = TREE({ ref: baseOid });
  const theirTree = TREE({ ref: theirOid });

  const unmergedFiles = [];
  const bothModified = [];
  const deleteByUs = [];
  const deleteByTheirs = [];

  const results = await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [ourTree, baseTree, theirTree],
    map: async function(filepath, [ours, base, theirs]) {
      const path = basename(filepath);
      // What we did, what they did
      const ourChange = await modified(ours, base);
      const theirChange = await modified(theirs, base);
      switch (`${ourChange}-${theirChange}`) {
        case 'false-false': {
          return {
            mode: await base.mode(),
            path,
            oid: await base.oid(),
            type: await base.type(),
          }
        }
        case 'false-true': {
          // if directory is deleted in theirs but not in ours we return our directory
          if (!theirs && (await ours.type()) === 'tree') {
            return {
              mode: await ours.mode(),
              path,
              oid: await ours.oid(),
              type: await ours.type(),
            }
          }

          return theirs
            ? {
                mode: await theirs.mode(),
                path,
                oid: await theirs.oid(),
                type: await theirs.type(),
              }
            : undefined
        }
        case 'true-false': {
          // if directory is deleted in ours but not in theirs we return their directory
          if (!ours && (await theirs.type()) === 'tree') {
            return {
              mode: await theirs.mode(),
              path,
              oid: await theirs.oid(),
              type: await theirs.type(),
            }
          }

          return ours
            ? {
                mode: await ours.mode(),
                path,
                oid: await ours.oid(),
                type: await ours.type(),
              }
            : undefined
        }
        case 'true-true': {
          // Handle tree-tree merges (directories)
          if (
            ours &&
            theirs &&
            (await ours.type()) === 'tree' &&
            (await theirs.type()) === 'tree'
          ) {
            return {
              mode: await ours.mode(),
              path,
              oid: await ours.oid(),
              type: 'tree',
            }
          }

          // Modifications - both are blobs
          if (
            ours &&
            theirs &&
            (await ours.type()) === 'blob' &&
            (await theirs.type()) === 'blob'
          ) {
            return mergeBlobs({
              fs,
              gitdir,
              path,
              ours,
              base,
              theirs,
              ourName,
              baseName,
              theirName,
              mergeDriver,
            }).then(async r => {
              if (!r.cleanMerge) {
                unmergedFiles.push(filepath);
                bothModified.push(filepath);
                if (!abortOnConflict) {
                  let baseOid = '';
                  if (base && (await base.type()) === 'blob') {
                    baseOid = await base.oid();
                  }
                  const ourOid = await ours.oid();
                  const theirOid = await theirs.oid();

                  index.delete({ filepath });

                  if (baseOid) {
                    index.insert({ filepath, oid: baseOid, stage: 1 });
                  }
                  index.insert({ filepath, oid: ourOid, stage: 2 });
                  index.insert({ filepath, oid: theirOid, stage: 3 });
                }
              } else if (!abortOnConflict) {
                index.insert({ filepath, oid: r.mergeResult.oid, stage: 0 });
              }
              return r.mergeResult
            })
          }

          // deleted by us
          if (
            base &&
            !ours &&
            theirs &&
            (await base.type()) === 'blob' &&
            (await theirs.type()) === 'blob'
          ) {
            unmergedFiles.push(filepath);
            deleteByUs.push(filepath);
            if (!abortOnConflict) {
              const baseOid = await base.oid();
              const theirOid = await theirs.oid();

              index.delete({ filepath });

              index.insert({ filepath, oid: baseOid, stage: 1 });
              index.insert({ filepath, oid: theirOid, stage: 3 });
            }

            return {
              mode: await theirs.mode(),
              oid: await theirs.oid(),
              type: 'blob',
              path,
            }
          }

          // deleted by theirs
          if (
            base &&
            ours &&
            !theirs &&
            (await base.type()) === 'blob' &&
            (await ours.type()) === 'blob'
          ) {
            unmergedFiles.push(filepath);
            deleteByTheirs.push(filepath);
            if (!abortOnConflict) {
              const baseOid = await base.oid();
              const ourOid = await ours.oid();

              index.delete({ filepath });

              index.insert({ filepath, oid: baseOid, stage: 1 });
              index.insert({ filepath, oid: ourOid, stage: 2 });
            }

            return {
              mode: await ours.mode(),
              oid: await ours.oid(),
              type: 'blob',
              path,
            }
          }

          // deleted by both
          if (
            base &&
            !ours &&
            !theirs &&
            ((await base.type()) === 'blob' || (await base.type()) === 'tree')
          ) {
            return undefined
          }

          // all other types of conflicts fail
          // TODO: Merge conflicts involving additions
          throw new MergeNotSupportedError()
        }
      }
    },
    /**
     * @param {TreeEntry} [parent]
     * @param {Array<TreeEntry>} children
     */
    reduce:
      unmergedFiles.length !== 0 && (!dir || abortOnConflict)
        ? undefined
        : async (parent, children) => {
            const entries = children.filter(Boolean); // remove undefineds

            // if the parent was deleted, the children have to go
            if (!parent) return

            // automatically delete directories if they have been emptied
            // except for the root directory
            if (
              parent &&
              parent.type === 'tree' &&
              entries.length === 0 &&
              parent.path !== '.'
            )
              return

            if (
              entries.length > 0 ||
              (parent.path === '.' && entries.length === 0)
            ) {
              const tree = new GitTree(entries);
              const object = tree.toObject();
              const oid = await _writeObject({
                fs,
                gitdir,
                type: 'tree',
                object,
                dryRun,
              });
              parent.oid = oid;
            }
            return parent
          },
  });

  if (unmergedFiles.length !== 0) {
    if (dir && !abortOnConflict) {
      await _walk({
        fs,
        cache,
        dir,
        gitdir,
        trees: [TREE({ ref: results.oid })],
        map: async function(filepath, [entry]) {
          const path = `${dir}/${filepath}`;
          if ((await entry.type()) === 'blob') {
            const mode = await entry.mode();
            const content = new TextDecoder().decode(await entry.content());
            await fs.write(path, content, { mode });
          }
          return true
        },
      });
    }
    return new MergeConflictError(
      unmergedFiles,
      bothModified,
      deleteByUs,
      deleteByTheirs
    )
  }

  return results.oid
}

/**
 *
 * @param {Object} args
 * @param {import('../models/FileSystem').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.path
 * @param {WalkerEntry} args.ours
 * @param {WalkerEntry} args.base
 * @param {WalkerEntry} args.theirs
 * @param {string} [args.ourName]
 * @param {string} [args.baseName]
 * @param {string} [args.theirName]
 * @param {boolean} [args.dryRun = false]
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 */
async function mergeBlobs({
  fs,
  gitdir,
  path,
  ours,
  base,
  theirs,
  ourName,
  theirName,
  baseName,
  dryRun,
  mergeDriver = mergeFile,
}) {
  const type = 'blob';
  // Compute the new mode.
  // Since there are ONLY two valid blob modes ('100755' and '100644') it boils down to this
  let baseMode = '100755';
  let baseOid = '';
  let baseContent = '';
  if (base && (await base.type()) === 'blob') {
    baseMode = await base.mode();
    baseOid = await base.oid();
    baseContent = Buffer.from(await base.content()).toString('utf8');
  }
  const mode =
    baseMode === (await ours.mode()) ? await theirs.mode() : await ours.mode();
  // The trivial case: nothing to merge except maybe mode
  if ((await ours.oid()) === (await theirs.oid())) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // if only one side made oid changes, return that side's oid
  if ((await ours.oid()) === baseOid) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await theirs.oid(), type },
    }
  }
  if ((await theirs.oid()) === baseOid) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // if both sides made changes do a merge
  const ourContent = Buffer.from(await ours.content()).toString('utf8');
  const theirContent = Buffer.from(await theirs.content()).toString('utf8');
  const { mergedText, cleanMerge } = await mergeDriver({
    branches: [baseName, ourName, theirName],
    contents: [baseContent, ourContent, theirContent],
    path,
  });
  const oid = await _writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: Buffer.from(mergedText, 'utf8'),
    dryRun,
  });

  return { cleanMerge, mergeResult: { mode, path, oid, type } }
}

/**
 * @enum {number}
 */
const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000,
  ofs_delta: 0b1100000,
  ref_delta: 0b1110000,
};

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids
 */
async function _pack({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  oids,
}) {
  const hash = new Hash();
  const outputStream = [];
  function write(chunk, enc) {
    const buff = Buffer.from(chunk, enc);
    outputStream.push(buff);
    hash.update(buff);
  }
  async function writeObject({ stype, object }) {
    // Object type is encoded in bits 654
    const type = types[stype];
    // The length encoding gets complicated.
    let length = object.length;
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    let multibyte = length > 0b1111 ? 0b10000000 : 0b0;
    // Last four bits of length is encoded in bits 3210
    const lastFour = length & 0b1111;
    // Discard those bits
    length = length >>> 4;
    // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
    let byte = (multibyte | type | lastFour).toString(16);
    write(byte, 'hex');
    // Now we keep chopping away at length 7-bits at a time until its zero,
    // writing out the bytes in what amounts to little-endian order.
    while (multibyte) {
      multibyte = length > 0b01111111 ? 0b10000000 : 0b0;
      byte = multibyte | (length & 0b01111111);
      write(padHex(2, byte), 'hex');
      length = length >>> 7;
    }
    // Lastly, we can compress and write the object.
    write(Buffer.from(await deflate(object)));
  }
  write('PACK');
  write('00000002', 'hex');
  // Write a 4 byte (32-bit) int
  write(padHex(8, oids.length), 'hex');
  for (const oid of oids) {
    const { type, object } = await _readObject({ fs, cache, gitdir, oid });
    await writeObject({ write, object, stype: type });
  }
  // Write SHA1 checksum
  const digest = hash.digest();
  outputStream.push(digest);
  return outputStream
}

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {Iterable<string>} args.start
 * @param {Iterable<string>} args.finish
 * @returns {Promise<Set<string>>}
 */
async function listCommitsAndTags({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  start,
  finish,
}) {
  const shallows = await GitShallowManager.read({ fs, gitdir });
  const startingSet = new Set();
  const finishingSet = new Set();
  for (const ref of start) {
    startingSet.add(await GitRefManager.resolve({ fs, gitdir, ref }));
  }
  for (const ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      const oid = await GitRefManager.resolve({ fs, gitdir, ref });
      finishingSet.add(oid);
    } catch (err) {}
  }
  const visited = new Set();
  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk(oid) {
    visited.add(oid);
    const { type, object } = await _readObject({ fs, cache, gitdir, oid });
    // Recursively resolve annotated tags
    if (type === 'tag') {
      const tag = GitAnnotatedTag.from(object);
      const commit = tag.headers().object;
      return walk(commit)
    }
    if (type !== 'commit') {
      throw new ObjectTypeError(oid, type, 'commit')
    }
    if (!shallows.has(oid)) {
      const commit = GitCommit.from(object);
      const parents = commit.headers().parent;
      for (oid of parents) {
        if (!finishingSet.has(oid) && !visited.has(oid)) {
          await walk(oid);
        }
      }
    }
  }
  // Let's go walking!
  for (const oid of startingSet) {
    await walk(oid);
  }
  return visited
}

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {Iterable<string>} args.oids
 * @returns {Promise<Set<string>>}
 */
async function listObjects({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  oids,
}) {
  const visited = new Set();
  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk(oid) {
    if (visited.has(oid)) return
    visited.add(oid);
    const { type, object } = await _readObject({ fs, cache, gitdir, oid });
    if (type === 'tag') {
      const tag = GitAnnotatedTag.from(object);
      const obj = tag.headers().object;
      await walk(obj);
    } else if (type === 'commit') {
      const commit = GitCommit.from(object);
      const tree = commit.headers().tree;
      await walk(tree);
    } else if (type === 'tree') {
      const tree = GitTree.from(object);
      for (const entry of tree) {
        // add blobs to the set
        // skip over submodules whose type is 'commit'
        if (entry.type === 'blob') {
          visited.add(entry.oid);
        }
        // recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid);
        }
      }
    }
  }
  // Let's go walking!
  for (const oid of oids) {
    await walk(oid);
  }
  return visited
}

async function parseReceivePackResponse(packfile) {
  /** @type PushResult */
  const result = {};
  let response = '';
  const read = GitPktLine.streamReader(packfile);
  let line = await read();
  while (line !== true) {
    if (line !== null) response += line.toString('utf8') + '\n';
    line = await read();
  }

  const lines = response.toString('utf8').split('\n');
  // We're expecting "unpack {unpack-result}"
  line = lines.shift();
  if (!line.startsWith('unpack ')) {
    throw new ParseError('unpack ok" or "unpack [error message]', line)
  }
  result.ok = line === 'unpack ok';
  if (!result.ok) {
    result.error = line.slice('unpack '.length);
  }
  result.refs = {};
  for (const line of lines) {
    if (line.trim() === '') continue
    const status = line.slice(0, 2);
    const refAndMessage = line.slice(3);
    let space = refAndMessage.indexOf(' ');
    if (space === -1) space = refAndMessage.length;
    const ref = refAndMessage.slice(0, space);
    const error = refAndMessage.slice(space + 1);
    result.refs[ref] = {
      ok: status === 'ok',
      error,
    };
  }
  return result
}

async function writeReceivePackRequest({
  capabilities = [],
  triplets = [],
}) {
  const packstream = [];
  let capsFirstLine = `\x00 ${capabilities.join(' ')}`;
  for (const trip of triplets) {
    packstream.push(
      GitPktLine.encode(
        `${trip.oldoid} ${trip.oid} ${trip.fullRef}${capsFirstLine}\n`
      )
    );
    capsFirstLine = '';
  }
  packstream.push(GitPktLine.flush());
  return packstream
}

export { FIFO, GitSideBand, _pack, listCommitsAndTags, listObjects, mergeFile, mergeTree, modified, normalizeCommitterObject, parseReceivePackResponse, parseUploadPackResponse, pkg, writeReceivePackRequest, writeUploadPackRequest };
