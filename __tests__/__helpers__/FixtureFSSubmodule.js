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

import { clone } from 'isomorphic-git'
import http from 'isomorphic-git/http'

import { join } from '../../src/utils/join.js'

import { makeFixture } from './FixtureFS.js'

const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

export async function makeFixtureAsSubmodule(fixture) {
  // Create fixture for submodule (sm). Its filesystem is the one both fixtures
  // share below.
  const { fs, dir: dirsm, gitdir: gitdirsm } = await makeFixture(fixture)

  // Create fixture for superproject (sp). In Node each fixture is an independent
  // temp dir on the shared disk, so makeFixture() is fine. In the browser
  // makeFixture() gives a brand-new in-memory fs, which would discard the
  // submodule fixture — so create the superproject as another directory in the
  // SAME fs instead (the two fixtures must live together for the _cp calls below).
  let fssp = fs
  let dirsp
  // mkdir that tolerates the directory already existing (the browser fs and its
  // async clone can leave a dir in place across the suite; a hard EEXIST here
  // makes the whole test flaky).
  const ensureDir = async path => {
    try {
      await fssp._mkdir(path)
    } catch (err) {
      if (!err || err.code !== 'EEXIST') throw err
    }
  }
  if (process.browser) {
    dirsp = `/superproject-${fixture}`
    await ensureDir(dirsp)
  } else {
    const sp = await makeFixture(`superproject-${fixture}`)
    fssp = sp.fs
    dirsp = sp.dir
  }

  // The superproject gitdir ought to be a .git subfolder,
  // and not a distant tmp folder:
  const gitdirsp = join(dirsp, '.git')

  await clone({
    fs: fssp,
    http,
    dir: dirsp,
    gitdir: gitdirsp,
    url: `http://${localhost}:8888/test-submodules.git`,
  })

  // Move the submodule's gitdir into place
  await ensureDir(join(gitdirsp, 'modules'))
  const gitdirsmfullpath = join(gitdirsp, 'modules', 'mysubmodule')
  await fssp._cp(gitdirsm, gitdirsmfullpath, {
    recursive: true,
    verbatimSymlinks: true,
  })

  // Pre-create the reflog directory in the submodule gitdir. Writing a reflog
  // (stash/branch/checkout) does `fs.write(gitdir/logs/refs/…)`, whose recursive
  // mkdir can race under the browser fs and surface as an unhandled
  // `ENOENT: mkdir '…/logs/refs'`. The fixture gitdirs ship without `logs/`, so
  // create it up front.
  await ensureDir(join(gitdirsmfullpath, 'logs'))
  await ensureDir(join(gitdirsmfullpath, 'logs', 'refs'))

  // Move the submodule's main dir into place
  const officialSubmoduleDir = join(dirsp, 'mysubmodule')
  await fssp._cp(dirsm, officialSubmoduleDir, {
    recursive: true,
    verbatimSymlinks: true,
  })

  // Write a ".git" file into the submodule
  const submoduleGitFile = join(officialSubmoduleDir, '.git')
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
