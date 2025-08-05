---
title: GitIgnoreManager
sidebar_label: GitIgnoreManager
id: version-1.x-gitIgnoreManager
original_id: gitIgnoreManager
---

The `GitIgnoreManager` class provides methods to determine whether a file is ignored based on `.gitignore` rules and exclusion files.

## Methods

### `GitIgnoreManager.isIgnored`

Determines whether a given file is ignored based on `.gitignore` rules and exclusion files.

#### Parameters

| param          | type                       | description                            |
| -------------- | -------------------------- | -------------------------------------- |
| [**fs**](./fs) | FsClient                   | A file system implementation.          |
| **dir**        | string                     | The working directory.                 |
| **gitdir**     | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md). |
| **filepath**   | string                     | The path of the file to check.         |

#### Returns

`Promise<boolean>`  
`true` if the file is ignored, `false` otherwise.

#### Example Usage

```js live
import { GitIgnoreManager } from 'isomorphic-git/managers'

const isIgnored = await GitIgnoreManager.isIgnored({
  fs,
  dir: '/path/to/repo',
  filepath: 'src/example.js',
})

console.log(isIgnored) // true or false
```

---

## Notes

- The `.git` folder is always ignored.
- The root directory (`.`) is never ignored, as it is not a valid `.gitignore` entry.
- The method checks `.gitignore` files in the file's directory and its parent directories, as well as the `.git/info/exclude` file.
- If a parent directory is excluded, the file is automatically ignored, as per Git's behavior.
- The method uses the `ignore` library to parse and apply `.gitignore` rules.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-
  }
})();
</script>
