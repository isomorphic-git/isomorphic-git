# isomorphic-git [![Build Status](https://travis-ci.org/wmhilton/isomorphic-git.svg?branch=master)](https://travis-ci.org/wmhilton/isomorphic-git) [![codecov](https://codecov.io/gh/wmhilton/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/wmhilton/isomorphic-git)
JavaScript library for interacting with git repositories, circa 2017

[![Sauce Test Status](https://saucelabs.com/browser-matrix/_wmhilton.svg)](https://saucelabs.com/u/_wmhilton)

Isomorphic-git is a pure ECMAScript 2017+ re-implementation of [git](https://git-scm.com/)
that works on the desktop and on the web. On the desktop (or laptop, whatever) it
uses Node and its core "fs" library. On the web, it works with any modern browser
(see list above) and the [BrowserFS](https://www.npmjs.com/package/browserfs)
library. This means you can do all the same things you are used to doing on
your desktop - git pull, git commit, git push - in the browser.

**This is a big deal.** Git is the lingua fraca of source code control, and
the web is made out of source code. Client-side JavaScript can now be used to read
*and write* to the web the same way you've been editing websites on your desktop
since 2008 - using git.

Isomorphic-git does not impliment every feature found in the canonical git
implementation. But it does aim to be 100% compatible with it. This means it
does all its operations by modifying files in a ".git" directory just like the
git you are used to. You can use the `isogit` CLI to operate on existing git
repositories on your desktop or server.

## High-level API (unstable)

This is analogous to the "porcelain" git commands.
There is a single function `git()` that serves as a fluent command builder.
All of these commands return a Promise, so in practice you would `await` them.

Examples:

```js
import git from 'isomorphic-git'

// Clone a repository
// Tip: use depth(1) for smaller, faster downloads unless you need the full history.
git('.')
  .depth(1)
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
  .fetch('master')

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

// Save the author details to .git/config so you don't have to specify them each time.
git('.').setConfig('user.name', 'Mr. Test')
git('.').setConfig('user.email', 'mrtest@example.com')

// Push a branch back to Github
git('.')
  .auth(process.env.GITHUB_TOKEN)
  .remote('origin')
  .push('master')

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

// List local branches
git('.').listBranches()

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
So you can do *any* current or future isomorphic-git commands using the included `isogit` CLI.
It always starts with an implicit `git('.')` so it defaults to working in the
current working directory. (Note I may change that soon, now that I have a `findRoot`
function. I may change the default to `git(git().findRoot(process.cwd()))`.)

```bash
# Create a new empty repo
isogit init

# Clone from a Github repository to the current working directory.
# Just like it's counterpart, clone is really just shorthand for git.init(); git.fetch(); git.checkout();
isogit --depth=1 clone https://github.com/wmhilton/isomorphic-git

# Manually add a remote
isogit setConfig remote.origin.url https://github.com/wmhilton/isomorphic-git

# Fetch the latest commit using a shallow clone
isogit --remote=origin --depth=1 fetch master
  
# Checkout a commitish
isogit checkout master

# List files in the index
isogit list

# Add files to the index
isogit add README.md

# Remove files from the index
isogit remove .env

# Create a new commit (there's actually several more options for date, committer)
isogit add a.txt
isogit --author='Mr. Test' --email=mrtest@example.com --signingKey="$(cat private.key)" commit 'Added the a.txt file'

# Save the author details to .git/config so you don't have to specify them each time.
isogit setConfig user.name 'Mr. Test'
isogit setConfig user.email mrtest@example.com

# Push a branch back to Github
isogit --auth="$GITHUB_TOKEN" --remote=origin push master
  
# Basic Authentication - may not work if 2FA is enabled on your account!
isogit --auth='username:password'

# Personal Access Token Authentication
# (note Bitbucket calls theirs App Passwords instead for some reason)
isogit --auth="username:$TOKEN"

# OAuth2 Token Authentication
# (each of the major players formats OAuth2 headers slightly differently
# so you must pass the name of the company as the first argument)
# Also, the CLI version is a little wonky since this is the odd function
# I made that takes two arguments, boo hoo.
isogit --oauth2 github --oauth2 $TOKEN
isogit --oauth2 gitlab --oauth2 $TOKEN
isogit --oauth2 bitbucket --oauth2 $TOKEN

# Given a file path, find the nearest parent directory containing a .git folder
isogit findRoot /path/to/some/gitrepo/path/to/some/file.txt  # /path/to/some/gitrepo

# List local branches
isogit listBranches

# And if you need to work with bare repos there are
# equivalents to the `--git-dir` and `--work-tree` options
isogit --gitdir=my-bare-repo --workdir=/var/www/website
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

## Similar projects

- [js-git](https://github.com/creationix/js-git)
- [es-git](https://github.com/es-git/es-git)

## Credits

Isomorphic-git would not have been possible without the pioneering work by
@creationix and @chrisdickinson. Git is a tricky binary mess, and without
their examples (and their modules!) I would not have been able to come even
close to finishing this. They are geniuses ahead of their time.

