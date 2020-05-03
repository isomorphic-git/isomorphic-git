import { Request } from 'http'

import SecureSocket from 'securesocket'

export default class HttpClient {
  static async request(options) {
    const method = options.method || 'GET'
    const parts = options.url.split('/')
    if (parts.shift() !== 'https:') throw new Error('https only')
    if (parts.shift()) throw new Error('malformed')
    const host = parts.shift()
    const path = '/' + parts.join('/')
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
        Socket: SecureSocket,
        secure: {
          protocolVersion: 0x303,
          trace: false,
        },
        port: 443,
      })
      request.callback = function(message, value, etc) {
        if (Request.status === message) result.statusCode = value
        // @@ statusMessage too
        else if (Request.header === message) result.headers[value] = etc
        else if (Request.responseComplete === message) {
          result.body = [new Uint8Array(value)]
          resolve(result)
        } else if (message < 0) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject(-1)
        }
      }
    })
  }
}
