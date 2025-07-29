/* eslint-env node, browser, jasmine */
const path = require('path')

const { isBinary } = require('isomorphic-git/internal-apis')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

const binaryFiles = [
  'browserconfig.gz',
  'browserconfig.zip',
  'favicon-16x16.gif',
  'favicon-16x16.png',
]
const textFiles = ['browserconfig.xml', 'manifest.json']

describe('isBinary', () => {
  for (const file of binaryFiles) {
    ;(process.browser ? xit : it)(
      `${path.extname(file)} is binary`,
      async () => {
        // Setup
        const { fs, dir } = await makeFixtureAsSubmodule('test-isBinary')
        const buffer = await fs.read(`${dir}/${file}`)
        // Test
        expect(isBinary(buffer)).toEqual(true)
      }
    )
  }

  for (const file of textFiles) {
    ;(process.browser ? xit : it)(
      `${path.extname(file)} is NOT binary`,
      async () => {
        // Setup
        const { fs, dir } = await makeFixtureAsSubmodule('test-isBinary')
        const buffer = await fs.read(`${dir}/${file}`)
        // Test
        expect(isBinary(buffer)).toEqual(false)
      }
    )
  }
})
