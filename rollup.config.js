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
const ecmaConfig = (input, output) => ({
  input: `src/${input}`,
  external: [...external],
  plugins: [resolve({ browser: true })],
  output: [
    {
      format: 'es',
      name: 'git',
      file: `dist/${output}`,
    },
  ],
})

// Node.js
const nodeConfig = (input, output) => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'cjs',
      name: 'git',
      file: `dist/${output}`,
    },
  ],
})

// Browser environments that still don't support `import` (Workers and ServiceWorkers)
const umdConfig = (input, output, name) => ({
  input: `src/${input}`,
  output: [
    {
      format: 'umd',
      name,
      file: `dist/${output}`,
    },
  ],
})

export default [
  ecmaConfig('index.js', 'index.js'),
  nodeConfig('api/_index.js', 'index.cjs'),
  ecmaConfig('internal-apis.js', 'internal-apis.js'),
  nodeConfig('internal-apis.js', 'internal-apis.cjs'),
  ecmaConfig('http/node.js', 'http/node.js'),
  umdConfig('http/node.js', 'http/node.cjs', 'GitHttp'),
  ecmaConfig('http/web.js', 'http/web.js'),
  umdConfig('http/web.js', 'http/web.cjs', 'GitHttp'),
]
