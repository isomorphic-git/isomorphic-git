---
title: expandRef
sidebar_label: expandRef
id: version-1.x-expandRef
original_id: expandRef
---

Expand an abbreviated ref to its full name

| param          | type [= default]          | description                                                     |
| -------------- | ------------------------- | --------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system implementation                                    |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path             |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                      |
| **ref**        | string                    | The ref to expand (like "v1.0.0")                               |
| return         | Promise\<string\>         | Resolves successfully with a full ref name ("refs/tags/v1.0.0") |

Example Code:

```js live
let fullRef = await git.expandRef({ fs, dir: '/tutorial', ref: 'main'})
console.log(fullRef)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/expandRef.js';
  }
})();
</script>