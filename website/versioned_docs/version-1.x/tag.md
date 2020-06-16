---
title: tag
sidebar_label: tag
id: version-1.x-tag
original_id: tag
---

Create a lightweight tag

| param          | type [= default]          | description                                                                                                                                         |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                                                                                                |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                                 |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                                          |
| **ref**        | string                    | What to name the tag                                                                                                                                |
| object         | string = 'HEAD'           | What oid the tag refers to. (Will resolve to oid if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used. |
| force          | boolean = false           | Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag.                                                       |
| return         | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                                                                       |

Example Code:

```js live
await git.tag({ fs, dir: '/tutorial', ref: 'test-tag' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/tag.js';
  }
})();
</script>