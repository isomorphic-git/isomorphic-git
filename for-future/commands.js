import path from 'path';
import pify from 'pify';
import { GitConfigManager, GitIndexManager, GitObjectManager, GitRefsManager, GitRemoteHTTP, GitShallowManager } from './managers.js';
import { flatFileListToDirectoryStructure, fs, mkdirs, pkg, read, resolveRef, write } from './utils.js';
import { GitCommit, GitPktLine, GitTree } from './models.js';
import stream from 'stream';
import thru from 'thru';
import { Buffer } from 'buffer';
import listpack from 'git-list-pack';
import peek from 'buffer-peek-stream';
import applyDelta from 'git-apply-delta';
import simpleGet from 'simple-get';
import concat from 'simple-concat';
import parseLinkHeader from 'parse-link-header';
import pad from 'pad';
import pako from 'pako';
import crypto from 'crypto';
import { HKP } from 'openpgp/dist/openpgp.min.js';

async function add({ gitdir, workdir, filepath }) {
  const type = 'blob';
  const object = await read(path.join(workdir, filepath));
  if (object === null) throw new Error(`Could not read file '${filepath}'`);
  const oid = await GitObjectManager.write({ gitdir, type, object });
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    let stats = await pify(fs().lstat)(path.join(workdir, filepath));
    index.insert({ filepath, stats, oid });
  });
  // TODO: return oid?
}

async function writeTreeToDisk({ gitdir, index, dirpath, tree }) {
  for (let entry of tree) {
    let { type, object } = await GitObjectManager.read({
      gitdir,
      oid: entry.oid
    });
    let entrypath = `${dirpath}/${entry.path}`;
    switch (type) {
      case 'blob':
        await write(entrypath, object);
        let stats = await pify(fs().lstat)(entrypath);
        index.insert({ filepath: entrypath, stats, oid: entry.oid });
        break;
      case 'tree':
        let tree = GitTree.from(object);
        await writeTreeToDisk({ gitdir, index, dirpath: entrypath, tree });
        break;
      default:
        throw new Error(`Unexpected object type ${type} found in tree for '${dirpath}'`);
    }
  }
}

async function checkout({ workdir, gitdir, remote, ref }) {
  // Get tree oid
  let oid;
  try {
    oid = await resolveRef({ gitdir, ref });
  } catch (e) {
    oid = await resolveRef({ gitdir, ref: `${remote}/${ref}` });
    await write(`${gitdir}/refs/heads/${ref}`, oid + '\n');
  }
  let commit = await GitObjectManager.read({ gitdir, oid });
  if (commit.type !== 'commit') {
    throw new Error(`Unexpected type: ${commit.type}`);
  }
  let comm = GitCommit.from(commit.object.toString('utf8'));
  let sha = comm.headers().tree;
  // Get top-level tree
  let { type, object } = await GitObjectManager.read({ gitdir, oid: sha });
  if (type !== 'tree') throw new Error(`Unexpected type: ${type}`);
  let tree = GitTree.from(object);
  // Acquire a lock on the index
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.clear();
    // Write files. TODO: Write them atomically
    await writeTreeToDisk({ gitdir, index, dirpath: workdir, tree });
    // Update HEAD TODO: Handle non-branch cases
    write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`);
  });
}

async function constructTree({ gitdir, inode }) /*: string */{
  // use depth first traversal
  let children = inode.children;
  for (let inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000';
      inode.metadata.oid = await constructTree({ gitdir, inode });
    }
  }
  let entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type
  }));
  const tree = GitTree.from(entries);
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  });
  return oid;
}

async function commit({
  gitdir,
  author,
  committer,
  message,
  privateKeys
}) {
  // Fill in missing arguments with default values
  committer = committer || author;
  let authorDateTime = author.date || new Date();
  let committerDateTime = committer.date || authorDateTime;
  let oid;
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    const inode = flatFileListToDirectoryStructure(index.entries);
    const treeRef = await constructTree({ gitdir, inode });
    let parents;
    try {
      let parent = await resolveRef({ gitdir, ref: 'HEAD' });
      parents = [parent];
    } catch (err) {
      // Probably an initial commit
      parents = [];
    }
    let comm = GitCommit.from({
      tree: treeRef,
      parent: parents,
      author: {
        name: author.name,
        email: author.email,
        timestamp: author.timestamp || Math.floor(authorDateTime.valueOf() / 1000),
        timezoneOffset: author.timezoneOffset || 0
      },
      committer: {
        name: committer.name,
        email: committer.email,
        timestamp: committer.timestamp || Math.floor(committerDateTime.valueOf() / 1000),
        timezoneOffset: committer.timezoneOffset || 0
      },
      message
    });
    if (privateKeys) {
      comm = await comm.sign(privateKeys);
    }
    oid = await GitObjectManager.write({
      gitdir,
      type: 'commit',
      object: comm.toObject()
    });
    // Update branch pointer
    const branch = await resolveRef({ gitdir, ref: 'HEAD', depth: 2 });
    await write(path.join(gitdir, branch), oid + '\n');
  });
  return oid;
}

async function getConfig({ gitdir, path: path$$1 }) {
  const config = await GitConfigManager.get({ gitdir });
  const value = await config.get(path$$1);
  return value;
}

// @flow
/*::
import type {Writable} from 'stream'
*/

const types = {
  1: 'commit',
  2: 'tree',
  3: 'blob',
  4: 'tag',
  6: 'ofs-delta',
  7: 'ref-delta'
};

function parseVarInt(buffer$$1 /*: Buffer */) {
  let n = 0;
  for (var i = 0; i < buffer$$1.byteLength; i++) {
    n = (buffer$$1[i] & 0b01111111) + (n << 7);
    if ((buffer$$1[i] & 0b10000000) === 0) {
      if (i !== buffer$$1.byteLength - 1) throw new Error('Invalid varint buffer');
      return n;
    }
  }
  throw new Error('Invalid varint buffer');
}

// TODO: Move this to 'plumbing'
async function unpack({ gitdir, inputStream /*: {gitdir: string, inputStream: ReadableStream} */
}) {
  return new Promise(function (resolve, reject) {
    // Read header
    peek(inputStream, 12, (err, data, inputStream) => {
      if (err) return reject(err);
      let iden = data.slice(0, 4).toString('utf8');
      if (iden !== 'PACK') {
        throw new Error(`Packfile started with '${iden}'. Expected 'PACK'`);
      }
      let ver = data.slice(4, 8).toString('hex');
      if (ver !== '00000002') {
        throw new Error(`Unknown packfile version '${ver}'. Expected 00000002.`);
      }
      // Read a 4 byte (32-bit) int
      let numObjects = data.readInt32BE(8);
      console.log(`unpacking ${numObjects} objects`);
      if (numObjects === 0) return;
      // And on our merry way
      let offsetMap = new Map();
      inputStream.pipe(listpack()).pipe(thru(async ({ data, type, reference, offset, num }, next) => {
        type = types[type];
        if (type === 'ref-delta') {
          let oid = Buffer.from(reference).toString('hex');
          try {
            let { object, type } = await GitObjectManager.read({
              gitdir,
              oid
            });
            let result = applyDelta(data, object);
            let newoid = await GitObjectManager.write({
              gitdir,
              type,
              object: result
            });
            // console.log(`${type} ${newoid} ref-delta ${oid}`)
            offsetMap.set(offset, newoid);
          } catch (err) {
            throw new Error(`Could not find object ${reference} ${oid} that is referenced by a ref-delta object in packfile at byte offset ${offset}.`);
          }
        } else if (type === 'ofs-delta') {
          // Note: this might be not working because offsets might not be
          // guaranteed to be on object boundaries? In which case we'd need
          // to write the packfile to disk first, I think.
          // For now I've "solved" it by simply not advertising ofs-delta as a capability
          // during the HTTP request, so Github will only send ref-deltas not ofs-deltas.
          let absoluteOffset = offset - parseVarInt(reference);
          let referenceOid = offsetMap.get(absoluteOffset);
          // console.log(`${offset} ofs-delta ${absoluteOffset} ${referenceOid}`)
          let { type, object } = await GitObjectManager.read({
            gitdir,
            oid: referenceOid
          });
          let result = applyDelta(data, object);
          let oid = await GitObjectManager.write({
            gitdir,
            type,
            object: result
          });
          // console.log(`${offset} ${type} ${oid} ofs-delta ${referenceOid}`)
          offsetMap.set(offset, oid);
        } else {
          let oid = await GitObjectManager.write({
            gitdir,
            type,
            object: data
          });
          // console.log(`${offset} ${type} ${oid}`)
          offsetMap.set(offset, oid);
        }
        if (num === 0) return resolve();
        next(null);
      })).on('error', reject).on('finish', resolve);
    });
  });
}

// @flow
async function fetchPackfile({
  gitdir,
  ref = 'HEAD',
  remote,
  auth,
  depth = 0
}) {
  let url = await getConfig({
    gitdir,
    path: `remote.${remote}.url`
  });
  let remoteHTTP = new GitRemoteHTTP(url);
  remoteHTTP.auth = auth;
  await remoteHTTP.preparePull();
  // Check server supports shallow cloning
  if (depth > 0 && !remoteHTTP.capabilities.has('shallow')) {
    throw new Error(`Remote does not support shallow fetching`);
  }
  await GitRefsManager.updateRemoteRefs({
    gitdir,
    remote,
    refs: remoteHTTP.refs
  });
  let want = remoteHTTP.refs.get(ref);
  // Note: I removed "ofs-delta" from the capabilities list and now
  // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack agent=git/${pkg.name}@${pkg.version}`;
  let packstream = new stream.PassThrough();
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`));
  let oids = await GitShallowManager.read({ gitdir });
  if (oids.size > 0 && remoteHTTP.capabilities.has('shallow')) {
    for (let oid of oids) {
      packstream.write(GitPktLine.encode(`shallow ${oid}\n`));
    }
  }
  if (depth !== 0) {
    packstream.write(GitPktLine.encode(`deepen ${parseInt(depth)}\n`));
  }
  packstream.write(GitPktLine.flush());
  let have = null;
  try {
    have = await resolveRef({ gitdir, ref });
  } catch (err) {
    console.log("Looks like we don't have that ref yet.");
  }
  if (have) {
    packstream.write(GitPktLine.encode(`have ${have}\n`));
    packstream.write(GitPktLine.flush());
  }
  packstream.end(GitPktLine.encode(`done\n`));
  let response = await remoteHTTP.pull(packstream);
  response.packetlines.pipe(thru(async (data, next) => {
    let line = data.toString('utf8');
    if (line.startsWith('shallow')) {
      let oid = line.slice(-41).trim();
      if (oid.length !== 40) {
        throw new Error(`non-40 character 'shallow' oid: ${oid}`);
      }
      oids.add(oid);
      await GitShallowManager.write({ gitdir, oids });
    } else if (line.startsWith('unshallow')) {
      let oid = line.slice(-41).trim();
      if (oid.length !== 40) {
        throw new Error(`non-40 character 'shallow' oid: ${oid}`);
      }
      oids.delete(oid);
      await GitShallowManager.write({ gitdir, oids });
    }
    next(null, data);
  }));
  return response;
}

async function fetch({ gitdir, ref = 'HEAD', remote, auth, depth = 0 }) {
  let response = await fetchPackfile({ gitdir, ref, remote, auth, depth });
  response.progress.on('data', data => console.log(data.toString('utf8')));
  await unpack({ gitdir, inputStream: response.packfile });
}

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// We're implementing a non-standard clone based on the Github API first, because of CORS.
// And because we already have the code.
async function request({ url, token, headers }) {
  let res = await pify(simpleGet)({
    url,
    headers: _extends({
      Accept: 'application/vnd.github.v3+json',
      Authorization: 'token ' + token
    }, headers)
  });
  let data = await pify(concat)(res);
  return JSON.parse(data.toString('utf8'));
}

async function fetchRemoteBranches({ gitdir, remote, user, repo, token }) {
  return request({
    token,
    url: `https://api.github.com/repos/${user}/${repo}/branches`
  }).then(json => Promise.all(json.map(branch => write(`${gitdir}/refs/remotes/${remote}/${branch.name}`, branch.commit.sha + '\n', { encoding: 'utf8' }))));
}

async function fetchTags({ gitdir, user, repo, token }) {
  return request({
    token,
    url: `https://api.github.com/repos/${user}/${repo}/tags`
  }).then(json => Promise.all(json.map(tag =>
  // Curiously, tags are not separated between remotes like branches
  write(`${gitdir}/refs/tags/${tag.name}`, tag.commit.sha + '\n', {
    encoding: 'utf8'
  }))));
}

async function fetchCommits({ gitdir, url, user, repo, ref, since, token }) {
  if (!url) {
    url = `https://api.github.com/repos/${user}/${repo}/commits?`;
    if (ref) url += `&sha=${ref}`;
    if (since) {
      let date = new Date(since * 1000).toISOString();
      url += `&since=${date}`;
    }
  }
  let res = await pify(simpleGet)({
    url,
    headers: {
      Accept: 'application/vnd.github.cryptographer-preview',
      Authorization: 'token ' + token
    }
  });
  let data = await pify(concat)(res);
  let json = JSON.parse(data.toString('utf8'));
  let link = parseLinkHeader(res.headers['link']);

  for (let commit of json) {
    if (!commit.commit.verification.payload) {
      console.log(`Commit ${commit.sha} skipped. Due to a technical limitations and my laziness, only signed commits can be cloned from Github over the API`);
      continue;
    }
    let comm = GitCommit.fromPayloadSignature({
      payload: commit.commit.verification.payload,
      signature: commit.commit.verification.signature
    });
    console.log('Created commit', comm);
    let oid = await GitObjectManager.write({
      gitdir,
      type: 'commit',
      object: comm.toObject()
    });
    if (commit.sha !== oid) {
      console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
    }
    console.log(`Stored commit ${commit.sha}`);
  }

  if (link && link.next) {
    return fetchCommits({
      gitdir,
      user,
      repo,
      ref,
      since,
      token,
      url: link.next.url
    });
  }
}

async function fetchTree({ gitdir, url, user, repo, sha, since, token }) {
  let json = await request({
    token,
    url: `https://api.github.com/repos/${user}/${repo}/git/trees/${sha}`
  });
  let tree = new GitTree(json.tree);
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  });
  if (sha !== oid) {
    console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
  }
  console.log(tree.render());
  return Promise.all(json.tree.map(async entry => {
    if (entry.type === 'blob') {
      await fetchBlob({
        gitdir,
        url,
        user,
        repo,
        sha: entry.sha,
        since,
        token
      });
    } else if (entry.type === 'tree') {
      await fetchTree({
        gitdir,
        url,
        user,
        repo,
        sha: entry.sha,
        since,
        token
      });
    }
  }));
}

async function fetchBlob({ gitdir, url, user, repo, sha, since, token }) {
  let res = await pify(simpleGet)({
    url: `https://api.github.com/repos/${user}/${repo}/git/blobs/${sha}`,
    headers: {
      Accept: 'application/vnd.github.raw',
      Authorization: 'token ' + token
    }
  });
  let data = await pify(concat)(res);
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'blob',
    object: data
  });
  if (sha !== oid) {
    console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
  }
}

async function GithubFetch({
  gitdir,
  token,
  user,
  repo,
  ref,
  remote,
  since
}) {
  let json;

  if (!ref) {
    console.log('Determining the default branch');
    json = await request({
      token,
      url: `https://api.github.com/repos/${user}/${repo}`
    });
    ref = json.default_branch;
  }

  console.log('Receiving branches list');
  let getBranches = fetchRemoteBranches({ gitdir, remote, user, repo, token });

  console.log('Receiving tags list');
  let getTags = fetchTags({ gitdir, user, repo, token });

  console.log('Receiving commits');
  let getCommits = fetchCommits({ gitdir, user, repo, token, ref });

  await Promise.all([getBranches, getTags, getCommits]);

  // This is all crap to get a tree SHA from a commit SHA. Seriously.
  let oid = await resolveRef({ gitdir, ref: `${remote}/${ref}` });
  let { type, object } = await GitObjectManager.read({ gitdir, oid });
  if (type !== 'commit') throw new Error(`Unexpected type: ${type}`);
  let comm = GitCommit.from(object.toString('utf8'));
  let sha = comm.headers().tree;
  console.log('tree: ', sha);

  await fetchTree({ gitdir, user, repo, token, sha });
}

// @flow
async function init(gitdir /*: string */) {
  let folders = ['hooks', 'info', 'objects/info', 'objects/pack', 'refs/heads', 'refs/tags'];
  folders = folders.map(dir => gitdir + '/' + dir);
  await mkdirs(folders);
  await write(gitdir + '/config', '[core]\n' + '\trepositoryformatversion = 0\n' + '\tfilemode = false\n' + '\tbare = false\n' + '\tlogallrefupdates = true\n' + '\tsymlinks = false\n' + '\tignorecase = true\n');
  await write(gitdir + '/HEAD', 'ref: refs/heads/master\n');
  // await write(gitdir + '/refs/heads/master', '')
}

async function list({ gitdir }) {
  let filenames;
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    filenames = index.entries.map(x => x.path);
  });
  return filenames;
}

// @flow
// TODO: Move this to 'plumbing'
async function listCommits({
  gitdir,
  start,
  finish /*: {
         gitdir: string,
         start: Array<string>,
         finish: Array<string>
         } */
}) {
  let startingSet = new Set();
  let finishingSet = new Set();
  for (let ref of start) {
    startingSet.add((await resolveRef({ gitdir, ref })));
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await resolveRef({ gitdir, ref });
      finishingSet.add(oid);
    } catch (err) {}
  }
  let visited = new Set(); /*: Set<string> */

  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk(oid) {
    visited.add(oid);
    let { type, object } = await GitObjectManager.read({ gitdir, oid });
    if (type !== 'commit') {
      throw new Error(`Expected type commit but type is ${type}`);
    }
    let commit = GitCommit.from(object);
    let parents = commit.headers().parent;
    for (oid of parents) {
      if (!finishingSet.has(oid) && !visited.has(oid)) {
        await walk(oid);
      }
    }
  }

  // Let's go walking!
  for (let oid of startingSet) {
    await walk(oid);
  }
  return visited;
}

// @flow
// TODO: Move this to 'plumbing'
async function listObjects({ gitdir, oids /*: {
                                                 gitdir: string,
                                                 oids: Array<string>
                                                 } */
}) {
  let visited /*: Set<string> */ = new Set();

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk(oid) {
    visited.add(oid);
    let { type, object } = await GitObjectManager.read({ gitdir, oid });
    if (type === 'commit') {
      let commit = GitCommit.from(object);
      let tree = commit.headers().tree;
      await walk(tree);
    } else if (type === 'tree') {
      let tree = GitTree.from(object);
      for (let entry /*: TreeEntry */ of tree) {
        visited.add(entry.oid);
        // only recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid);
        }
      }
    }
  }

  // Let's go walking!
  for (let oid of oids) {
    await walk(oid);
  }
  return visited;
}

// @flow
/*::
import type {Writable} from 'stream'
*/

const types$1 = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000
  // TODO: Move this to 'plumbing'
};async function pack({
  oids,
  gitdir,
  outputStream /*: {oids: Array<string>, gitdir: string, outputStream: Writable} */
}) {
  let hash = crypto.createHash('sha1');
  let stream$$1 = outputStream;
  function write$$1(chunk, enc) {
    stream$$1.write(chunk, enc);
    hash.update(chunk, enc);
  }
  function writeObject({ stype, object }) {
    let lastFour, multibyte, length;
    // Object type is encoded in bits 654
    let type = types$1[stype];
    if (type === undefined) throw new Error('Unrecognized type: ' + stype);
    // The length encoding get complicated.
    length = object.length;
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    multibyte = length > 0b1111 ? 0b10000000 : 0b0;
    // Last four bits of length is encoded in bits 3210
    lastFour = length & 0b1111;
    // Discard those bits
    length = length >>> 4;
    // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
    let byte = (multibyte | type | lastFour).toString(16);
    write$$1(byte, 'hex');
    // Now we keep chopping away at length 7-bits at a time until its zero,
    // writing out the bytes in what amounts to little-endian order.
    while (multibyte) {
      multibyte = length > 0b01111111 ? 0b10000000 : 0b0;
      byte = multibyte | length & 0b01111111;
      write$$1(pad(2, byte.toString(16), '0'), 'hex');
      length = length >>> 7;
    }
    // Lastly, we can compress and write the object.
    write$$1(Buffer.from(pako.deflate(object)));
  }

  write$$1('PACK');
  write$$1('00000002', 'hex');
  // Write a 4 byte (32-bit) int
  write$$1(pad(8, oids.length.toString(16), '0'), 'hex');
  for (let oid of oids) {
    let { type, object } = await GitObjectManager.read({ gitdir, oid });
    writeObject({ write: write$$1, object, stype: type });
  }
  // Write SHA1 checksum
  let digest = hash.digest();
  stream$$1.end(digest);
  return stream$$1;
}

// @flow
async function push({ gitdir, ref = 'HEAD', url, auth }) {
  let oid = await resolveRef({ gitdir, ref });
  let remote = new GitRemoteHTTP(url);
  remote.auth = auth;
  await remote.preparePush();
  let commits = await listCommits({
    gitdir,
    start: [oid],
    finish: remote.refs.values()
  });
  let objects = await listObjects({ gitdir, oids: commits });
  let packstream = new stream.PassThrough();
  let oldoid = remote.refs.get(ref) || '0000000000000000000000000000000000000000';
  packstream.write(GitPktLine.encode(`${oldoid} ${oid} ${ref}\0 report-status\n`));
  packstream.write(GitPktLine.flush());
  pack({
    gitdir,
    oids: [...objects],
    outputStream: packstream
  });
  let response = await remote.push(packstream);
  return response;
}

async function remove({ gitdir, filepath }) {
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.delete({ filepath });
  });
  // TODO: return oid?
}

async function setConfig({ gitdir, path: path$$1, value }) {
  const config = await GitConfigManager.get({ gitdir });
  await config.set(path$$1, value);
  await GitConfigManager.save({ gitdir, config });
}

const HttpKeyServer = new HKP();

async function verify({ gitdir, ref, publicKeys }) {
  const oid = await resolveRef({ gitdir, ref });
  const { type, object } = await GitObjectManager.read({ gitdir, oid });
  if (type !== 'commit') {
    throw new Error(`git.verify() was expecting a ref type 'commit' but got type '${type}'`);
  }
  let commit = GitCommit.from(object);
  let author = commit.headers().author;
  let keys = await commit.listSigningKeys();
  if (!publicKeys) {
    let keyArray = await Promise.all(keys.map(id => HttpKeyServer.lookup({ keyId: id })));
    publicKeys = keyArray.join('\n');
  }
  let validity = await commit.verify(publicKeys);
  if (!validity) return false;
  return { author, keys };
}

export { add, checkout, commit, fetch, GithubFetch, getConfig, init, list, listCommits, listObjects, pack, push, remove, setConfig, unpack, verify };
