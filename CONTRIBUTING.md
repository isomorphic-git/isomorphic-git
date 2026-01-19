# ⊱⋅──────⋅⊱ Contributing to isomorphic-git ⊰⋅──────⋅⊰

Oh wow! Thanks for opening up the contributing file! :grin: :tada:

You are very welcome here and any contribution is appreciated. :+1:

# Tips

The code is written in "plain" JavaScript and as a rule of thumb shouldn't require transpilation. (The glaring exception being browser's lack of support for bare imports.)

## New feature checklists :sparkles:️
I'm honestly documenting these steps just so I don't forget them myself.

To add a parameter to an existing command `X`:

- [ ] add parameter to the function in `src/api/X.js` (and `src/commands/X.js` if necessary)
- [ ] document the parameter in the JSDoc comment above the function
- [ ] add a test case in `__tests__/test-X.js` if possible
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] squash merge the PR with commit message "feat(X): Added 'bar' parameter"
- [ ] see Appendix A below, about submodules

To create a new command:

- [ ] add as a new file in `src/api` (and `src/commands` if necessary)
- [ ] add command to `src/index.js` (named and/or default export)
- [ ] update `__tests__/__snapshots__/test-exports.js.snap`
- [ ] create a test in `src/__tests__`
- [ ] document the command with a JSDoc comment
- [ ] add page to the Docs Sidebar `website/sidebars.json`
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] squash merge the PR with commit message "feat: Added 'X' command"
- [ ] see Appendix A below, about submodules

# Overview

I have written this library as a series of layers that build upon one another and should tree-shake very well:

## commands

Each command is available as its own file, so you are able to import individual commands
if you only need a few in order to optimize your bundle size.

## managers

Managers are a level above models. They take care of implementation performance details like

- batching reads to and from the file system
- in-process concurrency locks
- lockfiles
- caching files and invalidating cached results
- reusing objects
- object memory pools

## everything else

These are the lowest level building blocks. They tend to be small, pure functions.

### models

Models generally have very few or no dependencies except for `'buffer'`.
This makes them portable to many different environments so they can be a useful lowest common denominator.

### utils

Utils are basically miscellaneous functions.

### storage

This folder contains code for reading and writing to the git "object store".
I'm hoping I can abstract it into a plugin interface at some point so that the plugin system can provide
alternative object stores that integrate seamlessly.

### wire

This folder contains the parsers and serializers for the Git wire protocol.
For a given thing, like an upload-pack command, there can be up to 4 different functions.

Client:
write[*]Request: (input: Object) -> stream
parse[*]Response: (input: stream) -> Object

Server:
parse[*]Request: (input: stream) -> Object
write[*]Response: (input: Object) -> stream

### How git works
If you want to contribute it may be useful if you understand how git works under the hood.
This is great article that shows the details:<br/>
[A Hacker's Guide to Git](https://wildlyinaccurate.com/a-hackers-guide-to-git/).<br/>
But as first the introduction you can watch this video:<br/>
[![Link to Video: Inside the Hidden Git Folder - Computerphile](https://img.youtube.com/vi/bSA91XTzeuA/0.jpg)](http://www.youtube.com/watch?v=bSA91XTzeuA)

And here is another advanced video:<br/>
[![Advanced Git: Graphs, Hashes, and Compression, Oh My!](https://img.youtube.com/vi/ig5E8CcdM9g/0.jpg)](https://www.youtube.com/watch?v=ig5E8CcdM9g)

Another resource is GitHub blog:
* [Git’s database internals I: packed object store](https://github.blog/2022-08-29-gits-database-internals-i-packed-object-store/)
* [Git’s database internals II: commit history queries](https://github.blog/2022-08-30-gits-database-internals-ii-commit-history-queries/)

And this description of .git directory:
* [What is in that .git directory?](https://blog.meain.io/2023/what-is-in-dot-git/)

There is also chapter in git Pro book
* [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)

You can also search [git in the blog of Julia Evans](https://duckduckgo.com/?q=site%3Ajvns.ca+git&ia=web).

## Appendix A, submodules

As of 2026, isomorphic-git supports commands run within submodules and so new contributions should take this into account. 

The quick TLDR summary is this: look in `__tests__` and you'll see there are two test files for every command, a regular one and an -in-submodule.js version. Make sure to include both.

The following discussion covers more details.

1. Modifying or adding `__tests__` to existing apis

Let's say the main file is `test-branch.js` and the corresponding submodule file is `test-branch-in-submodule.js`. After modifying or adding tests in `test-branch.js`, copy and paste identical code to `test-branch-in-submodule.js` since the new submodule tests will be mostly the same. Replace any instances of `makeFixture` with `makeFixtureAsSubmodule` in submodule tests. Prefer the plain variable `gitdir` in test files whenever possible, only swapping it to `gitdirsmfullpath` as a last resort if tests are failing and there is no other choice. `gitdirsmfullpath` is almost like "cheating" because it reveals to the testing code where the `gitdir` really is, but often that answer should be computed automatically, and not passed in.  

2. Creating new `__tests__` for brand new apis

Let's imagine "brancher" is a new API command. Place two new files in `__tests__` which are `test-brancher.js` and `test-brancher-in-submodule.js`. They should be mostly identical. For submodule tests, import and use `makeFixtureAsSubmodule` instead of `makeFixture`. See the notes above about the `gitdir` variable.

3. Creating new `src/api/` commands

In terms of submodule-related features, only modify `src/api/` files and not `src/commands/`. This is an architectural decision to keep logic at one layer of the stack, while other layers may remain unaffected. Review other files, the basic idea is to apply the `discoverGitdir` function, and never assume `gitdir` is right. Send the `gitdir` value through the `discoverGitdir` filter before passing it anywhere else. In a common situation, when submodules aren't used, the `discoverGitdir` filter will just send back the original value. If it turns out a submodule is used it will return the required information.  

4. Modifying existing `src/api/` commands

Depending on the situation, perhaps nothing must change. See the notes above regarding the `discoverGitdir` function.
