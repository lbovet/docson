#!/usr/bin/env node
'use strict';

var program = require('commander');
var server = require('./server');

program.version('0.0.0').option('-p, --port [port]', 'port on which to run the app [3000]', 3000).option('-d, --directory [dir]', 'which directory to serve [.]', '.').parse(process.argv);

server(program).listen(program.port, () => console.log("server ready and running at localhost:" + program.port));