'use strict';

const express = require('express');
const path = require('path');
const serveIndex = require('serve-index');

module.exports = function (options = {}) {
    const app = express();

    if (!options.directory) options.directory = '.';

    app.use(express.static('files'));

    let docsonRootDir = path.join(__dirname, '..');

    app.use('/docson', express.static(docsonRootDir + '/public'));
    app.use('/docson', express.static(docsonRootDir + '/webpack'));

    app.get(/\.json$/, function (req, res, next) {
        if (req.xhr) return next();

        res.redirect('/docson/#' + req.path);
    });

    app.use('/', serveIndex(options.directory, {
        'icons': true
        //       filter: filename => /\.json$/.test(filename)
    }), express.static(options.directory));

    return app;
};