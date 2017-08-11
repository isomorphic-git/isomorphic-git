import fs from 'fs'
// An async exists variant
export default async function exists (file, options) {
  return new Promise(function(resolve, reject) {
    fs.exists(file, resolve)
  });
}