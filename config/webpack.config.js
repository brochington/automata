const path = require('path');
const webpack = require('webpack');
const aliases = require('./aliases');

const babelLoaderConfig = {
  loader: 'babel-loader',
  options: {
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
    ],
    presets: [
      '@babel/typescript',
    ],
  },
}

module.exports = {
  entry: [
    path.join(process.cwd(), 'src/index.ts'),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(process.cwd(), 'dist'),
    library: '@brochington/automata',
    libraryTarget: 'umd',
    publicPath: '/static/',
    umdNamedDefine: true,
    hotUpdateChunkFilename: 'hot/hot-update.js',
    hotUpdateMainFilename: 'hot/hot-update.json',
  },
  mode: 'production',
  devtool: 'eval-source-map',
  resolve: {
    alias: { ...aliases },
    extensions: ['.js', '.mjs', '.ts', '.tsx'],
  },
  module: {
    rules: [{
      test: /\.ts(x?)$/,
      include: path.join(process.cwd(), 'src'),
      use: [babelLoaderConfig],
    }, {
      test: /\.m?js$/,
      include: path.join(process.cwd(), 'src'),
      use: [babelLoaderConfig],
    }],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};