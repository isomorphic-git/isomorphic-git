/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { mergeFile } = require('isomorphic-git/internal-apis')

describe('mergeFile', () => {
  it('mergeFile a o b', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
    // Test
    const { cleanMerge, mergedText } = mergeFile({
      ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
      baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
      theirContent: await fs.read(`${dir}/b.txt`, 'utf8')
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
      theirContent: await fs.read(`${dir}/c.txt`, 'utf8')
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toEqual(await fs.read(`${dir}/aoc.txt`, 'utf8'))
  })

  it('mergeFile a o c --diff3', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
    // Test
    const { cleanMerge, mergedText } = mergeFile({
      ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
      baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
      theirContent: await fs.read(`${dir}/c.txt`, 'utf8'),
      format: 'diff3'
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toEqual(await fs.read(`${dir}/aoc3.txt`, 'utf8'))
  })

  it('mergeFile a o c --diff3 --marker-size=10', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
    // Test
    const { cleanMerge, mergedText } = mergeFile({
      ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
      baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
      theirContent: await fs.read(`${dir}/c.txt`, 'utf8'),
      format: 'diff3',
      markerSize: 10
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toEqual(await fs.read(`${dir}/aoc3-m10.txt`, 'utf8'))
  })
})
