var mongo = require('mongoose').Mongoose,
    db = mongo.connect('mongodb://nodeko:92ac1704afd@nodeko.mongohq.com:27106/rough-cafe'),
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
        return val && typeof val === 'number';
      };
      
      self.path = function(val){
        return val && typeof val === 'string' && val.length <= 500;
      };
      
      self.text = function(val){
        return val && typeof val === 'string';
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
    
mongo.model('Citation', {
  collection: 'citations',
  properties: ['notes', 'url'],
  cast: {
    notes: Array,
    url: String
  },
  indexes: ['notes'],
  methods: {
    validate: function(){
      var isValid = true,
          regex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      
      if(!this.url || !regex.test(this.url)){
        return false;
      }
      
      if(!this.notes){
        return false;
      }
      this.notes.forEach(function(note){
        if(!noteValidation(note)){
          isValid = false;
        }
      });
      
      return isValid;
    },
    push: function(note){
      if(noteValidation(note)){
        this.notes.push(note);
      }
    }
  }
});

exports.Citation = db.model('Citation');
