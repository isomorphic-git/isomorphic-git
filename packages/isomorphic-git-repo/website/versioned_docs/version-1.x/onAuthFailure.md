---
title: onAuthFailure
sidebar_label: onAuthFailure
id: version-1.x-onAuthFailure
original_id: onAuthFailure
---

The `onAuthFailure` callback is called when credentials fail.
This is helpful to know if you were using a saved password in the `onAuth` callback, then you may want to offer the user the option to delete the currently saved password.
It also gives you an opportunity to retry the request with new credentials.

As long as your `onAuthFailure` function returns credentials, it will keep trying.
This is the main reason we don't reuse the `onAuth` callback for this purpose. If we did, then a naive `onAuth` callback that simply returned saved credentials might loop indefinitely.

An `onAuthFailure` function is called with a `url` and an `auth` object and can return a GitAuth object:

```js
/**
 * @callback AuthFailureCallback
 * @param {string} url
 * @param {GitAuth} auth The credentials that failed
 * @returns {GitAuth | void | Promise<GitAuth | void>}
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
  onAuthFailure: (url, auth) => {
    forgetSavedPassword(url)
    if (confirm('Access was denied. Try again?')) {
      auth = {
        username: prompt('Enter username'),
        password: prompt('Enter password'),
      }
      return auth
    } else {
      return { cancel: true }
    }
  }
})
```
