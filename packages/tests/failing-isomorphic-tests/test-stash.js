/* eslint-env node, browser, jasmine */
/**
 * TODO: contains failing test from bektan regression so it did work bfore which is great.
 */ 
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

const stashChanges = async (
  fs,
  dir,
  gitdir,
  defalt = true,
  again = true,
  message = ''
) => {
  // add user to config
  await addUserConfig(fs, dir, gitdir)

  const aContent = await fs.read(`${dir}/a.txt`)
  const bContent = await fs.read(`${dir}/b.js`)
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
    await stash({ fs, dir, gitdir, message })
    const aContentAfterStash = await fs.read(`${dir}/a.txt`)
    expect(aContentAfterStash.toString()).toEqual(aContent.toString())

    const bContentAfterStash = await fs.read(`${dir}/b.js`)
    expect(bContentAfterStash.toString()).toEqual(bContent.toString())
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
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

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
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

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

  it('stash with untracked files - no other changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('pushUntracked')

    const cContentBeforeStash = 'untracked file - c'
    const dContentBeforeStash = 'untracked file - d'

    // Create untracked files
    await fs.write(`${dir}/c.txt`, cContentBeforeStash)
    await fs.write(`${dir}/d.js`, dContentBeforeStash)

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })
    } catch (e) {
      error = e // should come here since no changes to stash
    }

    expect(error).not.toBeNull()
    const cContentAfterStash = await fs.read(`${dir}/c.txt`)
    const dContentAfterStash = await fs.read(`${dir}/d.js`)

    expect(cContentAfterStash.toString()).toEqual(cContentBeforeStash)
    expect(dContentAfterStash.toString()).toEqual(dContentBeforeStash)
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

  it('stash with untracked files - with other changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('pushUntracked')

    await addUserConfig(fs, dir, gitdir)
    await fs.write(`${dir}/a.txt`, 'staged changes - a')
    await fs.write(`${dir}/b.js`, 'staged changes - b')

    await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.js'] })

    const cContentBeforeStash = 'untracked file - c'
    const dContentBeforeStash = 'console.log("untracked file - d")'

    // Create untracked files
    await fs.write(`${dir}/c.txt`, cContentBeforeStash)
    await fs.write(`${dir}/d.js`, dContentBeforeStash)

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const cContentAfterStash = await fs.read(`${dir}/c.txt`)
    const dContentAfterStash = await fs.read(`${dir}/d.js`)

    expect(cContentAfterStash.toString()).toEqual(cContentBeforeStash)
    expect(dContentAfterStash.toString()).toEqual(dContentBeforeStash)
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

    const aContent = await fs.read(`${dir}/a.txt`)
    expect(aContent.toString()).toEqual('staged changes - a') // make sure the staged changes are applied
    const bContent = await fs.read(`${dir}/b.js`)
    expect(bContent.toString()).toEqual('staged changes - b') // make sure the staged changes are applied

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

    const aContent = await fs.read(`${dir}/a.txt`)
    expect(aContent.toString()).toEqual('staged changes - a') // make sure the staged changes are applied
    const bContent = await fs.read(`${dir}/b.js`)
    expect(bContent.toString()).toEqual('staged changes - b') // make sure the staged changes are applied
    const mContent = await fs.read(`${dir}/m.xml`)
    expect(mContent.toString()).toEqual('<unstaged>m</unstaged>') // make sure the unstaged changes are applied

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

    const againContent = await fs.read(`${dir}/a.txt`)
    expect(againContent.toString()).toEqual('unstaged changes - a - again') // make sure the unstaged changes are applied

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

  it('stash apply with untracked files - with other staged and unstaged changes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyUntracked')

    await addUserConfig(fs, dir, gitdir)
    await fs.write(`${dir}/a.txt`, 'staged changes - a')
    await fs.write(`${dir}/b.js`, 'unstaged changes - b')

    await add({ fs, dir, gitdir, filepath: ['a.txt'] }) // only staged a.txt

    // Create untracked files
    await fs.write(`${dir}/c.txt`, 'untracked file - c')
    await fs.write(`${dir}/d.js`, 'untracked file - d')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'push' })
      const cContentBeforeApply = await fs.read(`${dir}/c.txt`)
      const dContentBeforeStash = await fs.read(`${dir}/d.js`)

      await stash({ fs, dir, gitdir, op: 'apply' })

      const cContentAfterApply = await fs.read(`${dir}/c.txt`)
      const dContentAfterStash = await fs.read(`${dir}/d.js`)

      expect(cContentAfterApply.toString()).toEqual(
        cContentBeforeApply.toString()
      )
      expect(dContentAfterStash.toString()).toEqual(
        dContentBeforeStash.toString()
      )
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash apply with invalid ref idx', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyInvalidRefIdx')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'apply', refIdx: 1 })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.stash')
    expect(error.code).toEqual(Errors.InvalidRefNameError.code)
  })

  it('stash apply with non-default ref idx', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('applyInvalidRefIdx')

    await stashChanges(fs, dir, gitdir, false, false, 'stash one') // no unstaged changes

    const aOriginalContent = 'stash two staged changes - aa'
    const bOriginalContent = 'console.log("stash two staged changes - bb")'
    await fs.write(`${dir}/a.txt`, aOriginalContent)
    await fs.write(`${dir}/b.js`, bOriginalContent)

    await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.js'] })
    await stash({ fs, dir, gitdir, op: 'push', message: 'stash two' })

    await stashChanges(fs, dir, gitdir, true, true, 'stash three')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'apply', refIdx: 1 })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const aContent = await fs.read(`${dir}/a.txt`)
    expect(aContent.toString()).toEqual(aOriginalContent) // make sure the 2nd staged changes are applied
    const bContent = await fs.read(`${dir}/b.js`)
    expect(bContent.toString()).toEqual(bOriginalContent) // make sure the 2nd staged changes are applied
  })
})

describe('stash list', () => {
  it('stash list with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList).toEqual([])
  })

  it('stash list with 1 stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged 3 file changes

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(1)
  })

  it('stash list with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(2)
  })

  it('stash list with default message', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    const defaultMsg = await stash({ fs, dir, gitdir, op: 'list' })
    expect(defaultMsg).toEqual([
      'stash@{0}: WIP on master: 3ca31f1 initial commit',
    ])
  })

  it('stash list with custom message', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

    await addUserConfig(fs, dir, gitdir)

    await fs.write(`${dir}/a.txt`, 'staged changes - a')
    await fs.write(`${dir}/b.js`, 'staged changes - b')

    await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.js'] })

    await stash({ fs, dir, gitdir, op: 'push', message: 'test custom message' })
    const customMsg = await stash({ fs, dir, gitdir, op: 'list' })
    expect(customMsg).toEqual([
      'stash@{0}: test custom message: 3ca31f1 initial commit',
    ])
  })
})

describe('stash drop', () => {
  it('stash drop with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('dropWithNoStash')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'drop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash drop with stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

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

  it('stash drop with invalid ref idx', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('dropInvalidRefIdx')

    await stashChanges(fs, dir, gitdir, false, false) // no unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'drop', refIdx: 1 })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.stash')
    expect(error.code).toEqual(Errors.InvalidRefNameError.code)
  })

  it('stash drop with non-default ref idx', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('dropValidRefIdx')

    await stashChanges(fs, dir, gitdir, false, false, 'stash one') // no unstaged changes

    await fs.write(`${dir}/a.txt`, 'stash two staged changes - a')
    await fs.write(`${dir}/b.js`, 'stash two staged changes - b')

    await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.js'] })
    await stash({ fs, dir, gitdir, op: 'push', message: 'stash two' })

    await stashChanges(fs, dir, gitdir, true, true, 'stash three')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'drop', refIdx: 1 })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList).toEqual([
      'stash@{0}: stash one: 3ca31f1 initial commit',
      'stash@{1}: stash three: 3ca31f1 initial commit',
    ])
  })
})

describe('stash clear', () => {
  it('stash clear with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'clear' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash clear with stash', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

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
    const { fs, dir, gitdir } = await makeFixtureStash('test-stash')

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

  it('stash pop with invalid ref idx', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('popInvalidRefIdx')

    await stashChanges(fs, dir, gitdir, false, false) // no unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // plus unstaged changes

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'pop', refIdx: 2 })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.stash')
    expect(error.code).toEqual(Errors.InvalidRefNameError.code)
  })

  it('stash pop with non-default ref idx', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('dropValidRefIdx')

    await stashChanges(fs, dir, gitdir, false, false, 'stash one') // no unstaged changes

    const aNewContent = 'stash two staged changes - aaa'
    const bNewContent = 'console.log("stash two staged changes - bbb")'

    await fs.write(`${dir}/a.txt`, aNewContent)
    await fs.write(`${dir}/b.js`, bNewContent)

    await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.js'] })
    await stash({ fs, dir, gitdir, op: 'push', message: 'stash two' })

    await stashChanges(fs, dir, gitdir, true, true, 'stash three')

    let error = null
    try {
      await stash({ fs, dir, gitdir, op: 'pop', refIdx: 1 })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()

    const stashList = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashList).toEqual([
      'stash@{0}: stash one: 3ca31f1 initial commit',
      'stash@{1}: stash three: 3ca31f1 initial commit',
    ])
    const aContent = await fs.read(`${dir}/a.txt`)
    expect(aContent.toString()).toEqual(aNewContent) // make sure the 2nd staged changes are applied
    const bContent = await fs.read(`${dir}/b.js`)
    expect(bContent.toString()).toEqual(bNewContent) // make sure the 2nd staged changes are applied
  })
})

describe('stash regression #2138', () => {
  it('should not lose stashes after stash pop followed by stash push', async () => {
    const { fs, dir, gitdir } = await makeFixtureStash('stashRegression')
    await addUserConfig(fs, dir, gitdir)

    // --- stash 1 ---
    await fs.write(dir + '/a.txt', 'change 1')
    await stash({ fs, dir, gitdir, message: 'stash 1', op: 'push' })
    // --- stash 2 ---
    await fs.write(dir + '/a.txt', 'change 2')
    await stash({ fs, dir, gitdir, message: 'stash 2', op: 'push' })

    let stashes = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashes.length).toBe(2)

    // Pop stash 2
    await stash({ fs, dir, gitdir, op: 'pop' })

    stashes = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashes.length).toBe(1)
    // Push stash 2 again
    await stash({ fs, dir, gitdir, message: 'stash 2', op: 'push' })

    stashes = await stash({ fs, dir, gitdir, op: 'list' })
    expect(stashes.length).toBe(2)
  })
})
