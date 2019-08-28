import diff3Merge from 'diff3'

const LINEBREAKS = /^.*(\r?\n|$)/gm

export function _mergeFile ({
  ours,
  base,
  theirs,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  format = 'diff',
  markerSize = 7
}) {
  ours = ours.match(LINEBREAKS)
  base = base.match(LINEBREAKS)
  theirs = theirs.match(LINEBREAKS)

  // Here we let the diff3 library do the heavy lifting.
  const result = diff3Merge(ours, base, theirs)

  // Here we note whether there are conflicts and format the results
  let mergedText = ''
  let cleanMerge = true
  for (const item of result) {
    if (item.ok) {
      mergedText += item.ok.join('')
    }
    if (item.conflict) {
      cleanMerge = false
      mergedText += `${'<'.repeat(markerSize)} ${ourName}\n`
      mergedText += item.conflict.a.join('')
      if (format === 'diff3') {
        mergedText += `${'|'.repeat(markerSize)} ${baseName}\n`
        mergedText += item.conflict.o.join('')
      }
      mergedText += `${'='.repeat(markerSize)}\n`
      mergedText += item.conflict.b.join('')
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`
    }
  }
  return { cleanMerge, mergedText }
}
