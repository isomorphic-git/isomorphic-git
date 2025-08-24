---
title: GitIndexManager
sidebar_label: GitIndexManager
id: version-1.x-gitIndexManager
original_id: gitIndexManager
---

The `GitIndexManager` class provides thread-safe access to the Git index file, ensuring proper caching and synchronization for operations on the index.

## Methods

### `GitIndexManager.acquire`

Manages access to the Git index file, ensuring thread-safe operations and caching.

#### Parameters

| param          | type [= default]        | description                                   |
| -------------- | ----------------------- | --------------------------------------------- |
| [**fs**](./fs) | FsClient                | A file system implementation.                 |
| **gitdir**     | string                  | The path to the `.git` directory.             |
| **cache**      | object                  | A shared cache object for storing index data. |
| allowUnmerged  | boolean = true          | Whether to allow unmerged paths in the index. |
| **closure**    | function(GitIndex): any | A function to execute with the Git index.     |

#### Returns

`Promise<any>`  
The result of the `closure` function.

#### Throws

- `UnmergedPathsError`  
  If unmerged paths exist and `allowUnmerged` is `false`.

#### Example Usage

```js live
import { GitIndexManager } from 'isomorphic-git/managers'

await GitIndexManager.acquire(
  {
    fs,
    gitdir: '/path/to/repo/.git',
    cache: {},
    allowUnmerged: false,
  },
  async index => {
    // Perform operations on the Git index
    console.log(index.entries)
  }
)
```

---

## Notes

- The `GitIndexManager` uses an `AsyncLock` to ensure thread-safe operations on the Git index file.
- The `cache` object is shared across operations to minimize redundant reads and writes to the file system.
- The `allowUnmerged` option determines whether unmerged paths in the index are allowed. If set to `false`, an `UnmergedPathsError` will be thrown when unmerged paths are detected.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitIndexManager.js';
  }
})();
</script>
