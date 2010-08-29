var citation   = require('./model').citation,
    http       = require('http'),
    eventStore = function(){
      var self = {},
          sessions = {};
      
      self.get = function(id){
        if(!sessions.hasOwnProperty(id)){
          sessions[id] = [];
        }
        
        return sessions[id];
      };
      
      self.push = function(id, res){
        var session = self.get(id);
        session.push(res);
      };
      
      self.respond = function(id, cite){
        var session = self.get(id);
        
        for(var i = 0, l = session.length; i < l; i += 1){
          var res = session[i];
          
          res.writeHead("200", { "Content-type": "application/json" });
          res.end(JSON.stringify(cite, null, true));
        }
        
        self.clean(id);
      };
    
      self.clean = function(id){
        delete sessions[id];
      };
      
      return self;
    },
    checkForId = function(req, res){
      if(!req.params.id){
        res.writeHead("404", { "Content-type": "application/json" });
        res.end(JSON.stringify({
          'error': 'Please specify a citation id.'
        }, null, true));
      }
    },
    checkForCitation = function(res, cite){
      if(!cite.get('_id')){
        res.writeHead("404", { "Content-type": "application/json" });
        res.end(JSON.stringify({
          'error': 'That citation does not exist.'
        }, null, true));
      }
    },
    checkForErrors = function(res, err){
      if(err){
        res.writeHead("500", { "Content-type": "application/json" });
        res.end(JSON.stringify({
          'error': err
        }, null, true));
      }
    };

module.exports.setup = function(bookmarkOrigin) {
  var fs       = require('fs'),
      scripts  = [
        '/js/jquery.js',
        '/js/main.js'
      ],
      bookmarkletSource = fs.readFileSync(__dirname + "/../public/js/bookmarklet.js").toString(),
      contentUrl  = "http://" + bookmarkOrigin.replace("/",""),
      bookmarklet = bookmarkletSource.replace(/%_CURRENT_URL_%/g, contentUrl),
      pageSource  = fs.readFileSync(__dirname + "/../templates/index.html").toString(),
      events = eventStore();

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
      var cite = citation.create(req.body), sys = require('sys');
      cite.save(function(err, obj){
        checkForErrors(res, err);
        obj = obj[0];
        
        res.writeHead("201", {
           "Content-type": "application/json",
           "Location" : bookmarkOrigin + "/" + obj['_id'].toHexString(),
           "Set-Cookie"   : "citation_session=" + obj['_id'].toHexString() + "; path=/; httpOnly: expires"
        });
        res.end(JSON.stringify({ 'id': obj['_id'] }, null, true));
      });
    });
    
    app.get('/citation/:id/', function(req, res){
      checkForId(req, res);
      
      citation.getById(req.params.id, function(err, cite){
        checkForErrors(res, err);
        checkForCitation(res, cite);
          
        res.writeHead("200", { "Content-type": "application/json" });
        res.end(JSON.stringify(cite.toObject(), null, true));
      });
    });
    
    app.put('/citation/:id/', function(req, res){
      checkForId(req, res);
      
      if(!req.body){
        res.writeHead("400", { "Content-type": "application/json" });
        res.end(JSON.stringify({
          'error': 'Please provide the citation data.'
        }));
      }
      
      citation.getById(req.params.id, function(err, cite){
        checkForErrors(res, err);
        checkForCitation(res, cite);
        
        for(var f in req.body){
          if(req.body.hasOwnProperty(f) && f !== '_id'){
            cite.set(f, req.body[f]);
          }
        }
        
        cite.save(function(err, obj){
          checkForErrors(res, err);
          events.respond(req.params.id, cite.toObject());
          
          res.writeHead("200", { "Content-type": "application/json" });
          res.end(JSON.stringify({
            'success': "Life ain't nothin but bitches and money."
          }));
        });
      });
    });
    
    app.get('/events/:id/', function(req, res){
      checkForId(req, res);
      
      events.push(req.params.id, res);
    });
  };
};
