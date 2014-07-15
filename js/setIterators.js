Set.prototype.iterator =  function() {
   for(var i in this.l) {
      yield this.l[i];
   }
};

try {
   eval("\
      Set.prototype['@@iterator'] =  function*() {\
         for(var i in this.l) {\
            yield this.l[i];\
         }\
      };\
   ");
} catch (e){}
