export async function hasObjectLoose({ fs, gitdir, oid }) {
  const source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  return fs.exists(`${gitdir}/${source}`)
}
