<!-- Oh wow! Thanks for opening a pull request! 😁 🎉 -->
<!-- You are very welcome here and any contribution is appreciated. 👍 -->
<!-- Choose one of the checklists if it applies to you and delete the rest. -->

## I'm fixing a bug or typo

- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] squash merge the PR with commit message "fix: [Description of fix]"

## I'm adding a parameter to an existing command:

- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] add parameter to the function in `src/commands/X.js`
- [ ] document the parameter in the JSDoc comment above the function
- [ ] add parameter to the TypeScript library definition for X in `src/index.d.ts`
- [ ] add a test case in `__tests__/test-X.js` if possible
- [ ] squash merge the PR with commit message "feat: Added 'bar' parameter to X command"

## I'm adding a new command:

- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] add as a new file in `src/commands`
- [ ] add command to `src/index.js`
- [ ] add TypeScript definition in `src/index.d.ts`
- [ ] update `__tests__/__snapshots__/test-exports.js.snap`
- [ ] add command to README list of commands
- [ ] create a test in `src/__tests__`
- [ ] document the command with a JSDoc comment
  - [ ] add page to the [Alphabetical Index](https://github.com/isomorphic-git/isomorphic-git.github.io/blob/source/docs/alphabetic.md)
  - [ ] add page to the [sidebar](https://github.com/isomorphic-git/isomorphic-git.github.io/blob/source/website/sidebars.json)
- [ ] squash merge the PR with commit message "feat: Added 'X' command"
