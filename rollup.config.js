import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'

import pkg from './package.json'

const external = [
  'fs',
  'path',
  'crypto',
  'stream',
  'assert',
  ...Object.keys(pkg.dependencies)
]

export default [
  {
    // Bleeding edge
    input: 'src/index.js',
    external,
    output: [
      { format: 'es', name: 'git', file: 'dist/for-future.js' }
    ],
    plugins: [
      babel({
        'babelrc': false,
        'exclude': 'node_modules/**',
        'plugins': [
          'transform-object-rest-spread'
        ]
      })
    ]
  },
  {
    // Node.js
    input: 'src/index.js',
    external,
    output: [
      { format: 'cjs', name: 'git', file: 'dist/for-node.js' }
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
    // Browserify
    input: 'src/index.js',
    external,
    output: [
      { format: 'cjs', name: 'git', file: 'dist/for-browserify.js' }
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
      })
    ]
  }
]
