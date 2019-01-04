const path = require('path');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.common.config.js');

module.exports = merge(baseConfig, {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist')
  },
  devServer: {
    contentBase: 'dist',
    port: 8080,
    open: true,
    watchContentBase: true,
    overlay: true
  }
});
