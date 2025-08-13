/* eslint-env node, browser, jasmine */
const { mergeFile } = require('isomorphic-git/internal-apis')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('mergeFile', () => {
  ;(process.browser ? xit : it)('mergeFile a o b', async () => {
    // Setup
    const { fs, dir } = await makeFixtureAsSubmodule('test-mergeFile')
    // Test
    const ourContent = await fs.read(`${dir}/a.txt`, 'utf8')
    const baseContent = await fs.read(`${dir}/o.txt`, 'utf8')
    const theirContent = await fs.read(`${dir}/b.txt`, 'utf8')

    const { cleanMerge, mergedText } = mergeFile({
      contents: [baseContent, ourContent, theirContent],
      branches: ['base', 'ours', 'theirs'],
    })
    expect(cleanMerge).toBe(true)
    expect(mergedText).toEqual(await fs.read(`${dir}/aob.txt`, 'utf8'))
  })
  ;(process.browser ? xit : it)('mergeFile a o c', async () => {
    // Setup
    const { fs, dir } = await makeFixtureAsSubmodule('test-mergeFile')
    // Test
    const ourContent = await fs.read(`${dir}/a.txt`, 'utf8')
    const baseContent = await fs.read(`${dir}/o.txt`, 'utf8')
    const theirContent = await fs.read(`${dir}/c.txt`, 'utf8')

    const { cleanMerge, mergedText } = mergeFile({
      contents: [baseContent, ourContent, theirContent],
      branches: ['base', 'ours', 'theirs'],
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toEqual(await fs.read(`${dir}/aoc.txt`, 'utf8'))
  })
})
