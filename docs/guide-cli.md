---
id: cli
title: isogit CLI
sidebar_label: isogit CLI
---

Isomorphic-git comes with a simple CLI tool, named "isogit" because "isomorphic-git" is a lot to type.
It is really just a thin shell that translates command line arguments into the equivalent JS API commands,
so you should be able to run any current *or future* isomorphic-git commands using the CLI.

It always assumes two of the arguments:
- `fs` is node's native `fs` module
- `dir` is the current working directory

The first argument is the name of the command and then command line option flags to generate the argument object.

Example:

```sh
isogit clone --url=https://github.com/isomorphic-git/isomorphic-git --depth=1 --singleBranch
```

will run

```js
git.clone({
  fs: require('fs'),
  dir: process.cwd(),
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  depth: 1,
  singleBranch: true
})
```

For commands like `git.log` which return JSON, it pretty-prints the output.
