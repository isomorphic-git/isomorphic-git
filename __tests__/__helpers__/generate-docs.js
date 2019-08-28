const jsdoc = require('jsdoc-api')
const fs = require('fs')
const path = require('path')
const table = require('markdown-table')

function cleanType (type) {
  return type.replace(/\.</g, '<')
}

function escapeType (type) {
  return cleanType(type)
    .replace(/(?<!\\)</g, '\\<')
    .replace(/(?<!\\)>/g, '\\>')
    .replace(/\|/g, ' &#124; ')
}

const typedefs = new Map()

function gentypedef (ast) {
  let text = ''
  if (ast.description) {
    text += `\n${ast.description}\n\n`
  }
  text += '```ts\n'
  text += `type ${ast.name} = {\n`
  let currentprop = null
  let indent = 2
  for (const prop of ast.properties) {
    const type = cleanType(prop.type.names[0])
    let ind = ' '.repeat(indent)
    // This is pretty sloppy
    if (currentprop !== null) {
      if (prop.name.startsWith(currentprop)) {
        const name = prop.name.replace(currentprop, '')
        text += `${ind}${name}: ${cleanType(type)};${
          prop.description ? ` // ${prop.description}` : ''
        }\n`
        continue
      } else {
        indent -= 2
        ind = ' '.repeat(indent)
        currentprop = null
        text += `${ind}};\n`
      }
    }
    if (type === 'Object') {
      currentprop = prop.name + '.'
      if (prop.description) {
        text += `${ind}// ${prop.description}\n`
      }
      text += `${ind}${prop.name}: {\n`
      indent += 2
      ind = ' '.repeat(indent)
    } else {
      text += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type.names
        .map(cleanType)
        .join(' | ')};${prop.description ? ` // ${prop.description}` : ''}\n`
    }
  }
  while (indent > 2) {
    indent -= 2
    const ind = ' '.repeat(indent)
    currentprop = null
    text += `${ind}};\n`
  }
  text += `}\n`
  text += '```\n'
  typedefs.set(ast.name, text)
}

function gendoc (filepath) {
  // Load file
  let file = fs.readFileSync(filepath, 'utf8')

  // Fix some TypeScript-isms that jsdoc doesn't like
  file = file.replace(/\{import\('events'\)\.EventEmitter\}/g, '{EventEmitter}')
  let ast
  try {
    ast = jsdoc.explainSync({ source: file })
  } catch (e) {
    console.log(`Unable to parse ${filepath}`, e.message)
    return ''
  }

  let text = ''
  for (const obj of ast) {
    if (!obj.undocumented) {
      if (obj.kind === 'typedef') {
        gentypedef(obj)
        continue
      }
      if (obj.kind === 'package') continue
      if (!obj.params || !obj.returns) continue
      text += `---\n`
      text += `title: ${obj.name}\n`
      text += `sidebar_label: ${obj.name}\n`
      text += `---\n`
      if (obj.deprecated) {
        text += `\n${obj.deprecated}\n`
      }
      // Split description into "first line" and "the rest"
      obj.description = obj.description.trim()
      // why JavaScript why
      const _index = obj.description.indexOf('\n')
      const headline =
        _index === -1
          ? obj.description
          : obj.description.slice(0, _index + 1).trim()
      const description =
        _index === -1 ? '' : obj.description.slice(_index + 1).trim()

      text += `\n${headline}\n\n`

      // Build params table
      const rows = [['param', 'type [= default]', 'description']]
      if (obj.params) {
        for (const param of obj.params) {
          if (param.name === '_' || param.name === 'args') continue

          let name = param.name.replace('_.', '').replace('args.', '')
          if (!param.optional) name = `**${name}**`

          let type = param.type.names.map(escapeType).join(' | ')
          if (param.defaultvalue !== undefined) {
            type = `${type} = ${param.defaultvalue}`
          }

          let description = param.description
          if (description.startsWith('[deprecated]')) {
            description = description.replace('[deprecated] ', '')
            name = name += ' [deprecated]'
          }
          // because of the `dir` / `gitdir` weirdness, some args are "required" but have default values
          // and I have to distinguish them in a way that doesn't upset TypeScript
          if (description.startsWith('[required]')) {
            description = description.replace('[required] ', '')
            name = `**${name}**`
          }
          rows.push([name, escapeType(type), escapeType(description)])
        }
      }
      if (obj.returns) {
        rows.push([
          'return',
          obj.returns[0].type.names.map(escapeType).join(' | '),
          obj.returns[0].description
        ])
      }
      if (obj.exceptions) {
        for (const err of obj.exceptions) {
          rows.push([
            'throws',
            'Error',
            err.type.names
              .map(x => `[${x}](./errors.md#${x.toLowerCase()})`)
              .join(' | ')
          ])
        }
      }

      text += table(rows)
      text += `\n`
      if (obj.see) {
        for (const type of obj.see) {
          text += typedefs.get(type)
        }
      }
      if (description !== '') text += `\n${description}\n`
      if (obj.examples) {
        text += `\nExample Code:\n`
        for (const example of obj.examples) {
          text += '\n```js live\n'
          text += example
          text += '\n```\n'
        }
      }
      if (obj.name) {
        // This rewrites the "Edit" button on the docs page to point to the JSDoc page instead of the raw Markdown page.
        text += `
<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/master/src/commands/${obj.name}.js';
  }
})();
</script>`
      }
    }
  }
  return text
}

const docDir = path.join(__dirname, '..', '..', 'docs')
if (!fs.existsSync(docDir)) {
  fs.mkdirSync(docDir)
}

const commandDir = path.join(__dirname, '..', '..', 'src', 'commands')
const files = fs.readdirSync(commandDir)
for (const filename of files) {
  if (filename.startsWith('_')) continue
  const doctext = gendoc(path.join(commandDir, filename))
  if (doctext !== '') {
    const docfilename = path.join(docDir, filename.replace(/js$/, 'md'))
    fs.writeFileSync(docfilename, doctext)
  }
}
