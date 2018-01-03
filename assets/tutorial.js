function disableEnterKey (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
  }
}

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
      try {
        const printOut = results => {
          let output = createLogOutputBox(results)
          let close = createCloseButton()
          output.appendChild(close)
          this.parentNode.appendChild(output)
        }
        let result = await evalToFakeConsole(el.innerText, printOut)
        if (result !== undefined) {
          let output = createReturnOutput(result)
          let close = createCloseButton()
          output.appendChild(close)
          this.parentNode.appendChild(output)
        }
      } catch (err) {
        let output = createErrorOutput(err)
        let close = createCloseButton()
        output.appendChild(close)
        this.parentNode.appendChild(output)
      }
    }
  }
}

function onCloseButtonClick (event) {
  if (this.parentNode) {
    this.parentNode.remove()
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

function createCloseButton () {
  let b = document.createElement('button')
  b.innerText = 'dismiss [X]'
  b.className = 'close-button'
  b.type = 'button'
  b.onclick = onCloseButtonClick
  return b
}

function createReturnOutput (output) {
  let o = document.createElement('div')
  o.className = 'eval-output'
  ObjectInspector(o, output)
  return o
}

function createErrorOutput (err) {
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
  // Add the RUN buttons
  let blocks = document.querySelectorAll(
    '.lang-js, [data-ice=exampleDoc] > pre'
  )
  for (let block of blocks) {
    block.appendChild(createButton())
  }
  // Make parts of the code editable
  let spans = document.querySelectorAll('code')
  for (let span of spans) {
    let currentHTML = span.innerHTML
    if (currentHTML.includes('@')) {
      // Indicate multi-line placeholders with <<@Here be text@>>
      let newHTML = currentHTML.replace(
        /&lt;&lt;@(.+)@&gt;&gt;/g,
        '<span contenteditable>$1</span>'
      )
      // Indicate single-line (no line breaks) placeholders with <@Here be text@>
      newHTML = newHTML.replace(
        /&lt;@(.+)@&gt;/g,
        '<span contenteditable onkeydown="disableEnterKey(event)">$1</span>'
      )
      // This tries to minimize needless DOM trashing
      if (newHTML !== currentHTML) {
        span.innerHTML = newHTML
      }
    }
  }
})
