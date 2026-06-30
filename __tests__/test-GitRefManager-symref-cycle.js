/* eslint-env node, browser, jasmine, jest */
import { GitRefManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

// Resolving a self-referential symref chain (a -> b -> a) must terminate rather than
// recurse forever. git bounds this with SYMREF_MAXDEPTH; here we detect the cycle.
describe('GitRefManager symref cycle handling', () => {
  it('returns (throwing) instead of looping on a -> b -> a', async () => {
    // Use real timers so the race below can time out if resolve never returns
    // (FixtureFS installs fake timers by default).
    if (globalThis.jest) jest.useRealTimers()

    const { fs, gitdir } = await makeFixture('test-GitRefManager-symref-cycle')
    await fs.write(
      `${gitdir}/refs/remotes/origin/a`,
      'ref: refs/remotes/origin/b\n'
    )
    await fs.write(
      `${gitdir}/refs/remotes/origin/b`,
      'ref: refs/remotes/origin/a\n'
    )

    const result = await Promise.race([
      GitRefManager.resolve({ fs, gitdir, ref: 'refs/remotes/origin/a' }).then(
        value => ({ value }),
        error => ({ error })
      ),
      new Promise(resolve =>
        setTimeout(() => resolve({ timedOut: true }), 5000)
      ),
    ])

    // Without the fix resolve() never returns and we hit the 5s timeout.
    expect(result.timedOut).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(result.error.message).toMatch(/circular/i)
  }, 15000)

  it('still resolves a normal HEAD -> branch -> sha chain', async () => {
    const { fs, gitdir } = await makeFixture('test-GitRefManager-symref-ok')
    const sha = '0123456789abcdef0123456789abcdef01234567'
    await fs.write(`${gitdir}/refs/heads/main`, `${sha}\n`)
    await fs.write(`${gitdir}/HEAD`, 'ref: refs/heads/main\n')
    expect(await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })).toBe(sha)
  })
})
