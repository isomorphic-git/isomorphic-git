---
id: version-0.70.7-webworker
title: WebWorker Guide
sidebar_label: WebWorker Guide
original_id: webworker
---

While `isomorphic-git` tries not to block the main thread, it still does on occasion.
This can cause your webapp to stutter or even freeze up briefly!
To achieve buttery smooth performance, you'll eventually want to move all your `isomorphic-git` usage off of the main thread.

## Introduction

WebWorkers live in a separate operating system thread from the main JS thread and communicate using the [worker.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) method.
Code in the worker thread does not have access to heap objects in the main thread.
So all objects sent via postMessage need to be serialized before being sent.
Technically, this is done using the [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) algorithm.

What kinds of Objects can be sent using `postMessage`? Functions cannot. Therefore objects with methods cannot.
JSON objects can. `Date` objects and `RegExp` objects can. Also `Uint8Array` objects and `Map` objects and `Set` objects.
So basically the types of objects you can send to a worker are a superset of JSON but a subset of full JavaScript objects.
For convenience, throughout the rest of this document I will refer to objects that can be serialized via the structured clone algorithm as "cloneable" objects.

Because of foresight and planning, most `isomorphic-git` functions are:

1. async
2. have a single, cloneable object as their argument.

The plugins (excepting `fs` plugin) also follow this pattern.
This greatly simplifies the job of mapping `isomorphic-git` calls to a remote procedure call (RPC) API using `postMessage`.
If you already have a WebWorker in your project and a preferred way to communicating with it, then mapping `isomorphic-git` calls is easy.

If you don't already have a preferred WebWorker RPC solution, then the easiest way is to use the [MagicPortal](https://www.npmjs.com/package/magic-portal) which was designed specifically for `isomorphic-git` so it's a perfect match!
The examples below will use MagicPortal.

## Implementation

In the main thread, we acquire a proxy isomorphic-git we can use.

```js
// main.js
;(async () => {
  let worker = new Worker("./worker.js")

  const portal = new MagicPortal(worker)
  // Acquire it from the worker
  const git = await portal.get('git')
})();
```

In the worker, we expose `isomorphic-git` to the main thread.

```js
// worker.js
importScripts([
  "https://isomorphic-git.org/js/browserfs.js",
  "https://unpkg.com/isomorphic-git",
  "https://unpkg.com/magic-portal",
])

BrowserFS.configure({ fs: 'IndexedDB', options: {} }, function (err) {
  if (err) return console.log(err)

  // Initialize isomorphic-git
  const fs = BrowserFS.BFSRequire('fs')
  git.plugins.set('fs', fs)

  // Expose it to the main thread
  const portal = new MagicPortal(self);
  portal.set('git', git)
})
```

## Plugins

All plugins have to be setup in the worker, because the plugin functions have to live in the same thread as `isomorphic-git`.
Therefore, if your plugin needs to interact with the main thread, you have to ALSO proxy your plugin!

```js
// main.js
const credentialManager = {
  async fill({ url }) {
    let username = window.prompt("Username:")
    let password = window.prompt("Password:")
    return { username, password }
  },
  async approved({ url, auth }) {
    return
  },
  async rejected({ url, auth }) {
    window.alert('Authentication rejected')
    return
  }
}
portal.set('credentialManager', credentialManager, {void: ['approved', 'rejected']})

```

```js
// worker.js
let credentialManager = await portal.get('credentialManager')
git.plugins.set('credentialManager', credentialManager)
```

## Example

Here is a complete example that runs git in a WebWorker.
The worker exposes 'git' to the main thread, and the main thread exposes the 'emitter' and 'credentialManager' plugins (which need access to the DOM) to the worker.

Gist: https://gist.github.com/wmhilton/c311070034bc8d99e3e82d97636d0fd8

<iframe src="https://codesandbox.io/embed/kkpx6q162o?fontsize=13&module=%2Fworker.js" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

