---
title: headers
sidebar_label: headers
id: version-1.x-headers
original_id: headers
---

# `Authorization` header

Plain old HTTP Basic auth can be handled elegantly using the `onAuth` handler.
But if you want to use Bearer auth or something, any value you manually set for the `Authorization` header will override the derived value.

# `User-Agent` header

Regretably, some git hosting services have User-Agent specific behavior.
For instance, GitHub will correctly interpret git HTTP requests made to a repository URL that is missing the `.git` suffix but _ONLY_ if the User-Agent starts with `git/`.
And in fact, does not interpret git HTTP requests for _gists_ correctly _at all_ unless the User-Agent start with `git/` (bug [#259](https://github.com/isomorphic-git/isomorphic-git/issues/259)).

Since 2015 the specs state that setting a custom User-Agent header in `fetch` should override the default. This works in Firefox (bug [#247](https://github.com/isomorphic-git/isomorphic-git/issues/247)), but Chrome has a bug so setting a custom User-Agent doesn't work at all (chrome bug [#571722](https://bugs.chromium.org/p/chromium/issues/detail?id=571722)).

The [`@isomorphic-git/cors-proxy`](https://github.com/isomorphic-git/cors-proxy) solves some of this problem by checking if the User-Agent starts with `git/` and if it doesn't, it sets the User-Agent to `git/@isomorphic-git/cors-proxy`. So cloning gists using a proxy works.

CORS also has a strange relationship with the User-Agent header. Setting a custom User-Agent header requires that 'User-Agent' be explicitly whitelisted in the CORS pre-flight request (bug [#555](https://github.com/isomorphic-git/isomorphic-git/issues/555)).

As you can see, User-Agent is basically a mine field. Which is why as of version 1.0 this library doesn't touch it. There is no solution that works for everything (GitHub handling URLs without .git, cloning gists, setting it in Chrome, setting it in a proxy, CORS). This is your problem now, not mine. Go bug GitHub, Inc to stop using user-agent filtering.

# `X-` headers

There is nothing stopping you from setting custom headers if you really want. But if you're doing it in a browser you'll either need to run the CORS proxy on the same domain or
run a custom CORS proxy to whitelist those headers if they aren't [already whitelisted](https://github.com/isomorphic-git/cors-proxy/blob/master/middleware.js#L7-L25).
