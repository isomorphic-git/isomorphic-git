// Like Object.assign but ignore properties with undefined values
// ref: https://stackoverflow.com/q/39513815
export function assignDefined(target, ...sources) {
  for (const source of sources) {
    if (source) {
      for (const key of Object.keys(source)) {
        const val = source[key]
        if (val !== undefined) {
          target[key] = val
        }
      }
    }
  }
  return target
}
