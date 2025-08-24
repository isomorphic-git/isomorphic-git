---
title: auth
sidebar_label: utils.auth
id: version-0.70.7-utils_auth
original_id: utils_auth
---

> **Deprecated**
> This will be removed in a the 1.0.0 version of Isomorphic-Git.
>
> This functionality is now provided by the [`username`, `password`, and `token`](./authentication.html) arguments

Use with [push](push.md) and [fetch](fetch.md) to set Basic Authentication headers.
This works for basic username / password auth, or the newer username / token auth
that is often required if 2FA is enabled.

Authentication is normally required for pushing to a git repository.
It may also be required to clone or fetch from a private repository.
Git does all its authentication using HTTPS Basic Authentication.
Usually this is straightforward, but there are some things to watch out for.

If you have two-factor authentication (2FA) enabled on your account, you
probably cannot push or pull using your regular username and password.
Instead, you may have to create a Personal Access Token (or an App
Password in Bitbucket lingo) and use that to authenticate.

| param    | type [= default]                     |
| -------- | ------------------------------------ |
| username | string                               |
| password | string                               |
| return   | {username: string, password: string} |

```js live
let credentials = git.utils.auth('username', 'password')
console.log(credentials)

// a one-argument version is also supported
credentials = git.utils.auth('username:password')
console.log(credentials)

// GitHub/GitLab Personal Access Token Authentication
credentials = git.utils.auth('username', 'personal access token')
console.log(credentials)

// Bitbucket calls theirs App Passwords instead for some reason
credentials = git.utils.auth('username', 'app password')
console.log(credentials)

// GitHub (only) lets you leave out the username
credentials = git.utils.auth('personal access token')
console.log(credentials)
```
