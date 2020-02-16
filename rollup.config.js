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

// Bleeding edge
const moduleConfig = input => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'es',
      name: 'git',
      file: `dist/${path.basename(input)}`,
    },
  ],
  plugins: [resolve({ browser: true })],
})

// Node.js
const nodeConfig = (input, output = input) => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'cjs',
      name: 'git',
      file: `dist/${path.basename(output, '.js')}.cjs`,
    },
  ],
})

// Browser environments that still don't support `import` (Workers and ServiceWorkers)
const umdConfig = (input, name) => ({
  input: `src/${input}`,
  output: [
    {
      format: 'umd',
      name,
      file: `dist/${path.basename(input, '.js')}.umd.min.js`,
    },
  ],
})

export default [
  moduleConfig('index.js'),
  nodeConfig('api/_index.js', 'index.js'),
  moduleConfig('internal-apis.js'),
  nodeConfig('internal-apis.js'),
  nodeConfig('builtin-node/http.js'),
  moduleConfig('builtin-browser/http.js'),
  umdConfig('builtin-browser/http.js', 'GitHttp'),
]
