---
title: onAuthSuccess
sidebar_label: onAuthSuccess
---

The `onAuthSuccess` callback is called when credentials fail. This is helpful to know if say, you want to offer to save a password but only after it succeeds.

An `onAuthSuccess` function is called with a `{ url, auth }` object.

```js
/**
 * @callback AuthSuccessCallback
 * @param {object} args.
 * @param {string} args.url
 * @param {GitAuth} args.auth
 *
 * @returns {Promise<void>}
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
  onAuthSuccess: ({ url, auth }) => {
    if (confirm('Remember password?')) {
      savedPassword(url, auth)
    }
  }
})
```
