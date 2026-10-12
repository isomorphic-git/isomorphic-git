/* eslint-env node, browser, jasmine */

import { join } from 'path'

import {
  Errors,
  cherryPick,
  init,
  commit as gitCommit,
  add,
  branch,
  checkout,
  readCommit,
  resolveRef,
  log,
  setConfig,
  merge as mergeApi,
  status,
  statusMatrix,
  writeBlob,
  writeTree,
  remove,
} from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('cherryPick in submodule', () => {
  it('simple cherry-pick without conflicts', async () => {
    // Setup - create a tiny repository programmatically inside a faux submodule
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    // Create a submodule repo
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub')

    // Place submodule into superproject structure similar to makeFixtureAsSubmodule
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule\n'
    )

    // Now operate inside the submodule
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    // Ensure committer identity exists for this test
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.name',
      value: 'Committer',
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const author = {
      name: 'Test User',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })

    // Create feature branch and commit
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })

    // Switch to master and advance master to ensure new commit differs
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    await fssp._writeFile(
      join(officialSubmoduleDir, 'master.txt'),
      'master update\n'
    )
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'master.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'master update',
      author,
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
    })

    // Verify
    expect(newOid).toBeDefined()
    expect(newOid).not.toBe(featureOid)
    const featureContent = (
      await fssp.read(join(officialSubmoduleDir, 'file.txt'))
    ).toString()
    expect(featureContent).toEqual('feature\n')
    const featureStatus = await status({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    expect(featureStatus).toBe('unmodified')
    const { commit: newCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    expect(newCommit.parent.length).toBe(1)
  })

  it('writes a clean pick the way git does', async () => {
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'tmp-cherry-clean-write'
    )
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    await init({ fs, dir, gitdir })
    await fs.write(join(dir, 'mod.txt'), 'short\n')
    await fs.write(join(dir, 'gone.txt'), 'gone\n')
    await fs.write(join(dir, 'mode.sh'), 'run\n')
    await fs.write(join(dir, 'sub/x.txt'), 'x\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author })
    await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
    await fs.write(join(dir, 'mod.txt'), 'much longer content\n')
    await remove({ fs, dir, gitdir, filepath: 'gone.txt' })
    await fs.rm(join(dir, 'gone.txt'))
    await fs.rm(join(dir, 'mode.sh'))
    await fs.write(join(dir, 'mode.sh'), 'run\n', { mode: 0o777 })
    await fs.write(join(dir, 'new.sh'), 'new\n', { mode: 0o777 })
    await remove({ fs, dir, gitdir, filepath: 'sub/x.txt' })
    await fs.rm(join(dir, 'sub/x.txt'))
    await add({ fs, dir, gitdir, filepath: '.' })
    const oid = await gitCommit({ fs, dir, gitdir, message: 'feature', author })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs.write(join(dir, 'other.txt'), 'other\n')
    await add({ fs, dir, gitdir, filepath: 'other.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master', author })
    // Only master changed other.txt, so the pick must not write it.
    await fs.write(join(dir, 'other.txt'), 'local edit\n')

    await cherryPick({ fs, dir, gitdir, oid, committer: author })

    expect(await fs.read(join(dir, 'mod.txt'), 'utf8')).toBe(
      'much longer content\n'
    )
    expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe('local edit\n')
    expect(await fs.exists(join(dir, 'gone.txt'))).toBe(false)
    expect(await fs.exists(join(dir, 'sub'))).toBe(false)
    const entries = await GitIndexManager.acquire(
      { fs, gitdir: gitdirsmfullpath, cache: {} },
      async index => index.entriesMap
    )
    expect([...entries.keys()].sort()).toEqual([
      'mod.txt',
      'mode.sh',
      'new.sh',
      'other.txt',
    ])
    expect(entries.get('mode.sh').mode).toBe(0o100755)
    expect(entries.get('new.sh').mode).toBe(0o100755)
    // The recorded size is the new file's, so git does not see it as changed.
    expect(entries.get('mod.txt').size).toBe('much longer content\n'.length)
  })

  it('only overwrites a file that a plain rule ignores', async () => {
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    // The `ignore` package and git can disagree on negations, character
    // classes and inner `**`, so with such rules nothing is overwritten.
    for (const [name, ignore, expendable] of [
      ['glob', '*.lock\n', true],
      ['dir', '.local/\n', true],
      ['negation', '.local\n!.local/keep\n', false],
      ['class', '.loc[a]l\n', false],
      ['globstar', '.local\nlogs/**/debug\n', false],
    ]) {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        `tmp-cherry-ignored-${name}`
      )
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, '.gitignore'), ignore)
      await fs.write(join(dir, 'f.txt'), 'f\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
      await fs.write(join(dir, '.local/folder.lock'), 'theirs\n')
      await add({
        fs,
        dir,
        gitdir,
        filepath: '.local/folder.lock',
        force: true,
      })
      const oid = await gitCommit({ fs, dir, gitdir, message: 'other', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(join(dir, '.local/folder.lock'), 'mine\n')

      let error = null
      try {
        await cherryPick({ fs, dir, gitdir, oid, committer: author })
      } catch (e) {
        error = e
      }
      if (expendable) {
        expect(error).toBeNull()
        expect(await fs.read(join(dir, '.local/folder.lock'), 'utf8')).toBe(
          'theirs\n'
        )
      } else {
        expect(error && error.code).toBe(
          Errors.CherryPickLocalChangesError.code
        )
        expect(error.data.filepaths).toEqual(['.local/folder.lock'])
        expect(await fs.read(join(dir, '.local/folder.lock'), 'utf8')).toBe(
          'mine\n'
        )
      }
    }
  })
  it('overwrites an untracked file that .gitignore ignores, like git', async () => {
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    for (const conflict of [false, true]) {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        `tmp-cherry-ignored-${conflict}`
      )
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, '.gitignore'), '.local\n')
      await fs.write(join(dir, 'f.txt'), 'one\ntwo\nthree\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
      await fs.write(join(dir, '.local/folder.lock'), 'theirs\n')
      await add({
        fs,
        dir,
        gitdir,
        filepath: '.local/folder.lock',
        force: true,
      })
      if (conflict) {
        await fs.write(join(dir, 'f.txt'), 'one\nother\nthree\n')
        await add({ fs, dir, gitdir, filepath: 'f.txt' })
      }
      const oid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'other',
        author,
      })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      if (conflict) {
        await fs.write(join(dir, 'f.txt'), 'one\nmaster\nthree\n')
        await add({ fs, dir, gitdir, filepath: 'f.txt' })
        await gitCommit({ fs, dir, gitdir, message: 'master', author })
      }
      await fs.write(join(dir, '.local/folder.lock'), 'mine\n')

      let error = null
      try {
        await cherryPick({
          fs,
          dir,
          gitdir,
          oid,
          committer: author,
          abortOnConflict: false,
        })
      } catch (e) {
        error = e
      }
      if (conflict) {
        expect(error && error.code).toBe(Errors.MergeConflictError.code)
      } else {
        expect(error).toBeNull()
      }
      expect(await fs.read(join(dir, '.local/folder.lock'), 'utf8')).toBe(
        'theirs\n'
      )
      expect(
        await status({ fs, dir, gitdir, filepath: '.local/folder.lock' })
      ).toBe(conflict ? 'added' : 'unmodified')
    }
  })

  describe('local changes', () => {
    // Makes `name` and `other` the same file, as on a case-insensitive file
    // system like macOS or Windows use (init sets core.ignorecase, as git does
    // there).
    function caseInsensitive(fs, name, other) {
      for (const method of ['_lstat', '_readFile', '_writeFile', '_unlink']) {
        const original = fs[method]
        fs[method] = (filepath, ...rest) =>
          original(
            filepath.endsWith(`/${name}`)
              ? `${filepath.slice(0, -name.length)}${other}`
              : filepath,
            ...rest
          )
      }
    }

    const author = {
      name: 'Tester',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }

    // master: file.txt=base, other.txt=other
    // feature: file.txt=remote, gone.txt deleted, added.txt=added
    async function setup(name) {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule(name)
      await init({ fs, dir, gitdir })
      await fs._writeFile(join(dir, 'file.txt'), 'base\n')
      await fs._writeFile(join(dir, 'other.txt'), 'other\n')
      await fs._writeFile(join(dir, 'gone.txt'), 'gone\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })

      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs._writeFile(join(dir, 'file.txt'), 'remote\n')
      await fs._writeFile(join(dir, 'added.txt'), 'added\n')
      await fs.rm(join(dir, 'gone.txt'))
      await add({ fs, dir, gitdir, filepath: ['file.txt', 'added.txt'] })
      await remove({ fs, dir, gitdir, filepath: 'gone.txt' })
      const featureOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'feature',
        author,
      })

      await checkout({ fs, dir, gitdir, ref: 'master' })
      const headOid = await resolveRef({ fs, gitdir, ref: 'HEAD' })
      return { fs, dir, gitdir, gitdirsmfullpath, featureOid, headOid }
    }

    async function expectRejected(repo, filepaths, options = {}) {
      const { fs, dir, gitdir, featureOid, headOid } = repo
      let error = null
      try {
        await cherryPick({
          fs,
          dir,
          gitdir,
          oid: featureOid,
          committer: author,
          ...options,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.CherryPickLocalChangesError.code)
      expect(error.data.filepaths).toEqual(filepaths)
      expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(headOid)
    }

    it('rejects a staged change to a file the commit does not touch', async () => {
      const repo = await setup('tmp-cherry-dirty-staged-other')
      const { fs, dir, gitdir } = repo
      await fs._writeFile(join(dir, 'other.txt'), 'local-staged\n')
      await add({ fs, dir, gitdir, filepath: 'other.txt' })

      await expectRejected(repo, ['other.txt'])
      expect(await status({ fs, dir, gitdir, filepath: 'other.txt' })).toBe(
        'modified'
      )
    })
    it('rejects a staged change when the commit changes nothing, like git', async () => {
      const repo = await setup('tmp-cherry-dirty-staged-empty')
      const { fs, dir, gitdir, headOid } = repo
      const emptyOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'empty',
        author,
        parent: [headOid],
        ref: 'refs/heads/empty',
      })
      await fs._writeFile(join(dir, 'other.txt'), 'local-staged\n')
      await add({ fs, dir, gitdir, filepath: 'other.txt' })

      await expectRejected({ ...repo, featureOid: emptyOid }, ['other.txt'])
      expect(await status({ fs, dir, gitdir, filepath: 'other.txt' })).toBe(
        'modified'
      )
    })
    it('writes conflicts without touching other local changes', async () => {
      const repo = await setup('tmp-cherry-dirty-conflict-write')
      const { fs, dir, gitdir, featureOid } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'master-change\n')
      await add({ fs, dir, gitdir, filepath: 'file.txt' })
      await gitCommit({ fs, dir, gitdir, message: 'master change', author })
      await fs._writeFile(join(dir, 'other.txt'), 'local-dirty\n')
      await fs._writeFile(join(dir, 'untracked.txt'), 'untracked\n')

      let error = null
      try {
        await cherryPick({
          fs,
          dir,
          gitdir,
          oid: featureOid,
          committer: author,
          abortOnConflict: false,
        })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toContain('<<<<<<<')
      expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe(
        'local-dirty\n'
      )
      expect(await fs.read(join(dir, 'untracked.txt'), 'utf8')).toBe(
        'untracked\n'
      )
      // The rest of the pick is staged, like git does.
      expect(await status({ fs, dir, gitdir, filepath: 'added.txt' })).toBe(
        'added'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'gone.txt' })).toBe(
        'deleted'
      )
    })
    it('rejects an untracked file whose name differs only in case', async () => {
      const repo = await setup('tmp-cherry-dirty-case')
      const { fs, dir } = repo
      await fs._writeFile(join(dir, 'ADDED.TXT'), 'untracked\n')
      caseInsensitive(fs, 'added.txt', 'ADDED.TXT')

      await expectRejected(repo, ['ADDED.TXT'])
      expect(await fs.read(join(dir, 'ADDED.TXT'), 'utf8')).toBe('untracked\n')
    })
    it('rejects an edit to a file of ours where theirs has a folder', async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'tmp-cherry-dirty-file-vs-dir'
      )
      await init({ fs, dir, gitdir })
      await fs._writeFile(join(dir, 'f.txt'), 'f\n')
      await fs.write(join(dir, 'd/x'), 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(join(dir, 'd/x'), 'feature\n')
      await add({ fs, dir, gitdir, filepath: 'd/x' })
      const oid = await gitCommit({ fs, dir, gitdir, message: 'edit', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      // ours turns the folder d into a file, which the pick moves aside.
      await remove({ fs, dir, gitdir, filepath: 'd/x' })
      await fs.rm(join(dir, 'd/x'))
      await fs.rmdir(join(dir, 'd'))
      await fs.write(join(dir, 'd'), 'ours file\n')
      await add({ fs, dir, gitdir, filepath: 'd' })
      const headOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'd is a file',
        author,
      })
      await fs.write(join(dir, 'd'), 'ours file\nlocal edit\n')

      await expectRejected({ fs, dir, gitdir, featureOid: oid, headOid }, ['d'])
      expect(await fs.read(join(dir, 'd'), 'utf8')).toBe(
        'ours file\nlocal edit\n'
      )
    })
    it('rejects an untracked file where a version moves aside, like git', async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'tmp-cherry-aside-untracked'
      )
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, 'd/x'), 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const baseOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'base',
        author,
      })
      // The picked commit turns the folder d into a file, while ours edits
      // d/x: the file has to go to `d~<commit>`.
      const oid = await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/feature',
        parent: [baseOid],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            {
              path: 'd',
              mode: '100644',
              type: 'blob',
              oid: await writeBlob({ fs, gitdir, blob: Buffer.from('file\n') }),
            },
          ],
        }),
        message: 'd is a file',
        author,
      })
      await fs.write(join(dir, 'd/x'), 'ours\n')
      await add({ fs, dir, gitdir, filepath: 'd/x' })
      const headOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'ours',
        author,
      })
      const aside = `d~${oid.slice(0, 7)} (d is a file)`
      await fs.write(join(dir, aside), 'precious\n')

      await expectRejected(
        { fs, dir, gitdir, featureOid: oid, headOid },
        [aside],
        { abortOnConflict: false }
      )
      expect(await fs.read(join(dir, aside), 'utf8')).toBe('precious\n')
      expect(await fs.read(join(dir, 'd/x'), 'utf8')).toBe('ours\n')
    })
    it('rejects an ignored file renamed in case from a tracked one', async () => {
      const repo = await setup('tmp-cherry-dirty-case-ignored')
      const { fs, dir } = repo
      await fs.rm(join(dir, 'file.txt'))
      await fs._writeFile(join(dir, 'FILE.TXT'), 'local edit\n')
      await fs._writeFile(join(dir, '.gitignore'), 'FILE.TXT\n')
      caseInsensitive(fs, 'file.txt', 'FILE.TXT')

      await expectRejected(repo, ['FILE.TXT'])
      expect(await fs.read(join(dir, 'FILE.TXT'), 'utf8')).toBe('local edit\n')
    })
    it('rejects a folder in the way when nothing was checked out', async () => {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule('tmp-cherry-empty-index-dir')
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, 'd/x'), 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const headOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'base',
        author,
      })
      // The picked commit turns the folder d into a file.
      const oid = await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/feature',
        parent: [headOid],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            {
              path: 'd',
              mode: '100644',
              type: 'blob',
              oid: await writeBlob({ fs, gitdir, blob: Buffer.from('file\n') }),
            },
          ],
        }),
        message: 'd is a file',
        author,
      })
      await fs.rm(join(gitdirsmfullpath, 'index'))

      await expectRejected({ fs, dir, gitdir, featureOid: oid, headOid }, ['d'])
      expect(await fs.read(join(dir, 'd/x'), 'utf8')).toBe('base\n')
    })
    it('does not check the worktree on a dry run', async () => {
      const repo = await setup('tmp-cherry-dirty-dry-run')
      const { fs, dir, gitdir, featureOid, headOid } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'local-dirty\n')

      for (const abortOnConflict of [true, false]) {
        const newOid = await cherryPick({
          fs,
          dir,
          gitdir,
          oid: featureOid,
          committer: author,
          dryRun: true,
          abortOnConflict,
        })
        expect(newOid).toBeDefined()
      }
      expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(headOid)
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe('local-dirty\n')
    })
    it('checks every file when the working tree was never checked out', async () => {
      const repo = await setup('tmp-cherry-dirty-empty-index')
      const { fs, dir, gitdirsmfullpath } = repo
      await fs.rm(join(gitdirsmfullpath, 'index'))
      // The whole commit is written, so other.txt is in the way too.
      await fs._writeFile(join(dir, 'other.txt'), 'not checked out\n')

      await expectRejected(repo, ['other.txt'])
      expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe(
        'not checked out\n'
      )
    })
    it('writes the whole commit when the working tree was never checked out', async () => {
      const repo = await setup('tmp-cherry-empty-index')
      const { fs, dir, gitdir, gitdirsmfullpath, featureOid } = repo
      await fs.rm(join(gitdirsmfullpath, 'index'))

      await cherryPick({ fs, dir, gitdir, oid: featureOid, committer: author })

      // gone.txt was never checked out, so it is left as an untracked file.
      expect(await statusMatrix({ fs, dir, gitdir })).toEqual([
        ['added.txt', 1, 1, 1],
        ['file.txt', 1, 1, 1],
        ['gone.txt', 0, 2, 0],
        ['other.txt', 1, 1, 1],
      ])
    })
  })

  it('cherry-pick with dryRun', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub-dry')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule-dry')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule-dry')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule-dry\n'
    )

    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    // Ensure committer identity exists for this test
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.name',
      value: 'Committer',
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const newestOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })

    const beforeOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: newestOid,
      dryRun: true,
    })
    expect(newOid).toBeDefined()
    const afterOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    expect(afterOid).toEqual(beforeOid)
  })

  it('reject merge commits', async () => {
    // Setup - programmatic submodule repo and create a merge commit
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub-merge')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule-merge')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule-merge')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule-merge\n'
    )
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    // create branch a
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'a',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'a',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'a.txt'), 'a\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'a.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'a',
      author,
    })
    // create branch b
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'b',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'b',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'b.txt'), 'b\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'b.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'b',
      author,
    })
    // Merge a into b
    await mergeApi({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      theirs: 'a',
      author,
    })
    const commits = await log({ fs: fssp, gitdir: submoduleGitFile, ref: 'b' })
    const mergeCommit = commits.find(c => c.commit.parent.length > 1)
    expect(mergeCommit).toBeDefined()
    if (!mergeCommit) throw new Error('Expected a merge commit')
    let error = null
    try {
      await cherryPick({
        fs: fssp,
        dir: officialSubmoduleDir,
        gitdir: submoduleGitFile,
        oid: mergeCommit.oid,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.CherryPickMergeCommitError.code)
    expect(error.data.parentCount).toBe(mergeCommit.commit.parent.length)
  })

  it('cherry-pick with custom committer', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub2')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule2')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule2')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule2\n'
    )

    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })

    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })

    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    const customCommitter = {
      name: 'Cherry Picker',
      email: 'picker@example.com',
      timestamp: 1234567890,
      timezoneOffset: -120,
    }
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
      committer: customCommitter,
    })
    const { commit: newCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    expect(newCommit.committer.name).toEqual(customCommitter.name)
    expect(newCommit.committer.email).toEqual(customCommitter.email)
  })

  it('noUpdateBranch option', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub3')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule3')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule3')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule3\n'
    )
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    const beforeOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    // Ensure committer identity exists so cherryPick does not throw MissingNameError
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.name',
      value: 'Committer',
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
      noUpdateBranch: true,
    })
    expect(newOid).toBeDefined()
    const afterOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    expect(afterOid).toEqual(beforeOid)
    const { commit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    expect(commit).toBeDefined()
  })

  it('cherry-pick creates new committer timestamp', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub4')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule4')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule4')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule4\n'
    )
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    const beforeTimestamp = Math.floor(Date.now() / 1000)
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.name',
      value: 'Committer',
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
    })
    const afterTimestamp = Math.floor(Date.now() / 1000)
    const { commit: newCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    const { commit: originalCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: featureOid,
    })
    expect(newCommit.author.timestamp).toEqual(originalCommit.author.timestamp)
    expect(newCommit.committer.timestamp).toBeGreaterThanOrEqual(
      beforeTimestamp
    )
    expect(newCommit.committer.timestamp).toBeLessThanOrEqual(afterTimestamp)
  })

  it('rejects cherry-picking a root commit (submodule)', async () => {
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub-root')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule-root')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule-root')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule-root\n'
    )

    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.name',
      value: 'Tester',
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.email',
      value: 'test@example.com',
    })

    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'root\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    const rootOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'root',
    })

    let error = null
    try {
      await cherryPick({
        fs: fssp,
        dir: officialSubmoduleDir,
        gitdir: submoduleGitFile,
        oid: rootOid,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.CherryPickRootCommitError.code)
    expect(error.data.oid).toBe(rootOid)
  })

  it('labels conflict markers like git (submodule)', async () => {
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub-label')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule-label')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule-label')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule-label\n'
    )
    const repo = {
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    }
    const author = {
      name: 'Tester',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    const write = content =>
      fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), content)

    await init(repo)
    await write('base\n')
    await add({ ...repo, filepath: 'file.txt' })
    await gitCommit({ ...repo, message: 'base', author })
    await branch({ ...repo, ref: 'feature', checkout: true })
    await write('feature change\n')
    await add({ ...repo, filepath: 'file.txt' })
    const featureOid = await gitCommit({ ...repo, message: 'feature', author })
    await checkout({ ...repo, ref: 'master' })
    await write('master change\n')
    await add({ ...repo, filepath: 'file.txt' })
    await gitCommit({ ...repo, message: 'master change', author })

    let error = null
    try {
      await cherryPick({
        ...repo,
        oid: featureOid,
        abortOnConflict: false,
        committer: author,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)
    expect(
      (await fssp.read(join(officialSubmoduleDir, 'file.txt'))).toString()
    ).toBe(
      `<<<<<<< HEAD\nmaster change\n=======\nfeature change\n>>>>>>> ${featureOid.slice(
        0,
        7
      )} (feature)\n`
    )
  })

  it('throws MissingNameError when committer not set and user.name missing (submodule)', async () => {
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub4')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule5')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule5')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule5\n'
    )

    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })

    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }

    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })

    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(
      join(officialSubmoduleDir, 'feature.txt'),
      'feature change\n'
    )
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'feature.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })

    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    await fssp._writeFile(
      join(officialSubmoduleDir, 'master.txt'),
      'master update\n'
    )
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'master.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'master update',
      author,
    })

    let error = null
    try {
      await cherryPick({
        fs: fssp,
        dir: officialSubmoduleDir,
        gitdir: submoduleGitFile,
        oid: featureOid,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MissingNameError.code)
  })

  it('records the cherry-pick in progress so commit keeps author and message', async () => {
    const { fs, dir, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('tmp-cherry-state')
    await init({ fs, dir, gitdir })
    const author = {
      name: 'Original Author',
      email: 'original@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    const committer = {
      name: 'Committer',
      email: 'committer@example.com',
      timestamp: 1700000000,
      timezoneOffset: 0,
    }
    await fs.write(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author: committer })
    await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
    await fs.write(join(dir, 'file.txt'), 'feature\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const featureOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'Feature subject\n\nFeature body.\n',
      author,
    })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs.write(join(dir, 'file.txt'), 'master\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const masterOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'master',
      author: committer,
    })

    let error = null
    try {
      await cherryPick({
        fs,
        dir,
        gitdir,
        oid: featureOid,
        committer,
        abortOnConflict: false,
      })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MergeConflictError.code)
    expect(await fs.read(`${gitdirsmfullpath}/CHERRY_PICK_HEAD`, 'utf8')).toBe(
      `${featureOid}\n`
    )
    expect(await fs.read(`${gitdirsmfullpath}/MERGE_MSG`, 'utf8')).toBe(
      'Feature subject\n\nFeature body.\n\n# Conflicts:\n#\tfile.txt\n'
    )
    expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe(
      `<<<<<<< HEAD\nmaster\n=======\nfeature\n>>>>>>> ${featureOid.slice(
        0,
        7
      )} (Feature subject)\n`
    )

    await fs.write(join(dir, 'file.txt'), 'resolved\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const oid = await gitCommit({ fs, dir, gitdir, committer })
    const { commit } = await readCommit({ fs, gitdir, oid })
    expect(commit.parent).toEqual([masterOid])
    expect(commit.message).toBe('Feature subject\n\nFeature body.\n')
    expect(commit.author).toEqual(author)
    expect(commit.committer).toEqual(committer)
    expect(await fs.exists(`${gitdirsmfullpath}/CHERRY_PICK_HEAD`)).toBe(false)
    expect(await fs.exists(`${gitdirsmfullpath}/MERGE_MSG`)).toBe(false)
  })
  // feature and master both change file.txt; feature also adds added.txt.
  async function pickRepo(name) {
    const { fs, dir, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule(name)
    await init({ fs, dir, gitdir })
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: 0,
    }
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author })
    await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
    await fs._writeFile(join(dir, 'added.txt'), 'added\n')
    await add({ fs, dir, gitdir, filepath: 'added.txt' })
    const cleanOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'add',
      author,
    })
    await fs._writeFile(join(dir, 'file.txt'), 'feature\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const conflictOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs._writeFile(join(dir, 'file.txt'), 'master\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master', author })
    return {
      fs,
      dir,
      gitdir,
      realGitdir: gitdirsmfullpath,
      author,
      cleanOid,
      conflictOid,
    }
  }

  it('records no cherry-pick in progress when it writes nothing', async () => {
    const { fs, dir, gitdir, realGitdir, author, conflictOid } = await pickRepo(
      'tmp-cherry-state-none'
    )
    for (const options of [
      {},
      { dryRun: true, abortOnConflict: false },
      // Without a working tree, abortMerge could not clear it.
      { dir: undefined, abortOnConflict: false },
    ]) {
      let error = null
      try {
        await cherryPick({
          fs,
          dir,
          gitdir,
          oid: conflictOid,
          committer: author,
          ...options,
        })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.exists(`${realGitdir}/CHERRY_PICK_HEAD`)).toBe(false)
      expect(await fs.exists(`${realGitdir}/MERGE_MSG`)).toBe(false)
    }
  })

  it('leaves a merge in progress alone when it picks cleanly, like git', async () => {
    const { fs, dir, gitdir, realGitdir, author, cleanOid, conflictOid } =
      await pickRepo('tmp-cherry-state-merge')
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${conflictOid}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, 'Merge it\n')

    const oid = await cherryPick({
      fs,
      dir,
      gitdir,
      oid: cleanOid,
      committer: author,
    })
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(oid)
    expect(await fs.read(`${realGitdir}/MERGE_HEAD`, 'utf8')).toBe(
      `${conflictOid}\n`
    )
    // git's pick uses up MERGE_MSG, even the merge's.
    expect(await fs.exists(`${realGitdir}/MERGE_MSG`)).toBe(false)
  })

  it('ends a cherry-pick in progress when it picks cleanly, like git', async () => {
    const { fs, dir, gitdir, realGitdir, author, cleanOid, conflictOid } =
      await pickRepo('tmp-cherry-state-pick')
    await fs.write(`${realGitdir}/CHERRY_PICK_HEAD`, `${conflictOid}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, 'feature\n')

    const oid = await cherryPick({
      fs,
      dir,
      gitdir,
      oid: cleanOid,
      committer: author,
    })
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(oid)
    expect(await fs.exists(`${realGitdir}/CHERRY_PICK_HEAD`)).toBe(false)
    expect(await fs.exists(`${realGitdir}/MERGE_MSG`)).toBe(false)

    // A dry run or a pick that does not move the branch keeps them.
    await fs.write(`${realGitdir}/CHERRY_PICK_HEAD`, `${conflictOid}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, 'feature\n')
    for (const options of [{ dryRun: true }, { noUpdateBranch: true }]) {
      await cherryPick({
        fs,
        dir,
        gitdir,
        oid: cleanOid,
        committer: author,
        ...options,
      })
      expect(await fs.exists(`${realGitdir}/CHERRY_PICK_HEAD`)).toBe(true)
      expect(await fs.exists(`${realGitdir}/MERGE_MSG`)).toBe(true)
    }
  })

  it('forgets the cherry-pick in progress when checkout moves HEAD, like git', async () => {
    const { fs, dir, gitdir, realGitdir, author, conflictOid } = await pickRepo(
      'tmp-cherry-state-checkout'
    )
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Committer' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'committer@example.com',
    })
    let error = null
    try {
      await cherryPick({
        fs,
        dir,
        gitdir,
        oid: conflictOid,
        committer: author,
        abortOnConflict: false,
      })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MergeConflictError.code)
    expect(await fs.exists(`${realGitdir}/CHERRY_PICK_HEAD`)).toBe(true)

    await checkout({ fs, dir, gitdir, ref: 'master', force: true })
    expect(await fs.exists(`${realGitdir}/CHERRY_PICK_HEAD`)).toBe(false)
    expect(await fs.exists(`${realGitdir}/MERGE_MSG`)).toBe(false)
    // So the next commit is the current user's, not the picked commit's.
    await fs._writeFile(join(dir, 'mine.txt'), 'mine\n')
    await add({ fs, dir, gitdir, filepath: 'mine.txt' })
    const oid = await gitCommit({ fs, dir, gitdir, message: 'mine' })
    const { commit } = await readCommit({ fs, gitdir, oid })
    expect(commit.author.name).toBe('Committer')
    expect(commit.message).toBe('mine\n')
  })
})
