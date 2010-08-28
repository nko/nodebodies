var connect     = require('connect'),
    application = require('./application');
    port        = process.ARGV.pop();

var server = connect.createServer(
 // middleware goes here
 connect.bodyDecoder(),
 connect.cookieDecoder(),
 connect.router(application),
 connect.staticProvider(__dirname + '/../public'),
 connect.errorHandler({ dumpExceptions: true })
).listen(parseInt(port) || 80);
