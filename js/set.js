/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

/*
   Copyright (c) 1998, Raphaël Jakse (Université Joseph Fourier)
   All rights reserved.
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions are met:

   * Redistributions of source code must retain the above copyright
     notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in the
     documentation and/or other materials provided with the distribution.
   * Neither the name of Université Joseph Fourier nor the
     names of its contributors may be used to endorse or promote products
     derived from this software without specific prior written permission.

   THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
   EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
   DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
   ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function(pkg, that) {
   "use strict";
   var _ = pkg.setl10n = that.libD && that.libD.l10n ? that.libD.l10n(): function(s){return s;};
   pkg.Set = function(l) {
      this.l = {};
      this.listeners = [];
      if(l) {
         if(l instanceof Set) {// l is a set
            this.setTypeConstraint(l.typeConstraint);
            l = l.getList();
         }
         if(l instanceof Array) {
            for(var i in l) {
               this.add(l[i]);
            }
         }
         else {
            if(l.contents) {
               for(var i in l.contents) {
                  this.add(l.contents[i]);
               }
            }
            if(l.typeConstraint) {
               this.setTypeConstraint(l.typeConstraint);
            }
         }
      }
   };

   function listToString(l) {
      var res = '';
      for(var i in l) {
         if(res) {
            res += ',';
         }

         if(l[i] instanceof Array) {
            res += listToString(l[i]);
         }
         else {
            res += l[i].toString();
         }
      }
      return '[' + res + ']';
   }

   pkg.Set.prototype = {
      contains: function(element) {
         element =  this.checkConstraint(element);
         return element in this.l;
         // fixme: this.l[element] === element doesn't work correctly because [1,4] !== [1,4]
      },
 
      has: function(element) {
         return this.contains(element);
      },

      checkConstraint: function(element) {
         if(this.typeConstraint) {
            if(typeof this.typeConstraint === "string") {
               if(this.typeConstraint === "integer") {
                  if(!(typeof element === 'number' && element % 1 === 0)) {
                     throw(new Error(_("pkg.Set.checkConstraint(element): Tthe element does not satisfies the type constraint.")));
                  }
               }
               else if(typeof element !== this.typeConstraint) {
                  throw(new Error(_("pkg.Set.checkConstraint(element): Tthe element does not satisfies the type constraint.")));
               }
            }
            else if(!(element instanceof this.typeConstraint)) {
               if(this.typeConstraint === pkg.Set && element instanceof Array) {
                  element = pkg.to_set(element); // this is ok to implicitely convert lists to sets
               }
               else {
                  throw(new Error(_("pkg.Set.checkConstraint(element): Tthe element does not satisfies the type constraint.")));
               }
            }
         }
         return element;
      },

      add: function(element) {
         element =  this.checkConstraint(element);
         if((element instanceof pkg.Set) && !this.contains(element)) {
            var that = this;
            var rep = element.toString();
            var bind = function() {
               if(rep in that.l) {
                  delete that.l[rep];
                  rep = element.toString();
                  that.l[element] = element;
                  that.updated('elementModified');
               }
               else {
                  element.release(bind, 'all');
               }
            };

            element.listen(bind, 'all');
         }
         this.l[element] = element;
         this.updated('add', element);
      },

      remove: function(element) {
         delete this.l[element];
         this.updated('remove', element);
      },

      card: function() {
         var s=0;
         for(var i in this.l) {
            ++s;
         }
         return s;
      },

      unionInPlace: function(set) {
         set = pkg.to_set(set);
         this._blockEvents = true;
         for(var i in set.l) {
            this.add(set.l[i]);
         }
         this._blockEvents = false;
         this.updated('unionInPlace', set);
         return this;
      },

      interInPlace: function(set) {
         set = pkg.to_set(set);
         this._blockEvents = true;
         for(var i in this.l) {
            var e = this.l[i];
            if(!set.contains(e)) {
               this.remove(e);
            }
         }
         this._blockEvents = false;
         this.updated('interInPlace', set);
         return this;
      },

      minusInPlace: function(set) {
         set = pkg.to_set(set);
         this._blockEvents = true;
         for(var i in set.l) {
            this.remove(set.l[i]);
         }
         this._blockEvents = false;
         this.updated('minusInPlace', set);
         return this;
      },

      subsetOf: function(set) {
         set = pkg.to_set(set);
         for(var i in this.l) {
            if(!set.contains(this.l[i])) {
               return false;
            }
         }
         return true;
      },

      symDiff: function(set) {
         var r = new pkg.Set();
         set = pkg.to_set(set);
         for(var i in this.l) {
            if(!set.contains(this.l[i])) {
               r.add(this.l[i]);
            }
         }
         for(var i in set.l) {
            if(!this.contains(set.l[i])) {
               r.add(set.l[i]);
            }
         }
         return r;
      },

      plus: function() {
         var r = new pkg.Set();
         r.unionInPlace(this);
         for(var i in arguments) {
            r.add(arguments[i]);
         }
         return r;
      },
    
      powerset: function() {
         if(this.card() === 0) {
            return new pkg.Set([new pkg.Set()]);
         }
         else {
            var lastE;
            var Complement = new pkg.Set();
            for(var i in this.l) {
               lastE = this.l[i];
               Complement.add(lastE);
            }
            Complement.remove(lastE);
            var PCompl = Complement.powerset();
            var U = new pkg.Set();
            for(var underset_i in PCompl.l) {
               U.add(PCompl.l[underset_i].plus(lastE));
            }
            return pkg.union(PCompl, U);
         }
      },

      getList: function() {
         var r = [];
         for(var i in this.l) {
            r.push(this.l[i]);
         }
         return r;
      },

      getSortedList: function() {
         return this.getList().sort();
      },

      toString: function() {
         var res = '';
         var l = this.getSortedList();
         for(var i in l) {
            if(res) {
               res += ',';
            }
            if(l[i] instanceof Array) {
               res += listToString(l[i]);
            }
            else {
               res += l[i].toString();
            }
         }
         return '{' + res + '}';
      },

      updated: function(event, object) {
         if(!this._blockEvents) {
            for(var i in this.listeners) {
               if(this.listeners[i].event === event || this.listeners[i].event === 'all') {
                  this.listeners[i].callback(event, object);
               }
            }
         }
      },

      listen: function(callback, event) {
         this.listeners.push({event:event,callback:callback});
      },

      release: function(callback, event) {
         for(var i in this.listeners) {
            if(this.listeners[i].event === event && this.listeners[i].callback === callback) {
               this.listeners.splice(i, 1);
            }
         }
      },

      forEach: function(callback) {
         for(var i in this.l) {
            callback(this.l[i]);
         }
      },

      setTypeConstraint: function(typeConstraint) {
         this.typeConstraint = typeConstraint;
      },

      every: function(func) {
         for(var i in this.l) {
            if(!func(this.l[i])) {
               return false;
            }
         }
         return true;
      },

      copy : function() {
         return new pkg.Set(this);
      },

      empty : function() {
         var l = this.getList();
         this._blockEvents = true;
         for(var i in l) {
            this.remove(l[i]);
         }
         this._blockEvents = false;
         this.updated('empty');
      },
 
      isEmpty : function() {
         for(var i in this.l) {
            return false;
         }
         return true;
      }
   };

   pkg.new_set = function (l) {
      return new pkg.Set(l);
   };

   pkg.to_set = function(l) {
      if(l instanceof pkg.Set) {
         return l;
      }
      else {
         return pkg.new_set(l);
      }
   };

   pkg.contains = pkg.has = function (set, element) {
      return set.l in element;
   };

   pkg.add = function (set, element) {
      set.add(element);
   };

   pkg.remove = function (set, element) {
      set.remove(element);
   };

   pkg.card = function (set) {
      return set.l.length;
   };

   pkg.union = function (set1, set2) {
      var set = pkg.to_set(set1);
      set.unionInPlace(set2);
      return set;
   };

   pkg.inter = function (set1, set2) {
      var set = pkg.new_set(), e;
      for(var i in set1.l) {
         e = set1.l[i];
         if(set2.contains(i)) {
            set.add(e);
         }
      }
      return set;
   };

   pkg.minus = function (set1, set2) {
      set1 = pkg.new_set(set1);
      set1.minusInPlace(set2);
      return set1;
   };

   pkg.inter_in_place = function (set1, set2) {
      return set1.interInPlace(set2);
   };

   pkg.union_in_place = function (set1, set2) {
      return set1.unionInPlace(set2);
   };

   pkg.minus_in_place = function (set1, set2) {
      return set1.minusInPlace(set2);
   };

   pkg.cross = function (set1, set2) {
      var set = pkg.new_set();
      set1 = pkg.to_set(set1);
      set2 = pkg.to_set(set2);
      for(var i in set1.l) {
         for(var j in set2.l) {
            set.add([set1.l[i], set2.l[j]]);
         }
      }
      return set;
   };

   pkg.set_type_constraint = function (set, type) {
      set.setTypeConstraint(type);
   };

   pkg.every = function (set, func) {
      return set.every(func);
   };

   pkg.get_list = function (set) {
      return pkg.to_set(set).getList();
   };

   pkg.get_sorted_list = function (set) {
      return pkg.to_set(set).getSortedList();
   };

   pkg.powerset = function (set) {
      return pkg.to_set(set).powerset();
   };

   pkg.symDiff = function(set1, set2) {
      return pkg.to_set(set1).symDiff(set2);
   }

   pkg.empty = function(set) {
      set.empty();
   };

   pkg.is_empty = function(set) {
      return set.isEmpty();
   };

   _("fr", "pkg.Set.checkConstraint(element): Tthe element does not satisfies the type constraint.", "pkg.Set.checkConstraint(element) : L'élément ne satisfait pas la contrainte de type.");
})(this, this);