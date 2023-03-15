---
title: onAuthSuccess
sidebar_label: onAuthSuccess
---

The `onAuthSuccess` callback is called when credentials work. This is helpful to know if you want to offer to save the credentials, but only if they are valid.

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
 * @property {Object<string, string>} [headers]
 * @property {boolean} cancel - Tells git to throw a `UserCanceledError` (instead of an `HTTPError`).
 */
```

## Example

```js
await git.clone({
  ...,
  onAuthSuccess: (url, auth) => {
    if (confirm('Remember password?')) {
      savedPassword(url, auth)
    }
  }
})
```
