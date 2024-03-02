// @ts-check

export async function appendToFile(fs, filepath, content) {
  const appendTo = (await fs.exists(filepath))
    ? await fs.read(filepath, 'utf8')
    : ''
  await fs.write(filepath, appendTo + content, 'utf8')
}

export async function prependToFile(fs, filepath, content) {
  const prependTo = (await fs.exists(filepath))
    ? await fs.read(filepath, 'utf8')
    : ''
  await fs.write(filepath, content + prependTo, 'utf8')
}
