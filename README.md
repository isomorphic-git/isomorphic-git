# esgit
Node library for interacting with git repositories, circa 2017

OH. SHIT. I just remembered why I stopped working on wikiboard. There's
not a way to *push* signed commits back to Github using their API.

# Progress
- [x] git init
- [x] git clone
  - [x] Github API protocol (only signed commits)
  - [ ] HTTP smart protocol + cors-buster
- [x] git checkout
- [ ] git index
  - [x] git list (ls-files)
  - [x] git add
  - [x] git remove
- [ ] git commit
- [ ] git push
