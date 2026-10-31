/* eslint-env node, browser, jasmine */
import { GitCommit } from 'isomorphic-git/internal-apis'

const firstTree = '3cf6d9b40953228be4656adec4a4982fda2430ca'
const secondTree = 'fd168647422b0e14767013e0fa4bd63bdbeedfc2'
const firstParent = '9144a97b79c162e6d5a08cb490848352c41b9ea1'
const secondParent = 'b7fa5f8d01d995c9b86c0ef2cf18742097fb2255'

describe('GitCommit', () => {
  it('keeps the first tree header', async () => {
    const commit = GitCommit.from(
      `tree ${firstTree}
author Alice <alice@example.com> 1 +0000
committer Alice <alice@example.com> 1 +0000
tree ${secondTree}

message
`
    )
    expect(commit.parse().tree).toEqual(firstTree)
  })

  it('keeps the first author and committer headers', async () => {
    const commit = GitCommit.from(
      `tree ${firstTree}
author Alice <alice@example.com> 1 +0000
committer Alice <alice@example.com> 1 +0000
author Bob <bob@example.com> 2 +0000
committer Bob <bob@example.com> 2 +0000

message
`
    )
    const { author, committer } = commit.parse()
    expect(author.email).toEqual('alice@example.com')
    expect(committer.email).toEqual('alice@example.com')
  })

  it('keeps the first gpgsig header', async () => {
    const commit = GitCommit.from(
      `tree ${firstTree}
author Alice <alice@example.com> 1 +0000
committer Alice <alice@example.com> 1 +0000
gpgsig first signature
gpgsig second signature

message
`
    )
    expect(commit.parse().gpgsig).toEqual('first signature')
  })

  it('collects every parent header', async () => {
    const commit = GitCommit.from(
      `tree ${firstTree}
parent ${firstParent}
parent ${secondParent}
author Alice <alice@example.com> 1 +0000
committer Alice <alice@example.com> 1 +0000

message
`
    )
    expect(commit.parse().parent).toEqual([firstParent, secondParent])
  })
})
