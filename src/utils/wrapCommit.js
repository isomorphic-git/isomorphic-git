export default function wrapObject (commit) {
  return `commit ${commit.length}\0${commit}`
}
