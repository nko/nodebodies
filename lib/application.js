var fs       = require('fs'),
    scripts  = [
     '/js/main.js',
     '/js/jquery.js'
    ];

module.exports.setup = function(bookmarkOrigin) {
  var bookmarkletSource = fs.readFileSync(__dirname + "/../public/js/bookmarklet.js").toString(),
      bookmarklet = bookmarkletSource.replace("%_CURRENT_URL_%", "http://" + bookmarkOrigin + "/");
      pageSource  = fs.readFileSync(__dirname + "/../templates/index.html").toString();
  
  bookmarklet = bookmarklet.replace("%_SCRIPTS_%", scripts.join("','"));
  bookmarklet = bookmarklet.replace(/[\n\t\r]/g, "");
  bookmarklet = bookmarklet.replace(/[ ]+/g, " ");
  pageSource = pageSource.replace("%_BOOTSTRAP_%", bookmarklet);

  return function(app) {
    // Home Page    
    app.get('/', function(req, res) {
      res.writeHead(200, {
        'Content-type' : "text/html"
      });
      res.end(pageSource);
    });  
  };
};
