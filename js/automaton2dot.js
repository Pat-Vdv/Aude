/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

// NEEDS: automaton.js

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

(function(pkg) {
   "use strict";

   function toString(q) {
      return Set.prototype.elementToString(q);
   }

   function dotState(q) {
      var s = toString(q);
      return JSON.stringify(s).replace(/&/g, '&amp;') + "[id=\"" + btoa(s) + "\"]";
   }

   function catln() {
      var r = '';
      for(var i in arguments) {
         r += arguments[i];
      }

      return r + '\n';
   }

   function cat() {
      var r = '';
      for(var i in arguments) {
         r += arguments[i];
      }

      return r;
   }

   pkg.automaton2dot = function (A,title) {

      if(!title) {
         title = "automaton";
      }

      var initialState       = A.getInitialState(),
          AcceptingStates    = A.getFinalStates().getList(),
          NonAcceptingStates = minus(A.getStates(), AcceptingStates).getList(),
          q;

      if(initialState === null || initialState === undefined) {
         throw new Error("Automaton has no initial state.");
      }

      var res = catln("digraph ", JSON.stringify(title), " {\n\trankdir=LR\n\t_begin [style = invis];");

      if(A.isAcceptingState(initialState)) {
         res += catln("\n\tnode [shape = doublecircle];");
         res += catln("\t\t", dotState(initialState));
      }

      if(NonAcceptingStates.length || !A.isAcceptingState(initialState)) {
         res += catln("\n\tnode [shape = circle];");
         if(!A.isAcceptingState(initialState)) {
            res += catln("\t\t", dotState(initialState));
         }
         for(q in NonAcceptingStates) {
            if(NonAcceptingStates[q] !== initialState) {
               res += catln("\t\t", dotState(NonAcceptingStates[q]));
            }
         }
      }

      if(AcceptingStates.length) {
         res += catln("\n\tnode [shape = doublecircle];");
         for(q in AcceptingStates) {
            if(AcceptingStates[q] !== initialState) {
               res += catln("\t\t", dotState(AcceptingStates[q]));
            }
         }
      }

      res += "\n";

      var table = [];
      var transitions = A.getTransitions().getList();
      for(var tr in transitions) {
         var t = transitions[tr];
         table[t.startState] || (table[t.startState] = []);
         if(!table[t.startState][t.endState]) {
            table[t.startState][t.endState] = new Set();
         }
         table[t.startState][t.endState].add(t.symbol);
      }
      if(initialState === null || initialState === undefined) {
         throw new Error("Initial state is not set.");
      }
      res += cat("\t_begin -> ", JSON.stringify(toString(initialState).replace(/&/g, '&amp;')), " [label = \"\" arrowhead=vee id=initialStateArrow]\n");

      var states = A.getStates().getList(), startState, endState, trans;
      for (var sS in states) {
         startState = states[sS];
         if(table[startState]) {
            trans = table[startState];
            for(var eS in states) {
               if(trans[endState = states[eS]]) {
                  res += cat("\t", JSON.stringify(toString(startState)).replace(/&/g, '&amp;'), " -> ", JSON.stringify(toString(endState)).replace(/&/g, '&amp;'), " [label = ");

                  var symbols = table[startState][endState].getSortedList(),
                      comma   = "",
                      s       = "",
                      tmp     = "";

                  for(var symbol_index in symbols) {
                     s = toString(symbols[symbol_index]);
                     if(s.match(/[\s,"]/)) {
                        s = JSON.stringify(s);
                     }

                     tmp += cat(comma, s);
                     if(!comma.length) {
                        comma = ",";
                     }
                  }
                  res += JSON.stringify(tmp).replace(/&/g, '&amp;') + catln(", id=\"", btoa(toString(startState)), " ", btoa(toString(endState)), "\"]");
               }
            }
         }
      }

      return res + catln("}");
   };

})(window);
