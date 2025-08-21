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

// TODO: Replace that with a function that works better when we do v2
const external = ['fs','path','crypto','stream','crc/lib/crc32.js','sha.js/sha1','sha.js/sha1.js', ...Object.keys(pkg.dependencies)];

export default [
  // Build isomorphic-git ESM
  { 
    output: { format: 'es', dir: import.meta.dirname }, input: `src/index.js`, 
    external, plugins: [ 
      // Emits all kind of hotFix files as asset to fix the current package state.    
      pluginVirtualAssets 
    ] 
  },
  // Build isomorphic-git/http/node ESM and create package.json 
  { 
    output: { format: 'es', dir: import.meta.dirname + '/http/node', }, input: `src/http/node/index.js`, 
    external, plugins: [{
      name: 'emit-http-node-package.json', buildStart() {
         this.emitFile({ 
           type: 'asset', fileName: "package.json", 
           source: JSON.stringify({ 
             type: 'module', main: 'index.cjs', module: 'index.js', typings: 'index.d.ts', 
           }),
         });  
      }
    }],
  },
  // Build isomorphic-git/http/web ESM and create package.json
  {
    output: { format: 'es', dir: import.meta.dirname + 'http/web', }, input: `src/http/web/index.js`,
    external, plugins: [{
      name: 'emit-http-web-package.json', buildStart() {
         this.emitFile({ 
           type: 'asset', fileName: "package.json", 
           source: JSON.stringify({ 
             type: 'module', main: 'index.cjs', module: 'index.js', typings: 'index.d.ts', 
             unpkg: 'index.umd.js'
           }),
         });  
      }
    }],
  },
  // Build isomorphic-git CJS The index.d.cts got created in the build step before take the files from the  bundle created before
  { output: { format: 'cjs', file: `index.cjs`, exports: 'named', }, input: `index.js`, external, },
  { output: { format: 'cjs', file: `http/node/index.cjs`, exports: 'named' }, input: `http/node/index.js`, external, },
  { output: { format: 'cjs', file: `http/web/index.cjs`, exports: 'named', }, input: `http/web/index.js`, external, },
  // Create UMD Build of HTTP the UMD Build of isomorphic-git gets done via webpack...... take files from the bundle created before
  // Note this is the only build without external dependency the webpack build also has no external dependencys.
  { output: { format: 'umd', file: `http/web/index.umd.js`, name: 'GitHttp', exports: 'named' }, input: `http/web/index.js` },
];
