// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

const pkg = require('./package.json')

const builtFiles = pkg.files.filter(f => !['cli.js', 'cli.cjs'].includes(f))

const retry = n => cmd => Array(n).fill(`(${cmd})`).join(` || `)
const retry3 = retry(3)

const quote = cmd => cmd.replaceAll("'", "\\'").replaceAll('"', '\\"')

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

const jestEnv = 'NODE_OPTIONS=--experimental-vm-modules'
const jestCommand = 'jest --ci --coverage'

const jestBrowser = browserName => {
  const cmd = `${jestCommand} --config jest-browser.config.js`

  return process.env.CI
    ? `export ${jestEnv}\nexport JEST_BROWSER=${browserName}\nexport JEST_PUPPETEER_CONFIG=.config/jest-puppeteer.js\n${retry3(`${timeout5(cmd)}`)}`
    : `cross-env ${jestEnv} JEST_BROWSER=${browserName} JEST_PUPPETEER_CONFIG=.config/jest-puppeteer.js ${cmd}`
}

module.exports = {
  scripts: {
    clean: {
      default: `rm -rf ${builtFiles.join(' ')} internal-apis.*`,
    },
    lint: {
      default: 'eslint src __tests__',
      fix: optional('eslint --fix src __tests__'),
    },
    format: {
      default: series.nps('lint.fix'),
    },
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=* jest --watch'),
    },
    contributors: {
      add: 'node ./__tests__/__helpers__/add-contributor.cjs',
      generate: 'all-contributors generate',
      check: 'all-contributors check',
    },
    build: {
      default: series.nps(
        'build.rollup',
        'build.typings',
        'build.webpack',
        'build.indexjson',
        'build.treeshake',
        'build.docs',
        'build.size',
        'build.pack'
      ),
      test: series.nps(
        'build.rollup',
        'build.typings',
        'build.webpack',
        'build.indexjson',
        'build.treeshake',
        'build.size',
        'build.pack'
      ),
      rollup: 'rollup -c --no-treeshake',
      typings:
        'tsc -p declaration.tsconfig.json && cp index.d.ts index.umd.min.d.ts',
      webpack: 'webpack --config webpack.config.cjs',
      indexjson:
        'npx make-index __tests__/__fixtures__ -o __tests__/__fixtures__/index.json -i __tests__/__fixtures__/index.json && node __tests__/__helpers__/make_superblock.cjs',
      treeshake: 'agadoo',
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
      default: `cors-proxy run`,
      start: `cors-proxy start`,
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
        'build.test',
        'test.typecheck',
        'test.setup',
        'test.node',
        'test.chrome',
        'test.teardown'
      ),
      browsers: series.nps('test.chrome', 'test.firefox'),
      typecheck: 'tsc -p tsconfig.json',
      setup: series.nps('proxy.start', 'gitserver.start'),
      teardown: series.nps('proxy.stop', 'gitserver.stop'),
      node: process.env.CI
        ? `export ${jestEnv}\n${retry3(`${timeout5(jestCommand)}`)}`
        : `cross-env-shell ${jestEnv} ${jestCommand}`,
      chrome: jestBrowser('chrome'),
      firefox: jestBrowser('firefox'),
    },
    prepublish: {
      default: series.nps('prepublish.version', 'build'),
      version: `node __tests__/__helpers__/fix-version-number.cjs`,
    },
  },
}
