---
title: listRemotes
sidebar_label: listRemotes
id: version-1.x-listRemotes
original_id: listRemotes
---

List remotes

| param          | type [= default]                                  | description                                                    |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                                          | a file system client                                           |
| dir            | string                                            | The [working tree](dir-vs-gitdir.md) directory path            |
| **gitdir**     | string = join(dir,'.git')                         | The [git directory](dir-vs-gitdir.md) path                     |
| return         | Promise\<Array\<{remote: string, url: string}\>\> | Resolves successfully with an array of `{remote, url}` objects |

Example Code:

```js live
let remotes = await git.listRemotes({ fs, dir: '/tutorial' })
console.log(remotes)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listRemotes.js';
  }
})();
</script>