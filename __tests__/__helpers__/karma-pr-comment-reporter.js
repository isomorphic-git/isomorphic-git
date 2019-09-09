// const comment = require('github-comment')
const fetch = require('simple-get')

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
  baseReporterDecorator(this)

  this.rows = [
    `## Test Results${commit}:`,
    `| Browser | Passed | Skipped | Failed | Time | Disconnected |`,
    `|---------|--------|---------|--------|------|--------------|`
  ]
  this.errorsByBrowser = {}
  this.longestTests = []
  this.startTime = Date.now()

  this.onBrowserStart = function (browser) {
    this.errorsByBrowser[browser.name] = []
  }
  this.specSuccess = function (browser, result) {
    const maxShow = 10
    if (this.longestTests.length === 0 || result.time > this.longestTests[this.longestTests.length - 1].result.time) {
      if (this.longestTests.length > maxShow) {
        this.longestTests.pop()
      }
      this.longestTests.push({ browser, result })
      this.longestTests.sort((a, b) => b.result.time - a.result.time)
    }
  }
  this.specFailure = function (browser, result) {
    this.errorsByBrowser[browser.name].push(testNameFormatter(result))
  }
  this.onBrowserComplete = function (browser) {
    var results = browser.lastResult
    this.rows.push(
      `| ${browser.name} | ${results.success} | ${results.skipped} | ${
        results.failed
      } | ${helper.formatTimeInterval(Date.now() - this.startTime)} | ${
        results.disconnected
      } |`
    )
  }
  this.onRunComplete = function () {
    postComment(this.rows.join('\n') + longestToMarkup(this.longestTests) + errorsToMarkup(this.errorsByBrowser))
  }

  function shortBrowserName (browser) {
    return browser.name.match(/[^\d+]+/)[0].trim()
  }

  // concatenate test suite(s) and test description by default
  function testNameFormatter (result) {
    return `${result.suite.join(' ')} ${result.description}`
  }

  function errorsToMarkup (errorsByBrowser) {
    const maxShow = 5
    let text = '\n\n'
    for (const browser in errorsByBrowser) {
      const numErrors = errorsByBrowser[browser].length
      if (numErrors === 0) continue
      text += `${browser}:\n`
      for (let i = 0; i < Math.min(maxShow, numErrors); i++) {
        text += `- ${errorsByBrowser[browser][i]}\n`
      }
      if (numErrors > maxShow) {
        text += `- and ${numErrors - maxShow} more\n`
      }
      text += `\n`
    }
    return text
  }

  function longestToMarkup (longestTests) {
    let text = '\n\n'
    for (const thing of longestTests) {
      text += `- ${helper.formatTimeInterval(thing.result.time)} ${shortBrowserName(thing.browser)} ${testNameFormatter(thing.result)}\n`
    }
    return text
  }
}

function postComment (message) {
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
  console.log(`Detected repo: ${repo}, issue: #${issue}, is PR: ${isPR}`)
  if (isPR) {
    // comment(process.env.KARMA_PR_REPORTER_GITHUB_TOKEN, repo, issue, message)
    // .then(response => console.log(`posted results to PR #${issue}`))
    // .catch(err => console.log('error leaving Github comment:', err))
    fetch.post(
      {
        url: 'https://karma-pr-reporter.glitch.me',
        body: JSON.stringify({ repo, issue, message })
      },
      (err, res) => {
        if (err) return console.log('error leaving Github comment:', err)
        console.log(res.body)
      }
    )
  } else {
    console.log(message)
  }
}

module.exports = CommentReporter
