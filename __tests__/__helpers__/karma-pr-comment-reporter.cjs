// const comment = require('github-comment')
const table = require('markdown-table')
const fetch = require('simple-get')

let commit =
  process.env.TRAVIS_PULL_REQUEST_SHA ||
  process.env.TRAVIS_COMMIT ||
  process.env.BUILD_SOURCEVERSION
commit = commit ? ` for ${commit}` : ''

const CommentReporter = function(
  baseReporterDecorator,
  config,
  logger,
  helper,
  formatError
) {
  baseReporterDecorator(this)

  this.rows = [['Browser', 'Pass', 'Skip', 'Fail', 'Time', 'Disconnect?']]
  this.errorsByBrowser = {}
  this.startTimesByBrowser = {}
  this.longestTests = []

  this.onBrowserStart = function(browser) {
    this.errorsByBrowser[browser.name] = []
    this.startTimesByBrowser[browser.name] = Date.now()
  }
  this.specSuccess = function(browser, result) {
    const maxShow = 10
    if (
      this.longestTests.length === 0 ||
      result.time > this.longestTests[this.longestTests.length - 1].result.time
    ) {
      if (this.longestTests.length > maxShow) {
        this.longestTests.pop()
      }
      this.longestTests.push({ browser, result })
      this.longestTests.sort((a, b) => b.result.time - a.result.time)
    }
  }
  this.specFailure = function(browser, result) {
    this.errorsByBrowser[browser.name].push(testNameFormatter(result))
  }
  this.onBrowserComplete = function(browser) {
    const results = browser.lastResult
    this.rows.push([
      browser.name,
      results.success,
      results.skipped,
      results.failed,
      formatTime(Date.now() - this.startTimesByBrowser[browser.name]),
      results.disconnected,
    ])
  }
  this.onRunComplete = function() {
    // Sort browsers alphabetically
    this.rows.sort((a, b) => (a[0] === b[0] ? 0 : a[0] > b[0] ? 1 : -1))
    postComment(
      `## Test Results${commit}:\n` +
        table(this.rows) +
        errorsToMarkup(this.errorsByBrowser) +
        longestToMarkup(this.longestTests)
    )
  }

  function shortBrowserName(browser) {
    return browser.name.match(/[^\d+]+/)[0].trim()
  }

  function formatTime(ns) {
    const m = Math.floor(ns / 1000 / 60)
    const s = Math.floor(ns / 1000 - m * 60)
    return `${m}m:${s}s`
  }

  // concatenate test suite(s) and test description by default
  function testNameFormatter(result) {
    return `${result.suite.join(' ')} ${result.description}`
  }

  function errorsToMarkup(errorsByBrowser) {
    let actuallyNothingToShow = true
    const maxShow = 5
    let text = '\n\n### Erroring Tests\n\n'
    for (const browser in errorsByBrowser) {
      const numErrors = errorsByBrowser[browser].length
      if (numErrors === 0) continue
      actuallyNothingToShow = false
      text += `- ${browser}:\n`
      for (let i = 0; i < Math.min(maxShow, numErrors); i++) {
        text += `  - ${errorsByBrowser[browser][i]}\n`
      }
      if (numErrors > maxShow) {
        text += `- and ${numErrors - maxShow} more\n`
      }
    }
    return actuallyNothingToShow ? '\n' : text
  }

  function longestToMarkup(longestTests) {
    let text = '\n### Longest running tests\n'
    for (const thing of longestTests) {
      text += `- ${helper.formatTimeInterval(
        thing.result.time
      )} - ${testNameFormatter(thing.result)} - _${shortBrowserName(
        thing.browser
      )}_\n`
    }
    return text
  }
}

function postComment(message) {
  // comment(token, repo, issueId, message)
  const isPR =
    (process.env.TRAVIS_PULL_REQUEST &&
      process.env.TRAVIS_PULL_REQUEST !== 'false') ||
    process.env.BUILD_REASON === 'PullRequest'
  const repo = process.env.TRAVIS_REPO_SLUG || process.env.BUILD_REPOSITORY_NAME
  const issue =
    process.env.TRAVIS_PULL_REQUEST ||
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER ||
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  console.log(message)
  console.log(`Detected repo: ${repo}, issue: #${issue}, is PR: ${isPR}\n`)
  if (isPR) {
    // comment(process.env.KARMA_PR_REPORTER_GITHUB_TOKEN, repo, issue, message)
    // .then(response => console.log(`posted results to PR #${issue}`))
    // .catch(err => console.log('error leaving Github comment:', err))
    fetch.post(
      {
        url: 'https://karma-pr-reporter.glitch.me',
        body: JSON.stringify({ repo, issue, message }),
      },
      (err, res) => {
        if (err) return console.log('error leaving Github comment:', err)
        console.log(res.body)
      }
    )
  } else {
    console.log('not leaving a Github comment')
  }
}

module.exports = CommentReporter
