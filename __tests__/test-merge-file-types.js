/* eslint-env node, browser, jasmine */
import {
  Errors,
  init,
  merge,
  readBlob,
  readTree,
  writeBlob,
  writeCommit,
  writeTree,
} from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

const author = {
  name: 'Test',
  email: 'test@example.com',
  timestamp: 1,
  timezoneOffset: 0,
}

for (const { name, createFixture } of [
  { name: 'ordinary repositories', createFixture: makeFixture },
  { name: 'submodules', createFixture: makeFixtureAsSubmodule },
]) {
  describe(`merge file types in ${name}`, () => {
    for (const baseMode of ['100644', '120000']) {
      for (const changedSide of ['ours', 'theirs']) {
        it(`accepts a ${baseMode} type change on ${changedSide} with the other side unchanged`, async () => {
          const fixture = await createFixture('test-merge-file-types')
          await init(fixture)
          const base = await createCommit(fixture, {
            mode: baseMode,
            content: 'original',
            parent: [],
          })
          const changed = await createCommit(fixture, {
            mode: baseMode === '120000' ? '100644' : '120000',
            content: 'replacement',
            parent: [base],
          })
          const unchanged = await createCommit(fixture, {
            mode: baseMode,
            content: 'original',
            parent: [base],
          })
          const result = await merge({
            ...fixture,
            ours: changedSide === 'ours' ? changed : unchanged,
            theirs: changedSide === 'theirs' ? changed : unchanged,
            author,
            noUpdateBranch: true,
          })
          if (!result.oid) throw new Error('Expected a merged commit')
          const tree = await readTree({ ...fixture, oid: result.oid })
          expect(tree.tree[0].mode).toBe(
            baseMode === '120000' ? '100644' : '120000'
          )
          const blob = await readBlob({
            ...fixture,
            oid: result.oid,
            filepath: 'entry',
          })
          expect(Buffer.from(blob.blob).toString()).toBe('replacement')
        })
      }
    }

    it('merges regular-file replacements using an empty base instead of the symlink target', async () => {
      const fixture = await createFixture('test-merge-file-types')
      await init(fixture)
      const base = await createCommit(fixture, {
        mode: '120000',
        content: 'target',
        parent: [],
      })
      const ours = await createCommit(fixture, {
        mode: '100644',
        content: '',
        parent: [base],
      })
      const theirs = await createCommit(fixture, {
        mode: '100644',
        content: 'replacement\n',
        parent: [base],
      })
      const result = await merge({
        ...fixture,
        ours,
        theirs,
        author,
        noUpdateBranch: true,
      })
      if (!result.oid) throw new Error('Expected a merged commit')
      const tree = await readTree({ ...fixture, oid: result.oid })
      expect(tree.tree[0].mode).toBe('100644')
      const blob = await readBlob({
        ...fixture,
        oid: result.oid,
        filepath: 'entry',
      })
      expect(Buffer.from(blob.blob).toString()).toBe('replacement\n')
    })

    it('does not treat a symlink target as shared text ancestry', async () => {
      const fixture = await createFixture('test-merge-file-types')
      await init(fixture)
      const base = await createCommit(fixture, {
        mode: '120000',
        content: 'one\ntwo\nthree\n',
        parent: [],
      })
      const ours = await createCommit(fixture, {
        mode: '100644',
        content: 'ONE\ntwo\nthree\n',
        parent: [base],
      })
      const theirs = await createCommit(fixture, {
        mode: '100644',
        content: 'one\ntwo\nTHREE\n',
        parent: [base],
      })
      await expect(
        merge({ ...fixture, ours, theirs, author, noUpdateBranch: true })
      ).rejects.toMatchObject({ code: Errors.MergeConflictError.code })
    })
  })
}

/** Create a one-entry commit without materializing filesystem entry types. */
async function createCommit(fixture, { mode, content, parent }) {
  const oid = await writeBlob({ ...fixture, blob: Buffer.from(content) })
  const tree = await writeTree({
    ...fixture,
    tree: [{ path: 'entry', mode, type: 'blob', oid }],
  })
  return writeCommit({
    ...fixture,
    commit: {
      tree,
      parent,
      message: 'Entry version',
      author,
      committer: author,
    },
  })
}
