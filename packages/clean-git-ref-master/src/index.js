'use strict';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, search, replacement) {
  search = search instanceof RegExp
      ? search
      : new RegExp(escapeRegExp(search), 'g');

  return str.replace(search, replacement);
}

const CleanGitRef = {
  clean(value) {
    if (typeof value !== 'string') {
      throw new Error('Expected a string, received: ' + value);
    }

    value = replaceAll(value, './', '/');
    value = replaceAll(value, '..', '.');
    value = replaceAll(value, ' ', '-');
    value = replaceAll(value, /^[~^:?*\\\-]/g, '');
    value = replaceAll(value, /[~^:?*\\]/g, '-');
    value = replaceAll(value, /[~^:?*\\\-]$/g, '');
    value = replaceAll(value, '@{', '-');
    value = replaceAll(value, /\.$/g, '');
    value = replaceAll(value, /\/$/g, '');
    value = replaceAll(value, /\.lock$/g, '');
    return value;
  }
};

//module.exports = CleanGitRef;
export default CleanGitRef;
