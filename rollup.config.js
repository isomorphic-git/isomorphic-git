import fs from 'fs'
import path from 'path'

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

const nodeAliases = {
  [path.resolve(__dirname, 'src/utils/shasumRange.js')]: path.resolve(
    __dirname,
    'src/utils/shasumRange.node.js'
  ),
}

const alias = aliases => ({
  name: 'alias',
  resolveId(source, importer) {
    if (aliases[source]) return aliases[source]
    if (!importer || !source.startsWith('.')) return null
    const resolved = path.resolve(path.dirname(importer), source)
    return aliases[resolved] || null
  },
})

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
  plugins: [alias(nodeAliases)],
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
      file: `${output}`,
      name,
      exports: 'named',
    },
  ],
})

const template = umd =>
  JSON.stringify(
    {
      type: 'module',
      main: 'index.cjs',
      module: 'index.js',
      typings: 'index.d.ts',
      unpkg: umd ? 'index.umd.js' : undefined,
    },
    null,
    2
  )

const pkgify = (input, output, name) => {
  fs.mkdirSync(path.join(__dirname, output), { recursive: true })
  fs.writeFileSync(
    path.join(__dirname, output, 'package.json'),
    template(!!name)
  )
  return [
    ecmaConfig(`${input}/index.js`, `${output}/index.js`),
    nodeConfig(`${input}/index.js`, `${output}/index.cjs`),
    ...(name
      ? [umdConfig(`${input}/index.js`, `${output}/index.umd.js`, name)]
      : []),
  ]
}

export default [
  ecmaConfig('index.js', 'index.js'),
  nodeConfig('index.js', 'index.cjs'),
  ecmaConfig('internal-apis.js', 'internal-apis.js'),
  nodeConfig('internal-apis.js', 'internal-apis.cjs'),
  ecmaConfig('managers/index.js', 'managers/index.js'),
  nodeConfig('managers/index.js', 'managers/index.cjs'),
  ecmaConfig('models/index.js', 'models/index.js'),
  nodeConfig('models/index.js', 'models/index.cjs'),
  ...pkgify('http/node', 'http/node'),
  ...pkgify('http/web', 'http/web', 'GitHttp'),
]
