# isomorphic-git
A pure JavaScript implementation of git for node and browsers!

<table><tr><td>

Latest release:

</td><td>

[![current npm version](https://img.shields.io/npm/v/isomorphic-git.svg)](https://www.npmjs.com/package/isomorphic-git)
![required node version](https://img.shields.io/node/v/isomorphic-git.svg)
![written in ECMAScript 2017+](https://img.shields.io/badge/ECMAScript-2017%2B-brightgreen.svg)
![license](https://img.shields.io/npm/l/isomorphic-git.svg)
[![gzip size](http://img.badgesize.io/https://unpkg.com/isomorphic-git?compression=gzip)](https://unpkg.com/isomorphic-git)
[![install size](https://packagephobia.now.sh/badge?p=isomorphic-git)](https://packagephobia.now.sh/result?p=isomorphic-git)

</td></tr><tr><td>

Master branch status:

</td><td>

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Build Status](https://dev.azure.com/isomorphic-git/isomorphic-git/_apis/build/status/isomorphic-git-RELEASE?branchName=master)](https://dev.azure.com/isomorphic-git/isomorphic-git/_apis/build/status/isomorphic-git-RELEASE?branchName=master)
[![dependencies](https://david-dm.org/isomorphic-git/isomorphic-git/status.svg)](https://david-dm.org/isomorphic-git/isomorphic-git)
[![Known Vulnerabilities](https://snyk.io/test/github/isomorphic-git/isomorphic-git/badge.svg)](https://snyk.io/test/github/isomorphic-git/isomorphic-git)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fisomorphic-git%2Fisomorphic-git.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fisomorphic-git%2Fisomorphic-git?ref=badge_shield)

</td></tr><tr><td>

Social:

</td><td>

[![Gitter chat](https://badges.gitter.im/isomorphic-git.svg)](https://gitter.im/isomorphic-git/Lobby)
[![Backers on Open Collective](https://opencollective.com/isomorphic-git/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/isomorphic-git/sponsors/badge.svg)](#sponsors)

</td></tr><tr><td>

Browser Support:

</td><td>

[![Sauce Labs Test Status (for master branch)](https://badges.herokuapp.com/browsers?googlechrome=+66&firefox=60&microsoftedge=17&safari=11&android=7.1&iphone=11.2)](https://saucelabs.com/u/_wmhilton)

</td></tr><tr><td>

Most recent build:

</td><td>
  
[![Build Status](https://dev.azure.com/isomorphic-git/isomorphic-git/_apis/build/status/isomorphic-git.isomorphic-git)](https://dev.azure.com/isomorphic-git/isomorphic-git/_build/latest?definitionId=1)
[![Build Status](https://saucelabs.com/buildstatus/_wmhilton)](https://saucelabs.com/beta/builds/e188d69c3e1640139b5899a5ff76f092)
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key=MnFJSk9SWDZHK3JhcWxlRE5KUXpoVm1ndUZNSklSSGZlaFdpUzBTbjVWdz0tLUprUmRNcVNwWTd0TkFzSWVveFNpM0E9PQ==--86fecb8d528f51b7540094886e6dc6dd21bf6b8f)](https://www.browserstack.com/automate/public-build/MnFJSk9SWDZHK3JhcWxlRE5KUXpoVm1ndUZNSklSSGZlaFdpUzBTbjVWdz0tLUprUmRNcVNwWTd0TkFzSWVveFNpM0E9PQ==--86fecb8d528f51b7540094886e6dc6dd21bf6b8f)

</td></tr></table>


`isomorphic-git` is a pure JavaScript implementation of git that works in node and browser environments (including WebWorkers and ServiceWorkers). This means it can be used to read and write to git repositories, as well as fetch from and push to git remotes like Github.

Isomorphic-git aims for 100% interoperability with the canonical git implementation. This means it does all its operations by modifying files in a ".git" directory just like the git you are used to. The included `isogit` CLI can operate on git repositories on your desktop or server.

`isomorphic-git` aims to be a complete solution with no assembly required.
I've tried carefully to design the API so it is easy to use all the features, without paying a penalty in bundle size.
By providing functionality as separate functions instead of an object oriented API, code bundlers like Webpack will only include the functionality your application actually uses. (Or at least that's the goal.)

The project includes type definitions so you can enjoy static type-checking and intelligent code completion in editors like VS Code and [CodeSandbox](https://codesandbox.io).

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
| Gitlab | ❌ My [PR](https://gitlab.com/gitlab-org/gitlab-workhorse/merge_requests/219) was rejected, but the [issue](https://gitlab.com/gitlab-org/gitlab-ce/issues/41755) is still open!
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
- [fetch](https://isomorphic-git.github.io/docs/fetch.html)
- [findRoot](https://isomorphic-git.github.io/docs/findRoot.html)
- [getRemoteInfo](https://isomorphic-git.github.io/docs/getRemoteInfo.html)
- [hashBlob](https://isomorphic-git.github.io/docs/hashBlob.html)
- [indexPack](https://isomorphic-git.github.io/docs/indexPack.html)
- [init](https://isomorphic-git.github.io/docs/init.html)
- [isDescendent](https://isomorphic-git.github.io/docs/isDescendent.html)
- [listBranches](https://isomorphic-git.github.io/docs/listBranches.html)
- [listFiles](https://isomorphic-git.github.io/docs/listFiles.html)
- [listRemotes](https://isomorphic-git.github.io/docs/listRemotes.html)
- [listTags](https://isomorphic-git.github.io/docs/listTags.html)
- [log](https://isomorphic-git.github.io/docs/log.html)
- [merge](https://isomorphic-git.github.io/docs/merge.html)
- [packObjects](https://isomorphic-git.github.io/docs/packObjects.html)
- [pull](https://isomorphic-git.github.io/docs/pull.html)
- [push](https://isomorphic-git.github.io/docs/push.html)
- [readObject](https://isomorphic-git.github.io/docs/readObject.html)
- [remove](https://isomorphic-git.github.io/docs/remove.html)
- [resetIndex](https://isomorphic-git.github.io/docs/resetIndex.html)
- [resolveRef](https://isomorphic-git.github.io/docs/resolveRef.html)
- [sign](https://isomorphic-git.github.io/docs/sign.html)
- [status](https://isomorphic-git.github.io/docs/status.html)
- [statusMatrix](https://isomorphic-git.github.io/docs/statusMatrix.html)
- [tag](https://isomorphic-git.github.io/docs/tag.html)
- [verify](https://isomorphic-git.github.io/docs/verify.html)
- [version](https://isomorphic-git.github.io/docs/version.html)
- [walkBeta1](https://isomorphic-git.github.io/docs/walkBeta1.html)
- [writeObject](https://isomorphic-git.github.io/docs/writeObject.html)
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
