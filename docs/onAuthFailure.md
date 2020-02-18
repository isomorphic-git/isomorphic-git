---
title: onAuthFailure
sidebar_label: onAuthFailure
---

The `onAuthFailure` callback is called when credentials fail. This is helpful to know if say, you have saved password and want to offer to delete ones that fail.

An `onAuthFailure` function is called with a `url` and an `auth` object.

```js
/**
 * @callback AuthFailureCallback
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
  onAuthFailure: (url, auth) => {
    if (confirm('Access was denied. Delete saved password?')) {
      forgetSavedPassword(url)
    }
  }
})
```
