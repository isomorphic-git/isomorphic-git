#!/usr/bin/env node
const http = require('http')
const fs = require('fs')
const { PassThrough } = require('stream')
const url = require('url')
const minimisted = require('minimisted')
const git = require('.')
const { managers } = require('./dist/for-node/isomorphic-git/internal-apis')
const { GitRemoteConnection } = managers

// This isn't meant to be the ultimate git server with lots of features.
// It just needs enough features to illustrate how one uses the server-side functions.

minimisted(async function ({ _: [command, ...args], ...opts }) {
  // What's the command?
  let cmd = `${command} ${JSON.stringify(opts)}`
  console.log(cmd)
  const server = http.createServer(async (req, res) => {
    var u = url.parse(req.url, true)
    if (req.method === 'GET' && u.pathname.endsWith('/info/refs')) {
      console.log('discover')
      let gitdir = u.pathname.replace(/\/info\/refs$/, '').replace(/^\//, '')
      const service = u.query.service
      const capabilities = [
        'thin-pack',
        'side-band',
        'side-band-64k',
        'shallow',
        'deepen-since',
        'deepen-not',
        'allow-tip-sha1-in-want',
        'allow-reachable-sha1-in-want'
      ]
      const refs = new Map()
      let branches = await git.listBranches({fs, gitdir})
      branches = branches.map(branch => `refs/heads/${branch}`)
      branches.unshift('HEAD') // HEAD must be the first in the list
      for (const branch of branches) {
        refs.set(branch, await git.resolveRef({fs, gitdir, ref: branch}))
      }
      const symrefs = new Map()
      symrefs.set('HEAD', await git.resolveRef({fs, gitdir, ref: 'HEAD', depth: 2}))
      console.log(service, { capabilities, refs, symrefs })
      res.setHeader('content-type', `application/x-${service}-advertisement`)
      return GitRemoteConnection.sendInfoRefs(service, res, { capabilities, refs, symrefs })
    }
    if (req.method === 'POST' && req.headers['content-type'] === 'application/x-git-upload-pack-request') {
      console.log('fetch')
      let gitdir = u.pathname.replace(/\/git-upload-pack$/, '').replace(/^\//, '')
      const service = 'git-upload-pack'
      let {
        capabilities,
        wants,
        haves,
        shallows,
        depth,
        since,
        exclude,
        relative,
        done
      } = await GitRemoteConnection.receiveUploadPackRequest(req)
      console.log(service, {
        capabilities,
        wants,
        haves,
        shallows,
        depth,
        since,
        exclude,
        relative,
        done
      })
      // create pack file
      let { packstream, shallows: newshallows, unshallows, acks } = await git.packObjects({
        fs,
        gitdir,
        refs: wants,
        depth,
        since,
        exclude,
        relative,
        haves,
        shallows
      })
      res.setHeader('content-type', `application/x-${service}-result`)
      let packetlines = new PassThrough()
      let progress = new PassThrough()
      let error = new PassThrough()
      console.log('newshallows', newshallows)
      let stream = await GitRemoteConnection.sendUploadPackResult({
        packetlines,
        packfile: packstream,
        progress,
        error,
        acks,
        nak: false,
        shallows: newshallows,
        unshallows
      })
      packetlines.end()
      progress.end()
      error.end()
      stream.pipe(res)
    }
  })
  server.listen(opts.port)
})
