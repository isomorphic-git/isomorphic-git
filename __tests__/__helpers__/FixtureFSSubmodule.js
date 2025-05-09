/* eslint-env node, browser, jasmine */

// In cases where 'makeFixture' is used, create an alternative 'makeFixtureAsSubmodule'
// that will position the target repository as a submodule
// within a larger superproject and return variables pointing at the submodule
// so it can be tested.
//
// An ideal methodology might run 'git submodule' commands and create full-fledged
// correct submodules to test with.
//
// However isometric-git's __fixtures__ are incomplete and can't always be checked out.
// We want to test the same __fixtures__.
// Therefore, create faux submodules such that at least their .git folder is properly positioned.
// That's what discoverGitdir.js solves for. The way to run git
// commands inside a submodule is to be aware of the remote location of the .git folder.

import http from 'isomorphic-git/http'

const path = require('path')

const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

const { clone } = require('isomorphic-git')

const { makeFixture } = require('./FixtureFS.js')

var copyRecursiveSyncShell = async function(src, dest) {
  const { spawnSync } = require('child_process')
  const output = spawnSync('cp -rp ' + String(src) + ' ' + String(dest) + ' ', {
    shell: '/bin/bash',
  })
  console.log('copyRecursive:')
  console.log(`stderr: ${output.stderr.toString()}`)
  // console.log(`stdout: ${output.stdout.toString()}`)
}

export async function makeFixtureAsSubmodule(fixture) {
  // Create fixture for submodule (sm)
  const { dir: dirsm, gitdir: gitdirsm } = await makeFixture(fixture)
  // console.log('fssm:')
  // console.log(fssm)
  // console.log('dirsm:')
  // console.log(dirsm)
  // console.log('gitdirsm:')
  // console.log(gitdirsm)

  // Create fixture for superproject (sp)
  const { fs: fssp, dir: dirsp } = await makeFixture('superproject-' + fixture)

  // The superproject gitdir ought to be a .git subfolder,
  // and not a distant tmp folder:
  const gitdirsp = path.join(dirsp, '.git')

  await clone({
    fs: fssp,
    http,
    dir: dirsp,
    gitdir: gitdirsp,
    url: `http://${localhost}:8888/test-submodules.git`,
  })
  // console.log('fssp:')
  // console.log(fssp)
  // console.log('dirsp:')
  // console.log(dirsp)
  // console.log('gitdirsp:')
  // console.log(gitdirsp)

  // Move the submodule's gitdir into place
  await fssp._mkdir(path.join(gitdirsp, 'modules'))
  const gitdirsmfullpath = path.join(gitdirsp, 'modules', 'mysubmodule')
  // THE SYMLINK METHOD
  // await fssp._symlink(gitdirsm, path.join(gitdirsp, 'modules', 'mysubmodule'))
  // THE COPYRECURSIVESYNC METHOD
  // await copyRecursiveSync(fssp, gitdirsm, path.join(gitdirsp, 'modules', 'mysubmodule'))
  // THE SHELL METHOD
  await copyRecursiveSyncShell(gitdirsm, gitdirsmfullpath)

  // Move the submodule's main dir into place
  const officialSubmoduleDir = path.join(dirsp, 'mysubmodule')
  // THE SYMLINK METHOD
  // await fssp._symlink(dirsm, officialSubmoduleDir)
  // THE COPYRECURSIVESYNC METHOD
  // await copyRecursiveSync(fssp, dirsm, officialSubmoduleDir)
  // THE SHELL METHOD
  await copyRecursiveSyncShell(dirsm, officialSubmoduleDir)

  // Write a ".git" file into the submodule
  const submoduleGitFile = path.join(officialSubmoduleDir, '.git')
  const submoduleGitFileContent = 'gitdir: ../.git/modules/mysubmodule\n'
  await fssp._writeFile(submoduleGitFile, submoduleGitFileContent)

  // Notice that the returned values correspond to the submodule
  // and even include the 'tricky' submoduleGitFile which is just
  // a plain file named '.git'.
  // gitdirsmfullpath should only rarely be needed in tests.
  return {
    fs: fssp,
    dir: officialSubmoduleDir,
    gitdir: submoduleGitFile,
    gitdirsmfullpath,
  }
}
