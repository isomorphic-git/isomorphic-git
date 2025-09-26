const path = require('path')

const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = [
  {
    target: 'webworker',
    entry: {
      index: './src/index.js',
      'internal-apis': './src/internal-apis.js',
      'managers/index': './src/managers/index.js',
      'models/index': './src/models/index.js'
    },
    output: {
      path: path.resolve(__dirname),
      filename: '[name].umd.min.js',
      library: 'git',
      libraryTarget: 'umd',
    },
    mode: 'production',
    devtool: 'source-map',
    plugins: [
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        analyzerMode: 'static',
        reportFilename: 'size_report.html',
        defaultSizes: 'gzip',
        excludeAssets: 'internal-apis\\.umd\\.min\\.js',
      }),
      new DuplicatePackageCheckerPlugin({
        strict: true,
      }),
    ],
  },
]
