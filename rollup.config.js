import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

import json from 'rollup-plugin-json'

import pkg from './package.json'

export default [
  {
    // Node.js
    input: 'src/index.js',
    external: [
      'fs',
      'path',
      'crypto',
      'stream',
      'assert',
      ...Object.keys(pkg.dependencies)
    ],
    output: [
      { format: 'es', name: 'git', file: 'dist/bundle-esm.js' },
      { format: 'cjs', name: 'git', file: 'dist/node-cjs.js' }
    ],
    plugins: [
      babel({
        'babelrc': false,
        'exclude': 'node_modules/**',
        'presets': [
          ['env', {
            'modules': false,
            'targets': {
              'node': 'current'
            }
          }]
        ],
        'plugins': [
          'external-helpers',
          'transform-object-rest-spread'
        ]
      })
    ]
  },
  {
    // Browsers
    input: 'src/index.js',
    external: [
      'fs',
      'openpgp'
    ],
    output: [
      { format: 'umd', name: 'git', file: 'dist/browser-umd.js' }
    ],
    plugins: [
      babel({
        'babelrc': false,
        'exclude': 'node_modules/**',
        'presets': [
          ['env', {
            'modules': false,
            'targets': {
              'browsers': 'last 1 version'
            }
          }]
        ],
        'plugins': [
          'external-helpers',
          'transform-object-rest-spread'
        ]
      }),
      resolve({
        browser: true,
        extensions: [
          '.js',
          '.json'
        ]
      }),
      json({
        include: 'node_modules/**',
        preferConst: true
      }),
      commonjs(),
      globals(),
      builtins({
        crypto: true
      })
    ]
  }
]
