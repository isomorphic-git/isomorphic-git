# ⊱⋅──────⋅⊱ Contributing to isomorphic-git ⊰⋅──────⋅⊰

Oh wow! Thanks for opening up the contributing file! :grin: :tada:

You are very welcome here and any contribution is appreciated. :+1:

## New feature checklists :sparkles:️
I'm honestly documenting these steps just so I don't forget them myself.

To add a parameter to an existing command `X`:

- [ ] add parameter to the function in `src/commands/X.js`
- [ ] add parameter to [docs](https://github.com/isomorphic-git/isomorphic-git.github.io/tree/source/docs)/X.md
- [ ] add parameter to the TypeScript library definition for X in `src/index.d.ts`
- [ ] add a test case in `__tests__/test-X.js` if possible
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] make a feature commit "feat: Added 'bar' parameter to X command"

To create a new command:

- [ ] add as a new file in `src/commands`
- [ ] add command to `src/index.js`
- [ ] add TypeScript definition in `src/index.d.ts`
- [ ] update `__tests__/__snapshots__/test-exports.js.snap`
- [ ] add command to README list of commands
- [ ] create a test in `src/__tests__`
- [ ] create a new doc page [docs](https://github.com/isomorphic-git/isomorphic-git.github.io/tree/source/docs)/X.md
  - [ ] add page to the [Alphabetical Index](https://github.com/isomorphic-git/isomorphic-git.github.io/blob/source/docs/alphabetic.md)
  - [ ] add page to the [sidebar](https://github.com/isomorphic-git/isomorphic-git.github.io/blob/source/website/sidebars.json)
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] make a feature commit "feat: Added 'X' command"

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
