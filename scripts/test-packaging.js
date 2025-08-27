/**
 * Tests our isomorphic packaging mainly ESM and Package.json
 * at present
 */
import { execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path/posix'

/**
 * Creates a temporary directory with a minimal package.json inside.
 * @param {object} [options]
 * @param {string} [options.name] Package name (default: "temp-pkg-<uuid>")
 * @param {string} [options.version] Package version (default: "1.0.0")
 * @returns {Promise<string>} Path to the temporary package directory
 */

const tryCatch = fn => {
  try {
    return { output: fn().toString() }
  } catch (e) {
    return {
      error: e.output,
    }
  }
}
export async function createTempPackage() {
  const cwd = join(import.meta.dirname, '../test-pkg')
  // const dir = join(cwd, "ismorphic-git");
  await mkdir(cwd, { recursive: true })
  // Create a package that uses our package.
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify(
      {
        private: true,
        workspaces: ['../', '../packages/types', '../packages/isomorphic-git'],
        name: 'test-pkg',
        version: '0.0.0-pre.0',
        type: 'module',
      },
      null,
      2
    )
  )
  // TODO: this test will break if the outer package.json starts to use workspaces simple remove the above step then.
  // Link isomorphic-git package from .. into ./test-pkg/node_modules/isomorphic-git
  const encoding = 'utf8'
  const testResults = [
    tryCatch(() => execSync('npm install', { cwd })),
    tryCatch(() =>
      execSync(
        `node -e "console.log(Object.keys(require('isomorphic-git')))"`,
        { cwd, encoding, stdio: 'pipe' }
      )
    ),
    tryCatch(() =>
      execSync(
        `node --input-type=module -e "import('isomorphic-git').then(Object.keys).then(console.log)"`,
        { cwd, encoding, stdio: 'pipe' }
      )
    ),
    tryCatch(() =>
      execSync(`node -e "console.log(require.resolve('isomorphic-git'))"`, {
        cwd,
        encoding,
        stdio: 'pipe',
      })
    ),
    tryCatch(() =>
      execSync(
        `node --input-type=module -e "console.log(import.meta.resolve('isomorphic-git'))"`,
        { cwd, encoding, stdio: 'pipe' }
      )
    ),
  ]
  console.log(import.meta.url, import.meta.dirname)
  return testResults
}

createTempPackage().then(console.log)
