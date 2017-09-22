import babel from 'rollup-plugin-babel'
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
      'path',
      'crypto',
      'stream',
      'assert',
      ...Object.keys(pkg.dependencies)
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
      })
    ]
  }
]
