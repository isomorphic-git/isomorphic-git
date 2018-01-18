# isomorphic-git [![current npm version](https://img.shields.io/npm/v/isomorphic-git.svg)](https://www.npmjs.com/package/isomorphic-git) ![required node version](https://img.shields.io/node/v/isomorphic-git.svg) ![written in ECMAScript 2017+](https://img.shields.io/badge/ECMAScript-2017%2B-brightgreen.svg) ![license](https://img.shields.io/npm/l/isomorphic-git.svg)
[![Build Status](https://travis-ci.org/isomorphic-git/isomorphic-git.svg?branch=master)](https://travis-ci.org/isomorphic-git/isomorphic-git) [![codecov](https://codecov.io/gh/isomorphic-git/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/isomorphic-git/isomorphic-git) [![dependencies](https://david-dm.org/isomorphic-git/isomorphic-git/status.svg)](https://david-dm.org/isomorphic-git/isomorphic-git) [![Known Vulnerabilities](https://snyk.io/test/github/isomorphic-git/isomorphic-git/badge.svg)](https://snyk.io/test/github/isomorphic-git/isomorphic-git)
[![Greenkeeper badge](https://badges.greenkeeper.io/isomorphic-git/isomorphic-git.svg)](https://greenkeeper.io/) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![Gitter chat](https://badges.gitter.im/isomorphic-git.png)](https://gitter.im/isomorphic-git/Lobby)

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
- [Supported Git commands](#supported-git-commands)
- [Internal code architecture](#internal-code-architecture)
- [Who is using isomorphic-git?](#who-is-using-isomorphic-git)
- [Similar projects](#similar-projects)
- [Acknowledgments](#acknowledgments)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<hr>

## Getting Started

The "isomorphic" in `isomorphic-git` means it works equally well on the server or the browser.
That's tricky to do since git uses the file system, and browsers don't have an 'fs' module.
So rather than relying on the 'fs' module, `isomorphic-git` is BYOFS (Bring Your Own File System).
When creating a new Git object, you pass it the fs module to use.

If you're only using `isomorphic-git` in Node, you can just use the native `fs` module.

```js
const git = require('isomorphic-git');
const fs = require('fs');
git.listFiles({fs, dir: __dirname});
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
  git.listFiles({fs: window.fs, dir: '/'});
});
</script>
```

Besides IndexedDB, BrowserFS supports many different backends with different performance characteristics, as well as advanced configurations such as: multiple mounting points, and overlaying a writeable filesystems on top of a read-only filesystem. You don't need to know about all these features, but familiarizing yourself with the different options may be necessary if you hit a storage limit or performance bottleneck in the IndexedDB backend I suggested above.

### CORS support

Unfortunately, due to the same-origin policy by default `isomorphic-git` can only clone from the same origin as the webpage it is running on. This is terribly inconvenient, as it means for all practical purposes cloning and pushing repos must be done through a [proxy](https://cors-buster-jfpactjnem.now.sh/). However, I am "being the change you want to see in the world" by making PRs to all the major git repository hosting services.

- Gogs: [repo/http: add CORS headers to allow clone/push from browser agents #4970](https://github.com/gogits/gogs/pull/4970)
- Gitlab: [Add CORS headers to git clone and git push #219](https://gitlab.com/gitlab-org/gitlab-workhorse/merge_requests/219)
- Bitbucket: TODO
- Github: TODO

It is literally just two lines of code to add the CORS headers!! Easy stuff. Surely it will happen.

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

For more details about each build see [./dist/README.md](https://github.com/isomorphic-git/isomorphic-git/blob/master/dist/README.md)

### `isogit` CLI

Isomorphic-git comes with a simple CLI tool, named `isogit` because `isomorphic-git` is a lot to type. It is really just a thin shell that translates command line arguments into the equivalent JS API commands. So you should be able to run *any* current or future isomorphic-git commands using the CLI.

It always starts with an the assumption that the current working directory is a git root.
E.g. `repo = new Git({fs, dir: '.'})`.

It uses `minimisted` to parse command line options.

TODO: Document this more. Also write some tests? IDK the CLI is more of a lark for testing really.

## Supported Git commands

I may continue to make changes to the API until the 1.0 release, after which I promise not to make any breaking changes.

### commands

- [add](https://isomorphic-git.github.io/docs/add.html)
- [checkout](https://isomorphic-git.github.io/docs/checkout.html)
- [clone](https://isomorphic-git.github.io/docs/clone.html)
- [commit](https://isomorphic-git.github.io/docs/commit.html)
- [config](https://isomorphic-git.github.io/docs/config.html)
- [fetch](https://isomorphic-git.github.io/docs/fetch.html)
- [findRoot](https://isomorphic-git.github.io/docs/findRoot.html)
- [init](https://isomorphic-git.github.io/docs/init.html)
- [listBranches](https://isomorphic-git.github.io/docs/listBranches.html)
- [listFiles](https://isomorphic-git.github.io/docs/listFiles.html)
- [listTags](https://isomorphic-git.github.io/docs/listTags.html)
- [log](https://isomorphic-git.github.io/docs/log.html)
- [push](https://isomorphic-git.github.io/docs/push.html)
- [remove](https://isomorphic-git.github.io/docs/remove.html)
- [resolveRef](https://isomorphic-git.github.io/docs/resolveRef.html)
- [sign](https://isomorphic-git.github.io/docs/sign.html)
- [status](https://isomorphic-git.github.io/docs/status.html)
- [verify](https://isomorphic-git.github.io/docs/verify.html)
- [version](https://isomorphic-git.github.io/docs/version.html)

### utils

- [auth](https://isomorphic-git.github.io/docs/utils_auth.html)
- [oauth2](https://isomorphic-git.github.io/docs/utils_oauth2.html)

## Internal code architecture

I have written this library as a series of layers that build upon one another and should tree-shake very well:

### Commands

Each command is available as its own file, so you are able to import individual commands
if you only need a few in order to optimize your bundle size.

### Managers

Managers are a level above models. They take care of implementation performance details like

- batching reads to and from the file system
- in-process concurrency locks
- lockfiles
- caching files and invalidating cached results
- reusing objects
- object memory pools

### Models and Utils

Models and utils are the lowest level building blocks.
Models generally have very few or no dependencies except for `'buffer'`.
This makes them portable to many different environments so they can be a useful lowest common denominator.

Utils are basically miscellaneous functions.
Some are convenience wrappers for common filesystem operations.

## Who is using isomorphic-git?

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
