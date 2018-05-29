# ⊱⋅──────⋅⊱ Contributing to isomorphic-git ⊰⋅──────⋅⊰

Oh wow! Thanks for opening up Pull Request! :grin: :tada:

You are very welcome here and any contribution is appreciated. :+1:

## New feature checklists :sparkles:️
(This is the same as the stuff in the CONTRIBUTING.md file)

To add an argument to an existing command:

- [ ] add parameter to the function in `src/commands/X.js`
- [ ] add parameter to [docs](https://github.com/isomorphic-git/isomorphic-git.github.io/tree/source/docs)/X.md
- [ ] add parameter to the TypeScript library definition for X in `src/index.d.ts`
- [ ] add a test case in `__tests__/test-X.js` if possible
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] make a feature commit "feat: Added new 'bar' argument to X"

To create a new command:

- [ ] add as a new file in `src/commands`
  - [ ] add command to `src/commands.js`
- [ ] add command to README list of commands
- [ ] add TypeScript definition in `src/index.d.ts`
- [ ] create a new doc page [docs](https://github.com/isomorphic-git/isomorphic-git.github.io/tree/source/docs)/X.md
  - [ ] add page to the [Alphabetical Index](https://github.com/isomorphic-git/isomorphic-git.github.io/blob/source/docs/alphabetic.md)
  - [ ] add page to the [sidebar](https://github.com/isomorphic-git/isomorphic-git.github.io/blob/source/website/sidebars.json)
- [ ] create a test in `src/__tests__`
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] make a feature commit "feat: Added 'X' command"
