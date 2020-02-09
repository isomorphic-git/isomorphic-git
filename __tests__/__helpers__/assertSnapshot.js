const prettyFormat = require('pretty-format')
const diff = require('diff-lines')

module.exports.assertSnapshot = function (object, snapshots, testname) {
  if (!(testname in snapshots)) {
    throw new Error(`Snapshot Test name mispelling: \`${testname}\`
Available snapshots: ${Object.keys(snapshots).join('\n - ')}
`)
  }
  let actual = prettyFormat(object)
  if (actual.includes('\n')) actual = `\n${actual}\n`
  if (actual !== snapshots[testname]) {
    throw new Error(`Snapshot Test "${testname}" failed:
${diff(actual, snapshots[testname])}`)
  }
}
