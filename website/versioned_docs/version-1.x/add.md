---
title: add
sidebar_label: add
id: version-1.x-add
original_id: add
---

Add a file to the git index (aka staging area)

| param          | type [= default]                | description                                                                                                           |
| -------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                        | a file system implementation                                                                                          |
| **dir**        | string                          | The [working tree](dir-vs-gitdir.md) directory path                                                                   |
| **gitdir**     | string = join(dir, '.git')      | The [git directory](dir-vs-gitdir.md) path                                                                            |
| **filepath**   | string  &#124;  Array\<string\> | The path to the file to add to the index                                                                              |
| cache          | object                          | a [cache](cache.md) object                                                                                            |
| force          | boolean = false                 | add to index even if matches gitignore. Think `git add --force`                                                       |
| parallel       | boolean = false                 | process each input file in parallel. Parallel processing will result in more memory consumption but less process time |
| return         | Promise\<void\>                 | Resolves successfully once the git index has been updated                                                             |

Example Code:

```js live
await fs.promises.writeFile('/tutorial/README.md', `# TEST`)
await git.add({ fs, dir: '/tutorial', filepath: 'README.md' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/add.js';
  }
})();
</script>