import fs from './fs'
// An async readFile variant that returns null instead of throwing errors
export async function read (file, options) {
  return new Promise(function (resolve, reject) {
    fs().readFile(
      file,
      options,
      (err, file) => (err ? resolve(null) : resolve(file))
    )
  })
}
