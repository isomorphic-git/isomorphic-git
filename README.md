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

## CLI

I realized I could "translate" command line options into JavaScript chained commands
without hard-coding any knowledge of the API if I kept the chained commands very predictable.
I built a purely a generic translator and it worked surprisingly well.
So you can do *any* current or future isomorphic-git commands using the included `isogit` CLI.
It always starts with an implicit `git('.')` so it defaults to working in the
current working directory. (Note I may change that soon, now that I have a `findRoot`
function. I may change the default to `git(git().findRoot(process.cwd()))`.)

## API docs

I may continue to make small changes to the API until the 1.0 release, after which I promise not to make any breaking changes.

### Initialize a new repository

```js
// Fluent API example
import git from 'isomorphic-git'
git('.').init()
```

```sh
# CLI example
isogit init
```

```js
// Complete JS API
import { init } from 'isomorphic-git/commands'
init({
  gitdir
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .init()
```

- @param {string} `gitdir` - The path to the git directory.
- @returns `Promise<void>`

### Clone a repository

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .depth(1)
  .clone('https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git')
```

```sh
# CLI example
isogit --depth=1 clone https://github.com/wmhilton/isomorphic-git
```

```js
// Complete JS API
import { clone } from 'isomorphic-git/commands'
clone({
  workdir,
  gitdir,
  depth,
  ref,
  authUsername,
  authPassword,
  remote,
  url
})
// Fluent equivalent
git()
  .workdir(workdir)
  .gitdir(gitdir)
  .depth(depth)
  .branch(ref)
  .auth(authUsername, authPassword)
  .remote(remote)
  .clone(url)
```

- @param {string} `workdir` - The path to the working directory.
- @param {string} `gitdir` - The path to the git directory.
- @param {integer} [`depth=0`] - Determines how much of the git repository's history to retrieve. If not specified it defaults to 0 which means the entire repo history.
- @param {string} [`ref=undefined`] - Which branch to clone. By default this is the designated "main branch" of the repository.
- @param {string} [`authUsername=undefined`] - The username to use with Basic Auth
- @param {string} [`authPassword=undefined`] - The password to use with Basic Auth
- @param {string} [`remote='origin'`] - What to name the remote that is created. The default is 'origin'.
- @param {string} `url` - The URL of the remote repository.
- @returns `Promise<void>`

### Fetch commits

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .remote('origin')
  .depth(1)
  .fetch('master')
```

```sh
# CLI example
isogit --remote=origin --depth=1 fetch master
```

```js
// Complete JS API
import { fetch } from 'isomorphic-git/commands'
fetch({
  gitdir,
  depth,
  ref,
  authUsername,
  authPassword,
  remote,
  url
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .depth(depth)
  .auth(authUsername, authPassword)
  .url(url)
  .fetch(ref)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {integer} [`depth=0`] - Determines how much of the git repository's history to retrieve. If not specified it defaults to 0 which means the entire repo history.
- @param {string} [`ref=undefined`] - Which branch to fetch from. By default this is the currently checked out branch.
- @param {string} [`authUsername=undefined`] - The username to use with Basic Auth
- @param {string} [`authPassword=undefined`] - The password to use with Basic Auth
- @param {string} [`url=undefined`] - The URL of the remote git server. The default is the value set in the git config for that remote.
- @param {string} [`remote='origin'`] - If URL is not specified, determines which remote to use.
- @returns `Promise<void>`

## Checkout a branch

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .checkout('master')
```

```sh
# CLI example
isogit checkout master
```

```js
// Complete JS API
import { checkout } from 'isomorphic-git/commands'
checkout({
  workdir,
  gitdir,
  ref,
  remote
})
// Fluent equivalent
git()
  .workdir(workdir)
  .gitdir(gitdir)
  .remote(remote)
  .checkout(ref)
```

- @param {string} `workdir` - The path to the working directory.
- @param {string} `gitdir` - The path to the git directory.
- @param {string} [`ref=undefined`] - Which branch to clone. By default this is the designated "main branch" of the repository.
- @param {string} [`remote='origin'`] - What to name the remote that is created. The default is 'origin'.
- @returns `Promise<void>`

### List all the tracked files in a repo

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .list()
```

```sh
# CLI example
isogit list
```

```js
// Complete JS API
import { list } from 'isomorphic-git/commands'
list({
  gitdir
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .list()
```

- @param {string} `gitdir` - The path to the git directory.
- @returns `Promise<string[]>` - A list of file paths.

### Add files to the git index (aka staging area)

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .add('README.md')
```

```sh
# CLI example
isogit add README.md
```

```js
// Complete JS API
import { add } from 'isomorphic-git/commands'
add({
  workdir,
  gitdir,
  filepath
})
// Fluent equivalent
git()
  .workdir(workdir)
  .gitdir(gitdir)
  .add(filepath)
```

- @param {string} `workdir` - The path to the working directory.
- @param {string} `gitdir` - The path to the git directory.
- @param {string} `filepath` - The path to the file to add to the index.
- @returns `Promise<void>`

### Remove files from the git index (aka staging area)

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .remove('README.md')
```

```sh
# CLI example
isogit remove README.md
```

```js
// Complete JS API
import { remove } from 'isomorphic-git/commands'
remove({
  gitdir,
  filepath
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .remove(filepath)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {string} `filepath` - The path to the file to add to the index.
- @returns `Promise<void>`

### Create a new commit

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .author('Mr. Test')
  .email('mrtest@example.com')
  .signingKey('-----BEGIN PGP PRIVATE KEY BLOCK-----...')
  .commit('Added the a.txt file')
```

```sh
# CLI example
isogit --author='Mr. Test' \
       --email=mrtest@example.com \
       --signingKey="$(cat private.key)" \
       commit 'Added the a.txt file'
```

```js
// Complete JS API
import { commit } from 'isomorphic-git/commands'
commit({
  gitdir,
  author: {
    name,
    email,
    timestamp,
    date
  },
  committer: {
    name,
    email,
    timestamp,
    date
  },
  message,
  privateKeys
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .author(author.name)
  .email(author.email)
  .timestamp(author.timestamp)
  .datetime(author.date)
  .signingKey(privateKeys)
  .commit(message)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {Object} `author` - The details about the commit author.
- @param {string} [`author.name=undefined`] - Default is `user.name` config.
- @param {string} [`author.email=undefined`] - Default is `user.email` config.
- @param {Date} [`author.date=new Date()`] - Set the author timestamp field. Default is the current date.
- @param {integer} [`author.timestamp=undefined`] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
- @param {Object} [`committer=author`] - The details about the commit author. If not specified, the author details are used.
- @param {string} `message` - The commit message to use.
- @param {string} [`privateKeys=undefined`] - A PGP private key in ASCII armor format.
- @returns `Promise<void>`

### Push a branch

```js
// Fluent API example
import git from 'isomorphic-git'
git('.')
  .auth(process.env.GITHUB_TOKEN)
  .remote('origin')
  .push('master')
```

```sh
# CLI example
isogit --auth="$GITHUB_TOKEN" --remote=origin push master
```

```js
// Complete JS API
import { push } from 'isomorphic-git/commands'
push({
  gitdir,
  depth,
  ref,
  remote,
  url,
  authUsername,
  authPassword,
  remote
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .depth(depth)
  .remote(remote)
  .url(url)
  .auth(authUsername, authPassword)
  .push(ref)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {integer} [`depth=0`] - Determines how much of the git repository's history to retrieve. If not specified it defaults to 0 which means the entire repo history.
- @param {string} [`ref=undefined`] - Which branch to push. By default this is the currently checked out branch of the repository.
- @param {string} [`authUsername=undefined`] - The username to use with Basic Auth
- @param {string} [`authPassword=undefined`] - The password to use with Basic Auth
- @param {string} [`url=undefined`] - The URL of the remote git server. The default is the value set in the git config for that remote.
- @param {string} [`remote='origin'`] - If URL is not specified, determines which remote to use.
- @returns `Promise<void>`

### Find the root git directory

```js
// Fluent API example
import git from 'isomorphic-git'
git()
  .findRoot('/path/to/some/gitrepo/path/to/some/file.txt')
// returns '/path/to/some/gitrepo'
```

```sh
# CLI example
isogit findRoot /path/to/some/gitrepo/path/to/some/file.txt
# prints /path/to/some/gitrepo
```

```js
// Complete JS API
import { findRoot } from 'isomorphic-git/commands'
findRoot(dir)
// Fluent equivalent
git()
  .findRoot(dir)
```

- @param {string} `dir` - Starting at directory {dir}, walk upwards until you find a directory that contains a '.git' directory.
- @returns `Promise<rootdir>` that directory, which is presumably the root directory of the git repository containing {dir}.

### List all local branches

```js
// Fluent API example
import git from 'isomorphic-git'
git('.').listBranches()
```

```sh
# CLI example
isogit listBranches
```

```js
// Complete JS API
import { listBranches } from 'isomorphic-git/commands'
listBranches({
  gitdir
})
// Fluent equivalent
git()
  .gitdir(gitdir)
  .listBranches()
```

- @param {string} `gitdir` - The path to the git directory.
- @returns `Promise<branches[]>` an array of branch names.

### Using git config

```js
// Save the author details to .git/config so you don't have to specify them each time.
git('.').setConfig('user.name', 'Mr. Test')
git('.').setConfig('user.email', 'mrtest@example.com')

// Manually add a remote
git('.')
  .setConfig('remote.origin.url', 'https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git')
```

### All authentication options

```js

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
```

### Using a non-standard working tree or git directory

```js
// Fluent API example
import git from 'isomorphic-git'
git()
  .gitdir('my-bare-repo')
  .workdir('/var/www/website')
```

```sh
# CLI example
isogit --gitdir=my-bare-repo --workdir=/var/www/website
```

- @param {string} `workdir` - The path to the working directory.

The working directory is where your files are checked out.
Usually this is the parent directory of ".git" but it doesn't have to be.

- @param {string} `gitdir` - The path to the git directory.

The git directory is where your git repository history is stored.
Usually this is a directory called ".git" inside your working directory.

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
if you only need a few and are willint to sacrifice the fluent API
in order to optimize your bundle size.

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
