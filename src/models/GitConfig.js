// This is straight from parse_unit_factor in config.c of canonical git
const num = val => {
  val = val.toLowerCase()
  let n = parseInt(val)
  if (val.endsWith('k')) n *= 1024
  if (val.endsWith('m')) n *= 1024 * 1024
  if (val.endsWith('g')) n *= 1024 * 1024 * 1024
  return n
}

// This is straight from git_parse_maybe_bool_text in config.c of canonical git
const bool = val => {
  val = val.trim().toLowerCase()
  if (val === 'true' || val === 'yes' || val === 'on') return true
  if (val === 'false' || val === 'no' || val === 'off') return false
  throw Error(
    `Expected 'true', 'false', 'yes', 'no', 'on', or 'off', but got ${val}`
  )
}

const schema = {
  core: {
    _named: false,
    repositoryformatversion: String,
    filemode: bool,
    bare: bool,
    logallrefupdates: bool,
    symlinks: bool,
    ignorecase: bool,
    bigFileThreshold: num
  },
  remote: {
    _named: true,
    url: String,
    fetch: String
  },
  branch: {
    _named: true,
    remote: String,
    merge: String
  }
}

const isSection = line => line.trim().startsWith('[')

const extractSection = line => {
  const indices = [line.indexOf(']'), line.indexOf(' ')].filter(i => i > -1)
  return line.slice(line.indexOf('[') + 1, Math.min(...indices)).trim()
}

const isNamedSection = section => schema[section] && schema[section]._named

const isKeyValuePair = line => line.includes('=')

const extractSectionName = line =>
  line.slice(line.indexOf('"') + 1, line.lastIndexOf('"'))

// Note: there are a LOT of edge cases that aren't covered (e.g. keys in sections that also
// have subsections, [include] directives, etc.
export class GitConfig {
  constructor (text) {
    this.lines = text.split('\n')
  }
  static from (text) {
    return new GitConfig(text)
  }
  async get (path, getall = false) {
    const parts = path.split('.')
    const section = parts.shift()
    const sectionName = isNamedSection(section) ? parts.shift() : null
    const key = parts.shift()

    let currentSection = ''
    let currentSectionName = null
    let allValues = []
    for (const line of this.lines) {
      // zero in on section
      if (isSection(line)) {
        currentSection = extractSection(line)
        if (isNamedSection(currentSection)) {
          currentSectionName = extractSectionName(line)
        }
      } else if (
        currentSection === section &&
        (sectionName === null || currentSectionName === sectionName)
      ) {
        if (isKeyValuePair(line)) {
          let [_key, _value] = line.split('=', 2)
          if (_key.trim() === key) {
            allValues.push(_value.trim())
          }
        }
      }
    }
    // Cast value to correct type
    let fn = schema[section] && schema[section][key]
    if (fn) {
      allValues = allValues.map(fn)
    }
    return getall ? allValues : allValues.pop()
  }
  async getall (path) {
    return this.get(path, true)
  }
  async append (path, value) {
    return this.set(path, value, true)
  }
  async set (path, value, append = false) {
    const parts = path.split('.')
    const section = parts.shift()
    const sectionName = isNamedSection(section) ? parts.shift() : null
    const key = parts.shift()

    let currentSection = ''
    let currentSectionName = null
    let lastSectionMatch = null
    let lastMatch = null
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]
      if (isSection(line)) {
        currentSection = extractSection(line)
        if (currentSection === section) {
          if (sectionName) {
            currentSectionName = extractSectionName(line)
          }
          if (currentSectionName === sectionName) {
            lastSectionMatch = i
          }
        } else {
          currentSectionName = null
        }
      } else if (
        currentSection === section &&
        (sectionName === null || currentSectionName === sectionName)
      ) {
        if (isKeyValuePair(line)) {
          let [_key] = line.split('=', 1)
          if (_key.trim() === key) {
            lastMatch = i
          }
        }
      }
    }
    if (lastMatch !== null) {
      if (value === undefined) {
        this.lines.splice(lastMatch, 1)
      } else if (append) {
        this.lines.splice(lastMatch + 1, 0, [`\t${key} = ${value}`])
      } else {
        this.lines[lastMatch] = `\t${key} = ${value}`
      }
    } else if (lastSectionMatch !== null) {
      if (value !== undefined) {
        this.lines.splice(lastSectionMatch + 1, 0, [`\t${key} = ${value}`])
      }
    } else if (value !== undefined) {
      if (sectionName) {
        this.lines.push(`[${section} "${sectionName}"]`)
      } else {
        this.lines.push(`[${section}]`)
      }
      this.lines.push([`\t${key} = ${value}`])
    }
  }
  toString () {
    return this.lines.join('\n') + '\n'
  }
}
