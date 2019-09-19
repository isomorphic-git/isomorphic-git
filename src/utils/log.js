let shouldLog = null

export function log (...args) {
  if (shouldLog === null) {
    // Reading localStorage can throw a SECURITY_ERR in Chrome Mobile if "Block third-party cookies and site data" is enabled
    // and maybe in other scenarios too. I started seeing this error doing Karma testing on my Android phone via local WLAN.
    // Using the Object.getPropertyDescriptor(window, 'localStorage').enumerable trick didn't avoid the error so using try/catch.
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
