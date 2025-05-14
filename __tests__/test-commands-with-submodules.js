/* eslint-env node, browser, jasmine */

import * as path from 'path'

import http from 'isomorphic-git/http'

const {
  clone,
  currentBranch,
  resolveRef,
  listFiles,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

/**
 *
 * Inspired by an answer at
 * https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js?answertab=createdasc#tab-top
 *
 */
var copyRecursiveSync = async function(fs, src, dest) {
  console.log('src to copy:')
  console.log(src)
  console.log('dest to copy:')
  console.log(dest)
  var stats = await fs._stat(src)
  console.log('after stat of src:')
  var isDirectory = await stats.isDirectory()
  if (isDirectory) {
    await fs._mkdir(dest)
    const listofdirs = await fs._readdir(src)
    console.log('listofdirs:')
    console.log(listofdirs)
    console.log(typeof listofdirs)
    listofdirs.forEach(async childItemName => {
      copyRecursiveSync(
        fs,
        path.join(src, childItemName),
        path.join(dest, childItemName)
      )
    })
  } else {
    // fs.copyFileSync(fs, src, dest)
    const bufferx = await fs._readFile(src)
    console.log('bufferx:')
    console.log(bufferx)
    // await fs._writeFile(dest, await fs._readFile(src))
    await fs._writeFile(dest, bufferx)
  }
}

describe('submodule commands', () => {
  it('submodules are still staged after fresh clone', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    console.log('fs:')
    console.log(fs)
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // Test
    expect(await listFiles({ fs, gitdir })).toContain('test.empty')

    // copy the .git folder into an expected location which is dir/.git
    const mainGitDir = path.join(dir, '.git')
    await copyRecursiveSync(fs, gitdir, mainGitDir)

    // Write a ".git" file into the submodule
    const officialSubmoduleDir = path.join(dir, 'test.empty')
    const submoduleGitFile = path.join(officialSubmoduleDir, '.git')
    const submoduleGitFileContent = 'gitdir: ../.git/modules/test.empty\n'
    await fs._writeFile(submoduleGitFile, submoduleGitFileContent)

    // The submodule itself needs a git dir
    const {
      fs: submoduleFs,
      dir: submoduleDir,
      gitdir: submoduleGitdir,
    } = await makeFixture('test-currentBranch')
    await clone({
      fs: submoduleFs,
      http,
      dir: submoduleDir,
      gitdir: submoduleGitdir,
      url: `http://${localhost}:8888/test-currentBranch.git`,
    })

    // copy the submodules .git folder into an expected location which is dir/.git/modules/test.empty
    const submoduleMainGitdir = path.join(dir, '.git/modules/test.empty')
    await fs._mkdir(path.join(dir, '.git/modules'))
    await copyRecursiveSync(submoduleFs, submoduleGitdir, submoduleMainGitdir)

    // Test the 'currentBranch' command
    const branch = await currentBranch({
      fs,
      dir: officialSubmoduleDir,
      fullname: false,
    })
    // Test
    expect(branch).toEqual('master')

    // Test the 'resolveRef' command
    const ref = await resolveRef({
      fs,
      dir: officialSubmoduleDir,
      ref: 'HEAD',
    })
    // Test
    expect(ref).toEqual('033417ae18b174f078f2f44232cb7a374f4c60ce')
  })
})
