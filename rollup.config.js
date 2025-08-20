import fs from 'fs'
import path from 'path'

import pkg from './package.json'

// TODO: starting point for fixing the module exports
const virtualModules = {
  "internal-api": `export * from './index.js';`,
  "managers": `export * from './index.js';`,
  "models": `export * from './index.js'`,
}

const hotFixFiles = {
  ...virtualModules,
  // TODO: remove when cjs build gets removed
  "index.d.cts": `export * from './index';`,
  "internal-api.d.ts": `export * from './index';`,
  "managers.d.ts": `export { GitManager } from './index';`,
  "models.d.ts": `export { FileSystem } from './index'`,
};

// // TODO: hotfix would be to build a single file ESM Bundle and reexport from that.
// // This emits wrappers as we did expose files without types and fixing takes weeks
// // TODO: see below remove this hotfix.
const pluginVirtualAssets = {
  name: 'virtual-assets',
  buildStart() {
    Object.entries(hotFixFiles).forEach((moduleName,source)=>{
      const fileName = moduleName + moduleName.includes('.') ? "" : '.js';
      this.emitFile({ type: 'asset', fileName, source });
    });
  }
}
// // TODO: make type emit compatible to this structure then enable virtual module till all works
// // This is for dev only at present npm install @rollup/plugin-virtual --save-dev
// // import virtual from '@rollup/plugin-virtual';
// // virtual(virtualModules)

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
    // TODO: next step is to deprecate the cjs build at all 
    // and make it optional as npx rollup can create that with a single command in the consumer dir
    nodeConfig(`${input}/index.js`, `${output}/index.cjs`),
    ...(name
      ? [umdConfig(`${input}/index.js`, `${output}/index.umd.js`, name)]
      : []),
  ]
}

export default [
  ecmaConfig('index.js', 'index.js'),
  nodeConfig('index.js', 'index.cjs'),
  // ecmaConfig('internal-apis.js', 'internal-apis.js'),
  // nodeConfig('internal-apis.js', 'internal-apis.cjs'),
  // ecmaConfig('managers/index.js', 'managers/index.js'),
  // nodeConfig('managers/index.js', 'managers/index.cjs'),
  // ecmaConfig('models/index.js', 'models/index.js'),
  // nodeConfig('models/index.js', 'models/index.cjs'),
  ...pkgify('http/node', 'http/node'),
  ...pkgify('http/web', 'http/web', 'GitHttp'),
]
