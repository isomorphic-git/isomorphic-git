import { Request } from 'http'

import SecureSocket from 'securesocket'

export default class HttpClient {
  static async request(options) {
    const method = options.method || 'GET'
    const parts = options.url.split('/')
    const protocol = parts.shift()
    let secure
    if (protocol === 'http:') {
      secure = false
    } else if (protocol === 'https:') {
      secure = true
    } else {
      throw new Error(
        `Invalid protocol ${protocol} - must be "http:" or "https:"`
      )
    }
    if (parts.shift()) throw new Error('malformed')
    const origin = parts.shift()
    let [host, port] = origin.split(':', 2)
    if (port == null) port = protocol === 'http:' ? 80 : 443
    console.log(`host=${host}`)
    console.log(`port=${port}`)
    console.log(`method=${method}`)
    console.log(`headers=${JSON.stringify(options.headers)}`)

    const path = '/' + parts.join('/')
    console.log(`path=${path}`)
    const result = {
      url: options.url,
      method,
      headers: {},
    }

    let body
    if (options.body) {
      if (options.body.length !== 1) throw new Error()
      body = options.body[0].buffer
    }
    const headers = []
    if (options.headers) {
      for (const property in options.headers)
        headers.push(property, options.headers[property])
    }

    return new Promise((resolve, reject) => {
      const request = new Request({
        host,
        path,
        method,
        headers,
        body,
        response: ArrayBuffer,
        ...(secure && {
          Socket: SecureSocket,
          secure: {
            protocolVersion: 0x303,
            trace: false,
          },
        }),
        port,
      })
      request.callback = function(message, value, etc) {
        if (Request.status === message) {
          console.log(`statusCode ${value}`)
          result.statusCode = value
          // @@ statusMessage too
        } else if (Request.header === message) {
          result.headers[value] = etc
          console.log(`${value}: ${etc}`)
        } else if (Request.responseComplete === message) {
          result.body = [new Uint8Array(value)]
          console.log('message:')
          console.log(String.fromArrayBuffer(value))
          resolve(result)
        } else if (message < 0) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject(-1)
        }
      }
    })
  }
}
