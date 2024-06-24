---
title: onAuth
sidebar_label: onAuth
id: version-1.x-onAuth
original_id: onAuth
---

The `onAuth` callback allows isomorphic-git to request credentials.
It is only called if a server returns an HTTP error (such as 404 or 401) when attempting to access the resource without credentials.

Authentication is normally required for pushing to a git repository.
It may also be required to clone or fetch from a private repository.
Git does all its authentication using HTTPS Basic Authentication.

An `onAuth` function is called with a `url` and an `auth` object and should return a GitAuth object:

```ts
/**
 * @callback AuthCallback
 * @param {string} url
 * @param {GitAuth} auth - Might have some values if the URL itself originally contained a username or password.
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
  onAuth: url => {
    let auth = lookupSavedPassword(url)
    if (auth) return auth

    if (confirm('This repo is password protected. Ready to enter a username & password?')) {
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

## Option 1: Username & Password

Return an object with `{ username, password }`.

However, there are some things to watch out for.

If you have two-factor authentication (2FA) enabled on your account, you
probably cannot push or pull using your regular username and password.
Instead, you may have to use a Personal Access Token. (Bitbucket calls them "App Passwords".)

### Personal Access Tokens

- [Instructions for GitHub](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
- [Instructions for Bitbucket](https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html)
- [Instructions for GitLab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)

In this situation, you want to return an object with `{ username, password }` where `password` is the Personal Access Token.
Note that GitHub actually lets you specify the token as the `username` and leave the password blank, which is convenient but none of the other hosting providers do this that I'm aware of.

### OAuth2 Tokens

If you are writing a third-party app that interacts with GitHub/GitLab/Bitbucket, you may be obtaining
OAuth2 tokens from the service via a feature like "Login with GitHub".
Depending on the OAuth2 token's grants, you can use those tokens for pushing and pulling from git repos as well.

In this situation, you want to return an object with `{ username, password }` where `username` and `password` depend on where the repo is hosted.

Unfortunately, all the major git hosting companies have chosen different conventions for converting OAuth2 tokens into Basic Authentication headers!

|            | `username`     | `password`       |
| ---------- | -------------- | ---------------- |
| GitHub     | `token`          | 'x-oauth-basic'  |
| GitHub App | 'x-access-token' | `token`          |
| BitBucket  | 'x-token-auth'   | `token`          |
| GitLab     | 'oauth2'         | `token`          |

I will gladly accept pull requests to document more companies' conventions.

Since it is a rarely used feature, I'm not including the conversion table directly in isomorphic-git anymore.
But if there's interest in maintaining this table as some kind of function, I'm considering starting an `@isomorphic-git/quirksmode` package to handle these kinds of hosting-provider specific oddities.

## Option 2: Headers

This is the super flexible option. Just return the HTTP headers you want to add as an object with `{ headers }`.
If you can provide `{ username, password, headers }` if you want. (Although if `headers` includes an `Authentication` property that overwrites what you would normally get from `username`/`password`.)

To re-implement the default Basic Auth behavior, do something like this:

```js
let auth = {
  headers: {
    Authentication: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }
}
```

If you are using a custom proxy server that has its own authentication in addition to the destination authentication, you could inject it like so:

```js
let auth = {
  username,
  password,
  headers: {
    'X-Authentication': `Bearer ${token}`
  }
}
```
