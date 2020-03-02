---
id: version-1.x-cli
title: isogit CLI
sidebar_label: isogit CLI
original_id: cli
---

Isomorphic-git comes with a simple CLI tool, named "isogit" because "isomorphic-git" is a lot to type.
It is really just a thin shell that translates command line arguments into the equivalent JS API commands,
so you should be able to run any current *or future* isomorphic-git commands using the CLI.

It always assumes three of the arguments:
- `fs` is node's native `fs` module
- `http` is the `isomorphic-git/http/node` module
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
  http: require('isomorphic-git/http/node'),
  dir: process.cwd(),
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  depth: 1,
  singleBranch: true
})
```

Note that since authentication is done using the `onAuth` callback, you can't really do that at the moment.
I'm not sure there's a good way to provide callbacks to a CLI.

For commands like `git.log` which return JSON, it pretty-prints the output.
