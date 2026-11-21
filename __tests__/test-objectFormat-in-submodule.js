/* eslint-env node, browser, jasmine */
import {
  Errors,
  add,
  branch,
  commit,
  getConfig,
  listBranches,
  listFiles,
  log,
  readBlob,
  readCommit,
  resolveRef,
  setConfig,
  statusMatrix,
  writeBlob,
  writeRef,
} from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

const SHA256_HEAD =
  'cc636dc28c80c008f825c56696bde97a5f16ec7de4ae80450044bb99818e664b'
const SHA1_HEAD = '4131ab958c6947051107429e868ddc7b7eea6fcc'
const author = {
  name: 'Mr. Test',
  email: 'mrtest@example.com',
  timestamp: 1262356920,
  timezoneOffset: -0,
}

const reads = {
  resolveRef: args => resolveRef({ ...args, ref: 'HEAD' }),
  listBranches: args => listBranches(args),
  readCommit: args => readCommit({ ...args, oid: SHA256_HEAD }),
  readBlob: args => readBlob({ ...args, oid: SHA256_HEAD, filepath: 'a.txt' }),
  log: args => log(args),
  listFiles: args => listFiles({ ...args, ref: 'HEAD' }),
  statusMatrix: args => statusMatrix(args),
}

const writes = {
  writeBlob: args => writeBlob({ ...args, blob: new Uint8Array([1, 2, 3]) }),
  writeRef: args =>
    writeRef({ ...args, ref: 'refs/heads/other', value: SHA256_HEAD }),
  branch: args => branch({ ...args, ref: 'other' }),
  add: args => add({ ...args, filepath: 'a.txt' }),
  commit: args => commit({ ...args, message: 'nope', author }),
}

const worktreeWrites = {
  ...writes,
  'writeRef of HEAD': args =>
    writeRef({ ...args, ref: 'HEAD', value: SHA1_HEAD, force: true }),
}

// Add a linked worktree to the repository at `gitdir`, as `git worktree add`
// does, and return its directory. Its own gitdir has no config: `commondir`
// names the repository's.
async function addWorktree(fs, gitdir, dir) {
  const worktree = `${dir}/linked`
  const worktreeGitdir = `${gitdir}/worktrees/linked`
  await fs.write(`${worktreeGitdir}/HEAD`, 'ref: refs/heads/main\n')
  await fs.write(`${worktreeGitdir}/commondir`, '../..\n')
  await fs.write(`${worktreeGitdir}/gitdir`, `${worktree}/.git\n`)
  await fs.write(`${worktree}/.git`, `gitdir: ${worktreeGitdir}\n`)
  await fs.write(`${worktree}/a.txt`, 'changed\n')
  return worktree
}

async function refusal(promise) {
  let error = null
  try {
    await promise
  } catch (e) {
    error = e
  }
  return error
}

describe('object format', () => {
  describe('a SHA-256 repository', () => {
    for (const [name, read] of Object.entries(reads)) {
      it(`${name} refuses to read it`, async () => {
        // Setup
        const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-sha256')
        // Test
        const error = await refusal(read({ fs, dir, gitdir }))
        expect(error).not.toBeNull()
        expect(error.code).toBe(Errors.UnsupportedObjectFormatError.code)
        expect(error.data).toEqual({ objectFormat: 'sha256' })
      })
    }
    for (const [name, write] of Object.entries(writes)) {
      it(`${name} refuses to write to it, and writes nothing`, async () => {
        // Setup
        const { fs, dir, gitdir, gitdirsmfullpath } =
          await makeFixtureAsSubmodule('test-sha256')
        await fs.write(`${dir}/a.txt`, 'changed\n')
        const before = (await fs.readdirDeep(gitdirsmfullpath)).sort()
        // Test
        const error = await refusal(write({ fs, dir, gitdir }))
        expect(error).not.toBeNull()
        expect(error.code).toBe(Errors.UnsupportedObjectFormatError.code)
        expect((await fs.readdirDeep(gitdirsmfullpath)).sort()).toEqual(before)
        expect(
          (
            await fs.read(`${gitdirsmfullpath}/refs/heads/main`, {
              encoding: 'utf8',
            })
          ).trim()
        ).toBe(SHA256_HEAD)
      })
    }
    it('getConfig still reads its object format', async () => {
      // Setup
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-sha256')
      // Test
      expect(
        await getConfig({ fs, dir, gitdir, path: 'extensions.objectFormat' })
      ).toBe('sha256')
    })
    it('is refused with an empty [extensions "objectformat"] section after its format', async () => {
      // Setup
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule('test-sha256')
      const config = await fs.read(`${gitdirsmfullpath}/config`, {
        encoding: 'utf8',
      })
      await fs.write(
        `${gitdirsmfullpath}/config`,
        `${config}[extensions "objectformat"]\n`
      )
      const before = (await fs.readdirDeep(gitdirsmfullpath)).sort()
      // Test
      for (const run of [reads.resolveRef, writes.writeBlob]) {
        const error = await refusal(run({ fs, dir, gitdir }))
        expect(error).not.toBeNull()
        expect(error.code).toBe(Errors.UnsupportedObjectFormatError.code)
      }
      expect((await fs.readdirDeep(gitdirsmfullpath)).sort()).toEqual(before)
    })
  })
  describe('a linked worktree of a SHA-256 repository', () => {
    for (const [name, read] of Object.entries(reads)) {
      it(`${name} refuses to read it`, async () => {
        // Setup
        const { fs, dir, gitdirsmfullpath } =
          await makeFixtureAsSubmodule('test-sha256')
        const worktree = await addWorktree(fs, gitdirsmfullpath, dir)
        // Test
        const error = await refusal(read({ fs, dir: worktree }))
        expect(error).not.toBeNull()
        expect(error.code).toBe(Errors.UnsupportedObjectFormatError.code)
        expect(error.data).toEqual({ objectFormat: 'sha256' })
      })
    }
    for (const [name, write] of Object.entries(worktreeWrites)) {
      it(`${name} refuses to write to it, and writes nothing`, async () => {
        // Setup
        const { fs, dir, gitdirsmfullpath } =
          await makeFixtureAsSubmodule('test-sha256')
        const worktree = await addWorktree(fs, gitdirsmfullpath, dir)
        const before = (await fs.readdirDeep(gitdirsmfullpath)).sort()
        // Test
        const error = await refusal(write({ fs, dir: worktree }))
        expect(error).not.toBeNull()
        expect(error.code).toBe(Errors.UnsupportedObjectFormatError.code)
        expect((await fs.readdirDeep(gitdirsmfullpath)).sort()).toEqual(before)
        expect(
          await fs.read(`${gitdirsmfullpath}/worktrees/linked/HEAD`, {
            encoding: 'utf8',
          })
        ).toBe('ref: refs/heads/main\n')
      })
    }
  })
  describe('a SHA-1 repository', () => {
    it('of repositoryformatversion 1 and extensions.worktreeConfig is read and written', async () => {
      // Setup
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'test-worktreeConfig'
      )
      // Test
      expect(await resolveRef({ fs, dir, gitdir, ref: 'HEAD' })).toBe(SHA1_HEAD)
      const { commit: parsed } = await readCommit({
        fs,
        dir,
        gitdir,
        oid: SHA1_HEAD,
      })
      expect(parsed.message).toBe('initial commit\n')
      await fs.write(`${dir}/a.txt`, 'changed\n')
      await add({ fs, dir, gitdir, filepath: 'a.txt' })
      const oid = await commit({ fs, dir, gitdir, message: 'next', author })
      expect(await resolveRef({ fs, dir, gitdir, ref: 'HEAD' })).toBe(oid)
      expect((await log({ fs, dir, gitdir })).map(c => c.oid)).toEqual([
        oid,
        SHA1_HEAD,
      ])
    })
    it('of extensions.objectFormat sha1 is read', async () => {
      // Setup
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'test-worktreeConfig'
      )
      await setConfig({
        fs,
        dir,
        gitdir,
        path: 'extensions.objectFormat',
        value: 'sha1',
      })
      // Test
      expect(await resolveRef({ fs, dir, gitdir, ref: 'HEAD' })).toBe(SHA1_HEAD)
    })
  })
})
