/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { clone } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

const IS_RUNNING_IN_BROWSER = typeof window !== 'undefined'

describe('huge repo clone and checkout', () => {
  it('clone from git-http-mock-server with non-blocking optimization for repo with 1k files', async () => {
    const timeTakenWithNonBlocking = await runTestAndGetTimeTaken(
      true,
      'test-branch'
    )

    console.log(
      `\nTime taken in ${
        IS_RUNNING_IN_BROWSER ? 'browser' : 'Node.js'
      } for 1k files`,
      JSON.stringify({
        'Non-blocking': `${timeTakenWithNonBlocking}s`,
      })
    )
  })

  // Disabled in browser because it takes too long (> 120s). Also, use lightningfs to run it in browser.
  xit('clone from git-http-mock-server with non-blocking optimization for repo with 10k files', async () => {
    const timeTakenWithNonBlocking = await runTestAndGetTimeTaken(
      true,
      'test-branch-10k'
    )

    console.log(
      `\nTime taken in ${
        IS_RUNNING_IN_BROWSER ? 'browser' : 'Node.js'
      } for 10k files`,
      JSON.stringify({
        'Non-blocking': `${timeTakenWithNonBlocking}s`,
      })
    )
  })
})

/**
 * @param {boolean} nonBlocking
 * @param {string} branchName
 */
async function runTestAndGetTimeTaken(nonBlocking, branchName) {
  const { fs, dir, gitdir } = await makeFixture(
    `test-clone-karma-${nonBlocking ? 'non-blocking' : 'blocking'}`
  )
  let timer
  let timeTaken = Number.POSITIVE_INFINITY
  const phasesCompleted = new Set()
  let lastProgressMessage = ''
  try {
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 10,
      ref: branchName,
      singleBranch: true,
      url: `https://github.com/ARBhosale/huge1k.git`,
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
      nonBlocking: nonBlocking,
      onProgress({ loaded, total, phase }) {
        if (!timer) timer = Date.now()
        if (loaded === total && !phasesCompleted.has(phase)) {
          const progressMessage = `${phase}: 100% (${loaded}/${total}), done.`
          console.info(progressMessage)
          phasesCompleted.add(phase)
        }
        if (typeof total === 'number' && typeof loaded === 'number') {
          const percentage = Math.round((loaded / total) * 100)
          if (percentage !== 100) {
            const progressMessage = `${phase}: ${percentage}%`
            if (progressMessage !== lastProgressMessage) {
              lastProgressMessage = progressMessage
              if (IS_RUNNING_IN_BROWSER) {
                // console.info(progressMessage)
              } else {
                process.stdout.write(`\r${progressMessage}`)
              }
            }
          }
        }
      },
      onMessage(message) {
        const isProgressMessage = message.indexOf('%') !== -1
        // Progress messages are already handled by onProgress
        if (!isProgressMessage) {
          // const messageWithoutNewLine = message.replace(/\n$/, '')
          // console.info(messageWithoutNewLine)
        }
      },
    })

    if (timer) timeTaken = (Date.now() - timer) / 1000

    expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(
      true,
      `'gitdir/objects' exists`
    )
    expect(await fs.exists(`${gitdir}/refs/heads/${branchName}`)).toBe(
      true,
      `'gitdir/refs/heads/${branchName}' exists`
    )
    expect(await fs.exists(`${dir}/now.config.json`)).toBe(
      true,
      `'now.config.json' exists`
    )
    return timeTaken
  } finally {
    // Clean up filesystem resources
    if (fs && fs._fs && fs._fs.__deactivate) {
      try {
        await fs._fs.__deactivate()
      } catch (err) {
        console.warn('Error cleaning up filesystem:', err)
      }
    }
  }
}
