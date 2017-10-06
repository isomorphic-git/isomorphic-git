const { exec } = require('child_process')
const url = require('url')
const stream = require('stream')
const parseHeaderStream = require('parse-header-stream')
const path = require('path')

module.exports = function (rootDir) {
  async function request (method, rawUrl, postStream, requestHeaders) {
    let parsedUrl = url.parse(rawUrl)
    let options = {
      env: {
        REQUEST_METHOD: method,
        GIT_PROJECT_ROOT: rootDir,
        PATH_INFO: parsedUrl.pathname, // '/test-GitRemoteHTTP.git/info/refs',
        REMOTE_USER: 'mrtest@example.com',
        // REMOTE_ADDR,
        CONTENT_TYPE: requestHeaders['Content-Type'],
        QUERY_STRING: parsedUrl.query // 'service=git-receive-pack'
      }
    }
    let proc = exec('git http-backend', options)
    if (postStream && typeof postStream.pipe === 'function') {
      console.log('STREAMING INTO STDIN PIPE')
      postStream.pipe(proc.stdin)
    }
    const body = new stream.PassThrough()
    let waitForHeaders = new Promise(function (resolve, reject) {
      proc.stdout
        .pipe(
          parseHeaderStream(function (err, headers) {
            console.log('headers =', headers)
            if (err) reject(err)
            else resolve(headers)
          })
        )
        .on('body', function (_body) {
          _body.pipe(body)
        })
    })
    let headers = await waitForHeaders
    return { body, headers }
  }

  // Note: we lose the headers :(
  function get (uri, requestBody, cb) {
    request('GET', uri, requestBody, {}).then(({ body, headers }) =>
      cb(null, body)
    )
  }

  // Note: we lose the headers :(
  function postReceivePackRequest (uri, requestBody, cb) {
    let buf = Buffer.from(requestBody, 'hex')
    let postStream = new stream.PassThrough()
    postStream.end(buf)
    request('POST', uri, postStream, {
      'Content-Type': 'application/x-git-receive-pack-request'
    }).then(({ body, headers }) => cb(null, body))
  }

  // Note: we lose the headers :(
  function postUploadPackRequest (uri, requestBody, cb) {
    let buf = Buffer.from(requestBody, 'hex')
    let postStream = new stream.PassThrough()
    postStream.end(buf)
    request('POST', uri, postStream, {
      'Content-Type': 'application/x-git-upload-pack-request'
    }).then(({ body, headers }) => cb(null, body))
  }

  return {
    request,
    get,
    postReceivePackRequest,
    postUploadPackRequest
  }
}
