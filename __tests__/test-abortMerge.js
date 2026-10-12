/* eslint-env node, browser, jasmine */
import {
  Errors,
  merge,
  readBlob,
  resolveRef,
  abortMerge,
  add,
  listFiles,
  STAGE,
  TREE,
  WORKDIR,
  walk,
  init,
  commit,
  branch,
  checkout,
  statusMatrix,
  remove,
  writeBlob,
  readTree,
  writeTree,
} from 'isomorphic-git'
import {
  GitIndex,
  GitIndexManager,
  modified,
} from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { caseInsensitive } from './__helpers__/caseInsensitive.js'

const author = { name: 't', email: 't@t', timestamp: 1000, timezoneOffset: 0 }

describe('abortMerge', () => {
  it('write conflicted files to index at different stages', async () => {
    // Setup
    const { gitdir, dir, fs } = await makeFixture('test-abortMerge')

    const branchA = await resolveRef({ fs, gitdir, ref: 'a' })
    const branchB = await resolveRef({ fs, gitdir, ref: 'b' })
    const ancestor = '2d7b1a9b82e52bd8648cf156aa559eff3a27a678' // common ancestor, hard coded, not ideal

    const fileAVersions = [
      await readBlob({ fs, gitdir, oid: ancestor, filepath: 'a' }),
      await readBlob({ fs, gitdir, oid: branchA, filepath: 'a' }),
      await readBlob({ fs, gitdir, oid: branchB, filepath: 'a' }),
    ]

    const fileBVersions = [
      await readBlob({ fs, gitdir, oid: ancestor, filepath: 'b' }),
      await readBlob({ fs, gitdir, oid: branchA, filepath: 'b' }),
      await readBlob({ fs, gitdir, oid: branchB, filepath: 'b' }),
    ]

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async function (index) {
        expect(index.unmergedPaths.length).toEqual(2)
        expect(index.entriesFlat.length).toBe(7)
        expect(index.unmergedPaths).toContain('a')
        expect(index.unmergedPaths).toContain('b')
        expect(index.entriesMap.get('a').stages.length).toBe(4)
        expect(index.entriesMap.get('b').stages.length).toBe(4)
        expect(index.entriesMap.get('c').stages.length).toBe(1)
        const fileAStages = [
          await readBlob({
            fs,
            gitdir,
            oid: index.entriesMap.get('a').stages[1].oid,
          }),
          await readBlob({
            fs,
            gitdir,
            oid: index.entriesMap.get('a').stages[2].oid,
          }),
          await readBlob({
            fs,
            gitdir,
            oid: index.entriesMap.get('a').stages[3].oid,
          }),
        ]
        const fileBStages = [
          await readBlob({
            fs,
            gitdir,
            oid: index.entriesMap.get('b').stages[1].oid,
          }),
          await readBlob({
            fs,
            gitdir,
            oid: index.entriesMap.get('b').stages[2].oid,
          }),
          await readBlob({
            fs,
            gitdir,
            oid: index.entriesMap.get('b').stages[3].oid,
          }),
        ]
        expect(fileAVersions).toEqual(fileAStages)
        expect(fileBVersions).toEqual(fileBStages)
      }
    )
  })

  it('abort merge without touching anything', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    await abortMerge({ fs, dir, gitdir })

    const trees = [TREE({ ref: 'HEAD' }), WORKDIR(), STAGE()]
    await walk({
      fs,
      dir,
      gitdir,
      trees,
      map: async function (path, [head, workdir, index]) {
        if (path === '.') return

        if (head && index) {
          expect([path, await head.mode()]).toEqual([path, await index.mode()])
          expect([path, await head.oid()]).toEqual([path, await index.oid()])
        }

        expect(await modified(index, head)).toBe(false)

        // only since we didn't touch anything
        expect(await modified(workdir, head)).toBe(false)

        expect(await modified(index, workdir)).toBe(false)
      },
    })
  })

  it('abort merge after modifying files in a directory', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'c',
        theirs: 'd',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    await fs.rm(`${dir}/a/a`)
    await fs.rmdir(`${dir}/a`)
    await fs.write(`${dir}/b/b`, 'new text for file b')
    await fs.write(`${dir}/c/c`, 'new text for file c')

    await abortMerge({ fs, dir, gitdir, commit: 'c' })

    const trees = [TREE({ ref: 'c' }), WORKDIR(), STAGE()]
    await walk({
      fs,
      dir,
      gitdir,
      trees,
      map: async function (path, [head, workdir, index]) {
        if (head && (await head.type()) === 'tree') return

        if (path === 'b') {
          expect(await modified(workdir, head)).toBe(false)
          expect(await modified(workdir, index)).toBe(false)
        }

        if (head && index) {
          expect([path, await head.mode()]).toEqual([path, await index.mode()])
          expect([path, await head.oid()]).toEqual([path, await index.oid()])
        }

        expect(await modified(index, head)).toBe(false)
      },
    })
    const fileCContent = new TextDecoder().decode(await fs.read(`${dir}/c/c`))
    const fileBContent = new TextDecoder().decode(await fs.read(`${dir}/b/b`))
    expect(fileCContent).toEqual('new text for file c')
    expect(fileBContent).not.toEqual('new text for file b')
  })

  it('abort merge after modifying files', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    await fs.rm(`${dir}/a`)
    await fs.write(`${dir}/b`, 'new text for file b')
    await fs.write(`${dir}/c`, 'new text for file c')

    await abortMerge({ fs, dir, gitdir })

    const trees = [TREE({ ref: 'HEAD' }), WORKDIR(), STAGE()]
    await walk({
      fs,
      dir,
      gitdir,
      trees,
      map: async function (path, [head, workdir, index]) {
        if (path === '.') return

        if (path === 'b') {
          expect(await modified(workdir, head)).toBe(false)
          expect(await modified(workdir, index)).toBe(false)
        }

        if (head && index) {
          expect([path, await head.mode()]).toEqual([path, await index.mode()])
          expect([path, await head.oid()]).toEqual([path, await index.oid()])
        }

        expect(await modified(index, head)).toBe(false)
      },
    })
    const fileCContent = new TextDecoder().decode(await fs.read(`${dir}/c`))
    const fileBContent = new TextDecoder().decode(await fs.read(`${dir}/b`))
    expect(fileCContent).toEqual('new text for file c')
    expect(fileBContent).not.toEqual('new text for file b')
  })

  it('uncache a file that has changes in the workdir (throw an error)', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    fs.write(`${dir}/c`, 'new changes to file c')
    await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async function (index) {
        index.delete({ filepath: 'c' })
      }
    )

    const fileAWorkdirVersion = await fs.read(`${dir}/a`).then(buffer => {
      return buffer.toString()
    })
    const fileBWorkdirVersion = await fs.read(`${dir}/b`).then(buffer => {
      return buffer.toString()
    })
    const fileCWorkdirVersion = await fs.read(`${dir}/c`).then(buffer => {
      return buffer.toString()
    })

    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.IndexResetError.code)

    const fileAContent = await fs.read(`${dir}/a`).then(buffer => {
      return buffer.toString()
    })
    const fileBContent = await fs.read(`${dir}/b`).then(buffer => {
      return buffer.toString()
    })
    const fileCContent = await fs.read(`${dir}/c`).then(buffer => {
      return buffer.toString()
    })

    const dirContents = await fs.readdir(dir)

    expect(dirContents.length).toBe(3)
    expect(fileAContent).toEqual(fileAWorkdirVersion)
    expect(fileBContent).toEqual(fileBWorkdirVersion)
    expect(fileCContent).toEqual(fileCWorkdirVersion)
  })

  it('workdir != index && index != head [stage a file and them modify in workdir] (throw an error)', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    await fs.write(`${dir}/a`, 'text that is in the index')
    await add({ fs, dir, gitdir, filepath: 'a' })
    await fs.write(`${dir}/a`, 'text that is in the workdir')

    const fileBWorkdirVersion = await fs.read(`${dir}/b`).then(buffer => {
      return buffer.toString()
    })
    const fileCWorkdirVersion = await fs.read(`${dir}/c`).then(buffer => {
      return buffer.toString()
    })

    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.IndexResetError.code)

    const fileAContent = await fs.read(`${dir}/a`).then(buffer => {
      return buffer.toString()
    })
    const fileBContent = await fs.read(`${dir}/b`).then(buffer => {
      return buffer.toString()
    })
    const fileCContent = await fs.read(`${dir}/c`).then(buffer => {
      return buffer.toString()
    })

    const dirContents = await fs.readdir(dir)

    expect(dirContents.length).toBe(3)
    expect(fileAContent).toEqual('text that is in the workdir')
    expect(fileBContent).toEqual(fileBWorkdirVersion)
    expect(fileCContent).toEqual(fileCWorkdirVersion)
  })

  it('workdir != index && index === head (keep our changes)', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')

    const head = await resolveRef({ fs, gitdir, ref: 'HEAD' })

    const fileAHeadVersion = await readBlob({
      fs,
      gitdir,
      oid: head,
      filepath: 'a',
    }).then(result => {
      return new TextDecoder().decode(result.blob)
    })
    const fileBHeadVersion = await readBlob({
      fs,
      gitdir,
      oid: head,
      filepath: 'b',
    }).then(result => {
      return new TextDecoder().decode(result.blob)
    })

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    await fs.write(`${dir}/c`, 'new text for file c')
    await abortMerge({ fs, dir, gitdir })

    const fileAContent = await fs.read(`${dir}/a`).then(buffer => {
      return buffer.toString()
    })
    const fileBContent = await fs.read(`${dir}/b`).then(buffer => {
      return buffer.toString()
    })
    const fileCContent = await fs.read(`${dir}/c`).then(buffer => {
      return buffer.toString()
    })

    const dirContents = await fs.readdir(dir)

    expect(dirContents.length).toBe(3)
    expect(fileAContent).toEqual(fileAHeadVersion)
    expect(fileBContent).toEqual(fileBHeadVersion)
    expect(fileCContent).toEqual('new text for file c')
  })

  it('keeps new files the user staged during the merge', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-abortMerge')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
        author,
      })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MergeConflictError.code)

    // A file staged during the merge, and one left only in the index.
    await fs.write(`${dir}/added`, 'added during the merge')
    await add({ fs, dir, gitdir, filepath: 'added' })
    await fs.write(`${dir}/index-only`, 'only in the index')
    await add({ fs, dir, gitdir, filepath: 'index-only' })
    await fs.rm(`${dir}/index-only`)

    await abortMerge({ fs, dir, gitdir })

    // Unstaged, but still on disk.
    expect(await fs.read(`${dir}/added`, 'utf8')).toBe('added during the merge')
    expect(await fs.exists(`${dir}/index-only`)).toBe(false)
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a', 'b', 'c'])
    expect(await fs.read(`${dir}/a`, 'utf8')).not.toContain('<<<<<<<')
  })
  it('removes the files the merge added and the folders left empty', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-merge-added')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // An octopus merge of two commits: one adds o.txt, the other two files.
    await fs.write(`${dir}/o.txt`, 'o\n')
    await add({ fs, dir, gitdir, filepath: 'o.txt' })
    const other = await commit({
      fs,
      dir,
      gitdir,
      message: 'other',
      author,
      noUpdateBranch: true,
    })
    await remove({ fs, dir, gitdir, filepath: 'o.txt' })
    await fs.write(`${dir}/new/dir/f.txt`, 'f\n')
    await fs.write(`${dir}/t.txt`, 't\n')
    await add({ fs, dir, gitdir, filepath: ['new', 't.txt'] })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    // The merge left all three staged, as git does, and recorded the merge
    // in progress. The user then changed one and staged a file of their own.
    await add({ fs, dir, gitdir, filepath: 'o.txt' })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n${other}\n`)
    for (const file of ['MERGE_MSG', 'MERGE_MODE', 'AUTO_MERGE', 'MERGE_RR']) {
      await fs.write(`${gitdir}/${file}`, '\n')
    }
    await fs.write(`${dir}/t.txt`, 'edited\n')
    await fs.write(`${dir}/mine.txt`, 'mine\n')
    await add({ fs, dir, gitdir, filepath: ['t.txt', 'mine.txt'] })

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.exists(`${dir}/new`)).toBe(false)
    expect(await fs.exists(`${dir}/o.txt`)).toBe(false)
    // Added by the merge but then changed: only unstaged.
    expect(await fs.read(`${dir}/t.txt`, 'utf8')).toBe('edited\n')
    expect(await fs.read(`${dir}/mine.txt`, 'utf8')).toBe('mine\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a.txt'])
    // The merge is forgotten, as `git merge --abort` does.
    for (const file of [
      'MERGE_HEAD',
      'MERGE_MSG',
      'MERGE_MODE',
      'AUTO_MERGE',
      'MERGE_RR',
    ]) {
      expect(await fs.exists(`${gitdir}/${file}`)).toBe(false)
    }
  })
  it('keeps a folder that still holds an untracked file', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-keep-folder')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await fs.write(`${dir}/new/f.txt`, 'f\n')
    await add({ fs, dir, gitdir, filepath: 'new' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    await fs.write(`${dir}/new/untracked.txt`, 'u\n')

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.exists(`${dir}/new/f.txt`)).toBe(false)
    expect(await fs.read(`${dir}/new/untracked.txt`, 'utf8')).toBe('u\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a.txt'])
  })
  it('skips what in MERGE_HEAD is not a commit stored locally', async () => {
    const { fs, gitdir, dir } = await makeFixture(
      'tmp-abort-missing-merge-head'
    )
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await fs.write(`${dir}/a.txt`, 'changed\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    // A commit that is not here, and a blob.
    const blob = await writeBlob({ fs, dir, gitdir, blob: Buffer.from('b\n') })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${'1'.repeat(40)}\n${blob}\n`)

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.read(`${dir}/a.txt`, 'utf8')).toBe('a\n')
    expect(await fs.exists(`${gitdir}/MERGE_HEAD`)).toBe(false)
  })
  it('does not scan the index for files only in the merged commit', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-theirs-only')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await fs.write(`${dir}/gone/g.txt`, 'g\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    const theirs = await commit({ fs, dir, gitdir, message: 'base', author })
    // Ours deleted gone/g.txt, which the merged commit still has.
    await remove({ fs, dir, gitdir, filepath: 'gone/g.txt' })
    await fs.rm(`${dir}/gone/g.txt`)
    await commit({ fs, dir, gitdir, message: 'ours', author })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    // Removing a path that is not in the index loops over every entry.
    const original = GitIndex.prototype.delete
    let deletes = 0
    GitIndex.prototype.delete = function (...args) {
      deletes++
      return original.apply(this, args)
    }
    try {
      await abortMerge({ fs, dir, gitdir })
    } finally {
      GitIndex.prototype.delete = original
    }

    expect(deletes).toBe(0)
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a.txt'])
  })
  it('refuses to restore a file replaced with a folder that holds a new file', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-folder-new-file')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await fs.write(`${dir}/x`, 'x\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // No merge state: x/d/y is the user's own new file, two folders down.
    await remove({ fs, dir, gitdir, filepath: 'x' })
    await fs.rm(`${dir}/x`)
    await fs.write(`${dir}/x/d/y`, 'mine\n')
    await add({ fs, dir, gitdir, filepath: 'x/d/y' })
    await fs.write(`${dir}/a.txt`, 'changed\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })

    let error = null
    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('x/d/y')
    // Nothing was touched.
    expect(await fs.read(`${dir}/x/d/y`, 'utf8')).toBe('mine\n')
    expect(await fs.read(`${dir}/a.txt`, 'utf8')).toBe('changed\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a.txt', 'x/d/y'])
  })
  it('refuses to restore a file replaced with a folder that holds an untracked file', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-folder-untracked')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/x`, 'x\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged replaces x with x/y, and the merge left that
    // staged; then the user added an untracked file to the folder.
    await remove({ fs, dir, gitdir, filepath: 'x' })
    await fs.rm(`${dir}/x`)
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x/y' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    await fs.write(`${dir}/x/u.txt`, 'u\n')

    let error = null
    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('x/u.txt')
    expect(await fs.read(`${dir}/x/y`, 'utf8')).toBe('y\n')
    expect(await fs.read(`${dir}/x/u.txt`, 'utf8')).toBe('u\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['x/y'])
    // The merge is still in progress.
    expect(await fs.exists(`${gitdir}/MERGE_HEAD`)).toBe(true)
  })
  it('restores a file whose name the merge changed only in case', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-case-rename')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/Foo.txt`, 'F\n')
    await add({ fs, dir, gitdir, filepath: 'Foo.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged renames Foo.txt to foo.txt, and the merge
    // left that staged.
    await remove({ fs, dir, gitdir, filepath: 'Foo.txt' })
    await fs.rm(`${dir}/Foo.txt`)
    await fs.write(`${dir}/foo.txt`, 'F\n')
    await add({ fs, dir, gitdir, filepath: 'foo.txt' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    caseInsensitive(fs)

    await abortMerge({ fs, dir, gitdir })

    const names = await fs._readdir(dir)
    expect(names.filter(name => name !== '.git')).toEqual(['Foo.txt'])
    expect(await fs.read(`${dir}/Foo.txt`, 'utf8')).toBe('F\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['Foo.txt'])
  })
  it('restores a file the merge replaced with a folder', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-file-to-folder')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/x`, 'x\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged replaces the file x with x/y, and the merge
    // left that staged.
    await remove({ fs, dir, gitdir, filepath: 'x' })
    await fs.rm(`${dir}/x`)
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x/y' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.read(`${dir}/x`, 'utf8')).toBe('x\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['x'])
  })
  it('restores a folder the merge replaced with a file', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-folder-to-file')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged replaces x/y with the file x, and the merge
    // left that staged.
    await remove({ fs, dir, gitdir, filepath: 'x/y' })
    await fs.rm(`${dir}/x/y`)
    await fs.rmdir(`${dir}/x`)
    await fs.write(`${dir}/x`, 'x\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.read(`${dir}/x/y`, 'utf8')).toBe('y\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['x/y'])
  })
  it('refuses to restore a folder replaced with a file of the user', async () => {
    const { fs, gitdir, dir } = await makeFixture(
      'tmp-abort-folder-to-user-file'
    )
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // No merge state: the file x is the user's own.
    await remove({ fs, dir, gitdir, filepath: 'x/y' })
    await fs.rm(`${dir}/x/y`)
    await fs.rmdir(`${dir}/x`)
    await fs.write(`${dir}/x`, 'mine\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await fs.write(`${dir}/a.txt`, 'changed\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })

    let error = null
    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('x')
    // Nothing was touched.
    expect(await fs.read(`${dir}/x`, 'utf8')).toBe('mine\n')
    expect(await fs.read(`${dir}/a.txt`, 'utf8')).toBe('changed\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a.txt', 'x'])
  })
  it('restores a file replaced with a folder that also holds empty folders', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-folder-empty-sub')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/x`, 'x\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await remove({ fs, dir, gitdir, filepath: 'x' })
    await fs.rm(`${dir}/x`)
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x/y' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    await fs.mkdir(`${dir}/x/e/f`)

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.read(`${dir}/x`, 'utf8')).toBe('x\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['x'])
  })
  it('does not take a submodule for a file replaced with a folder', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-submodule')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    const base = await commit({ fs, dir, gitdir, message: 'base', author })
    // HEAD has a submodule `sub` (here pointing at a commit stored in this
    // repository), checked out as a folder, and the merge left it conflicted.
    const withSub = await writeTree({
      fs,
      dir,
      gitdir,
      tree: [
        ...(await readTree({ fs, dir, gitdir, oid: base })).tree,
        { mode: '160000', path: 'sub', oid: base, type: 'commit' },
      ],
    })
    await commit({ fs, dir, gitdir, message: 'sub', author, tree: withSub })
    await fs.write(`${dir}/sub/f.txt`, 'f\n')
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      for (const stage of [1, 2, 3]) {
        index.insert({ filepath: 'sub', oid: base, stage })
      }
    })

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.read(`${dir}/sub/f.txt`, 'utf8')).toBe('f\n')
  })
  it('refuses to restore a file replaced with a folder named in another case that holds a new file', async () => {
    const { fs, gitdir, dir } = await makeFixture(
      'tmp-abort-case-folder-new-file'
    )
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/X`, 'X\n')
    await add({ fs, dir, gitdir, filepath: 'X' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged replaces X with x/y, the merge left that
    // staged, and the user staged a file of their own in x.
    await remove({ fs, dir, gitdir, filepath: 'X' })
    await fs.rm(`${dir}/X`)
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x/y' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    await fs.write(`${dir}/x/n`, 'mine\n')
    await add({ fs, dir, gitdir, filepath: 'x/n' })
    caseInsensitive(fs)

    let error = null
    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('x/n')
    // Nothing was touched.
    expect(await fs.read(`${dir}/x/y`, 'utf8')).toBe('y\n')
    expect(await fs.read(`${dir}/x/n`, 'utf8')).toBe('mine\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['x/n', 'x/y'])
  })
  it('restores a file replaced with a folder named in another case that holds an empty folder', async () => {
    const { fs, gitdir, dir } = await makeFixture(
      'tmp-abort-case-folder-empty-sub'
    )
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/X`, 'X\n')
    await add({ fs, dir, gitdir, filepath: 'X' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await remove({ fs, dir, gitdir, filepath: 'X' })
    await fs.rm(`${dir}/X`)
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x/y' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    await fs.mkdir(`${dir}/x/e`)
    caseInsensitive(fs)

    await abortMerge({ fs, dir, gitdir })

    const names = await fs._readdir(dir)
    expect(names.filter(name => name !== '.git')).toEqual(['X'])
    expect(await fs.read(`${dir}/X`, 'utf8')).toBe('X\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['X'])
  })
  it('refuses to restore a file replaced with a folder named in another case, in any walk order', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-case-folder-order')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/x`, 'x\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged replaces x with X/y, the merge left that
    // staged, and the user staged a file of their own in X.
    await remove({ fs, dir, gitdir, filepath: 'x' })
    await fs.rm(`${dir}/x`)
    await fs.write(`${dir}/X/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'X/y' })
    const theirs = await commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(`${gitdir}/MERGE_HEAD`, `${theirs}\n`)
    await fs.write(`${dir}/X/n`, 'mine\n')
    await add({ fs, dir, gitdir, filepath: 'X/n' })
    caseInsensitive(fs)
    // X sorts before x, and finding the folder under the name x is slow.
    const lstat = fs._lstat
    fs._lstat = async (filepath, ...args) => {
      if (filepath === `${dir}/x`)
        await new Promise(resolve => setTimeout(resolve, 100))
      return lstat(filepath, ...args)
    }

    let error = null
    try {
      await abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('X/n')
    // Nothing was touched.
    expect(await fs.read(`${dir}/X/y`, 'utf8')).toBe('y\n')
    expect(await fs.read(`${dir}/X/n`, 'utf8')).toBe('mine\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['X/n', 'X/y'])
  })
  it('restores a folder whose place a conflicted file took', async () => {
    const { fs, gitdir, dir } = await makeFixture(
      'tmp-abort-folder-conflicted-file'
    )
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/x/y`, 'y\n')
    await add({ fs, dir, gitdir, filepath: 'x' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // The merge left a conflicted file x where HEAD has the folder x, and
    // wrote it with conflict markers.
    await remove({ fs, dir, gitdir, filepath: 'x/y' })
    await fs.rm(`${dir}/x/y`)
    await fs.rmdir(`${dir}/x`)
    await fs.write(`${dir}/x`, '<<<<<<< ours\no\n=======\nt\n>>>>>>> theirs\n')
    const ours = await writeBlob({ fs, dir, gitdir, blob: Buffer.from('o\n') })
    const theirs = await writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('t\n'),
    })
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      index.insert({ filepath: 'x', oid: ours, stage: 2 })
      index.insert({ filepath: 'x', oid: theirs, stage: 3 })
    })

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.read(`${dir}/x/y`, 'utf8')).toBe('y\n')
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['x/y'])
  })
  it('restores executable files with their mode', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-exec')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/c.txt`, '1\n2\n3\n')
    await fs.write(`${dir}/run.sh`, 'a\n', { mode: 0o777 })
    await add({ fs, dir, gitdir, filepath: '.' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
    await fs.write(`${dir}/c.txt`, '1\nfeature\n3\n')
    await fs.rm(`${dir}/run.sh`)
    await fs.write(`${dir}/run.sh`, 'b\n', { mode: 0o777 })
    await add({ fs, dir, gitdir, filepath: '.' })
    await commit({ fs, dir, gitdir, message: 'feature', author })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs.write(`${dir}/c.txt`, '1\nmaster\n3\n')
    await add({ fs, dir, gitdir, filepath: 'c.txt' })
    await commit({ fs, dir, gitdir, message: 'master', author })
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        theirs: 'feature',
        abortOnConflict: false,
        author,
      })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MergeConflictError.code)
    // git's merge stages the files it changed; this merge leaves them
    // unstaged, where they would count as local edits
    await add({ fs, dir, gitdir, filepath: 'run.sh' })

    await abortMerge({ fs, dir, gitdir })

    // Read before statusMatrix, which refreshes index entries from disk:
    // the index itself must have the mode.
    const mode = await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async index => index.entriesMap.get('run.sh').mode
    )
    expect(mode).toBe(0o100755)
    expect(await fs.read(`${dir}/run.sh`, 'utf8')).toBe('a\n')
    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix.every(row => row.slice(1).join() === '1,1,1')).toBe(true)
  })
  it('restores the executable bit on disk', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-exec-bit')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/run.sh`, 'r\n', { mode: 0o777 })
    await fs.write(`${dir}/plain.sh`, 'p\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    const execMode = (await fs.lstat(`${dir}/run.sh`)).mode
    const plainMode = (await fs.lstat(`${dir}/plain.sh`)).mode
    // Staged executable-bit flips, as a merge leaves them.
    await fs.rm(`${dir}/run.sh`)
    await fs.write(`${dir}/run.sh`, 'r\n')
    await fs.rm(`${dir}/plain.sh`)
    await fs.write(`${dir}/plain.sh`, 'p\n', { mode: 0o777 })
    await add({ fs, dir, gitdir, filepath: ['run.sh', 'plain.sh'] })

    await abortMerge({ fs, dir, gitdir })

    expect((await fs.lstat(`${dir}/run.sh`)).mode).toBe(execMode)
    expect((await fs.lstat(`${dir}/plain.sh`)).mode).toBe(plainMode)
    const modes = await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async index => ({
        run: index.entriesMap.get('run.sh').mode,
        plain: index.entriesMap.get('plain.sh').mode,
      })
    )
    expect(modes).toEqual({ run: 0o100755, plain: 0o100644 })
  })
  it('records the real stats of a restored file', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-stats')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await fs.write(`${dir}/a.txt`, 'changed\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })

    await abortMerge({ fs, dir, gitdir })

    const stat = await fs.lstat(`${dir}/a.txt`)
    const entry = await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async index => index.entriesMap.get('a.txt')
    )
    expect(entry.size).toBe(stat.size)
    expect(entry.mtimeSeconds).toBe(Math.floor(stat.mtimeMs / 1000))
    expect(entry.ctimeSeconds).toBe(Math.floor(stat.ctimeMs / 1000))
  })
  it('restores binary content byte for byte', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-binary')
    await init({ fs, dir, gitdir })
    // Not valid UTF-8.
    const bytes = Uint8Array.from([0, 0xff, 0xfe, 0x80, 0xc3, 0x28])
    await fs.write(`${dir}/b.bin`, bytes)
    await add({ fs, dir, gitdir, filepath: 'b.bin' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await fs.write(`${dir}/b.bin`, Uint8Array.from([1, 2, 3]))
    await add({ fs, dir, gitdir, filepath: 'b.bin' })

    await abortMerge({ fs, dir, gitdir })

    expect([...(await fs.read(`${dir}/b.bin`))]).toEqual([...bytes])
  })
  it('removes conflicted files that are not in HEAD', async () => {
    const { fs, gitdir, dir } = await makeFixture('tmp-abort-conflict-new')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/a.txt`, 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    // A modify/delete conflict (deleted by ours), as a merge leaves it.
    await fs.write(`${dir}/m.txt`, 'theirs\n')
    const base = await writeBlob({ fs, dir, gitdir, blob: Buffer.from('m\n') })
    // An add/add conflict whose file the user then deleted: it is in neither
    // HEAD nor the working tree.
    const ours = await writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('ours\n'),
    })
    const theirs = await writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('theirs\n'),
    })
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      index.insert({ filepath: 'both.txt', oid: ours, stage: 2 })
      index.insert({ filepath: 'both.txt', oid: theirs, stage: 3 })
      index.insert({ filepath: 'm.txt', oid: base, stage: 1 })
      index.insert({ filepath: 'm.txt', oid: theirs, stage: 3 })
    })

    await abortMerge({ fs, dir, gitdir })

    expect(await fs.exists(`${dir}/m.txt`)).toBe(false)
    expect(await listFiles({ fs, dir, gitdir })).toEqual(['a.txt'])
  })
})
