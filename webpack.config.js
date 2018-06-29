const path = require('path');

module.exports = {
  entry: {
      webpage: [ 'babel-polyfill', './src/webpage.js' ],
      widget: [ 'babel-polyfill', './src/widget.js' ],
  },
  output: {
    path:     path.resolve('public/js'),
    filename: '[name].js'
  },
  module: {
    rules: [
        { test: /\.js$/, exclude: /node_modules/, use: ['babel-loader'] },
    ],
  },
}
