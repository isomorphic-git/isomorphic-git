#! /usr/bin/env node
// Build-time helper for the browser (Karma) test harness.
//
// The browser fixtures are served over HTTP and read through @zenfs/core's
// `Fetch` backend. A symlink cannot round-trip that way: a static file server
// *follows* the link and returns the target file's bytes, so reading it over
// Fetch yields the target's content instead of the link string, and the `size`
// in index.json (the link length) no longer matches. Worse, once a symlink is
// present in the Fetch index, *any* path resolution through it tries to
// `readlink` it and fails with ENODATA (the target can't be fetched
// synchronously) — which poisons unrelated tests too.
//
// So we (1) REMOVE every symlink entry from index.json, so the Fetch layer never
// serves it, and (2) record its target here, to be materialized into the
// writable overlay at mount time (see makeZenFS.js). `lstat` then reports mode
// 0o120000 and `readlink` returns the correct target, entirely from the overlay.
//
// This is a workaround for two upstream @zenfs/core issues (see ../../bug/05):
//   - make-index recorded symlinks as regular files (fixed there with lstat), and
//   - the Fetch backend has no way to carry a symlink's target inline.

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', '__fixtures__')

/** @type {Record<string, string>} posix path (rooted at '/') -> link target */
const map = {}

/** @param {string} dir */
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name)
    const stat = fs.lstatSync(abs)
    if (stat.isSymbolicLink()) {
      const rel = '/' + path.relative(root, abs).split(path.sep).join('/')
      map[rel] = fs.readlinkSync(abs).split(path.sep).join('/')
    } else if (stat.isDirectory()) {
      walk(abs)
    }
  }
}

walk(root)

fs.writeFileSync(path.join(root, 'symlinks.json'), JSON.stringify(map))

// Strip the symlink entries from index.json so the Fetch backend never tries to
// serve (and readlink) them — they are materialized in the overlay instead.
const indexPath = path.join(root, 'index.json')
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
let removed = 0
for (const linkPath of Object.keys(map)) {
  if (linkPath in index.entries) {
    delete index.entries[linkPath]
    removed++
  }
}
fs.writeFileSync(indexPath, JSON.stringify(index))

console.log(
  `Wrote ${Object.keys(map).length} symlink(s) to symlinks.json; ` +
    `removed ${removed} from index.json`
)
