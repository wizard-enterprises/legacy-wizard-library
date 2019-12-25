import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import webpack from 'webpack'

export function build(buildDir: string, components: {[key: string]: string}) {
  return new Promise(async (resolve, reject) => {
    webpack(await makeWebpackConfig(buildDir, components), (e, stats) => {
      if (e || stats.hasErrors()) reject(e || stats.compilation.errors)
      resolve(stats)
    })
  })
}

async function makeWebpackConfig(buildDir: string, components: {[key: string]: string}): Promise<webpack.Configuration> {
  return {
    mode: 'development',
    entry: components,
    output: {
      path: buildDir,
      filename: '[name]-[contenthash].js',
    },
    cache: true,
    devtool: 'inline-source-map',
    resolve: {
      extensions: ['.ts', '.js']
    },
    plugins: [
      new CleanWebpackPlugin(),
      ...Object.keys(components).map(name =>
        new HtmlWebpackPlugin({
          title: name,
          chunks: ['common', name],
          filename: `${name}.html`,
        }
      )),
    ],
    optimization: {
      splitChunks: {
        name: true,
        cacheGroups: {
          common: {
            chunks: 'all',
            name: 'common',
          },
        },
      },
    },
    module: {
      rules: [
        { test: /\.js$/, exclude: [/node_modules/], loader: "babel-loader"},
        { test: /\.ts$/, exclude: [/node_modules/], loader: "ts-loader"},
      ],
    },
  }
}