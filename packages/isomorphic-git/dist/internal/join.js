import path from 'path-browserify';

function compareStrings(a, b) {
  // https://stackoverflow.com/a/40355107/2168416
  return -(a < b) || +(a > b)
}

function dirname(path) {
  const last = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  if (last === -1) return '.'
  if (last === 0) return '/'
  return path.slice(0, last)
}

const { join } = path;

export { compareStrings, dirname, join };
