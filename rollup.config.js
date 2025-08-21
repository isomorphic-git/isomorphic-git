import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';
// TODO: Upgrade CI pipeline as this is Node22 syntax but it is needed!
import pkg from './package.json' with { type: 'json' }

const { dependencies } = pkg;
const dir = import.meta.dirname;

// TODO: Replace that with a function that works better when we do v2
const external = [
  'fs','path','crypto','stream','crc/lib/crc32.js','sha.js/sha1','sha.js/sha1.js', 
  ...Object.keys(dependencies),
];

const v2DefaultOutputOptions = {
  minifyInternalExports: false,
  preserveModules: false, // Else we would not bundle
  preserveModulesRoot: 'src',  // maybe needed for relative types
}

// ESM Files to fix the build
const virtualModules = {
  // We emit some modules as hotfix for the ESM build
  //  Managers + models can be import like so
  // `import {GitConfigManager, GitIndexManager} from "isomorphic-git/managers"`
  // `import {FileSystem} from "isomorphic-git/models"`
  // we create the wrapper files and package.json resolves them with extension.js via exports.
  // this are hotfix wrappers they should get replaced by the real files
  // ESM Wrappers as hotfix for v1
  "internal-api": `export * from './index.js';`,
  "managers": `export * from './index.js';`,
  "models": `export * from './index.js'`, //TODO: models index does in fact at present only export FileSystem
};

// TODO: make type emit compatible to this structure then enable virtual module till all works
// // This is for dev only at present 
// // npm install @rollup/plugin-virtual --save-dev
// // import virtual from '@rollup/plugin-virtual';
// // virtual(virtualModules)


// TODO: Rename that to singleBundleEsmReExport
const singleBundleTypes = `export * from './index';`
const singleBundleEsmReExport = `export * from './index';`

// Emits all kind of hotFix files as asset to fix the current package state.
const outputPluginIsomorphicGitESM = { 
  // TODO: remove v2 - hotfix builds a single file ESM Bundle and reexports from that.
  "name": "emit-types-for-isomorphic-git ESM & webpack build that depends on this build.",
  // options: OutputOptions, bundle:  { [fileName: string]: OutputAsset | OutputChunk }
  writeBundle(options, bundle) {
      // TODO: for v2 we should use packages/*/package.json for publishing
      // TODO: for v1 we should emit a own package.json here without all the dependency bloat.
      
      const { format } = options;
      const fileNames = Object.keys(bundle);
      if (format.startsWith('es')) {
  
        // Emit the ESM assets and generate types for the esm bundle.
       
        // execSync('tsc -p ./declarations.tsconfig.json'); // emits dir + 'index.d.ts'
        // {"include":["index.js","http/web/index.js","http/web/index.cjs","http/node/index.js",
        // "http/node/index.cjs"],"exclude":["node_modules"],"compilerOptions": 
        // {"types":[],"strictNullChecks":true,"allowJs":true,"declaration":true,"noEmit":false,"emitDeclarationOnly":true}}
        execSync('tsc index.js --strictNullChecks --allowJs --declaration --emitDeclarationOnly');
        // NOTE: The other Types get emited in other outputConfigs
        
        // ReExport the types so that type mappings work even without package.json
        Object.entries({
          // this modules are keept indipendent as they are external at present
          // they will get used as input in v2+ so they get processed
          // ESM Files to fix the build
          ...virtualModules,
          // ESM Type Wrappers for the virtual modules
          "internal-api.d.ts": singleBundleEsmReExport,
          "managers.d.ts": singleBundleEsmReExport,
          "models.d.ts": singleBundleEsmReExport,
        }).map(([moduleName,source]) =>{
          return [moduleName + moduleName.includes('.') ? "" : '.js', source];
        }).forEach(([fileName, source]) => {
          this.emitFile({ type: 'asset', fileName, source });
        });
  
        // create the webpack bundle here as it uses this bundle
        execSync('npx webpack --config webpack.config.cjs');
        this.emitFile({ type: 'asset', fileName: "index.umd.min.d.ts", source: singleBundleEsmReExport });
      
      } else {
        console.log(this.name + " got unsupported format i will do nothing got:", { format });
      }
  },
};

// Emits all kind of hotFix files as asset to fix the current CJS package state.
const outputPluginIsomorphicGitCJS = { 
  // TODO: remove v2 - hotfix builds a single file ESM Bundle and reexports from that.
  "name": "emit-wrappers-for-code-and-types-isomorphic-git CJS",
  // options: OutputOptions, bundle:  { [fileName: string]: OutputAsset | OutputChunk }
  writeBundle(options, bundle) {
    const { format } = options;
    const fileNames = Object.keys(bundle);
    if (format === 'cjs') {
      
      Object.entries({
        // TODO: remove when cjs build gets removed
        // Note: index does not need a CJS wrapper as we do a
        // CJS Files to fix the build singleBundleCjsExport
        "internal-api.cjs": `module.exports = require('./index.cjs');`,
        "managers.cjs": `module.exports = require('./index.cjs');`,
        "models.cjs":  `module.exports = require('./index.cjs');`,
        // CJS Type Wrappers We use the types from the ESM Build
        "index.d.cts": singleBundleEsmReExport,
        "internal-api.d.cts": singleBundleEsmReExports,
        "managers.d.cts": singleBundleEsmReExport,
        "models.d.cts": singleBundleEsmReExport,
      }).forEach(([fileName, source]) => {
        this.emitFile({ type: 'asset', fileName, source });
      });
    
    } else {
      console.log(this.name + " got unsupported format i will do nothing got:", { format });
    }
  },
};

export default [
  // Build isomorphic-git ESM & CJS as also emit type declarations for ESM
  // For CJS we create wrappers for the types that reexport the ESM Types
  // we made sure before that that src/index.js has no default export anymore
  // so both CJS and ESM will export indentical shaped Objects.
  { 
    output: [
      { 
        dir, format: 'es', 
        exports: "named", // <-- disables synthetic default export
        preferConst: true, // optional, makes top-level vars `const`
        plugins: [
          outputPluginIsomorphicGitESM
        ],
      },
      { 
        dir, format: 'cjs', entryFileNames: "[name].cjs", 
        exports: 'named', 
        preferConst: true, // optional, makes top-level vars `const`
        plugins: [
          outputPluginIsomorphicGitCJS
        ] 
      },
    ], 
    input: `src/index.js`, 
    external, plugins: [ 
      // TODO: make type emit compatible to this structure then enable virtual module till all works
      // // This is for dev only at present 
      // // npm install @rollup/plugin-virtual --save-dev
      // // import virtual from '@rollup/plugin-virtual';
      // // virtual(virtualModules)
    ],
  },
 
  // Build isomorphic-git/http/node ESM & CJS and create package.json 
  { 
    output: [
      { 
        dir: `${dir}/http/node`, format: 'es', exports: 'named', 
        preferConst: true, // optional, makes top-level vars `const`
        plugins: [
          // {
          //   // TODO: in node v12 we do not need this package.json files the main files covers the correct resolution
          //   // there the files should be http/web.js node.js
          //   name: 'emit-http-node-package.json', 
          //   generateBundle() {
          //      this.emitFile({ 
          //        type: 'asset', fileName: "package.json", 
          //        source: JSON.stringify({ 
          //          type: 'module', main: 'index.cjs', 
          //          module: 'index.js', typings: 'index.d.ts', 
          //        }),
          //      });  
          //   },
          // },
          { 
          "name": "tsc create types-isomorphic-git/http/node ESM",
          writeBundle(options, bundle) {
            execSync(`tsc ${dir}/http/node/index.js --strictNullChecks --allowJs --declaration --emitDeclarationOnly`);
          }
        }], 
      },
      { 
        dir: `${dir}/http/node`, format: 'cjs', 
        entryFileNames: "[name].cjs", exports: 'named', 
        plugins: [{ 
          "name": "wrapper create types-isomorphic-git/http/node CJS",
          writeBundle(options, bundle) {
              // emit wrappers here
          }
        }], 
      },
    ], 
    input: `${dir}/src/http/node/index.js`, external, 
    plugins: [],
  },
  // Build isomorphic-git/http/web ESM & CJS & UMD and create package.json referencing all including types from ESM
  {
    output: [
      { 
        dir: dir + '/http/web', format: 'es', exports: 'named',
        preferConst: true, // optional, makes top-level vars `const`
        plugins: [
          //     // TODO: node12 we do not need this package.json files the main files covers the correct resolution
          //     // there the files should be http/web.js node.js
          // {
          //   name: 'emit-http-web-package.json', 
          //   generateBundle() {
          //     this.emitFile({ 
          //        type: 'asset', fileName: "package.json", 
          //        source: JSON.stringify({ 
          //          type: 'module', main: 'index.cjs', module: 'index.js', typings: 'index.d.ts', 
          //          unpkg: 'index.umd.js'
          //        }),
          //     });
          //   },
          // },
          { 
            "name": "tsc create types-isomorphic-git/http/web ESM",
            writeBundle(options, bundle) {
              execSync('tsc http/web/index.js --strictNullChecks --allowJs --declaration --emitDeclarationOnly');
            }
          },
        ], 
      },
      { 
        dir: dir + '/http/web', format: 'cjs', 
        entryFileNames: "[name].cjs", exports: 'named', 
        plugins: [{ 
          "name": "wrapper create types-isomorphic-git/http/web CJS",
          writeBundle(options, bundle) {
            this.emitFile({ 
             type: 'asset', fileName: "index.d.cts", source: singleBundleEsmReExport,
            });
          }
        }], 
      },
      // Create UMD Build of HTTP the UMD Build of isomorphic-git gets done via webpack...... 
      // Note this is the only build without external dependency the webpack build also has no external dependencys.
      { 
        dir: dir + '/http/web', format: 'umd', 
        entryFileNames: "[name].umd.js", 
        exports: 'named', name: 'GitHttp', 
        plugins: [{ 
          "name": "wrapper create types-isomorphic-git/http/web UMD",
          writeBundle(options, bundle) {
            this.emitFile({ 
             type: 'asset', fileName: "index.umd.d.ts", source: singleBundleEsmReExport,
            });
          }
        }], 
      },
      // TODO: Imaginated webpack umd build from the webpack.config.js
    ],
    input: `src/http/web/index.js`, external
  },
];
