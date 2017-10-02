# isomorphic-git [![Build Status](https://travis-ci.org/wmhilton/isomorphic-git.svg?branch=master)](https://travis-ci.org/wmhilton/isomorphic-git) [![codecov](https://codecov.io/gh/wmhilton/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/wmhilton/isomorphic-git)
JavaScript library for interacting with git repositories, circa 2017

(Originally I was going to call it `esgit` but the name is too similar to another
project called [es-git](https://github.com/es-git/es-git).)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/_wmhilton.svg)](https://saucelabs.com/u/_wmhilton)

# Progress

Porcelain:

- [x] git init
- [x] git checkout
  - [ ] update index correctly when checking out
- [x] git list (ls-files)
- [x] git add
- [x] git remove
- [ ] git status
- [x] git commit
- [x] git push (due to CORS, use https://github-cors.now.sh instead of https://github.com)
- [ ] git pull
  - [x] Negotiate packfile
  - [x] Download packfile
  - [x] Unpack packfile
  - [ ] Update refs and HEAD
- [ ] git diff
- [ ] git merge
- [x] `esgit` CLI

Plumbing:

- [ ] read-tree
- [x] git listCommits (rev-list)
- [x] git pack (pack-objects)
- [ ] git list packed objects (verify-pack)
- [x] git unpack-objects

Note: There appears to be no a way to *push* signed commits back to Github using their API (v3 or v4), so I think we will have to use smart HTTP, packfiles, and an anti-CORS proxy.

## High-level API (unstable)

This is analogous to the "porcelain" git commands. There is a single function `git()` that serves as a fluent command builder.

Examples:

```js
import git from 'isomorphic-git'

// Create a new empty repo
git('test').init()

// Manually add a remote (git clone should be doing this automatically but it doesn't (yet))
git('.')
  .setConfig('remote "origin".url', 'https://github.com/wmhilton/isomorphic-git')

// Fetch the latest version from a Github repository using a shallow clone
git('.')
  .remote('origin')
  .depth(1)
  .fetch('refs/heads/master')

// Checkout a commitish
git('.').checkout('master')

// List files in the index
git('.').list()

// Add files to the index
git('.').add('README.md')

// Remove files from the index
git('.').remove('.env')

// Create a new commit (there's actually several more options for date, committer)
git('.')
  .add('a.txt')
  .author('Mr. Test')
  .email('mrtest@example.com')
  .signingKey('-----BEGIN PGP PRIVATE KEY BLOCK-----...')
  .commit('Added the a.txt file')

// Push a branch back to Github
git('.')
  .githubToken(process.env.GITHUB_TOKEN)
  .remote('origin')
  .push('refs/heads/master')

// TODO: git.merge(), git.pull(), git.status(), git.diff(), git.tag(), git.branch(), etc

// And if you need to work with bare repos there are
// equivalents to the `--git-dir` and `--work-tree` options
git().gitdir('my-bare-repo').workdir('/var/www/website')
```

### CLI

I realized I could "translate" command line options into JavaScript chained commands
without hard-coding any knowledge of the API if I kept the chained commands very predictable.
I built a purely a generic translator and it worked surprisingly well.
So you can do *any* current or future esgit commands using the included `esgit` CLI.
It always starts with an implicit `git('.')` so it defaults to working in the
current working directory.

```
// Create a new empty repo
esgit --gitdir=test init

// Clone from a Github repository to the current working directory.
// Just like it's counterpart, clone is really just shorthand for git.init(); git.fetch(); git.checkout();
esgit --githubToken=$GITHUB_TOKEN clone https://github.com/wmhilton/esgit

// Checkout a commitish
esgit checkout master

// List files in the index
esgit list

// Add files to the index
esgit add README.md

// Remove files from the index
esgit remove .env

// Create a new commit (there's actually several more options for date, committer)
esgit add a.txt
esgit --author='Mr. Test' --email=mrtest@example.com --signingKey="$(cat private.key)" commit 'Added the a.txt file'

// And if you need to work with bare repos there are
// equivalents to the `--git-dir` and `--work-tree` options
esgit --gitdir=my-bare-repo --workdir=/var/www/website
```

## Low-level API (also unstable)

The high-level makes some assumptions (like you have a file-system and network access) that might not be well suited
to your embedded git-based concept thingy. Fear not! I am
purposefully building this library as a series of small modules
so you can pick and choose features as you need them.

### Commands

```
import * as managers from 'isomorphic-git/src/commands'
```

Each command is available as its own file, so hopefully with
a bit of finagling you will be able to import individual commands
if you only need a few and can benefit from tree-shaking.

### Managers

```
import * as managers from 'isomorphic-git/src/managers'
```

Managers are a level above models. They take care of implementation performance details like

- batching reads to and from the file system
- in-process concurrency locks
- lockfiles
- caching files and invalidating cached results
- reusing objects
- object memory pools

### Models

```
import * as models from 'isomorphic-git/src/models'
```

Models are the lowest level building blocks.
They generally have very few or no dependencies except for `'buffer'`.
This makes them portable to many different environments so they can be a useful lowest common denominator.

### Utils

```
import * as utils from 'isomorphic-git/src/utils'
```

I lied. Utils are actually the lowest level building blocks.
