---
title: fastCheckout
sidebar_label: fastCheckout
id: version-0.78.0-fastCheckout
original_id: fastCheckout
---

Checkout a branch

| param                | type [= default]          | description                                                                                                                                        |
| -------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                                                             |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                          |
| **dir**              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                                |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                                         |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md)                                                                          |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name                                                                               |
| ref                  | string = 'HEAD'           | Source to checkout files from                                                                                                                      |
| filepaths            | Array\<string\> = ['.']   | Limit the checkout to the given files and directories                                                                                              |
| remote               | string = 'origin'         | Which remote repository to use                                                                                                                     |
| noCheckout           | boolean = false           | If true, will update HEAD but won't update the working directory                                                                                   |
| noUpdateHead         | boolean                   | If true, will update the working directory but won't update HEAD. Defaults to `false` when `ref` is provided, and `true` if `ref` is not provided. |
| dryRun               | boolean = false           | If true, simulates a checkout so you can test whether it would succeed.                                                                            |
| force                | boolean = false           | If true, conflicts will be ignored and files will be overwritten regardless of local changes.                                                      |
| noSubmodules         | boolean = false           | If true, will not print out errors about missing submodules support.                                                                               |
| newSubmoduleBehavior | boolean = false           | If true, will opt into a newer behavior that improves submodule non-support by at least not accidentally deleting them.                            |
| return               | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                                                                      |

If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.

This is basically a next-gen rewrite of [checkout](./checkout.md) that has proper support for conflict detection, removing empty directories, etc.

I will probably replace checkout entirely in the 1.0 release with the `switch` and `restore` commands found in new versions of git.

Example Code:

```js live
// switch to the master branch
await git.fastCheckout({ dir: '$input((/))', ref: '$input((master))' })
console.log('done')
```

```js live
// restore the 'docs' and 'src/docs' folders to the way they were, overwriting any changes
await git.fastCheckout({ dir: '$input((/))', force: true, filepaths: ['docs', 'src/docs'] })
console.log('done')
```

```js live
// restore the 'docs' and 'src/docs' folders to the way they are in the 'develop' branch, overwriting any changes
await git.fastCheckout({ dir: '$input((/))', ref: 'develop', noUpdateHead: true, force: true, filepaths: ['docs', 'src/docs'] })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/fastCheckout.js';
  }
})();
</script>