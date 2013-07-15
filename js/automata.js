/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

/*
   Copyright (c) 2013, Raphaël Jakse (Université Joseph Fourier)
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
 * @file This is a class to manipulate automata in Javascript
 * @author Raphaël Jakse
 * @requires set.js
 * 
 */

(function(pkg, that) {
   "use strict";

   var _      = pkg.Automatal10n = that.libD && that.libD.l10n ? that.libD.l10n(): function(s){return s;},
       format = function(s, i){return s.replace("{0}", i)};

   /**
    * A class to manipulate automata in Javascript.

    * @class
    * @alias set
    */
   pkg.Automaton = function () {
      this.states = new Set();
      this.trans = new Set();
      this.trans.setTypeConstraint(pkg.Transition);
      this.finalStates = new Set();
      this.Sigma = new Set();
      this.currentStates = new Set();
      this.lastTakenTransitions = new Set();
      this.lastTakenTransitions.setTypeConstraint(pkg.Transition);
      this.q_init = null;
   };

   pkg.Automaton.prototype = {
      /**
       * This method adds a state to the automaton.
       * @method
       * @memberof Automaton
       * @param {any} state The state to add, can be of any type.
       * @param {boolean} [final] If given and true, the state will be a final (accepting) state.
       * @see addFinalState
       * @see addAcceptingState
       */
      addState: function (state, final) {
         this.states.add(state);
         if(final) {
            this.finalStates.add(state);
         }
      },

      /**
       * This method adds a final (accepting) state to the automaton. If the state is already there, makes it final
       * @method
       * @memberof Automaton
       * @param {any} state The state to add, can be of any type.
       */
      addFinalState: function(state) {
         this.addState(state, true);
      },

      /**
       * This method is an alias of the addFinalStateState method
       * @see Automaton#addFinalState
       */
      addAcceptingState: function(state) {
         this.addState(state, true);
      },

      /**
       * This method is an alias of the addFinalStateState method
       * @see Automaton#addFinalState
       */
      setFinalState: function(state) {
         this.addState(state, true);
      },

      /**
       * This method removes a state from the set of final states of the automaton
       * @method
       * @memberof Automaton
       * @param {any} state The state to add, can be of any type.
       */
      setNonFinalState: function(state) {
         this.finalStates.remove(state);
      },

      /**
       * This method is an alias of the addFinalStateState method
       * @method
       * @memberof Automaton
       * @see Automaton#addFinalState
       */
      setAcceptingState: function(state) {
         this.addState(state, true);
      },

      /**
       * This method is an alias of the setNonFinalState method
       * @method
       * @memberof Automaton
       * @see Automaton#setNonFinalState
       */
      setNonAcceptingState: function(state) {
         this.finalStates.remove(state);
      },

      /**
       * This method returns the set of non final (accepting) states of the automaton
       * @method
       * @memberof Automaton
       * @returns {Set} The set of non final states
       */
      getNonFinalStates: function() {
         return minus(a.getStates() - a.getFinalStates());
      },

      /**
       * This method is an alias of the getNonAcceptingStates method
       * @method
       * @memberof Automaton
       * @returns {Set} The set of non final states
       * @see Automaton#getNonAcceptingStates
       */
      getNonAcceptingStates: function() {
         return minus(a.getStates() - a.getFinalStates());
      },

      /**
       * This method returns the set of states of the automaton
       * @method
       * @memberof Automaton
       * @returns {Set} The set of non final states
       */
      getStates: function() {
         return this.states;
      },

      /**
       * This method sets the set of states of the automaton
       * @method
       * @memberof Automaton
       * @param {Set} states The set new set of states of the automaton
       */
      setStates: function(states) {
         if(states instanceof Set || states instanceof Array) {
            this.states = to_set(states);
         }
         else {
            throw(new Error(_('Automaton.setStates(): The given argument is not a set')));
         }
      },

      /**
       * This method returns the set of final (accepting) states of the automaton
       * @method
       * @memberof Automaton
       * @returns {Set} The set of final states of the automaton
       * @see Automaton#setFinalStates
       * @see Automaton#setFinalState
       */
      getFinalStates: function() {
         return this.finalStates;
      },

       /**
       * This method is an alias of the getFinalStates method
       * @method
       * @memberof Automaton
       * @returns {Set} The set of final states of the automaton
       * @see Automaton#getFinalStates
       */
      getAcceptingStates: function() {
         return this.finalStates;
      },

      /**
       * This method sets the set of final (accepting) states of the automaton. Every other state is set to non final.
       * @method
       * @memberof Automaton
       * @param {Set} states The new set of final states of the automaton
       * @see Automaton#getAcceptingStates
       */
      setFinalStates: function(states) {
         if(states instanceof Set || states instanceof Array) {
            this.finalStates = to_set(states);
         }
         else {
            throw(new Error(_('Automaton.setFinalStates(): The given argument is not a set')));
         }
      },

      /**
       * This method is an alias of the setFinalStates method
       * @method
       * @memberof Automaton
       * @see Automaton#setFinalStates
       */
      setAcceptingStates: function(states) {
         return this.setFinalState(states);
      },

      /**
       * This method sets the initial state of the automaton
       * @method
       * @memberof Automaton
       * @param {any} state The new initial state of the automaton
       * @see Automaton#getInitialState
       */
      setInitialState: function(state) {
         this.states.add(state);
         this.q_init = state;
         if(this.currentStates.isEmpty()) {
            this.currentStates.add(state);
         }
      },

      /**
       * This method returns the initial state of the automaton
       * @method
       * @memberof Automaton
       * @returns {any} The initial state of the automaton
       * @see Automaton#setInitialState
       */
      getInitialState: function() {
         return this.q_init;
      },

      /**
       * This method removes a state from the automaton
       * @method
       * @memberof Automaton
       * @param {any} the state to remove
       * @see addState
       */
      removeState: function (state) {
         this.states.remove(state);
         this.finalStates.remove(state);
      },

      /**
       * This method checks if the automaton has the state given in parameter
       * @method
       * @memberof Automaton
       * @param {any} state The state to check
       * @returns {boolean} Returns true if the states is in the automaton, false otherwise.
       */
      hasState: function(state) {
         return this.states.contains(state);
      },

      /**
       * This method checks if the state given in parameter is a final state of this automaton
       * @method
       * @memberof Automaton
       * @param {any} state The state to check
       * @returns {boolean} Returns true if the states is in the automaton, false otherwise.
       */
      isFinalState: function(state) {
         return this.finalStates.contains(state);
      },

       /**
       * This method is an alias of the isFinalState method
       * @method
       * @memberof Automaton
       * @returns {boolean} Returns true if the states is in the automaton, false otherwise.
       * @see Automaton#isFinalState
       */
      isAcceptingState: function(state) {
         return this.finalStates.contains(state);
      },

       /**
        * This method adds a transition to the automaton. It can takes one or three arguments: a Transition object, or a state, a symbol and a state. This method automatically adds states and symbols which have not yet been added to the automaton.
        * 
        * @example
        *   A = new Automaton();
        *   A.setInitialState(1);
        *   A.addFinalState(2);
        *   A.addTransition(1, 'a', 2);
        *   var t = new Transition(1, epsilon, 2);
        *   A.addTransition(t);
        * @see Automaton#removeTransition
        * @see Automaton#hasTransition
        * @see Automaton#getTransitions
        * @see Automaton#getTransitionsTable
        * @see Transition
        */
      addTransition: function(t) {
         if(arguments.length > 1) {
            return this.addTransition(new pkg.Transition(arguments[0], arguments[1], arguments[2]));
         }

         this.states.add(t.startState);
         this.states.add(t.endState);
         this.addSymbol(t.symbol);
         this.trans.add(t);
      },

      /**
       * This function removes a transition to the automaton. It can takes one or three arguments: a Transition object, or a state, a symbol and a state. Don't forget to remove states or symbol that should also be removed, if necessary; this method does not do that automatically.
       * 
       * @see Automaton#addTransition
       * @see Automaton#hasTransition
       * @see Automaton#getTransitions
       * @see Automaton#getTransitionsTable
       * @see Transition
       * @see Automaton#removeSymbol
       * @see Automaton#removeState
       */
      removeTransition: function(t) {
         if(arguments.length > 1) {
            return this.removeTransition(new pkg.Transition(arguments[0], arguments[1], arguments[2]));
         }

         this.trans.remove(t);
      },

       /**
        * This method checks if a transition exists in the automaton. It can takes one or three arguments: a Transition object, or a state, a symbol and a state.
        * 
        * @returns {boolean} Returns true if the transition exists, false otherwise
        * @see Automaton#addTransition
        * @see Automaton#removeTransition
        * @see Automaton#hasTransition
        * @see Automaton#getTransitions
        * @see Automaton#getTransitionsTable
        * @see Transition
        */
      hasTransition: function(t) {
         if(arguments.length > 1) {
            return this.hasTransition(new pkg.Transition(arguments[0], arguments[1], arguments[2]));
         }

         return this.trans.contains(t);
      },

      /**
       * This method returns the set of transitions of the automaton
       * @returns {Set} Returns the set of transitions of the Automaton
       * @see Automaton#addTransition
       * @see Automaton#removeTransition
       * @see Automaton#hasTransition
       * @see Automaton#getTransitionsTable
       * @see Transition
       */
      getTransitions: function() {
         return this.trans;
      },

      /**
       * This method returns the set of symbols of the Automaton.
       * @returns {Set} Returns the alphabet of the automaton
       * @see Automaton#addSymbol
       */
      getAlphabet: function() {
         return this.Sigma;
      },

      getTransitionsTable: function() {
         // In this loop, we build sets of accessible states by couple (state, symbol) in the list "table" 
         var table = {}, that = this, transition, transList = this.getTransitions().getList();
         this.states.forEach(function(state) {
            table[state] = {};
            that.Sigma.forEach(function (symbol) {
               table[state][symbol] = new Set();
            });
            table[state][pkg.epsilon] = new Set();
         });
         for(var t in transList) {
            transition = transList[t];
            table[transition.startState][transition.symbol].add(transition.endState);
         }
         return table;
      },

      setAlphabet: function(l) {
         this.Sigma = l;
      },

      addAlphabet: function(l) {
         this.Sigma.unionInPlace(l);
      },

      removeAlphabet: function(l) {
         this.Sigma.minusInPlace(l);
      },

      addSymbol: function(symbol) {
         if(symbol !== pkg.epsilon) {
            this.Sigma.add(symbol);
         }
      },

      hasSymbol: function(symbol) {
         return this.trans.contains(symbol);
      },

      removeSymbol: function(symbol) {
         this.trans.add(symbol);
      },

      toString: function() {
         return "Automaton(" + this.states.toString() + ", " + this.Sigma.toString() + ", " + this.q_init.toString() + ", " + this.trans.toString() + "," + this.finalStates.toString() + ")";
      },

      setCurrentState: function(state) {
         this.lastTakenTransitions.empty();
         if(this.states.contains(state)) {
            this.currentStates.interInPlace([state]);
            this.currentStatesAddAccessiblesByEpsilon();
         }
      },

      setCurrentStates: function(states) {
         this.lastTakenTransitions.empty();
         if(states.subsetOf(this.states)) {
            this.currentStates = new_set(states);
            this.currentStatesAddAccessiblesByEpsilon();
         }
      },

      addCurrentState: function(state) {
         if(this.states.contains(state)) {
            this.currentStates.add(state);
            this.currentStatesAddAccessiblesByEpsilon();
         }
      },
 
      removeCurrentState: function(state) {
         this.currentStates.remove(state);
      },

      removeCurrentStates: function(states) {
         this.currentStates.minusInPlace(states);
      },

      getCurrentStates: function() {
         return this.currentStates;
      },

      currentStatesAddAccessiblesByEpsilon: function(transitionsTable, visited) {
         if(!visited) {
            visited = new Set();
         }
         if(!transitionsTable) {
            transitionsTable = this.getTransitionsTable();
         }
         var cs   = this.currentStates.getList(),
             cont = false, // we continue if we added states
             that = this;

         function browseState(state) {
            if(!visited.contains(state)) {
               that.currentStates.add(state);
               that.lastTakenTransitions.add(new Transition(cs[i], pkg.epsilon, state));
               cont = true;
            }
         }

         for(var i in cs) {
            if(!visited.contains(cs[i])) {
               visited.add(cs[i]);
               transitionsTable[cs[i]][pkg.epsilon].forEach(browseState);
            }
         }
         if(cont) {
            this.currentStatesAddAccessiblesByEpsilon(transitionsTable, visited);
         }
      },
 
      runSymbol: function(symbol, transitionsTable, dontEraseTakenTransitions) {
         if(symbol === pkg.epsilon) {
            throw(new Error(_("Automaton.runSymbol(): epsilon is forbidden.")));
         }

         if(!this.Sigma.contains(symbol)) {
            this.lastTakenTransitions.empty();
            this.currentStates.empty();
            return false;
         }

         if(!transitionsTable) {
            transitionsTable = this.getTransitionsTable();
         }
         if(!dontEraseTakenTransitions) {
            this.lastTakenTransitions.empty();
         }

         var cs   = this.currentStates.getList(),
             that = this;

         function addState(state) {
            that.currentStates.add(state);
            that.lastTakenTransitions.add(new Transition(cs[i], symbol, state));
         }

         for(var i in cs) {
            this.currentStates.remove(cs[i]);
         }
         for(var i in cs) {
            transitionsTable[cs[i]][symbol].forEach(addState);
         }
         this.currentStatesAddAccessiblesByEpsilon(transitionsTable);
      },
 
      runWord: function(symbols) {
         var transitionsTable = this.getTransitionsTable();
         for(var i in symbols) {
            this.runSymbol(symbols[i], transitionsTable);
         }
      },

      acceptedWord: function(symbols) {
         this.setCurrentState(this.getInitialState());
         this.runWord(symbols);
         return !inter(this.currentStates, this.getFinalStates()).isEmpty();
      },
 
      getLastTakenTransitions: function() {
         return this.lastTakenTransitions;
      }
   };

   pkg.Transition = function (startState, symbol, endState) {
      this.startState = startState;
      this.symbol     = symbol;
      this.endState   = endState;
   };

   pkg.Transition.prototype = {
      toString: function() {
         return "Transition(" + JSON.stringify(this.startState) + ", " + JSON.stringify(this.symbol) + ", " + JSON.stringify(this.endState) + ")";
      }
   };

   pkg.new_automaton = function () {
      return new pkg.Automaton();
   };

   pkg.add_state = function (a, state, final) {
      return a.addState(state, final);
   };

   pkg.add_final_state = function (a, state) {
      return a.addFinalState(state);
   };

   pkg.remove_state = function (a, state) {
      return a.removeState(state);
   };

   pkg.has_state = function (a, state) {
      return a.hasState(state);
   };

   pkg.is_final_state = function (a, state) {
      return a.isFinalState(state);
   };

   pkg.add_transition = function (a, startState, symbol, endState) {
      if(arguments.length === 2 && (startState instanceof pkg.Transition)) {
         // add_transition(a, transition)
         a.addTransition(startState); // startState is a transition
      }
      else {
         a.addTransition(startState, symbol, endState);
      }
   };

   pkg.new_transition = function (startState, symbol, endState) {
      return new pkg.Transition(startState, symbol, endState);
   };

   pkg.remove_transition = function (a, startState, symbol, endState) {
      if(arguments.length === 2 && startState instanceof pkg.Transition) {
         a.removeTransition(startState); // startState is a transition
      }
      else {
         a.removeTransition(startState, symbol, endState);
      }
   };

   pkg.has_transition = function (a, startState, symbol, endState) {
      if(arguments.length === 2 && startState instanceof pkg.Transition) {
         return a.hasTransition(startState); // startState is a transition
      }
      else {
         return a.hasTransition(startState, symbol, endState);
      }
   };

   pkg.get_set_of_transitions = function (a) {
      return a.getTransitions();
   };

   pkg.get_list_of_transitions = function (a) {
      return a.getTransitions().getList();
   };

   pkg.get_alphabet = function (a) {
      return a.getAlphabet();
   };

   pkg.get_symbol_list = function (a) {
      return a.getAlphabet(a).getList();
   };

   pkg.get_sorted_symbol_list = function (a) {
      return a.getAlphabet(a).getList().sort();
   };

   pkg.set_alphabet = function (a, alphabet) {
      a.setAlphabet(to_set(alphabet));
   };

   pkg.remove_alphabet = function (a, alphabet) {
      a.removeAlphabet(to_set(alphabet));
   };

   pkg.add_symbol = function (a, symbol) {
      a.addSymbol(symbol);
   };

   pkg.remove_symbol = function (a, symbol) {
      a.removeSymbol(symbol);
   };

   pkg.has_symbol = function (a, symbol) {
      a.hasSymbol(symbol);
   };

   pkg.set_initial_state = function (a, state) {
      a.setInitialState(state);
   };

   pkg.get_initial_state = function (a) {
      return a.getInitialState();
   };

   pkg.get_set_of_states = function (a) {
      return a.getStates();
   };

   pkg.get_list_of_states = function (a) {
      return a.geStates().getList();
   };

   pkg.get_set_of_final_states = function (a) {
      return a.getFinalStates();
   };

   pkg.get_list_of_final_states = function (a) {
      return a.getFinalStates().getList();
   };

   pkg.get_set_of_non_accepting_states = function (a) {
      return a.getNonFinalStates();
   };

   pkg.get_list_of_non_accepting_states = function (a) {
      return a.getNonFinalStates().getList();
   };


   pkg.set_current_state= function(A, state) {
      A.setCurrentState(state);
   };

   pkg.set_current_states= function(A, states) {
      A.setCurrentStates(states);
   };

   pkg.add_current_state= function(A, state) {
      A.addCurrentState(state);
   };

   pkg.remove_current_states= function(A, state) {
      A.removeCurrentState(state);
   };

   pkg.remove_current_states= function(A, states) {
      A.removeCurrentStates(states);
   };

   pkg.get_current_states = function(A) {
      return A.currentStates;
   };

   pkg.get_current_states_list = function(A) {
      return A.currentStates.getList();
   };

   pkg.run_symbol = function(A, symbol) {
      return A.runSymbol(symbol);
   };

   pkg.run_word = function(A, symbols) {
      return A.runWord(symbols);
   };

   pkg.accepted_word = function(A, symbols) {
      return A.acceptedWord(symbols);
   };

   pkg.get_last_taken_transitions = function(A) {
      return A.lastTakenTransitions;
   };
      
   pkg.get_last_taken_transitions_list = function(A) {
      return A.lastTakenTransitions.getList();
   };
      
   // parses the code and returns an automaton from it
   pkg.read_automaton = function (code) {
      var lastIndex;
      function getNextValue(s, j, len) {
         while(j < len && !s[j].trim() || s[j] === ',') {
            ++j;
         }

         var j0 = j;
         if(s[j] === '"' || s[j] === "'") {
            var end = s[j++];
            while(j < len && s[j] !== end) {
               if(s[j] === '\\') {
                  ++j;
               }
               ++j;
            }
            lastIndex = j+1;
            return JSON.parse(s.substring(j0,j+1));
         }
         else if(s[j] === "{") {
            var set = new Set();
            ++j;
            var closed = false;
            while(j < len) {
               while(j < len && !s[j].trim() || s[j] === ',') {
                  ++j;
               }

               if(s[j] === '}') {
                  lastIndex = j+1;
                  closed = true;
                  break;
               }
               set.add(getNextValue(s, j, len));
               j = lastIndex;
            }
            if(!closed) {
               throw(new Error(format(_("read_automaton: Line {0} is malformed."), i+1)));
            }
            return set;
         }
         else if(s[j] === "(") {
            var tuple = new Tuple();
            ++j;
            var closed = false;
            while(j < len) {
               while(j < len && !s[j].trim() || s[j] === ',') {
                  ++j;
               }

               if(s[j] === ')') {
                  closed = true;
                  break;
               }

               tuple.addItem(getNextValue(s, j, len));
               lastIndex = j+1;
            }
            if(!closed) {
               throw(new Error(format(_("read_automaton: Line {0} is malformed."), i+1)));
            }
            return tuple;
         }
         else {
            while(j < len && s[j].trim() && ',})]'.indexOf(s[j]) === -1) {
               ++j;
            }
            lastIndex = j;
            return s.substring(j0,j).trim();
         }
      }

      var c = code.split("\n");
      var a = new pkg.Automaton();
      var i=1, len = c.length;
      a.setInitialState(getNextValue(c[0], 0, c[0].length));

      for(i=1; i < len && c[i].trim(); ++i) {
         a.addState(getNextValue(c[i], 0, c[i].length));
      }

      for(++i; i < len && c[i].trim(); ++i) {
         a.addFinalState(getNextValue(c[i], 0, c[i].length));
      }

      var startState, endState, symbol, j, leng;
      for(++i; i < len && c[i].trim(); ++i) {
         lastIndex = 0;
         leng = c[i].length;
         startState = getNextValue(c[i], lastIndex, leng);
         symbol = getNextValue(c[i], lastIndex, leng);
         if(symbol === '\\e') {
            symbol = pkg.epsilon;
         }
         j = lastIndex;
         endState = getNextValue(c[i], lastIndex, leng);

         a.addTransition(startState, symbol, endState);
      }
      return a;
   };

   // get the automaton code
   pkg.automaton_code = function (a) {
      var q_init = a.getInitialState();
      if(q_init === undefined || q_init === null) {
         return "";
      }
      var r = q_init.toString() + "\n";
      var F = a.getFinalStates();
      var Fl = F.getList();
      var Q = a.getStates().getSortedList();
      var T = a.getTransitions().getSortedList();
      var i;

      for(i in Q) {
         if(Q[i] !== q_init && !F.contains(Q[i])) {
            r += Q[i].toString() + "\n";
         }
      }
      r += "\n";

      for(i in Fl) {
         r += (Fl[i] || "null").toString() + "\n";
      }

      r += "\n";
      for(i in T) {
         r += (
                  (
                        (T[i].symbol) instanceof Set
                     || (T[i].startState) instanceof Tuple
                  )
                  ? T[i].startState.toString()
                  : JSON.stringify(T[i].startState.toString())
              ) +
              ' ' + (
                  (
                        (T[i].symbol) instanceof Set
                     || (T[i].symbol) instanceof Tuple
                  )
                  ? T[i].symbol.toString()
                  : JSON.stringify(T[i].symbol.toString())
              ) +
              ' ' + (
                  (
                        (T[i].endState) instanceof Set
                     || (T[i].endState) instanceof Tuple
                  )
                  ? T[i].endState
                  : T[i].endState.toString()
              ) + '\n';
      }
      return r + '\n';
   };

   //returns the list of symbols of a transition from its string representation
   pkg.parse_transition = function (text) {
      var symbols = [];
      var symbol, i = 0, len = text.length;

      while(i < len) {
         if(text[i] === ',') {
            if(symbol = text.substr(0,i).trim()) {
               symbols.push(symbol.trim());
            }
            ++i;
            text = text.substr(i);
            len -= i;
            i=0;
         }
         else if(text[i] === '"' || text[i] === "'") {
            var end = text[i++];
            while(i < len && text[i] !== end) {
               if(text[i] === '\\') {
                  ++i;
               }
               ++i;
            }
            ++i;
            symbols.push(text.substr(0,i).trim());
            text = text.substr(i);
            i = 0;
         }
         else {
            ++i;
         }
      }
      symbols.push(text);
      return symbols;
   };

   // from a transition's string representation, gives transition's string representation (transforms \e → ε)
   pkg.format_transition = function (trans) {
      var res = '';
      var symbols = pkg.parse_transition(trans);
      for(var i in symbols) {
         if(res) {
            res +=',';
         }
         if(symbols[i].trim() === '\\e') {
            res += 'ε';
         }
         else {
            res += symbols[i];
         }
      }
      return res;
   };

   pkg.epsilon = 'ε';
   _("fr", "Automaton.setStates(): The given argument is not a set", "Automaton.setStates() : L'argument donné n'est pas un ensemble");
   _("fr", "Automaton.setFinalStates(): The given argument is not a set", "Automaton.setFinalStates() : L'argument donné n'est pas un ensemble");
   _("fr", "Automaton.runSymbol(): epsilon is forbidden.", "Automaton.runSymbol(): epsilon est interdit.");
   _("fr", "read_automaton: Line {0} is malformed.", "read_automaton : La ligne {0} est mal formée.");

})(this, this);