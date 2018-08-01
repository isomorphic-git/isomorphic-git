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
    filemode: bool,
    bare: bool,
    logallrefupdates: bool,
    symlinks: bool,
    ignorecase: bool,
    bigFileThreshold: num
  }
}

// https://git-scm.com/docs/git-config

// section starts with [ and ends with ]
// section is alphanumeric (ASCII) with _ and .
// section is case insensitive
// subsection is optionnal
// subsection is specified after section and one or more spaces
// subsection is specified between double quotes
const SECTION_LINE_REGEX = /^\[([A-Za-z0-9_.]+)(?: "(.*)")?\]$/
const SECTION_REGEX = /^[A-Za-z0-9_.]+$/

// variable lines contain a name, and equal sign and then a value
// variable lines can also only contain a name (the implicit value is a boolean true)
// variable name is alphanumeric (ASCII) with _
// variable name starts with an alphabetic character
// variable name is case insensitive
const VARIABLE_LINE_REGEX = /^([A-Za-z]\w*)(?: *= *(.*))?$/
const VARIABLE_NAME_REGEX = /^[A-Za-z]\w*$/

const extractSectionLine = (line) => {
  const matches = SECTION_LINE_REGEX.exec(line)
  if (matches != null) {
    const [section, subsection] = matches.slice(1)
    return [section, subsection]
  }
  return null
}

const extractVariableLine = (line) => {
  const matches = VARIABLE_LINE_REGEX.exec(line)
  if (matches != null) {
    const [name, value = 'true'] = matches.slice(1)
    return [name, value]
  }
  return null
}

const lower = (text) => {
  return (text != null) ? text.toLowerCase() : null
}

const getPath = (section, subsection, name) => {
  return [lower(section), subsection, lower(name)]
    .filter((a) => a != null)
    .join('.')
}

const findLastIndex = (array, callback) => {
  return array.reduce((lastIndex, item, index) => {
    return callback(item) ? index : lastIndex
  }, -1)
}

// Note: there are a LOT of edge cases that aren't covered (e.g. keys in sections that also
// have subsections, [include] directives, etc.
export class GitConfig {
  constructor (text) {
    let section = null
    let subsection = null
    this.parsedConfig = text
      .split('\n')
      .map((line) => {
        let name = null
        let value = null

        const trimmedLine = line.trim()
        const extractedSection = extractSectionLine(trimmedLine)
        const isSection = (extractedSection != null)
        if (isSection) {
          [section, subsection] = extractedSection
        } else {
          const extractedVariable = extractVariableLine(trimmedLine)
          const isVariable = (extractedVariable != null)
          if (isVariable) {
            [name, value] = extractedVariable
          }
        }

        const path = getPath(section, subsection, name)
        return {line, section, subsection, name, value, path}
      })
  }
  static from (text) {
    return new GitConfig(text)
  }
  async get (path, getall = false) {
    const allValues = this.parsedConfig
      .filter((config) => config.path === path.toLowerCase())
      .map(({section, name, value}) => {
        const fn = schema[section] && schema[section][name]
        return fn ? fn(value) : value
      })
    return getall ? allValues : allValues.pop()
  }
  async getall (path) {
    return this.get(path, true)
  }
  async append (path, value) {
    return this.set(path, value, true)
  }
  async set (path, value, append = false) {
    const configIndex = findLastIndex(this.parsedConfig, (config) => config.path === path.toLowerCase())
    if (value == null) {
      if (configIndex !== -1) {
        this.parsedConfig.splice(configIndex, 1)
      }
    } else {
      if (configIndex !== -1) {
        const config = this.parsedConfig[configIndex]
        const modifiedConfig = {...config, value, modified: true}
        if (append) {
          this.parsedConfig.splice(configIndex + 1, 0, modifiedConfig)
        } else {
          this.parsedConfig[configIndex] = modifiedConfig
        }
      } else {
        const sectionPath = path.split('.').slice(0, -1).join('.').toLowerCase()
        const sectionIndex = this.parsedConfig.findIndex((config) => config.path === sectionPath)
        const [section, subsection] = sectionPath.split('.')
        const name = path.split('.').pop()
        const newConfig = {section, subsection, name, value, modified: true}
        if (SECTION_REGEX.test(section) && VARIABLE_NAME_REGEX.test(name)) {
          if (sectionIndex >= 0) {
            this.parsedConfig.splice(sectionIndex + 1, 0, newConfig)
          } else {
            const newSection = {section, subsection, modified: true}
            this.parsedConfig.push(newSection, newConfig)
          }
        }
      }
    }
  }
  toString () {
    return this.parsedConfig
      .map(({line, section, subsection, name, value, modified = false}) => {
        if (!modified) {
          return line
        }
        if (name != null && value != null) {
          return `\t${name} = ${value}`
        }
        if (subsection != null) {
          return `[${section} "${subsection}"]`
        }
        return `[${section}]`
      })
      .join('\n') + '\n'
  }
}
