---
title: FileSystem
sidebar_label: FileSystem
id: version-1.x-fileSystem
original_id: fileSystem
---

The `FileSystem` class provides a consistent API for file system operations, supporting both promise-based and callback-based file systems. It includes utility methods for common file system tasks such as reading, writing, and deleting files and directories.

## Methods

### `FileSystem.exists`

Checks if a file exists.

#### Parameters

| param        | type   | description                    |
| ------------ | ------ | ------------------------------ |
| **filepath** | string | The path to the file.          |
| **options**  | Object | Additional options (optional). |

#### Returns

`Promise<boolean>`  
`true` if the file exists, `false` otherwise.

---

### `FileSystem.read`

Reads the contents of a file.

#### Parameters

| param        | type   | description                              |
| ------------ | ------ | ---------------------------------------- |
| **filepath** | string | The path to the file.                    |
| **options**  | Object | Options for reading the file (optional). |

#### Returns

`Promise<Buffer|string|null>`  
The file contents, or `null` if the file doesn't exist.

---

### `FileSystem.write`

Writes data to a file, creating missing directories if necessary.

#### Parameters

| param        | type                       | description                              |
| ------------ | -------------------------- | ---------------------------------------- |
| **filepath** | string                     | The path to the file.                    |
| **contents** | Buffer\|Uint8Array\|string | The data to write.                       |
| **options**  | Object\|string             | Options for writing the file (optional). |

#### Returns

`Promise<void>`

---

### `FileSystem.mkdir`

Creates a directory (or nested directories) if it doesn't already exist.

#### Parameters

| param          | type    | description                |
| -------------- | ------- | -------------------------- |
| **filepath**   | string  | The path to the directory. |
| **\_selfCall** | boolean | Internal flag (optional).  |

#### Returns

`Promise<void>`

---

### `FileSystem.rm`

Deletes a file if it exists.

#### Parameters

| param        | type   | description           |
| ------------ | ------ | --------------------- |
| **filepath** | string | The path to the file. |

#### Returns

`Promise<void>`

---

### `FileSystem.rmdir`

Deletes a directory if it exists.

#### Parameters

| param        | type   | description                                    |
| ------------ | ------ | ---------------------------------------------- |
| **filepath** | string | The path to the directory.                     |
| **opts**     | Object | Options for deleting the directory (optional). |

#### Returns

`Promise<void>`

---

### `FileSystem.readdir`

Reads the contents of a directory.

#### Parameters

| param        | type   | description                |
| ------------ | ------ | -------------------------- |
| **filepath** | string | The path to the directory. |

#### Returns

`Promise<string[]|null>`  
An array of file names, or `null` if the path is not a directory.

---

### `FileSystem.readdirDeep`

Recursively reads all files in a directory and its subdirectories.

#### Parameters

| param   | type   | description            |
| ------- | ------ | ---------------------- |
| **dir** | string | The directory to read. |

#### Returns

`Promise<string[]>`  
A flat list of all files in the directory.

---

### `FileSystem.lstat`

Gets the stats of a file or symlink.

#### Parameters

| param        | type   | description                      |
| ------------ | ------ | -------------------------------- |
| **filename** | string | The path to the file or symlink. |

#### Returns

`Promise<Object|null>`  
The stats object, or `null` if the file doesn't exist.

---

### `FileSystem.readlink`

Reads the target of a symlink.

#### Parameters

| param        | type   | description                                 |
| ------------ | ------ | ------------------------------------------- |
| **filename** | string | The path to the symlink.                    |
| **opts**     | Object | Options for reading the symlink (optional). |

#### Returns

`Promise<Buffer|null>`  
The symlink target, or `null` if it doesn't exist.

---

### `FileSystem.writelink`

Writes a symlink.

#### Parameters

| param        | type   | description              |
| ------------ | ------ | ------------------------ |
| **filename** | string | The path to the symlink. |
| **buffer**   | Buffer | The symlink target.      |

#### Returns

`Promise<void>`

---

## Notes

- The `FileSystem` class wraps both promise-based and callback-based file systems, providing a unified API.
- It includes utility methods for handling common file system tasks, such as creating directories, reading files, and managing symlinks.
- The class ensures compatibility with various file system implementations.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/models/FileSystem.js';
  }
})();
</script>
