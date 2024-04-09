// @ts-nocheck
/* eslint-env node, browser, jasmine */

const {
  stash,
  Errors,
  setConfig,
  add,
  status,
  commit,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

const makeFixtureStash = async testDir => {
  const fixtureDir = 'test-stash'
  let { fs, dir, gitdir } = await makeFixture(fixtureDir)
  if (process.browser && testDir) {
    const targetDir = dir.replace(fixtureDir, `${fixtureDir}-${testDir}`)
    // copy all files from dirName to targetDir
    const files = await fs.readdirDeep(dir)
    for (const file of files) {
      const content = await fs.read(file)
      const fileName = file.replace(`${dir}/`, '')
      await fs.write(`${targetDir}/${fileName}`, content)
    }

    const targetGitDir = gitdir.replace(fixtureDir, `${fixtureDir}-${testDir}`)
    const gitFiles = await fs.readdirDeep(gitdir)
    for (const file of gitFiles) {
      const content = await fs.read(file)
      const fileName = file.replace(`${gitdir}/`, '')
      await fs.write(`${targetGitDir}/${fileName}`, content)
    }

    dir = targetDir
    gitdir = targetGitDir
  }
  return { fs, dir, gitdir }
}

const addUserConfig = async (fs, dir, gitdir) => {
  await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'stash tester' })
  await setConfig({
    fs,
    dir,
    gitdir,
    path: 'user.email',
    value: 'test@stash.com',
  })
}

const stashChanges = async (fs, dir, gitdir, defalt = true, again = true) => {
  // add user to config
  await addUserConfig(fs, dir, gitdir)

  const aContent = new TextDecoder().decode(await fs.read(`${dir}/a.txt`))
  const bContent = new TextDecoder().decode(await fs.read(`${dir}/b.js`))
  await fs.write(`${dir}/a.txt`, 'staged changes - a')
  await fs.write(`${dir}/b.js`, 'staged changes - b')

  await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.js'] })
  let aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
  expect(aStatus).toBe('modified')

  let bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
  expect(bStatus).toBe('modified')

  let mStatus = await status({ fs, dir, gitdir, filepath: 'm.xml' })
  if (defalt) {
    // include unstaged changes, different file first
    await fs.write(`${dir}/m.xml`, '<unstaged>m</unstaged>')
    mStatus = await status({ fs, dir, gitdir, filepath: 'm.xml' })
    expect(mStatus).toBe('*modified')

    if (again) {
      // same file changes again after staged
      await fs.write(`${dir}/a.txt`, 'unstaged changes - a - again')
      aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
      expect(aStatus).toBe('*modified')
    }
  }

  let error = null
  try {
    await stash({ fs, dir, gitdir })
    const aContentAfterStash = new TextDecoder().decode(
      await fs.read(`${dir}/a.txt`)
    )
    expect(aContentAfterStash).toEqual(aContent)
    const bContentAfterStash = new TextDecoder().decode(
      await fs.read(`${dir}/b.js`)
    )
    expect(bContentAfterStash).toEqual(bContent)
  } catch (e) {
    error = e
  }

  expect(error).toBeNull()
  aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
  expect(aStatus).toBe('unmodified')
  bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
  expect(bStatus).toBe('unmodified')
  mStatus = await status({ fs, dir, gitdir, filepath: 'm.xml' })
  expect(mStatus).toBe('unmodified')
}

describe('abort stash', () => {
  it('stash without user', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    let error = null
    try {
      await stash({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.stash')
    expect(error.code).toEqual(Errors.MissingNameError.code)
    expect(error.data.role).toEqual('author')
  })

  it('stash with no changes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    // add user to config
    await addUserConfig(fs, dir, gitdir)

    let error = null
    try {
      await stash({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.stash')
    expect(error.code).toEqual(Errors.NotFoundError.code)
    expect(error.data.what).toEqual('changes, nothing to stash')
  })
})

describe('stash push', () => {
  it('stash with staged changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('pushOne')
    await stashChanges(fs, dir, gitdir, false, false) // no unstaged changes
  })

  it('stash with staged and unstaged changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('pushTwo')
    await stashChanges(fs, dir, gitdir, true, false) // with unstaged changes
  })

  it('stash with staged and unstaged changes plus same file changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('pushThree')
    await stashChanges(fs, dir, gitdir, true, true) // with unstaged changes
  })
})

describe('stash apply', () => {
  it('stash apply with staged changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyOne')

    await stashChanges(fs, dir, gitdir, false, false) // no unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    const aContent = new TextDecoder().decode(await fs.read(`${dir}/a.txt`))
    expect(aContent).toEqual('staged changes - a') // make sure the staged changes are applied
    const bContent = new TextDecoder().decode(await fs.read(`${dir}/b.js`))
    expect(bContent).toEqual('staged changes - b') // make sure the staged changes are applied

    expect(error).toBeNull()
    const aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('modified')
    const bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')
  })

  it('stash apply with staged and unstaged changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyTwo')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    const aContent = new TextDecoder().decode(await fs.read(`${dir}/a.txt`))
    expect(aContent).toEqual('staged changes - a') // make sure the staged changes are applied
    const bContent = new TextDecoder().decode(await fs.read(`${dir}/b.js`))
    expect(bContent).toEqual('staged changes - b') // make sure the staged changes are applied
    const mContent = new TextDecoder().decode(await fs.read(`${dir}/m.xml`))
    expect(mContent).toEqual('<unstaged>m</unstaged>') // make sure the unstaged changes are applied

    expect(error).toBeNull()
    const aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('modified')
    const bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')
    const mStatus = await status({ fs, dir, gitdir, filepath: 'm.xml' })
    expect(mStatus).toBe('*modified') // m.xml is not staged
  })

  it('stash apply with staged and unstaged changes, include same file', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyThree')

    await stashChanges(fs, dir, gitdir, true, true) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('*modified') // a.txt has both staged and unstaged changes

    const againContent = new TextDecoder().decode(await fs.read(`${dir}/a.txt`))
    expect(againContent).toEqual('unstaged changes - a - again') // make sure the unstaged changes are applied

    const bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')
    const mStatus = await status({ fs, dir, gitdir, filepath: 'm.xml' })
    expect(mStatus).toBe('*modified') // m.xml is not staged
  })

  it('stash apply with staged changes under two folders', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyFour')
    await addUserConfig(fs, dir, gitdir)

    await fs.write(`${dir}/folder/c.txt`, 'staged changes - c')
    await fs.write(`${dir}/folder/d.js`, 'staged changes - d')

    await add({ fs, dir, gitdir, filepath: ['folder/c.txt', 'folder/d.js'] })
    let aStatus = await status({ fs, dir, gitdir, filepath: 'folder/c.txt' })
    expect(aStatus).toBe('added')
    let bStatus = await status({ fs, dir, gitdir, filepath: 'folder/d.js' })
    expect(bStatus).toBe('added')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })
      aStatus = await status({
        fs,
        dir,
        gitdir,
        filepath: 'folder/c.txt',
      })
      expect(aStatus).toBe('absent')
      bStatus = await status({ fs, dir, gitdir, filepath: 'folder/d.js' })
      expect(bStatus).toBe('absent')

      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    aStatus = await status({ fs, dir, gitdir, filepath: 'folder/c.txt' })
    expect(aStatus).toBe('added')
    bStatus = await status({ fs, dir, gitdir, filepath: 'folder/d.js' })
    expect(bStatus).toBe('added')
  })

  it('stash apply with deleted files', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyFive')
    await addUserConfig(fs, dir, gitdir)

    await fs.rm(`${dir}/a.txt`)
    await fs.rm(`${dir}/b.js`)

    let aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('*deleted')
    let bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('*deleted')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })

      aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
      expect(aStatus).toBe('unmodified')
      bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
      expect(bStatus).toBe('unmodified')

      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('*deleted')
    bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('*deleted')
  })

  it('stash apply with deleted files and staged changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applySix')
    await addUserConfig(fs, dir, gitdir)

    await fs.rm(`${dir}/a.txt`)
    await fs.write(`${dir}/b.js`, 'staged changes - b')

    let aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('*deleted')
    let bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('*modified')

    await add({ fs, dir, gitdir, filepath: ['b.js'] })

    bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })

      aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
      expect(aStatus).toBe('unmodified')
      bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
      expect(bStatus).toBe('unmodified')

      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('*deleted')
    bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')
  })

  it('stash apply with delete folder', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applySeven')
    await addUserConfig(fs, dir, gitdir)

    await fs.mkdir(`${dir}/folder`)
    await fs.write(`${dir}/folder/e.js`, 'commited change - e')
    await add({ fs, dir, gitdir, filepath: ['folder', 'folder/e.js'] })
    await commit({
      fs,
      dir,
      gitdir,
      author: { name: 'author', email: 'author@test' },
      message: 'add folder',
    })

    // await fs.rmdir(`${dir}/folder`)
    await fs.rm(`${dir}/folder/e.js`)

    let aStatus = await status({ fs, dir, gitdir, filepath: 'folder/e.js' })
    expect(aStatus).toBe('*deleted')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })

      aStatus = await status({ fs, dir, gitdir, filepath: 'folder/e.js' })
      expect(aStatus).toBe('unmodified')

      await stash({ fs, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    aStatus = await status({ fs, dir, gitdir, filepath: 'folder/e.js' })
    expect(aStatus).toBe('*deleted')
  })
})

describe('stash list', () => {
  it('stash list with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList).toEqual([])
  })

  it('stash list with 1 stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged 3 file changes

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(1)
  })

  it('stash list with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(2)
  })
})

describe('stash drop', () => {
  it('stash drop with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'drop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash drop with stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'drop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })
})

describe('stash clear', () => {
  it('stash clear with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'clear' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash clear with stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'clear' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })

  it('stash clear with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'clear' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })
})

describe('stash pop', () => {
  it('stash pop with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('popOne')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'pop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash pop with 1 stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('popTwo')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'pop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })

  it('stash pop with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('popThree')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'pop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(1)
  })
})
