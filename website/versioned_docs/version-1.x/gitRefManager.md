---
title: GitRefManager
sidebar_label: GitRefManager
id: version-1.x-gitRefManager
original_id: gitRefManager
---

The `GitRefManager` class provides methods for managing Git references, including reading, writing, deleting, and resolving refs.

## Methods

### `GitRefManager.updateRemoteRefs`

Updates remote refs based on the provided refspecs and options.

#### Parameters

| param          | type                  | description                        |
| -------------- | --------------------- | ---------------------------------- |
| [**fs**](./fs) | FsClient              | A file system implementation.      |
| **gitdir**     | string                | The path to the `.git` directory.  |
| **remote**     | string                | The name of the remote.            |
| **refs**       | Map\<string, string\> | A map of refs to their object IDs. |
| **symrefs**    | Map\<string, string\> | A map of symbolic refs.            |
| **tags**       | boolean               | Whether to fetch tags.             |
| refspecs       | string[] = undefined  | The refspecs to use.               |
| prune          | boolean = false       | Whether to prune stale refs.       |
| pruneTags      | boolean = false       | Whether to prune tags.             |

#### Returns

`Promise<Object>`  
An object containing pruned refs.

---

### `GitRefManager.resolve`

Resolves a ref to its object ID.

#### Parameters

| param          | type               | description                                 |
| -------------- | ------------------ | ------------------------------------------- |
| [**fs**](./fs) | FsClient           | A file system implementation.               |
| **gitdir**     | string             | The path to the `.git` directory.           |
| **ref**        | string             | The ref to resolve.                         |
| depth          | number = undefined | The maximum depth to resolve symbolic refs. |

#### Returns

`Promise<string>`  
The resolved object ID.

---

## Notes

- The `GitRefManager` supports operations on both loose refs and packed refs.
- It ensures thread-safe operations using an `AsyncLock`.
- The class provides utilities for listing branches, tags, and refs.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitRefManager.js';
  }
})();
</script>
