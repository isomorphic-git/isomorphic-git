import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const external = [
  'fs',
  'path',
  'crypto',
  'stream',
  'lodash/get',
  'lodash/set',
  'lodash/sortBy',
  'openpgp/dist/openpgp.min.js',
  'babel-runtime/regenerator',
  'babel-runtime/helpers/asyncToGenerator',
  'babel-runtime/helpers/classCallCheck',
  'babel-runtime/helpers/createClass',
  'babel-runtime/core-js/promise',
  'babel-runtime/core-js/get-iterator',
  'babel-runtime/helpers/extends',
  'babel-runtime/helpers/typeof',
  'babel-runtime/helpers/slicedToArray',
  'babel-runtime/core-js/math/sign',
  'babel-runtime/core-js/symbol/iterator',
  'babel-runtime/core-js/map',
  'babel-runtime/helpers/toConsumableArray',
  'babel-runtime/core-js/set',
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
        'runtimeHelpers': true,
        'plugins': [
          'transform-runtime',
          'transform-object-rest-spread'
        ]
      })
    ]
  }
]
