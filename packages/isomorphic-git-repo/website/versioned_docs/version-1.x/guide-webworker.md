---
id: version-1.x-webworker
title: WebWorker Example
sidebar_label: WebWorker Example
original_id: webworker
---

While `isomorphic-git` tries not to block the main thread, it still does on occasion.
This can cause your webapp to stutter or even freeze up briefly!
To achieve buttery smooth performance, you'll eventually want to move all your `isomorphic-git` usage off of the main thread.
Actually, you should move all your logic that's not directly responsible for updating the DOM off the main thread.
That's still a real challenge in 2020, but more and more libraries are appearing to help solve this.

## Introduction

WebWorkers live in a separate operating system thread from the main JS thread and communicate using the [worker.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) method.
Code in the worker thread does not have access to heap objects in the main thread.
So all objects sent via postMessage need to be serialized before being sent.
Technically, this is done using the [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) algorithm.

What kinds of Objects can be sent using `postMessage`? Functions cannot. Therefore objects with methods cannot.
JSON objects can. `Date` objects and `RegExp` objects can. Also `Uint8Array` objects and `Map` objects and `Set` objects.
So basically the types of objects you can send to a worker are a superset of JSON but a subset of full JavaScript objects.

If you don't already have a WebWorker RPC solution, then I recommend using [MagicPortal](https://www.npmjs.com/package/magic-portal) (because I wrote it) or [Comlink](https://www.npmjs.com/package/comlink) which is a similar library.
The example below will use MagicPortal.

## Example

Here is a complete example that runs git in a WebWorker.
The worker wraps some git functions and exposes them to the main thread, while the main thread exposes some functions to the worker for use in callbacks like `onProgress`, `onMessage`, and `onAuth`.

<iframe
  src="https://codesandbox.io/embed/magic-portal-with-isomorphic-git-ejdoo?fontsize=14&hidenavigation=1&module=%2Fworker.js&theme=dark"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="isomorphic-git@1.0 in a Worker example"
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
