import pkg from './package.json'

const external = [
  'fs',
  'path',
  'crypto',
  'stream',
  'openpgp/dist/openpgp.min.js',
  'crc/lib/crc32.js',
  'stream-source/index.node.js',
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
      file: `dist/for-future/isomorphic-git/${input}`
    }
  ]
})

// Node.js
const nodeConfig = input => ({
  input: `src/${input}`,
  external: [...external],
  output: [
    {
      format: 'cjs',
      name: 'git',
      file: `dist/for-node/isomorphic-git/${input}`
    }
  ]
})

const inputs = ['index.js', 'internal-apis.js']

export default [...inputs.map(moduleConfig), ...inputs.map(nodeConfig)]
