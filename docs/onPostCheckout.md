---
title: onPostCheckout
sidebar_label: onPostCheckout
---

The `onPostCheckout` callback is called after a worktree is updated. 

This callback is implemented as an equivalent to the canonical git `post-checkout` hook. The `onPostCheckout` function is passed an object containing the object IDs of the previous and new HEAD and information about whether a branch or a set of files was checked.

```js
/**
 * @callback PostCheckoutCallback
 * @param {PostCheckoutParams} args
 * @returns {void | Promise<void>}
 */

/**
 * @typedef {Object} PostCheckoutParams
 * @property {string} previousHead The SHA-1 object id of HEAD before checkout
 * @property {string} newHead The SHA-1 object id of HEAD after checkout
 * @property {'branch' | 'file'} type flag determining whether a branch or a set of files was checked
 */
```

For more information, see [`post-checkout` git documentation](https://git-scm.com/docs/githooks#_post_checkout).

## Example

```js
await git.checkout({
  ...,
  onPostCheckout: args => {
    console.log(args)
  }
})
```