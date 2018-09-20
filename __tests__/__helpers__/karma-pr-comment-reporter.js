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
  const isPR = (process.env.TRAVIS_PULL_REQUEST && process.env.TRAVIS_PULL_REQUEST !== 'false') ||
    process.env['Build.Reason'] === 'PullRequest'
  const repo = process.env.TRAVIS_REPO_SLUG || process.env['Build.Repository.Name']
  const issue = process.env.TRAVIS_PULL_REQUEST || process.env['System.PullRequest.PullRequestId']
  console.log(`Detected repo: ${repo}, issue: #${issue}, is PR: ${isPR}`)
  if (isPR) {
    comment(
      process.env.GITHUB_TOKEN,
      repo,
      issue,
      body
    )
      .then(response =>
        console.log(`posted results to PR #${issue}`)
      )
      .catch(err => console.log('error leaving Github comment:', err))
  } else {
    console.log(body)
  }
}

module.exports = CommentReporter
