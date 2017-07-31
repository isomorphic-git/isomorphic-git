//@flow
export default function unwrapObject (commit : buffer) {
  let i = commit.indexOf(0)
  return commit.slice(i+1)
}
