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
  ...Object.keys(pkg.dependencies)
]

// Bleeding edge
const moduleConfig = input => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'es',
      name: 'git',
      file: `dist/${path.basename(input)}`
    }
  ],
  plugins: [resolve({ browser: true })]
})

// Node.js
const nodeConfig = (input, output = input) => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'cjs',
      name: 'git',
      file: `dist/${path.basename(output, '.js')}.cjs`
    }
  ]
})

export default [
  moduleConfig('index.js'),
  nodeConfig('api/_index.js', 'index.js'),
  moduleConfig('internal-apis.js'),
  nodeConfig('internal-apis.js'),
  nodeConfig('builtin-node/http.js'),
  moduleConfig('builtin-browser/http.js')
]
