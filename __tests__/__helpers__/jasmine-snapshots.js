/* eslint-env jasmine */
const { assertSnapshot } = require('./assertSnapshot')

// Jest has a toMatchSnapshot() matcher built in, so we only
// need to run this polyfill if jest is undefined.
module.exports = snapshots => {
  /**
   * A fake reporter that lets us keep track of the current test name.
   */
  const snapshotCounts = {}
  let currentSpecName = null
  const SnapshotReporter = {
    suiteStarted (meta) {
      // console.log(meta.description, meta.fullName)
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

  const customMatchers = snapshots => {
    function toMatchSnapshot (util, customEqualityTesters) {
      return {
        compare (actual) {
          snapshotCounts[currentSpecName] =
            1 + (snapshotCounts[currentSpecName] || 0)
          const currentSnapshotName = `${currentSpecName} ${snapshotCounts[currentSpecName]}`
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
    if (typeof jest === 'undefined' && typeof jasmine !== 'undefined') {
      return {
        toMatchSnapshot,
        toMatchSnapshot2: toMatchSnapshot
      }
    } else if (typeof jest !== 'undefined') {
      return {
        toMatchSnapshot2: toMatchSnapshot
      }
    }
  }

  jasmine.getEnv().addReporter(SnapshotReporter)
  jasmine.addMatchers(customMatchers(snapshots))
}
