export function addCredentialUsername({ config, onAuth }) {
  if (!onAuth) return onAuth

  return async (url, auth) => {
    const username =
      auth.username || (await config.get(`credential.${url}.username`))
    return onAuth(url, username ? { ...auth, username } : auth)
  }
}
