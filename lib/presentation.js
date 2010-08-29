var citation = require('./model').citation,
    http     = require('http');

module.exports.setup = function(bookmarkOrigin) {
  var fs       = require('fs'),
      scripts  = [
        '/js/jquery.js',
        '/js/main.js',
        '/js/selector.js'
      ],
      bookmarkletSource = fs.readFileSync(__dirname + "/../public/js/bookmarklet.js").toString(),
      contentUrl  = "http://" + bookmarkOrigin.replace("/",""),
      bookmarklet = bookmarkletSource.replace(/%_CURRENT_URL_%/g, contentUrl),
      pageSource  = fs.readFileSync(__dirname + "/../templates/index.html").toString();

  bookmarklet = bookmarklet.replace("%_SCRIPTS_%", contentUrl + scripts.join("','" + contentUrl));
  bookmarklet = bookmarklet.replace(/[\n\t\r]/g, "");
  bookmarklet = bookmarklet.replace(/[ ]+/g, " ");
  pageSource = pageSource.replace("%_BOOTSTRAP_%", bookmarklet);

  return function(app) {
    // Home Page    
    app.get('/', function(req, res) {
      if (req.host) {
        console.log("asdfasfsadfasdf");
      }

      res.writeHead(200, {
        'Content-type' : "text/html"
      });
      res.end(pageSource);
    });
    
    app.post('/citation/', function(req, res){
      var cite = citation.create(req.body);
          
      cite.save(function(err, obj){
        if(!err){
          res.writeHead("201", {
             "Content-type": "application/json",
             "Location" : bookmarkOrigin + "/" + cit['_id'].toHexString(),
             "SetCookie"   : "citation_session=" + cit['_id'].toHexString()
          });
          res.end(JSON.stringify({ 'id': obj[0]['_id'] }, null, true));
        }else{
          res.writeHead("400", { "Content-type": "application/json" });
          res.end(JSON.stringify({
            'error': 'All notes did not pass validation',
            'message' : err
          }, null, true));
        }
      });
    });
    
    app.get('/citation/:id/', function(req, res){
      if(!req.params.id){
        res.writeHead("404", { "Content-type": "application/json" });
        res.end(JSON.stringify({
          'error': 'Please specify a citation id.'
        }, null, true));
      }
      
      citation.getById(req.params.id, function(err, cite){
        if(!err){
          res.writeHead("200", { "Content-type": "application/json" });
          res.end(JSON.stringify(cite.toObject(), null, true));
        }else{
          res.writeHead("500", { "Content-type": "application/json" });
          res.end(JSON.stringify({
            'error': err
          }, null, true));
        }
      });
    });
  };
};
