import fs from 'fs'
import path from 'path'

import pkg from './package.json' with { type: "json" }

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
  output: [
    {
      format: 'es',
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
      file: `${output}`,
      exports: 'named',
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
      file: `packages/isomorphic-git/dist/${output}`,
      name,
      exports: 'named',
    },
  ],
})

export default [
  {
  input: {
      'index': 'src/index.js',
      'internal/apis': 'src/internal-apis.js',
      'managers': 'src/managers/index.js',
      'models': 'src/models/index.js',
  },
  external: [...external],
  output: [
    {
      format: 'es',
      chunkFileNames: "internal/[name].js",
      minifyInternalExports: false,
      dir: `packages/isomorphic-git/dist`,
    },
  ],
},
  ecmaConfig('index.js', 'index.js'),
  ecmaConfig('internal-apis.js', 'internal-apis.js'),
  ecmaConfig('managers/index.js', 'managers/index.js'),
  ecmaConfig('models/index.js', 'models/index.js')
]
