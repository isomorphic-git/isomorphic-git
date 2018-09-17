import { PassThrough } from 'stream'

import { GitPktLine } from '../models/GitPktLine.js'
import { pkg } from '../utils/pkg'

export async function writeRefsAdResponse ({ capabilities, refs, symrefs }) {
  let stream = new PassThrough()
  // Compose capabilities string
  let syms = ''
  for (const [key, value] of Object.entries(symrefs)) {
    syms += `symref=${key}:${value} `
  }
  let caps = `\0${[...capabilities].join(' ')} ${syms}agent=${pkg.agent}`
  // stream.write(GitPktLine.encode(`# service=${service}\n`))
  // stream.write(GitPktLine.flush())
  // Note: In the edge case of a brand new repo, zero refs (and zero capabilities)
  // are returned.
  for (const [key, value] of Object.entries(refs)) {
    stream.write(GitPktLine.encode(`${value} ${key}${caps}\n`))
    caps = ''
  }
  stream.write(GitPktLine.flush())
  stream.end()
  return stream
}
