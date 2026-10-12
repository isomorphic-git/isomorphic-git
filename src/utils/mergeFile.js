import diff3Merge from 'diff3'

// Lines with their endings. Only LF ends a line, as in git: a lone CR is an
// ordinary byte and has to survive the merge. Text that ends in LF has an
// empty last line, as it always had here: diff3 aligns the lines on it.
const lines = text =>
  text
    .split('\n')
    .map((line, i, all) => (i < all.length - 1 ? `${line}\n` : line))

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

  // A marker line, with the conflict's line ending. A side whose last line
  // has no newline gets one first, so the marker starts its own line.
  const marker = (chars, label, eol) => {
    if (mergedText && !mergedText.endsWith('\n')) mergedText += eol
    mergedText += chars.repeat(markerSize) + (label ? ` ${label}` : '') + eol
  }

  // Like git, lines both sides agree on stay out of the markers, and
  // conflicts close to each other are written as one.
  for (const piece of joinNearby(split(result, ours, theirs))) {
    if (piece.text) {
      mergedText += piece.text.join('')
      continue
    }
    cleanMerge = false
    const eol = needsCr(ours, theirs, base, piece) ? '\r\n' : '\n'
    marker('<', ourName, eol)
    mergedText += piece.a.join('')
    marker('=', '', eol)
    mergedText += piece.b.join('')
    marker('>', theirName, eol)
  }
  return { cleanMerge, mergedText }
}

/**
 * The merge as a list of pieces: `{ text }` for lines that merged and
 * `{ a, b, aStart, bStart }` for a conflict: our and their side, and where
 * they start in ours and theirs. Each conflict is split
 * where both sides agree. A piece of text is marked `agreed` when ours and
 * theirs have exactly these lines there. Only such text lets git join two
 * conflicts: a change made by one side only keeps them apart, while the same
 * change made by both sides leaves no trace in git's merge.
 *
 * @param {Array<Object>} result - what diff3Merge returned
 * @param {string[]} ours
 * @param {string[]} theirs
 * @returns {Array<{text: string[], agreed?: boolean} | {a: string[], b: string[], aStart: number, bStart: number}>}
 */
function split(result, ours, theirs) {
  const pieces = []
  let previous
  for (const item of result) {
    if (item.ok) {
      pieces.push({ text: item.ok })
      continue
    }
    const conflict = item.conflict
    const text = pieces[pieces.length - 1]
    if (previous && text && text.text) {
      // The text between two conflicts. diff3Merge also puts changes there
      // that merged cleanly, and those keep the conflicts apart.
      const a = ours.slice(previous.aIndex + previous.a.length, conflict.aIndex)
      const b = theirs.slice(
        previous.bIndex + previous.b.length,
        conflict.bIndex
      )
      text.agreed = a.length === b.length && a.every((line, i) => line === b[i])
    }
    pieces.push(...refine(conflict))
    previous = conflict
  }
  return pieces
}

/**
 * Join conflicts that only a few agreed lines separate, like git: when three
 * lines or fewer are between them, they become one conflict and those lines
 * appear on both sides of it.
 *
 * @param {Array<{text: string[], agreed?: boolean} | {a: string[], b: string[], aStart: number, bStart: number}>} pieces
 */
function joinNearby(pieces) {
  const joined = []
  for (const piece of pieces) {
    const last = joined[joined.length - 1]
    if (piece.text && last && last.text) {
      // Text next to text, for example a conflict's trailing common lines
      // and the lines after it, counts as one gap.
      joined[joined.length - 1] = {
        text: [...last.text, ...piece.text],
        agreed: last.agreed && piece.agreed,
      }
      continue
    }
    const before = joined[joined.length - 2]
    if (
      piece.a &&
      last &&
      last.agreed &&
      last.text.length <= 3 &&
      before &&
      before.a
    ) {
      joined.pop()
      joined[joined.length - 1] = {
        ...before,
        a: [...before.a, ...last.text, ...piece.a],
        b: [...before.b, ...last.text, ...piece.b],
      }
      continue
    }
    joined.push(piece)
  }
  return joined
}

/**
 * Whether a conflict's markers end in CRLF, decided like git: the line before
 * the conflict in ours, then the one in theirs, then the base's first line
 * must all end in CRLF. A line that cannot tell (an empty file, or a single
 * line without a newline) leaves the decision to the next one, and LF wins
 * when none can tell.
 *
 * @param {string[]} ours
 * @param {string[]} theirs
 * @param {string[]} base
 * @param {{aStart: number, bStart: number}} conflict
 * @returns {boolean}
 */
function needsCr(ours, theirs, base, { aStart, bStart }) {
  let crlf = endsInCrlf(ours, aStart ? aStart - 1 : 0)
  if (crlf) crlf = endsInCrlf(theirs, bStart ? bStart - 1 : 0)
  if (crlf) crlf = endsInCrlf(base, 0)
  return crlf === 1
}

/**
 * Whether line `i` ends in CRLF: 1 or 0, or -1 when it cannot tell. The last
 * line of a file may have no newline; then the line before it decides.
 *
 * @param {string[]} lines
 * @param {number} i
 * @returns {number}
 */
function endsInCrlf(lines, i) {
  const crlf = line => (line.endsWith('\r\n') ? 1 : 0)
  const count = lines.length === 1 && lines[0] === '' ? 0 : lines.length
  if (count === 0) return -1
  if (i < count - 1 || lines[i].endsWith('\n')) return crlf(lines[i])
  return i === 0 ? -1 : crlf(lines[i - 1])
}

// When its two sides differ in more lines than this, a conflict is left in one
// piece (git would still split it): the diff below keeps a trace that grows
// with the square of that number.
const REFINE_LIMIT = 1000

/**
 * Split a conflict the way git does: lines both sides have in common move
 * out of the markers. Being the same in ours and theirs, they are agreed.
 *
 * @param {{a: string[], b: string[], aIndex: number, bIndex: number}} conflict
 * @returns {Array<{text: string[], agreed: boolean} | {a: string[], b: string[], aStart: number, bStart: number}>}
 */
function refine({ a, b, aIndex, bIndex }) {
  const pieces = []
  let i = 0
  let j = 0
  const matches = commonLines(a, b, REFINE_LIMIT)
  for (const [ai, bi] of [...matches, [a.length, b.length]]) {
    if (ai > i || bi > j) {
      pieces.push({
        a: a.slice(i, ai),
        b: b.slice(j, bi),
        aStart: aIndex + i,
        bStart: bIndex + j,
      })
    }
    if (ai < a.length) {
      const last = pieces[pieces.length - 1]
      if (last && last.text) last.text.push(a[ai])
      else pieces.push({ text: [a[ai]], agreed: true })
    }
    i = ai + 1
    j = bi + 1
  }
  return pieces
}

/**
 * The lines `a` and `b` have in common, as pairs of indices in order, found
 * with Myers' diff algorithm so that the differences around them are minimal.
 * None when more than `limit` lines differ.
 *
 * @param {string[]} a
 * @param {string[]} b
 * @param {number} limit
 * @returns {Array<[number, number]>}
 */
function commonLines(a, b, limit) {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max
  const v = new Array(2 * max + 2).fill(0)
  // trace[d] holds diagonals -d to d of v as it was before step d.
  const trace = []
  // Forward pass: how far each diagonal reaches after d edits.
  let d = 0
  let done = false
  while (!done) {
    if (d > limit) return []
    trace.push(v.slice(offset - d, offset + d + 1))
    for (let k = -d; k <= d && !done; k += 2) {
      let x =
        k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])
          ? v[k + 1 + offset]
          : v[k - 1 + offset] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[k + offset] = x
      done = x >= n && y >= m
    }
    if (!done) d++
  }
  // Backward pass: follow the snakes, which are the matching lines.
  const matches = []
  let x = n
  let y = m
  for (; d > 0; d--) {
    const v = trace[d]
    const k = x - y
    const prevK =
      k === -d || (k !== d && v[k - 1 + d] < v[k + 1 + d]) ? k + 1 : k - 1
    const prevX = v[prevK + d]
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) matches.push([--x, --y])
    x = prevX
    y = prevY
  }
  while (x > 0 && y > 0) matches.push([--x, --y])
  return matches.reverse()
}
