// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
const abbreviateRx = new RegExp('^refs/(heads/|tags/|remotes/)?(.*)')

export function abbreviateRef(ref) {
  const match = abbreviateRx.exec(ref)
  if (match) {
    if (match[1] === 'remotes/' && ref.endsWith('/HEAD')) {
      return match[2].slice(0, -5)
    } else {
      return match[2]
    }
  }
  return ref
}
