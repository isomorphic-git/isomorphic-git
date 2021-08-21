---
title: isIgnored
sidebar_label: isIgnored
id: version-1.x-isIgnored
original_id: isIgnored
---

Test whether a filepath should be ignored (because of .gitignore or .git/exclude)

| param          | type [= default]           | description                                         |
| -------------- | -------------------------- | --------------------------------------------------- |
| [**fs**](./fs) | FsClient                   | a file system client                                |
| **dir**        | string                     | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**     | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path          |
| **filepath**   | string                     | The filepath to test                                |
| return         | Promise\<boolean\>         | Resolves to true if the file should be ignored      |

Example Code:

```js live
await git.isIgnored({ fs, dir: '/tutorial', filepath: 'docs/add.md' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/isIgnored.js';
  }
})();
</script>