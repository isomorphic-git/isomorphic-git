async function evalToFakeConsole (text, printOut) {
  // We have to sneak in the return statement ourselves.
  let lines = text.split('\n').map(x => x.trim()).filter(x => x !== '')
  const last = lines.length - 1
  lines[last] = 'return ' + lines[last]
  // We also will override the default "console.log" implementation to capture that output.
  const myconsole = {
    log (...args) {
      printOut(args)
    }
  }
  const code = `(async (console) => {
    ${lines.join('\n')}
  })`
  let func = eval(code)
  return func(myconsole)
}

async function onEvalButtonClick () {
  if (this.parentNode) {
    let el = this.parentNode.querySelector('code')
    if (el) {
      const printOut = results => {
        let output = createLogOutputBox(results)
        this.parentNode.appendChild(output)
      }
      let result = await evalToFakeConsole(el.innerText, printOut)
      if (result !== undefined) {
        let output = createReturnOutput(result)
        this.parentNode.appendChild(output)
      }
    }
  }
}

function createButton () {
  let b = document.createElement('button')
  b.innerText = 'RUN'
  b.className = 'eval-button'
  b.type = 'button'
  b.onclick = onEvalButtonClick
  return b
}

function createReturnOutput (output) {
  let o = document.createElement('div')
  o.className = 'eval-output'
  ObjectInspector(o, output)
  return o
}

function createLogOutputBox (results) {
  let o = document.createElement('div')
  o.className = 'eval-log-output-box'
  for (let result of results) {
    let item = createLogOutputItem(result)
    o.appendChild(item)
  }
  return o
}

function createLogOutputItem (output) {
  let o = document.createElement('div')
  o.className = 'eval-log-output-item'
  ObjectInspector(o, output)
  return o
}

document.addEventListener('DOMContentLoaded', function listener () {
  document.removeEventListener('DOMContentLoaded', listener)
  let blocks = document.querySelectorAll('.lang-js')
  for (let block of blocks) {
    block.appendChild(createButton())
  }
})
