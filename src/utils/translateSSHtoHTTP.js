export function translateSSHtoHTTP(url) {
  // handle "shorter scp-like syntax". The user is dropped: it names an ssh
  // account and means nothing over https, which is what the old expression did
  // for `git@` too.
  url = url.replace(/^[^/@:]+@([^/@:]+):/, 'https://$1/')
  // handle proper SSH URLs
  url = url.replace(/^ssh:\/\//, 'https://')
  return url
}
