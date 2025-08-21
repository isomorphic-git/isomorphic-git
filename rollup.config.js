import fs from 'fs'
import path from 'path'
// TODO: Upgrade CI pipeline as this is Node22 syntax but it is needed!
import pkg from './package.json' with { type: 'json' }

// TODO: starting point for fixing the module exports
const virtualModules = {
  // We emit some modules as hotfix for the ESM build
  // this are hotfix wrappers they should get replaced by the real files
  // in v2. and then we should look in v2 also into the declarations.tsconfig.
  // NOTE: we do not need a virtual index.js we create a Real ESM Build at present.
  // ESM Wrappers as hotfix for v1
  "internal-api.js": `export * from './index.js';`,
  "managers.js": `export * from './index.js';`,
  "models.js": `export * from './index.js'`, //TODO: models index does in fact at present only export FileSystem
}

const hotFixFiles = {
  ...virtualModules,
  // TODO: remove when cjs build gets removed
  // Note: index does not need a CJS wrapper as we do a
  // Real CJS Build at present.
  // CJS Files to fix the build
  "internal-api.cjs": `module.exports = require('./index.cjs');`,
  "managers.cjs": `module.exports = require('./index.cjs');`,
  "models.cjs":  `module.exports = require('./index.cjs');`,
  // CJS Type Wrappers
  "index.d.cts": `export * from './index';`,
  "internal-api.d.cts": `export * from './index';`,
  "managers.d.cts": `export * from './index';`,
  "models.d.cts": `export * from './index'`,
  // ESM Type Wrappers 
  "internal-api.d.ts": `export * from './index';`,
  "managers.d.ts": `export * from './index';`,
  "models.d.ts": `export * from './index'`,
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
  input: `${input}`,
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
  input: `${input}`,
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
  )

const pkgify = (input, output, name) => {
  fs.mkdirSync(path.join(import.meta.dirname, output), { recursive: true })
  fs.writeFileSync(
    path.join(import.meta.dirname, output, 'package.json'),
    template(name)
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
  // Build isomorphic-git
  {
    input: `src/index.js`,
    external: [...external],
    plugins: [ pluginVirtualAssets ],
    output: { format: 'es', dir: import.meta.dirname, },
  },
  { // The index.d.cts got created in the build step before 
    input: `index.js`, // take the files from the  bundle created before
    external: [...external],
    output: { format: 'cjs', file: `index.cjs`, exports: 'named', },
  },
  // Build isomorphic-git/http/node
  {
    input: `src/http/node/index.js`,
    external: [...external],
    plugins: [{
      name: 'emit-package.json',
      buildStart() {
         this.emitFile({ 
           type: 'asset', fileName: "package.json", 
           source: JSON.stringify({ 
             type: 'module', main: 'index.cjs', module: 'index.js', typings: 'index.d.ts', 
           }),
         });  
      }
    }],
    output: { format: 'es', dir: import.meta.dirname + 'http/node', },
  },
  { 
    input: `http/node/index.js`, // take the files from the  bundle created before
    external: [...external],
    output: { format: 'cjs', file: `http/node/index.cjs`, exports: 'named', },
  },
  // Build isomorphic-git/http/web
  {
    input: `src/http/web/index.js`,
    external: [...external],
    plugins: [{
      name: 'emit-package.json', buildStart() {
         this.emitFile({ 
           type: 'asset', fileName: "package.json", 
           source: JSON.stringify({ 
             type: 'module', main: 'index.cjs', module: 'index.js', typings: 'index.d.ts', 
             unpkg: 'index.umd.js'
           }),
         });  
      }
    }],
    output: { format: 'es', dir: import.meta.dirname + 'http/web', },
  },
  { 
    input: `http/web/index.js`, // take the files from the  bundle created before
    external: [...external],
    output: { format: 'cjs', file: `http/node/index.cjs`, exports: 'named', },
  },
  {
    input: `http/web/index.js`, // take files from the bundle created before
    output: {
      format: 'umd', file: `http/web/index.umd.js`, name: 'GitHttp', exports: 'named',
    },
  }
]
