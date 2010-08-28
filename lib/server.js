var connect     = require('connect'),
    setup       = require('./application').setup,
    port        = process.ARGV.pop(),
    server      = "127.0.0.1",
    cors        = require('./middleware/cors');

port = parseInt(port) || 80;
server += ":" + port;
var server = connect.createServer(
 cors(),
 connect.bodyDecoder(),
 connect.cookieDecoder(),
 connect.router(setup(server)),
 connect.staticProvider(__dirname + '/../public'),
 connect.staticProvider(__dirname + '/../templates'),
 connect.errorHandler({ dumpExceptions: true })
).listen(port);
