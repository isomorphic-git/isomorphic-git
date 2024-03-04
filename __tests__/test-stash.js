// @ts-nocheck
/* eslint-env node, browser, jasmine */
const { stash, Errors, setConfig, add, status } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

const addUserConfig = async (fs, dir, gitdir) => {
  await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'user name' })
  await setConfig({
    fs,
    dir,
    gitdir,
    path: 'user.email',
    value: 'u@test',
  })
}

const stashChanges = async (fs, dir, gitdir, defalt = true, again = true) => {
  // add user to config
  await addUserConfig(fs, dir, gitdir)

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
    await stash({ fs, bare: true, dir, gitdir })
  } catch (e) {
    error = e
    console.log(e.stack)
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
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-stash')
    // Test

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.stash')
    expect(error.code).toEqual(Errors.MissingNameError.code)
    expect(error.data.role).toEqual('author')
  })

  it('stash with no changes', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-stash')
    // Test

    // add user to config
    await addUserConfig(fs, dir, gitdir)

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir })
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
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-stash')
    // Test

    await stashChanges(fs, dir, gitdir, false, false) // no unstaged changes
  })

  it('stash with staged and unstaged changes', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-stash')
    // Test
    await stashChanges(fs, dir, gitdir, true, false) // with unstaged changes
  })
})

describe('stash apply', () => {
  it('stash apply with staged changes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, false) // no unstaged changes

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
      console.log(e.stack)
    }

    expect(error).toBeNull()
    const aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('modified')
    const bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')
  })

  it('stash apply with staged and unstaged changes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
      console.log(e.stack)
    }

    expect(error).toBeNull()
    const aStatus = await status({ fs, dir, gitdir, filepath: 'a.txt' })
    expect(aStatus).toBe('modified')
    const bStatus = await status({ fs, dir, gitdir, filepath: 'b.js' })
    expect(bStatus).toBe('modified')
    const mStatus = await status({ fs, dir, gitdir, filepath: 'm.xml' })
    expect(mStatus).toBe('*modified') // m.xml is not staged
  })

  it('stash apply with staged and unstaged changes, include same file', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, true) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
      console.log(e.stack)
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
    const { fs, dir, gitdir } = await makeFixture('test-stash')
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
      await stash({ fs, bare: true, dir, gitdir, op: 'push' })
      aStatus = await status({
        fs,
        dir,
        gitdir,
        filepath: 'folder/c.txt',
      })
      expect(aStatus).toBe('absent')
      bStatus = await status({ fs, dir, gitdir, filepath: 'folder/d.js' })
      expect(bStatus).toBe('absent')

      await stash({ fs, bare: true, dir, gitdir, op: 'apply' })
    } catch (e) {
      error = e
      console.log(e.stack)
    }

    expect(error).toBeNull()
    aStatus = await status({ fs, dir, gitdir, filepath: 'folder/c.txt' })
    expect(aStatus).toBe('added')
    bStatus = await status({ fs, dir, gitdir, filepath: 'folder/d.js' })
    expect(bStatus).toBe('added')
  })
})

describe('stash list', () => {
  it('stash list with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList).toEqual([])
  })

  it('stash list with 1 stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(1)
  })

  it('stash list with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(2)
  })
})

describe('stash drop', () => {
  it('stash drop with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'drop' })
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
      await stash({ fs, bare: true, dir, gitdir, op: 'drop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })
})

describe('stash clear', () => {
  it('stash clear with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'clear' })
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
      await stash({ fs, bare: true, dir, gitdir, op: 'clear' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })

  it('stash clear with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'clear' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })
})

describe('stash pop', () => {
  it('stash pop with no stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'pop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
  })

  it('stash pop with 1 stash', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'pop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(0)
  })

  it('stash pop with 2 stashes', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-stash')

    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes
    await stashChanges(fs, dir, gitdir, true, false) // staged and non-unstaged changes

    let error = null
    try {
      await stash({ fs, bare: true, dir, gitdir, op: 'pop' })
    } catch (e) {
      error = e
    }

    expect(error).toBeNull()
    const stashList = await stash({ fs, bare: true, dir, gitdir, op: 'list' })
    expect(stashList.length).toBe(1)
  })
})
