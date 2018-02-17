const express    = require('express');
const path       = require('path');
const app        = express();
const serveIndex = require('serve-index');

app.use(express.static('files'))

let rootDir = path.join( __dirname, '..' );

app.get(/\.json$/, function (req, res, next) {
    if ( req.xhr ) return next();

    res.redirect('/docson/#' + req.path);
});

app.use( '/docson', express.static( rootDir + '/public' ) );

app.use('/', 
    serveIndex(rootDir, {
        'icons': true,
        //       filter: filename => /\.json$/.test(filename)
    }),
    express.static( rootDir )
);


module.exports = app;
