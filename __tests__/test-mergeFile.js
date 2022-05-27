/* eslint-env node, browser, jasmine */
const { mergeFile } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('mergeFile', () => {
  it('mergeFile a o b', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
    // Test
    const { cleanMerge, mergedText } = mergeFile({
      ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
      baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
      theirContent: await fs.read(`${dir}/b.txt`, 'utf8'),
    })
    expect(cleanMerge).toBe(true)
    expect(mergedText).toEqual(await fs.read(`${dir}/aob.txt`, 'utf8'))
  })

  it('mergeFile a o c', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
    // Test
    const { cleanMerge, mergedText } = mergeFile({
      ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
      baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
      theirContent: await fs.read(`${dir}/c.txt`, 'utf8'),
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toEqual(await fs.read(`${dir}/aoc.txt`, 'utf8'))
  })
})
