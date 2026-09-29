/* eslint-env node, browser, jasmine */
import * as path from 'path'

import { statusMatrix, add, commit, remove } from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { countIndexWrites } from './__helpers__/countIndexWrites.js'

describe('statusMatrix', () => {
  it('statusMatrix', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix')
    // Test
    let matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
    ])

    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    await remove({ fs, dir, gitdir, filepath: 'c.txt' })
    await add({ fs, dir, gitdir, filepath: 'd.txt' })
    matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 2],
      ['c.txt', 1, 0, 0],
      ['d.txt', 0, 2, 2],
    ])

    // And finally the weirdo cases
    const acontent = await fs.read(path.join(dir, 'a.txt'))
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await fs.write(path.join(dir, 'a.txt'), acontent)
    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['a.txt'] })
    expect(matrix).toEqual([['a.txt', 1, 1, 3]])

    await remove({ fs, dir, gitdir, filepath: 'a.txt' })
    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['a.txt'] })
    expect(matrix).toEqual([['a.txt', 1, 1, 0]])

    await fs.write(path.join(dir, 'e.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'e.txt' })
    await fs.rm(path.join(dir, 'e.txt'))
    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['e.txt'] })
    expect(matrix).toEqual([['e.txt', 0, 0, 3]])
  })

  it('statusMatrix in an fresh git repo with no commits', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'a.txt'), 'Hi')
    await fs.write(path.join(dir, 'b.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    // Test
    const a = await statusMatrix({ fs, dir, gitdir, filepaths: ['a.txt'] })
    expect(a).toEqual([['a.txt', 0, 2, 0]])
    const b = await statusMatrix({ fs, dir, gitdir, filepaths: ['b.txt'] })
    expect(b).toEqual([['b.txt', 0, 2, 2]])
  })

  it('statusMatrix in an fresh git repo with no commits and .gitignore', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')
    await add({ fs, dir, gitdir, filepath: '.' })
    // Test
    const a = await statusMatrix({ fs, dir, gitdir })
    expect(a).toEqual([['.gitignore', 0, 2, 2]])
  })

  it('does not return ignored files already in the index', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')

    // Test
    const a = await statusMatrix({ fs, dir, gitdir })
    expect(a).toEqual([['.gitignore', 0, 2, 2]])
  })

  it('returns ignored files already in the index if ignored:true', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')

    // Test
    const a = await statusMatrix({ fs, dir, gitdir, ignored: true })
    expect(a).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 0],
    ])
  })

  it('ignored:true works with multiple added files ', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(
      path.join(dir, '.gitignore'),
      'ignoreme.txt\nignoreme2.txt\n'
    )
    await add({ fs, dir, gitdir, filepath: '.' })
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')
    await fs.write(path.join(dir, 'ignoreme2.txt'), 'ignored')

    // Test
    const a = await statusMatrix({ fs, dir, gitdir, ignored: true })
    expect(a).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 0],
      ['ignoreme2.txt', 0, 2, 0],
    ])
  })

  describe('ignored:true works supports multiple filepaths', () => {
    let fs, dir, gitdir
    const ignoredFolder = 'ignoreThisFolder'
    const nonIgnoredFolder = 'nonIgnoredFolder'

    beforeAll(async () => {
      // Setup
      const output = await makeFixture('test-empty')
      fs = output.fs
      dir = output.dir
      gitdir = output.gitdir

      await fs.write(path.join(dir, '.gitignore'), `${ignoredFolder}/*\n`)
      await add({ fs, dir, gitdir, filepath: '.' })
      await fs.mkdir(path.join(dir, ignoredFolder))
      await fs.mkdir(path.join(dir, nonIgnoredFolder))
      await fs.write(
        path.join(dir, nonIgnoredFolder, 'notIgnored.txt'),
        'notIgnored'
      )
      await fs.write(path.join(dir, ignoredFolder, 'ignoreme.txt'), 'ignored')
      await fs.write(path.join(dir, 'notIgnored.txt'), 'notIgnored')
    })

    it('base case: no filepaths', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        ignored: true,
      })
      expect(result).toEqual([
        ['.gitignore', 0, 2, 2],
        [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
        [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
        ['notIgnored.txt', 0, 2, 0],
      ])
    })

    it('filepaths on ignored folder should return empty', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: [ignoredFolder],
      })
      expect(result).toEqual([])
    })

    it('shows nonignored file and folder', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: [ignoredFolder, 'notIgnored.txt', nonIgnoredFolder],
      })
      expect(result).toEqual([
        [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
        ['notIgnored.txt', 0, 2, 0],
      ])
    })

    it('filepaths on ignored folder and non-ignored file should show all files with ignored:true ', async () => {
      const result = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: [ignoredFolder, 'notIgnored.txt', nonIgnoredFolder],
        ignored: true,
      })
      expect(result).toEqual([
        [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
        [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
        ['notIgnored.txt', 0, 2, 0],
      ])
    })

    describe('all files, ignored:true, test order permutation', () => {
      it('file, ignored, notignored', async () => {
        const result = await statusMatrix({
          fs,
          dir,
          gitdir,
          filepaths: ['notIgnored.txt', ignoredFolder, nonIgnoredFolder],
          ignored: true,
        })
        expect(result).toEqual([
          [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
          [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
          ['notIgnored.txt', 0, 2, 0],
        ])
      })
      it('ignored, notignored, file', async () => {
        const result = await statusMatrix({
          fs,
          dir,
          gitdir,
          filepaths: [ignoredFolder, nonIgnoredFolder, 'notIgnored.txt'],
          ignored: true,
        })
        expect(result).toEqual([
          [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
          [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
          ['notIgnored.txt', 0, 2, 0],
        ])
      })
      it('notignored, ignored, file', async () => {
        const result = await statusMatrix({
          fs,
          dir,
          gitdir,
          filepaths: [nonIgnoredFolder, ignoredFolder, 'notIgnored.txt'],
          ignored: true,
        })
        expect(result).toEqual([
          [`${ignoredFolder}/ignoreme.txt`, 0, 2, 0],
          [`${nonIgnoredFolder}/notIgnored.txt`, 0, 2, 0],
          ['notIgnored.txt', 0, 2, 0],
        ])
      })
    })
  })
  it('ignored: true has no impact when file is already in index', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, '.gitignore'), 'ignoreme.txt\n')
    await fs.write(path.join(dir, 'ignoreme.txt'), 'ignored')
    await add({ fs, dir, gitdir, filepath: '.', force: true })
    // Test
    const a = await statusMatrix({ fs, dir, gitdir, ignored: true })
    expect(a).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 2],
    ])
    // Test
    const b = await statusMatrix({ fs, dir, gitdir, ignored: false })
    expect(b).toEqual([
      ['.gitignore', 0, 2, 2],
      ['ignoreme.txt', 0, 2, 2],
    ])
  })

  it('statusMatrix with filepaths', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Test
    let matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
      ['g/g.txt', 0, 2, 0],
      ['h/h.txt', 0, 2, 0],
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])

    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['i'] })
    expect(matrix).toEqual([
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])

    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: [] })
    expect(matrix).toBeUndefined()

    matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['i', 'h'] })
    expect(matrix).toEqual([
      ['h/h.txt', 0, 2, 0],
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])
  })

  it('statusMatrix with filepaths stops at a path component boundary', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Siblings whose names start with the requested path, but which are
    // neither the path itself nor anything under it.
    await fs.write(path.join(dir, 'index.js'), 'sibling file')
    await fs.mkdir(path.join(dir, 'i2'))
    await fs.write(path.join(dir, 'i2', 'i2.txt'), 'sibling directory')

    // Test
    const matrix = await statusMatrix({ fs, dir, gitdir, filepaths: ['i'] })
    expect(matrix).toEqual([
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])
  })

  it('statusMatrix with a trailing slash on the filepath', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix-filepath')

    // Test
    expect(await statusMatrix({ fs, dir, gitdir, filepaths: ['i/'] })).toEqual([
      ['i/.gitignore', 0, 2, 0],
      ['i/i.txt', 0, 2, 0],
    ])

    // './' names the repository root, the same as '.'
    expect(await statusMatrix({ fs, dir, gitdir, filepaths: ['./'] })).toEqual(
      await statusMatrix({ fs, dir, gitdir, filepaths: ['.'] })
    )
  })

  it('statusMatrix with filter', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix-filepath')
    // Test
    let matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filter: filepath => !filepath.includes('/') && filepath.endsWith('.txt'),
    })
    expect(matrix).toEqual([
      ['a.txt', 1, 1, 1],
      ['b.txt', 1, 2, 1],
      ['c.txt', 1, 0, 1],
      ['d.txt', 0, 2, 0],
    ])

    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filter: filepath => filepath.endsWith('.gitignore'),
    })
    expect(matrix).toEqual([['i/.gitignore', 0, 2, 0]])

    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filter: filepath => filepath.endsWith('.txt'),
      filepaths: ['i'],
    })
    expect(matrix).toEqual([['i/i.txt', 0, 2, 0]])
  })

  it('statusMatrix with removed folder and created file with same name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-statusMatrix-tree-blob-collision'
    )
    // Test
    await fs.rmdir(path.join(dir, 'a'), { recursive: true })
    await fs.write(path.join(dir, 'a'), 'Hi')
    let matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a', 0, 2, 0],
      ['a/a.txt', 1, 0, 1],
      ['b', 1, 1, 1],
    ])
    await remove({ fs, dir, gitdir, filepath: 'a/a.txt' })
    await add({ fs, dir, gitdir, filepath: 'a' })
    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a', 0, 2, 2],
      ['a/a.txt', 1, 0, 0],
      ['b', 1, 1, 1],
    ])
  })

  it('statusMatrix with removed file and created folder with same name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-statusMatrix-blob-tree-collision'
    )
    // Test
    await fs.rm(path.join(dir, 'b'))
    await fs.mkdir(path.join(dir, 'b'))
    await fs.write(path.join(dir, 'b/b.txt'), 'Hi')
    let matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a/a.txt', 1, 1, 1],
      ['b', 1, 0, 1],
      ['b/b.txt', 0, 2, 0],
    ])
    await remove({ fs, dir, gitdir, filepath: 'b' })
    await add({ fs, dir, gitdir, filepath: 'b/b.txt' })
    matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
    })
    expect(matrix).toEqual([
      ['a/a.txt', 1, 1, 1],
      ['b', 1, 0, 0],
      ['b/b.txt', 0, 2, 2],
    ])
  })

  it('does not modify .git/index when refresh is false', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-statusMatrix')
    // Take an unmodified tracked file and bump its workdir mtime without
    // changing contents, so the racy stat-cache refresh would normally fire.
    const original = await fs.read(path.join(dir, 'a.txt'))
    await fs.write(path.join(dir, 'a.txt'), original)
    // Snapshot the index file
    const indexBefore = await fs.read(path.join(gitdir, 'index'))
    // Read-only statusMatrix call
    const matrix = await statusMatrix({
      fs,
      dir,
      gitdir,
      filepaths: ['a.txt'],
      refresh: false,
    })
    expect(matrix).toEqual([['a.txt', 1, 1, 1]])
    const indexAfter = await fs.read(path.join(gitdir, 'index'))
    expect(indexAfter).toEqual(indexBefore)
  })

  describe('stale index stats', () => {
    const author = { name: 'Test', email: 'test@example.com' }
    const STALE_SECONDS = 1000

    // Create a repo where every file is committed and staged.
    async function makeCommittedRepo(count) {
      const { fs, dir, gitdir } = await makeFixture('test-empty')
      const indexGitdir = gitdir
      const filepaths = []
      for (let i = 0; i < count; i++) {
        const filepath = `d/sub${i % 10}/file${i}.txt`
        await fs.write(path.join(dir, filepath), `content ${i}\n`)
        filepaths.push(filepath)
      }
      await add({ fs, dir, gitdir, filepath: 'd' })
      await commit({ fs, dir, gitdir, message: 'initial', author })
      return { fs, dir, gitdir, indexGitdir, filepaths }
    }

    // Change the recorded stats of index entries, but not their oid.
    // This has the same effect as `touch` on the files.
    /**
     * @param {any} fs
     * @param {string} gitdir
     * @param {(filepath: string) => boolean} [shouldChange]
     */
    async function makeStale(fs, gitdir, shouldChange = () => true) {
      const cache = {}
      await GitIndexManager.acquire(
        { fs, gitdir, cache },
        async function (index) {
          for (const entry of [...index]) {
            if (!shouldChange(entry.path)) continue
            index.insert({
              filepath: entry.path,
              stats: {
                ...entry,
                mtimeSeconds: entry.mtimeSeconds - STALE_SECONDS,
                ctimeSeconds: entry.ctimeSeconds - STALE_SECONDS,
              },
              oid: entry.oid,
            })
          }
        }
      )
    }

    async function readIndexEntries(fs, gitdir) {
      const entries = new Map()
      await GitIndexManager.acquire(
        { fs, gitdir, cache: {} },
        async function (index) {
          for (const entry of index) entries.set(entry.path, { ...entry })
        }
      )
      return entries
    }

    it('writes the index a constant number of times for many stale files', async () => {
      // Setup
      const { fs, dir, gitdir, indexGitdir } = await makeCommittedRepo(300)
      await makeStale(fs, indexGitdir)
      const { fs: countedFs, counter } = countIndexWrites(fs)
      // Test
      const matrix = await statusMatrix({
        fs: countedFs,
        dir,
        gitdir,
        filepaths: ['d'],
      })
      expect(matrix).toHaveLength(300)
      expect(
        matrix.every(row => row[1] === 1 && row[2] === 1 && row[3] === 1)
      ).toBe(true)
      expect(counter.count).toBeGreaterThan(0)
      expect(counter.count).toBeLessThanOrEqual(2)
    })

    it('refreshes the stats so a second run does not write the index', async () => {
      // Setup
      const { fs, dir, gitdir, indexGitdir, filepaths } =
        await makeCommittedRepo(50)
      await makeStale(fs, indexGitdir)
      const { fs: countedFs, counter } = countIndexWrites(fs)
      // Test
      const first = await statusMatrix({ fs: countedFs, dir, gitdir })
      expect(counter.count).toBeGreaterThan(0)
      const entries = await readIndexEntries(fs, indexGitdir)
      for (const filepath of filepaths) {
        const stats = await fs.lstat(path.join(dir, filepath))
        expect(entries.get(filepath).mtimeSeconds).toBe(
          Math.floor(stats.mtimeMs / 1000)
        )
      }
      counter.reset()
      // A new cache object forces a read of the index file from disk.
      const second = await statusMatrix({ fs: countedFs, dir, gitdir })
      expect(second).toEqual(first)
      expect(counter.count).toBe(0)
    })

    it('returns the same result for each kind of change', async () => {
      // Setup
      const { fs, dir, gitdir, indexGitdir } = await makeCommittedRepo(10)
      const same = 'd/sub1/file1.txt' // stale stats, same content
      const changed = 'd/sub2/file2.txt' // stale stats, changed content
      const deleted = 'd/sub3/file3.txt' // removed from the working tree
      const mode = 'd/sub4/file4.txt' // recorded as executable in the index
      const fresh = 'd/sub5/file5.txt' // stats not stale
      await fs.write(path.join(dir, changed), 'changed\n')
      await fs.rm(path.join(dir, deleted))
      await fs.write(path.join(dir, 'd/new.txt'), 'new file\n')
      await makeStale(fs, indexGitdir, filepath => filepath !== fresh)
      await GitIndexManager.acquire(
        { fs, gitdir: indexGitdir, cache: {} },
        async function (index) {
          const entry = [...index].find(entry => entry.path === mode)
          index.insert({
            filepath: mode,
            stats: { ...entry, mode: 0o100755 },
            oid: entry.oid,
          })
        }
      )
      const before = await readIndexEntries(fs, indexGitdir)
      // Test
      const expected = [
        ['d/new.txt', 0, 2, 0],
        ['d/sub0/file0.txt', 1, 1, 1],
        [same, 1, 1, 1],
        [changed, 1, 2, 1],
        [deleted, 1, 0, 1],
        [mode, 1, 1, 1],
        [fresh, 1, 1, 1],
      ]
      const matrix = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: ['d'],
        filter: f => f === 'd/new.txt' || /file[0-5]\.txt$/.test(f),
      })
      expect(matrix).toEqual(expected.sort((a, b) => (a[0] < b[0] ? -1 : 1)))
      // Only entries with the same content and the same mode get new stats.
      const after = await readIndexEntries(fs, indexGitdir)
      const stats = await fs.lstat(path.join(dir, same))
      expect(after.get(same).mtimeSeconds).toBe(
        Math.floor(stats.mtimeMs / 1000)
      )
      expect(after.get(changed)).toEqual(before.get(changed))
      expect(after.get(deleted)).toEqual(before.get(deleted))
      expect(after.get(mode)).toEqual(before.get(mode))
      expect(after.has('d/new.txt')).toBe(false)
      // The result is the same when the run happens again.
      const again = await statusMatrix({
        fs,
        dir,
        gitdir,
        filepaths: ['d'],
        filter: f => f === 'd/new.txt' || /file[0-5]\.txt$/.test(f),
      })
      expect(again).toEqual(matrix)
    })

    it('works when several calls run at the same time', async () => {
      // Setup
      const { fs, dir, gitdir, indexGitdir } = await makeCommittedRepo(100)
      await makeStale(fs, indexGitdir)
      const { fs: countedFs, counter } = countIndexWrites(fs)
      const shared = {}
      // Test
      const results = await Promise.all([
        statusMatrix({ fs: countedFs, dir, gitdir, filepaths: ['d'] }),
        statusMatrix({ fs: countedFs, dir, gitdir, filepaths: ['d'] }),
        statusMatrix({
          fs: countedFs,
          dir,
          gitdir,
          filepaths: ['d'],
          cache: shared,
        }),
        statusMatrix({
          fs: countedFs,
          dir,
          gitdir,
          filepaths: ['d'],
          cache: shared,
        }),
      ])
      for (const matrix of results) {
        expect(matrix).toHaveLength(100)
        expect(
          matrix.every(row => row[1] === 1 && row[2] === 1 && row[3] === 1)
        ).toBe(true)
      }
      expect(counter.count).toBeLessThanOrEqual(4)
      // The index is still valid and is fresh.
      counter.reset()
      const after = await statusMatrix({ fs: countedFs, dir, gitdir })
      expect(after).toEqual(results[0])
      expect(counter.count).toBe(0)
    })
  })
})
