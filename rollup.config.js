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
      file: `dist/${input}`
    }
  ],
  plugins: [resolve({ browser: true })]
})

// Node.js
const nodeConfig = input => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'cjs',
      name: 'git',
      file: `dist/${path.basename(input, '.js')}.cjs`
    }
  ]
})

const inputs = ['index.js', 'internal-apis.js']

export default [...inputs.map(nodeConfig), ...inputs.map(moduleConfig)]
