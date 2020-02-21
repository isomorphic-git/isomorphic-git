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
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/node.webp" alt="" width="64" height="64"><br> Node 7.6</td>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/chrome.png" alt="" width="64" height="64"><br> Chrome 66</td>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/edge.png" alt="" width="64" height="64"><br> Edge 17</td>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/firefox.png" alt="" width="64" height="64"><br> Firefox 60</td>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/safari.png" alt="" width="64" height="64"><br> Safari 11</td>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/android.svg?sanitize=true" alt="" width="64" height="64"><br> Android 7.1</td>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/master/website/static/img/browsers/ios.svg?sanitize=true" alt="" width="64" height="64"><br> iOS 11.2</td>
</tr>
</table>

## 1.0 Release Plans

The 1.0 release is planned to coincide with the stable release of the new Chromium-based [Micorosoft Edge](https://blogs.windows.com/msedgedev/2019/11/04/edge-chromium-release-candidate-get-ready/#QU89TOA8e8dE8Hev.97) in January 2020, so that we can drop support for the old Edge browser.
*Update: The new Edge browser is out, so I'm working on getting 1.0 out now.*

At the time of writing, the following breaking changes are planned:

1. The supported browser versions will be bumped.
2. Commands that will be renamed:
   1. The `checkout` command will be replaced with the implementation used in the safer and faster `fastCheckout` command and `fastCheckout` will be removed.
   2. The `walkBeta2` command renamed to `walk`, and the `walkBeta1` command will be removed.
3. Deprecated commands and function arguments will be removed:
   1. The commands `sign`, `utils.auth`, and `utils.oauth2` will be removed.
   2. The `fs` and `emitter` function arguments will be removed.
   3. The `fast` argument to `pull` will be removed since it will always use the `fastCheckout` implementation.
   4. The `signing` function argument of `log` will be removed, and `log` will simply always return a payload. The `payload` property will be renamed to `gpgmsg` so its purpose is more obvious. (This change is to simplify the type signature of `log` so we don't need function overloading; it is the only thing blocking me from abandoning the hand-crafted `index.d.ts` file and generating the TypeScript definitions directly from the JSDoc tags that already power the website docs.)
4. Any functions that currently return `Buffer` objects will instead return `Uint8Array` so we can eventually drop the bloated Buffer browser polyfill.
5. The `pattern` and globbing options will be removed so we can drop the dependencies on `globalyzer` and `globrex`, but you'll be able to bring your own `matcher` function instead.

## Getting Started

The "isomorphic" in `isomorphic-git` means it works equally well on the server or the browser.
That's tricky to do since git uses the file system, and browsers don't have an `fs` module.
So rather than relying on the `fs` module, `isomorphic-git` is BYOFS (Bring Your Own File System).
Before you can use most `isomorphic-git` functions, you need to set the `fs` module
via the plugin system.

If you're only using `isomorphic-git` in Node, you can just use the native `fs` module.

```js
const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs)
```

If you're writing code for the browser though, you'll need something that emulates the `fs` API.
At the time of writing, the most complete option is [BrowserFS](https://github.com/jvilk/BrowserFS).
Compared to Node, there is an extra setup step to configure BrowserFS, as seen below:

```html
<script src="https://unpkg.com/browserfs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
BrowserFS.configure({ fs: "IndexedDB", options: {} }, function (err) {
  if (err) return console.log(err);
  window.fs = BrowserFS.BFSRequire("fs");
  git.plugins.set('fs', window.fs);
});
</script>
```

If you're using ES module syntax, use either a namespace import or named imports to benefit from tree-shaking:

```js
import * as git from 'isomorphic-git'
// or
import {plugins, clone, commit, push} from 'isomorphic-git
```

Besides IndexedDB, BrowserFS supports many different backends with different performance characteristics, as well as advanced configurations such as: multiple mounting points, and overlaying a writeable filesystem on top of a read-only filesystem.
You don't need to know about all these features, but familiarizing yourself with the different options may be necessary if you hit a storage limit or performance bottleneck using the IndexedDB backend I suggested above.

View the full [Getting Started guide](https://isomorphic-git.github.io/docs/quickstart.html) on the docs website.

Then check out the [Useful Snippets](https://isomorphic-git.org/docs/en/snippets) page, which includes even more sample code written by the community!

### CORS support

Unfortunately, due to the same-origin policy by default `isomorphic-git` can only clone from the same origin as the webpage it is running on. This is terribly inconvenient, as it means for all practical purposes cloning and pushing repos must be done through a proxy.

For this purpose [@isomorphic-git/cors-proxy](https://github.com/isomorphic-git/cors-proxy) exists which you can clone or [`npm install`](https://www.npmjs.com/package/@isomorphic-git/cor-proxy).
For testing or small projects, you can also use [https://cors.isomorphic-git.org](https://cors.isomorphic-git.org) - a free proxy sponsored by [Clever Cloud](https://www.clever-cloud.com/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git).

I'm hoping to get CORS headers added to all the major Git hosting platforms eventually, and will list my progress here:

| Service | Supports CORS requests |
| --- | --- |
| Gogs (self-hosted) | [✔](https://isomorphic-git.github.io/blog/2018/04/07/gogs-adds-cors-headers-for-isomorphic-git.html) |
| Gitea (self-hosted) | [✔](https://github.com/go-gitea/gitea/pull/5719) |
| Azure DevOps | [✔](https://github.com/isomorphic-git/isomorphic-git/issues/678#issuecomment-452402740) (Usage Note: requires `noGitSuffix: true` and authentication)
| Gitlab | ❌ My [PR](https://gitlab.com/gitlab-org/gitlab-workhorse/merge_requests/219) was rejected, but the [issue](https://gitlab.com/gitlab-org/gitlab/issues/20590) is still open!
| Bitbucket | ❌ |
| Github | ❌ |

It is literally just two lines of code to add the CORS headers!! Easy stuff. Surely it will happen.

### Using as an npm module

You can install it from npm.

```
npm install --save isomorphic-git
```

In the package.json you'll see there are actually 4 different versions:

```json
  "main": "dist/for-node/isomorphic-git/index.js",
  "module": "dist/for-future/isomorphic-git/index.js",
  "unpkg": "dist/bundle.umd.min.js",
```

This deserves a brief explanation.

- the "main" version is for node.
- the "module" version is for webpack or other browser bundlers.
- the "unpkg" version is the UMD build.

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

- [add](https://isomorphic-git.github.io/docs/add.html)
- [addNote](https://isomorphic-git.github.io/docs/addNote.html)
- [addRemote](https://isomorphic-git.github.io/docs/addRemote.html)
- [annotatedTag](https://isomorphic-git.github.io/docs/annotatedTag.html)
- [branch](https://isomorphic-git.github.io/docs/branch.html)
- [checkout](https://isomorphic-git.github.io/docs/checkout.html)
- [clone](https://isomorphic-git.github.io/docs/clone.html)
- [commit](https://isomorphic-git.github.io/docs/commit.html)
- [config](https://isomorphic-git.github.io/docs/config.html)
- [currentBranch](https://isomorphic-git.github.io/docs/currentBranch.html)
- [deleteBranch](https://isomorphic-git.github.io/docs/deleteBranch.html)
- [deleteRef](https://isomorphic-git.github.io/docs/deleteRef.html)
- [deleteRemote](https://isomorphic-git.github.io/docs/deleteRemote.html)
- [deleteTag](https://isomorphic-git.github.io/docs/deleteTag.html)
- [expandOid](https://isomorphic-git.github.io/docs/expandOid.html)
- [expandRef](https://isomorphic-git.github.io/docs/expandRef.html)
- [fastCheckout](https://isomorphic-git.github.io/docs/fastCheckout.html)
- [fetch](https://isomorphic-git.github.io/docs/fetch.html)
- [findRoot](https://isomorphic-git.github.io/docs/findRoot.html)
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
- [readObject](https://isomorphic-git.github.io/docs/readObject.html)
- [readTag](https://isomorphic-git.github.io/docs/readTag.html)
- [readTree](https://isomorphic-git.github.io/docs/readTree.html)
- [remove](https://isomorphic-git.github.io/docs/remove.html)
- [removeNote](https://isomorphic-git.github.io/docs/removeNote.html)
- [resetIndex](https://isomorphic-git.github.io/docs/resetIndex.html)
- [resolveRef](https://isomorphic-git.github.io/docs/resolveRef.html)
- [showNote](https://isomorphic-git.github.io/docs/showNote.html)
- [sign](https://isomorphic-git.github.io/docs/sign.html)
- [status](https://isomorphic-git.github.io/docs/status.html)
- [statusMatrix](https://isomorphic-git.github.io/docs/statusMatrix.html)
- [tag](https://isomorphic-git.github.io/docs/tag.html)
- [verify](https://isomorphic-git.github.io/docs/verify.html)
- [version](https://isomorphic-git.github.io/docs/version.html)
- [walkBeta2](https://isomorphic-git.github.io/docs/walkBeta2.html)
- [writeBlob](https://isomorphic-git.github.io/docs/writeBlob.html)
- [writeCommit](https://isomorphic-git.github.io/docs/writeCommit.html)
- [writeObject](https://isomorphic-git.github.io/docs/writeObject.html)
- [writeTag](https://isomorphic-git.github.io/docs/writeTag.html)
- [writeTree](https://isomorphic-git.github.io/docs/writeTree.html)
- [writeRef](https://isomorphic-git.github.io/docs/writeRef.html)

### plugins
- [credentialManager](https://isomorphic-git.github.io/docs/plugin_credentialManager.html)
- [emitter](https://isomorphic-git.github.io/docs/plugin_emitter.html)
- [fs](https://isomorphic-git.github.io/docs/plugin_fs.html)
- [http](https://isomorphic-git.github.io/docs/plugin_http.html)
- [pgp](https://isomorphic-git.github.io/docs/plugin_pgp.html)

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
We even have our own [karma plugin](https://github.com/isomorphic-git/karma-git-http-server-middleware) for serving
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
    <td align="center"><a href="https://onename.com/wmhilton"><img src="https://avatars2.githubusercontent.com/u/587740?v=4&s=60" width="60px;" alt=""/><br /><sub><b>William Hilton</b></sub></a><br /><a href="#blog-wmhilton" title="Blogposts">📝</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Awmhilton" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Code">💻</a> <a href="#design-wmhilton" title="Design">🎨</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Documentation">📖</a> <a href="#example-wmhilton" title="Examples">💡</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Tests">⚠️</a> <a href="#tutorial-wmhilton" title="Tutorials">✅</a></td>
    <td align="center"><a href="https://github.com/wDhTIG"><img src="https://avatars2.githubusercontent.com/u/33748231?v=4&s=60" width="60px;" alt=""/><br /><sub><b>wDhTIG</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AwDhTIG" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/marbemac"><img src="https://avatars3.githubusercontent.com/u/847542?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Marc MacLeod</b></sub></a><br /><a href="#ideas-marbemac" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-marbemac" title="Funding Finding">🔍</a></td>
    <td align="center"><a href="http://brett-zamir.me"><img src="https://avatars3.githubusercontent.com/u/20234?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Brett Zamir</b></sub></a><br /><a href="#ideas-brettz9" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://mojavelinux.com"><img src="https://avatars2.githubusercontent.com/u/79351?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Dan Allen</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amojavelinux" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mojavelinux" title="Code">💻</a> <a href="#ideas-mojavelinux" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://TomasHubelbauer.net"><img src="https://avatars1.githubusercontent.com/u/6831144?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Tomáš Hübelbauer</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3ATomasHubelbauer" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=TomasHubelbauer" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/juancampa"><img src="https://avatars2.githubusercontent.com/u/1410520?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Juan Campa</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajuancampa" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=juancampa" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://iramiller.com"><img src="https://avatars2.githubusercontent.com/u/1041868?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Ira Miller</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Aisysd" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://rhys.arkins.net"><img src="https://avatars1.githubusercontent.com/u/6311784?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Rhys Arkins</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rarkins" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/TheLarkInn"><img src="https://avatars1.githubusercontent.com/u/3408176?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Sean Larkin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=TheLarkInn" title="Code">💻</a></td>
    <td align="center"><a href="https://daniel-ruf.de"><img src="https://avatars1.githubusercontent.com/u/827205?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Daniel Ruf</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DanielRuf" title="Code">💻</a></td>
    <td align="center"><a href="http://blog.bokuweb.me/"><img src="https://avatars0.githubusercontent.com/u/10220449?v=4&s=60" width="60px;" alt=""/><br /><sub><b>bokuweb</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/hirokiosame"><img src="https://avatars0.githubusercontent.com/u/1075694?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Hiroki Osame</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hirokiosame" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hirokiosame" title="Documentation">📖</a></td>
    <td align="center"><a href="http://jcubic.pl/me"><img src="https://avatars1.githubusercontent.com/u/280241?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Jakub Jankiewicz</b></sub></a><br /><a href="#question-jcubic" title="Answering Questions">💬</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajcubic" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jcubic" title="Code">💻</a> <a href="#example-jcubic" title="Examples">💡</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jcubic" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/howardgod"><img src="https://avatars1.githubusercontent.com/u/10459637?v=4&s=60" width="60px;" alt=""/><br /><sub><b>howardgod</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ahowardgod" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=howardgod" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/btyga"><img src="https://avatars3.githubusercontent.com/u/263378?v=4&s=60" width="60px;" alt=""/><br /><sub><b>burningTyger</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AburningTyger" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://melvincarvalho.com/#me"><img src="https://avatars2.githubusercontent.com/u/65864?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Melvin Carvalho</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=melvincarvalho" title="Documentation">📖</a></td>
    <td align="center"><img src="https://avatars2.githubusercontent.com/u/3035266?v=4&s=60" width="60px;" alt=""/><br /><sub><b>akaJes</b></sub><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=akaJes" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/dimasabanin"><img src="https://avatars2.githubusercontent.com/u/8316?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Dima Sabanin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Adsabanin" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=dsabanin" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/mizchi"><img src="https://avatars2.githubusercontent.com/u/73962?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Koutaro Chikuba</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amizchi" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mizchi" title="Code">💻</a></td>
    <td align="center"><a href="https://www.hsablonniere.com/"><img src="https://avatars2.githubusercontent.com/u/236342?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Hubert SABLONNIÈRE</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hsablonniere" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hsablonniere" title="Tests">⚠️</a> <a href="#ideas-hsablonniere" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-hsablonniere" title="Funding Finding">🔍</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/DeltaEvo"><img src="https://avatars1.githubusercontent.com/u/8864716?v=4&s=60" width="60px;" alt=""/><br /><sub><b>David Duarte</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DeltaEvo" title="Code">💻</a></td>
    <td align="center"><a href="http://stoplight.io/"><img src="https://avatars2.githubusercontent.com/u/2294309?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Thomas Pytleski</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Apytlesk4" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=pytlesk4" title="Code">💻</a></td>
    <td align="center"><a href="http://linkedin.com/in/vmarkovtsev"><img src="https://avatars3.githubusercontent.com/u/2793551?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Vadim Markovtsev</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Avmarkovtsev" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://yuhr.org"><img src="https://avatars0.githubusercontent.com/u/18474125?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Yu Shimura</b></sub></a><br /><a href="#ideas-yuhr" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yuhr" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yuhr" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/pyramation"><img src="https://avatars1.githubusercontent.com/u/545047?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Dan Lynch</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=pyramation" title="Code">💻</a></td>
    <td align="center"><a href="https://www.jeffreywescott.com/"><img src="https://avatars3.githubusercontent.com/u/130597?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Jeffrey Wescott</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajeffreywescott" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jeffreywescott" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zebzhao"><img src="https://avatars2.githubusercontent.com/u/5515758?v=4&s=60" width="60px;" alt=""/><br /><sub><b>zebzhao</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=zebzhao" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/tilersmyth"><img src="https://avatars2.githubusercontent.com/u/8736328?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Tyler Smith</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Atilersmyth" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/beeman"><img src="https://avatars3.githubusercontent.com/u/36491?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Bram Borggreve</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Abeeman" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/stefan-guggisberg"><img src="https://avatars1.githubusercontent.com/u/1543625?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Stefan Guggisberg</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Astefan-guggisberg" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=stefan-guggisberg" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=stefan-guggisberg" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/katakonst"><img src="https://avatars2.githubusercontent.com/u/6519792?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Catalin Pirvu</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=katakonst" title="Code">💻</a></td>
    <td align="center"><a href="http://web.engr.oregonstate.edu/~nelsonni/"><img src="https://avatars1.githubusercontent.com/u/6432572?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Nicholas Nelson</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=nelsonni" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=nelsonni" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://twitter.com/addaleax"><img src="https://avatars2.githubusercontent.com/u/899444?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Anna Henningsen</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=addaleax" title="Code">💻</a></td>
    <td align="center"><a href="https://hen.ne.ke"><img src="https://avatars0.githubusercontent.com/u/4312191?v=4&s=60" width="60px;" alt=""/><br /><sub><b>Fabian Henneke</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AFabianHenneke" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=FabianHenneke" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/djencks"><img src="https://avatars2.githubusercontent.com/u/569822?v=4" width="60px;" alt=""/><br /><sub><b>djencks</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Adjencks" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=djencks" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=djencks" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://justamouse.com"><img src="https://avatars0.githubusercontent.com/u/1086421?v=4" width="60px;" alt=""/><br /><sub><b>Clemens Wolff</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://sojin.io"><img src="https://avatars1.githubusercontent.com/u/3102175?v=4" width="60px;" alt=""/><br /><sub><b>Sojin Park</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=raon0211" title="Code">💻</a></td>
    <td align="center"><a href="http://eaf4.com"><img src="https://avatars0.githubusercontent.com/u/319282?v=4" width="60px;" alt=""/><br /><sub><b>Edward Faulkner</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=ef4" title="Code">💻</a></td>
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
