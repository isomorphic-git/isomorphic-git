---
title: version
sidebar_label: version
id: version-1.x-version
original_id: version
---

Return the version number of isomorphic-git

| param  | type [= default] | description                                                    |
| ------ | ---------------- | -------------------------------------------------------------- |
| return | string           | the version string taken from package.json at publication time |

I don't know why you might need this. I added it just so I could check that I was getting
the correct version of the library and not a cached version.

Example Code:

```js live
console.log(git.version())
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/version.js';
  }
})();
</script>