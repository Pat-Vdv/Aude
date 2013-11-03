/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */


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


// NEEDS automata.js, set.js

(function(pkg, that) {
   "use strict";
   var _ = pkg.Audescriptl10n = that.libD && that.libD.l10n ? that.libD.l10n(): function(s){return s;};
   if(!pkg.Audescript) {
      pkg.Audescript = {};
   }

   // things needed to execute Audescript code.
   pkg.Audescript.StopIteration = {};
   pkg.Audescript.ReturnValue = function(v) {
      this.v = v;
   };
   pkg.Audescript.ThrowValue = function(v) {
      this.v = v;
   };

   var letDeclarationSupported      = false,
       arrowFunctionSupported       = false,
       letExpressionSupported       = false,
       IterationsSupported          = false,
       constSupported               = false,
       abbreviatedFunctionSupported = false,
       destructuringSupported       = false;

   try {
      arrowFunctionSupported = eval("(x => true)()");
   }
   catch(e){}

   if(typeof Packages !== "object" || String(Packages) !== "[JavaPackage ]") {
      // disable this feature detection in rhino as it crashes it
      try {
         abbreviatedFunctionSupported = eval("(function() true)()");
      }
      catch(e){}
   }

   try {
     letExpressionSupported  = eval('(function(){var a=1, t; let (a=2){if(a === 2){t = true}}; return t && a === 1;})();');
   }
   catch(e){}

   try {
     letDeclarationSupported = eval('(function(){var a=1, t; if(true){let a = 2;t = a === 2} return t && a === 1;})();');
   }
   catch(e){}

   try {
      constSupported         = eval("(function(){const a=1; try{a=2;}catch(e){return true;} return false;})();");
   }
   catch(e) {
      if(e instanceof TypeError) {
         constSupported = true;
      }
   }

   try {
      IterationsSupported    = eval("(function(){for(let i of [1,2]){} return true;})()");
   }
   catch(e){}
   try {
      destructuringSupported = eval("(function(){var [a,b,c] = [1,2,3]; return a === 1 && b === 2 && c === 3})()");
   }
   catch(e){}
   
   try { // eval to allow parsing of the file even in browsers not supporting yield.
      eval('\
         Object.defineProperty(Object.prototype, "iterator", {\
            enumerable:false,\
            writable: true,\
            configurable:true,\
            value: function() {\
               for(var i in this) {\
                  if(this.hasOwnProperty(i)) {\
                     yield this[i];\
                  }\
               }\
               return;\
            }\
         });\
      ');
   }
   catch(e){}

   function destructNext(s, i, end, dontCheck) {
      while(!s[i].trim()) {
         ++i;
      }
      if(!dontCheck) {
         if(s[i] === ',') {
            return i+1;
         }
         else if(s[i] !== ',' && s[i] !== end) {
            throw new Error("Malformed destructing string");
         }
      }
      return i;
   }

   function destructArray(e, destructStr, res, i) {
      ++i;
      var k = 0;
      while(destructStr[i] !== ']') {
         i = destructNext(destructStr, i, '', true);
         if(destructStr[i] !== ',') {
            i = pkg.Audescript.destruct((e || [])[k], destructStr, res, true, i);
         }
         i = destructNext(destructStr, i, ']');
         ++k;
      }
      if(destructStr[i] !== ']') {
         throw new Error("Malformed destructing string");
      }
      return i+1;
   }

   function destructObject(e, destructStr, res, i) {
      ++i;
      var key,end,start;
      while(destructStr[i] !== '}') {
         i = destructNext(destructStr, i, '', true);
         if(destructStr[i] === '"' || destructStr[i] === "'") {
            end = destructStr[i];
            start = i++;
            while(destructStr[i] && destructStr[i] !== end) {
               if(destructStr[i] === '\\') {
                  ++i;
               }
               ++i;
            }
            if(!destructStr[i]) {
               throw new Error("Malformed destructing string");
            }
            key = eval(destructStr.substring(start, ++i));
         }
         else {
            start = i;
            while(destructStr[i] !== ':' && destructStr[i].trim()) {
               ++i;
            }
            key = destructStr.substring(start, i);
         }
         i = destructNext(destructStr, i, '', true);
         if(destructStr[i] !== ':') {
            throw new Error("Malformed destructing string");
         }
         ++i;
         i = destructNext(destructStr, i, '', true);
         i = pkg.Audescript.destruct((e || {})[key], destructStr, res, true, i);
         i = destructNext(destructStr, i, '}');
      }
      if(destructStr[i] !== '}') {
         throw new Error("Malformed destructing string");
      }
      return i+1;
   }

   function destructToJS(variable, newVal, listOfVals, constraintedVariables) {
      if(!listOfVals) {
         var listOfVals = [];
         pkg.Audescript.destruct(null, variable, listOfVals);
      }
      var resToString = "'" + variable.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\\n") + "'";
      var ret = '(function(){Audescript.des=Audescript.destruct(' + newVal + ',' + resToString + ');';
      for(var index in listOfVals) {
         if(listOfVals.hasOwnProperty(index)) {
            if(constraintedVariables.consts.contains(listOfVals[index])) {
               ret += constError(listOfVals[index]) + ';';
            }
            else if(constraintedVariables.type.contains(listOfVals[index])) {
               ret += listOfVals[index] + '=Audescript.as(' + listOfVals[index] + ', Audescript.des.' + listOfVals[index] + ');';
            }
            else {
               ret += listOfVals[index] + '=Audescript.des.' + listOfVals[index] + ';';
            }
         }
      }
      return ret + 'Audescript.des=null;})()';
   }

   pkg.Audescript.destruct = function (e, destructStr, res, returnCurrentIndex, i) {
      if(!res) {
         res = {};
      }

      i = destructNext(destructStr, i || 0, '', true);

      if(destructStr[i] === '[') {
         i = destructArray(e, destructStr, res, i);
      }
      else if(destructStr[i] === '{') {
         i = destructObject(e, destructStr, res, i);
      }
      else {
         var j = i++;
         while(destructStr[i] && ",]}".indexOf(destructStr[i]) === -1) {
            ++i;
         }
         if(res instanceof Array) {
            res.push(destructStr.substring(j, i));
         }
         else {
            res[destructStr.substring(j, i)] = e;
         }
      }

      if(returnCurrentIndex) {
         return i;
      }
      return res;
   }

   function tuples_eq(t1, t2) {
      if(t1.length !== t2.length) {
         return false;
      }

      for(var i=0; i < t1.length; ++i) {
         if(!pkg.Audescript.eq(t1[i], t2[i])) {
            return false;
         }
      }
      return true;
   }

   // checks "real" equality between v1 and v2
   pkg.Audescript.eq = function(v1, v2) {
      if(v1 instanceof Tuple && v1.length === 1) {
         return pkg.Audescript.eq(v2, v1[0]);
      }
      return v1 == v2 || (
            typeof v1 === typeof v2
         && (v1 instanceof Set && v2 instanceof Set
            ? v1.card() === v2.card() && !minus(v1, v2).card()
            : (v1 instanceof Transition && v2 instanceof Transition
               ?     pkg.Audescript.eq(v1.symbol, v2.symbol)
                  && pkg.Audescript.eq(v1.startState, v2.startState)
                  && pkg.Audescript.eq(v1.endState, v2.endState)
               : (v1 instanceof Automaton && v2 instanceof Automaton
                  ?     pkg.Audescript.eq(v1.states, v2.states)
                     && pkg.Audescript.eq(v1.finalStates, v2.finalStates)
                     && pkg.Audescript.eq(v1.trans, v2.trans)
                     && pkg.Audescript.eq(v1.q_init, v2.q_init)
                  : (v1 instanceof Tuple && v2 instanceof Tuple)
                     ? tuples_eq(v1, v2)
                     : JSON.stringify(v1) === JSON.stringify(v2)
               )
            )
         )
      );
   };

   // checks if value can be assigned to variable and return the right value. integerCheck enforce value being an integer.
   pkg.Audescript.as = function(variable, value, integerCheck) {
      if(variable instanceof Set && value instanceof Set) {
         if(!variable.typeConstraint  || variable.typeConstraint === value.constraintType) {
            return value;
         }
         else {
            var newVal = new Set();
            newVal.setTypeConstraint(variable.typeConstraint);
            newVal.unionInPlace(value);
            return value;
         }
      }

      if(value !== null && value !== undefined && variable !== null && value !== undefined) {
         if(typeof value !== typeof variable && value.constructor !== variable.constructor) {
            throw new Error(_("Assignation Error: types of the value and the variable don’t match."));
         }
         return integerCheck ? (value > 0 ? Math.floor(value) : Math.ceil(value)) : value;
      }
      if(value !== variable) {
         throw new Error(_("Assignation Error: types of the value and the variable don’t match."));
      }
      return value;
   };

   Object.defineProperty(Object.prototype, 'forEach', {
      enumerable:false,
      writable: true,
      value: function(callback) {
         for(var i in this) {
            if(this.hasOwnProperty(i)) {
               callback(this[i]);
            }
         }
      }
   });

   var s, i, len, type, lastSignificantType, includes;
   var string          = 2,
       whitespace      = 4,
       variable        = 8,
       dot             = 16,
       regEx           = 32,
       number          = 64,
       operator        = 128,
       comma_semicolon = 256,
       closeParen      = 1024,
       closeCurly      = 2048,
       openBracket     = 4096,
       instruction     = 8192,
       closeBracket    = 16384,
       end             = 0;

   function copy(constraintedVariables) {
      return {type:constraintedVariables.type.copy(), consts:constraintedVariables.consts.copy()};
   }

   function parseUnsignedNumber() {
      var dotEncountered = false, d = i;
      if(i < len && s[i] === '0') {
         ++i;
         if(i < len && s[i] === 'x' || s[i] === 'X') {
            do {
               ++i;
            } while('0123456789ABCDEF'.indexOf(s[i].toUpperCase()) !== -1);
            return s.substring(d, i);
         }
      }

      while(i < len && ('0123456789'.indexOf(s[i]) !== -1 || (!dotEncountered && s[i] === '.'))) {
         if(!dotEncountered) {
            dotEncountered =  s[i] === '.';
         }
         ++i;
      }
      // TODO: checking if the number is correct (e.g: doesn't end with a dot)
      if(i < len && s[i] === 'e' || s[i] === 'E') {
         ++i;
         if(i < len && s[i] === '+' || s[i] === '-') {
            ++i;
         }
      }
      while(i < len && '0123456789'.indexOf(s[i]) !== -1) {
         ++i;
      }
      type = lastSignificantType = number;
      return s.substring(d,i);
   }

   function getSymbol() {
      if(i >= len) {
         lastSignificantType = type = end;
         return '';
      }
      if(s[i] === ")") {
         lastSignificantType = type = closeParen;
         return s[i++];
      }
      else if(s[i] === "]") {
         lastSignificantType = type = closeBracket;
         return s[i++];
      }
      else if(s[i] === "}") {
         lastSignificantType = type = closeCurly;
         return s[i++];
      }
      else if('{[('.indexOf(s[i]) !== -1) {
         lastSignificantType = type = openBracket;
         return s[i++];
      }
      else if(s[i] === '"' || s[i] === "'") {
         var d = i;
         var endChar = s[i++];
         while(i < len && s[i] !== endChar) {
            if(s[i] === '\\') {
               ++i;
            }
            ++i;
         }
         lastSignificantType = type = string;
         return s.substring(d,++i);
      }
      else if(!(s[i].trim())) {
         var deb = i++;
         while(i < len && !(s[i].trim())) {
            ++i;
         }
         type = whitespace;
         var d   = i,
             lst = lastSignificantType;
         getSymbol();
         if(type !== whitespace) {
            i = d;
            lastSignificantType = lst;
            type = whitespace;
         }

         return s.substring(deb,i);
      }
      else if(s[i] === '.') {
         if(i+1 < len && '0123456789'.indexOf(s[i+1]) !== -1) {
            lastSignificantType = type = number;
            return parseUnsignedNumber();
         }
         lastSignificantType = type = dot;
         ++i;
         return '.';
      }
      else if(type !== variable &&  '0123456789'.indexOf(s[i]) !== -1) {
         lastSignificantType = type = number;
         return parseUnsignedNumber();
      }
      else if("*=!%<>&|?:^+-~\\".indexOf(s[i]) !== -1) { //TODO : simplify this bunch of crappy code
         lastSignificantType = type = operator;
         if(s[i] === '+') {
            ++i;
            if(s[i] === '+' || s[i] === '=') {
               return "+" + s[i++];
            }
            return "+";
         }
         if(s[i] === '-') {
            ++i;
            if(s[i] === '-' || s[i] === '=') {
               return "-" + s[i++];
            }
            return "-";
         }
         if(s[i] === '=') {
            ++i;
            if(s[i] === '=') {
               ++i;
               if(s[i] === '=') {
                  ++i;
                  return '===';
               }
               return '==';
            }
            else if(s[i] === '>') {
               ++i;
               return '=>';
            }
            return '=';
         }
         if(s[i] === '<') {
            ++i;
            if(s[i] === '=') {
               ++i;
               return '<=';
            }
            else if(s[i] === '<') {
               ++i;
               if(s[i] === '<') {
                  ++i;
                  return '<<<';
               }
               else if(s[i] === '=') {
                  ++i;
                  return '<<=';
               }
               return '<<';
            }
            return '<';
         }
         else if(s[i] === '>') {
            ++i;
            if(s[i] === '=') {
               ++i;
               return '>=';
            }
            else if(s[i] === '>') {
               ++i;
               if(s[i] === '>') {
                  ++i;
                  if(s[i] === '=') {
                     ++i;
                     return '>>>=';
                  }
                  return '>>>';
               }
               else if(s[i] === '=') {
                  ++i;
                  return '>>=';
               }
               return '>>';
            }
            return '>';
         }
         else if(s[i] === '!') {
            ++i;
            var deb = i,
                symbol = getSymbol().toLowerCase();
            if(symbol === 'contains' || symbol === 'subsetof' || symbol === 'elementof' || symbol === 'belongsto') {
               return '!' + symbol;
            }
            i = deb;
            lastSignificantType = type = operator;
            if(s[i] === '=') {
               ++i;
               if(s[i] === '=') {
                  ++i;
                  return '!==';
               }
               return '!=';
            }
            return '!';
         }
         else if('&|*%^'.indexOf(s[i]) !== -1) {
            var c = s[i];
            ++i;
            if(s[i] === '=') {
               ++i;
               return c + '=';
            }
            return c;
         }
         return s[i++];
      }
      else if(s[i] === '/') {
         var d = i++, deb;
         if(i < len && s[i] === '/') {
            do {
               ++i;
            } while(i < len && s[i] !== '\n');
            type = whitespace;
            deb = i;
            getSymbol();
            if(type !== whitespace) {
               i = deb;
               type = whitespace;
            }
         }
         else if(i < len && s[i] === '*') {
            do {
               ++i;
            } while(i+1 < len && !(s[i] === '*' && s[i+1] === '/'));
            i+=2;
            type = whitespace;
            deb = i;
            var lst = lastSignificantType;
            getSymbol();
            if(type !== whitespace) {
               i = deb;
               lastSignificantType = lst;
               type = whitespace;
            }
        }
         else {
            if(lastSignificantType & (number | variable | closeParen | closeBracket)) {
               lastSignificantType = type = operator;
               if(s[i] === '=') {
                  ++i;
                  return '/=';
               }
               return '/';
            }
            else {
               while(i < len && s[i] !== '/') {
                  if(s[i] === '\\') {
                     ++i;
                  }
                  ++i;
               }
               ++i;
               while(i < len && 'azertyuiopqsdfghjklmwxcvbn'.indexOf(s[i].toLowerCase()) !== -1) {
                  ++i;
               }
               lastSignificantType = type = regEx;
            }
         }
         return s.substring(d,i);
      }
      else if(s[i] === ',' || s[i] === ';') {
         lastSignificantType = type = comma_semicolon;
         return s[i++];
      }
      else {
         var d = i++;
         type = variable;
         var bufferSymbol = getSymbol();
         if(type === variable || type === instruction) {
            var v = s[d] + bufferSymbol;
            if(v === "var" || v === "new" || v === "delete" || v === "return" || v === "throw" || v === "break" || v === "continue" || v === 'in' || v === 'if' || v === 'else' || v === 'do' || v === 'while' || v === 'function' || v === 'instanceof' || v === 'typeof' || v === 'include' || v === 'let' || v === 'const' || v === 'try' || v === 'catch' || v === 'finally') {
               lastSignificantType = type = instruction;
            }
            return v;
         }
         else {
            i = d;
            lastSignificantType = type = variable;
            return s[i++];
         }
      }
   }

   function foreachReplacements(symbol, inForeach, constraintedVariables) {
      if(symbol === "break") {
         return "throw Audescript.StopIteration";
      }
      else if(symbol === "return" || symbol === "throw") {
         var d = i;
         var s = getSymbol();
         if(type === whitespace) {
            if(s.indexOf('\n') !== -1) {
               i = d;
               if(symbol === 'throw') {
                  return 'throw'; // Syntax error
               }
               else {
                  return "throw new Audescript.ReturnValue(undefined)";
               }
            }
            s = getSymbol();
         }
         i = d;
         if(s === ';') {
            if(symbol === 'throw') {
               return "throw"; // Syntax error
            }
            else {
               return "throw new Audescript.ReturnValue(undefined)";
            }
         }
         if(symbol === "throw") {
            return "throw new Audescript.ThrowValue(" + getExpression({inForeach:inForeach, value:true, constraintedVariables:constraintedVariables}) + ")";
         }
         else {
            return "throw new Audescript.ReturnValue(" + getExpression({inForeach:inForeach, value:true, constraintedVariables:constraintedVariables}) + ")";
         }
      }
      else if(symbol === "continue") {
         return "return";
      }
      return symbol;
   }

   function getConstraintString() {
      var deb = i;
      var symbol = getSymbol(), tmp = '';
      if(type === whitespace) {
         if(symbol !== ' ') {
            tmp = symbol;
         }
         symbol = getSymbol();
      }
      if(type & (variable | string)) {
         if(type === string) {
            try {
               var typeConstraint = JSON.parse(symbol);
               if(typeConstraint === 'float' || typeConstraint === 'double') {
                  symbol = '"number"';
               }
            }
            catch(e) {
               i = deb;
               return '';
            }
         }
         else {
            var lowerType = symbol.toLowerCase();
            if(lowerType === "integer" || lowerType === "int") {
               symbol = '"integer"';
            }
            else if(lowerType === "number" || lowerType === "float") {
               symbol = '"number"';
            }
            else if(lowerType === "list" || lowerType === "array") {
               symbol = "Array";
            }
            else if(lowerType === 'automata') {
               symbol = 'Automata';
            }
            else if(lowerType === 'set') {
               symbol = 'Set';
            }
            else if(lowerType === "bool" || lowerType === "boolean" ||  lowerType === "string" || lowerType === "object" || lowerType === "undefined") {
               symbol = '"' + lowerType + '"';
            }
            else if(lowerType === 'function') {
               symbol = '"function"';
            }
            else if(lowerType === 'state') {
               symbol = 'null'; // FIXME: no constraint for states
            }
         }
         return tmp + symbol;
      }
      else {
         i = deb;
         return '';
      }
   }
   
   function constError(variable) {
      return '(function(){throw new Error("TypeError: ' + variable + ' is read-only");})()';
   }
   
   function functionBody(s) {
      if(!abbreviatedFunctionSupported && s.trim()[0] !== '{') {
         return '{return ' + s + '}';
      }
      return s;
   }

   function getWhite() {
      var d = i,
          t = type,
          l = lastSignificantType,
          s = getSymbol();
             
      if(type === whitespace) {
         return s;
      }
      i = d;
      type = t;
      lastSignificantType = l;
      return '';
   }
   function getExpression(options) {
      var deb          = i,
          res          = getWhite(),
          symbol       = getSymbol(),
          oldType      = lastSignificantType,
          endSymbols   = options.endSymbols || {},
          value        = options.value || options.onlyOneValue,
          inForeach    = options.inForeach,
          onlyOneValue = options.onlyOneValue,
          constraintedVariables = options.constraintedVariables;


      if(endSymbols.hasOwnProperty(symbol)) {
         i = deb;
         return '';
      }

      if(")]}".indexOf(symbol) !== -1) {
         i = deb;
         return '';
      }
      if(symbol === '{') {
         deb = i;
         var pres = '', obj = false, oneVal = true;
         if(!options.noset_obj) {
            do {
               if(pres) {
                  pres += ',';
                  oneVal = false;
               }
               pres += getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables}) + getWhite();
               symbol = getSymbol();

               if(symbol === ':') {
                  obj = true;
                  pres += symbol + getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables}) + getWhite();
                  symbol = getSymbol();
               }

            } while(symbol === ',');
         }
         if(!options.noset_obj && symbol === '}' && !s.substring(deb-1, i).match(/^\{[\s]*\}$/)) {
            if(obj || (options.noValue && oneVal)) {
               res += '{' + pres + '}';
            }
            else {
               res += 'to_set([' + pres + '])';
            }
         }
         else {
            i = deb;
            lastSignificantType = type = openBracket;
            pres = toPureJS({'}':true}, inForeach, copy(constraintedVariables));
            res += '{' + pres  + getSymbol(); // '}'
         }
      }
      else if(symbol === '[') {
         var pres = getExpression({inForeach:inForeach,commaAllowed:true,constraintedVariables:constraintedVariables, endSymbols:{']':true}});
         res += '[' + pres + getSymbol(); // ']'
      }
      else if(symbol === '(') {
         if(options.inForParenthesis) {
            var iter = '', comp = '', decl = getExpression({inForeach:false,constraintedVariables:constraintedVariables}) + getWhite();
            if(decl) {
               comp = getExpression({inForeach:false,constraintedVariables:constraintedVariables}) + getWhite();
               if(comp) {
                  // we allow the comma operator here in this specific context (iteration part of the for loop)
                  iter = getExpression({inForeach:false,commaAllowed:true,constraintedVariables:constraintedVariables}) + getWhite();
               }
            }
            if(getSymbol() === ')') {
               return res + '(' + decl + comp + iter + ')';
            }
            else {
               i = deb;
               lastSignificantType = oldType;
               return '';
            }
         }
         else {
            var pres = toPureJS({')':true}, inForeach,constraintedVariables);
            res += '(' + pres + getSymbol(); // ')'

//             var pres = getExpression({inForeach:inForeach,commaAllowed:!options.blockComma,constraintedVariables:constraintedVariables, endSymbols:{')':true}});
//             res += '(' + pres + getSymbol(); // ')'
         }
      }
      else if(symbol === ';') {
         if(value) {
            --i;
            return res;
         }
         return res + symbol;
      }
      else if(symbol === ',') {
         if(!options.commaAllowed) {
            --i;
            return res;
         }
         return res + symbol + getExpression({inForeach:inForeach,value:value,commaAllowed:true,endSymbols:endSymbols,constraintedVariables:constraintedVariables});
      }
      else if(symbol === 'foreach') {
         if(value) {
            --i;
            return res;
         }
         return res + parseForeach(inForeach, symbol, constraintedVariables);
      }
      else if(inForeach && (symbol === "break" || symbol === "continue" || symbol === "throw" || symbol === "return")) {
         if(value) {
            i = deb;
            return '';
         }
         return res + foreachReplacements(symbol, inForeach, constraintedVariables);
      }
      else if(symbol === 'if' || symbol === 'while' || symbol === 'for' || symbol === 'function' || symbol === 'switch' || symbol === 'try' || symbol === 'catch' || symbol === 'finally') {
         var tmp;
         if(symbol === 'function' || symbol === 'catch') {
            if(symbol === 'function') {
               var d = i;
               var functionName = getWhite() + getSymbol();

               if(lastSignificantType === variable) {
                  if(value) {
                     i = deb;
                     return '';
                  }
                  return res + symbol + functionName + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + functionBody(getExpression({inForeach:false,constraintedVariables:copy(constraintedVariables), noset_obj:true}));
               }

               i = d;
               lastSignificantType = type = instruction;
            }
            return res + symbol + getExpression({inForeach:false,constraintedVariables:constraintedVariables}) + functionBody(getExpression({inForeach:false,constraintedVariables:copy(constraintedVariables),noset_obj:true}));

         }
         else if(value) {
            i = deb;
            return '';
         }
         else if(symbol === 'try' || symbol === 'finally') {
            return res + symbol + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables),noset_obj:true});
         }
         else if(symbol === 'for' && !IterationsSupported && 'for' !== (tmp = parseForeach(inForeach, symbol, constraintedVariables))) {
            return res + tmp;
         }
         return res + symbol + getExpression({inForeach:false,inForParenthesis:symbol === 'for',blockComma:true,constraintedVariables:constraintedVariables}) + getExpression({inForeach:(symbol === 'while' || symbol === 'for' || symbol === 'switch') ? false : inForeach,constraintedVariables:copy(constraintedVariables),noValue:true});
      }
      else if(symbol === 'do') {
         if(value) {
            i = deb;
            return '';
         }
         res += symbol + getExpression({inForeach:false,constraintedVariables:copy(constraintedVariables),noValue:true}) + getWhite();
         var symbol2 = getSymbol();
         var d = i;
         if(symbol2 === 'while') {
            return res + symbol2 + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)});
         }
         i = d;
         return res;
      }
      else if(symbol === 'else') {
         if(value) {
            i = deb;
            return '';
         }
         return res + symbol + getExpression({inForeach:inForeach,noValue:true,constraintedVariables:copy(constraintedVariables)});
      }
      else if(symbol === 'emptySet') {
         res += getWhite() + 'new Set(';
         var deb = i;
         symbol = getSymbol();
         if(symbol === '(') {
            var constraint = getConstraintString();
            if(constraint) {
               if(getSymbol() === ')') {
                  res += '{typeConstraint:' + constraint + '}';
               }
               else {
                  i = deb;
               }
            }
            else if(getSymbol() !== ')') {
               i = deb;
            }
         }
         else {
            i = deb;
         }
         res += ')';
      }
      else if(symbol === 'include') {
         res += getWhite();
         symbol = getSymbol();

         includes.push(symbol);
         res += getWhite();
         deb = i;
         symbol = getSymbol();
         if(symbol === ';') {
            return res + getWhite();
         }
         i = deb;
         return res;
      }
      else if(type === instruction) {
         if(symbol === 'new' || (!value && symbol === 'delete') || symbol === 'typeof') {
            res += symbol + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables});
         }
         else if(value) {
            i = deb;
            return '';
         }
         else if(symbol === 'const' || symbol === 'let' || symbol === 'var') {
            if(symbol === 'let') {
               var d = i;
               pres += getWhite();
               symbol = getSymbol();
               i = d;
               if(symbol === '(') {
                  if(letExpressionSupported) {
                     return res + 'let' + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)});
                  }
                  else {
                     return res + '(function(){var ' + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}).replace(/^([\s]*)\(([\s\S]+)\)([\s]*)$/, '$1$2$3') + ';' + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)}) + '})()';
                  }
               }
               symbol = 'let'; // regulat let, handling just after this.
            }

            var semicolonExpected = false, d, oldType, vars, decl = '', keyword, value, addToConsts = symbol === 'const' && !constSupported;
            if(addToConsts || symbol === 'let') {
               keyword = letDeclarationSupported ? 'let' : 'var';
            }
            else {
               keyword = symbol;
            }
            do {
               vars = getWhite() + getExpression({onlyOneValue:true, constraintedVariables:constraintedVariables}) + getWhite();
               d = i;
               oldType = lastSignificantType;
               symbol = getSymbol();
               if(symbol === '=') {
                  value = getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables, onlyOneValue:true});
                  d = i;
                  oldType = lastSignificantType;
                  symbol = getSymbol();
               }
               else {
                  value = '';
               }
               if(!destructuringSupported && value && '[{'.indexOf(vars.trim()[0]) !== -1) {
                  // destructuring
                  var listOfVals = [];
                  Audescript.destruct(null, vars, listOfVals);
                  if(decl) {
                     res += (semicolonExpected ? ';' : '') + decl + ';';
                     decl = '';
                  }
                  res += keyword + ' ' + listOfVals.toString() + ';' + destructToJS(vars, value, listOfVals, constraintedVariables) + getWhite();
                  semicolonExpected = true;
                  if(addToConsts) {
                     for(var index in listOfVals) {
                        if(listOfVals.hasOwnProperty(index)) {
                           constraintedVariables.consts.add(listOfVals[index]);
                        }
                     }
                  }
               }
               else if(decl) {
                  decl += ',' + vars + (value ? '=' + value : '') + getWhite();
               }
               else {
                  decl = keyword + (vars[0].trim() ? ' ' : '') + vars + (value? '=' + value : '') + getWhite();
               }
            }
            while(symbol === ',');
            if(symbol === ';') {
               return res + (semicolonExpected ? ';' : '') + decl + ';';
            }
            i = d;
            lastSignificantType = oldType;
            return res + (semicolonExpected ? ';' : '') + decl;
         }
         else { // unknown instruction
            i = deb;
            return '';
         }
      }
      else if(symbol === '!') {
         return res + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables, value:value, onlyOneValue:onlyOneValue});
      }
      else {
         res += symbol; // ?? (string, number, litteral, ... ?)
      }

      var white;
      while(1) {
         oldType = lastSignificantType;
         white = getWhite();
         deb = i;
         symbol = getSymbol();

         if(endSymbols.hasOwnProperty(symbol)) {
            i = deb;
            lastSignificantType = oldType;
            return res + white;
         }

         if(type === dot) {
            var symbol2 = getWhite() + getSymbol();

            if(type !== variable) {// Syntax error ?
               return res + white + '.' + symbol2;
            }
            res += white + '.' + symbol2;
         }
         else if(symbol === '?') {
            if(onlyOneValue) {
               i = deb;
               lastSignificantType = oldType;
               return res + white;
            }

            var pres = getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables});
            res += white + '?' + pres + getSymbol() /* ':' */ + getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables});
         }
         else if(symbol === '=>'  && (oldType & (variable | closeParen))) {
            ++i;
            var expr = getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)});
            if(arrowFunctionSupported) {
               res += '=>' + expr;
            }
            else {
               res = 'function' +
                     (oldType === closeParen ? res : '(' + res + ')') +
                     (expr.trim()[0] === '{' ? expr : '{return ' + expr + '}');
            }
         }
         else if(symbol === '[') {
            res += white + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + getSymbol(); // symbol should be ']'
         }
         else if(symbol === '(') {
            res += white + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables,commaAllowed:true}) + getSymbol(); // symbol should be ')'
         }
         else if(symbol === ',') {
            if(!options.commaAllowed) {
               --i;
               lastSignificantType = oldType;
               return res + white;
            }
            return res + white + symbol + getExpression({inForeach:inForeach,value:value,commaAllowed:true,endSymbols:endSymbols,constraintedVariables:constraintedVariables});
         }
         else if(symbol === ';') {
            if(value) {
               --i;
               lastSignificantType = oldType;
               return res + white;
            }
            return res + white + symbol + getWhite();
         }
         else if(symbol === ':') {
            if(value) {
               --i;
               lastSignificantType = oldType;
               return res + white;
            }

            var matches = [], d=i;
            if(matches = /([\s]*)[\S]+/g.exec(res)) {
               var varName = res.trim();
               constraintedVariables.type.add(varName);
               var tmp = matches[1] + (letDeclarationSupported ? 'let ' : 'var ') + varName + white + '=';
               var defaultValue = '';
               symbol = getSymbol();
               if(type === whitespace) {
                  if(symbol.match("\n")) {
                     i = d;
                     type = lastSignificantType = operator;
                     return res + white + ':' + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables});
                  }
                  tmp += symbol;
                  symbol = getSymbol();
               }
               if(type === variable) {
                  var typeOfVar = symbol;
                  symbol = getSymbol();
                  if(type === whitespace) {
                     white = symbol === ' ' ? '' : symbol;
                     symbol = getSymbol();
                  }
                  else {
                     white = '';
                  }

                  if(symbol === '=') {
                     defaultValue = getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables});
                  }
                  else {
                     i-= symbol.length;
                  }
                  switch(typeOfVar.toLowerCase()) {
                  case "integer":
                  case "int":
                     tmp += defaultValue ? ('Audescript.as(0,' + defaultValue + ', true)') : '0';
                     constraintedVariables.type.add('0' + varName);
                     break;
                  case "list":
                  case "array":
                  case "table":
                     tmp += defaultValue ? ('Audescript.as([],' + defaultValue + ')') : '[]';
                     break;
                  case "state":
                     constraintedVariables.type.remove(varName);
                     tmp += defaultValue ? defaultValue : '""';
                     break;
                  case "string":
                     tmp += defaultValue ? ('Audescript.as("",' + defaultValue + ')') : '""';
                     break;
                  case "bool":
                  case "boolean":
                     tmp += defaultValue ? ('Audescript.as(false,' + defaultValue + ')') : 'false';
                     break;
                  case "automaton":
                     tmp += defaultValue ? 'Audescript.as(new Automaton,' + defaultValue + ')' : 'new Automaton';
                     break;
                  case "function":
                     tmp += defaultValue ? 'Audescript.as(function(){},' + defaultValue + ')' : 'function(){}';
                     break;
                  case "mappingfunction":
                     tmp += defaultValue ? defaultValue : 'getMappingFunction()';
                     break;
                  case "set":
                     if(defaultValue) {
                        tmp += (defaultValue.trim().substr(0,7) === 'to_set(') ? defaultValue : 'to_set(' +  defaultValue + ')';
                     }
                     else {
                        tmp += 'new Set()';
                        symbol = getSymbol();
                        var white2 = '';
                        if(type === whitespace) {
                           if(symbol !== ' ') {
                              white2 = symbol;
                           }
                           symbol = getSymbol();
                        }
                        if(symbol === 'of') {
                           var constraint = getConstraintString();
                           if(constraint) {
                              tmp += ';' + white2 + varName + '.setTypeConstraint(' + constraint + ')';
                           }
                           else {
                              i = deb;
                              lastSignificantType = oldType;
                              return res + white;
                           }
                           symbol = getSymbol();
                           if(type === whitespace) {
                              if(symbol !== ' ') {
                                 tmp += symbol;
                              }
                              symbol = getSymbol();
                           }
                           if(symbol === '=') {
                              tmp += ';' + varName + '.unionInPlace(' + getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables}) + ')';
                           }
                           else {
                              i -= symbol.length;
                           }
                        }
                        else {
                           i-= symbol.length;
                        }
                     }
                     break;
                  default:
                     tmp += 'new ' + typeOfVar;
                  }
                  tmp += white;
               }

               white = getWhite();
               symbol = getSymbol();
               if(symbol === ';') {
                  return tmp + white + symbol;
               }
               else {
                  i-= symbol.length;
                  return tmp + white;
               }
            }
            else {
               i = deb;
               lastSignificantType = oldType;
               return res + white;
            }
         }
         else if(type === operator) {
            if(onlyOneValue && symbol !== '!') {
               i = deb;
               lastSignificantType = oldType;
               return res + white;
            }
            if(symbol === '==') {
               res = white + " Audescript.eq(" + res + ',' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
            }
            else if(symbol === '!=') {
               res = white + " !Audescript.eq(" + res + ',' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
            }
            else if(symbol === '===') {
               res = res + white + '===' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables});
            }
            else if(symbol[symbol.length-1] === '=' && symbol !== '>=' && symbol != '<=') {
               var trimRes = res.trim();
               var newVal  = getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables});
               if(!destructuringSupported && (trimRes[0] === '{' || trimRes[0] === '[')) {
                  res = white + destructToJS(res, newVal, null, constraintedVariables);
               }
               else if(constraintedVariables.type.contains(trimRes)) {
                  if(symbol.length > 1) {
                     return white + res + '=Audescript.as(' + trimRes + ',' +  trimRes + symbol.substr(0,symbol.length-1) + newVal + ',' + (constraintedVariables.type.contains('0' + trimRes) ? 'true':'false') + ')';
                  }
                  else {
                     return white + res + '=Audescript.as(' + trimRes + ',' +  newVal + ',' + (constraintedVariables.type.contains('0' + trimRes) ? 'true':'false') + ')';
                  }
               }
               else if(!constSupported && constraintedVariables.consts.contains(trimRes)) {
                  return white + res.replace(/[\S]+/g, '') + constError(trimRes) + newVal.replace(/[\S]+/g, '');
               }
               res += white + symbol + newVal;
            }
            else {
               res += white + symbol + getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables});
            }
//            return res + white + symbol + getExpression({inForeach:inForeach,value:value,constraintedVariables:constraintedVariables});
         }
         else if(")]}".indexOf(symbol) !== -1) {
            i = deb;
            return res + white;
         }
         else {
            var not = '';
            if(symbol === 'U') {
               symbol = 'union';
            }
            else if(symbol === 'M') {
               symbol = 'minus';
            }
            else if(symbol === 'N') {
               symbol = 'inter';
            }
            else {
               symbol = symbol.toLowerCase();
               if(symbol && symbol[0] === '!') {
                  not = '!';
                  symbol = symbol.substr(1);
                  if(symbol !== 'contains' && symbol !== 'subsetof' && symbol !== 'elementof' && symbol !== 'belongsto' && symbol !== 'haskey') {
                     i = deb;
                     return res;
                  }
               }
            }
            if(symbol === 'inter' || symbol === 'union' || symbol === 'cross' || symbol === 'minus' || symbol === 'contains' || symbol === 'subsetof' || symbol === 'elementof' || symbol === 'belongsto' || symbol === 'haskey' || symbol === 'symdiff' || symbol === 'element_of') {
               if(symbol === 'symdiff') {
                  symbol = 'sym_diff';
               }
               else if(symbol === 'subsetof') {
                  symbol = 'subset_of';
               }
               else if(symbol === 'element_of') {
                  symbol = 'elementof';
               }
      
               var deb2 = i, symbol2 = getSymbol(), white2, symbol2;
               if(type === whitespace) {
                  white2 = symbol2 === ' ' ? '' : symbol2;
                  symbol2 = getSymbol();
               }
               else {
                  white2 = '';
               }

               if(type === operator) {
                  if(symbol2 !== '=' || symbol === 'contains' || symbol === 'haskey' || symbol === 'subset_of' || symbol === 'elementof' || symbol === 'belongsto' || symbol === 'sym_diff' || symbol === '') {
                     i = deb;
                     lastSignificantType = oldType;
                     return res + white;
                  }

                  res += '.' + symbol + 'InPlace(' + (white === ' ' ? '' : white) + white2 + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
               else if(symbol === 'contains' || symbol === 'subset_of' || symbol === 'sym_diff') {
                  i = deb2;
                  res = ' ' + not + symbol + '(' + res + ',' + (white === ' ' ? '' : white) + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
               else if(symbol === 'elementof' || symbol === 'belongsto') {
                  i = deb2;
                  res = ' ' + not + 'contains(' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ','  + (white === ' ' ? '' : white) + res + ')';
               }
               else if(symbol === 'haskey') {
                  i = deb2;
                  res = ' ' + not + '(' + res + ').hasKey(' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
               else {
                  i = deb2;
                  res = (white || ' ') + not + symbol + '(' + res + ',' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
            }
            else {
               i = deb;
               lastSignificantType = oldType;
               return res + white;
            }
         }
      }
      // should never be reached
      return res;
   }
   
   function comprehensiveSet(inForeach, end, constraintedVariables, declarationSymbol, deb, white, expr1) {
      if(s[i] === '{') {
         ++i;
         var end = {',' : true};
         var n1 = white + getExpression({inForeach:inForeach, value:true, endSymbols:end,constraintedVariables:constraintedVariables});
         var symbol = getSymbol();
         if(symbol !== ',') {
            i = deb;
            return '';
         }
         symbol = getSymbol();
         if(type === whitespace) {
            white += symbol;
            symbol = getSymbol();
         }
         if(symbol !== '.') {
            i = deb;
            return '';
         }
         symbol = getSymbol();
         if(symbol !== '.') {
            i = deb;
            return '';
         }
         symbol = getSymbol();
         if(symbol !== '.') {
            i = deb;
            return '';
         }

         symbol = getSymbol();
         if(type === whitespace) {
            white += symbol;
            symbol = getSymbol();
         }

         if(symbol !== ',') {
            i = deb;
            return '';
         }
         var n2 = getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables});

         if(getSymbol() !== '}') {
            i = deb;
            return '';
         }

         symbol = getSymbol();
         if(type === whitespace) {
            white += symbol;
            symbol = getSymbol();
         }

         if(symbol !== ')') {
            i = deb;
            return '';
         }
         var foreachBody = getExpression({inForeach:inForeach,noValue:true,constraintedVariables:copy(constraintedVariables)}), bf = '', ef = '';
         if(foreachBody.trim()[0] !== '{') {
            bf = '{';
            ef = '}';
         }
         declarationSymbol = declarationSymbol || (/^[\s]*(let|var)/.exec(expr1) || ['', (letDeclarationSupported ? 'let' : 'var')])[1];
         expr1 = expr1.replace(/^([\s]*)(?:let|var)/, '$1');
         return 'for(' + declarationSymbol + ' ' + expr1 + ' =' + n1 + '; ' + expr1.trim() + ' <= ' + n2 + ';' + white + '++' + expr1.trim() + ')' + bf + foreachBody + ef;
      }
      return '';
   }

   function parseForeach(inForeach, keyword,constraintedVariables) {
      var deb = i;
      var symbol = getSymbol(), beforeParenthesis = '';
      if(type === whitespace) {
         beforeParenthesis = symbol;
         symbol = getSymbol();
      }

      if(symbol !== '(') {
         i = deb;
         return keyword;
      }

      var expr1  = getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}),
          inExpr = getSymbol(),
          declarationSymbol = '';

      if(IterationsSupported) {
         if(keyword === 'foreach' && !expr1.match(/^[\s]*(?:let|var) ?/)) {
            expr1 = (letDeclarationSupported ? 'let ' : 'var ') + expr1;
         }
      }
      else {
         var key = /^[\s]*(let|var)/.exec(expr1);
         if(key || keyword === 'foreach') {
            declarationSymbol = (key ? key[1] + ' ' : false) || (letDeclarationSupported ? 'let ' : 'var ');
         }
         expr1 = expr1.replace(/^[\s]*(?:let|var) ?/, '');
      }

      if(type === whitespace) {
         expr1 += inExpr;
         inExpr = getSymbol();
      }
      if(inExpr !== 'in' && inExpr !== 'of' || (inExpr === 'in' && keyword === 'for')) {
         i = deb;
         return keyword;
      }

      var white = getSymbol(), d=i, c = comprehensiveSet(inForeach, end, constraintedVariables, declarationSymbol, d, white, expr1);
      if(c) {
         return c;
      }
      else {
         var expr2  = getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables});
         if(getSymbol() !== ')') {
            i = deb;
            return 'for';
         }

         var foreachBody = getExpression({inForeach:!IterationsSupported,noValue:true,constraintedVariables:copy(constraintedVariables)});
         if(IterationsSupported) {
            return 'for' + beforeParenthesis + '(' + declarationSymbol + expr1 + ' of ' + expr2 + ')'+ foreachBody;
         }
         else {
            var  bf = '', ef = '';
            if(foreachBody.trim()[0] === '{') {
               if(!declarationSymbol && keyword !== 'foreach') {
                  foreachBody = foreachBody.replace(/([\s]*)\{/, '$1{' + expr1.replace(/\$/g, '$$$$') + '=arguments[0];');
               }
            }
            else {
               if(!declarationSymbol && keyword !== 'foreach') {
                  bf = '{' + expr1 + '=arguments[0];';
               }
               else {
                  bf = '{';
               }
               ef = '}';
            }
            return 'try{(' + expr2 + ').forEach' + beforeParenthesis + '(function(' + ((declarationSymbol || keyword === 'foreach') ? expr1 : '') + ')' + bf + foreachBody + ef + ')}catch(e){if(e instanceof Audescript.ThrowValue){throw ' + (inForeach ? 'e' : 'e.v') + ';}else if(e instanceof Audescript.ReturnValue){' + (inForeach ? 'throw e' : 'return e.v') + ';}}';
         }
      }
   }
   
   function toPureJS(endSymbols, inForeach, constraintedVariables) {
      if(!endSymbols) {
         endSymbols = {};
      }
      if(!constraintedVariables) {
         constraintedVariables = {type:new Set,consts:new Set};
      }
      var res='', symbol, beforeSymbol = i;
      do {
         res += getExpression({inForeach:inForeach, value:false, endSymbols:endSymbols, constraintedVariables:constraintedVariables});
         if(i === beforeSymbol) {
            symbol = getSymbol();
            if(endSymbols.hasOwnProperty(symbol)) {
               i = beforeSymbol;
               return res;
            }
            else { // surely a syntax error, we avoid an infinite loop
               res += symbol;
            }
         }

         beforeSymbol = i;
         symbol = getSymbol();
         i = beforeSymbol;
         if(endSymbols.hasOwnProperty(symbol)) {
            return res;
         }
      } while(type !== end);
      return res;
   }

   pkg.Audescript.toPureJS = function (str, includesArray) {
      includes = includesArray || [];
      len     = str.length;
      s       = str;
      i       = 0;
      lastSignificantType = type = end;
      return toPureJS();
   };
   
   /* Somme standard functions */

   // thx Tom Cornebize for the fold idea
   // thx http://www.developpez.net/forums/d355725/autres-langages/langages-fonctionnels/caml/ocaml-explication-listfold-left-right/#post2170830
   pkg.foldLeft = function(list, func, a) {
      if(!list.length) {
         return a;
      }
      return pkg.foldLeft(list.slice(1), func, func(a, list[0]));
   };

   pkg.foldRight = function(list, func, a) {
      if(!list.length) {
         return a;
      }
      return func(list[0], pkg.foldRight(func, a, list.slice(1)));
   };

   pkg.map = function(l, func) {
      return l.map(function(e){func(e);});
   };
})(typeof exports === 'object' ? exports : this, typeof exports === 'object' ? exports : this);