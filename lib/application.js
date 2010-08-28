var mongo = require('mongoose').Mongoose,
    db = mongo.connect('mongodb://localhost/citations'),
    Citation;
    
mongo.model('Citation', {
  collection: 'citations',
  properties: ['annotations'],
  cast: {
    annotations: Array
  },
  indexes: ['annotations']
});

Citation = db.model('Citation');

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
    
    app.post('/annotation/', function(req, res){
      var cit = new Citation(req.body);
      
      cit.save(function(){
        res.writeHead("200", { "Content-type": "application/json" });
        res.end(JSON.stringify(cit, null, true));
      });
    });
  };
};
