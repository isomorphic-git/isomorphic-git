# isomorphic-git [![Build Status](https://travis-ci.org/wmhilton/isomorphic-git.svg?branch=master)](https://travis-ci.org/wmhilton/isomorphic-git) [![codecov](https://codecov.io/gh/wmhilton/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/wmhilton/isomorphic-git)
JavaScript library for interacting with git repositories, circa 2017

(Originally I was going to call it `esgit` but the name is too similar to another
project called [es-git](https://github.com/es-git/es-git).)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/_wmhilton.svg)](https://saucelabs.com/u/_wmhilton)

# Progress

Porcelain:

- [x] git clone
  - [x] git init
  - [x] git config
  - [x] git fetch (due to CORS, use https://cors-buster-jfpactjnem.now.sh/github.com instead of https://github.com)
    - [x] ref-deltas
    - [ ] ofs-deltas
  - [x] git checkout
- [x] git list (ls-files)
- [x] git add
- [x] git remove
- [ ] git status
  - [x] for an individual file
  - [ ] for directories
- [x] git commit
- [x] git push (due to CORS, use https://cors-buster-jfpactjnem.now.sh/github.com instead of https://github.com)
- [ ] git ignore
- [ ] git tag
- [ ] git merge
- [x] `esgit` CLI

Plumbing:

- [ ] read-tree
- [x] git listCommits (rev-list)
- [x] git pack (pack-objects)
- [ ] git list packed objects (verify-pack)
- [x] git unpack-objects

## High-level API (unstable)

This is analogous to the "porcelain" git commands.
There is a single function `git()` that serves as a fluent command builder.

Examples:

```js
import git from 'isomorphic-git'

// Clone a repository
// Tip: use depth(1) for smaller, faster downloads unless you need the full history.
git('.')
  .depth(1)
  .branch('master')
  .clone('https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git')

// Setup an new repository
git('.').init()

// Manually add a remote
git('.')
  .setConfig('remote.origin.url', 'https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git')

// Fetch the latest commit using a shallow clone
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
  .author('Mr. Test')
  .email('mrtest@example.com')
  .signingKey('-----BEGIN PGP PRIVATE KEY BLOCK-----...')
  .commit('Added the a.txt file')

// Push a branch back to Github
git('.')
  .auth(process.env.GITHUB_TOKEN)
  .remote('origin')
  .push('refs/heads/master')

// Basic Authentication - may not work if 2FA is enabled on your account!
git('.').auth('username', 'password')

// a one-argument version is also supported
git('.').auth('username:password')

// Personal Access Token Authentication
// (note Bitbucket calls theirs App Passwords instead for some reason)
git('.').auth('username', 'personal access token')
git('.').auth('username', 'app password')
git('.').auth('personal access token') // Github (only) lets you leave out the username

// OAuth2 Token Authentication
// (each of the major players formats OAuth2 headers slightly differently
// so you must pass the name of the company as the first argument)
git('.').oauth2('github', 'token')
git('.').oauth2('gitlab', 'token')
git('.').oauth2('bitbucket', 'token')

// Given a file path, find the nearest parent directory containing a .git folder
git().findRoot('/path/to/some/gitrepo/path/to/some/file.txt') // '/path/to/some/gitrepo'

// TODO: git.merge(), git.pull(), git.status(), git.diff(), git.tag(), git.branch(), etc

// And if you need to work with bare repos there are
// equivalents to the `--git-dir` and `--work-tree` options
git()
  .gitdir('my-bare-repo')
  .workdir('/var/www/website')
```

### CLI

I realized I could "translate" command line options into JavaScript chained commands
without hard-coding any knowledge of the API if I kept the chained commands very predictable.
I built a purely a generic translator and it worked surprisingly well.
So you can do *any* current or future isomorphic-git commands using the included `esgit` CLI.
It always starts with an implicit `git('.')` so it defaults to working in the
current working directory.

```
// Create a new empty repo
esgit --gitdir=test init

// Clone from a Github repository to the current working directory.
// Just like it's counterpart, clone is really just shorthand for git.init(); git.fetch(); git.checkout();
esgit clone https://github.com/wmhilton/isomorphic-git

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

## Lower-level API (also unstable)

The high-level makes some assumptions (like you have a file-system and network access) that might not be well suited
to your embedded git-based concept thingy. Fear not! I have written this library
as a series of layers that should tree-shake very well:

- index.js (~5kb uncompressed)
- commands.js (~19kb uncompressed)
- managers.js (~11kb uncompressed)
- models.js (~19kb uncompressed)
- utils.js (~11kb uncompressed)

### Commands

```
import * as managers from 'isomorphic-git/dist/for-node/commands'
```

Each command is available as its own file, so hopefully with
a bit of finagling you will be able to import individual commands
if you only need a few and can benefit from tree-shaking.

### Managers

```
import * as managers from 'isomorphic-git/dist/for-node/managers'
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
import * as models from 'isomorphic-git/dist/for-node/models'
```

Models are the lowest level building blocks.
They generally have very few or no dependencies except for `'buffer'`.
This makes them portable to many different environments so they can be a useful lowest common denominator.

### Utils

```
import * as utils from 'isomorphic-git/dist/for-node/utils'
```

I lied. Utils are actually the lowest level building blocks.
