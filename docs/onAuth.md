---
title: onAuth
sidebar_label: onAuth
---

The `onAuth` callback allows isomorphic-git to request credentials.
It is only called if a server returns an HTTP error (such as 404 or 401) when attempting to access the resource without credentials.

Authentication is normally required for pushing to a git repository.
It may also be required to clone or fetch from a private repository.
Git does all its authentication using HTTPS Basic Authentication.

An `onAuth` function is called with a `url` and should return a credential object:

```ts
/**
 * @callback AuthCallback
 * @param {string} url
 * @returns {GitAuth | Promise<GitAuth>}
 */

/**
 * @typedef {Object} GitAuth
 * @property {string} [username]
 * @property {string} [password]
 * @property {string} [token]
 * @property {string} [oauth2format]
 */
```

## Option 1: Username & Password

Return an object with `{ username, password }`.

However, there are some things to watch out for.

If you have two-factor authentication (2FA) enabled on your account, you
probably cannot push or pull using your regular username and password.
Instead, you may have to use option 2...

## Option 2: Personal Access Token

(Note: Bitbucket calls them "App Passwords".)

- [Instructions for GitHub](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
- [Instructions for Bitbucket](https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html)
- [Instructions for GitLab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)

In this situation, you want to return an object with `{ username, token }`.
(Note the username is optional for GitHub.)

## Option 3: OAuth2 Token

If you are writing a third-party app that interacts with GitHub/GitLab/Bitbucket, you may be obtaining
OAuth2 tokens from the service via a feature like "Login with GitHub".
Depending on the OAuth2 token's grants, you can use those tokens for pushing and pulling from git repos as well.

Unfortunately, all the major git hosting companies have chosen different conventions for converting
OAuth2 tokens into Basic Authentication headers! Therefore it is necessary to specify which company's
convention you are interacting with via an `oauth2format` parameter.

Currently, the following values are understood:

| oauth2format | Basic Auth username | Basic Auth password |
| ------------ | ------------------- | ------------------- |
| 'github'     | `token`             | 'x-oauth-basic'     |
| 'bitbucket'  | 'x-token-auth'      | `token`             |
| 'gitlab'     | 'oauth2'            | `token`             |

I will gladly accept pull requests to add support for more companies' conventions.
Here is what using OAuth2 authentication looks like.

In this situation, you want to return an object with `{ token, oauth2format }`.
Note when using OAuth2 tokens, you do NOT include a `username` or `password`.

## Example

```js
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
