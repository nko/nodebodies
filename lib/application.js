module.exports.setup = function(bookmarkOrigin) {
  var fs       = require('fs'),
      scripts  = [
        '/js/jquery.js',
        '/js/main.js',
        '/js/selector.js'
      ],
      bookmarkletSource = fs.readFileSync(__dirname + "/../public/js/bookmarklet.js").toString(),
      contentUrl  = "http://" + bookmarkOrigin.replace("/",""),
      bookmarklet = bookmarkletSource.replace("%_CURRENT_URL_%", contentUrl),
      pageSource  = fs.readFileSync(__dirname + "/../templates/index.html").toString();
  
  bookmarklet = bookmarklet.replace("%_SCRIPTS_%", contentUrl + scripts.join("','" + contentUrl));
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
