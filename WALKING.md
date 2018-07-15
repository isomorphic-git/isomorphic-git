CommitWalker (time)

TreeWalker (space)

- read "dir" returns list of 
  - (workdir) path
  - (tree) path, mode, oid, type
  - (index entry) path, mode, oid, (type = blob), ctimeSeconds, ctimeNanoseconds, mtimeSeconds, mtimeNanoseconds, dev, ino, mode, uid, gid, size, flags
- stat "entry" returns details
  - (workdir) path, mode, type, ctimeSeconds, ctimeNanoseconds, mtimeSeconds, mtimeNanoseconds, dev, ino, mode, uid, gid, size, oid, flags
  - (tree) unavailable
  - (index entry) N/A
- read "entry" returns
  - (workdir) contents, and (trivially) oid
  - (tree) contents
  - (index entry) N/A contents not available

We could treat these as standard procedure and use the following hooks:

- onReadDir (walk, paths[]) => 
  - filter [paths]
  - map by doing walk(path) in parallel or serial, however you like
  - reduce by collecting results
    => paths[][]
- onBlob (walk, [])

filterList -> filterStat -> filterRead
reduceList <- reduceStat <- reduceRead

So how could we write "git status <dir>" in terms of our new procedure?
Given a working tree and an index,
Generate a map of paths to a, d, s, or m representing whether the file is present 
 only in the working tree (a), only in the index (d), both with same oid (s), or both and different oid (m)

filterDirectory: (walk, [index, workdir]) => {
  // Don't recurse into directories that have been added or deleted
  if (index === null && workdir !== null) {
    return { [workdir.path]: 'a' }
  } else if (workdir === null && index !== null) {
    return { [index.path]: 'd' }
  } else {
    return next()
  }
}

iterateDirectory: (paths, action) {
  // Proceed serially
  for ([index, workdir] of paths) {
    await action([index, workdir])
  }
}

iterateDirectory: (paths, action) {
  // Proceed in parallel
  await [...paths].map(action)
}

filterFile: (walk, [index, workdir]) => {
  // Handle file additions and deletions
  if (index === null && workdir !== null) {
    return { [workdir.path]: 'a' }
  } else if (workdir === null && index !== null) {
    return { [index.path]: 'd' }
  } else {
    // Here we could ignore certain filenames. But we'll consider all filenames interesting.
    // We know they must both not be null, otherwise we'd have returned 'a' or 'd' already.
    // So now the choice is between 's' and 'm'
    // We can decide two files are the same based on the stats info
    await populateStat(workdir)
    if (index.size !== workdir.size) {
      return { [index.path]: 'm' }
    } if (compareStats(index, workdir)) {
      return { [index.path]: 's' }
    } else {
      // If that fails, we will need to compare the SHA
      await populateHash(workdir)
      // Now we can compare our working dir file with our index.
      return {
        [index.path]: index.oid === workdir.oid ? 's' : 'm'
      }
      // Alternatively, if we wanted to examine the contents, we could do
      await populateContent(workdir)
    }
  }
}

reduce: (acc, n) => {
  if (acc === undefined) {
    return n
  } else {
    return Object.assign(acc, n)
  }
}
