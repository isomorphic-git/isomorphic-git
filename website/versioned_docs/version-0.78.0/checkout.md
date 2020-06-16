---
title: checkout
sidebar_label: checkout
id: version-0.78.0-checkout
original_id: checkout
---

Checkout a branch

| param                | type [= default]          | description                                                                                                                       |
| -------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                                            |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                         |
| **dir**              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                               |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                        |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md)                                                         |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name                                                              |
| **ref**              | string                    | Which branch to checkout                                                                                                          |
| filepaths            | Array\<string\> = ['.']   | Limit the checkout to the given files and directories                                                                             |
| pattern              | string = null             | Only checkout the files that match a glob pattern. (Pattern is relative to `filepaths` if `filepaths` is provided.)               |
| remote               | string = 'origin'         | Which remote repository to use                                                                                                    |
| noCheckout           | boolean = false           | If true, will update HEAD but won't update the working directory                                                                  |
| noSubmodules         | boolean = false           | If true, will not print out an error about missing submodules support. TODO: Skip checkout out submodules when supported instead. |
| newSubmoduleBehavior | boolean = false           | If true, will opt into a newer behavior that improves submodule non-support by at least not accidentally deleting them.           |
| return               | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                                                     |

If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.

Example Code:

```js live
// checkout the master branch
await git.checkout({ dir: '$input((/))', ref: '$input((master))' })
console.log('done')
```

```js live
// checkout only JSON and Markdown files from master branch
await git.checkout({ dir: '$input((/))', ref: '$input((master))', pattern: '$input((**\/*.{json,md}))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/checkout.js';
  }
})();
</script>