const path = require('path')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')

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
    plugins: [
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        analyzerMode: 'static',
        reportFilename: 'size_report.html',
        defaultSizes: 'gzip',
        excludeAssets: 'internal\\.umd\\.min\\.js'
      }),
      new DuplicatePackageCheckerPlugin({
        strict: false
      })
    ],
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
