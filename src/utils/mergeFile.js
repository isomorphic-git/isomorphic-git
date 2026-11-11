import diff3Merge from 'diff3'

// Lines with their LF; the last item is what follows the final LF ('' when
// the text ends with one). Only LF ends a line, as in git: a lone CR is an
// ordinary byte and has to survive the merge.
function lines(text) {
  const parts = text.split('\n')
  return parts.map((part, i) => (i < parts.length - 1 ? `${part}\n` : part))
}

function formatConflictSide(lines) {
  const text = lines.join('')
  return text && !text.endsWith('\n') ? `${text}\n` : text
}

export function mergeFile({ branches, contents }) {
  const ourName = branches[1]
  const theirName = branches[2]

  const baseContent = contents[0]
  const ourContent = contents[1]
  const theirContent = contents[2]

  const ours = lines(ourContent)
  const base = lines(baseContent)
  const theirs = lines(theirContent)

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
      mergedText += formatConflictSide(item.conflict.a)

      mergedText += `${'='.repeat(markerSize)}\n`
      mergedText += formatConflictSide(item.conflict.b)
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`
    }
  }
  return { cleanMerge, mergedText }
}
