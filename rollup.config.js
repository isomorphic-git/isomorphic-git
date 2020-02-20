import fs from 'fs'
import path from 'path'

import resolve from 'rollup-plugin-node-resolve'

import pkg from './package.json'

const external = [
  'fs',
  'path',
  'crypto',
  'stream',
  'crc/lib/crc32.js',
  'sha.js/sha1',
  'sha.js/sha1.js',
  ...Object.keys(pkg.dependencies),
]

// Modern modules
const ecmaConfig = (input, output) => ({
  input: `src/${input}`,
  external: [...external],
  plugins: [resolve({ browser: true })],
  output: [
    {
      format: 'es',
      name: 'git',
      file: `${output}`,
    },
  ],
})

// Legacy CommonJS2 modules
const nodeConfig = (input, output) => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'cjs',
      name: 'git',
      file: `${output}`,
    },
  ],
})

// Script tags that "export" a global var for those browser environments that
// still don't support `import` (Workers and ServiceWorkers)
const umdConfig = (input, output, name) => ({
  input: `src/${input}`,
  output: [
    {
      format: 'umd',
      name,
      file: `${output}`,
    },
  ],
})

const template = `{
  "type": "module",
  "main": "index.cjs",
  "module": "index.js",
  "typings": "index.d.ts"
}`

const pkgify = (input, output, name) => {
  fs.mkdirSync(path.join(__dirname, output), { recursive: true })
  fs.writeFileSync(path.join(__dirname, output, 'package.json'), template)
  return [
    ecmaConfig(input, `${output}/index.js`),
    umdConfig(input, `${output}/index.cjs`, name),
  ]
}

export default [
  ecmaConfig('index.js', 'index.js'),
  nodeConfig('api/_index.js', 'index.cjs'),
  ecmaConfig('internal-apis.js', 'internal-apis.js'),
  nodeConfig('internal-apis.js', 'internal-apis.cjs'),
  ...pkgify('http/node.js', 'http/node', 'GitHttp'),
  ...pkgify('http/web.js', 'http/web', 'GitHttp'),
]
