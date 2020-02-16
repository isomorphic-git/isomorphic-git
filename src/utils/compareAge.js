export function compareAge(a, b) {
  return a.committer.timestamp - b.committer.timestamp
}
