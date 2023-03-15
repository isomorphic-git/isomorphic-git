const path = require('path')

const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = [
  {
    target: 'webworker',
    entry: {
      index: './src/index.js',
      'internal-apis': './src/internal-apis.js',
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
                '@babel/plugin-transform-async-to-generator',
              ],
            },
          },
        },
      ],
    },
  },
]
