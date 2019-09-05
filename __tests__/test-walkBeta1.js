// @ts-nocheck
/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { walkBeta1, WORKDIR, TREE, STAGE } = require('isomorphic-git')

describe('walkBeta1', () => {
  it('can walk using WORKDIR, TREE, and STAGE', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-walkBeta1')
    // Test
    const matrix = await walkBeta1({
      trees: [
        WORKDIR({ fs, dir, gitdir }),
        TREE({ fs, gitdir, ref: 'HEAD' }),
        STAGE({ fs, gitdir })
      ],
      map: entries =>
        entries.map(({ basename, exists, fullpath }) => ({
          basename,
          exists,
          fullpath
        }))
    })
    expect(matrix).toEqual([
      [
        { basename: '.', exists: true, fullpath: '.' },
        { basename: '.', exists: true, fullpath: '.' },
        { basename: '.', exists: true, fullpath: '.' }
      ],
      [
        { basename: 'a.txt', exists: true, fullpath: 'a.txt' },
        { basename: 'a.txt', exists: true, fullpath: 'a.txt' },
        { basename: 'a.txt', exists: true, fullpath: 'a.txt' }
      ],
      [
        { basename: 'b.txt', exists: true, fullpath: 'b.txt' },
        { basename: 'b.txt', exists: true, fullpath: 'b.txt' },
        { basename: 'b.txt', exists: true, fullpath: 'b.txt' }
      ],
      [
        { basename: 'c.txt', exists: false, fullpath: 'c.txt' },
        { basename: 'c.txt', exists: true, fullpath: 'c.txt' },
        { basename: 'c.txt', exists: true, fullpath: 'c.txt' }
      ],
      [
        { basename: 'd.txt', exists: true, fullpath: 'd.txt' },
        { basename: 'd.txt', exists: false, fullpath: 'd.txt' },
        { basename: 'd.txt', exists: false, fullpath: 'd.txt' }
      ]
    ])
  })
})
