---
title: status
sidebar_label: status
id: version-1.x-status
original_id: status
---

Tell whether a file has been changed

| param          | type [= default]                                                                                                                                                                                                                                       | description                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [**fs**](./fs) | FsClient                                                                                                                                                                                                                                               | a file system client                                |
| **dir**        | string                                                                                                                                                                                                                                                 | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**     | string = join(dir, '.git')                                                                                                                                                                                                                             | The [git directory](dir-vs-gitdir.md) path          |
| **filepath**   | string                                                                                                                                                                                                                                                 | The path to the file to query                       |
| cache          | object                                                                                                                                                                                                                                                 | a [cache](cache.md) object                          |
| return         | Promise\<('ignored' &#124; 'unmodified' &#124; '*modified' &#124; '*deleted' &#124; '*added' &#124; 'absent' &#124; 'modified' &#124; 'deleted' &#124; 'added' &#124; '*unmodified' &#124; '*absent' &#124; '*undeleted' &#124; '*undeletemodified')\> | Resolves successfully with the file's git status    |

The possible resolve values are:

| status                | description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `"ignored"`           | file ignored by a .gitignore rule                                                     |
| `"unmodified"`        | file unchanged from HEAD commit                                                       |
| `"*modified"`         | file has modifications, not yet staged                                                |
| `"*deleted"`          | file has been removed, but the removal is not yet staged                              |
| `"*added"`            | file is untracked, not yet staged                                                     |
| `"absent"`            | file not present in HEAD commit, staging area, or working dir                         |
| `"modified"`          | file has modifications, staged                                                        |
| `"deleted"`           | file has been removed, staged                                                         |
| `"added"`             | previously untracked file, staged                                                     |
| `"*unmodified"`       | working dir and HEAD commit match, but index differs                                  |
| `"*absent"`           | file not present in working dir or HEAD commit, but present in the index              |
| `"*undeleted"`        | file was deleted from the index, but is still in the working dir                      |
| `"*undeletemodified"` | file was deleted from the index, but is present with modifications in the working dir |

Example Code:

```js live
let status = await git.status({ fs, dir: '/tutorial', filepath: 'README.md' })
console.log(status)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/status.js';
  }
})();
</script>