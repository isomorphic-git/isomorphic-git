---
title: GitConfigManager
sidebar_label: GitConfigManager
id: version-1.x-gitConfigManager
original_id: gitConfigManager
---

The `GitConfigManager` class provides methods to manage access to the Git configuration file, allowing for reading and saving configurations.

## Methods

### `GitConfigManager.get`

Reads the Git configuration file from the specified `.git` directory.

#### Parameters

| param          | type     | description                       |
| -------------- | -------- | --------------------------------- |
| [**fs**](./fs) | FsClient | A file system implementation.     |
| **gitdir**     | string   | The path to the `.git` directory. |

#### Returns

`Promise<GitConfig>`  
A `GitConfig` object representing the parsed configuration.

#### Example Usage

```js live
import { GitConfigManager } from 'isomorphic-git/managers'

const config = await GitConfigManager.get({
  fs,
  gitdir: '/path/to/repo/.git',
})

console.log(config.get('user.name'))
```

---

### `GitConfigManager.save`

Saves the provided Git configuration to the specified `.git` directory.

#### Parameters

| param          | type      | description                       |
| -------------- | --------- | --------------------------------- |
| [**fs**](./fs) | FsClient  | A file system implementation.     |
| **gitdir**     | string    | The path to the `.git` directory. |
| **config**     | GitConfig | The `GitConfig` object to save.   |

#### Returns

`Promise<void>`  
Resolves when the configuration has been successfully saved.

#### Example Usage

```js live
import { GitConfigManager } from 'isomorphic-git/managers'
import { GitConfig } from 'isomorphic-git/models'

const config = new GitConfig()
config.set('user.name', 'John Doe')
config.set('user.email', 'johndoe@example.com')

await GitConfigManager.save({
  fs,
  gitdir: '/path/to/repo/.git',
  config,
})
```

---

## Notes

- The `GitConfigManager` provides a simple interface for reading and writing Git configuration files.
- The `get` method reads the configuration from the repository's `.git/config` file.
- The `save` method writes the configuration back to the `.git/config` file.
- Future improvements may include support for reading and writing global and user-level configurations.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitConfigManager.js';
      }
})();
</script>
