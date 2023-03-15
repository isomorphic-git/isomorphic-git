// https://dev.to/namirsab/comment/2050
export function arrayRange(start, end) {
  const length = end - start
  return Array.from({ length }, (_, i) => start + i)
}
