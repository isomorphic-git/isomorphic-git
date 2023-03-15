---
id: version-0.70.7-fs
title: Bring Your Own FS
sidebar_label: Bring Your Own FS
original_id: fs
---

The "isomorphic" in isomorphic-git means it works equally well on the server or the browser.
This is hard to do since git uses the file system, and browsers do not have access to the file system.
So rather than relying on a particular filesystem module, isomorphic-git is BYOFS (Bring Your Own File System).
You use isomorphic-git's plugin system to bring your filesystem to it. 

## Node's fs

If you're only using isomorphic-git in Node, you can just use the native `fs` module:

```js live
const git = require('isomorphic-git');
const fs = require('fs');
const files = await git.listFiles({fs, dir: __dirname});
console.log(files)
```

## LightningFS

If you are writing code for the browser, you will need something that emulates the `fs` API.
While BrowserFS (see next section) has more features, [LightningFS](https://github.com/isomorphic-git/lightning-fs) might very well fit your needs.
It was designed from scratch for `isomorphic-git` (by the same author) to eek out more performance
for fewer bytes. As an added bonus it's dead simple to configure.

```html
<script src="https://unpkg.com/@isomorphic-git/lightning-fs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
const fs = new LightningFS('my-app')
git.plugins.set('fs', fs)
const files = git.listFiles({ dir: '/' });
console.log(files);
</script>
```

You can configure LightningFS to load files from an HTTP server as well, which makes it easy to prepopulate a browser file system
with a directory on your server. See the LightningFS documentation for an example of how to do this.

## BrowserFS

If you are writing code for the browser, you will need something that emulates the `fs` API.
At the time of writing, the most complete option is [BrowserFS](https://github.com/jvilk/BrowserFS).
It has a few more steps involved to set up than in Node, as seen below:

```html
<script src="https://unpkg.com/browserfs@beta"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
BrowserFS.configure({ fs: "IndexedDB", options: {} }, function (err) {
  if (err) return console.log(err);
  const fs = BrowserFS.BFSRequire("fs");
  git.plugins.set('fs', fs)
  const files = git.listFiles({ dir: '/' });
  console.log(files);
});
</script>
```

Besides IndexedDB, BrowserFS supports many different backends with different performance characteristics (some backends support sync operations, some only async), as well as different features such as proxying a static file server as a read-only file system, mounting ZIP files as file systems, or overlaying a writeable in-memory filesystem on top of a read-only filesystem.
You don't need to know all these features, but familiarizing yourself with the different options may be necessary if you hit a storage limit or performance bottleneck in the IndexedDB backend I suggested above.

An [advanced example usage](https://github.com/isomorphic-git/isomorphic-git/blob/53f2e909030adb1c6ae855b14f3a2474ca93ce71/__tests__/__helpers__/FixtureFS.js#L12) is in the old unit tests for isomorphic-git.
It uses HTTPRequestFS to mount (read-only) the test fixtures directory which is stored on the server, then adds a read-write InMemoryFS layer using OverlayFS so that the tests can modify files locally.
In between tests it empties the InMemoryFS, restoring the file system to a pristine state.
The current unit tests use LightningFS instead, which was built with this HTTP-backed overlay behavior by default, because I find it so useful.
