var connect     = require('connect'),
    application = require('./application'),
    port        = process.ARGV.pop(),
    cors        = require('./middleware/cors');

var server = connect.createServer(
 cors(),
 connect.bodyDecoder(),
 connect.cookieDecoder(),
 connect.router(application),
 connect.staticProvider(__dirname + '/../public'),
 connect.errorHandler({ dumpExceptions: true })
).listen(parseInt(port) || 80);
