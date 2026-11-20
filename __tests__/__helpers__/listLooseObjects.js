// Returns the sorted oids of all loose object files under `gitdir/objects`.
export async function listLooseObjects(fs, gitdir) {
  const dirs = (await fs.readdir(`${gitdir}/objects`)).filter(
    name => name.length === 2
  )
  const oids = []
  for (const dir of dirs) {
    for (const file of await fs.readdir(`${gitdir}/objects/${dir}`)) {
      oids.push(dir + file)
    }
  }
  return oids.sort()
}
