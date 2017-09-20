const { exec } = require('child_process')
const url = require('url')
const stream = require('stream')
const parseHeaderStream = require('parse-header-stream')

async function request (rawUrl) {
  let parsedUrl = url.parse(rawUrl)
  let options = {
    env: {
      REQUEST_METHOD: 'GET',
      GIT_PROJECT_ROOT: 'fixtures',
      PATH_INFO: parsedUrl.pathname, // '/test-push.git/info/refs',
      REMOTE_USER: 'mrtest@example.com',
      // REMOTE_ADDR,
      // CONTENT_TYPE
      QUERY_STRING: parsedUrl.query // 'service=git-receive-pack'
    }
  }
  let proc = exec('git http-backend', options)
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

module.exports.request = request

// Note: we lose the headers :(
module.exports.nockback = function (uri, requestBody, cb) {
  request(uri).then(({ body, headers }) => cb(null, body))
}

if (!module.parent) {
  request('/test-push.git/info/refs?service=git-upload-pack').then(
    // request('/test-push.git/info/refs?service=git-receive-pack').then(
    ({ headers, body }) => body.pipe(process.stdout)
  )
}
