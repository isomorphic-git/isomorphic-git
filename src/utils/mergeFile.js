import diff3Merge from 'diff3'

const LINEBREAKS = /^.*(\r?\n|$)/gm

export function mergeFile({
  ourContent,
  baseContent,
  theirContent,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
}) {
  const ours = ourContent.match(LINEBREAKS)
  const base = baseContent.match(LINEBREAKS)
  const theirs = theirContent.match(LINEBREAKS)

  // Here we let the diff3 library do the heavy lifting.
  const result = diff3Merge(ours, base, theirs)

  const markerSize = 7

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

      mergedText += `${'='.repeat(markerSize)}\n`
      mergedText += item.conflict.b.join('')
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`
    }
  }
  return { cleanMerge, mergedText }
}
