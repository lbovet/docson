const path = require('path');

module.exports = {
  entry: {
      webpage: './src/webpage.js',
      widget: './src/widget.js',
  },
  output: {
    path:     path.resolve('public/js'),
    filename: '[name].js'
  }
}
