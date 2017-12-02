import { init } from './init'
import { config } from './config'
import { fetch } from './fetch'
import { checkout } from './checkout'
import { fs as defaultfs, setfs } from '../utils'

export async function clone (
  { workdir, gitdir, fs = defaultfs() },
  {
    url,
    remote,
    ref,
    authUsername,
    authPassword,
    depth,
    since,
    exclude,
    relative,
    onprogress
  }
) {
  setfs(fs)
  remote = remote || 'origin'
  await init({ gitdir, fs })
  // Add remote
  await config(
    {
      gitdir,
      fs
    },
    {
      path: `remote.${remote}.url`,
      value: url
    }
  )
  // Fetch commits
  await fetch(
    {
      gitdir,
      fs
    },
    {
      ref,
      remote,
      authUsername,
      authPassword,
      depth,
      since,
      exclude,
      relative,
      onprogress
    }
  )
  // Checkout branch
  await checkout(
    {
      workdir,
      gitdir,
      fs
    },
    {
      ref,
      remote
    }
  )
}
