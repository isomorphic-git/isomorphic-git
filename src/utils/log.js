let shouldLog = null

export function log (...args) {
  if (shouldLog === null) {
    shouldLog =
      process.env.DEBUG === '*' ||
      process.env.DEBUG === 'isomorphic-git' ||
      (typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined' &&
        (window.localStorage.debug === '*' ||
          window.localStorage.debug === 'isomorphic-git'))
  }
  if (shouldLog) {
    console.log(...args)
  }
}
