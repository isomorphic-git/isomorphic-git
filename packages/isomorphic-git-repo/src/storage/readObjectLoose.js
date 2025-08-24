export async function readObjectLoose({ fs, gitdir, oid }) {
  const source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  const file = await fs.read(`${gitdir}/${source}`)
  if (!file) {
    return null
  }
  return { object: file, format: 'deflated', source }
}
