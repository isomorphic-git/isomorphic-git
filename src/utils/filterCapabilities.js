export function filterCapabilities(server, client) {
  const serverNames = server.map(cap => cap.split('=', 1)[0])
  return client.filter(cap => {
    const name = cap.split('=', 1)[0]
    return serverNames.includes(name)
  })
}
