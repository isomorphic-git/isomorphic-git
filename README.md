# esgit [![Build Status](https://travis-ci.org/wmhilton/esgit.svg?branch=master)](https://travis-ci.org/wmhilton/esgit)
Node library for interacting with git repositories, circa 2017

# Progress
- [x] git init
- [x] git clone
  - [x] Github API protocol (only signed commits)
  - [ ] HTTP smart protocol + cors-buster
- [x] git checkout
- [x] git list (ls-files)
- [x] git add
- [x] git remove
- [ ] git status
- [x] git commit
- [ ] git push
- [ ] git diff
- [ ] git merge
- [x] `esgit` CLI

Note: There appears to be no a way to *push* signed commits back to Github using their API (v3 or v4), so I think we will have to use smart HTTP, packfiles, and an anti-CORS proxy.

## High-level API (unstable)

This is analogous to the "porcelain" git commands. There is a single function `git()` that serves as a fluent command builder.

Examples:

```js
import git from 'esgit'

// Create a new empty repo
git('test').init()

// Clone from a Github repository to the current working directory.
// Just like it's counterpart, clone is really just shorthand for git.init(); git.fetch(); git.checkout();
git('.').githubToken(process.env.GITHUB_TOKEN).clone('https://github.com/wmhilton/esgit')

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
  .add('a.txt')
  .author('Mr. Test')
  .email('mrtest@example.com')
  .signingKey('-----BEGIN PGP PRIVATE KEY BLOCK-----...')
  .commit('Added the a.txt file')

// TODO: git.merge(), git.pull(), git.push(), git.status(), git.diff(), git.tag(), git.branch(), etc

// And if you need to work with bare repos there are
// equivalents to the `--git-dir` and `--work-tree` options
git().gitdir('my-bare-repo').workdir('/var/www/website')
```

### CLI

I realized I could "translate" command line options into JavaScript chained commands
without hard-coding any knowledge of the API if I kept the chained commands very predictable.
I built a purely a generic translator and it worked surprisingly well.
So you can do *any* current or future esgit commands using the included `esgit` CLI.
It always starts with an implicit `git('.')` so it defaults to working in the
current working directory.

```
// Create a new empty repo
esgit --gitdir=test init

// Clone from a Github repository to the current working directory.
// Just like it's counterpart, clone is really just shorthand for git.init(); git.fetch(); git.checkout();
esgit --githubToken=$GITHUB_TOKEN clone https://github.com/wmhilton/esgit

// Checkout a commitish
esgit checkout master

// List files in the index
esgit list

// Add files to the index
esgit add README.md

// Remove files from the index
esgit remove .env

// Create a new commit (there's actually several more options for date, committer)
esgit add a.txt
esgit --author='Mr. Test' --email=mrtest@example.com --signingKey="$(cat private.key)" commit 'Added the a.txt file'

// And if you need to work with bare repos there are
// equivalents to the `--git-dir` and `--work-tree` options
esgit --gitdir=my-bare-repo --workdir=/var/www/website
```

## Low-level API (also unstable)

The high-level makes some assumptions (like you have a file-system and network access) that might not be well suited
to your embedded git-based concept thingy. Fear not! I am
purposefully building this library as a series of small modules
so you can pick and choose features as you need them.

### Individual commands

Each command is available as its own file, so hopefully with
a bit of finagling you will be able to do:

```js
const add = require('esgit/lib/commands/add.js')
const checkout = require('esgit/lib/commands/checkout.js')
const config = require('esgit/lib/commands/config.js')
const fetch = require('esgit/lib/commands/fetch.js')
const init = require('esgit/lib/commands/init.js')
const list = require('esgit/lib/commands/list.js')
const remove = require('esgit/lib/commands/remove.js')

// Example
checkout({
  workdir: '.',
  gitdir: '.git',
  ref: 'master',
  remote: 'origin'
})
.then()

```

### Individual objects

Only interested in commit objects? Import just the GitCommit class. And so on:

```js
const GitBlob = require('esgit/lib/models/GitBlob.js')
const GitCommit = require('esgit/lib/models/GitCommit.js')
const GitTree = require('esgit/lib/models/GitTree.js')
const GitObject = require('esgit/lib/models/GitObject.js')

// Example
const commit = GitCommit.from(`tree 0370383003493b845c73fb4316355a18f0e346fe
parent c9efafe888804a58e333ec1b64ca58f9c4c92414
author Will Hilton <wmhilton@gmail.com> 1503898987 -0400
committer Will Hilton <wmhilton@gmail.com> 1503899426 -0400
gpgsig -----BEGIN PGP SIGNATURE-----
 Version: GnuPG v1

 iQIcBAABAgAGBQJZo68iAAoJEJYJuKWSi6a5WesP/31Ie7uNJcLU1+yEch1ubuhS
 J9PfAna2iUflQANNq8BCyufW8Nq3ZA+nyRvaA499VqLkiuEI6nMUwWVPdhuYUG4s
 P7QP85NXn1w1DRNfbb2K6USz40P3a108GqhOpDCLP55kRfcxyJZIymD/WtHKji7T
 3ubE0meMYHOsx9a76Roo9DOHiqy3gAZsiwqvvqToD/IrmPmRv3qCqFBPrKKMW7la
 DZGPFHV9bhJfaGTT42lu0vTjv5itdLwfCLReh3LuQ1TAq5b6hhvwguE+M+X8qA11
 KXxxyQf06wt3+o8pjxxUHttVsuiS68yxzeTQOWe8pk/E5oaEqOx6O9stDvSfZatm
 2LvFR++0axDMANluuStAoDhTMrqUqLQ3iWeay+xpivrP7mWnLM/bzrPShQVSkFPP
 VkKedKiaaCGKTEY4xa/RBQvQ3WqDnNogY5t6bOolPvC5/D5n3grkzOpI7WQqh8EN
 +6eYOOYTTPShi5gnBTSwFdSBKG4aWJI5moQtQJ1wQtc4Zhm4jKbp7OLPn1GJEET6
 QwnURymv4mkDuvyPUki5nsP5U+xzWObp8PlqE4SCbSiV4D5FqF5uVmeh4E15WsTP
 y2l3fT2JUVecDXOLot3MSceiakrgoKNsYQlM+e/+XHwuZ41nZ/OuSCBGjhRn0UDI
 1qMqffk5gWiTsZFwLjBV
 =gsxy
 -----END PGP SIGNATURE-----

Add a .git/index parserializer`)

commit.parseHeaders()
/*
{ tree: '0370383003493b845c73fb4316355a18f0e346fe',
  parent: [ 'c9efafe888804a58e333ec1b64ca58f9c4c92414' ],
  author:
   { name: 'Will Hilton',
     email: 'wmhilton@gmail.com',
     timestamp: 1503898987,
     timezoneOffset: 240 },
  committer:
   { name: 'Will Hilton',
     email: 'wmhilton@gmail.com',
     timestamp: 1503899426,
     timezoneOffset: 240 },
  gpgsig: '-----BEGIN PGP SIGNATURE-----\nVersion: GnuPG v1' }
*/
```

