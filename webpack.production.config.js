const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  devtool: false,
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'product')
  }
};
