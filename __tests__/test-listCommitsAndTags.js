/* eslint-env node, browser, jasmine */
import { writeCommit, writeTree } from 'isomorphic-git'
import { _writeObject, listCommitsAndTags } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

/**
 * Writes this history, with commit times increasing by `step` seconds in the
 * order listed:
 *
 *   root - history - base - local ------ merge
 *                        \              /
 *                         remote1 - remote2 - next
 *
 * `local` is a commit only this repo has, `merge` merges the remote branch
 * into it, and `next` fast-forwards the remote branch.
 */
async function writeHistory({ fs, gitdir, step = 1 }) {
  const tree = await writeTree({ fs, gitdir, tree: [] })
  let timestamp = 1262356920
  /**
   * Writes a commit `step` seconds newer than the last one.
   *
   * @param {string} message
   * @param {string[]} parent
   * @returns {Promise<string>} the commit's oid
   */
  async function commit(message, parent) {
    const person = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: (timestamp += step),
      timezoneOffset: 0,
    }
    return writeCommit({
      fs,
      gitdir,
      commit: { message, tree, parent, author: person, committer: person },
    })
  }
  const root = await commit('root\n', [])
  const history = await commit('history\n', [root])
  const base = await commit('base\n', [history])
  const local = await commit('local\n', [base])
  const remote1 = await commit('remote1\n', [base])
  const remote2 = await commit('remote2\n', [remote1])
  const merge = await commit('merge\n', [local, remote2])
  const next = await commit('next\n', [remote2])
  return { base, local, remote1, remote2, merge, next }
}

describe('listCommitsAndTags', () => {
  it('listCommitsAndTags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listCommitsAndTags')
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: ['c60bbbe99e96578105c57c4b3f2b6ebdf863edbc'],
      finish: ['c77052f99c33dbe3d2a120805fcebe9e2194b6f9'],
    })
    expect([...commits]).toMatchInlineSnapshot(`
      [
        "c60bbbe99e96578105c57c4b3f2b6ebdf863edbc",
        "e05547ea87ea55eff079de295ff56f483e5b4439",
        "ebdedf722a3ec938da3fd53eb74fdea55c48a19d",
        "0518502faba1c63489562641c36a989e0f574d95",
      ]
    `)
  })

  it('leaves out commits reachable from finish after a merge', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-init')
    const { local, remote2, merge } = await writeHistory({ fs, gitdir })
    // Test
    // push also adds the merge base of the local and remote branches to
    // finish, but here that's remote2 itself, so base isn't in finish
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [merge],
      finish: [remote2],
    })
    expect([...commits].sort()).toEqual([merge, local].sort())
  })

  it('leaves out commits reachable from finish when times are equal', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-init')
    // e.g. commits made in the same second by a rebase
    const { local, remote2, merge } = await writeHistory({
      fs,
      gitdir,
      step: 0,
    })
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [merge],
      finish: [remote2],
    })
    expect([...commits].sort()).toEqual([merge, local].sort())
  })

  it('lists only the new commits for a fast-forward', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-init')
    const { remote2, next } = await writeHistory({ fs, gitdir })
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [next],
      finish: [remote2],
    })
    expect([...commits]).toEqual([next])
  })

  it('does not read commits in finish that it never reaches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-init')
    const { local, remote2, merge, next } = await writeHistory({ fs, gitdir })
    const nextPath = `objects/${next.slice(0, 2)}/${next.slice(2)}`
    let readsOfNext = 0
    const read = fs.read.bind(fs)
    fs.read = async (filepath, options) => {
      if (filepath.endsWith(nextPath)) readsOfNext++
      return read(filepath, options)
    }
    // Test
    // e.g. a remote branch that moved on after the one being pushed
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [merge],
      finish: [next, remote2],
    })
    expect([...commits].sort()).toEqual([merge, local].sort())
    expect(readsOfNext).toBe(0)
  })

  it('handles a commit with no committer', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-init')
    const { remote2 } = await writeHistory({ fs, gitdir })
    const tree = await writeTree({ fs, gitdir, tree: [] })
    const oid = await _writeObject({
      fs,
      gitdir,
      type: 'commit',
      object: Buffer.from(
        `tree ${tree}\nparent ${remote2}\n` +
          'author Mr. Test <mrtest@example.com> 1262356990 +0000\n\n' +
          'no committer\n'
      ),
    })
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [oid],
      finish: [remote2],
    })
    expect([...commits]).toEqual([oid])
  })

  it('ignores commits in finish that are missing locally', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-init')
    const { local, remote2, merge } = await writeHistory({ fs, gitdir })
    // Test
    // e.g. a remote branch this repo has never fetched
    const missing = '0123456789abcdef0123456789abcdef01234567'
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [merge],
      finish: [missing, remote2],
    })
    expect([...commits].sort()).toEqual([merge, local].sort())
  })
})
