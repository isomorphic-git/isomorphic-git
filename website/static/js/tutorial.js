import http from './isomorphic-git/http/web/index.js'

// Initialize isomorphic-git with a file system
window.fs = new LightningFS('fs')

// make a Promisified version for convenience
window.pfs = window.fs.promises

window.dir = '/tutorial'

window.http = http

function disableEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
  }
}

window.disableEnterKey = disableEnterKey

async function evalToFakeConsole(text, printOut) {
  // We have to sneak in the return statement ourselves.
  let lines = text
    .split('\n')
    .map(x => x.trim())
    .filter(x => x !== '')
  const last = lines.length - 1
  lines[last] = 'return ' + lines[last]
  // We also will override the default "console.log" implementation to capture that output.
  const myconsole = {
    log(...args) {
      printOut(args)
    },
  }
  const code = `(async (console) => {
    ${lines.join('\n')}
  })`
  let func = eval(code)
  return func(myconsole)
}

async function onEvalButtonClick() {
  this.classList.add('busy')
  if (this.parentNode && this.parentNode.parentNode) {
    const pre = this.parentNode.parentNode
    let el = pre.querySelector('.codemirror-content')
    console.log(el)
    if (el) {
      const code = el.innerText
      try {
        const printOut = results => {
          let output = createLogOutputBox(results)
          let close = createCloseButton()
          output.appendChild(close)
          pre.appendChild(output)
        }
        let result = await evalToFakeConsole(code, printOut)
        if (result !== undefined) {
          let output = createReturnOutput(result)
          let close = createCloseButton()
          output.appendChild(close)
          pre.appendChild(output)
        }
      } catch (err) {
        let output = createErrorOutput(err)
        let close = createCloseButton()
        output.appendChild(close)
        pre.appendChild(output)
      }
    }
  }
  this.classList.remove('busy')
}

function onCloseButtonClick(event) {
  if (this.parentNode) {
    this.parentNode.remove()
  }
}

function createButton() {
  let d = document.createElement('div')
  d.className = 'eval-button-wrapper'
  let b = document.createElement('button')
  b.innerText = '▶️ RUN'
  b.className = 'eval-button button'
  b.type = 'button'
  b.onclick = onEvalButtonClick
  d.appendChild(b)
  return d
}

function createCloseButton() {
  let b = document.createElement('button')
  b.innerText = 'dismiss [X]'
  b.className = 'close-button'
  b.type = 'button'
  b.onclick = onCloseButtonClick
  return b
}

function createReturnOutput(output) {
  let o = document.createElement('div')
  o.className = 'eval-output'
  ObjectInspector(o, output)
  return o
}

function createErrorOutput(err) {
  // Because of the way ObjectInspector works, we need to set
  // all these as instance properties to be visible.
  let { name, message, stack, fileName, lineNumber, columnNumber } = err
  let output = { name, message, stack, fileName, lineNumber, columnNumber }
  Object.setPrototypeOf(output, Object.getPrototypeOf(err))
  let o = document.createElement('div')
  o.className = 'eval-error-output'
  ObjectInspector(o, output)
  return o
}

function createLogOutputBox(results) {
  let o = document.createElement('div')
  o.className = 'eval-log-output-box'
  for (let result of results) {
    let item = createLogOutputItem(result)
    o.appendChild(item)
  }
  return o
}

function createLogOutputItem(output) {
  let o = document.createElement('div')
  o.className = 'eval-log-output-item'
  ObjectInspector(o, output)
  return o
}

function listener() {
  // Only enable for 1.x docs pages
  if (window.location.pathname.match(/\/0\.\d+\.\d+\//)) return
  document.removeEventListener('DOMContentLoaded', listener)
  // Add the RUN buttons
  let blocks = document.querySelectorAll('pre > code.language-js.live')
  for (let block of blocks) {
    const parent = block.parentNode
    parent.replaceChild(codemirrorify.codemirrorify(block.innerText), block)
    parent.appendChild(createButton())
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', listener)
} else {
  listener()
}
