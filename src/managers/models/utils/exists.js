import fs from './fs'
// An async exists variant
export async function exists (file, options) {
  return new Promise(function (resolve, reject) {
    fs().stat(file, (err, stats) => {
      if (err) return err.code === 'ENOENT' ? resolve(false) : reject(err)
      resolve(true)
    })
  })
}
