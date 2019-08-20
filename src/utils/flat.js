// TODO: Should I just polyfill Array.flat?
export const flat =
  typeof Array.prototype.flat === 'undefined'
    ? entries => entries.reduce((acc, x) => acc.concat(x), [])
    : entries => entries.flat()
