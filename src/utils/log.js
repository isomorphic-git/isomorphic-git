let shouldLog = null

export function log (...args) {
  if (shouldLog === null) {
    // touching localStorage causes an SECURITY_ERR in Chrome for plain HTTP sites with non localhost origin I think.
    // at least that is what I'm seeing doing Karma testing on my Android phone via local WAN
    // using Object.getPropertyDescriptor(window, 'localStorage').enumerable didn't avoid the error either
    try {
      shouldLog =
        (process &&
          process.env &&
          process.env.DEBUG &&
          (process.env.DEBUG === '*' ||
            process.env.DEBUG === 'isomorphic-git')) ||
        (typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined' &&
          (window.localStorage.debug === '*' ||
            window.localStorage.debug === 'isomorphic-git'))
    } catch (_) {
      shouldLog = false
    }
  }
  if (shouldLog) {
    console.log(...args)
  }
}
