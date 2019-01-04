const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: [{
        loader: 'ts-loader',
        options: {}
      }]
    }]
  },
  resolve: {
    extensions: [
      '.ts', '.js', '.tsx'
    ],
    modules: ["src", "node_modules"],
  },
  plugins: []
};
