---
title: Authentication
sidebar_label: Authentication
id: version-0.70.7-authentication
original_id: authentication
---

Authentication is normally required for [`push`](./push.html)ing to a git repository.
It may also be required to [`clone`](./clone.html) or [`fetch`](./fetch.html) from a private repository.
Git does all its authentication using HTTPS Basic Authentication.
Usually this is straightforward: just specify `username` and `password`.

```js
await git.push({
 username: 'your username',
 password: 'your password',
 ...
})
```

However, there are some things to watch out for.

If you have two-factor authentication (2FA) enabled on your account, you
probably cannot push or pull using your regular username and password.
Instead, you may have to create a Personal Access Token (or an App Password in Bitbucket lingo) and use that to authenticate.
( [Instructions for GitHub](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
| [Instructions for Bitbucket](https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html)
| [Instructions for GitLab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
)

```js
await git.push({
 username: 'your username', // Note: username is optional for GitHub
 token: 'your Personal Access Token',
 ...
})
```

If you are writing a third-party app that interacts with GitHub/GitLab/Bitbucket, you may be obtaining
OAuth2 tokens from the service via a feature like "Login with GitHub".
Depending on the OAuth2 token's grants, you can use those tokens for pushing and pulling from git repos as well.
Unfortunately, all the major git hosting companies have chosen different conventions for converting
OAuth2 tokens into Basic Authentication headers! Therefore it is necessary to specify which company's
convention you are interacting with via the `oauth2format` parameter.
Currently, the following values are understood:

| oauth2format | Basic Auth username | Basic Auth password |
| ------------ | ------------------- | ------------------- |
| 'github'     | `token`             | 'x-oauth-basic'     |
| 'bitbucket'  | 'x-token-auth'      | `token`             |
| 'gitlab'     | 'oauth2'            | `token`             |

I will gladly accept pull requests to add support for more companies' conventions.
Here is what using OAuth2 authentication looks like.
Note when using OAuth2 tokens, you do not include `username` or `password`.

```js
await git.push({
 oauth2format: 'gitlab',
 token: 'your OAuth2 Token',
 ...
})
```

A complete summary of how the four parameters interact to determine the Basic Auth headers is described by the following truth table:

| username | password | token | oauth2format | = Result                                                                         |
| -------- | -------- | ----- | ------------ | -------------------------------------------------------------------------------- |
|          |          |       |              | Basic Auth not used                                                              |
| X        |          |       |              | Error "Missing token or password"                                                |
|          | X        |       |              | Error "Missing username"                                                         |
| X        | X        |       |              | `{authUsername: username, authPassword: password}`                               |
|          |          | X     |              | `{authUsername: token, authPassword: ''}` (GitHub's alternative format)          |
| X        |          | X     |              | `{authUsername: username, authPassword: token}`                                  |
|          | X        | X     |              | Error "Cannot mix 'password' with 'token'"                                       |
| X        | X        | X     |              | Error "Cannot mix 'password' with 'token'"                                       |
|          |          |       | X            | Error "Missing token"                                                            |
| X        |          |       | X            | Error "Cannot mix 'username' with 'oauth2format'. Missing token."                |
|          | X        |       | X            | Error "Cannot mix 'password' with 'oauth2format'. Missing token."                |
| X        | X        |       | X            | Error "Cannot mix 'username' and 'password' with 'oauth2format'. Missing token." |
|          |          | X     | X            | as described in the oauth2format table above                                     |
| X        |          | X     | X            | Error "Cannot mix 'username' with 'oauth2format' and 'token'"                    |
|          | X        | X     | X            | Error "Cannot mix 'password' with 'oauth2format' and 'token'"                    |
| X        | X        | X     | X            | Error "Cannot mix 'username' and 'password' with 'oauth2format' and 'token'"     |
