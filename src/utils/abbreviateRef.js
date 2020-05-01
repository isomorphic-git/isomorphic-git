// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
let abbreviateRx;

export function abbreviateRef(ref) {
  if (!abbreviateRx)
    abbreviateRx = new RegExp('^refs/(heads/|tags/|remotes/)?(.*)');
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
