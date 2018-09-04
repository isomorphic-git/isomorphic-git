import globalyzer from 'globalyzer'

export const patternRoot = pattern => {
  // return pattern.split('*', 1)[0]
  const base = globalyzer(pattern).base
  return base === '.' ? '' : base
}
