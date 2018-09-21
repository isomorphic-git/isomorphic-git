export function compareRefNames (a, b) {
  // https://stackoverflow.com/a/40355107/2168416
  let _a = a.replace(/\^\{\}$/, '')
  let _b = b.replace(/\^\{\}$/, '')
  let tmp = -(_a < _b) || +(_a > _b)
  if (tmp === 0) {
    return a.endsWith('^{}') ? 1 : -1
  }
  return tmp
}
