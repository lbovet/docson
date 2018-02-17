var program = require('commander');
var server  = require('./server');

program
  .version('0.0.0')
  .option('-p, --port [port]', 'port on which to run the app [3000]', 3000 )
  .parse(process.argv);

server.listen( program.port, () => 
    console.log( "server ready and running on port " + program.port )
);
