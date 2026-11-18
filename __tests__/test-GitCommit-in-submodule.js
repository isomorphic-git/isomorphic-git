/* eslint-env node, browser, jasmine */
import { GitCommit } from 'isomorphic-git/internal-apis'

const firstTree = '3cf6d9b40953228be4656adec4a4982fda2430ca'
const secondTree = 'fd168647422b0e14767013e0fa4bd63bdbeedfc2'
const firstParent = '9144a97b79c162e6d5a08cb490848352c41b9ea1'
const secondParent = 'b7fa5f8d01d995c9b86c0ef2cf18742097fb2255'

describe('GitCommit', () => {
  it('preserves stored message content in signed and unsigned payloads', () => {
    const headers = `tree ${firstTree}\nauthor Alice <alice@example.com> 1 +0000\ncommitter Alice <alice@example.com> 1 +0000`
    for (const message of [
      '\n\nVerbatim message\n\nMore details\n',
      'Trailing blank lines\n\n\n',
      'CRLF message\r\nwith a carriage return\rinside\r\n\r\n',
      'No terminal newline',
      '',
    ]) {
      const payload = `${headers}\n\n${message}`
      expect(GitCommit.from(payload).withoutSignature()).toEqual(payload)
      for (const format of ['PGP', 'SSH']) {
        const signature = `gpgsig -----BEGIN ${format} SIGNATURE-----\n c2lnbmF0dXJl\n -----END ${format} SIGNATURE-----`
        expect(
          GitCommit.from(
            `${headers}\n${signature}\n\n${message}`
          ).withoutSignature()
        ).toEqual(payload)
      }
    }
  })

  it('removes both hash signature headers while retaining other headers', () => {
    const headers = `tree ${firstTree}\nauthor Alice <alice@example.com> 1 +0000\ncommitter Alice <alice@example.com> 1 +0000`
    const extra =
      'encoding UTF-8\nx-extra metadata\r\n continued metadata\ngpgsig-sha256-extra retained'
    const sha1Signature =
      'gpgsig signature\n continuation\n another continuation'
    const sha256Signature =
      'gpgsig-sha256 signature\n continuation\n another continuation'
    const message = '\nMessage\r\n\ngpgsig-sha256 part of the message\n\n'
    const payload = `${headers}\n${extra}\n\n${message}`
    for (const signedHeaders of [
      [headers, sha256Signature, extra],
      [headers, sha1Signature, sha256Signature, extra],
      [headers, sha256Signature, extra, sha1Signature],
      [headers, extra, sha1Signature, sha256Signature],
    ]) {
      expect(
        GitCommit.from(
          `${signedHeaders.join('\n')}\n\n${message}`
        ).withoutSignature()
      ).toEqual(payload)
    }
  })

  it('removes only signature headers regardless of the armor format', () => {
    const headers = `tree ${firstTree}\nauthor Alice <alice@example.com> 1 +0000\ncommitter Alice <alice@example.com> 1 +0000`
    const extra = 'encoding UTF-8\nx-extra metadata\n continued metadata'
    const message =
      'Signed café\n\ngpgsig part of the message\n-----END PGP SIGNATURE-----\n'
    const payload = `${headers}\n${extra}\n\n${message}`
    expect(GitCommit.from(payload).withoutSignature()).toEqual(payload)
    for (const format of ['PGP', 'SSH', 'SIGNED MESSAGE']) {
      const signature = `gpgsig -----BEGIN ${format} SIGNATURE-----\n c2lnbmF0dXJl\n -----END ${format} SIGNATURE-----`
      for (const signedHeaders of [
        `${headers}\n${signature}\n${extra}`,
        `${headers}\n${extra}\n${signature}`,
      ]) {
        expect(
          GitCommit.from(`${signedHeaders}\n\n${message}`).withoutSignature()
        ).toEqual(payload)
      }
    }
  })

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

  it('ignores a parent header after the committer', async () => {
    const commit = GitCommit.from(
      `tree ${firstTree}
parent ${firstParent}
author Alice <alice@example.com> 1 +0000
committer Alice <alice@example.com> 1 +0000
parent ${secondParent}

message
`
    )
    expect(commit.parse().parent).toEqual([firstParent])
  })

  it('ignores a parent header that does not follow the tree', async () => {
    const commit = GitCommit.from(
      `tree ${firstTree}
author Alice <alice@example.com> 1 +0000
parent ${firstParent}
committer Alice <alice@example.com> 1 +0000

message
`
    )
    expect(commit.parse().parent).toEqual([])
  })

  it('refuses a commit whose first header is not the tree', async () => {
    const commit = GitCommit.from(
      `author Alice <alice@example.com> 1 +0000
tree ${firstTree}
committer Alice <alice@example.com> 1 +0000

message
`
    )
    let error = null
    try {
      commit.parse()
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toEqual('ParseError')
    expect(error.data.actual).toEqual('author')
  })
})
