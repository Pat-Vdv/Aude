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

/**
 * @author  Raphaël Jakse
 * @file This is a library for manipulating mathematical sets.
 * @note Any function of this package that taked a Set also accepts any object that can be turned into a set (e.g. Object, Array variables).
 * @version 0.1a
 */

(function(pkg, that) {
   "use strict";
   var _ = pkg.setl10n = that.libD && that.libD.l10n ? that.libD.l10n(): function(s){return s;};
   
   /**
    * @classDescription class to manipulate sets.
    * @class Set Set
    * @param {Array, Set,Object} [l] This optional parameter is an Array, a Set or an Object containing the elements to add to the newly created set.
    * @returns {Object} Returns a new Set object.
    */
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
      /**
       * This method tests the presence of an element in the set. The <has> method is an alias of this method.
       * @method contains
       * @memberof Set
       * @param {Any type} element The element of which the presence in the set must be tested.
       * @alias has
       * @alias contains
       * @returns {Boolean} Returns true if the element belongs to the set, false otherwise.

       */
      contains: function(element) {
         element =  this.checkConstraint(element);
         return element in this.l;
         // fixme: this.l[element] === element doesn't work correctly because [1,4] !== [1,4]
      },
 
      /**
       * This method tests the presence of an element in the set. It is an alias of the method <contains>.
       * @method has
       * @memberof Set
       * @param {Any type} element The element of which the presence in the set must be tested.
       * @alias has
       * @alias contains
       * @returns {Boolean} Returns true if the element belongs to the set, false otherwise.
       */
      has: function(element) {
         return this.contains(element);
      },

      /**
       * This method raise an exception if an element does not verifies the constraints to belong to the set.
       * @method checkConstraint
       * @memberof Set
       * @param {any Type} element The element to check.
       * @exception {Error} Throws an error if the element does not satisfy the constrains.
       * @returns {any Type} Returns an eventually adapted version of the element (e.g. if the constraint is the element to be a set, if the element was an Array or an Object, it is turned into a Set).
       * @see Set#setTypeConstraint
       */
      checkConstraint: function(element) {
         if(this.typeConstraint) {
            if(typeof this.typeConstraint === "string") {
               if(this.typeConstraint === "integer") {
                  if(!(typeof element === 'number' && element % 1 === 0)) {
                     throw(new Error(_("pkg.Set.checkConstraint(element): The element does not satisfies the type constraint.")));
                  }
               }
               else if(typeof element !== this.typeConstraint) {
                  throw(new Error(_("pkg.Set.checkConstraint(element): The element does not satisfies the type constraint.")));
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

      /**
       * This method adds an element to the set.
       * @method add
       * @memberof Set
       * @param {any Type} element the element to add to the set.
       * @exception {Error} throws an error if the element does not verify the belonging constraints.
       */
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

      /**
       * This method removes an element from the set.
       * @method remove
       * @memberof Set
       * @param {any Type} element The element to remove from the set.
       */
      remove: function(element) {
         delete this.l[element];
         this.updated('remove', element);
      },

      /**
       * This method calculates the cardinal (i.e the number of elements) of the set.
       * @method card
       * @memberof Set
       * @returns {integer} Returns the cardinal of the set.
       * @see Set#isEmpty
       */
      card: function() {
         var s=0;
         for(var i in this.l) {
            ++s;
         }
         return s;
      },

      /**
       * This method adds the elements of the set given in parameter to the set.
       * @method unionInPlace
       * @memberof Set
       * @param {Set} set The set with which the union is done.
       * @returns {Set} Returns the set itself.
       * @see Set#interInPlace
       * @see Set#minusInPlace
       * @see Set#union
       */

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

      /**
       * This method removes the elements of the set which are not in the set given in parameter.
       * @method interInPlace
       * @memberof Set
       * @param {Set} set The set with which the intersection is done.
       * @returns {Set} Returns the set itself.
       * @see Set#unionInPlace
       * @see Set#minusInPlace
       * @see Set#inter
       */

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

      /**
       * This method removes the elements of the set which are in the set given in parameter.
       * @method minusInPlace
       * @memberof Set
       * @param {Set} set The set with which the difference is done.
       * @returns {Set} Returns the set itself.
       * @see Set#interInPlace
       * @see Set#unionInPlace
       * @see Set#minus
       */
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

      /**
       * This method checks if the set is a subset of the set given in parameter.
       * @memberof Set
       * @method subsetOf
       * @param {Set} set The set which is tested to be the superset of the set.
       * @returns {Boolean} Returns true if the set is a subset of the set given in parameter, false otherwise.
       */
      subsetOf: function(set) {
         set = pkg.to_set(set);
         for(var i in this.l) {
            if(!set.contains(this.l[i])) {
               return false;
            }
         }
         return true;
      },

      /**
       * This method returns the symmetric difference of the set and the set given in parameter.
       * @memberof Set
       * @method symDiff
       * @param {Set} set The set with which the symmetric difference is done.
       * @returns {Set} Returns the result of the symmetric difference.
       * @see Set#minus
       * @see Set#union
       * @see Set#inter
       * @see Set#plus
       */
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


      /**
       * This method returns a new set, which contains elements of the set and element passed in argument.
       * @memberof Set
       * @method plus
       * @param {Any type} ... The elements to add to the set.
       * @returns {Set} Returns the newly formed set.
       * @see Set#minus
       * @see Set#union
       * @see Set#inter
       * @see Set#symDiff
       * @note The set isn't modified.
       */
      plus: function() {
         var r = new pkg.Set();
         r.unionInPlace(this);
         for(var i in arguments) {
            r.add(arguments[i]);
         }
         return r;
      },

      /**
       * This method calculates the powerset of the set.
       * @method powerset
       * @memberof Set
       * @returns {Set} Returns the powerset of the set.
       */
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

      /**
       * This method returns a list containing elements of the set.
       * @method getList
       * @memberof Set
       * @note the ordering of the created list isn't defined.
       * @returns {Array} Returns the list of the elements of the set.
       * @see Set#getSortedList
       */
      getList: function() {
         var r = [];
         for(var i in this.l) {
            r.push(this.l[i]);
         }
         return r;
      },

      /**
       * This method returns a sorted list containing elements of the set.
       * @method getSortedList
       * @memberof Set
       * @note the ordering of the created list is defined by the sort method of arrays.
       * @returns {Array} Returns the list of the elements of the set.
       * @see Set#getSortedList
       */
      getSortedList: function() {
         return this.getList().sort();
      },

      /**
       * This method returns a string representation of the set.
       * @method toString
       * @memberof Set
       * @note ATTENTION: This method is not stabilized yet. The string representation of the set is still to be defined.
       * @returns {string} Returns the string representation of the set.
       */
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

      /**
       * This method should be called whenever the set is modified.
       * @method updated
       * @private
       * @memberof Set
       * @param {string} event A string representing what modified the set (add, remove, ...).
       * @param {Any Type} object An object you want to attach to the event.
       */
      updated: function(event, object) {
         if(!this._blockEvents) {
            for(var i in this.listeners) {
               if(this.listeners[i].event === event || this.listeners[i].event === 'all') {
                  this.listeners[i].callback(event, object);
               }
            }
         }
      },

      /**
       * This method is to track modifications of the set (element removed, element added,...).
       * @method listen
       * @private
       * @memberof Set
       * @param {Function} callback Function which will be called when the given event was fired.
       * @param {string} event The event to track, or "all" to track all events.
       */
      listen: function(callback, event) {
         this.listeners.push({event:event,callback:callback});
      },

      /**
       * This method is to stop tracking modifications of the set.
       * @method release
       * @private
       * @memberof Set
       * @param {Function} callback Function which was called when the given event was fired.
       * @param {string} event The event which was tracked, or "all".
       */
      release: function(callback, event) {
         for(var i in this.listeners) {
            if(this.listeners[i].event === event && this.listeners[i].callback === callback) {
               this.listeners.splice(i, 1);
            }
         }
      },

      /**
       * This method is to iterate over all the elements of the set.
       * @method forEach
       * @memberof Set
       * @param {Function} callback Function which will be called on each element. This function will be called with one argument: the element of the current iteration.
       * @note To stop iterating at any time, throw an exception from within the function.
       */
      forEach: function(callback) {
         for(var i in this.l) {
            callback(this.l[i]);
         }
      },

      /**
       * This method is to set a type constraint on elements that will be added to the set.
       * @method setTypeConstraint
       * @memberof Set
       * @param {Any type} typeConstraint a string representation of a Javascript basic type, or a constructor of a Javascript class.
       * @note This function should always be called when the set is empty because it doesn't check the constraint on the current elements of the set.
       */
      setTypeConstraint: function(typeConstraint) {
         this.typeConstraint = typeConstraint;
      },

      /**
       * This method is to verify a property on each element of the set. If the function passed in argument returns true for all elements of the set, this method returns true; false otherwise.
       * @method every
       * @memberof Set
       * @param {Function} func Function which will be called on each element. This function should return true or false.
       * @note To stop iterating at any time, throw an exception from within the function, or return false. Iterating is stopped whenever all elements have been tested, or the callback function returns false.
       */
      every: function(func) {
         for(var i in this.l) {
            if(!func(this.l[i])) {
               return false;
            }
         }
         return true;
      },

      /**
       * This method returns a copy of the set.
       * @method copy
       * @memberof Set
      */
      copy : function() {
         return new pkg.Set(this);
      },

      /**
       * This method empties the set.
       * @method empty
       * @memberof Set
      */
      empty : function() {
         var l = this.getList();
         this._blockEvents = true;
         for(var i in l) {
            this.remove(l[i]);
         }
         this._blockEvents = false;
         this.updated('empty');
      },

      /**
       * This method tests whether the set is empty or not.
       * @method isEmpty
       * @memberof Set
       * @returns {Boolean} Returns true if the set is empty, false otherwise.
      */
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
      return to_set(set).contains(element);
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

   pkg.sym_diff = function(set1, set2) {
      return pkg.to_set(set1).symDiff(set2);
   }
   
   pkg.subset_of = function(set1, set2) {
      return pkg.to_set(set1).subsetOf(set2);
   }

   pkg.empty = function(set) {
      set.empty();
   };

   pkg.is_empty = function(set) {
      return set.isEmpty();
   };

   _("fr", "pkg.Set.checkConstraint(element): The element does not satisfies the type constraint.", "pkg.Set.checkConstraint(element) : L'élément ne satisfait pas la contrainte de type.");
})(this, this);