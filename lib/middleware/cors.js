module.exports = function cors(){
    return function cors(req, res, next) {
      var writeHead = res.writeHead;

      res.writeHead = function(code, headers) {
        if (req.headers['origin']) {
          headers['Access-Control-Allow-Origin'] =  req.headers['origin'];
        }
        return writeHead(code, headers);
      }

      if (req.method === "OPTIONS") {
        var corsHeaders = {
          'Access-Control-Allow-Methods' : 'POST,PUT,DELETE,GET,OPTIONS'
        }, acrh = req.headers['access-control-request-headers'] || false;

        if (acrh) {
          corsHeaders['Access-Controll-Allow-Headers'] = acrh;
        }

        res.writeHead(200, corsHeaders);
        res.end();
      } else {
        next();
      }
    }
};
