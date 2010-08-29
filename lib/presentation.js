var citation = require('./model').citation,
    http     = require('http'),
    url      = require('url'),
    proxy    = function(remoteUrl, headers, req, res) {
      var urlParts   = url.parse(remoteUrl);
          client     = http.createClient(urlParts.port || 80, urlParts.hostname),
          request    = null;
      
      headers['host'] = urlParts.host;
      request = client.request(req.method, urlParts.pathname || '/', headers);
      
      request.end();
      request.on('response', function(response) {
        var disconnect = function() { res.end(); }

        res.writeHead(response.statusCode, response.headers);
        response.on('data', function(data) {
          if(data.indexOf('</body>') > 0){
            data.replace('</body>', '<script type="text/javascript" src="http://sitations.com/js/jquery.js"></script><script type="text/javascript" src="http://sitations.com/js/main.js"></script><link type="text/css" rel="stylesheet" href="http://sitations.com/css/main.css" /></body>');
          }
          
          if (res.write(data) === false) {
            response.pause();
            res.on('drain', function() {
              response.resume();
            });
          }
        });
     
        response.on('error', disconnect);
        response.on('end', disconnect);
      });
    };


module.exports = function(app) {
  app.get(/sess-([a-zA-Z0-9]+)/, function(req, res) {
    citation.getById(req.params[0], function(err, cite) {

      if (err || !cite.get("_id")) {
        res.writeHead(404, {});
        res.end();
      } else {
        req.session.url = cite.get('url');
        proxy(req.session.url, {}, req, res);
      }
    });
  });

  app.get(/.*/, function(req, res) {
    if (req.session.url) { 
      proxy(req.session.url + req.url, {}, req, res); 
    } else {
      res.writeHead(404,{});
      res.end();
    }
  });
};

