import systemfs from 'fs'
export default function () {
  return global.fs || systemfs
}
