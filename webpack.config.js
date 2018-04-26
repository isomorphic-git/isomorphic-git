var path = require('path')
// var nodeExternals = require('webpack-node-externals')

module.exports = [
  {
    target: 'web',
    entry: {
      bundle: './src/index.js',
      internal: './src/internal-apis.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].umd.min.js',
      library: 'git',
      libraryTarget: 'umd'
    },
    mode: 'production',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              forceEnv: 'browser'
            }
          }
        }
      ]
    }
    // },
    // {
    //   target: 'node',
    //   externals: [nodeExternals()],
    //   entry: {
    //     index: './src/index.js',
    //     'internal-apis': './src/internal-apis.js'
    //   },
    //   output: {
    //     path: path.resolve(__dirname, 'dist/for-node/isomorphic-git'),
    //     filename: '[name].js',
    //     libraryTarget: 'commonjs'
    //   },
    //   mode: 'development',
    //   devtool: 'source-map',
    //   resolve: {
    //     alias: {
    //       'stream-source': 'stream-source/index.node.js'
    //     }
    //   }
  }
]
