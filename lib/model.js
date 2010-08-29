var leaf = require('leaf'),
    noteValidation = function(note){
      // validation for single note objects
      var self = {},
          validPosition = function(val){
            return typeof val === 'object' && 
                    val.hasOwnProperty('x') && 
                    val.hasOwnProperty('y') &&
                    typeof val['x'] === 'number' &&
                    typeof val['y'] === 'number';
          };
      
      self.fields = ['hash', 'path', 'text', 'bounds', 'anchor'];
      
      self.hash = function(val){
        return val && typeof val === 'string';
      };
      
      self.path = function(val){
        return val && typeof val === 'string' && val.length <= 500;
      };
      
      self.text = function(val){
        return typeof val === 'string';
      };
      
      self.bounds = function(val){
        return validPosition(val);
      };
      
      self.anchor = function(val){
        return validPosition(val);
      };
      
      if(!note){
        return false;
      }
        
      for(var i = 0, l = self.fields.length; i < l; i += 1){
        var f = self.fields[i];
        
        if(note.hasOwnProperty(f)){
          if(!self[f](note[f])){
            return f + " is invalid!";
          }
        }else{
          return f + " is a required property";
        }
      }
      
      return true;
    };
    
var citation = leaf.model({
  name: 'Citation',
  collectionName: 'citations',
  fields: {
    url: {
      type: String,
      custom: function(value){
        var regex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        
        return value && regex.test(value);
      },
      required: true
    },
    notes: {
      type: Array,
      custom: function(value){
        var isValid = true;
        
        value.forEach(function(note){
          if(!noteValidation(note)){
            isValid = false;
          }
        });

        return isValid;
      },
      required: true
    },
    lastUpdated: {
      type: String,
      required: true
    }
  },
  proto: {
    latest: function(callback, doneCallback, num){
      var limit = num || 10,
          q     = this.find({ 
                    'notes.text': { '$ne': '' }
                  }).limit(limit).sort({ lastUpdated: -1 });      
        
      q.each(callback, doneCallback);
    },
    count: function(callback, url){
      var site = url || 'http://sitations.com/',
          q    = this.find().count(function(err, count){
            callback(err, count);
          });
    }
  }
})({
  dbname: 'rough-cafe',
  host: 'nodeko.mongohq.com',
  username: 'nodeko',
  password: '92ac1704afd',
  port: 27106
});

exports.citation = citation;
