---
title: oauth2
sidebar_label: utils.oauth2
id: version-0.70.7-utils_oauth2
original_id: utils_oauth2
---

> **Deprecated**
> This will be removed in the 1.0.0 version of Isomorphic-Git.
>
> This functionality is now provided by the [`oauth2format` and `token`](./authentication.html) arguments

| param       | type [= default]                     |
| ----------- | ------------------------------------ |
| **company** | string                               |
| **token**   | string                               |
| return      | {username: string, password: string} |

Use with [push](push.md) and [fetch](fetch.md) to set Basic Authentication headers.
This for is for *actual* OAuth2 tokens (not "personal access tokens").
Unfortunately, all the major git hosting companies have chosen different conventions!
Lucky for you, I already looked up and codified it for you.

- oauth2('github', token) - GitHub uses `token` as the username, and `'x-oauth-basic'` as the password.
- oauth2('githubapp', token) - GitHub Apps use `'x-access-token'` as the username, and `token` as the password.
- oauth2('bitbucket', token) - Bitbucket uses `'x-token-auth'` as the username, and `token` as the password.
- oauth2('gitlab', token) - GitLab uses `'oauth2'` as the username, and `token` as the password.

I will gladly accept pull requests for more companies' conventions.

```js live
let credentials = git.utils.oauth2('github', 'token')
console.log(credentials)

credentials = git.utils.oauth2('githubapp', 'token')
console.log(credentials)

credentials = git.utils.oauth2('bitbucket', 'token')
console.log(credentials)

credentials = git.utils.oauth2('gitlab', 'token')
console.log(credentials)
```
