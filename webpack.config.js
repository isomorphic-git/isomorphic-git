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
        excludeAssets: 'internal\\.umd\\.min\\.js',
      }),
      new DuplicatePackageCheckerPlugin({
        strict: true,
      }),
    ],
    resolve: {
      alias: {
        // 'bops' depends on 0.0.2 but 1.x (used by node-libs-browser) is compatible
        'base64-js': require.resolve('base64-js'),
      },
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
                '@babel/plugin-transform-async-to-generator',
              ],
            },
          },
        },
      ],
    },
  },
]
