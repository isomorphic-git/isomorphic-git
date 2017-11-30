# isomorphic-git ![node version](https://img.shields.io/node/v/isomorphic-git.svg) [![Build Status](https://travis-ci.org/wmhilton/isomorphic-git.svg?branch=master)](https://travis-ci.org/wmhilton/isomorphic-git) [![codecov](https://codecov.io/gh/wmhilton/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/wmhilton/isomorphic-git) [![dependencies](https://david-dm.org/wmhilton/isomorphic-git/status.svg)](https://david-dm.org/wmhilton/isomorphic-git) [![Known Vulnerabilities](https://snyk.io/test/github/wmhilton/isomorphic-git/badge.svg)](https://snyk.io/test/github/wmhilton/isomorphic-git)
A pure JavaScript implementation of git for node and browsers!

[![Sauce Test Status](https://saucelabs.com/browser-matrix/_wmhilton.svg)](https://saucelabs.com/u/_wmhilton)

`isomorphic-git` is a pure JavaScript implementation of git that works in node and browser environments (including WebWorkers and ServiceWorkers). This means it can be used to read and write to to git repositories, as well as fetch from and push to git remotes like Github.

Isomorphic-git aims for 100% interoperability with the canonical git implementation. This means it does all its operations by modifying files in a ".git" directory just like the git you are used to. The included `isogit` CLI can operate on git repositories on your desktop or server.

Unlike earlier git-in-js solutions that were hypermodular, `isomorphic-git` aims to be a complete solution with no assembly required.
The [high-level API](#high-level-git-api) is a [fluent](https://en.wikipedia.org/wiki/Fluent_interface) interface modeled after the git CLI and should feel natural to read and write.
However, one size does not always fit. That's why `isomorphic-git` also has a [layered API](#lower-level-api) that frees you to build a solution using only the exact features you need.

<hr>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Getting Started](#getting-started)
  - [Using as an npm module](#using-as-an-npm-module)
  - [`isogit` CLI](#isogit-cli)
- [High-level `git()` API](#high-level-git-api)
  - [git(dir) vs .gitdir(dir) and .workdir(dir)](#gitdir-vs-gitdirdir-and-workdirdir)
  - [.init()](#init)
  - [.clone(url)](#cloneurl)
  - [.fetch(branch)](#fetchbranch)
  - [.checkout(branch)](#checkoutbranch)
  - [.list()](#list)
  - [.log(ref)](#logref)
  - [.add(file)](#addfile)
  - [.remove(file)](#removefile)
  - [.status(file)](#statusfile)
  - [.commit(msg)](#commitmsg)
  - [.push(branch)](#pushbranch)
  - [.findRoot(dir)](#findrootdir)
  - [.listBranches()](#listbranches)
  - [.config(path)](#configpath)
  - [.config(path, value)](#configpath-value)
  - [.auth(username, password_or_token)](#authusername-password_or_token)
  - [.oauth2(company, token)](#oauth2company-token)
  - [.version()](#version)
- [Lower-level API](#lower-level-api)
  - [Commands](#commands)
  - [Managers](#managers)
  - [Models and Utils](#models-and-utils)
- [Who is using `isomorphic-git`?](#who-is-using-isomorphic-git)
- [Similar projects](#similar-projects)
- [Acknowledgments](#acknowledgments)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<hr>

## Getting Started

The "isomorphic" in `isomorphic-git` means it works equally well on the server or the browser.
That's tricky to do since git uses the file system, and browsers don't have an 'fs' module.
So rather than relying on the 'fs' module, `isomorphic-git` is BYOFS (Bring Your Own File System).
The `git.utils.setfs( fs )` line tells git what module to use for file system operations.

If you're only using `isomorphic-git` in Node, you can just use the native `fs` module.

```js
const { git } = require('isomorphic-git')
const fs = require('fs')
git.utils.setfs(fs)
```

If you're writing code for the browser though, you'll need something that emulates the `fs` API.
At the time of writing, the most complete option is [BrowserFS](https://github.com/jvilk/BrowserFS).
It has a few more steps involved to set up than in Node, as seen below:

```html
<script src="https://unpkg.com/browserfs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
BrowserFS.configure({ fs: "IndexedDB", options: {} }, function (err) {
  if (err) return console.log(err);
  window.fs = BrowserFS.BFSRequire("fs");
  git.utils.setfs(window.fs)
  // Now we have three global variables: `BrowserFS`, `fs`, and `git`.
});
</script>
```

Besides IndexedDB, BrowserFS supports many different backends with different performance characteristics, as well as advanced configurations such as: multiple mounting points, and overlaying a writeable filesystems on top of a read-only filesystem. You don't need to know about all these features, but familiarizing yourself with the different options may be necessary if you hit a storage limit or performance bottleneck in the IndexedDB backend I suggested above.

### Using as an npm module

You can install it from npm.

```
npm install --save isomorphic-git
```

In the package.json you'll see there are actually 4 different versions:

```json
  "main": "dist/for-node/",
  "browser": "dist/for-browserify/",
  "module": "dist/for-future/",
  "unpkg": "dist/bundle.umd.min.js",
```

This probably deserves a brief explanation.

- the "main" version is for node.
- the "browser" version is for browserify.
- the "module" version is for native ES6 module loaders when they arrive.
- the "unpkg" version is the UMD build.

For more details about each build see [./dist/README.md](https://github.com/wmhilton/isomorphic-git/blob/master/dist/README.md)

### `isogit` CLI

Isomorphic-git comes with a simple CLI tool, named `isogit` because `isomorphic-git` is a lot to type. It is really just a thin shell that translates command line arguments into the equivalent JS API commands. So you should be able to run *any* current or future isomorphic-git commands using the CLI.
It always starts with an implicit `git('.')` so it defaults to working in the
current working directory. (Note I may change that soon, now that I have a `findRoot`
function. I may change the default to `git(git().findRoot(process.cwd()))`.)

## High-level `git()` API

I may continue to make ~~small~~ changes to the API until the 1.0 release, after which I promise not to make any breaking changes.

**I HAVE DECIDED THAT FLUENT INTERFACE WAS A MISTAKE, AND WILL BE REPLACING IT WITH A SIMPLER API VERY SOON.**

### git(dir) vs .gitdir(dir) and .workdir(dir)
Setting the working directory and git directory

For regular repositories (with a `.git` directory inside them) you simply pass the directory as the initial argument to `git()`.
In this case, the git directory is set implicitly to `path.join(workdir, '.git')`.

However, if you are working with bare repositories, that assumption is wrong. In this case, you can use the second version to specify the directories explicitly.

```js
// JS example
import git from 'isomorphic-git'
git('./path/to/repo')
// second way
git()
  .gitdir('my-bare-repo')
  .workdir('/var/www/website')
```

```sh
# CLI example
cd ./path/to/repo
isogit
# second way
isogit --gitdir=my-bare-repo --workdir=/var/www/website
```

```js
// Complete API
git(workdir)
// second way
git()
  .gitdir(gitdir)
  .workdir(workdir)
```

- @param {string} `workdir` - The path to the working directory.

The working directory is where your files are checked out.
Usually this is the parent directory of ".git" but it doesn't have to be.

- @param {string} `gitdir` - The path to the git directory.

The git directory is where your git repository history is stored.
Usually this is a directory called ".git" inside your working directory.

### .init()
Initialize a new repository

```js
// JS example
import git from 'isomorphic-git'
git('.').init()
```

```sh
# CLI example
isogit init
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .init()
```

- @param {string} `gitdir` - The path to the git directory.
- @returns `Promise<void>`

### .clone(url)
Clone a repository

```js
// JS example
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
// Complete API
git()
  .workdir(workdir)
  .gitdir(gitdir)
  .branch(ref)
  .auth(authUsername, authPassword)
  .remote(remote)
  .depth(depth)
  .since(since)
  .exclude(exclude)
  .relative(relative)
  .onprogress(progressHandler)
  .clone(url)
```

- @param {string} `workdir` - The path to the working directory.
- @param {string} `gitdir` - The path to the git directory.
- @param {string} [`ref=undefined`] - Which branch to clone. By default this is the designated "main branch" of the repository.
- @param {string} [`authUsername=undefined`] - The username to use with Basic Auth
- @param {string} [`authPassword=undefined`] - The password to use with Basic Auth
- @param {string} [`remote='origin'`] - What to name the remote that is created. The default is 'origin'.
- @param {string} `url` - The URL of the remote repository.
- @param {integer} [`depth=undefined`] - Determines how much of the git repository's history to retrieve.
- @param {Date} [`since=undefined`] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
- @param {string[]} [`exclude=[]`] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
- @param {boolean} [`relative=false`] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
- @param {Function} [`progressHandler=undefined`] - Callback to receive [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent)s for the operation.
- @returns `Promise<void>`

### .fetch(branch)
Fetch commits

```js
// JS example
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
// Complete API
git()
  .gitdir(gitdir)
  .auth(authUsername, authPassword)
  .url(url)
  .remote(remote)
  .depth(depth)
  .since(since)
  .exclude(exclude)
  .relative(relative)
  .onprogress(progressHandler)
  .fetch(ref)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {string} [`ref=undefined`] - Which branch to fetch from. By default this is the currently checked out branch.
- @param {string} [`authUsername=undefined`] - The username to use with Basic Auth
- @param {string} [`authPassword=undefined`] - The password to use with Basic Auth
- @param {string} [`url=undefined`] - The URL of the remote git server. The default is the value set in the git config for that remote.
- @param {string} [`remote='origin'`] - If URL is not specified, determines which remote to use.
- @param {integer} [`depth=undefined`] - Determines how much of the git repository's history to retrieve.
- @param {Date} [`since=undefined`] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
- @param {string[]} [`exclude=[]`] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
- @param {boolean} [`relative=false`] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
- @param {Function} [`progressHandler=undefined`] - Callback to receive [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent)s for the operation.
- @returns `Promise<void>`

### .checkout(branch)
Checkout a branch

```js
// JS example
import git from 'isomorphic-git'
git('.')
  .checkout('master')
```

```sh
# CLI example
isogit checkout master
```

```js
// Complete API
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

### .list()
List all the tracked files in a repo

```js
// JS example
import git from 'isomorphic-git'
git('.')
  .list()
```

```sh
# CLI example
isogit list
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .list()
```

- @param {string} `gitdir` - The path to the git directory.
- @returns `Promise<string[]>` - A list of file paths.

### .log(ref)
Get commit descriptions from the git history

```js
// JS example
import git from 'isomorphic-git'
let commits = await git('.')
  .depth(5)
  .log('master')
commits.map(c => console.log(JSON.stringify(c))
```

```sh
# CLI example
isogit --depth=5 log master
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .depth(depth)
  .since(since)
  .log(ref)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {integer} [`depth=undefined`] - Return at most this many commits.
- @param {Date} [`since=undefined`] - Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
- @param {string} [`ref=HEAD`] - The commit to begin walking backwards through the history from.
- @returns `Promise<CommitDescription[]>`

```js
type CommitDescription = {
  oid: string,             // SHA1 oid of this commit
  message: string,         // Commit message
  tree: string,            // SHA1 oid or corresponding file tree
  parent: string[],        // array of zero or more SHA1 oids
  author: {
    name: string,
    email: string,
    timestamp: number,     // UTC Unix timestamp in seconds
    timezoneOffset: number // Timezone difference from UTC in minutes
  },
  committer: {
    name: string,
    email: string,
    timestamp: number,     // UTC Unix timestamp in seconds
    timezoneOffset: number // Timezone difference from UTC in minutes
  },
  gpgsig: ?string          // PGP signature (if present)
}
```

### .add(file)
Add files to the git index (aka staging area)

```js
// JS example
import git from 'isomorphic-git'
git('.')
  .add('README.md')
```

```sh
# CLI example
isogit add README.md
```

```js
// Complete API
git()
  .workdir(workdir)
  .gitdir(gitdir)
  .add(filepath)
```

- @param {string} `workdir` - The path to the working directory.
- @param {string} `gitdir` - The path to the git directory.
- @param {string} `filepath` - The path to the file to add to the index.
- @returns `Promise<void>`

### .remove(file)
Remove files from the git index (aka staging area)

```js
// JS example
import git from 'isomorphic-git'
git('.')
  .remove('README.md')
```

```sh
# CLI example
isogit remove README.md
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .remove(filepath)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {string} `filepath` - The path to the file to add to the index.
- @returns `Promise<void>`

### .status(file)
Tell whether a file has been changed

```js
// JS example
import git from 'isomorphic-git'
git('.')
  .status('README.md')
```

```sh
# CLI example
isogit status README.md
```

```js
// Complete API
git()
  .workdir(workdir)
  .gitdir(gitdir)
  .status(filepath)
```

- @param {string} `workdir` - The path to the working directory.
- @param {string} `gitdir` - The path to the git directory.
- @param {string} `filepath` - The path to the file to query.
- @returns `Promise<String>`

The possible return values are:

- `"ignored"` file ignored by a .gitignore rule
- `"unmodified"` file unchanged from HEAD commit
- `"*modified"` file has modifications, not yet staged
- `"*deleted"` file has been removed, but the removal is not yet staged
- `"*added"` file is untracked, not yet staged
- `"absent"` file not present in HEAD commit, staging area, or working dir
- `"modified"` file has modifications, staged
- `"deleted"` file has been removed, staged
- `"added"` previously untracked file, staged
- `"*unmodified"` working dir and HEAD commit match, but index differs
- `"*absent"` file not present in working dir or HEAD commit, but present in the index

### .commit(msg)
Create a new commit

```js
// JS example
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
// Complete API
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

### .push(branch)
Push a branch

```js
// JS example
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
// Complete API
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

### .findRoot(dir)
Find the root git directory

```js
// JS example
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
// Complete API
git()
  .findRoot(dir)
```

- @param {string} `dir` - Starting at directory {dir}, walk upwards until you find a directory that contains a '.git' directory.
- @returns `Promise<rootdir>` that directory, which is presumably the root directory of the git repository containing {dir}.

### .listBranches()
List all local branches

```js
// JS example
import git from 'isomorphic-git'
git('.').listBranches()
```

```sh
# CLI example
isogit listBranches
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .listBranches()
```

- @param {string} `gitdir` - The path to the git directory.
- @returns `Promise<branches[]>` an array of branch names.

### .config(path)
Reading from git config

```js
// JS example
import git from 'isomorphic-git'
git('.').config('user.name')
// 'Mr. Test'
```

```sh
# CLI example
isogit config user.name
# Mr. Test
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .config(path)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {string} `path` - The key of the git config entry.
- @returns `Promise<value>` - the config value

### .config(path, value)
Writing to git config

```js
// JS example
import git from 'isomorphic-git'
git('.').config('user.name', 'Mr. Test')
```

```sh
# CLI example
isogit config user.name 'Mr. Test'
```

```js
// Complete API
git()
  .gitdir(gitdir)
  .config(path, value)
```

- @param {string} `gitdir` - The path to the git directory.
- @param {string} `path` - The key of the git config entry.
- @param {string} `value` - A value to store at that path.
- @returns `Promise<void>`

### .auth(username, password_or_token)
Authentication is normally required for pushing to a git repository.
It may also be required to clone or fetch from a private repository.
Git does all its authentication using HTTPS Basic Authentication.
Usually this is straightforward, but there are some things to watch out for.

If you have two-factor authentication (2FA) enabled on your account, you
probably cannot push or pull using your regular username and password.
Instead, you may have to create a Personal Access Token (or an App
Password in Bitbucket lingo) and use that to authenticate.

```js
// This works for basic username / password auth, or the newer username / token auth
// that is often required if 2FA is enabled.
git('.').auth('username', 'password')

// a one-argument version is also supported
git('.').auth('username:password')

// Personal Access Token Authentication
// (note Bitbucket calls theirs App Passwords instead for some reason)
git('.').auth('username', 'personal access token')
git('.').auth('username', 'app password')
git('.').auth('personal access token') // Github (only) lets you leave out the username
```

### .oauth2(company, token)
If you are using OAuth2 for token-based authentication, then the form
that the Basic Auth headers take is slightly different. To help with
those cases, there is an `oauth2()` method that is available as an
alternative to the `auth()` method.

```js
// OAuth2 Token Authentication
// This for is for *actual* OAuth2 tokens (not "personal access tokens").
// Unfortunately, all the major git hosting companies have chosen different conventions!
// Lucky for you, I already looked up and codified it for you.
//
// - oauth2('github', token) - Github uses `token` as the username, and 'x-oauth-basic' as the password.
// - oauth2('bitbucket', token) - Bitbucket uses 'x-token-auth' as the username, and `token` as the password.
// - oauth2('gitlab', token) - Gitlab uses 'oauth2' as the username, and `token` as the password.
//
// I will gladly accept pull requests for more companies' conventions.
git('.').oauth2('github', 'token')
git('.').oauth2('gitlab', 'token')
git('.').oauth2('bitbucket', 'token')
```

### .version()

```js
// JS example
import git from 'isomorphic-git'
console.log(git().version())
```

- @returns {string} `version` - the version string  from package.json

## Lower-level API

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
import {
  add,
  clone,
  checkout,
  commit,
  fetch,
  init,
  list,
  listCommits,
  listObjects,
  log,
  pack,
  push,
  remove,
  resolveRef,
  config,
  unpack,
  verify,
  status,
  findRoot,
  listBranches,
  version
} from 'isomorphic-git/dist/for-node/commands'
```

Each command is available as its own file, so you are able to import individual commands
if you only need a few and are willing to sacrifice the fluent API
in order to optimize your bundle size.

### Managers

```
import {
  GitConfigManager,
  GitShallowManager,
  GitIndexManager,
  GitObjectManager,
  GitRefsManager,
  GitRemoteHTTP
} from 'isomorphic-git/dist/for-node/managers'
```

Managers are a level above models. They take care of implementation performance details like

- batching reads to and from the file system
- in-process concurrency locks
- lockfiles
- caching files and invalidating cached results
- reusing objects
- object memory pools

### Models and Utils

```
import {
  GitCommit,
  GitConfig,
  GitPktLine,
  GitIndex,
  GitTree
} from 'isomorphic-git/dist/for-node/models'
```

Models and utils are the lowest level building blocks.
Models generally have very few or no dependencies except for `'buffer'`.
This makes them portable to many different environments so they can be a useful lowest common denominator.
They do not rely on Utils.

```
import {
  rm,
  flatFileListToDirectoryStructure,
  default,
  lock,
  mkdirs,
  read,
  sleep,
  write,
  pkg
} from 'isomorphic-git/dist/for-node/utils'
```

Utils are basically miscellaneous functions.
Some are convenience wrappers for common filesystem operations.

## Who is using `isomorphic-git`?

- [nde](https://nde.now.sh) - a futuristic next-generation web IDE
- [git-app-manager](https://git-app-manager-tcibxepsta.now.sh) - install "unhosted" websites locally by git cloning them

## Similar projects

- [js-git](https://github.com/creationix/js-git)
- [es-git](https://github.com/es-git/es-git)

## Acknowledgments

Isomorphic-git would not have been possible without the pioneering work by
@creationix and @chrisdickinson. Git is a tricky binary mess, and without
their examples (and their modules!) I would not have been able to come even
close to finishing this. They are geniuses ahead of their time.

## License

This work is released under [The Unlicense](http://unlicense.org/)