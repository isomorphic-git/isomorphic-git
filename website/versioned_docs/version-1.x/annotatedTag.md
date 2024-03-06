---
title: annotatedTag
sidebar_label: annotatedTag
id: version-1.x-annotatedTag
original_id: annotatedTag
---

Create an annotated tag.

| param                 | type [= default]                     | description                                                                                                                                                                  |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)        | FsClient                             | a file system implementation                                                                                                                                                 |
| [onSign](./onSign)    | SignCallback                         | a PGP signing implementation                                                                                                                                                 |
| dir                   | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                          |
| **gitdir**            | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                                   |
| **ref**               | string                               | What to name the tag                                                                                                                                                         |
| message               | string = ref                         | The tag message to use.                                                                                                                                                      |
| object                | string = 'HEAD'                      | The SHA-1 object id the tag points to. (Will resolve to a SHA-1 object id if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used. |
| tagger                | object                               | The details about the tagger.                                                                                                                                                |
| tagger.name           | string                               | Default is `user.name` config.                                                                                                                                               |
| tagger.email          | string                               | Default is `user.email` config.                                                                                                                                              |
| tagger.timestamp      | number = Math.floor(Date.now()/1000) | Set the tagger timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                                            |
| tagger.timezoneOffset | number                               | Set the tagger timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                   |
| gpgsig                | string                               | The gpgsig attached to the tag object. (Mutually exclusive with the `signingKey` option.)                                                                                    |
| signingKey            | string                               | Sign the tag object using this private PGP key. (Mutually exclusive with the `gpgsig` option.)                                                                               |
| force                 | boolean = false                      | Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag. Note that this option does not modify the original tag object itself.          |
| cache                 | object                               | a [cache](cache.md) object                                                                                                                                                   |
| return                | Promise\<void\>                      | Resolves successfully when filesystem operations are complete                                                                                                                |

Example Code:

```js live
await git.annotatedTag({
  fs,
  dir: '/tutorial',
  ref: 'test-tag',
  message: 'This commit is awesome',
  tagger: {
    name: 'Mr. Test',
    email: 'mrtest@example.com'
  }
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/annotatedTag.js';
  }
})();
</script>