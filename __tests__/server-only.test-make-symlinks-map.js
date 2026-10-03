/* eslint-env node, browser, jasmine */

import { execFileSync } from 'child_process'
import * as fs from 'fs'
import { createRequire } from 'module'
import * as os from 'os'
import * as path from 'path'

const require = createRequire(import.meta.url)
const { makeSymlinksMap } = require('./__helpers__/make-symlinks-map.cjs')

describe('makeSymlinksMap', () => {
  let dir

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('reads symlinks from the index when the worktree contains a regular file', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'symlinks-map-'))
    const fixtures = path.join(dir, 'fixtures')
    fs.mkdirSync(fixtures)
    fs.writeFileSync(path.join(fixtures, 'target.txt'), 'target')
    fs.writeFileSync(path.join(fixtures, 'link.txt'), 'target.txt')

    execFileSync('git', ['init', '--quiet'], { cwd: dir })
    const oid = execFileSync('git', ['hash-object', '-w', '--stdin'], {
      cwd: dir,
      encoding: 'utf8',
      input: 'target.txt',
    }).trim()
    execFileSync(
      'git',
      [
        'update-index',
        '--add',
        '--cacheinfo',
        `120000,${oid},fixtures/link.txt`,
      ],
      { cwd: dir }
    )

    expect(makeSymlinksMap(fixtures)).toEqual({ '/link.txt': 'target.txt' })
  })
})
