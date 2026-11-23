/* eslint-env node, browser, jasmine */
import { writeCommit, writeTree } from 'isomorphic-git'
import { listCommitsAndTags } from 'isomorphic-git/internal-apis'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('listCommitsAndTags', () => {
  it('listCommitsAndTags', async () => {
    // Setup
    const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-listCommitsAndTags'
    )
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir: gitdirsmfullpath,
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
    const { fs, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-init')
    const tree = await writeTree({ fs, gitdir, tree: [] })
    let timestamp = 1262356920
    /**
     * Writes a commit one second newer than the last one.
     *
     * @param {string} message
     * @param {string[]} parent
     * @returns {Promise<string>} the commit's oid
     */
    const commit = (message, parent) => {
      const person = {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: timestamp++,
        timezoneOffset: 0,
      }
      return writeCommit({
        fs,
        gitdir,
        commit: { message, tree, parent, author: person, committer: person },
      })
    }
    //   root - history - base - local ------ merge
    //                        \              /
    //                         remote1 - remote2
    const root = await commit('root\n', [])
    const history = await commit('history\n', [root])
    const base = await commit('base\n', [history])
    const local = await commit('local\n', [base])
    const remote1 = await commit('remote1\n', [base])
    const remote2 = await commit('remote2\n', [remote1])
    const merge = await commit('merge\n', [local, remote2])
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir: gitdirsmfullpath,
      start: [merge],
      finish: [remote2],
    })
    expect([...commits].sort()).toEqual([merge, local].sort())
  })
})
