import path from 'path'
import { init } from './init'
import { config } from './config'
import { fetch } from './fetch'
import { checkout } from './checkout'
import { FileSystem } from '../models'

/**
 * Clone a repository
 *
 * @link https://isomorphic-git.github.io/docs/clone.html
 */
export async function clone ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  url,
  ref,
  remote,
  authUsername,
  authPassword,
  depth,
  since,
  exclude,
  relative,
  singleBranch,
  onprogress
}) {
  if (onprogress !== undefined) {
    console.warn(
      'The `onprogress` callback has been deprecated. Please use the more generic `emitter` EventEmitter argument instead.'
    )
  }
  const fs = new FileSystem(_fs)
  remote = remote || 'origin'
  await init({ gitdir, fs })
  // Add remote
  await config({
    gitdir,
    fs,
    path: `remote.${remote}.url`,
    value: url
  })
  await config({
    gitdir,
    fs,
    path: `remote.${remote}.fetch`,
    value: `+refs/heads/*:refs/remotes/${remote}/*`
  })
  // Fetch commits
  let { defaultBranch } = await fetch({
    gitdir,
    fs,
    emitter,
    ref,
    remote,
    authUsername,
    authPassword,
    depth,
    since,
    exclude,
    relative,
    singleBranch
  })
  ref = ref || defaultBranch
  ref = ref.replace('refs/heads/', '')
  // Checkout that branch
  await checkout({
    dir,
    gitdir,
    fs,
    ref,
    remote
  })
}
