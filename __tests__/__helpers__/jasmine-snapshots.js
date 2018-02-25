/* globals jasmine describe it expect */
const { assertSnapshot } = require('./assertSnapshot')

module.exports = snapshots => {
  // if (typeof jest === 'undefined' && jasmine) {

  /**
   * A fake reporter that lets us keep track of the current test name.
   */
  let snapshotCounts = {}
  let currentSpecName = null
  const SnapshotReporter = {
    suiteStarted (meta) {
      // console.log(meta.description)
      // console.log(meta.fullName)
    },
    specStarted (meta) {
      // console.log(meta.description)
      currentSpecName = meta.fullName
    },
    specDone (meta) {
      // console.log(meta.status)
    },
    suiteDone (meta) {
      // console.log(meta.status)
    }
  }

  const customMatchers = snapshots => ({
    toMatchSnapshot2 (util, customEqualityTesters) {
      return {
        compare (actual) {
          snapshotCounts[currentSpecName] =
            1 + (snapshotCounts[currentSpecName] || 0)
          let currentSnapshotName = `${currentSpecName} ${
            snapshotCounts[currentSpecName]
          }`
          // console.log(`snapshot ${currentSnapshotName}`)
          try {
            assertSnapshot(actual, snapshots, currentSnapshotName)
            return {
              pass: true,
              message: () => `matched snapshot '${currentSnapshotName}'`
            }
          } catch (err) {
            return {
              pass: false,
              message: () => err.message
            }
          }
        }
      }
    }
  })

  jasmine.getEnv().addReporter(SnapshotReporter)
  // jasmine.getEnv().beforeEach(() => {
  jasmine.addMatchers(customMatchers(snapshots))
  // })
  // }
}
