/*
Adapted from is-git-ref-name-valid
SPDX-License-Identifier: MIT
Copyright © Vincent Weevers
*/

// eslint-disable-next-line no-control-regex
const bad = /(^|[/.])([/.]|$)|^@$|@{|[\x00-\x20\x7f~^:?*[\\]|\.lock(\/|$)/

export default function isValidRef(name, onelevel) {
  if (typeof name !== 'string')
    throw new TypeError('Reference name must be a string')

  return !bad.test(name) && (!!onelevel || name.includes('/'))
}
