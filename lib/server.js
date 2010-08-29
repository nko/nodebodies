var connect      = require('connect'),
    setup        = require('./application').setup,
    presentation = require('./presentation'),
    port         = process.ARGV.pop(),
    server       = "atio.ns",
    cors         = require('./middleware/cors')
    MemoryStore = require('connect/middleware/session/memory');;

port = parseInt(port) || 80;
var serverBase = server + ":" + port;
console.log('present.' + server);
module.exports = function() { 
  connect.createServer(
    connect.vhost(server, connect.createServer(
      cors(),
      connect.bodyDecoder(),
      connect.cookieDecoder(),
      connect.router(setup(serverBase)),
      connect.staticProvider(__dirname + '/../public'),
      connect.staticProvider(__dirname + '/../templates'),
      connect.errorHandler({ dumpExceptions: true })
    )),
    connect.vhost('present.' + server, connect.createServer(
      connect.bodyDecoder(),
      connect.cookieDecoder(),
      connect.session({ store: new MemoryStore({ reapInterval: 60000 * 10 }) }),
      connect.router(presentation)
    ))
  ).listen(port);
};
