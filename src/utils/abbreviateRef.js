// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
const regexs = [
  new RegExp('refs/remotes/(.*)/HEAD'),
  new RegExp('refs/remotes/(.*)'),
  new RegExp('refs/heads/(.*)'),
  new RegExp('refs/tags/(.*)'),
  new RegExp('refs/(.*)')
]

export function abbreviateRef (ref) {
  for (const reg of regexs) {
    let matches = reg.exec(ref)
    if (matches) {
      return matches[1]
    }
  }
  return ref
}
