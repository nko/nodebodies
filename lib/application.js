var fs      = require('fs'),
    source  = fs.readFileSync(__dirname + "/../public/js/bookmarklet.js").toString()
    scripts = [
     '/js/main.js' 
    ];




module.exports = function(app) {

  // Routes    
  app.get('/bookmarklet.js', function(req, res) {
    res.writeHead(200, {
      'Content-type' : "text/javascript"
    });

    var bookmarklet = source.replace("%_CURRENT_URL_%", "http://" + req.host + "/"); 
    bookmarklet = bookmarklet.replace("%_SCRIPTS_%", scripts.join("','"));
    bookmarklet = bookmarklet.replace(/[\n\t\r  ]/g, "");
    res.end(bookmarklet);
  });  





};
