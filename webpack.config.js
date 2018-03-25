const path = require('path');

module.exports = {
  entry: './src/webpage.js',
  output: {
    path:     path.resolve('dist'),
    filename: 'webpage.js'
  }
}
