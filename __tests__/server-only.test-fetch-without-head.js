/* eslint-env node, browser, jasmine */
import { execFile } from 'node:child_process'
import * as fs from 'node:fs'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  fetch,
  init,
  readBlob,
  setConfig,
  writeBlob,
  writeCommit,
  writeRef,
  writeTree,
} from 'isomorphic-git'
import http from 'isomorphic-git/http'

describe('fetch without a remote HEAD', () => {
  it('fetches an explicitly selected branch when the remote default branch is unborn', async () => {
    const root = await mkdtemp(join(tmpdir(), 'git-fetch-without-head-'))
    const remote = join(root, 'remote.git')
    const source = { fs, dir: remote, gitdir: remote }
    const dir = join(root, 'client')
    await mkdir(remote)
    await mkdir(dir)
    await init({ ...source, bare: true, defaultBranch: 'main' })
    const bytes = new Uint8Array([0, 255, 128, 42])
    const blob = await writeBlob({ ...source, blob: bytes })
    const tree = await writeTree({
      ...source,
      tree: [{ path: 'state.bin', mode: '100644', type: 'blob', oid: blob }],
    })
    const oid = await writeCommit({
      ...source,
      commit: {
        tree,
        parent: [],
        author: {
          name: 'Test',
          email: 'test@example.com',
          timestamp: 1,
          timezoneOffset: 0,
        },
        committer: {
          name: 'Test',
          email: 'test@example.com',
          timestamp: 1,
          timezoneOffset: 0,
        },
        message: 'Snapshot\n',
      },
    })
    await writeRef({ ...source, ref: 'refs/heads/snapshot', value: oid })
    const server = createServer(async (request, response) => {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const advertise = request.url.startsWith('/info/refs')
      const args = ['-C', remote, 'upload-pack', '--stateless-rpc']
      if (advertise) args.push('--advertise-refs')
      args.push('.')
      const child = execFile(
        'git',
        args,
        { encoding: 'buffer' },
        (error, stdout) => {
          if (error) {
            response.writeHead(500)
            response.end(error.message)
            return
          }
          const service = '# service=git-upload-pack\n'
          const prefix = `${(Buffer.byteLength(service) + 4).toString(16).padStart(4, '0')}${service}0000`
          response.setHeader(
            'Content-Type',
            `application/x-git-upload-pack-${advertise ? 'advertisement' : 'result'}`
          )
          response.end(
            advertise ? Buffer.concat([Buffer.from(prefix), stdout]) : stdout
          )
        }
      )
      child.stdin.end(Buffer.concat(chunks))
    })
    try {
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
      await init({ fs, dir, defaultBranch: 'main' })
      await setConfig({
        fs,
        dir,
        path: 'remote.origin.fetch',
        value: '+refs/heads/*:refs/remotes/origin/*',
      })
      const result = await fetch({
        fs,
        http,
        dir,
        url: `http://127.0.0.1:${server.address().port}`,
        ref: 'snapshot',
        singleBranch: true,
        depth: 1,
      })
      expect(result.fetchHead).toBe(oid)
      expect(result.defaultBranch).toBeUndefined()
      expect(
        (await readBlob({ fs, dir, oid, filepath: 'state.bin' })).blob
      ).toEqual(bytes)
    } finally {
      await new Promise((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      )
      await rm(root, { recursive: true, force: true })
    }
  })
})
