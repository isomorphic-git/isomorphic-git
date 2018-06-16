var path = require('path')

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
              babelrc: false,
              plugins: [
                'transform-object-rest-spread',
                'transform-async-to-generator'
              ]
            }
          }
        }
      ]
    }
  }
]
