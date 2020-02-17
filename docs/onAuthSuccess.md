---
title: onAuthSuccess
sidebar_label: onAuthSuccess
---

The `onAuthSuccess` callback is called when credentials fail. This is helpful to know if say, you want to offer to save a password but only after it succeeds.

An `onAuthSuccess` function is called with a `url` and an `auth` object.

```js
/**
 * @callback AuthSuccessCallback
 * @param {string} url
 * @param {GitAuth} auth
 * @returns {void | Promise<void>}
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
  onAuthSuccess: (url, auth) => {
    if (confirm('Remember password?')) {
      savedPassword(url, auth)
    }
  }
})
```
