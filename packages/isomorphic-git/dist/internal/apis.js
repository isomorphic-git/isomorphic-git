import { GitPktLine, GitRefManager } from './GitShallowManager.js';
export { index as Errors, GitAnnotatedTag, GitCommit, GitConfig, GitConfigManager, GitIgnoreManager, GitIndex, GitIndexManager, GitObject, GitPackIndex, GitRefSpec, GitRefSpecSet, GitRemoteHTTP, GitRemoteManager, GitShallowManager, GitTree, GitWalkSymbol, _readObject, _writeObject, calculateBasicAuthHeader, collect, comparePath, flatFileListToDirectoryStructure, normalizeAuthorObject, padHex, parseRefsAdResponse, readObjectPacked, request, resolveTree, shasum } from './GitShallowManager.js';
import { pkg } from './writeReceivePackRequest.js';
export { GitSideBand, _pack, listCommitsAndTags, listObjects, mergeFile, mergeTree, modified, normalizeCommitterObject, parseReceivePackResponse, parseUploadPackResponse, writeReceivePackRequest, writeUploadPackRequest } from './writeReceivePackRequest.js';
import { join } from './join.js';
export { FileSystem } from './FileSystem.js';
import '@isomorphic-git/types';
import 'async-lock';
import 'crc-32';
import 'pako';
import 'ignore';
import 'sha.js/sha1.js';
import 'diff3';
import 'path-browserify';
import 'pify';

async function writeRefsAdResponse({ capabilities, refs, symrefs }) {
  const stream = [];
  // Compose capabilities string
  let syms = '';
  for (const [key, value] of Object.entries(symrefs)) {
    syms += `symref=${key}:${value} `;
  }
  let caps = `\x00${[...capabilities].join(' ')} ${syms}agent=${pkg.agent}`;
  // stream.write(GitPktLine.encode(`# service=${service}\n`))
  // stream.write(GitPktLine.flush())
  // Note: In the edge case of a brand new repo, zero refs (and zero capabilities)
  // are returned.
  for (const [key, value] of Object.entries(refs)) {
    stream.push(GitPktLine.encode(`${value} ${key}${caps}\n`));
    caps = '';
  }
  stream.push(GitPktLine.flush());
  return stream
}

async function uploadPack({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  advertiseRefs = false,
}) {
  try {
    if (advertiseRefs) {
      // Send a refs advertisement
      const capabilities = [
        'thin-pack',
        'side-band',
        'side-band-64k',
        'shallow',
        'deepen-since',
        'deepen-not',
        'allow-tip-sha1-in-want',
        'allow-reachable-sha1-in-want',
      ];
      let keys = await GitRefManager.listRefs({
        fs,
        gitdir,
        filepath: 'refs',
      });
      keys = keys.map(ref => `refs/${ref}`);
      const refs = {};
      keys.unshift('HEAD'); // HEAD must be the first in the list
      for (const key of keys) {
        refs[key] = await GitRefManager.resolve({ fs, gitdir, ref: key });
      }
      const symrefs = {};
      symrefs.HEAD = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: 'HEAD',
        depth: 2,
      });
      return writeRefsAdResponse({
        capabilities,
        refs,
        symrefs,
      })
    }
  } catch (err) {
    err.caller = 'git.uploadPack';
    throw err
  }
}

/**
 * Determine whether a file is binary (and therefore not worth trying to merge automatically)
 *
 * @param {Uint8Array} buffer
 *
 * If it looks incredibly simple / naive to you, compare it with the original:
 *
 * // xdiff-interface.c
 *
 * #define FIRST_FEW_BYTES 8000
 * int buffer_is_binary(const char *ptr, unsigned long size)
 * {
 *  if (FIRST_FEW_BYTES < size)
 *   size = FIRST_FEW_BYTES;
 *  return !!memchr(ptr, 0, size);
 * }
 *
 * Yup, that's how git does it. We could try to be smarter
 */
function isBinary(buffer) {
  // in canonical git, this check happens in builtins/merge-file.c
  // but I think it's DRYer to do it here.
  // The value picked is explained here: https://github.com/git/git/blob/ab15ad1a3b4b04a29415aef8c9afa2f64fc194a2/xdiff-interface.h#L12
  const MAX_XDIFF_SIZE = 1024 * 1024 * 1023;
  if (buffer.length > MAX_XDIFF_SIZE) return true
  // check for null characters in the first 8000 bytes
  return buffer.slice(0, 8000).some(value => value === 0)
}

async function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

async function parseUploadPackRequest(stream) {
  const read = GitPktLine.streamReader(stream);
  let done = false;
  let capabilities = null;
  const wants = [];
  const haves = [];
  const shallows = [];
  let depth;
  let since;
  const exclude = [];
  let relative = false;
  while (!done) {
    const line = await read();
    if (line === true) break
    if (line === null) continue
    const [key, value, ...rest] = line
      .toString('utf8')
      .trim()
      .split(' ');
    if (!capabilities) capabilities = rest;
    switch (key) {
      case 'want':
        wants.push(value);
        break
      case 'have':
        haves.push(value);
        break
      case 'shallow':
        shallows.push(value);
        break
      case 'deepen':
        depth = parseInt(value);
        break
      case 'deepen-since':
        since = parseInt(value);
        break
      case 'deepen-not':
        exclude.push(value);
        break
      case 'deepen-relative':
        relative = true;
        break
      case 'done':
        done = true;
        break
    }
  }
  return {
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude,
    relative,
    done,
  }
}

export { GitPktLine, GitRefManager, isBinary, join, parseUploadPackRequest, pkg, sleep, uploadPack, writeRefsAdResponse };
