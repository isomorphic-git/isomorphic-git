const { exec } = require('child_process')
const url = require('url')
const stream = require('stream')
const parseHeaderStream = require('parse-header-stream')
const path = require('path')

module.exports = function (rootDir) {
  async function request (method, rawUrl, postStream) {
    let parsedUrl = url.parse(rawUrl)
    let options = {
      env: {
        REQUEST_METHOD: method,
        GIT_PROJECT_ROOT: rootDir,
        PATH_INFO: parsedUrl.pathname, // '/test-GitRemoteHTTP.git/info/refs',
        REMOTE_USER: 'mrtest@example.com',
        // REMOTE_ADDR,
        // CONTENT_TYPE
        QUERY_STRING: parsedUrl.query // 'service=git-receive-pack'
      }
    }
    let proc = exec('git http-backend', options)
    if (postStream && typeof postStream.pipe === 'function') {
      postStream.pipe(proc.stdin)
    }
    const body = new stream.PassThrough()
    let waitForHeaders = new Promise(function (resolve, reject) {
      proc.stdout
        .pipe(
          parseHeaderStream(function (err, headers) {
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
    console.log('requestBody =', requestBody)
    request('GET', uri, requestBody).then(({ body, headers }) => cb(null, body))
  }

  // Note: we lose the headers :(
  function post (uri, requestBody, cb) {
    console.log('requestBody =', requestBody)
    request('POST', uri, requestBody).then(({ body, headers }) =>
      cb(null, body)
    )
  }

  return {
    request,
    get,
    post
  }
}

if (!module.parent) {
  // module.exports('fixtures').request('/test-GitRemoteHTTP.git/info/refs?service=git-upload-pack').then(
  let asdf = path.resolve(
    process.cwd(),
    'C:\\Users\\Will\\AppData\\Local\\Temp\\d-117820-4048-1ygmtfz.7gt5'
  )
  console.log('asdf =', asdf)
  module
    .exports(asdf)
    .request('GET', '/foo/info/refs?service=git-upload-pack')
    .then(
      // request('/test-GitRemoteHTTP.git/info/refs?service=git-receive-pack').then(
      ({ headers, body }) => {
        console.log(headers)
        body.pipe(process.stdout)
      }
    )
}
