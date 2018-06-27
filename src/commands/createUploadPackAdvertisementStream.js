import { PassThrough } from 'stream'

import { GitRemoteConnection } from '../managers'

export async function createUploadPackAdvertisementStream ({
  service,
  capabilities,
  refs,
  symrefs
}) {
  try {
    const res = new PassThrough()
    await GitRemoteConnection.sendInfoRefs(service, res, {
      capabilities,
      refs,
      symrefs
    })
    return res
  } catch (err) {
    err.caller = 'git.streamUploadPackAdvertisement'
    throw err
  }
}
