import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';
// TODO: Upgrade CI pipeline as this is Node22 syntax but it is needed!
import pkg from './package.json' with { type: 'json' }

const dir = import.meta.dirname;

// ESM Files to fix the build
const virtualModules = {
  // We emit some modules as hotfix for the ESM build
  // this are hotfix wrappers they should get replaced by the real files
  // in v2. and then we should look in v2 also into the declarations.tsconfig.
  // NOTE: we do not need a virtual index.js we create a Real ESM Build at present.
  // ESM Wrappers as hotfix for v1
  "internal-api.js": `export * from './index.js';`,
  "managers.js": `export * from './index.js';`,
  "models.js": `export * from './index.js'`, //TODO: models index does in fact at present only export FileSystem
};

// // TODO: hotfix would be to build a single file ESM Bundle and reexport from that.
// // This emits wrappers as we did expose files without types and fixing takes weeks
// // TODO: see below remove this hotfix.
// assigns a default extension needed for compat in future migrations when we remove this
// we only need to set the extension manual because we emit assets as type not chunks
const emitFilesFromMap = (nameContentMap) => Object.entries(nameContentMap).map(([moduleName,source]) =>{
  return [moduleName + moduleName.includes('.') ? "" : '.js', source];
})
// // TODO: make type emit compatible to this structure then enable virtual module till all works
// // This is for dev only at present npm install @rollup/plugin-virtual --save-dev
// // import virtual from '@rollup/plugin-virtual';
// // virtual(virtualModules)

// TODO: Replace that with a function that works better when we do v2
const external = ['fs','path','crypto','stream','crc/lib/crc32.js','sha.js/sha1','sha.js/sha1.js', ...Object.keys(pkg.dependencies)];

export default [
  // Build isomorphic-git ESM & CJS as also emit type declarations for ESM
  // For CJS we create wrappers for the types that reexport the ESM Types
  // we made sure before that that src/index.js has no default export anymore
  // so both CJS and ESM will export indentical shaped Objects.
  { 
    output: [
      { dir, format: 'es' },
      { dir, format: 'cjs', entryFileNames: "[name].cjs", exports: 'named', },
      // TODO: Move webpack umd build here.
    ], 
    input: `src/index.js`, 
    external, plugins: [ 
      // Emits all kind of hotFix files as asset to fix the current package state.    
    {
        name: 'virtual-assets',
        buildStart: () => {

        }
      }
      // TODO: for v2 we should use packages/*/package.json for publishing
      // TODO: for v1 we should emit a own package.json here without all the dependency bloat.
      {
        "name": "emit-types-for-isomorphic-git",
        writeBundle(options, bundle: { [fileName: string]: OutputAsset | OutputChunk }) {
          const { format } = options;
          const fileNames = Object.keys(bundle);
          if (format === 'cjs') {
                      emitFilesFromMap({
                        // TODO: remove when cjs build gets removed
                        // Note: index does not need a CJS wrapper as we do a
                        // CJS Files to fix the build
                        "internal-api.cjs": `module.exports = require('./index.cjs');`,
                        "managers.cjs": `module.exports = require('./index.cjs');`,
                        "models.cjs":  `module.exports = require('./index.cjs');`,
                        // CJS Type Wrappers We use the types from the ESM Build
                        "index.d.cts": `export * from './index';`,
                        "internal-api.d.cts": `export * from './index';`,
                        "managers.d.cts": `export * from './index';`,
                        "models.d.cts": `export * from './index'`,
                      }).forEach(([fileName, source]) => {
                        this.emitFile({ type: 'asset', fileName, source });
                      });
          } else if (format.startsWith('es')) {
            // Emit the ESM assets and generate types for the esm bundle.
            execSync('tsc -p ./declarations.tsconfig.json'); // emits dir + 'index.d.ts'
            emitFilesFromMap({
              // this modules are keept indipendent as they are external at present
              // they will get used as input in v2+ so they get processed
              // ESM Files to fix the build
              ...virtualModules,
              // ESM Type Wrappers for the virtual modules
              "internal-api.d.ts": `export * from './index';`,
              "managers.d.ts": `export * from './index';`,
              "models.d.ts": `export * from './index'`,
            }).forEach(([fileName, source]) => {
              this.emitFile({ type: 'asset', fileName, source });
            });            
          } else {
            console.log("got unsupported format i will do nothing got:", { format });
          }
       }
      }
    ] 
  },
  // Build isomorphic-git/http/node ESM & CJS and create package.json 
  { 
    output: [
      { dir: dir + '/http/node', format: 'es' },
      { dir: dir + '/http/node', format: 'cjs', entryFileNames: "[name].cjs", exports: 'named' }
    ], 
    input: `src/http/node/index.js`, 
    external, plugins: [{
      name: 'emit-http-node-package.json', buildStart() {
         this.emitFile({ 
           type: 'asset', fileName: "package.json", 
           source: JSON.stringify({ 
             type: 'module', main: 'index.cjs', 
             module: 'index.js', typings: 'index.d.ts', 
           }),
         });  
      }
    }],
  },
  // Build isomorphic-git/http/web ESM & CJS and create package.json
  {
    output: [
      { dir: dir + '/http/web', format: 'es' },
      { dir: dir + '/http/web', format: 'cjs', entryFileNames: "[name].cjs", exports: 'named' },
      // Create UMD Build of HTTP the UMD Build of isomorphic-git gets done via webpack...... 
      // Note this is the only build without external dependency the webpack build also has no external dependencys.
      { dir: dir + '/http/web', format: 'umd', entryFileNames: "[name].umd.js", exports: 'named', name: 'GitHttp'  }
    ],
    input: `src/http/web/index.js`,
    external, plugins: [
      {
        name: 'emit-http-web-package.json', 
        buildStart() {
          this.emitFile({ 
           type: 'asset', fileName: "package.json", 
           source: JSON.stringify({ 
             type: 'module', main: 'index.cjs', module: 'index.js', typings: 'index.d.ts', 
             unpkg: 'index.umd.js'
           }),
         });  
        }
      },
    ],
  },
];
