---
title: getConfig
sidebar_label: getConfig
id: version-1.x-getConfig
original_id: getConfig
---

Read an entry from the git config files.

| param          | type [= default]          | description                                         |
| -------------- | ------------------------- | --------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system implementation                        |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path          |
| **path**       | string                    | The key of the git config entry                     |
| return         | Promise\<any\>            | Resolves with the config value                      |

*Caveats:*
- Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
- The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.

Example Code:

```js live
// Read config value
let value = await git.getConfig({
  fs,
  dir: '/tutorial',
  path: 'remote.origin.url'
})
console.log(value)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/getConfig.js';
  }
})();
</script>