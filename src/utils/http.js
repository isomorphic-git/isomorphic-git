export async function http ({
  url,
  method = 'GET',
  headers = {},
  body,
}) {
  const fetch = global.fetch ? global.fetch : require('node-fetch')
  let res = await fetch(url, { method, headers, body })
  return {
    url: res.url,
    method: res.method,
    statusCode: res.status,
    statusMessage: res.statusText,
    body: await res.arrayBuffer(),
    headers: res.headers,
  }
}
