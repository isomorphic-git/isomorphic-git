const jsdoc = require('jsdoc-api')
const fs = require('fs')
const path = require('path')
const table = require('markdown-table')
const git = require('../..')
const { E } = require('../..')

const dir = path.join(__dirname, '..', '..')
const thisFile = path.relative(dir, __filename)
const ref = process.argv[2] || 'HEAD'

function cleanType (type) {
  return type.replace(/\.</g, '<')
}

function escapeType (type) {
  return cleanType(type)
    .replace(/(?<!\\)</g, '\\<')
    .replace(/(?<!\\)>/g, '\\>')
    .replace(/\|/g, ' &#124; ')
}

function recoverFunctionSignature (name, text) {
  const matches = text.match(new RegExp(`{function\\(([^\\n]*)} \\[?${name}`))
  if (matches !== null) {
    matches[1] = matches[1].trim()
    return `function(${matches[1]}`
  }
}

const typedefs = new Map()

function gentypedef (ast) {
  let text = ''
  if (ast.description) {
    text += `\n${ast.description}\n`
  }
  text += '\n```ts\n'
  if (!ast.properties) {
    text += `type ${ast.name} = ${cleanType(ast.type.names[0])};\n`
  } else {
    text += `type ${ast.name} = {\n`
    let currentprop = null
    let indent = 2
    for (const prop of ast.properties) {
      const type = cleanType(prop.type.names[0])
      // Note: the parser doesn't yet understand the full function syntax, so we hack it in
      if (type === 'function') {
        const betterName = recoverFunctionSignature(prop.name, ast.comment)
        if (betterName) {
          prop.type.names[0] = betterName
        }
      }
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
        text += `  ${prop.name}${
          prop.optional ? '?' : ''
        }: ${prop.type.names.map(cleanType).join(' | ')};${
          prop.description ? ` // ${prop.description}` : ''
        }\n`
      }
    }
    while (indent > 2) {
      indent -= 2
      const ind = ' '.repeat(indent)
      currentprop = null
      text += `${ind}};\n`
    }
    text += `}\n`
  }
  text += '```\n'
  typedefs.set(ast.name, text)
}

async function gendoc (file, filepath) {
  // Fix some TypeScript-isms that jsdoc doesn't like
  file = file.replace(/\{import\('events'\)\.EventEmitter\}/g, '{EventEmitter}')
  file = file.replace(
    /\{import\('..\/models\/FileSystem\.js'\)\.FileSystem\}/g,
    '{FileSystem}'
  )
  let ast
  try {
    ast = await jsdoc.explain({ source: file })
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
      if ((!obj.params && !obj.returns) || !obj.description) continue
      text += `---\n`
      text += `title: ${obj.name}\n`
      text += `sidebar_label: ${obj.name}\n`
      text += `---\n`
      if (obj.deprecated) {
        text += `\n${obj.deprecated}\n`
      }
      // Split description into "first line" and "the rest"
      try {
        obj.description = obj.description.trim()
      } catch (e) {
        console.log(obj)
      }
      // why JavaScript why
      const _index = obj.description.indexOf('\n')
      const headline =
        _index === -1
          ? obj.description
          : obj.description.slice(0, _index + 1).trim()
      let description =
        _index === -1 ? '' : obj.description.slice(_index + 1).trim()

      text += `\n${headline}\n\n`

      // Build params table
      const rows = [['param', 'type [= default]', 'description']]
      if (obj.params) {
        for (const param of obj.params) {
          if (param.name === '_' || param.name === 'args') continue

          let name = param.name.replace('_.', '').replace('args.', '')
          const actualName = name
          const shouldLink =
            actualName.startsWith('on') || name === 'http' || name === 'fs'
          if (!param.optional) name = `**${name}**`

          let type = param.type.names.map(escapeType).join(' | ')
          if (param.type.names[0] === 'function') {
            const betterName = recoverFunctionSignature(param.name, obj.comment)
            if (betterName) {
              type = betterName
            }
          }
          if (param.defaultvalue !== undefined) {
            type = `${type} = ${param.defaultvalue}`
          }

          let description = param.description
          if (!description) {
            console.log(
              `User error: The function param ${param.name} is missing a description.`
            )
          } else {
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
          }
          if (shouldLink) name = `[${name}](./${actualName})`
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
      for (const [name, typedef] of typedefs) {
        description = description.replace(`{@link ${name} typedef}`, typedef)
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

;(async () => {
  const docDir = path.join(__dirname, '..', '..', 'docs')
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir)
  }

  const gitignorePath = path.join(__dirname, '..', '..', '.gitignore')
  let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
  const idx = gitignoreContent.indexOf(
    '# AUTO-GENERATED DOCS --- DO NOT EDIT BELOW THIS LINE'
  )
  gitignoreContent = gitignoreContent.slice(0, idx)
  gitignoreContent += '# AUTO-GENERATED DOCS --- DO NOT EDIT BELOW THIS LINE\n'
  gitignoreContent += 'docs/errors.md\n'

  const oid = await git.resolveRef({ fs, dir, ref })
  const { tree } = await git.readTree({
    fs,
    dir,
    oid,
    filepath: 'src/api'
  })
  const entries = tree.filter(
    entry => entry.type === 'blob' && !entry.path.startsWith('_')
  )

  const docs = []
  const processEntry = async (prefix, name) => {
    // Load file
    const { blob } = await git.readBlob({
      fs,
      dir,
      oid,
      filepath: `${prefix}/${name}`
    })
    const filetext = Buffer.from(blob).toString('utf8')
    const doctext = await gendoc(filetext, name)
    if (doctext !== '') {
      const docfilename = name.replace(/js$/, 'md')
      fs.writeFileSync(path.join(docDir, docfilename), doctext)
      docs.push(`docs/${docfilename}`)
    }
  }

  // Generate the shared typedefs
  await processEntry('src/commands', 'typedefs.js')

  // Generate all the docs
  await Promise.all(entries.map(entry => processEntry('src/api', entry.path)))

  docs.sort()
  gitignoreContent += docs.join('\n') + '\n'
  fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8')

  // Generate alphabetic.md
  {
    const alphabeticFile = path.join(__dirname, '..', '..', 'docs', 'alphabetic.md')
    let contents = `---
title: All Commands
sidebar_label: Alphabetical Index
---
<!-- autogenerated_by: ${thisFile} -->

${docs.map(doc => doc.replace(/^docs\/(.*)\.md$/, '$1')).map(doc => `- [${doc}](${doc})`).join('\n')}

# Errors
(added here so Algolia indexes the page)
- [Error Code Index](errors)
`
    fs.writeFileSync(alphabeticFile, contents)
  }

  // Generate errors.md
  const docFile = path.join(__dirname, '..', '..', 'docs', 'errors.md')
  const { blob } = await git.readBlob({
    fs,
    dir,
    oid,
    filepath: 'src/models/GitError.js'
  })
  const sourceCode = Buffer.from(blob).toString('utf8')

  let contents = `---
title: Error Codes
sidebar_label: Error Code Index
---
<!-- autogenerated_by: ${thisFile} -->

<aside>
Right now this merely lists the possible error messages, so it's of little practical value.
However I would like it to become a useful page that expands on the short error message with a detailed
explanation, and gives possible resolutions to common scenarios where these errors occur.
</aside>

`

  const keys = Object.keys(E)
  keys.sort()

  for (const key of keys) {
    const matches = sourceCode.match(new RegExp(`${key}: \`(.*)\`,?\\n`))
    if (matches) {
      contents += `### ${key}\n`
      contents += matches[1] + '\n\n'
    }
  }

  fs.writeFileSync(docFile, contents)
})()
