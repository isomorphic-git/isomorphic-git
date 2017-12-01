/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { createClass } from '../dist/for-node/utils'
import { list } from '../dist/for-node/commands'

const Git = createClass({ list })

describe('list', () => {
  test('list', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-list.git')
    let repo = new Git({ fs, gitdir })
    const files = await repo.list()
    expect(files).toMatchSnapshot()
  })
})
