---
title: setConfig
sidebar_label: setConfig
id: version-1.x-setConfig
original_id: setConfig
---

Write an entry to the git config files.

| param          | type [= default]                                      | description                                                                                   |
| -------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                                              | a file system implementation                                                                  |
| dir            | string                                                | The [working tree](dir-vs-gitdir.md) directory path                                           |
| **gitdir**     | string = join(dir,'.git')                             | The [git directory](dir-vs-gitdir.md) path                                                    |
| **path**       | string                                                | The key of the git config entry                                                               |
| **value**      | string  &#124;  boolean  &#124;  number  &#124;  void | A value to store at that path. (Use `undefined` as the value to delete a config entry.)       |
| append         | boolean = false                                       | If true, will append rather than replace when setting (use with multi-valued config options). |
| return         | Promise\<void\>                                       | Resolves successfully when operation completed                                                |

*Caveats:*
- Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
- The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.

Example Code:

```js live
// Write config value
await git.setConfig({
  fs,
  dir: '/tutorial',
  path: 'user.name',
  value: 'Mr. Test'
})

// Print out config file
let file = await fs.promises.readFile('/tutorial/.git/config', 'utf8')
console.log(file)

// Delete a config entry
await git.setConfig({
  fs,
  dir: '/tutorial',
  path: 'user.name',
  value: undefined
})

// Print out config file
file = await fs.promises.readFile('/tutorial/.git/config', 'utf8')
console.log(file)
```


---

<details>
<summary><i>Tip: If you need a clean slate, expand and run this snippet to clean up the file system.</i></summary>

```js live
window.fs = new LightningFS('fs', { wipe: true })
window.pfs = window.fs.promises
console.log('done')
```
</details>

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/setConfig.js';
  }
})();
</script>