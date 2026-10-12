/* eslint-env node, browser, jasmine */
import { mergeFile } from 'isomorphic-git/internal-apis'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('mergeFile', () => {
  it('mergeFile a o b', async () => {
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

  it('mergeFile a o c', async () => {
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

  describe('markers like git', () => {
    const run = (ours, base, theirs) =>
      mergeFile({
        contents: [base, ours, theirs],
        branches: ['base', 'ours', 'theirs'],
      })

    it('ends marker lines the way the file does', () => {
      expect(
        run(
          'one\r\nOURS\r\nthree\r\n',
          'one\r\ntwo\r\nthree\r\n',
          'one\r\nTHEIRS\r\nthree\r\n'
        ).mergedText
      ).toBe(
        'one\r\n<<<<<<< ours\r\nOURS\r\n=======\r\nTHEIRS\r\n>>>>>>> theirs\r\nthree\r\n'
      )
      expect(
        run('OURS\r\nb\r\n', 'a\r\nb\r\n', 'THEIRS\r\nb\r\n').mergedText
      ).toBe(
        '<<<<<<< ours\r\nOURS\r\n=======\r\nTHEIRS\r\n>>>>>>> theirs\r\nb\r\n'
      )
      // A side without a final newline gets the conflict's line ending.
      expect(run('a\r\nOURS', 'a\r\nb', 'a\r\nTHEIRS').mergedText).toBe(
        'a\r\n<<<<<<< ours\r\nOURS\r\n=======\r\nTHEIRS\r\n>>>>>>> theirs\r\n'
      )
    })

    it('keeps lines both sides agree on out of the conflict', () => {
      expect(
        run('x\nA\n2\nC\ny\n', 'x\n1\n2\n3\ny\n', 'x\nA\nZ\nC\ny\n').mergedText
      ).toBe('x\nA\n<<<<<<< ours\n2\n=======\nZ\n>>>>>>> theirs\nC\ny\n')
      // A file added on both sides.
      expect(
        run(
          'same1\nours-only\nsame2\nsame3\n',
          '',
          'same1\ntheirs-only\nsame2\nsame3\n'
        ).mergedText
      ).toBe(
        'same1\n<<<<<<< ours\nours-only\n=======\ntheirs-only\n>>>>>>> theirs\nsame2\nsame3\n'
      )
      // One side has nothing where the other added a line.
      expect(run('A\nX\nB\n', '1\n', 'A\nB\n').mergedText).toBe(
        'A\n<<<<<<< ours\nX\n=======\n>>>>>>> theirs\nB\n'
      )
    })

    it('splits a conflict only around four or more common lines', () => {
      const common = n =>
        Array.from({ length: n }, (_, i) => `same${i}\n`).join('')
      expect(
        run(`K\n${common(3)}M\n`, '1\n2\n3\n', `L\n${common(3)}N\n`).mergedText
      ).toBe(
        `<<<<<<< ours\nK\n${common(3)}M\n=======\nL\n${common(3)}N\n>>>>>>> theirs\n`
      )
      expect(
        run(`K\n${common(4)}M\n`, '1\n2\n3\n', `L\n${common(4)}N\n`).mergedText
      ).toBe(
        `<<<<<<< ours\nK\n=======\nL\n>>>>>>> theirs\n${common(
          4
        )}<<<<<<< ours\nM\n=======\nN\n>>>>>>> theirs\n`
      )
    })

    it('starts every marker on its own line when the last line has no newline', () => {
      const expected =
        'a\nb\n<<<<<<< ours\nOURS\n=======\nTHEIRS\n>>>>>>> theirs\n'
      expect(run('a\nb\nOURS', 'a\nb\nc', 'a\nb\nTHEIRS').mergedText).toBe(
        expected
      )
      expect(run('a\nb\nOURS', 'a\nb\nc\n', 'a\nb\nTHEIRS\n').mergedText).toBe(
        expected
      )
      // Nothing changes for a clean result without a final newline.
      expect(run('a\nb\nOURS', 'a\nb\nc', 'a\nb\nc')).toEqual({
        cleanMerge: true,
        mergedText: 'a\nb\nOURS',
      })
    })

    it('lets the base decide the line ending when no side can tell', () => {
      // Each side is one line without a newline, as `git merge-file` sees it.
      expect(run('b', 'a\r\n', 'c').mergedText).toBe(
        '<<<<<<< ours\r\nb\r\n=======\r\nc\r\n>>>>>>> theirs\r\n'
      )
      expect(run('b', 'a\n', 'c').mergedText).toBe(
        '<<<<<<< ours\nb\n=======\nc\n>>>>>>> theirs\n'
      )
    })

    // The expected files are what `git merge` (git 2.48.1) writes for the
    // same three versions, byte for byte.
    it('joins nearby conflicts and picks line endings like git merge', () => {
      const cases = [
        [
          'one agreed line between two conflicts: joined',
          'a\ns0\nb\ntail\n',
          'a-ours\ns0\nb-ours\ntail\n',
          'a-theirs\ns0\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\ns0\nb-ours\n=======\na-theirs\ns0\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'two agreed lines: joined',
          'a\ns0\ns1\nb\ntail\n',
          'a-ours\ns0\ns1\nb-ours\ntail\n',
          'a-theirs\ns0\ns1\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\ns0\ns1\nb-ours\n=======\na-theirs\ns0\ns1\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'three agreed lines: joined',
          'a\ns0\ns1\ns2\nb\ntail\n',
          'a-ours\ns0\ns1\ns2\nb-ours\ntail\n',
          'a-theirs\ns0\ns1\ns2\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\ns0\ns1\ns2\nb-ours\n=======\na-theirs\ns0\ns1\ns2\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'four agreed lines: kept apart',
          'a\ns0\ns1\ns2\ns3\nb\ntail\n',
          'a-ours\ns0\ns1\ns2\ns3\nb-ours\ntail\n',
          'a-theirs\ns0\ns1\ns2\ns3\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\n=======\na-theirs\n>>>>>>> other\ns0\ns1\ns2\ns3\n<<<<<<< HEAD\nb-ours\n=======\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'five agreed lines: kept apart',
          'a\ns0\ns1\ns2\ns3\ns4\nb\ntail\n',
          'a-ours\ns0\ns1\ns2\ns3\ns4\nb-ours\ntail\n',
          'a-theirs\ns0\ns1\ns2\ns3\ns4\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\n=======\na-theirs\n>>>>>>> other\ns0\ns1\ns2\ns3\ns4\n<<<<<<< HEAD\nb-ours\n=======\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'the same change on both sides in the gap: joined',
          'a\ns0\ns1\nb\ntail\n',
          'a-ours\ns0-both\ns1\nb-ours\ntail\n',
          'a-theirs\ns0-both\ns1\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\ns0-both\ns1\nb-ours\n=======\na-theirs\ns0-both\ns1\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'a change next to a conflict becomes part of it',
          'a\ns0\ns1\nb\ntail\n',
          'a-ours\ns0-ours\ns1\nb-ours\ntail\n',
          'a-theirs\ns0\ns1\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\ns0-ours\ns1\nb-ours\n=======\na-theirs\ns0\ns1\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'a change by one side in the gap: kept apart',
          'a\ns0\ns1\ns2\nb\ntail\n',
          'a-ours\ns0\ns1-ours\ns2\nb-ours\ntail\n',
          'a-theirs\ns0\ns1\ns2\nb-theirs\ntail\n',
          '<<<<<<< HEAD\na-ours\n=======\na-theirs\n>>>>>>> other\ns0\ns1-ours\ns2\n<<<<<<< HEAD\nb-ours\n=======\nb-theirs\n>>>>>>> other\ntail\n',
        ],
        [
          'line endings of ours and theirs differ: LF markers',
          'one\ntwo\nthree\n',
          'one\r\nOURS\r\nthree\r\n',
          'one\nTHEIRS\nthree\n',
          '<<<<<<< HEAD\none\r\nOURS\r\nthree\r\n=======\none\nTHEIRS\nthree\n>>>>>>> other\n',
        ],
        [
          'ours and theirs CRLF, base LF: LF markers',
          'one\ntwo\n',
          'one\r\nOURS\r\n',
          'one\r\nTHEIRS\r\n',
          'one\r\n<<<<<<< HEAD\nOURS\r\n=======\nTHEIRS\r\n>>>>>>> other\n',
        ],
        [
          'ours CRLF, theirs LF, base CRLF: LF markers',
          'one\r\ntwo\r\n',
          'one\r\nOURS\r\n',
          'one\nTHEIRS\n',
          '<<<<<<< HEAD\none\r\nOURS\r\n=======\none\nTHEIRS\n>>>>>>> other\n',
        ],
        [
          'no file can tell: LF markers',
          'base',
          '',
          'theirs',
          '<<<<<<< HEAD\n=======\ntheirs\n>>>>>>> other\n',
        ],
        [
          'an empty side leaves the decision to the next file',
          'base\r\n',
          'ours\r\n',
          '',
          '<<<<<<< HEAD\r\nours\r\n=======\r\n>>>>>>> other\r\n',
        ],
        [
          'the line before the conflict decides',
          'one\r\ntwo\n',
          'one\r\nOURS\n',
          'one\r\nTHEIRS\n',
          'one\r\n<<<<<<< HEAD\r\nOURS\n=======\r\nTHEIRS\n>>>>>>> other\r\n',
        ],
        [
          'LF lines are aligned as they always were',
          'a\nb\n',
          'a\n',
          'b\na\na',
          '<<<<<<< HEAD\na\n=======\nb\na\na\n>>>>>>> other\n',
        ],
        [
          'a lone CR is part of the line',
          'a\rb\nmid\nc\rd\n',
          'A\rb\nmid\nc\rd\n',
          'a\rb\nmid\nc\rD\n',
          'A\rb\nmid\nc\rD\n',
        ],
        [
          'a lone CR in a conflict',
          'x\ra\n',
          'x\rb\n',
          'x\rc\n',
          '<<<<<<< HEAD\nx\rb\n=======\nx\rc\n>>>>>>> other\n',
        ],
      ]
      for (const [title, base, ours, theirs, git] of cases) {
        const { mergedText } = mergeFile({
          contents: [base, ours, theirs],
          branches: ['base', 'HEAD', 'other'],
        })
        expect([title, mergedText]).toEqual([title, git])
      }
    })

    it('splits a conflict of more than 1,000 lines like git merge', () => {
      // 600 lines on each side, every sixth one different: git writes 100
      // small conflicts.
      const side = name =>
        Array.from({ length: 600 }, (_, i) =>
          i % 6 === 5 ? `${name}${i}\n` : `same${i}\n`
        ).join('')
      let git = ''
      for (let i = 0; i < 600; i++) {
        git +=
          i % 6 === 5
            ? `<<<<<<< ours\nours${i}\n=======\ntheirs${i}\n>>>>>>> theirs\n`
            : `same${i}\n`
      }
      expect(run(side('ours'), 'base\n', side('theirs')).mergedText).toBe(git)
    })
  })
})
