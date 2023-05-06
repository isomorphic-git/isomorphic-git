import '../typedefs.js'

import { UrlParseError } from '../errors/index.js'

import { GitRemoteHTTP } from './GitRemoteHTTP.js'
import { parseRemoteUrl } from './GitRemoteManager.js'

async function runHTTPBackend({ url }) {
  const parts = parseRemoteUrl({ url })
  if (!parts || parts.transport !== 'file') {
    throw new UrlParseError(url)
  }
  const childProcess = require('child_process')
  if (childProcess === 'empty') {
    throw new Error('child_process is not available in this environment')
  }
  const address = parts.address.replace(/\/$/, '').replace(/\.git$/, '')

  const http = require('http')
  const backend = require('git-http-backend')
  const spawn = childProcess.spawn
  const zlib = require('zlib')
  const server = http.createServer(function(req, res) {
    console.log('request', req.url)
    console.log('address', address)
    const reqStream =
      req.headers['content-encoding'] === 'gzip'
        ? req.pipe(zlib.createGunzip())
        : req

    reqStream
      .pipe(
        backend(req.url, function(err, service) {
          if (err) return res.end(err + '\n')

          res.setHeader('content-type', service.type)

          const ps = spawn(service.cmd, service.args.concat(`${address}.git`))
          ps.stdout.pipe(service.createStream()).pipe(ps.stdin)
        })
      )
      .pipe(res)
  })
  const port = await new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port
      resolve(port)
    })
  })
  return { server, port }
}

export class GitRemoteFile extends GitRemoteHTTP {
  /**
   * @param {Object} args
   * @param {HttpClient} args.http
   * @param {ProgressCallback} [args.onProgress]
   * @param {AuthCallback} [args.onAuth]
   * @param {AuthFailureCallback} [args.onAuthFailure]
   * @param {AuthSuccessCallback} [args.onAuthSuccess]
   * @param {string} [args.corsProxy]
   * @param {string} args.service
   * @param {string} args.url
   * @param {Object<string, string>} args.headers
   * @param {1 | 2} args.protocolVersion - Git Protocol Version
   */
  static async discover(args) {
    const { server, port } = await runHTTPBackend({ url: args.url })
    args.url = `http://localhost:${port}`
    const resp = await super.discover(args)
    server.close()
    return resp
  }

  /**
   * @param {Object} args
   * @param {HttpClient} args.http
   * @param {ProgressCallback} [args.onProgress]
   * @param {string} [args.corsProxy]
   * @param {string} args.service
   * @param {string} args.url
   * @param {Object<string, string>} [args.headers]
   * @param {any} args.body
   * @param {any} args.auth
   */
  static async connect(args) {
    const { server, port } = await runHTTPBackend({ url: args.url })
    args.url = `http://localhost:${port}`
    const resp = await super.connect(args)
    server.close()
    return resp
  }
}
