/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-notes.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const {
  addNote,
  listNotes,
  log,
  readObject,
  removeNote,
  showNote
} = require('isomorphic-git')

describe('notes', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  // existing oids from initial commit in test git repository:
  ;[
    ['commit', '6ebf3aa59a5e3cadace0372111e00ec642f0cd00'],
    ['tree', 'ef1f8cce373cccea690b8b494f101d8ca24df0e2'],
    ['file', '4dd1ef7569b18d92d93c0a35bb6b93049137b355']
  ].forEach(([target, targetOid]) => {
    ;[undefined, 'refs/notes/commits', 'refs/notes/custom'].forEach(ref => {
      const logref = ref || 'refs/notes/commits'

      it(`test on ${target} at ${ref}`, async () => {
        // Setup
        const { gitdir } = await makeFixture('test-notes')
        const { oid: commitOid, tree: treeOid } = (await log({
          gitdir,
          depth: 1
        }))[0]

        expect(commitOid).toBe('6ebf3aa59a5e3cadace0372111e00ec642f0cd00')
        expect(treeOid).toBe('ef1f8cce373cccea690b8b494f101d8ca24df0e2')

        const noteIn = 'note 1'
        const {
          commitObjects,
          treeObject,
          noteObject,
          notesList,
          noteOut
        } = await doNote(gitdir, ref, noteIn, targetOid)

        expect(commitObjects.length).toBe(1)
        expect(commitObjects[0]).toMatchSnapshot()
        expect(treeObject).toMatchSnapshot()
        expect(noteObject).toMatchSnapshot()
        expect(notesList.length).toBe(1)
        expect(notesList[0]).toMatchSnapshot()
        expect(noteOut).toMatchSnapshot()

        // Binary note, same as 'note 2'
        const noteIn2 = [110, 111, 116, 101, 32, 50]
        const {
          commitObjects: commitObjects2,
          treeObject: treeObject2,
          noteObject: noteObject2,
          notesList: notesList2,
          noteOut: noteOut2
        } = await doNote(gitdir, ref, noteIn2, targetOid)
        expect(commitObjects2.length).toBe(2)
        expect(commitObjects2[0]).toMatchSnapshot()
        expect(treeObject2).toMatchSnapshot()
        expect(noteObject2).toMatchSnapshot()
        expect(notesList2.length).toBe(1)
        expect(notesList2[0]).toMatchSnapshot()
        expect(noteOut2).toMatchSnapshot()

        await removeNote({
          gitdir,
          author: {
            name: 'Mr. Test2',
            email: 'mrtest2@example.com',
            timestamp: 1262356920,
            timezoneOffset: -0
          },
          oid: targetOid,
          ref
        })
        const removeLog = await log({ gitdir, depth: 4, ref: logref })
        expect(removeLog.length).toBe(3)
        expect(removeLog[0]).toMatchSnapshot()
        const treeObject3 = await readObject({ gitdir, oid: removeLog[0].tree })
        expect(treeObject3.object.entries.length).toBe(0)
      })

      async function doNote (gitdir, ref, note, oid) {
        await addNote({
          gitdir,
          author: {
            name: 'Mr. Test2',
            email: 'mrtest2@example.com',
            timestamp: 1262356920,
            timezoneOffset: -0
          },
          oid,
          note,
          ref
        })
        const commitObjects = await log({ gitdir, depth: 4, ref: logref })
        const treeObject = await readObject({
          gitdir,
          oid: commitObjects[0].tree
        })
        const noteObject = await readObject({
          gitdir,
          oid: treeObject.object.entries[0].oid
        })

        const notesList = await listNotes({
          gitdir,
          ref
        })
        const noteOut = await showNote({
          gitdir,
          oid,
          ref
        })
        return { commitObjects, treeObject, noteObject, notesList, noteOut }
      }
    })
  })
})
