import pako from 'pako'
import GitCommit from '../models/GitCommit'
import GitBlob from '../models/GitBlob'
import GitTree from '../models/GitTree'
import commitSha from '../utils/commitSha'
import wrapCommit from '../utils/wrapCommit'
import unwrapObject from '../utils/unwrapObject'
import write from '../utils/write'
import read from '../utils/read'
import resolveRef from '../utils/resolveRef'
import fs from 'fs'
import pify from 'pify'
import {Buffer} from 'buffer'

export default async function checkout ({dir, remote, ref}) {
  // Get tree
  
  // Get objects + recurse
  // Write files. Preferably atomically.
  
}