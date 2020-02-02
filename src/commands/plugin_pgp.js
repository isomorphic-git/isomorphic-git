// @ts-check
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} GitSignParams
 * @property {string} payload - a plaintext message
 * @property {string} secretKey - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
 */

/**
 *
 * @callback GitSign
 * @param {GitSignParams} args
 * @return {Promise<{signature: string}>} - an 'ASCII armor' encoded "detached" signature
 */

/**
 *
 * @typedef {Object} GitVerifyParams
 * @property {string} payload - a plaintext message
 * @property {string} publicKey - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
 * @property {string} signature - an 'ASCII armor' encoded PGP "detached" signature (technically can actually contain _multiple_ signatures)
 */

/**
 *
 * @callback GitVerify
 * @param {GitVerifyParams} args
 * @return {Promise<{valid: string[], invalid: string[]}>} - two arrays containing the key ids of the valid and invalid signatures respectively
 */

/**
 *
 * @typedef {Object} GitPgpPlugin
 * @property {GitSign} sign
 * @property {GitVerify} verify
 */

/**
 * A plugin for providing PGP signing and verification.
 *
 * You need to initialize a `pgp` plugin in order to use the signing feature of the [commit](./commit.md) command, and the verification features
 * of the [verify](./verify.md) and [log](./log.md) commands. Here is how:
 *
 * ```js
 * // Using require() in Node.js
 * const git = require('isomorphic-git')
 * const { pgp } = require('@isomorphic-git/pgp-plugin')
 * git.plugins.pgp(pgp)
 *
 * // using ES6 modules
 * import { plugins } from 'isomorphic-git'
 * import { pgp } from '@isomorphic-git/pgp-plugin'
 * plugins.pgp(pgp)
 * ```
 *
 * ## Choices!
 *
 * You can choose between an [OpenPGP.js plugin](https://github.com/isomorphic-git/openpgp-plugin) and an [isomorphic-pgp plugin](https://github.com/isomorphic-git/pgp-plugin)!
 * The OpenPGP one has much wider support for different keys at the cost of a huge bundle size, while the isomorphic-pgp plugin has restricted key support but 1/10th the size.
 *
 * ### Implementing your own `pgp` plugin
 *
 * A `pgp` plugin must implement the following API:
 *
 * #### async sign({ payload, secretKey }) => { signature }
 *
 * | param         | type [= default]               | description                                                                         |
 * | ------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
 * | **payload**   | string                         | a plaintext message                                                                 |
 * | **secretKey** | string                         | an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys) |
 * | return        | Promise\<{signature: string}\> | an 'ASCII armor' encoded "detached" signature                                       |
 *
 * #### async verify({ payload, publicKey, signature}) => { valid, invalid }
 *
 * | param         | type [= default]                                | description                                                                                                |
 * | ------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
 * | **payload**   | string                                          | a plaintext message                                                                                        |
 * | **publicKey** | string                                          | an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)                        |
 * | **signature** | string                                          | an 'ASCII armor' encoded PGP "detached" signature (technically can actually contain _multiple_ signatures) |
 * | return        | Promise\<{valid: string[], invalid: string[]}\> | two arrays containing the key ids of the valid and invalid signatures respectively                         |
 *
 * For verification, `valid` will contain the key ids of all valid signatures, and `invalid` will contain the key ids of all the invalid signatures.
 * For 99% of use cases, there will only be one signature, so one of those arrays will be empty and the other will contain  *the* signature.
 * But it is theoretically possible for commits to have multiple signatures.
 *
 * > Note: in the future, a PGP "keyring" plugin might be added that alleviate the burden of looking up all the public keys.
 *
 * ### Background
 * Cryptographically signing commits via OpenPGP [[1](#footnote1)] is an important feature of git.
 * It lets you verify that commits were really created by the stated author.
 * Otherwise, anybody could make a commit using someone elses email.
 *
 * Including the current state-of-the-art library, `openpgpjs`, directly into `isomorphic-git`
 * was impractical, due to the huge size of the library (over 1000KB) and license restrictions
 * that probably would make including `openpgpjs` directly in a minified bundle with `isomorphic-git`
 * illegal [[2](#footnote2)].
 *
 * Therefore, `openpgpjs` support is provided by a separate npm package, under an LGPL license to match
 * openpgpjs.
 *
 * I've also created my own PGP library, `isomorphic-pgp`, to push the envelope of what's possible within realistic bundle size budgets.
 *
 * #### Footnotes:
 * <a name="footnote1">1</a>: [OpenPGP](https://www.openpgp.org/) is the [IETF standardization](https://tools.ietf.org/html/rfc4880) of the original PGP protocol. PGP stands for Pretty Good Privacy. Git's documentation refers to GPG, which is short for [GNU Privacy Guard](https://gnupg.org/), which is a particular implementation of the OpenPGP protocol.
 *
 * <a name="footnote2">2</a>: The LGPL was written with C in mind, so you have to extrapolate what "statically linked" and "dynamically linked" mean in the JavaScript era).
 * My own interpretation is that for OpenPGP.js to be "dynamically linked", end users must have a non-trivial way of swapping out the OpenPGP.js instance used by a website by default, with another version of the library (their "own" version).
 * This is nearly impossible if the JavaScript is bundled and minified.
 * It's also hard to do on existing websites, but distributing it as a separate file at least makes it doable.
 *
 * @param {?GitPgpPlugin} plugin - The pgp plugin
 * @param {string} [core = 'default'] - The plugin namespace to add the plugin to
 * @returns {void}
 *
 */
export function pgp (plugin, core = 'default') {
  cores.get(core).set('pgp', plugin)
}
