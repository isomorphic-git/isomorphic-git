<!-- Oh wow! Thanks for opening a pull request! 😁 🎉 -->
<!-- You are very welcome here and any contribution is appreciated. 👍 -->
<!-- Choose one of the checklists if it applies to you and delete the rest. -->

## I'm fixing a bug or typo

- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] squash merge the PR with commit message "fix: [Description of fix]"

## I'm adding a parameter to an existing command X:

- [ ] add parameter to the function in `src/api/X.js` (and `src/commands/X.js` if necessary)
- [ ] document the parameter in the JSDoc comment above the function
- [ ] add a test case in `__tests__/test-X.js` if possible
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README

## I'm adding a new command:

- [ ] add as a new file in `src/api` (and `src/commands` if necessary)
- [ ] add command to `src/index.js`
- [ ] update `__tests__/test-exports.js`
- [ ] create a test in `src/__tests__`
- [ ] document the command with a JSDoc comment
- [ ] add page to the Docs Sidebar `website/sidebars.json`
- [ ] add page to the v1 Docs Sidebar `website/versioned_sidebars/version-1.x-sidebars.json`
- [ ] if this is your first time contributing, run `npm run add-contributor` and follow the prompts to add yourself to the README
- [ ] squash merge the PR with commit message "feat: Added 'X' command"
