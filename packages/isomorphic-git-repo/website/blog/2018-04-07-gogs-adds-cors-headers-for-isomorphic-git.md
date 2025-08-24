---
author: William Hilton
authorURL: https://twitter.com/wmhilton
authorFBID: 551965935
title: Gogs adds CORS headers for isomorphic-git
---

The Go Git Service ([gogs.io](https://gogs.io)) is already the "easiest, fastest, and most painless way of setting up a self-hosted Git service."
And now because of a small [pull request](https://github.com/gogits/gogs/pull/4970/files) that got accepted,
I am excited to announce that on 2018-03-31 with the release of [Gogs v0.11.43](https://github.com/gogits/gogs/releases/tag/v0.11.43),
Gogs became the first git server to fully support CORS with the Git Smart HTTP protocol!!
This means you can do **cross-domain fetch and push** operations in the browser using isomorphic-git
**without using a proxy server**.

To enable CORS, edit the Gogs main config file, `custom/conf/app.ini`, and add the following:

```ini
[http]
ACCESS_CONTROL_ALLOW_ORIGIN = *
```

Hopefully Gitlab, Bitbucket, and Github will follow suit, enabling a new generation of web applications that
interact directly with source code repositories. Until then, you can continue using [cors-buster](https://cors-buster-tbgktfqyku.now.sh/)
to interact with these sites.
