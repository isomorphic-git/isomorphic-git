export function posixifyPathBuffer(buffer) {
  let idx
  while (~(idx = buffer.indexOf(92))) buffer[idx] = 47
  return buffer
}
