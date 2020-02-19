<p align="center">
  <img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/isomorphic-git-logo.svg?sanitize=true" alt="" height="150"/>
</p>

# isomorphic-git

`isomorphic-git` is a pure JavaScript reimplementation of git that works in both Node.js and browser JavaScript environments. It can read and write to git repositories, fetch from and push to git remotes (such as GitHub), all without any native C++ module dependencies.

## Goals

Isomorphic-git aims for 100% interoperability with the canonical git implementation. This means it does all its operations by modifying files in a ".git" directory just like the git you are used to. The included `isogit` CLI can operate on git repositories on your desktop or server.

This library aims to be a complete solution with no assembly required.
The API has been designed with modern tools like Rollup and Webpack in mind.
By providing functionality as individual functions, code bundlers can produce smaller bundles by including only the functions your application uses.

The project includes type definitions so you can enjoy static type-checking and intelligent code completion in editors like VS Code and [CodeSandbox](https://codesandbox.io).

## Supported Environments

The following environments are tested in CI and will continue to be supported until the next breaking version:

<table width="100%">
<tr>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/node.webp" alt="" width="64" height="64"><br> Node 10</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/chrome/chrome.svg?sanitize=true" alt="" width="64" height="64"><br> Chrome 79</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/edge/edge.svg?sanitize=true" alt="" width="64" height="64"><br> Edge 79</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/firefox/firefox.svg?sanitize=true" alt="" width="64" height="64"><br> Firefox 72</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/safari/safari_64x64.png" alt="" width="64" height="64"><br> Safari 13</td>
<td align="center"><img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Android_logo_2019.svg" alt="" width="64" height="64"><br> Android 10</td>
<td align="center"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/IOS_13_logo.svg" alt="" width="64" height="64"><br> iOS 13</td>
</tr>
</table>

## 1.0 Breaking Changes

TODO:
- [ ] Rename `dist/http.js` to `dist/http-web.js` and `dist/http-web.cjs`, rename `dist/http.cjs` to `dist/http-node.js` and `dist/http-node.cjs`
- [ ] Rename `bundle.umd.min.js` to `index.umd.min.js`?
- [ ] Strongly consider lifting stuff out of `dist` so it's less to type. e.g. `import http from 'isomorphic-git/http-web'`

### Big changes
- [x] The supported node & browser versions have been bumped. (See beautiful table above.)
- [x] The plugin system has been eliminated and we're back to plain old dependency injection via function arguments! The plugin cores created a mysterious "global state" that makes it easy to trip up (I myself sometimes forgot to unset plugins after running tests). The old style of passing `fs` as a function argument was less aesthetic and more verbose, but it is a much simpler model than the plugin core model, and much safer because it makes it impossible for dependencies to accidentally share the default plugin core.
- [x] There is an additional setup step to choose which `http` client to use, and functions that make HTTP requests have a new required `http` parameter. Previously I used a mix of bundler and runtime magic to try and pick between a build that used `fetch` and one that used `require('http')` but that didn't always work. For instance, if you were bundling a Node application using Webpack, it would pick the wrong build [(#938)](https://github.com/isomorphic-git/isomorphic-git/issues/938). Another example: in an Electron renderer thread, _both_ options could work (if the window is launched with `nodeIntegration: true`) but in a Web Worker thread only the fetch option should work (_unless_ you have `nodeIntegrationInWorker: true` set). See "Getting Started" below to see the extra line of code you need.

### Some functions have been renamed or removed:
  - [x] The `walkBeta2` function was renamed to `walk`.
  - [x] The `walkBeta1` function was removed.
  - [x] The `fastCheckout` function has been renamed `checkout` and the old `checkout` has been removed.
  - [x] The (previously deprecated) `sign` function was removed.
  - [x] The (previously deprecated) `utils.auth` function was removed.
  - [x] The (previously deprecated) `utils.oauth2` was removed.
  - [x] The `config` function has been removed and replaced by `getConfig`, `getConfigAll`, and `setConfig`.
  - [x] The `verify` function has been removed, but `log`, `readCommit`, and `readTag` all return the `gpgsig` and signing `payload` now. This actually makes verification simpler and more efficient, because it can be done in batch on `git.log` output and the `gpgsig` itself can be parsed and used to lookup the public key. See [onSign](https://isomorphic-git.org/docs/en/onSign) for complete code examples.

### Some function parameters have been removed or replaced:
  - [x] The undocumented parameter aliases `authUsername` and `authPassword` were removed.
  - [x] The `emitter` parameter was removed and replaced with the `onMessage` and `onProgress` callbacks. (Note that `onMessage` emits un-trimmed strings, so you get those `\r`s.)
  - [x] The `username`, `password`, `token`, and `oauth2format` parameters were removed and replaced with the `onAuth` callback.
  - [x] The `fast` parameter of `pull` was removed, since there is no "slow" implementation anymore.
  - [x] The `signing` parameter of `log` was removed, since `log` will always return a payload.
  - [x] The `pattern` parameter was removed from `statusMatrix` and replaced with a new `filter` function. (This is so we can drop the dependencies on `globalyzer` and `globrex`.)
  - [x] The `newSubmoduleBehavior` parameter was removed and is now the default and only behavior, because it makes much more sense to have non-destructive defaults!
  - [x] The `noSubmodules` parameter was removed because with the new submodule behavior it is no longer necessary to print console warnings about how submodules aren't supported. (When submodule support IS added to isomorphic-git, it will be opt-in using `recurseSubmodules: true` or something like that.)
  - [x] The `autoTranslateSSH` feature was removed, since it is trivial to implement your own version using just the `UnknownTransportError.data.suggestion`
  - [x] The `writeObject` function when used to write a tree now expects a plain array rather than an object with a property called `entries` which is the array. (This is so that argument to `writeObject` has the same shame as the arguments to `writeBlob`/`writeCommit`/`writeTag`/`writeTree`.)
  - [x] The `noOverwrite` parameter was removed from `init` and is the new behavior.
  - [x] The `author.date`, `committer.date`, `tagger.date` parameters were removed in favor of `author.timestamp`, `comitter.timestamp`, `tagger.timestamp` in order to be clear about what is actually written and better reflect the return types in `readCommit`, `log`, and `readTag`.

### The return types of some functions have changed:
  - [x] Functions that used to return `Buffer` objects now return `Uint8Array` objects. (This is so we can eventually remove all internal dependencies on the Buffer browser polyfill, which is quite heavy!)
  - [x] The `log` function now returns an array of the same kind of objects that `readCommit` returns. (This change simplifies the type signature of `log` so we don't need function overloading; that function overloading was the one thing preventing me from auto-generating `index.d.ts`.)
  - [x] The `readObject` function returns a proper discriminated union so TypeScript can infer the type of `.object` once you establish the value of `.format` and `.type`. Also `.object` has the same shape as as the return value of `readBlob`/`readCommit`/`readTag`/`readTree`. (Meaning trees are now plain arrays rather than objects with a `.entries` property that is the array.)

### Some functions behavior changed
- [x] The `push` function now pushes to the remote tracking branch (rather than a branch with the same name) by default.

### Docs and DX improvements
- [x] The `docs/alphabetic.md` and function list in `README.md` are auto-generated from the filenames in `src/api`.
- [x] The entire docs website is auto-generated from the JSDoc actually so from now on the docs website and source code will always be in sync.
- [x] All the example code in JSDoc is now type-checked during CI tests.
- [x] The live code examples on the website are displayed in a full-blown mobile-friendly code editor (CodeMirror 6).
- [x] Each page with live code examples includes a code snippet at the bottom to reset the browser file system.
- [x] The Getting Started guide has been updated.
- [x] All the example code in JSDoc has been updated.

### Miscellaneous stuff
- [x] Update the README to recommend LightningFS rather than BrowserFS.
- [x] The `internal-apis` bundle is no longer included in the published package. Those were only exposed so I could run unit tests and no one should have been using them I hope.

## Getting Started

The "isomorphic" in `isomorphic-git` means that the same code runs in either the server or the browser.
That's tricky to do since git uses the file system and makes HTTP requests. Browsers don't have an `fs` module.
And node and browsers have different APIs for making HTTP requests!

So rather than relying on the `fs` and `http` modules, `isomorphic-git` lets you bring your own file system
and HTTP client.

If you're using `isomorphic-git` in Node, you use the native `fs` module and the include Node HTTP client.

```js
// node.js example
const path = require('path')
const git = require('isomorphic-git');
const http = require('isomorphic-git/dist/http.cjs') // NOTE THE FILE EXTENSION IS .cjs
const fs = require('fs');

const dir = path.join(process.cwd(), 'test-clone')
git.clone({ fs, http, dir, url: 'https://github.com/isomorphic-git/lightning-fs' }).then(console.log)
```

If you're using `isomorphic-git` in the browser, you'll need something that emulates the `fs` API.
The easiest to setup and most performant library is [LightningFS](https://github.com/isomorphic-git/lightning-fs) which is written and maintained by the same author and is part of the `isomorphic-git` suite.
If LightningFS doesn't meet your requirements, isomorphic-git should also work with [BrowserFS](https://github.com/jvilk/BrowserFS) and [Filer](https://github.com/filerjs/filer).

```html
<script src="https://unpkg.com/@isomorphic-git/lightning-fs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script type="module">
import http from 'https://unpkg.com/isomorphic-git@beta/dist/http.js' // NOTE THE FILE EXTENSION IS .js
const fs = new LightningFS('fs')

const dir = '/test-clone'
git.clone({ fs, http, dir, url: 'https://github.com/isomorphic-git/lightning-fs', corsProxy: 'https://cors.isomorphic-git.org' }).then(console.log)
</script>
```

If you're using ES module syntax, you can use either the default import for convenience, or named imports to benefit from tree-shaking if you are using a bundler:

```js
import git from 'isomorphic-git'
// or
import {plugins, clone, commit, push} from 'isomorphic-git'
```

View the full [Getting Started guide](https://isomorphic-git.github.io/docs/quickstart.html) on the docs website.

Then check out the [Useful Snippets](https://isomorphic-git.org/docs/en/snippets) page, which includes even more sample code written by the community!

### CORS support

Unfortunately, due to the same-origin policy by default `isomorphic-git` can only clone from the same origin as the webpage it is running on. This is terribly inconvenient, as it means for all practical purposes cloning and pushing repos must be done through a proxy.

For this purpose [@isomorphic-git/cors-proxy](https://github.com/isomorphic-git/cors-proxy) exists which you can clone or [`npm install`](https://www.npmjs.com/package/@isomorphic-git/cor-proxy).
For testing or small projects, you can also use [https://cors.isomorphic-git.org](https://cors.isomorphic-git.org) - a free proxy sponsored by [Clever Cloud](https://www.clever-cloud.com/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git).

I'm hoping to get CORS headers added to all the major Git hosting platforms eventually, and will list my progress here:

| Service             | Supports CORS requests                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gogs (self-hosted)  | [✔](https://isomorphic-git.github.io/blog/2018/04/07/gogs-adds-cors-headers-for-isomorphic-git.html)                                                                         |
| Gitea (self-hosted) | [✔](https://github.com/go-gitea/gitea/pull/5719)                                                                                                                             |
| Azure DevOps        | [✔](https://github.com/isomorphic-git/isomorphic-git/issues/678#issuecomment-452402740) (Usage Note: requires `noGitSuffix: true` and authentication)                        |
| Gitlab              | ❌ My [PR](https://gitlab.com/gitlab-org/gitlab-workhorse/merge_requests/219) was rejected, but the [issue](https://gitlab.com/gitlab-org/gitlab/issues/20590) is still open! |
| Bitbucket           | ❌                                                                                                                                                                            |
| Github              | ❌                                                                                                                                                                            |

It is literally just two lines of code to add the CORS headers!! Easy stuff. Surely it will happen.

### Using as an npm module

You can install it from npm.

```
npm install --save isomorphic-git
```

In the package.json you'll see there are actually 3 different versions:

```json
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "unpkg": "dist/bundle.umd.min.js",
```

This deserves a brief explanation.

- the "main" version is a CommonJS build
- the "module" version is an ES Module build
- the "unpkg" version is a minified UMD build with dependencies already bundled

### `isogit` CLI

Isomorphic-git comes with a simple CLI tool, named `isogit` because `isomorphic-git` is a lot to type. It is really just a thin shell that translates command line arguments into the equivalent JS API commands. So you should be able to run *any* current or future isomorphic-git commands using the CLI.

It always starts with an the assumption that the current working directory is a git root.
E.g. `{ dir: '.' }`.

It uses `minimisted` to parse command line options and will print out the equivalent JS command and pretty-print the output JSON.

The CLI is more of a lark for quickly testing `isomorphic-git` and isn't really meant as a `git` CLI replacement.

## Supported Git commands

This project follows semantic versioning, so I may continue to make changes to the API but they will always be backwards compatible
unless there is a major version bump.

### commands

<!-- API-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- autogenerated_by: __tests__/__helpers__/generate-docs.js -->

- [add](https://isomorphic-git.github.io/docs/add.html)
- [addNote](https://isomorphic-git.github.io/docs/addNote.html)
- [addRemote](https://isomorphic-git.github.io/docs/addRemote.html)
- [annotatedTag](https://isomorphic-git.github.io/docs/annotatedTag.html)
- [branch](https://isomorphic-git.github.io/docs/branch.html)
- [checkout](https://isomorphic-git.github.io/docs/checkout.html)
- [clone](https://isomorphic-git.github.io/docs/clone.html)
- [commit](https://isomorphic-git.github.io/docs/commit.html)
- [currentBranch](https://isomorphic-git.github.io/docs/currentBranch.html)
- [deleteBranch](https://isomorphic-git.github.io/docs/deleteBranch.html)
- [deleteRef](https://isomorphic-git.github.io/docs/deleteRef.html)
- [deleteRemote](https://isomorphic-git.github.io/docs/deleteRemote.html)
- [deleteTag](https://isomorphic-git.github.io/docs/deleteTag.html)
- [expandOid](https://isomorphic-git.github.io/docs/expandOid.html)
- [expandRef](https://isomorphic-git.github.io/docs/expandRef.html)
- [fetch](https://isomorphic-git.github.io/docs/fetch.html)
- [findMergeBase](https://isomorphic-git.github.io/docs/findMergeBase.html)
- [findRoot](https://isomorphic-git.github.io/docs/findRoot.html)
- [getConfig](https://isomorphic-git.github.io/docs/getConfig.html)
- [getConfigAll](https://isomorphic-git.github.io/docs/getConfigAll.html)
- [getRemoteInfo](https://isomorphic-git.github.io/docs/getRemoteInfo.html)
- [hashBlob](https://isomorphic-git.github.io/docs/hashBlob.html)
- [indexPack](https://isomorphic-git.github.io/docs/indexPack.html)
- [init](https://isomorphic-git.github.io/docs/init.html)
- [isDescendent](https://isomorphic-git.github.io/docs/isDescendent.html)
- [listBranches](https://isomorphic-git.github.io/docs/listBranches.html)
- [listFiles](https://isomorphic-git.github.io/docs/listFiles.html)
- [listNotes](https://isomorphic-git.github.io/docs/listNotes.html)
- [listRemotes](https://isomorphic-git.github.io/docs/listRemotes.html)
- [listTags](https://isomorphic-git.github.io/docs/listTags.html)
- [log](https://isomorphic-git.github.io/docs/log.html)
- [merge](https://isomorphic-git.github.io/docs/merge.html)
- [packObjects](https://isomorphic-git.github.io/docs/packObjects.html)
- [pull](https://isomorphic-git.github.io/docs/pull.html)
- [push](https://isomorphic-git.github.io/docs/push.html)
- [readBlob](https://isomorphic-git.github.io/docs/readBlob.html)
- [readCommit](https://isomorphic-git.github.io/docs/readCommit.html)
- [readNote](https://isomorphic-git.github.io/docs/readNote.html)
- [readObject](https://isomorphic-git.github.io/docs/readObject.html)
- [readTag](https://isomorphic-git.github.io/docs/readTag.html)
- [readTree](https://isomorphic-git.github.io/docs/readTree.html)
- [remove](https://isomorphic-git.github.io/docs/remove.html)
- [removeNote](https://isomorphic-git.github.io/docs/removeNote.html)
- [resetIndex](https://isomorphic-git.github.io/docs/resetIndex.html)
- [resolveRef](https://isomorphic-git.github.io/docs/resolveRef.html)
- [setConfig](https://isomorphic-git.github.io/docs/setConfig.html)
- [status](https://isomorphic-git.github.io/docs/status.html)
- [statusMatrix](https://isomorphic-git.github.io/docs/statusMatrix.html)
- [tag](https://isomorphic-git.github.io/docs/tag.html)
- [version](https://isomorphic-git.github.io/docs/version.html)
- [walk](https://isomorphic-git.github.io/docs/walk.html)
- [writeBlob](https://isomorphic-git.github.io/docs/writeBlob.html)
- [writeCommit](https://isomorphic-git.github.io/docs/writeCommit.html)
- [writeObject](https://isomorphic-git.github.io/docs/writeObject.html)
- [writeRef](https://isomorphic-git.github.io/docs/writeRef.html)
- [writeTag](https://isomorphic-git.github.io/docs/writeTag.html)
- [writeTree](https://isomorphic-git.github.io/docs/writeTree.html)

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- API-LIST:END -->

## Community

Share your questions and ideas with us! We love that.
You can find us in our [Gitter chatroom](https://gitter.im/isomorphic-git/Lobby) or just create an issue here on Github!
We are also [@IsomorphicGit](https://twitter.com/IsomorphicGit) on Twitter.

## Contributing to `isomorphic-git`

The development setup is similar to that of a large web application.
The main difference is the ridiculous amount of hacks involved in the tests.
We use Facebook's [Jest](https://jestjs.io) for testing, which make doing TDD fast and fun,
but we also used custom hacks so that the same
tests will also run in the browser using [Jasmine](https://jasmine.github.io/) via [Karma](https://karma-runner.github.io).
We even have our own [mock server](https://github.com/isomorphic-git/git-http-mock-server) for serving
git repository test fixtures!

You'll need [Node.js](https://nodejs.org) installed, but everything else is a devDependency.

```sh
git clone https://github.com/isomorphic-git/isomorphic-git
cd isomorphic-git
npm install
npm test
```

Check out the [`CONTRIBUTING`](./CONTRIBUTING.md) document for more instructions.

## Who is using isomorphic-git?

- [nde](https://nde.now.sh) - a futuristic next-generation web IDE
- [git-app-manager](https://git-app-manager-tcibxepsta.now.sh) - install "unhosted" websites locally by git cloning them
- [GIT Web Terminal](https://jcubic.github.io/git/)
- [Next Editor](https://next-editor.app/)
- [Clever Cloud](https://www.clever-cloud.com/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git)
- [Stoplight Studio](https://stoplight.io/studio/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git) - a modern editor for API design and technical writing

## Similar projects

- [js-git](https://github.com/creationix/js-git)
- [es-git](https://github.com/es-git/es-git)

## Acknowledgments

Isomorphic-git would not have been possible without the pioneering work by
@creationix and @chrisdickinson. Git is a tricky binary mess, and without
their examples (and their modules!) I would not have been able to come even
close to finishing this. They are geniuses ahead of their time.

Cross-browser device testing is provided by:

[![BrowserStack](https://user-images.githubusercontent.com/587740/39730261-9c65c4d8-522e-11e8-9f12-16b349377a35.png)](http://browserstack.com/)

[![SauceLabs](https://saucelabs.com/content/images/logo.png)](https://saucelabs.com)

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://onename.com/wmhilton"><img src="https://avatars2.githubusercontent.com/u/587740?v=4&s=60" width="60px;" alt="William Hilton"/><br /><sub><b>William Hilton</b></sub></a><br /><a href="#blog-wmhilton" title="Blogposts">📝</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Awmhilton" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Code">💻</a> <a href="#design-wmhilton" title="Design">🎨</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Documentation">📖</a> <a href="#example-wmhilton" title="Examples">💡</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Tests">⚠️</a> <a href="#tutorial-wmhilton" title="Tutorials">✅</a></td>
    <td align="center"><a href="https://github.com/wDhTIG"><img src="https://avatars2.githubusercontent.com/u/33748231?v=4&s=60" width="60px;" alt="wDhTIG"/><br /><sub><b>wDhTIG</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AwDhTIG" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/marbemac"><img src="https://avatars3.githubusercontent.com/u/847542?v=4&s=60" width="60px;" alt="Marc MacLeod"/><br /><sub><b>Marc MacLeod</b></sub></a><br /><a href="#ideas-marbemac" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-marbemac" title="Funding Finding">🔍</a></td>
    <td align="center"><a href="http://brett-zamir.me"><img src="https://avatars3.githubusercontent.com/u/20234?v=4&s=60" width="60px;" alt="Brett Zamir"/><br /><sub><b>Brett Zamir</b></sub></a><br /><a href="#ideas-brettz9" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://mojavelinux.com"><img src="https://avatars2.githubusercontent.com/u/79351?v=4&s=60" width="60px;" alt="Dan Allen"/><br /><sub><b>Dan Allen</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amojavelinux" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mojavelinux" title="Code">💻</a> <a href="#ideas-mojavelinux" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://TomasHubelbauer.net"><img src="https://avatars1.githubusercontent.com/u/6831144?v=4&s=60" width="60px;" alt="Tomáš Hübelbauer"/><br /><sub><b>Tomáš Hübelbauer</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3ATomasHubelbauer" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=TomasHubelbauer" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/juancampa"><img src="https://avatars2.githubusercontent.com/u/1410520?v=4&s=60" width="60px;" alt="Juan Campa"/><br /><sub><b>Juan Campa</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajuancampa" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=juancampa" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://iramiller.com"><img src="https://avatars2.githubusercontent.com/u/1041868?v=4&s=60" width="60px;" alt="Ira Miller"/><br /><sub><b>Ira Miller</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Aisysd" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://rhys.arkins.net"><img src="https://avatars1.githubusercontent.com/u/6311784?v=4&s=60" width="60px;" alt="Rhys Arkins"/><br /><sub><b>Rhys Arkins</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rarkins" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/TheLarkInn"><img src="https://avatars1.githubusercontent.com/u/3408176?v=4&s=60" width="60px;" alt="Sean Larkin"/><br /><sub><b>Sean Larkin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=TheLarkInn" title="Code">💻</a></td>
    <td align="center"><a href="https://daniel-ruf.de"><img src="https://avatars1.githubusercontent.com/u/827205?v=4&s=60" width="60px;" alt="Daniel Ruf"/><br /><sub><b>Daniel Ruf</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DanielRuf" title="Code">💻</a></td>
    <td align="center"><a href="http://blog.bokuweb.me/"><img src="https://avatars0.githubusercontent.com/u/10220449?v=4&s=60" width="60px;" alt="bokuweb"/><br /><sub><b>bokuweb</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/hirokiosame"><img src="https://avatars0.githubusercontent.com/u/1075694?v=4&s=60" width="60px;" alt="Hiroki Osame"/><br /><sub><b>Hiroki Osame</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hirokiosame" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hirokiosame" title="Documentation">📖</a></td>
    <td align="center"><a href="http://jcubic.pl/me"><img src="https://avatars1.githubusercontent.com/u/280241?v=4&s=60" width="60px;" alt="Jakub Jankiewicz"/><br /><sub><b>Jakub Jankiewicz</b></sub></a><br /><a href="#question-jcubic" title="Answering Questions">💬</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajcubic" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jcubic" title="Code">💻</a> <a href="#example-jcubic" title="Examples">💡</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jcubic" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/howardgod"><img src="https://avatars1.githubusercontent.com/u/10459637?v=4&s=60" width="60px;" alt="howardgod"/><br /><sub><b>howardgod</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ahowardgod" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=howardgod" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/btyga"><img src="https://avatars3.githubusercontent.com/u/263378?v=4&s=60" width="60px;" alt="burningTyger"/><br /><sub><b>burningTyger</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AburningTyger" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://melvincarvalho.com/#me"><img src="https://avatars2.githubusercontent.com/u/65864?v=4&s=60" width="60px;" alt="Melvin Carvalho"/><br /><sub><b>Melvin Carvalho</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=melvincarvalho" title="Documentation">📖</a></td>
    <td align="center"><img src="https://avatars2.githubusercontent.com/u/3035266?v=4&s=60" width="60px;" alt="akaJes"/><br /><sub><b>akaJes</b></sub><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=akaJes" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/dimasabanin"><img src="https://avatars2.githubusercontent.com/u/8316?v=4&s=60" width="60px;" alt="Dima Sabanin"/><br /><sub><b>Dima Sabanin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Adsabanin" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=dsabanin" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/mizchi"><img src="https://avatars2.githubusercontent.com/u/73962?v=4&s=60" width="60px;" alt="Koutaro Chikuba"/><br /><sub><b>Koutaro Chikuba</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amizchi" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mizchi" title="Code">💻</a></td>
    <td align="center"><a href="https://www.hsablonniere.com/"><img src="https://avatars2.githubusercontent.com/u/236342?v=4&s=60" width="60px;" alt="Hubert SABLONNIÈRE"/><br /><sub><b>Hubert SABLONNIÈRE</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hsablonniere" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hsablonniere" title="Tests">⚠️</a> <a href="#ideas-hsablonniere" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-hsablonniere" title="Funding Finding">🔍</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/DeltaEvo"><img src="https://avatars1.githubusercontent.com/u/8864716?v=4&s=60" width="60px;" alt="David Duarte"/><br /><sub><b>David Duarte</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DeltaEvo" title="Code">💻</a></td>
    <td align="center"><a href="http://stoplight.io/"><img src="https://avatars2.githubusercontent.com/u/2294309?v=4&s=60" width="60px;" alt="Thomas Pytleski"/><br /><sub><b>Thomas Pytleski</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Apytlesk4" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=pytlesk4" title="Code">💻</a></td>
    <td align="center"><a href="http://linkedin.com/in/vmarkovtsev"><img src="https://avatars3.githubusercontent.com/u/2793551?v=4&s=60" width="60px;" alt="Vadim Markovtsev"/><br /><sub><b>Vadim Markovtsev</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Avmarkovtsev" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://yuhr.org"><img src="https://avatars0.githubusercontent.com/u/18474125?v=4&s=60" width="60px;" alt="Yu Shimura"/><br /><sub><b>Yu Shimura</b></sub></a><br /><a href="#ideas-yuhr" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yuhr" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yuhr" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/pyramation"><img src="https://avatars1.githubusercontent.com/u/545047?v=4&s=60" width="60px;" alt="Dan Lynch"/><br /><sub><b>Dan Lynch</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=pyramation" title="Code">💻</a></td>
    <td align="center"><a href="https://www.jeffreywescott.com/"><img src="https://avatars3.githubusercontent.com/u/130597?v=4&s=60" width="60px;" alt="Jeffrey Wescott"/><br /><sub><b>Jeffrey Wescott</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajeffreywescott" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jeffreywescott" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zebzhao"><img src="https://avatars2.githubusercontent.com/u/5515758?v=4&s=60" width="60px;" alt="zebzhao"/><br /><sub><b>zebzhao</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=zebzhao" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/tilersmyth"><img src="https://avatars2.githubusercontent.com/u/8736328?v=4&s=60" width="60px;" alt="Tyler Smith"/><br /><sub><b>Tyler Smith</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Atilersmyth" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/beeman"><img src="https://avatars3.githubusercontent.com/u/36491?v=4&s=60" width="60px;" alt="Bram Borggreve"/><br /><sub><b>Bram Borggreve</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Abeeman" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/stefan-guggisberg"><img src="https://avatars1.githubusercontent.com/u/1543625?v=4&s=60" width="60px;" alt="Stefan Guggisberg"/><br /><sub><b>Stefan Guggisberg</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Astefan-guggisberg" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=stefan-guggisberg" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=stefan-guggisberg" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/katakonst"><img src="https://avatars2.githubusercontent.com/u/6519792?v=4&s=60" width="60px;" alt="Catalin Pirvu"/><br /><sub><b>Catalin Pirvu</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=katakonst" title="Code">💻</a></td>
    <td align="center"><a href="http://web.engr.oregonstate.edu/~nelsonni/"><img src="https://avatars1.githubusercontent.com/u/6432572?v=4&s=60" width="60px;" alt="Nicholas Nelson"/><br /><sub><b>Nicholas Nelson</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=nelsonni" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=nelsonni" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://twitter.com/addaleax"><img src="https://avatars2.githubusercontent.com/u/899444?v=4&s=60" width="60px;" alt="Anna Henningsen"/><br /><sub><b>Anna Henningsen</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=addaleax" title="Code">💻</a></td>
    <td align="center"><a href="https://hen.ne.ke"><img src="https://avatars0.githubusercontent.com/u/4312191?v=4&s=60" width="60px;" alt="Fabian Henneke"/><br /><sub><b>Fabian Henneke</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AFabianHenneke" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=FabianHenneke" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/djencks"><img src="https://avatars2.githubusercontent.com/u/569822?v=4" width="60px;" alt="djencks"/><br /><sub><b>djencks</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Adjencks" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=djencks" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=djencks" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://justamouse.com"><img src="https://avatars0.githubusercontent.com/u/1086421?v=4" width="60px;" alt="Clemens Wolff"/><br /><sub><b>Clemens Wolff</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

<!--
### Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="graphs/contributors"><img src="https://opencollective.com/isomorphic-git/contributors.svg?width=890&button=false" /></a>
-->

### Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/isomorphic-git#backer)]

<a href="https://opencollective.com/isomorphic-git#backers" target="_blank"><img src="https://opencollective.com/isomorphic-git/backers.svg?width=890"></a>


### Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/isomorphic-git#sponsor)]

<a href="https://opencollective.com/isomorphic-git/sponsor/0/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/1/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/2/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/3/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/4/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/5/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/6/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/7/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/8/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/isomorphic-git/sponsor/9/website" target="_blank"><img src="https://opencollective.com/isomorphic-git/sponsor/9/avatar.svg"></a>

## License

This work is released under [The MIT License](https://opensource.org/licenses/MIT)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fisomorphic-git%2Fisomorphic-git.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fisomorphic-git%2Fisomorphic-git?ref=badge_large)
