// @ts-check
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} GitEmitterPlugin
 * @property {function(string, any): void} emit
 */

/**
 *
 * @typedef {Object} ProgressEvent
 * @property {string} phase
 * @property {boolean} lengthComputable
 * @property {number} loaded
 * @property {number} total
 */

/**
 * A plugin for listening to progress events.
 *
 *
 * If you initialize `isomorphic-git` with a EventEmitter so you can receive `'message'` and `'progress'` events.
 * The [`clone`](clone), [`fetch`](fetch), [`push`](push), and [`pull`](pull) commands all emit events.
 *
 * <table>
 * <tr><th> event </th><th> type </th><th> description </th></tr>
 * <tr><td> message </td><td> `string` </td><td>
 *
 * `'message'` events are for messages generated by the remote server and sent during `fetch` and `push` requests.
 * They are particularly useful if the remote server has custom git-hooks that print to the console.
 *
 * </td></tr>
 * <tr><td> progress </td>
 * <td>
 *
 * `ProgressEvent`
 *
 * </td>
 * <td>
 *
 * `'progress'` events are numerical events that could be used to drive progress bar-style animations.
 *
 * > Note: `'progress'` events are not guaranteed to be in order or always incrementing.
 * Many git commands (like `clone`) actually consist of multiple sub-commands (`fetch` + `indexPack` + `checkout`) which
 * makes computing a single progress percentage tricky.
 * Instead, progress events are marked with a `phase` that provides a description of basically what step of the process it is in.
 * You could choose to show the phase as a label next to the progress bar, or show one progress bar per phase.
 *
 * </td>
 * </tr>
 * </table>
 *
 * {@link ProgressEvent typedef}
 *
 * ## Usage Example 1:
 *
 * You are writing a console application, and you want to simply print any server messages to standard out.
 *
 * ```js
 * // This example is for Node.js
 * const EventEmitter = require('events')
 * const git = require('isomorphic-git')
 * const emitter = new EventEmitter()
 * git.plugins.emitter(emitter)
 *
 * emitter.on('message', message => {
 *   console.log(message)
 * })
 * ```
 *
 * ## Usage Example 2:
 *
 * You are writing a web application, and want to display both the latest message and a progress bar.
 * In the real world, you would probably be using the latest JS framework like React or Vue, but for this example
 * I will stick with the DOM API.
 *
 * > Note: This is not a working example. It focuses only on the parts related to the emitter plugin.
 *
 * ```html
 * <html>
 *   <div id="cloning-message"></div>
 *   <div>
 *     <span id="cloning-percent"></span>
 *     <progress id="cloning-progress-bar" value="0" max="100"/>
 *   </div>
 *   <script type="module">
 *     // Note: Webpack automatically polyfills Node's builtin `events` module
 *     //       with the npm module https://www.npmjs.com/package/events
 *     import EventEmitter from 'events'
 *     import { plugins, clone } from 'isomorphic-git'
 *     plugins.emitter(emitter)
 *
 *     // (In a working example you would also have to set up an 'fs' plugin.)
 *
 *     const doClone = async () => {
 *       const onMessage = message => {
 *         let el = document.getElementById('cloning-message')
 *         el.innerText = message
 *       }
 *       const onProgress = progress => {
 *         let el = document.getElementById('cloning-progress-bar')
 *         el.setAttribute('max', progress.total)
 *         el.setAttribute('value', progress.loaded)
 *         let span = document.getElementById('cloning-percent')
 *         span.innerText = Math.floor(100 * progress.loaded / progress.total) + '%'
 *       }
 *       emitter.on('message', onMessage)
 *       emitter.on('progress', onProgress)
 *
 *       // (In a working example you'd fill in the clone command arguments)
 *       await clone({...})
 *
 *       emitter.off('message', onMessage)
 *       emitter.off('progress', onProgress)
 *     }
 *   </script>
 * </html>
 * ```
 *
 * ### Implementing your own `emitter` plugin
 *
 * Isomorphic-git does not listen to events, it only emits them.
 * So your `emitter` object technically only needs to implement an `emit` method:
 *
 * {@link GitEmitterPlugin typedef}
 *
 * > Note: This means you could rewrite the first example like this if you wanted:
 * >
 * >  ```js
 * >  const git = require('isomorphic-git')
 * >  // No need to use a full EventEmitter object here!
 * >  const emitter = {
 * >    emit (event, message) {
 * >      if (event === 'message') {
 * >        console.log(message)
 * >      }
 * >    }
 * >  }
 * >  git.plugins.set('emitter', emitter)
 * >  ```
 *
 * @param {?GitEmitterPlugin} plugin - The emitter plugin
 * @param {string} [core = 'default'] - The plugin namespace to add the plugin to
 * @returns {void}
 *
 */
export function emitter (plugin, core = 'default') {
  cores.get(core).set('emitter', plugin)
}
