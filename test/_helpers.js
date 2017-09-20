import fs from 'fs'
import temp from 'temp'
import pify from 'pify'

temp.track()
export const tmpdir = pify(cb => temp.mkdir(null, cb))
export const cleanup = pify(temp.cleanup)
export const exists = fs.existsSync
