---
title: onProgress
sidebar_label: onProgress
---

Long-running commands can accept an `onProgress` callback that is called with `GitProgressEvent`s.

```js
/**
 * @typedef {Object} GitProgressEvent
 * @property {string} phase
 * @property {number} loaded
 * @property {number} total
 */
```

Progress events are not guaranteed to be in order or always incrementing.
Many git commands (like `clone`) actually consist of multiple sub-commands (`fetch` + `indexPack` + `checkout`) which
makes computing a single progress percentage tricky.
Instead, progress events are marked with a `phase` that provides a description of what step of the process it is in.
You could choose to show the phase as a label next to the progress bar, or show one progress bar per phase.

## Usage Example:

You are writing a browser application, and want to display progress in your UI somehow.

```js
import { clone } from 'isomorphic-git'
clone({
  ...,
  onProgress: event => {
    updateLabel(event.phase)
    if (event.total) {
      updateProgressBar(event.loaded / event.total)
    } else {
      updateIndeterminateProgressBar(event.loaded)
    }
  }
})
```
