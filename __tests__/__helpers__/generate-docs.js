const jsdoc = require('jsdoc-api')
const fs = require('fs');
const path = require('path');
const util = require('util');
const table = require('markdown-table');

function cleanType (type) {
  return type.replace(/\.</g, '<')
}

function gendoc (filepath) {
  // Load file
  let file = fs.readFileSync(filepath, 'utf8');

  // Fix some TypeScript-isms that jsdoc doesn't like
  file = file.replace(/\{import\('events'\)\.EventEmitter\}/g, '{EventEmitter}');
  
  const ast = jsdoc.explainSync({ source: file });

  let text = ''
  for (const obj of ast) {
    if (!obj.undocumented) {
      if (obj.kind === 'package') continue;
      if (!obj.params) continue;
      text += `---\n`
      text += `title: ${obj.name}\n`
      text += `sidebar_label: ${obj.name}\n`
      text += `---\n`
      // Split description into "first line" and "the rest"
      obj.description = obj.description.trim()
      // why JavaScript why
      let _index = obj.description.indexOf('\n')
      const headline = (_index === -1) ? obj.description : obj.description.slice(0, _index + 1).trim()
      const description = (_index === -1) ? '' : obj.description.slice(_index + 1).trim()

      text += `\n${headline}\n\n`

      // Build params table
      const rows = [['param', 'type [= default]', 'description']]
      for (const param of obj.params) {
        if (param.name === '_') continue

        let name = param.name.replace('_.', '')
        if (!param.optional) name = `**${name}**`

        let type = cleanType(param.type.names[0])
        if (param.defaultvalue !== undefined) type = `${type} = ${param.defaultvalue}`

        let description = param.description
        if (description.startsWith('[deprecated]')) {
          description = description.replace('[deprecated] ', '')
          name = name += ' [deprecated]'
        }
        rows.push([name, type, description])
      }
      rows.push(['return', cleanType(obj.returns[0].type.names[0]), obj.returns[0].description])
      
      text += table(rows)
      text += `\n`
      if (description !== '') text += `\n${description}\n`
      text += `\nExample Code:\n`
      for (const example of obj.examples) {
        text += '\n```js live\n'
        text += example
        text += '\n```\n'
      }
    }
  }
  return text
}

let commandDir = path.join(__dirname, '..', '..', 'src', 'commands')
let files = fs.readdirSync(commandDir)
for (let filename of files) {
  let doctext = gendoc(path.join(commandDir, filename))
  if (doctext !== '') {
    let docfilename = path.join(__dirname, '..', '..', 'docs', filename.replace(/js$/, 'md'))
    fs.writeFileSync(docfilename, doctext);
  }
}
