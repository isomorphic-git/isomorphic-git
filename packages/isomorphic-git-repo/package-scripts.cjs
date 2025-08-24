// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

const pkg = require('./package.json')

const builtFiles = pkg.files.filter(f => !['cli.js', 'cli.cjs'].includes(f))

// Polyfill TRAVIS_PULL_REQUEST_SHA environment variable
require('./__tests__/__helpers__/set-TRAVIS_PULL_REQUEST_SHA.cjs')

const retry = n => cmd => Array(n).fill(`(${cmd})`).join(` || `)
const retry3 = retry(3)

const quote = cmd =>
  cmd.replace(new RegExp("'", 'g'), "\\'").replace(new RegExp('"', 'g'), '\\"')

const optional = cmd =>
  `(${cmd}) || echo "Optional command '${quote(cmd)}' failed".`

const timeout = n => cmd => `timeout -t ${n}m -- ${cmd}`
const timeout5 = timeout(5)

/**
 * Returns the environment variables to configure bundlewatch for the current CI provider.
 * @returns {string}
 */
const bundlewatchEnvironmentVariables = () => {
  const options = [
    `BUNDLEWATCH_GITHUB_TOKEN='${process.env.BUNDLEWATCH_GITHUB_TOKEN}'`,
    `CI_REPO_OWNER='isomorphic-git'`,
    `CI_REPO_NAME='isomorphic-git'`,
  ]

  // Azure DevOps Pipeline is not detected by bundlewatch (which uses ci-env).
  if (process.env.SYSTEM_COLLECTIONURI !== undefined) {
    options.push(
      `CI_COMMIT_SHA='${process.env.TRAVIS_PULL_REQUEST_SHA}'`,
      `CI_BRANCH='${process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH}'`,
      `CI_BRANCH_BASE='${process.env.SYSTEM_PULLREQUEST_TARGETBRANCH}'`
    )
  }

  // GitHub is not detected well using bundlewatch@0.2.5.
  else if (process.env.GITHUB_SHA) {
    options.push(`CI_COMMIT_SHA='${process.env.GITHUB_SHA}'`)

    // Get the current and base branch for pull requests
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      options.push(
        `CI_BRANCH='${process.env.GITHUB_HEAD_REF}'`,
        `CI_BRANCH_BASE='${process.env.GITHUB_BASE_REF}'`
      )
    }
    // Otherwise, get the current branch. This handles push and workflow_dispatch events.
    // This does not handle tags (refs/tags/<tag_name>).
    else if (process.env.GITHUB_REF.startsWith('refs/heads/')) {
      const branch = process.env.GITHUB_REF.replace('refs/heads/')
      options.push(`CI_BRANCH='${branch}'`)
    }
  }

  return options.join(' ')
}

module.exports = {
  scripts: {
    clean: {
      default: `rm -rf ${builtFiles.join(' ')} internal-apis.*`,
    },
    lint: {
      default: `eslint .`,
      fix: optional(`eslint --fix .`),
    },
    format: {
      default: series.nps('lint.fix'),
    },
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=* jest --watch'),
      karma: runInNewWindow('karma start'),
    },
    contributors: {
      add: 'node ./__tests__/__helpers__/add-contributor.cjs',
      generate: 'all-contributors generate',
      check: 'all-contributors check',
    },
    build: {
      default: series.nps(
        'build.rollup',
        'build.indexjson',
        'build.docs',
        'build.size',
        'build.pack'
      ),
      rollup: 'rollup -c --no-treeshake',
      indexjson: `node __tests__/__helpers__/make_http_index.cjs`,
      docs: 'node ./__tests__/__helpers__/generate-docs.cjs',
      size: process.env.CI
        ? optional(`cross-env ${bundlewatchEnvironmentVariables()} bundlewatch`)
        : optional(`cross-env bundlewatch`),
      pack: 'npm pack',
    },
    website: {
      default: process.env.CI
        ? series.nps(
          'website.codemirrorify',
          'website.cpstatic',
          'website.build',
          'website.publish'
        )
        : series.nps(
          'website.codemirrorify',
          'website.cpstatic',
          'website.dev'
        ),
      codemirrorify:
        '(cd website/packages/codemirrorify && npm install && npm run build)',
      cpstatic:
        'cp website/packages/codemirrorify/dist/main.js website/static/js/codemirrorify.js && node __tests__/__helpers__/copy-to-website.cjs',
      build: '(cd website && npm install && npm run build)',
      dev: '(cd website && npm start)',
      publish: '(cd website && node ./scripts/deploy-gh-pages.cjs)',
    },
    // ATTENTION:
    // LIST OF SAFE PORTS FOR SAUCE LABS (Edge and Safari) https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy+FAQS#SauceConnectProxyFAQS-CanIAccessApplicationsonlocalhost?
    // 'proxy' needs to run in the background during tests. I'm too lazy to auto start/stop it from within the browser tests.
    proxy: {
      default: `cors-proxy start -p 9999`,
      start: `cors-proxy start -p 9999 -d`,
      stop: `cors-proxy stop`,
    },
    gitserver: {
      default: `cross-env GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__tests__/__fixtures__ git-http-mock-server`,
      start: `cross-env GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__tests__/__fixtures__ git-http-mock-server start`,
      stop: `cross-env GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__tests__/__fixtures__ git-http-mock-server stop`,
    },
    test: {
      default: series.nps(
        'lint',
        'build',
        'test.typecheck',
        'test.setup',
        'test.jest',
        'test.karma',
        'test.teardown'
      ),
      typecheck: 'tsc -p tsconfig.json',
      setup: series.nps('proxy.start', 'gitserver.start'),
      teardown: series.nps('proxy.stop', 'gitserver.stop'),
      jest: process.env.CI
        ? retry3(`${timeout5('jest --ci --coverage')}`)
        : `jest --ci --coverage`,
      karma: process.env.CI
        ? retry3('karma start ./karma.conf.cjs --single-run')
        : 'cross-env karma start ./karma.conf.cjs --single-run -log-level debug',
      karmore: 'cross-env TEST_NO_BROWSERS=1 karma start --no-single-run',
    },
    prepublish: {
      default: series.nps('prepublish.version', 'build'),
      version: `node __tests__/__helpers__/fix-version-number.cjs`,
    },
  },
}
