var connect      = require('connect'),
    setup        = require('./application').setup,
    presentation = require('./presentation'),
    port         = process.ARGV.pop(),
    server       = "sitations.com",
    cors         = require('./middleware/cors')
    MemoryStore = require('connect/middleware/session/memory');;

port = parseInt(port) || 80;
var serverBase = server + ":" + port;
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
    connect.vhost('share.' + server, connect.createServer(
      connect.bodyDecoder(),
      connect.cookieDecoder(),
      connect.session({ store: new MemoryStore({ reapInterval: 60000 * 10 }) }),
      connect.router(presentation)
    )),
    connect.vhost('nodebodies.no.de', connect.createServer(
      connect.router(function(app) {
        app.get(/.+/, function(req, res) {
          res.writeHead(200, {
            'Location' : 'http://sitations.com/',
            'Content-type' : 'text/html'
          });
          res.end('<html><head><script type="text/javascript">window.location="http://sitations.com/";</script></head><body>Redirecting...</body></html>');
        })
      })
    ))
  ).listen(port);
};
