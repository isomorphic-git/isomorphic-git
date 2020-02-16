export async function expandOidLoose({ fs, gitdir, oid: short }) {
  const prefix = short.slice(0, 2)
  const objectsSuffixes = await fs.readdir(`${gitdir}/objects/${prefix}`)
  return objectsSuffixes
    .map(suffix => `${prefix}${suffix}`)
    .filter(_oid => _oid.startsWith(short))
}
