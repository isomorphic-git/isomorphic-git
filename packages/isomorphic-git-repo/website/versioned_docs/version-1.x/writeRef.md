---
title: writeRef
sidebar_label: writeRef
id: version-1.x-writeRef
original_id: writeRef
---

Write a ref which refers to the specified SHA-1 object id, or a symbolic ref which refers to the specified ref.

| param          | type [= default]          | description                                                                                    |
| -------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                                           |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                                            |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                     |
| **ref**        | string                    | The name of the ref to write                                                                   |
| **value**      | string                    | When `symbolic` is false, a ref or an SHA-1 object id. When true, a ref starting with `refs/`. |
| force          | boolean = false           | Instead of throwing an error if a ref named `ref` already exists, overwrite the existing ref.  |
| symbolic       | boolean = false           | Whether the ref is symbolic or not.                                                            |
| return         | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                  |

Example Code:

```js live
await git.writeRef({
  fs,
  dir: '/tutorial',
  ref: 'refs/heads/another-branch',
  value: 'HEAD'
})
await git.writeRef({
  fs,
  dir: '/tutorial',
  ref: 'HEAD',
  value: 'refs/heads/another-branch',
  force: true,
  symbolic: true
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/writeRef.js';
  }
})();
</script>