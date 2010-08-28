var mongo = require('mongoose').Mongoose,
    db = mongo.connect('mongodb://localhost/citations'),
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
      
      self.url = function(val){
        var regex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        
        return val && regex.test(s);
      }
      
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
          return false;
        }
      }
      
      return true;
    };
    
mongo.model('Citation', {
  collection: 'citations',
  properties: ['notes'],
  cast: {
    notes: Array
  },
  indexes: ['notes'],
  methods: {
    validate: function(){
      var isValid = true;
      
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
