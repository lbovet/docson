const express    = require('express');
const path       = require('path');
const serveIndex = require('serve-index');
const c2x = require( 'css2xpath' );

let app = express();
let rootDir = path.join( __dirname, '..' );

app.use( '/', express.static( rootDir ) );

let server;

const rootUrl = "http://localhost:3000/";

// TODO not working right now (I have to figure out how to
// work with iframes

module.exports = {
  before: done => {
      server = app.listen( 3000, done );
  },
  after: done => server.close( done ),
  basic: function(browser) {
      browser.url( rootUrl + '/nightwatch/widget/basic.html' )
        .pause(3000)
        .frame('/examples/example.json')
        .expect
        .element(c2x('title:contains("Product")'))
        .present;
  },
};
