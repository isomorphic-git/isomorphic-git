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
[![Build Status](https://travis-ci.org/isomorphic-git/isomorphic-git.svg?branch=master)](https://travis-ci.org/isomorphic-git/isomorphic-git)
[![codecov](https://codecov.io/gh/isomorphic-git/isomorphic-git/branch/master/graph/badge.svg)](https://codecov.io/gh/isomorphic-git/isomorphic-git)
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

</td></tr></table>

`isomorphic-git` is a pure JavaScript implementation of git that works in node and browser environments (including WebWorkers and ServiceWorkers). This means it can be used to read and write to to git repositories, as well as fetch from and push to git remotes like Github.

Isomorphic-git aims for 100% interoperability with the canonical git implementation. This means it does all its operations by modifying files in a ".git" directory just like the git you are used to. The included `isogit` CLI can operate on git repositories on your desktop or server.

`isomorphic-git` aims to be a complete solution with no assembly required.
I've tried carefully to design the API so it is easy to use all the features, without paying a penalty in bundle size.
By providing functionality as separate functions instead of an object oriented API, code bundlers like Webpack will only include the functionality your application actually uses. (Or at least that's the goal.)

I am working on adding type definitions so you can enjoy static type-checking and intelligent code completion in editors like [CodeSandbox](https://codesandbox.io).

## Getting Started

The "isomorphic" in `isomorphic-git` means it works equally well on the server or the browser.
That's tricky to do since git uses the file system, and browsers don't have an `fs` module.
So rather than relying on the `fs` module, `isomorphic-git` is BYOFS (Bring Your Own File System).
When creating a new Git object, you pass it the `fs` module to use.

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

- Gogs: [Supported in v0.11.43](https://isomorphic-git.github.io/blog/2018/04/07/gogs-adds-cors-headers-for-isomorphic-git.html)
- Gitlab: [PR Add CORS headers to git clone and git push #219](https://gitlab.com/gitlab-org/gitlab-workhorse/merge_requests/219)
- Bitbucket: PR TODO
- Github: PR TODO

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
- [branch](https://isomorphic-git.github.io/docs/branch.html)
- [checkout](https://isomorphic-git.github.io/docs/checkout.html)
- [clone](https://isomorphic-git.github.io/docs/clone.html)
- [commit](https://isomorphic-git.github.io/docs/commit.html)
- [config](https://isomorphic-git.github.io/docs/config.html)
- [fetch](https://isomorphic-git.github.io/docs/fetch.html)
- [findRoot](https://isomorphic-git.github.io/docs/findRoot.html)
- [getRemoteInfo](https://isomorphic-git.github.io/docs/getRemoteInfo.html)
- [indexPack](https://isomorphic-git.github.io/docs/indexPack.html)
- [init](https://isomorphic-git.github.io/docs/init.html)
- [listBranches](https://isomorphic-git.github.io/docs/listBranches.html)
- [listFiles](https://isomorphic-git.github.io/docs/listFiles.html)
- [listTags](https://isomorphic-git.github.io/docs/listTags.html)
- [log](https://isomorphic-git.github.io/docs/log.html)
- [merge](https://isomorphic-git.github.io/docs/merge.html)
- [pull](https://isomorphic-git.github.io/docs/pull.html)
- [push](https://isomorphic-git.github.io/docs/push.html)
- [readObject](https://isomorphic-git.github.io/docs/readObject.html)
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

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars2.githubusercontent.com/u/587740?v=4" width="100px;"/><br /><sub><b>William Hilton</b></sub>](https://onename.com/wmhilton)<br />[📝](#blog-wmhilton "Blogposts") [🐛](https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Awmhilton "Bug reports") [💻](https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton "Code") [🎨](#design-wmhilton "Design") [📖](https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton "Documentation") [💡](#example-wmhilton "Examples") [⚠️](https://github.com/isomorphic-git/isomorphic-git/commits?author=wmhilton "Tests") [✅](#tutorial-wmhilton "Tutorials") | [<img src="https://avatars2.githubusercontent.com/u/33748231?v=4" width="100px;"/><br /><sub><b>wDhTIG</b></sub>](https://github.com/wDhTIG)<br />[🐛](https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3AwDhTIG "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/847542?v=4" width="100px;"/><br /><sub><b>Marc MacLeod</b></sub>](https://github.com/marbemac)<br />[🤔](#ideas-marbemac "Ideas, Planning, & Feedback") [🔍](#fundingFinding-marbemac "Funding Finding") | [<img src="https://avatars3.githubusercontent.com/u/20234?v=4" width="100px;"/><br /><sub><b>Brett Zamir</b></sub>](http://brett-zamir.me)<br />[🤔](#ideas-brettz9 "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/79351?v=4" width="100px;"/><br /><sub><b>Dan Allen</b></sub>](http://mojavelinux.com)<br />[🐛](https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Amojavelinux "Bug reports") [🤔](#ideas-mojavelinux "Ideas, Planning, & Feedback") | [<img src="https://avatars1.githubusercontent.com/u/6831144?v=4" width="100px;"/><br /><sub><b>Tomáš Hübelbauer</b></sub>](https://TomasHubelbauer.net)<br />[🐛](https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3ATomasHubelbauer "Bug reports") [💻](https://github.com/isomorphic-git/isomorphic-git/commits?author=TomasHubelbauer "Code") | [<img src="https://avatars2.githubusercontent.com/u/1410520?v=4" width="100px;"/><br /><sub><b>Juan Campa</b></sub>](https://github.com/juancampa)<br />[🐛](https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Ajuancampa "Bug reports") |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [<img src="https://avatars2.githubusercontent.com/u/1041868?v=4" width="100px;"/><br /><sub><b>Ira Miller</b></sub>](http://iramiller.com)<br />[🐛](https://github.com/isomorphic-git/isomorphic-git/issues?q=author%3Aisysd "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/6311784?v=4" width="100px;"/><br /><sub><b>Rhys Arkins</b></sub>](http://rhys.arkins.net)<br />[💻](https://github.com/isomorphic-git/isomorphic-git/commits?author=rarkins "Code") | [<img src="https://avatars1.githubusercontent.com/u/3408176?v=4" width="100px;"/><br /><sub><b>Sean Larkin</b></sub>](http://twitter.com/TheLarkInn)<br />[💻](https://github.com/isomorphic-git/isomorphic-git/commits?author=TheLarkInn "Code") | [<img src="https://avatars1.githubusercontent.com/u/827205?v=4" width="100px;"/><br /><sub><b>Daniel Ruf</b></sub>](https://daniel-ruf.de)<br />[💻](https://github.com/isomorphic-git/isomorphic-git/commits?author=DanielRuf "Code") | [<img src="https://avatars0.githubusercontent.com/u/10220449?v=4" width="100px;"/><br /><sub><b>bokuweb</b></sub>](http://blog.bokuweb.me/)<br />[💻](https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb "Code") [⚠️](https://github.com/isomorphic-git/isomorphic-git/commits?author=bokuweb "Tests") |
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
