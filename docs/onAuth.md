---
title: onAuth
sidebar_label: onAuth
---

The `onAuth` callback allows isomorphic-git to dynamically request credentials. It is only called if a server returns an HTTP error (such as 404 or 401) when attempting to access the resource without credentials.

A `onAuth` function is called with a `url` and should return either:

- an object with `{ username, password }`
- an object with `{ token, oauth2format }`
- or an empty object `{}`.

```js
/**
 * @callback AuthCallback
 * @param {string} url
 *
 * @returns {Promise<GitAuth>}
 */

/**
 * @typedef {Object} GitAuth
 * @property {string} [username]
 * @property {string} [password]
 * @property {string} [token]
 * @property {string} [oauth2format]
 */
```

## Example

```js
const git = require('isomorphic-git')
git.clone({
  ...,
  onAuth: url => {
    let auth = lookupSavedPassword(url)
    if (!auth.username) {
      auth.username = prompt('Enter username')
    }
    if (!auth.password) {
      auth.password = prompt('Enter password')
    }
    return auth
  }
})
```
