Set.prototype.iterator =  function() {
   for(var i in this.l) {
      yield this.l[i];
   }
   return;
}

Set.prototype['@@iterator'] =  function() {
   for(var i in this.l) {
      yield {value:this.l[i]};
   }
   return;
}