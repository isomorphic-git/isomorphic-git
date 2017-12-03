# isomorphic-git ![node version](https://img.shields.io/node/v/isomorphic-git.svg) [![Build Status](https://travis-ci.org/wmhilton/isomorphic-git.svg?branch=master)](https://travis-ci.org/wmhilton/isomorphic-git) [![codecov](https://codecov.io/gh/wmhilton/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/wmhilton/isomorphic-git) [![dependencies](https://david-dm.org/wmhilton/isomorphic-git/status.svg)](https://david-dm.org/wmhilton/isomorphic-git) [![Known Vulnerabilities](https://snyk.io/test/github/wmhilton/isomorphic-git/badge.svg)](https://snyk.io/test/github/wmhilton/isomorphic-git)
A pure JavaScript implementation of git for node and browsers!

[![Sauce Test Status](https://saucelabs.com/browser-matrix/_wmhilton.svg)](https://saucelabs.com/u/_wmhilton)

`isomorphic-git` is a pure JavaScript implementation of git that works in node and browser environments (including WebWorkers and ServiceWorkers). This means it can be used to read and write to to git repositories, as well as fetch from and push to git remotes like Github.

Isomorphic-git aims for 100% interoperability with the canonical git implementation. This means it does all its operations by modifying files in a ".git" directory just like the git you are used to. The included `isogit` CLI can operate on git repositories on your desktop or server.

`isomorphic-git` aims to be a complete solution with no assembly required.
I've tried carefully to design the API so it is easy to use all the features, without paying a penalty in bundle size.
By providing functionality as separate functions instead of an object oriented API, code bundlers like Webpack will only include the functionality your application actually uses. (Or at least that's the goal.)

I am working on adding type definitions so you can enjoy static type-checking and intelligent code completion in editors like [CodeSandbox](https://codesandbox.io).

<hr>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Getting Started](#getting-started)
  - [Using as an npm module](#using-as-an-npm-module)
  - [`isogit` CLI](#isogit-cli)
- [API](#api)
  - [.log(ref)](#logref)
  - [.remove(file)](#removefile)
  - [.status(file)](#statusfile)
  - [.push(branch)](#pushbranch)
  - [.listBranches()](#listbranches)
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
const { Git } = require('isomorphic-git')
const fs = require('fs')
let repo = new Git({fs, dir: __dirname})
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
  var repo = new Git({fs: window.fs, dir: '/'})
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

## API

I may continue to make ~~small~~ changes to the API until the 1.0 release, after which I promise not to make any breaking changes.

**I HAVE DECIDED THAT FLUENT INTERFACE WAS A MISTAKE, AND WILL BE REPLACING IT WITH A SIMPLER API VERY SOON.**

**[NEW API DOC](https://wmhilton.github.io/isomorphic-git)**

Leftover crud below:

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