<p align="center">
  <img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/main/website/static/img/isomorphic-git-logo.svg?sanitize=true" alt="" height="150"/>
</p>

# isomorphic-git

`isomorphic-git` is a pure JavaScript reimplementation of git that works in both Node.js and browser JavaScript environments. It can read and write to git repositories, fetch from and push to git remotes (such as GitHub), all without any native C++ module dependencies.

## Goals

Isomorphic-git aims for 100% interoperability with the canonical git implementation. This means it does all its operations by modifying files in a ".git" directory just like the git you are used to. The included `isogit` CLI can operate on git repositories on your desktop or server.

This library aims to be a complete solution with no assembly required.
The API has been designed with modern tools like Rollup and Webpack in mind.
By providing functionality as individual functions, code bundlers can produce smaller bundles by including only the functions your application uses.

The project includes type definitions so you can enjoy static type-checking and intelligent code completion in editors like VS Code and [CodeSandbox](https://codesandbox.io).

## Project status
The original author of the project ([Billie Hilton](https://github.com/billiegoose)) left the project, but the project is still maintained by two volunteers:

* [@jcubic](https://github.com/jcubic) (most active)
* [@mojavelinux](https://github.com/mojavelinux)

But they don't write much code, mainly do code review and try to answer to issues and on Gitter, they just don't want the project to die. So you can say that this project is community driven (as jcubic always reply to issues). Which means that if you want a feature to be implemented you need to do this yourself or find someone that is willing to write the code for you. The project have some money on [OpenCollective](https://opencollective.com/isomorphic-git) and we can spend it on some development, if you find someone that is willing to code in exchange to some bucks (it may be you), but we don't have a lot so don't expect to have full sallary.

If you want to help this project you're more than welcome to do so.

## Supported Environments

The following environments are tested in CI and will continue to be supported until the next breaking version:

<table width="100%">
<tr>
<td align="center"><img src="https://raw.githubusercontent.com/isomorphic-git/isomorphic-git/main/website/static/img/browsers/node.webp" alt="" width="64" height="64"><br> Node 10</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/chrome/chrome.svg?sanitize=true" alt="" width="64" height="64"><br> Chrome 79</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/edge/edge.svg?sanitize=true" alt="" width="64" height="64"><br> Edge 79</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/firefox/firefox.svg?sanitize=true" alt="" width="64" height="64"><br> Firefox 72</td>
<td align="center"><img src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/safari/safari_64x64.png" alt="" width="64" height="64"><br> Safari 13</td>
<td align="center"><img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Android_logo_2019_%28stacked%29.svg" alt="" width="64" height="64"><br> Android 10</td>
<td align="center"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/IOS_13_logo.svg" alt="" width="64" height="64"><br> iOS 13</td>
</tr>
</table>

## Upgrading from version 0.x to version 1.x?

See the full [Release Notes](https://github.com/isomorphic-git/isomorphic-git/releases/tag/v1.0.0) on GitHub and the release [Blog Post](https://isomorphic-git.org/blog/2020/02/25/version-1-0-0).

## Install

You can install it from npm:

```
npm install --save isomorphic-git
```

## Getting Started

The "isomorphic" in `isomorphic-git` means that the same code runs in either the server or the browser.
That's tricky to do since git uses the file system and makes HTTP requests. Browsers don't have an `fs` module.
And node and browsers have different APIs for making HTTP requests!

So rather than relying on the `fs` and `http` modules, `isomorphic-git` lets you bring your own file system
and HTTP client.

If you're using `isomorphic-git` in node, you use the native `fs` module and the provided node HTTP client.

```js
// node.js example
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

const dir = path.join(process.cwd(), 'test-clone')
git.clone({ fs, http, dir, url: 'https://github.com/isomorphic-git/lightning-fs' }).then(console.log)
```

If you're using `isomorphic-git` in the browser, you'll need something that emulates the `fs` API.
The easiest to setup and most performant library is [LightningFS](https://github.com/isomorphic-git/lightning-fs) which is written and maintained by the same author and is part of the `isomorphic-git` suite.
If LightningFS doesn't meet your requirements, isomorphic-git should also work with [BrowserFS](https://github.com/jvilk/BrowserFS) and [Filer](https://github.com/filerjs/filer).
Instead of `isomorphic-git/http/node` this time import `isomorphic-git/http/web`:

```html
<script src="https://unpkg.com/@isomorphic-git/lightning-fs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script type="module">
import http from 'https://unpkg.com/isomorphic-git@beta/http/web/index.js'
const fs = new LightningFS('fs')

const dir = '/test-clone'
git.clone({ fs, http, dir, url: 'https://github.com/isomorphic-git/lightning-fs', corsProxy: 'https://cors.isomorphic-git.org' }).then(console.log)
</script>
```

If you're using ES module syntax, you can use either the default import for convenience, or named imports to benefit from tree-shaking if you are using a bundler:

```js
import git from 'isomorphic-git'
// or
import * as git from 'isomorphic-git'
// or
import {plugins, clone, commit, push} from 'isomorphic-git'
```

View the full [Getting Started guide](https://isomorphic-git.github.io/docs/quickstart.html) on the docs website.

Then check out the [Useful Snippets](https://isomorphic-git.org/docs/en/snippets) page, which includes even more sample code written by the community!

### CORS support

Unfortunately, due to the same-origin policy by default `isomorphic-git` can only clone from the same origin as the webpage it is running on. This is terribly inconvenient, as it means for all practical purposes cloning and pushing repos must be done through a proxy.

For this purpose, [@isomorphic-git/cors-proxy](https://github.com/isomorphic-git/cors-proxy) exists; which you can clone it or [`npm install`](https://www.npmjs.com/package/@isomorphic-git/cors-proxy) it. Alternatively, use CloudFlare workers, which can be setup without leaving the browser ([instructions](https://gist.github.com/tomlarkworthy/cf1d4ceabeabdb6d1628575ab3a83acf)).

For testing or small projects, you can also use [https://cors.isomorphic-git.org](https://cors.isomorphic-git.org) - a free proxy sponsored by [Clever Cloud](https://www.clever-cloud.com/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git).

We hope to get CORS headers added to all the major Git hosting platforms eventually, and will list the progress made here:

| Service             | Supports CORS requests                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gogs (self-hosted)  | [✔](https://isomorphic-git.github.io/blog/2018/04/07/gogs-adds-cors-headers-for-isomorphic-git.html)                                                                         |
| Gitea (self-hosted) | [✔](https://github.com/go-gitea/gitea/pull/5719)                                                                                                                             |
| Azure DevOps        | [✔](https://github.com/isomorphic-git/isomorphic-git/issues/678#issuecomment-452402740) (Usage Note: requires authentication)                        |
| Gitlab              | ❌ Our [PR](https://gitlab.com/gitlab-org/gitlab-workhorse/merge_requests/219) was rejected, but the [issue](https://gitlab.com/gitlab-org/gitlab/issues/20590) is still open! |
| Bitbucket           | ❌                                                                                                                                                                            |
| Github              | ❌                                                                                                                                                                            |

It is literally just two lines of code to add the CORS headers!! Easy stuff. Surely it will happen.

### `isogit` CLI

Isomorphic-git comes with a simple CLI tool, named `isogit` because `isomorphic-git` is a lot to type. It is really just a thin shell that translates command line arguments into the equivalent JS API commands. So you should be able to run *any* current or future isomorphic-git commands using the CLI.

It always starts with an the assumption that the current working directory is a git root.
E.g. `{ dir: '.' }`.

It uses `minimisted` to parse command line options and will print out the equivalent JS command and pretty-print the output JSON.

The CLI is more of a lark for quickly testing `isomorphic-git` and isn't really meant as a `git` CLI replacement.

## Supported Git commands

This project follows semantic versioning, so we may continue to make changes to the API but they will always be backwards compatible
unless there is a major version bump.

### commands

<!-- API-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- autogenerated_by: __tests__/__helpers__/generate-docs.cjs -->

- [abortMerge](https://isomorphic-git.github.io/docs/abortMerge.html)
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
- [fastForward](https://isomorphic-git.github.io/docs/fastForward.html)
- [fetch](https://isomorphic-git.github.io/docs/fetch.html)
- [findMergeBase](https://isomorphic-git.github.io/docs/findMergeBase.html)
- [findRoot](https://isomorphic-git.github.io/docs/findRoot.html)
- [getConfig](https://isomorphic-git.github.io/docs/getConfig.html)
- [getConfigAll](https://isomorphic-git.github.io/docs/getConfigAll.html)
- [getRemoteInfo](https://isomorphic-git.github.io/docs/getRemoteInfo.html)
- [getRemoteInfo2](https://isomorphic-git.github.io/docs/getRemoteInfo2.html)
- [hashBlob](https://isomorphic-git.github.io/docs/hashBlob.html)
- [indexPack](https://isomorphic-git.github.io/docs/indexPack.html)
- [init](https://isomorphic-git.github.io/docs/init.html)
- [isDescendent](https://isomorphic-git.github.io/docs/isDescendent.html)
- [isIgnored](https://isomorphic-git.github.io/docs/isIgnored.html)
- [listBranches](https://isomorphic-git.github.io/docs/listBranches.html)
- [listFiles](https://isomorphic-git.github.io/docs/listFiles.html)
- [listNotes](https://isomorphic-git.github.io/docs/listNotes.html)
- [listRefs](https://isomorphic-git.github.io/docs/listRefs.html)
- [listRemotes](https://isomorphic-git.github.io/docs/listRemotes.html)
- [listServerRefs](https://isomorphic-git.github.io/docs/listServerRefs.html)
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
- [renameBranch](https://isomorphic-git.github.io/docs/renameBranch.html)
- [resetIndex](https://isomorphic-git.github.io/docs/resetIndex.html)
- [resolveRef](https://isomorphic-git.github.io/docs/resolveRef.html)
- [setConfig](https://isomorphic-git.github.io/docs/setConfig.html)
- [stash](https://isomorphic-git.github.io/docs/stash.html)
- [status](https://isomorphic-git.github.io/docs/status.html)
- [statusMatrix](https://isomorphic-git.github.io/docs/statusMatrix.html)
- [tag](https://isomorphic-git.github.io/docs/tag.html)
- [updateIndex](https://isomorphic-git.github.io/docs/updateIndex.html)
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

You'll need [node.js](https://nodejs.org) installed, but everything else is a devDependency.

```sh
git clone https://github.com/isomorphic-git/isomorphic-git
cd isomorphic-git
npm install
npm test
```

Check out the [`CONTRIBUTING`](./CONTRIBUTING.md) document for more instructions.

## Who is using isomorphic-git?

- [nde](https://nde.now.sh) - a futuristic next-generation web IDE
- [git-app-manager](https://git-app-manager.now.sh/) - install "unhosted" websites locally by git cloning them
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
their examples (and their modules!) we would not have been able to come even
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
    <td align="center"><a href="https://onename.com/wmhilton"><img src="https://avatars2.githubusercontent.com/u/587740?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>William Hilton</b></sub></a><br /><a href="#blog-wmhilton" title="Blogposts">📝</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Awmhilton" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Code">💻</a> <a href="#design-wmhilton" title="Design">🎨</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Documentation">📖</a> <a href="#example-wmhilton" title="Examples">💡</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton" title="Tests">⚠️</a> <a href="#tutorial-wmhilton" title="Tutorials">✅</a></td>
    <td align="center"><a href="https://github.com/wDhTIG"><img src="https://avatars2.githubusercontent.com/u/33748231?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>wDhTIG</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AwDhTIG" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/marbemac"><img src="https://avatars3.githubusercontent.com/u/847542?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Marc MacLeod</b></sub></a><br /><a href="#ideas-marbemac" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-marbemac" title="Funding Finding">🔍</a></td>
    <td align="center"><a href="http://brett-zamir.me"><img src="https://avatars3.githubusercontent.com/u/20234?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Brett Zamir</b></sub></a><br /><a href="#ideas-brettz9" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://mojavelinux.com"><img src="https://avatars2.githubusercontent.com/u/79351?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Dan Allen</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amojavelinux" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mojavelinux" title="Code">💻</a> <a href="#ideas-mojavelinux" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://TomasHubelbauer.net"><img src="https://avatars1.githubusercontent.com/u/6831144?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Tomáš Hübelbauer</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3ATomasHubelbauer" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=TomasHubelbauer" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/juancampa"><img src="https://avatars2.githubusercontent.com/u/1410520?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Juan Campa</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajuancampa" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=juancampa" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://iramiller.com"><img src="https://avatars2.githubusercontent.com/u/1041868?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Ira Miller</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Aisysd" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://rhys.arkins.net"><img src="https://avatars1.githubusercontent.com/u/6311784?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Rhys Arkins</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rarkins" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/TheLarkInn"><img src="https://avatars1.githubusercontent.com/u/3408176?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Sean Larkin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=TheLarkInn" title="Code">💻</a></td>
    <td align="center"><a href="https://daniel-ruf.de"><img src="https://avatars1.githubusercontent.com/u/827205?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Daniel Ruf</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DanielRuf" title="Code">💻</a></td>
    <td align="center"><a href="http://blog.bokuweb.me/"><img src="https://avatars0.githubusercontent.com/u/10220449?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>bokuweb</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/hirokiosame"><img src="https://avatars0.githubusercontent.com/u/1075694?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Hiroki Osame</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hirokiosame" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hirokiosame" title="Documentation">📖</a></td>
    <td align="center"><a href="http://jcubic.pl/me"><img src="https://avatars1.githubusercontent.com/u/280241?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Jakub Jankiewicz</b></sub></a><br /><a href="#question-jcubic" title="Answering Questions">💬</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajcubic" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jcubic" title="Code">💻</a> <a href="#example-jcubic" title="Examples">💡</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jcubic" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/howardgod"><img src="https://avatars1.githubusercontent.com/u/10459637?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>howardgod</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ahowardgod" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=howardgod" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/btyga"><img src="https://avatars3.githubusercontent.com/u/263378?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>burningTyger</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AburningTyger" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://melvincarvalho.com/#me"><img src="https://avatars2.githubusercontent.com/u/65864?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Melvin Carvalho</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=melvincarvalho" title="Documentation">📖</a></td>
    <td align="center"><img src="https://avatars2.githubusercontent.com/u/3035266?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>akaJes</b></sub><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=akaJes" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/dimasabanin"><img src="https://avatars2.githubusercontent.com/u/8316?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Dima Sabanin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Adsabanin" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=dsabanin" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/mizchi"><img src="https://avatars2.githubusercontent.com/u/73962?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Koutaro Chikuba</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amizchi" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mizchi" title="Code">💻</a></td>
    <td align="center"><a href="https://www.hsablonniere.com/"><img src="https://avatars2.githubusercontent.com/u/236342?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Hubert SABLONNIÈRE</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hsablonniere" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hsablonniere" title="Tests">⚠️</a> <a href="#ideas-hsablonniere" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-hsablonniere" title="Funding Finding">🔍</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/DeltaEvo"><img src="https://avatars1.githubusercontent.com/u/8864716?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>David Duarte</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DeltaEvo" title="Code">💻</a></td>
    <td align="center"><a href="http://stoplight.io/"><img src="https://avatars2.githubusercontent.com/u/2294309?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Thomas Pytleski</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Apytlesk4" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=pytlesk4" title="Code">💻</a></td>
    <td align="center"><a href="http://linkedin.com/in/vmarkovtsev"><img src="https://avatars3.githubusercontent.com/u/2793551?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Vadim Markovtsev</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Avmarkovtsev" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://yuhr.org"><img src="https://avatars0.githubusercontent.com/u/18474125?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Yu Shimura</b></sub></a><br /><a href="#ideas-yuhr" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yuhr" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yuhr" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/pyramation"><img src="https://avatars1.githubusercontent.com/u/545047?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Dan Lynch</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=pyramation" title="Code">💻</a></td>
    <td align="center"><a href="https://www.jeffreywescott.com/"><img src="https://avatars3.githubusercontent.com/u/130597?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Jeffrey Wescott</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajeffreywescott" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jeffreywescott" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zebzhao"><img src="https://avatars2.githubusercontent.com/u/5515758?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>zebzhao</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=zebzhao" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/tilersmyth"><img src="https://avatars2.githubusercontent.com/u/8736328?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Tyler Smith</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Atilersmyth" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/beeman"><img src="https://avatars3.githubusercontent.com/u/36491?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Bram Borggreve</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Abeeman" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/stefan-guggisberg"><img src="https://avatars1.githubusercontent.com/u/1543625?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Stefan Guggisberg</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Astefan-guggisberg" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=stefan-guggisberg" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=stefan-guggisberg" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/katakonst"><img src="https://avatars2.githubusercontent.com/u/6519792?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Catalin Pirvu</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=katakonst" title="Code">💻</a></td>
    <td align="center"><a href="http://web.engr.oregonstate.edu/~nelsonni/"><img src="https://avatars1.githubusercontent.com/u/6432572?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Nicholas Nelson</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=nelsonni" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=nelsonni" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://twitter.com/addaleax"><img src="https://avatars2.githubusercontent.com/u/899444?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Anna Henningsen</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=addaleax" title="Code">💻</a></td>
    <td align="center"><a href="https://hen.ne.ke"><img src="https://avatars0.githubusercontent.com/u/4312191?v=4&s=60?s=60" width="60px;" alt=""/><br /><sub><b>Fabian Henneke</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AFabianHenneke" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=FabianHenneke" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/djencks"><img src="https://avatars2.githubusercontent.com/u/569822?v=4?s=60" width="60px;" alt=""/><br /><sub><b>djencks</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Adjencks" title="Bug reports">🐛</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=djencks" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=djencks" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://justamouse.com"><img src="https://avatars0.githubusercontent.com/u/1086421?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Clemens Wolff</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=c-w" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://sojin.io"><img src="https://avatars1.githubusercontent.com/u/3102175?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Sojin Park</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=raon0211" title="Code">💻</a></td>
    <td align="center"><a href="http://eaf4.com"><img src="https://avatars0.githubusercontent.com/u/319282?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Edward Faulkner</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=ef4" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/KSXGitHub"><img src="https://avatars2.githubusercontent.com/u/11488886?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Khải</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AKSXGitHub" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://crutchcorn.dev/"><img src="https://avatars0.githubusercontent.com/u/9100169?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Corbin Crutchley</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=crutchcorn" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=crutchcorn" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=crutchcorn" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/snowyu"><img src="https://avatars1.githubusercontent.com/u/327887?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Riceball LEE</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=snowyu" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=snowyu" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=snowyu" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://onetwo.ren/"><img src="https://avatars1.githubusercontent.com/u/3746270?v=4?s=60" width="60px;" alt=""/><br /><sub><b>lin onetwo</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=linonetwo" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/linfaxin"><img src="https://avatars2.githubusercontent.com/u/3705017?v=4?s=60" width="60px;" alt=""/><br /><sub><b>林法鑫</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Alinfaxin" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/willstott101"><img src="https://avatars2.githubusercontent.com/u/335152?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Will Stott</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=willstott101" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=willstott101" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://mtnspring.org/"><img src="https://avatars2.githubusercontent.com/u/223277?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Seth Nickell</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Asnickell" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://www.alextitarenko.me/"><img src="https://avatars0.githubusercontent.com/u/3290313?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Alex Titarenko</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=alex-titarenko" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mmkal"><img src="https://avatars2.githubusercontent.com/u/15040698?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Misha Kaletsky</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mmkal" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/rczulch"><img src="https://avatars1.githubusercontent.com/u/54646976?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Richard C. Zulch</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rczulch" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rczulch" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://scrapbox.io/mkizka/README"><img src="https://avatars.githubusercontent.com/u/30231179?v=4?s=60" width="60px;" alt=""/><br /><sub><b>mkizka</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mkizka" title="Code">💻</a></td>
    <td align="center"><a href="https://ryotak.me/"><img src="https://avatars.githubusercontent.com/u/49341894?v=4?s=60" width="60px;" alt=""/><br /><sub><b>RyotaK</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3ARy0taK" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/strangedev"><img src="https://avatars.githubusercontent.com/u/3045979?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Noah Hummel</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=strangedev" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=strangedev" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/mtlewis"><img src="https://avatars.githubusercontent.com/u/542836?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Mike Lewis</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mtlewis" title="Documentation">📖</a></td>
    <td align="center"><a href="https://twitter.com/SamVerschueren"><img src="https://avatars.githubusercontent.com/u/1913805?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Sam Verschueren</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=SamVerschueren" title="Code">💻</a></td>
    <td align="center"><a href="http://vitorluizc.github.io/"><img src="https://avatars.githubusercontent.com/u/9027363?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Vitor Luiz Cavalcanti</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=VitorLuizC" title="Documentation">📖</a></td>
    <td align="center"><a href="https://www.platformdemos.com/"><img src="https://avatars.githubusercontent.com/u/4261788?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Shane McLaughlin</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mshanemc" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mshanemc" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=mshanemc" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/seanpoulter"><img src="https://avatars.githubusercontent.com/u/2585460?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Sean Poulter</b></sub></a><br /><a href="#maintenance-seanpoulter" title="Maintenance">🚧</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=seanpoulter" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=seanpoulter" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=seanpoulter" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/araknast"><img src="https://avatars.githubusercontent.com/u/84164531?v=4?s=60" width="60px;" alt=""/><br /><sub><b>araknast</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=araknast" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=araknast" title="Tests">⚠️</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=araknast" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/rraab-dev"><img src="https://avatars.githubusercontent.com/u/53948988?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Rafael Raab</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rraab-dev" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=rraab-dev" title="Documentation">📖</a></td>
    <td align="center"><a href="https://gitlab.com/CoalZombik/"><img src="https://avatars.githubusercontent.com/u/49895741?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Lukáš Cezner</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=CoalZombik" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=CoalZombik" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=CoalZombik" title="Tests">⚠️</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3ACoalZombik" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/dead-end"><img src="https://avatars.githubusercontent.com/u/30635084?v=4?s=60" width="60px;" alt=""/><br /><sub><b>dead-end</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=dead-end" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=dead-end" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=dead-end" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/barry963"><img src="https://avatars.githubusercontent.com/u/5289896?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Barry</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=barry963" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=barry963" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=barry963" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://stackoverflow.com/users/1493081/alireza-mirian"><img src="https://avatars.githubusercontent.com/u/3150694?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Alireza Mirian</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=alirezamirian" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=alirezamirian" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=alirezamirian" title="Tests">⚠️</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Aalirezamirian" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/DanilKazanov"><img src="https://avatars.githubusercontent.com/u/139755256?v=4?s=60" width="60px;" alt=""/><br /><sub><b>DanilKazanov</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DanilKazanov" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DanilKazanov" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=DanilKazanov" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://api.github.com/users/hisco"><img src="https://avatars.githubusercontent.com/u/39222286?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Eyal Hisco</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ahisco" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/scolladon"><img src="https://avatars.githubusercontent.com/u/522422?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Sebastien</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=scolladon" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/yarikoptic"><img src="https://avatars.githubusercontent.com/u/39889?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Yaroslav Halchenko</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=yarikoptic" title="Documentation">📖</a></td>
    <td align="center"><a href="https://alex-v.blog/"><img src="https://avatars.githubusercontent.com/u/716334?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Alex Villarreal</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=alexvy86" title="Code">💻</a></td>
    <td align="center"><a href="http://www.codeproject.com/script/Articles/MemberArticles.aspx?amid=62372"><img src="https://avatars.githubusercontent.com/u/865809?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Modesty Zhang</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=modesty" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=modesty" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=modesty" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/amrc-benmorrow"><img src="https://avatars.githubusercontent.com/u/120477944?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Ben Morrow</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=amrc-benmorrow" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jayree"><img src="https://avatars.githubusercontent.com/u/14836154?v=4?s=60" width="60px;" alt=""/><br /><sub><b>jayree</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jayree" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=jayree" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/lsegurado"><img src="https://avatars.githubusercontent.com/u/27731047?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Lucas Martin Segurado</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=lsegurado" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Alsegurado" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/limond"><img src="https://avatars.githubusercontent.com/u/1025682?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Leon Kaucher</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=limond" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=limond" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/gilisho"><img src="https://avatars.githubusercontent.com/u/40733156?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Gili Shohat</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=gilisho" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=gilisho" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=gilisho" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/hhourani27"><img src="https://avatars.githubusercontent.com/u/61935766?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Habib</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hhourani27" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hhourani27" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=hhourani27" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/Vinzent03"><img src="https://avatars.githubusercontent.com/u/63981639?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Vinzent</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=Vinzent03" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/LokiMidgard"><img src="https://avatars.githubusercontent.com/u/389101?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Patrick Kranz</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=LokiMidgard" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=LokiMidgard" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=LokiMidgard" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/lukecotter"><img src="https://avatars.githubusercontent.com/u/4013877?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Luke Cotter</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=lukecotter" title="Code">💻</a></td>
    <td align="center"><a href="https://tomlarkworthy.endpointservices.net/"><img src="https://avatars.githubusercontent.com/u/1848162?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Tom Larkworthy</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=tomlarkworthy" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/kofta999"><img src="https://avatars.githubusercontent.com/u/99273340?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Mostafa Mahmoud</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=kofta999" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=kofta999" title="Tests">⚠️</a> <a href="#question-kofta999" title="Answering Questions">💬</a></td>
    <td align="center"><a href="https://github.com/ARBhosale"><img src="https://avatars.githubusercontent.com/u/26981417?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Aniket Bhosale</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=ARBhosale" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=ARBhosale" title="Documentation">📖</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=ARBhosale" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/gnillev"><img src="https://avatars.githubusercontent.com/u/8965094?v=4?s=60" width="60px;" alt=""/><br /><sub><b>Mathias Nisted Velling</b></sub></a><br /><a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=gnillev" title="Code">💻</a> <a href="https://github.com/isomorphic-git/isomorphic-git/commits?author=gnillev" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/acandoo"><img src="https://avatars.githubusercontent.com/u/117209328?v=4?s=60" width="60px;" alt=""/><br /><sub><b>acandoo</b></sub></a><br /><a href="#platform-acandoo" title="Packaging/porting to new platform">📦</a> <a href="#userTesting-acandoo" title="User Testing">📓</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
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
