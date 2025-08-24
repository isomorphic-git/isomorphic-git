const fs = require('fs')
const os = require('os')
const path = require('path')

const jsdoc = require('jsdoc-api')
const table = require('markdown-table')

const git = require('../..')

const dir = path.join(__dirname, '..', '..')
const thisFile = path.relative(dir, __filename).replace(/\\/g, '/')
const ref = process.argv[2] || 'HEAD'

function cleanType(type) {
  return type.replace(/\.</g, '<')
}

function escapeType(type) {
  return cleanType(type)
    .replace(/(?<!\\)</g, '\\<')
    .replace(/(?<!\\)>/g, '\\>')
    .replace(/\|/g, ' &#124; ')
}

function recoverFunctionSignature(name, text) {
  const matches = text.match(new RegExp(`{function\\(([^\\n]*)} \\[?${name}`))
  if (matches !== null) {
    matches[1] = matches[1].trim()
    return `function(${matches[1]}`
  }
}

const typedefs = new Map()

function inlineFunctionType(ast) {
  let text = ''
  if (!ast.params) {
    text += `()`
  } else {
    text += `(`
    text += ast.params
      .map(param => {
        const type = cleanType(param.type.names[0])
        return `${param.name}: ${type}`
      })
      .join(', ')
    text += ')'
  }
  text += ` => ${cleanType(ast.returns[0].type.names[0])}`
  return text
}

function gentypedef(ast) {
  let text = ''
  if (ast.description) {
    text += `\n${ast.description}\n`
  }
  text += '\n```ts\n'
  if (!ast.properties) {
    if (cleanType(ast.type.names[0]) === 'function') {
      text += `type ${ast.name} = ${inlineFunctionType(ast)};\n`
    } else {
      text += `type ${ast.name} = ${cleanType(ast.type.names[0])};\n`
    }
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

try {
  fs.mkdirSync(path.join(__dirname, '..', '__examples__'))
} catch (_) {}

function writeExample(text, filepath) {
  const exampleFilepath = path.join(__dirname, '..', '__examples__', filepath)
  text = `import * as fs from 'fs'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http'
const { pgp } = require('@isomorphic-git/pgp-plugin')

export {};

${text}`
  fs.writeFileSync(exampleFilepath, text, 'utf8')
}

/**
 * @private
 *
 * Conditionally write a JSDoc configuration file and return the file path.
 *
 * JSDoc excludes directories that start with an underscore. This is a problem
 * when we call jsdoc.explain and provide source code. The contents are saved to
 * a temporary file in os.tmpdir(). If any parts of the path start with an
 * underscore the file is excluded and the JSDoc command fails:
 *
 * JSDOC_ERROR: There are no input files to process.
 *
 * To bypass this issue we must create and use a JSDoc config.
 * This is a known issue tracked by https://github.com/jsdoc2md/jsdoc-api/issues/19.
 */
const jsdocConfig = () => {
  if (!/[\\\/]_/.test(os.tmpdir())) {
    return;
  }

  try {
    // Read an example/default JSDoc config
    const inputFilepath = require.resolve('jsdoc/conf.json.EXAMPLE')
    const config = JSON.parse(fs.readFileSync(inputFilepath).toString())

    // Clear the pattern that excludes the contents of the temporary directory
    config.source.excludePattern = ''

    // Write the config to a temporary directory inside node_modules.
    const outputDir = path.resolve(path.dirname(require.resolve('jsdoc-api')), '../.cache/isomorphic-git/tmp')
    fs.mkdirSync(outputDir, { recursive: true });

    const filepath = path.join(outputDir, 'jsdoc.config.json')
    fs.writeFileSync(filepath, JSON.stringify(config))
    return filepath;
  }
  catch {
    return;
  }
}

async function gendoc(file, filepath) {
  // Fix some TypeScript-isms that jsdoc doesn't like
  file = file.replace(/\{import\('events'\)\.EventEmitter\}/g, '{EventEmitter}')
  file = file.replace(
    /\{import\('..\/models\/FileSystem\.js'\)\.FileSystem\}/g,
    '{FileSystem}'
  )
  file = file.replace(
    /\{\[string, HeadStatus, WorkdirStatus, StageStatus\]\}/g,
    '{Array<string|number>}'
  )
  const ast = await jsdoc.explain({ source: file, configure: jsdocConfig() });
  let text = ''
  for (const obj of ast) {
    if (!obj.undocumented) {
      if (obj.kind === 'package') continue
      if (obj.kind === 'typedef') {
        gentypedef(obj)
        continue
      }
      if ((!obj.params && !obj.returns) || !obj.description) continue
      text += `---\n`
      text += `title: ${obj.name}\n`
      text += `sidebar_label: ${obj.name}\n`
      text += `id: version-1.x-${obj.name}\n`
      text += `original_id: ${obj.name}\n`
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
            actualName.startsWith('on') ||
            name === 'http' ||
            name === 'fs' ||
            name === 'headers'
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
          obj.returns[0].description,
        ])
      }
      if (obj.exceptions) {
        for (const err of obj.exceptions) {
          rows.push([
            'throws',
            'Error',
            err.type.names
              .map(x => `[${x}](./errors.md#${x.toLowerCase()})`)
              .join(' | '),
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
        let n = 1
        for (const example of obj.examples) {
          text += '\n```js live\n'
          text += example
          text += '\n```\n'
          writeExample(example, `${path.basename(filepath, '.js')}_${n++}.js`)
        }
      }
      if (obj.name) {
        // This provides a handy footer
        text += `

---

<details>
<summary><i>Tip: If you need a clean slate, expand and run this snippet to clean up the file system.</i></summary>

\`\`\`js live
window.fs = new LightningFS('fs', { wipe: true })
window.pfs = window.fs.promises
console.log('done')
\`\`\`
</details>
`
        // This rewrites the "Edit" button on the docs page to point to the JSDoc page instead of the raw Markdown page.
        text += `
<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/${obj.name}.js';
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
  const docDir2 = path.join(
    __dirname,
    '..',
    '..',
    'website',
    'versioned_docs',
    'version-1.x'
  )

  const gitignorePath = path.join(__dirname, '..', '..', '.gitignore')
  let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
  const idx = gitignoreContent.indexOf(
    '# AUTO-GENERATED DOCS --- DO NOT EDIT BELOW THIS LINE'
  )
  gitignoreContent = gitignoreContent.slice(0, idx)
  gitignoreContent += '# AUTO-GENERATED DOCS --- DO NOT EDIT BELOW THIS LINE\n'

  const oid = await git.resolveRef({ fs, dir, ref })
  const { tree } = await git.readTree({
    fs,
    dir,
    oid,
    filepath: 'src/api',
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
      filepath: `${prefix}/${name}`,
    })
    const filetext = Buffer.from(blob).toString('utf8')
    let doctext = await gendoc(filetext, name)
    if (doctext !== '') {
      const docfilename = name.replace(/js$/, 'md')
      fs.writeFileSync(path.join(docDir2, docfilename), doctext)
      doctext = doctext.replace(/\nid: version-1\.x-.*\n/, '\n')
      doctext = doctext.replace(/\noriginal_id: .*\n/, '\n')
      fs.writeFileSync(path.join(docDir, docfilename), doctext)
      docs.push(`docs/${docfilename}`)
    }
  }

  // Generate the shared typedefs
  await processEntry('src', 'typedefs.js')
  await processEntry('src', 'typedefs-http.js')

  // Generate all the docs
  await Promise.all(entries.map(entry => processEntry('src/api', entry.path)))

  docs.sort()
  gitignoreContent += docs.join('\n') + '\n'
  fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8')

  // Generate alphabetic.md
  {
    const alphabeticFile = path.join(
      __dirname,
      '..',
      '..',
      'docs',
      'alphabetic.md'
    )
    const alphabeticFile2 = path.join(
      __dirname,
      '..',
      '..',
      'website',
      'versioned_docs',
      'version-1.x',
      'alphabetic.md'
    )
    let contents = `---
title: All Commands
sidebar_label: Alphabetical Index
id: version-1.x-alphabetic
original_id: alphabetic
---
<!-- autogenerated_by: ${thisFile} -->

${docs
  .map(doc => doc.replace(/^docs\/(.*)\.md$/, '$1'))
  .map(doc => `- [${doc}](${doc})`)
  .join('\n')}
`
    fs.writeFileSync(alphabeticFile2, contents)
    contents = contents.replace(/\nid: version-1\.x-.*\n/, '\n')
    contents = contents.replace(/\noriginal_id: .*\n/, '\n')
    fs.writeFileSync(alphabeticFile, contents)
  }

  // Update alphabetic listing in README.md
  {
    const readmeFile = path.join(__dirname, '..', '..', 'README.md')
    const commandList = `API-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- autogenerated_by: ${thisFile} -->

${docs
  .map(doc => doc.replace(/^docs\/(.*)\.md$/, '$1'))
  .map(doc => `- [${doc}](https://isomorphic-git.github.io/docs/${doc}.html)`)
  .join('\n')}

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- API-LIST:END`
    let content = fs.readFileSync(readmeFile, 'utf8')
    content = content.replace(/API-LIST:START(.|\n)+API-LIST:END/m, commandList)
    fs.writeFileSync(readmeFile, content)
  }
})()
