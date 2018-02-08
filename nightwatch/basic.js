const c2x = require( 'css2xpath' );
let static_app = require( '../lib/server' );
let server;

const rootUrl = "http://localhost:3000/index.html";
  n
module.exports = {
  before: done => {
      server = static_app.listen( 3000, done );
  },
  after: done => server.close( done ),
  'relative paths' : function (browser) {
    browser.url( rootUrl + "#/nightwatch/schemas/relative.json").pause(1000);

    browser
      .useXpath()
      .expect
      .element(c2x(':contains("a baz string")'))
      .present;

    browser.end();
  }
};
