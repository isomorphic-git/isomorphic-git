/* global test describe expect */
import fs from 'fs'
import { createClass } from '../dist/for-node/utils'
import { listBranches } from '../dist/for-node/commands'

const Git = createClass({ listBranches })

describe('listBranches', () => {
  test('listBranches', async () => {
    let repo = new Git({
      fs,
      gitdir: '__tests__/__fixtures__/test-listBranches.git'
    })
    let commits = await repo.listBranches()
    expect(commits).toMatchSnapshot()
  })
})
