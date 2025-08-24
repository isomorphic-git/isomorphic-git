---
title: GitRemoteManager
sidebar_label: GitRemoteManager
id: version-1.x-gitRemoteManager
original_id: gitRemoteManager
---

The `GitRemoteManager` class provides methods for managing Git remotes and determining the appropriate remote helper for a given URL.

## Methods

### `GitRemoteManager.getRemoteHelperFor`

Determines the appropriate remote helper for the given URL.

#### Parameters

| param   | type   | description                       |
| ------- | ------ | --------------------------------- |
| **url** | string | The URL of the remote repository. |

#### Returns

`Object`  
The remote helper class for the specified transport.

#### Throws

- `UrlParseError`  
  If the URL cannot be parsed.
- `UnknownTransportError`  
  If the transport is not supported.

---

## Notes

- The `GitRemoteManager` supports HTTP and HTTPS transports by default.
- It uses the `parseRemoteUrl` utility to extract the transport and address from a URL.
- For unsupported transports, it throws an `UnknownTransportError`.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitRemoteManager.js';
  }
})();
</script>
