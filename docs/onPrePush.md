---
title: onPrePush
sidebar_label: onPrePush
---

The `onPrePush` callback is called before sending an object pack to remote and can be used to abort the push action.

This callback is implemented as an equivalent to the canonical git `pre-push` hook. An `onPrePush` function is passed an object containing information about the target remote and `url`, local and remote `ref` name and the commit oids. This function must return `false` if the push action is to be aborted and `true` if not.

```js
/**
 * @callback PrePushCallback
 * @param {PrePushParams} args
 * @returns {boolean | Promise<boolean>} Returns false if the push must be cancelled
 */

/**
 * @typedef {Object} PrePushParams
 * @property {string} remote The expanded name of the target remote
 * @property {string} url The URL address of the target remote
 * @property {ClientRef} localRef The ref which the client wants to push to the remote
 * @property {ClientRef} remoteRef The ref which is known by the remote
 */

/**
 * @typedef {Object} ClientRef
 * @property {string} ref The name of the ref
 * @property {string} oid The SHA-1 object id the ref points to
 */
```

For more information, see [`pre-push` git documentation](https://git-scm.com/docs/githooks#_pre_push).

## Example

```js
await git.push({
  ...,
  onPrePush: args => {
    console.log(args)
    return false
  }
})
```