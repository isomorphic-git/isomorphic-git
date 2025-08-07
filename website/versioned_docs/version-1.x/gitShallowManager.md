---
title: GitShallowManager
sidebar_label: GitShallowManager
id: version-1.x-gitShallowManager
original_id: gitShallowManager
---

The `GitShallowManager` class provides methods for reading and writing the `shallow` file in a Git repository.

## Methods

### `GitShallowManager.read`

Reads the `shallow` file in the Git repository and returns a set of object IDs (OIDs).

#### Parameters

| param          | type     | description                       |
| -------------- | -------- | --------------------------------- |
| [**fs**](./fs) | FsClient | A file system implementation.     |
| **gitdir**     | string   | The path to the `.git` directory. |

#### Returns

`Promise<Set<string>>`  
A set of shallow object IDs.

---

### `GitShallowManager.write`

Writes a set of object IDs (OIDs) to the `shallow` file in the Git repository. If the set is empty, the `shallow` file is removed.

#### Parameters

| param          | type          | description                           |
| -------------- | ------------- | ------------------------------------- |
| [**fs**](./fs) | FsClient      | A file system implementation.         |
| **gitdir**     | string        | The path to the `.git` directory.     |
| **oids**       | Set\<string\> | A set of shallow object IDs to write. |

#### Returns

`Promise<void>`

---

## Notes

- The `GitShallowManager` ensures thread-safe operations using an `AsyncLock`.
- If the `shallow` file is empty, it is removed from the repository.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitShallowManager.js';
  }
})();
</script>
