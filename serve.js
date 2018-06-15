#!/usr/bin/env node
const http = require('http')
const zlib = require('zlib')
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
      const filepath = u.pathname
        .replace(/\/info\/refs$/, '')
        .replace(/^\//, '')
      const gitdir = opts.bare ? `./${filepath}` : `./${filepath}/.git`
      console.log('gitdir =', gitdir)
      const service = u.query.service
      const {
        capabilities,
        refs,
        symrefs
      } = await git.createUploadPackAdvertisement({ fs, gitdir })
      console.log({ service, capabilities, refs, symrefs })
      res.setHeader('content-type', `application/x-${service}-advertisement`)
      const stream = await git.createUploadPackAdvertisementStream({
        service,
        capabilities,
        refs,
        symrefs
      })
      stream.pipe(res)
    }
    if (
      req.method === 'POST' &&
      req.headers['content-type'] === 'application/x-git-upload-pack-request'
    ) {
      console.log('fetch')
      if (req.headers['content-encoding'] === 'gzip') {
        req = req.pipe(zlib.createGunzip())
      }
      const filepath = u.pathname
        .replace(/\/git-upload-pack$/, '')
        .replace(/^\//, '')
      const gitdir = opts.bare ? `./${filepath}` : `./${filepath}/.git`
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
      if (done) {
        console.log('done - so send packfile')
        // create pack file
        let {
          packstream,
          shallows: newshallows,
          unshallows,
          acks
        } = await git.packObjects({
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
          nak: true,
          shallows: newshallows,
          unshallows
        })
        packetlines.end()
        progress.end()
        error.end()
        stream.pipe(res)
      } else {
        console.log('not done - so dont send packfile')
        let { shallows: newshallows, unshallows, acks } = await git.packObjects(
          {
            fs,
            gitdir,
            refs: wants,
            depth,
            since,
            exclude,
            relative,
            haves,
            shallows
          }
        )
        res.setHeader('content-type', `application/x-${service}-result`)
        let packetlines = new PassThrough()
        let packfile = new PassThrough()
        let progress = new PassThrough()
        let error = new PassThrough()
        console.log('newshallows', newshallows)
        let stream = await GitRemoteConnection.sendUploadPackResult({
          packetlines,
          packfile,
          progress,
          error,
          acks,
          nak: false,
          shallows: newshallows,
          unshallows
        })
        packetlines.end()
        packfile.end()
        progress.end()
        error.end()
        stream.pipe(res)
      }
      console.log('finished function alright')
    }
  })
  server.listen(opts.port)
})
