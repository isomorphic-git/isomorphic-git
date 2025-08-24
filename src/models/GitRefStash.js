export class GitRefStash {
  // constructor removed

  static get timezoneOffsetForRefLogEntry() {
    const offsetMinutes = new Date().getTimezoneOffset()
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60))
    const offsetMinutesFormatted = Math.abs(offsetMinutes % 60)
      .toString()
      .padStart(2, '0')
    const sign = offsetMinutes > 0 ? '-' : '+'
    return `${sign}${offsetHours
      .toString()
      .padStart(2, '0')}${offsetMinutesFormatted}`
  }

  static createStashReflogEntry(author, stashCommit, message) {
    const nameNoSpace = author.name.replace(/\s/g, '')
    const z40 = '0000000000000000000000000000000000000000' // hard code for now, works with `git stash list`
    const timestamp = Math.floor(Date.now() / 1000)
    const timezoneOffset = GitRefStash.timezoneOffsetForRefLogEntry
    return `${z40} ${stashCommit} ${nameNoSpace} ${author.email} ${timestamp} ${timezoneOffset}\t${message}\n`
  }

  static getStashReflogEntry(reflogString, parsed = false) {
    const reflogLines = reflogString.split('\n')
    const entries = reflogLines
      .filter(l => l)
      .reverse()
      .map((line, idx) =>
        parsed ? `stash@{${idx}}: ${line.split('\t')[1]}` : line
      )
    return entries
  }
}
