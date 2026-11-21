/* eslint-env node, browser, jasmine */
import { mergeFile } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('mergeFile', () => {
  it('mergeFile a o b', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
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

  it('mergeFile a o c', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-mergeFile')
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

  it.each([
    ['one\nours', 'one\ntheirs'],
    ['one\nours\n', 'one\ntheirs'],
    ['one\nours', 'one\ntheirs\n'],
  ])(
    'puts conflict markers on their own lines at EOF (%j, %j)',
    (ours, theirs) => {
      const { cleanMerge, mergedText } = mergeFile({
        contents: ['one\ntwo', ours, theirs],
        branches: ['base', 'ours', 'theirs'],
      })

      expect(cleanMerge).toBe(false)
      expect(mergedText).toBe(
        'one\n<<<<<<< ours\nours\n=======\ntheirs\n>>>>>>> theirs\n'
      )
    }
  )

  it('keeps a lone CR inside a line', () => {
    const { cleanMerge, mergedText } = mergeFile({
      contents: ['a\rb\nmid\nc\rd\n', 'A\rb\nmid\nc\rd\n', 'a\rb\nmid\nc\rD\n'],
      branches: ['base', 'ours', 'theirs'],
    })
    expect(cleanMerge).toBe(true)
    expect(mergedText).toBe('A\rb\nmid\nc\rD\n')
  })

  it('treats a CR at the end of the text as an ordinary byte', () => {
    // Same result as `git merge-file`.
    const { cleanMerge, mergedText } = mergeFile({
      contents: ['a\n\r\n', 'a\n', '\r\na\n\r'],
      branches: ['base', 'ours', 'theirs'],
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toBe(
      '<<<<<<< ours\na\n=======\n\r\na\n\r\n>>>>>>> theirs\n'
    )
  })

  it('splits text without a final LF into lines like git', () => {
    // Same result as `git merge-file`.
    const { cleanMerge, mergedText } = mergeFile({
      contents: ['a\nb\n', 'a\n', 'b\na\na'],
      branches: ['base', 'ours', 'theirs'],
    })
    expect(cleanMerge).toBe(false)
    expect(mergedText).toBe(
      '<<<<<<< ours\na\n=======\nb\na\na\n>>>>>>> theirs\n'
    )
  })
})
