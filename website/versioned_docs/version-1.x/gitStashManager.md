---
title: GitStashManager
sidebar_label: GitStashManager
id: version-1.x-gitStashManager
original_id: gitStashManager
---

The `GitStashManager` class provides methods for managing Git stash entries, including reading, writing, and retrieving stash commits.

## Methods

### `GitStashManager.getStashSHA`

Gets the SHA of a stash entry by its index.

#### Parameters

| param            | type     | description                       |
| ---------------- | -------- | --------------------------------- |
| **refIdx**       | number   | The index of the stash entry.     |
| **stashEntries** | string[] | Optional preloaded stash entries. |

#### Returns

`Promise<string|null>`  
The SHA of the stash entry or `null` if not found.

---

### `GitStashManager.writeStashCommit`

Writes a stash commit to the repository.

#### Parameters

| param       | type     | description                   |
| ----------- | -------- | ----------------------------- |
| **message** | string   | The commit message.           |
| **tree**    | string   | The tree object ID.           |
| **parent**  | string[] | The parent commit object IDs. |

#### Returns

`Promise<string>`  
The object ID of the written commit.

---

## Notes

- The `GitStashManager` uses the `GitRefManager` for managing stash references.
- It supports reading and writing stash reflogs for tracking stash operations.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitStashManager.js';
  }
})();
</script>
