const comment = require('github-comment')

let commit =
  process.env.TRAVIS_PULL_REQUEST_SHA ||
  process.env.TRAVIS_COMMIT ||
  process.env.BUILD_SOURCEVERSION
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
  const isPR =
    (process.env.TRAVIS_PULL_REQUEST &&
      process.env.TRAVIS_PULL_REQUEST !== 'false') ||
    process.env.BUILD_REASON === 'PullRequest'
  const repo = process.env.TRAVIS_REPO_SLUG || process.env.BUILD_REPOSITORY_NAME
  const issue =
    process.env.TRAVIS_PULL_REQUEST ||
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER ||
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  console.log(`Detected repo: ${repo}, issue: #${issue}, is PR: ${isPR}`)
  if (isPR) {
    comment(process.env.KARMA_PR_REPORTER_GITHUB_TOKEN, repo, issue, body)
      .then(response => console.log(`posted results to PR #${issue}`))
      .catch(err => console.log('error leaving Github comment:', err))
  } else {
    console.log(body)
  }
}

module.exports = CommentReporter
