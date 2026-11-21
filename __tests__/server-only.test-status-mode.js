/* eslint-env node, jasmine */
import * as path from 'path'

import { add, commit, setConfig, status, statusMatrix } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

const author = {
  name: 'Mr. Test',
  email: 'mrtest@example.com',
  timestamp: 1262356920,
  timezoneOffset: -0,
}

async function setup() {
  const { fs, dir, gitdir, _fs } = await makeFixture('test-empty')
  await fs.write(path.join(dir, 'run.sh'), 'hi\n')
  await fs.write(path.join(dir, 'link'), 'target')
  await add({ fs, dir, gitdir, filepath: ['run.sh', 'link'] })
  await commit({ fs, dir, gitdir, author, message: 'init' })
  // Fill the index stat cache so later reads take the fast path
  await statusMatrix({ fs, dir, gitdir })
  return { fs, dir, gitdir, _fs }
}

describe('status and statusMatrix with mode changes', () => {
  it('statusMatrix reports an executable bit change', async () => {
    const { fs, dir, gitdir, _fs } = await setup()
    await _fs.promises.chmod(path.join(dir, 'run.sh'), 0o755)
    const indexBefore = await fs.read(path.join(gitdir, 'index'))
    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['link', 1, 1, 1],
      ['run.sh', 1, 2, 1],
    ])
    // The new mode is not staged
    expect(await fs.read(path.join(gitdir, 'index'))).toEqual(indexBefore)
    expect(await statusMatrix({ fs, dir, gitdir })).toEqual(matrix)
  })

  it('statusMatrix reports a file replaced by a symlink with the same content', async () => {
    const { dir, gitdir, fs, _fs } = await setup()
    await _fs.promises.unlink(path.join(dir, 'link'))
    await _fs.promises.symlink('target', path.join(dir, 'link'))
    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['link', 1, 2, 1],
      ['run.sh', 1, 1, 1],
    ])
  })

  it('statusMatrix treats an unset core.filemode as true', async () => {
    const { fs, dir, gitdir, _fs } = await setup()
    await fs.write(path.join(gitdir, 'config'), '[core]\n\tbare = false\n')
    await _fs.promises.chmod(path.join(dir, 'run.sh'), 0o755)
    const indexBefore = await fs.read(path.join(gitdir, 'index'))
    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['link', 1, 1, 1],
      ['run.sh', 1, 2, 1],
    ])
    // The new mode is not staged
    expect(await fs.read(path.join(gitdir, 'index'))).toEqual(indexBefore)
  })

  it('statusMatrix ignores the executable bit when core.filemode is false', async () => {
    const { fs, dir, gitdir, _fs } = await setup()
    await setConfig({ fs, gitdir, path: 'core.filemode', value: false })
    await _fs.promises.chmod(path.join(dir, 'run.sh'), 0o755)
    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix).toEqual([
      ['link', 1, 1, 1],
      ['run.sh', 1, 1, 1],
    ])
  })

  it('status reports an executable bit change without staging it', async () => {
    const { fs, dir, gitdir, _fs } = await setup()
    await _fs.promises.chmod(path.join(dir, 'run.sh'), 0o755)
    const indexBefore = await fs.read(path.join(gitdir, 'index'))
    expect(await status({ fs, dir, gitdir, filepath: 'run.sh' })).toBe(
      '*modified'
    )
    // The new mode is not staged
    expect(await fs.read(path.join(gitdir, 'index'))).toEqual(indexBefore)
    expect(await status({ fs, dir, gitdir, filepath: 'run.sh' })).toBe(
      '*modified'
    )
  })

  it('status reports a staged executable bit change', async () => {
    const { fs, dir, gitdir, _fs } = await setup()
    await _fs.promises.chmod(path.join(dir, 'run.sh'), 0o755)
    await add({ fs, dir, gitdir, filepath: 'run.sh' })
    expect(await status({ fs, dir, gitdir, filepath: 'run.sh' })).toBe(
      'modified'
    )
    expect(await statusMatrix({ fs, dir, gitdir })).toEqual([
      ['link', 1, 1, 1],
      ['run.sh', 1, 2, 2],
    ])
  })

  it('status ignores the executable bit when core.filemode is false', async () => {
    const { fs, dir, gitdir, _fs } = await setup()
    await setConfig({ fs, gitdir, path: 'core.filemode', value: false })
    await _fs.promises.chmod(path.join(dir, 'run.sh'), 0o755)
    expect(await status({ fs, dir, gitdir, filepath: 'run.sh' })).toBe(
      'unmodified'
    )
  })
})
