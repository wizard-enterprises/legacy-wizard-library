const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackMerge = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

let mode = process.env.mode,
  modeConfig = require(`./.config/webpack.${mode}.js`) || {}

const assets = [
  {
    from: 'src/img',
    to: 'img/',
  }
]

module.exports = webpackMerge(
  {
    mode,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: '[name].[chunkhash:8].js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          // exclude: /node_modules/,
          loader: 'babel-loader',
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),//{dry: true}),
      new webpack.ProgressPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, 'src', 'index.html'),
        minify: {
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true
        }
      }),
      new CopyWebpackPlugin([...assets], {
        ignore: ['.DS_Store']
      })
    ]
  },
  modeConfig,
)