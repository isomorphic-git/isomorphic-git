// This is straight from parse_unit_factor in config.c of canonical git
const num = val => {
  if (typeof val === 'number') {
    return val
  }

  val = val.toLowerCase()
  let n = parseInt(val)
  if (val.endsWith('k')) n *= 1024
  if (val.endsWith('m')) n *= 1024 * 1024
  if (val.endsWith('g')) n *= 1024 * 1024 * 1024
  return n
}

// This is straight from git_parse_maybe_bool_text in config.c of canonical git
const bool = val => {
  if (typeof val === 'boolean') {
    return val
  }

  val = val.trim().toLowerCase()
  if (val === 'true' || val === 'yes' || val === 'on') return true
  if (val === 'false' || val === 'no' || val === 'off') return false
  throw Error(
    `Expected 'true', 'false', 'yes', 'no', 'on', or 'off', but got ${val}`
  )
}

const schema = {
  core: {
    filemode: bool,
    bare: bool,
    logallrefupdates: bool,
    symlinks: bool,
    ignorecase: bool,
    bigFileThreshold: num,
  },
}

// https://git-scm.com/docs/git-config#_syntax

// section starts with [ and ends with ]
// section is alphanumeric (ASCII) with - and .
// section is case insensitive
// subsection is optional
// subsection is specified after section and one or more spaces or tabs
// subsection is specified between double quotes, where \ escapes the next character
// a comment can follow the section header
const SECTION_LINE_REGEX =
  /^\[([A-Za-z0-9-.]+)(?:[ \t]+"((?:[^"\\]|\\.)*)")?\][ \t]*(?:[#;].*)?$/
const SECTION_REGEX = /^[A-Za-z0-9-.]+$/

// variable lines contain a name, and equal sign and then a value
// variable lines can also only contain a name (the implicit value is a boolean true)
// variable name is alphanumeric (ASCII) with -
// variable name starts with an alphabetic character
// variable name is case insensitive
// whitespace (spaces or tabs) around the equal sign is ignored
const VARIABLE_LINE_REGEX = /^([A-Za-z][A-Za-z0-9-]*)(?:\s*=\s*(.*))?$/
const VARIABLE_NAME_REGEX = /^[A-Za-z][A-Za-z0-9-]*$/

const extractSectionLine = line => {
  const matches = SECTION_LINE_REGEX.exec(line)
  if (matches != null) {
    const [section, subsection] = matches.slice(1)
    // Like canonical git, drop the backslash of an escaped character
    return [section, subsection && subsection.replace(/\\(.)/g, '$1')]
  }
  return null
}

const extractVariableLine = line => {
  const matches = VARIABLE_LINE_REGEX.exec(line)
  if (matches != null) {
    const [name, rawValue = 'true'] = matches.slice(1)
    return [name, parseValue(rawValue)]
  }
  return null
}

const ESCAPED_CHARS = new Map([
  ['t', '\t'],
  ['b', '\b'],
  ['n', '\n'],
  ['\\', '\\'],
  ['"', '"'],
])

// This follows parse_value in config.c of canonical git: double quotes are
// removed, # and ; outside of quotes start a comment, whitespace outside of
// quotes is kept between words but trimmed at the end, and \t, \b, \n, \\ and
// \" are unescaped. Canonical git rejects any other escape sequence, here the
// backslash is kept as is.
const parseValue = rawValue => {
  let value = ''
  let pendingSpace = ''
  let inQuotes = false
  for (let i = 0; i < rawValue.length; i++) {
    const c = rawValue[i]
    if (!inQuotes && /[ \t\r\v\f]/.test(c)) {
      if (value !== '') pendingSpace += c
      continue
    }
    if (!inQuotes && (c === '#' || c === ';')) break
    value += pendingSpace
    pendingSpace = ''
    if (c === '\\' && ESCAPED_CHARS.has(rawValue[i + 1])) {
      value += ESCAPED_CHARS.get(rawValue[++i])
    } else if (c === '"') {
      inQuotes = !inQuotes
    } else {
      value += c
    }
  }
  return value
}

// This follows write_pair in config.c of canonical git.
const serializeValue = value => {
  if (typeof value !== 'string') return value
  const quote =
    value.startsWith(' ') || value.endsWith(' ') || /[#;]/.test(value)
      ? '"'
      : ''
  const escaped = value.replace(/[\\"\n\t]/g, c => {
    if (c === '\n') return '\\n'
    if (c === '\t') return '\\t'
    return `\\${c}`
  })
  return `${quote}${escaped}${quote}`
}

const lower = text => {
  return text != null ? text.toLowerCase() : null
}

const getPath = (section, subsection, name) => {
  return [lower(section), subsection, lower(name)]
    .filter(a => a != null)
    .join('.')
}

const normalizePath = path => {
  const pathSegments = path.split('.')
  const section = pathSegments.shift()
  const name = pathSegments.pop()
  const subsection = pathSegments.length ? pathSegments.join('.') : undefined

  return {
    section,
    subsection,
    name,
    path: getPath(section, subsection, name),
    sectionPath: getPath(section, subsection, null),
    isSection: !!section,
  }
}

const findLastIndex = (array, callback) => {
  return array.reduce((lastIndex, item, index) => {
    return callback(item) ? index : lastIndex
  }, -1)
}

// Note: there are a LOT of edge cases that aren't covered (e.g. keys in sections that also
// have subsections, [include] directives, etc.
export class GitConfig {
  constructor(text) {
    let section = null
    let subsection = null
    this.parsedConfig = text
      ? text.split('\n').map(line => {
          let name = null
          let value = null

          const trimmedLine = line.trim()
          const extractedSection = extractSectionLine(trimmedLine)
          const isSection = extractedSection != null
          if (isSection) {
            ;[section, subsection] = extractedSection
          } else {
            const extractedVariable = extractVariableLine(trimmedLine)
            const isVariable = extractedVariable != null
            if (isVariable) {
              ;[name, value] = extractedVariable
            }
          }

          const path = getPath(section, subsection, name)
          return { line, isSection, section, subsection, name, value, path }
        })
      : []
  }

  static from(text) {
    return new GitConfig(text)
  }

  async get(path, getall = false) {
    const normalizedPath = normalizePath(path).path
    const allValues = this.parsedConfig
      .filter(config => config.path === normalizedPath)
      .map(({ section, name, value }) => {
        const fn = schema[section] && schema[section][name]
        return fn ? fn(value) : value
      })
    return getall ? allValues : allValues.pop()
  }

  async getall(path) {
    return this.get(path, true)
  }

  // Like `get`, this ignores case in the section name and also matches the
  // old `[section.subsection]` form.
  async hasSection(section, subsection) {
    const sectionPath = getPath(section, subsection, null)
    return this.parsedConfig.some(
      config => config.isSection && config.path === sectionPath
    )
  }

  async getSubsections(section) {
    return this.parsedConfig
      .filter(config => config.isSection && config.section === section)
      .map(config => config.subsection)
  }

  async deleteSection(section, subsection) {
    this.parsedConfig = this.parsedConfig.filter(
      config =>
        !(config.section === section && config.subsection === subsection)
    )
  }

  async append(path, value) {
    return this.set(path, value, true)
  }

  async set(path, value, append = false) {
    const {
      section,
      subsection,
      name,
      path: normalizedPath,
      sectionPath,
      isSection,
    } = normalizePath(path)

    const configIndex = findLastIndex(
      this.parsedConfig,
      config => config.path === normalizedPath
    )
    if (value == null) {
      if (configIndex !== -1) {
        this.parsedConfig.splice(configIndex, 1)
      }
    } else {
      if (configIndex !== -1) {
        const config = this.parsedConfig[configIndex]
        // Name should be overwritten in case the casing changed
        const modifiedConfig = Object.assign({}, config, {
          name,
          value,
          modified: true,
        })
        if (append) {
          this.parsedConfig.splice(configIndex + 1, 0, modifiedConfig)
        } else {
          this.parsedConfig[configIndex] = modifiedConfig
        }
      } else {
        const sectionIndex = this.parsedConfig.findIndex(
          config => config.path === sectionPath
        )
        const newConfig = {
          section,
          subsection,
          name,
          value,
          modified: true,
          path: normalizedPath,
        }
        if (SECTION_REGEX.test(section) && VARIABLE_NAME_REGEX.test(name)) {
          if (sectionIndex >= 0) {
            // Reuse existing section
            this.parsedConfig.splice(sectionIndex + 1, 0, newConfig)
          } else {
            // Add a new section
            const newSection = {
              isSection,
              section,
              subsection,
              modified: true,
              path: sectionPath,
            }
            this.parsedConfig.push(newSection, newConfig)
          }
        }
      }
    }
  }

  toString() {
    return this.parsedConfig
      .map(({ line, section, subsection, name, value, modified = false }) => {
        if (!modified) {
          return line
        }
        if (name != null && value != null) {
          return `\t${name} = ${serializeValue(value)}`
        }
        if (subsection != null) {
          return `[${section} "${subsection}"]`
        }
        return `[${section}]`
      })
      .join('\n')
  }
}
