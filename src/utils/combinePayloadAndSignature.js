
function normalize (str) {
  // remove all <CR>
  str = str.replace(/\r/g, '')
  // no extra newlines up front
  str = str.replace(/^\n+/, '')
  // and a single newline at the end
  str = str.replace(/\n+$/, '') + '\n'
  return str
}

function indent (str) {
  return str.trim().split('\n').map(x => ' ' + x).join('\n') + '\n'
}

function outdent (str) {
  return str.split('\n').map(x => x.replace(/^ /, '')).join('\n')
}

function extractHeaders (commit) {
  return commit.slice(0, commit.indexOf('\n\n'))
}


function extractMessage (commit) {
  return commit.slice(commit.indexOf('\n\n') + 2)
}

export default function combinePayloadAndSignature ({payload, signature}) {
  let headers = extractHeaders(payload)
  let message = extractMessage(payload)
  let commit = normalize(headers + '\ngpgsig' + indent(signature) + '\n' + message)
  return commit
}
