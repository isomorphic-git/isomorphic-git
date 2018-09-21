const comment = require('github-comment')

let commit = process.env.TRAVIS_COMMIT || process.env['Build.SourceVersion']
commit = commit ? ` for ${commit}` : ''

const CommentReporter = function (
  baseReporterDecorator,
  config,
  logger,
  helper,
  formatError
) {
  this.rows = [
    `## Test Results${commit}:`,
    `| Browser | Passed | Skipped | Failed | Time | Disconnected | Error |`,
    `|---------|--------|---------|--------|------|--------------|-------|`
  ]
  this.startTime = Date.now()
  this.onRunStart = function (browsers) {}
  this.onBrowserComplete = function (browser) {
    var results = browser.lastResult
    this.rows.push(
      `| ${browser.name} | ${results.success} | ${results.skipped} | ${
        results.failed
      } | ${helper.formatTimeInterval(Date.now() - this.startTime)} | ${
        results.disconnected
      } | ${results.error.message} |`
    )
  }
  this.onRunComplete = function () {
    postComment(this.rows.join('\n'))
  }
}

function postComment (body) {
  // comment(token, repo, issueId, body)
  if (
    process.env.TRAVIS_PULL_REQUEST &&
    process.env.TRAVIS_PULL_REQUEST !== 'false'
  ) {
    comment(
      process.env.GITHUB_TOKEN,
      process.env.TRAVIS_REPO_SLUG,
      process.env.TRAVIS_PULL_REQUEST,
      body
    )
      .then(response =>
        console.log(`posted results to PR #${process.env.TRAVIS_PULL_REQUEST}`)
      )
      .catch(err => console.log('error leaving Github comment:', err))
  } else {
    console.log(body)
  }
}

module.exports = CommentReporter
