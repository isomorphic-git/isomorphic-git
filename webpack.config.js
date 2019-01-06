const path = require('path')
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')

module.exports = [
  {
    target: 'webworker',
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
      new webpack.IgnorePlugin({ resourceRegExp: /^simple-get$/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /^readable-stream$/ }),
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        analyzerMode: 'static',
        reportFilename: 'size_report.html',
        defaultSizes: 'gzip',
        excludeAssets: 'internal\\.umd\\.min\\.js'
      }),
      new DuplicatePackageCheckerPlugin({
        strict: true
      })
    ],
    resolve: {
      alias: {
        // Overwride the default 'stream' -> 'stream-browserify' mapping
        stream: require.resolve('readable-stream'),
        // Override dependencies on readable-stream@2 with v3.
        'readable-stream': require.resolve('readable-stream'),
        // 'bops' depends on 0.0.2 but 1.x (used by node-libs-browser) is compatible
        'base64-js': require.resolve('base64-js')
      }
    },
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
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-transform-async-to-generator'
              ]
            }
          }
        }
      ]
    }
  }
]
