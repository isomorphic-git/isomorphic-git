export function filterCapabilities (server, client) {
  let serverNames = server.map(cap => cap.split('=', 1)[0])
  return client.filter(cap => {
    let name = cap.split('=', 1)[0]
    return serverNames.includes(name)
  })
}
