// For some reason path.posix.join is undefined in webpack?
export const posixJoin = (prefix, filename) =>
  prefix ? `${prefix}/${filename}` : filename
