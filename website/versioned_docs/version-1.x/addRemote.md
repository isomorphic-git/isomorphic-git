---
title: addRemote
sidebar_label: addRemote
id: version-1.x-addRemote
original_id: addRemote
---

Add or update a remote

| param          | type [= default] | description                                                                                            |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| [**fs**](./fs) | FsClient         | a file system implementation                                                                           |
| dir            | string           | The [working tree](dir-vs-gitdir.md) directory path                                                    |
| **gitdir**     | string           | The [git directory](dir-vs-gitdir.md) path                                                             |
| **remote**     | string           | The name of the remote                                                                                 |
| **url**        | string           | The URL of the remote                                                                                  |
| force          | boolean = false  | Instead of throwing an error if a remote named `remote` already exists, overwrite the existing remote. |
| return         | Promise\<void\>  | Resolves successfully when filesystem operations are complete                                          |

Example Code:

```js live
await git.addRemote({
  fs,
  dir: '/tutorial',
  remote: 'upstream',
  url: 'https://github.com/isomorphic-git/isomorphic-git'
})
console.log('done')
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/addRemote.js';
  }
})();
</script>