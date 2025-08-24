---
title: Authentication
sidebar_label: Authentication
---

Authentication is normally required for [`push`](./push.html)ing to a git repository.
It may also be required to [`clone`](./clone.html) or [`fetch`](./fetch.html) from a private repository.
Git does all its authentication using HTTPS Basic Authentication.
Usually this is straightforward: just specify `username` and `password` in the URL. In a browser, you can do this:

```js
// this will just build a url like https://user:password@github.com/isomorphic-git/isomorphic-git
// it escapes all the non-URL characters for you
const repoUrl = "https://github.com/isomorphic-git/isomorphic-git"
const u = new URL(repoUrl)

// your github username
u.username = login

// can come from github oauth flow, or your real password, if you don't have 2fa enabled
u.password = token

await git.push({
  fs,
  http,
  dir: '/yours',
  corsProxy: 'https://cors.isomorphic-git.org',
  url: u.toString(),
  author: {
    name: "you",
    email: "you@wherever"
  }
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

There is also an option to use [onAuth](onAuth.html), which is fired on a failed request, if the status is 401 ("Authentication Required".) From there you can return username/password or other headers, however you like, so it can be great for async authentication (prompt user, load files, etc.)

If you are writing a third-party app that interacts with GitHub/GitLab/Bitbucket, you may be obtaining
OAuth2 tokens from the service via a feature like "Login with GitHub".
Depending on the OAuth2 token's grants, you can use those tokens for pushing and pulling from git repos as well.

Github/Gitlab/Bitbucket uses this oauth/personal-access-token token as the `password`, in above URL scheme.
