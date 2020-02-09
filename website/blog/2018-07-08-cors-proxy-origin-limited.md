---
author: William Hilton
authorURL: https://twitter.com/wmhilton
authorFBID: 551965935
title: CORS proxy origin limited
---

See the [previous post](/blog/2018/07/05/cors-proxy-disabled) for background.

## The proxy works for isomorphic-git.github.io
A new proxy, [git-cors-proxy.now.sh](https://cors.isomorphic-git.org), has been set up so that the online demos in the API documentation and guide will work again.
However, this proxy has been limited to a) only handle legit git clone / fetch / push / getRemoteInfo requests and b) only accept requests from the `https://isomorphic-git.github.io` origin.
This means that you can use the proxy on this website, but you will need to run your own proxy to use isomorphic-git on your own website.

## The proxy MIGHT work for some other websites in the future
This isn't a big deal for large projects where it is "just one more docker container to run on our kubernetes cluster."
But it is a shame for smaller projects that may be interested in using `isomorphic-git` but are using static hosting, like Github Pages, and don't have the time/resources to run a dedicated proxy.
So I will gradually be whitelisting more domains on the proxy, as bandwidth permits.
Likely candidates are: `*.github.io`, `*.gitlab.io`, and `*.glitch.me`.
Open an [issue](https://github.com/isomorphic-git/isomorphic-git.github.io/issues/new) if you have a suggestion for a domain that would greatly benefit from a free git CORS proxy.

## You can deploy your own git-cors-proxy for your site
If you are one of these bigger projects that need to run your own CORS proxy, it is not hard to run your own instance!
Because running [cors-buster](https://www.npmjs.com/package/cors-buster) "AS IS" is likely to put you in a similar situation that we were in,
I recommend running the more refined [@isomorphic-git/cors-proxy](https://www.npmjs.com/package/@isomorphic-git/cors-proxy) package,
which will let you limit the allowed CORS Origins using an environment variable and block requests that are not for git repositories.
It comes complete with a Dockerfile that makes it easy to deploy.
