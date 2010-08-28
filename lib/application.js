var Citation = require('./model').Citation;

module.exports.setup = function(bookmarkOrigin) {
  var fs       = require('fs'),
      scripts  = [
        '/js/jquery.js',
        '/js/proxy_xmlhttp.js',
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
    
    app.post('/citation/', function(req, res){
      var cit = new Citation();
      
      // REALLY NASTY HACK
      // req.body parses the JSON body in a super funky way, 
      // which wraps the notes array in another array for no reason
      // RETEST ME WITH JAVASCRIPT
      // not sure if this is going to be necessary when we move the AJAX calls
      cit.notes = req.body['notes'][0];
      
      if(cit.validate()){
        cit.save(function(){
          res.writeHead("200", { "Content-type": "application/json" });
          res.end(JSON.stringify({ 'id': cit['_id'] }, null, true));
        });
      }else{
        res.writeHead("200", { "Content-type": "application/json" });
        res.end(JSON.stringify({
          'error': 'All notes did not pass validation'
        }, null, true));
      }
    });
  };
};

