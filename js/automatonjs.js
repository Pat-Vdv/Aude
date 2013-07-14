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
   var _ = pkg.AutomatonJS10n = that.libD && that.libD.l10n ? that.libD.l10n(): function(s){return s;};
   if(!pkg.AutomatonJS) {
      pkg.AutomatonJS = {};
   }

   // things needed to execute AutomatonJS code.
   if(!that.StopIteration) {
      that.StopIteration = {};
   }

   var letDeclarationSupported  = false,
       arrowFunctionSupported   = false,
       letExpressionSupported   = false,
       IterationsSupported      = false,
       constSupported           = false,
       abbreviatedFunctionSupported = false;

   try {
      arrowFunctionSupported = eval("(x => true)()");
   }
   catch(e){}

   try {
      abbreviatedFunctionSupported = eval("(function() true)()");
   }
   catch(e){}

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
   catch(e){
      if(e instanceof TypeError) {
         constSupported = true;
      }
   }

   try {
      IterationsSupported    = eval("(function(){for(let i of [1,2]){} return true;})()");
   }
   catch(e){}

   // checks "real" equality between v1 and v2
   pkg.AutomatonJS.eq = function(v1, v2) {
      return v1 === v2 || (
            typeof v1 === typeof v2
         && (v1 instanceof Set && v2 instanceof Set
            ? v1.card() === v2.card() && !minus(v1, v2).card()
            : (v1 instanceof Transition && v2 instanceof Transition
               ?     pkg.AutomatonJS.eq(v1.symbol, v2.symbol)
                  && pkg.AutomatonJS.eq(v1.startState, v2.startState)
                  && pkg.AutomatonJS.eq(v1.endState, v2.endState)
               : (v1 instanceof Automaton && v2 instanceof Automaton
                  ?     pkg.AutomatonJS.eq(v1.states, v2.states)
                     && pkg.AutomatonJS.eq(v1.finalStates, v2.finalStates)
                     && pkg.AutomatonJS.eq(v1.trans, v2.trans)
                     && pkg.AutomatonJS.eq(v1.q_init, v2.q_init)
                  : JSON.stringify(v1) === JSON.stringify(v2)
               )
            )
         )
      );
   };

   // checks if value can be assigned to variable and return the right value. integerCheck enforce value being an integer.
   pkg.AutomatonJS.as = function(variable, value, integerCheck) {
      if(variable instanceof Set && value instanceof Set) {
         if(!variable.typeConstraint  || variable.typeConstraint === value.constaintType) {
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
            throw new Error(_("Assignation Error: types of the value and the variable don't match."));
         }
         if(integerCheck && value % 1 !== 0) {
            return Math.floor(value);
         }
         return value;
      }
      if(value !== variable) {
         throw new Error(_("Assignation Error: types of the value and the variable don't match."));
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

   var s,i, len, type, lastSignificantType, includes;
   var string          = 2,
       whitespace      = 4,
       variable        = 8,
       dot             = 16,
       regEx           = 32,
       number          = 64,
       operator        = 128,
       comma_semicolon = 256,
//     comment         = 512, // comments are like whitespace, in fact.
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
            } while(i+1 < len && (s[i] !== '*' || s[i+1] !== '/'));
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
            console.log(i, lastSignificantType);
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
            if(v === "var" || v === "new" || v === "delete" || v === "return" || v === "throw" || v === "break" || v === "continue" || v === 'in' || v === 'if' || v === 'else' || v === 'do' || v === 'while' || v === 'function' || v === 'instanceof' || v === 'typeof' || v === 'include' || v === 'let' || v === 'const') {
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

   function foreachReplacements(symbol) {
      if(symbol === "break") {
         return "throw StopIteration";
      }
      else if(symbol === "return") {
         return "throw";
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
   
   function functionBody(s) {
      if(!abbreviatedFunctionSupported && s.trim()[0] !== '{') {
         return '{return ' + s + '}';
      }
      return s;
   }

   function getExpression(options) {
      var res          = '',
          deb          = i,
          symbol       = getSymbol(),
          endSymbols   = options.endSymbols || {},
          value        = options.value || options.onlyOneValue,
          inForeach    = options.inForeach,
          onlyOneValue = options.onlyOneValue,
          constraintedVariables = options.constraintedVariables;

      if(type === whitespace) {
         res += symbol;
         deb = i;
         symbol = getSymbol();
      }

      if(endSymbols.hasOwnProperty(symbol)) {
         i = deb;
         return res;
      }

      if(")]}".indexOf(symbol) !== -1) {
         i = deb;
         return res;
      }
      if(symbol === '{') {
         deb = i;
         var pres = '';
         if(!options.noset) {
            do {
               pres += (pres ? ',':'') + getExpression({inForeach:inForeach,value:true, noComma:true,constraintedVariables:constraintedVariables});
               symbol = getSymbol();
               if(type === whitespace) {
                  pres += symbol;
                  symbol = getSymbol();
               }
            } while(symbol === ',');
         }
         if(!options.noset && symbol === '}' && !s.substring(deb-1, i).match(/^\{[\s]*\}$/)) {
            res += 'to_set([' + pres + '])';
         }
         else {
            i = deb;
            lastSignificantType = type = openBracket;
            pres = toPureJS({'}':true}, inForeach, copy(constraintedVariables));
            res += '{' + pres  + getSymbol(); // '}'
         }
      }
      else if(symbol === '[') {
         var pres = toPureJS({']':true}, inForeach);
         res += '[' + pres + getSymbol(); // ']'
      }
      else if(symbol === '(') {
         var pres = toPureJS({')':true}, inForeach);
         res += '(' + pres + getSymbol(); // ')'
      }
      else if(symbol === '?') {
         var pres = getExpression({inForeach:inForeach,onlyOneValue:true,constraintedVariables:constraintedVariables});
         res += '?' + pres + getSymbol(); // ':'
      }
      else if(symbol === ';') {
         if(value) {
            --i;
            return res;
         }
         return res + symbol;
      }
      else if(symbol === ',') {
         if(value) {
            --i;
            return res;
         }
         return res + ',' + getExpression({inForeach:true, value:false, endSymbols:endSymbols,constraintedVariables:constraintedVariables});
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
         return res + foreachReplacements(symbol);
      }
      else if(symbol === 'if' || symbol === 'while' || symbol === 'for' || symbol === 'function' || symbol === "switch") {
         var tmp;
         if(symbol === 'function') {
            var d = i;
            var functionName = getSymbol();
            if(type === whitespace) {
               functionName += getSymbol();
            }
            if(lastSignificantType === variable) {
               if(value) {
                  i = deb;
                  return '';
               }
               return res + symbol + functionName + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + functionBody(getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables), noset:true}));
            }
            i = d;
            lastSignificantType = type = instruction;
            return res + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + functionBody(getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables),noset:true}));

         }
         else if(value) {
            i = deb;
            return '';
         }
         else if(symbol === 'for' && !IterationsSupported && (tmp = parseForeach(inForeach, symbol, constraintedVariables))) {
            return res + tmp;
         }
         return res + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables),noset:true});
      }
      else if(symbol === 'do') {
         if(value) {
            i = deb;
            return '';
         }
         res += symbol + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables),noset:true});
         var symbol2 = getSymbol();
         var d = i;
         if(type === whitespace) {
            res += symbol2;
            symbol2 = getSymbol();
         }
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
         return res + symbol + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)});
      }
      else if(symbol === 'emptySet') {
         res += 'new Set(';
         var deb = i;
         symbol = getSymbol();
         if(type === whitespace) {
            symbol = getSymbol();
         }
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
         symbol = getSymbol();
         if(type === whitespace) {
            res += symbol;
            symbol = getSymbol();
         }

         includes.push(symbol);
         deb = i;
         symbol = getSymbol();
         if(type === whitespace) {
            res += symbol;
            deb = i;
            symbol = getSymbol();
         }
         if(symbol === ';') {
            return res;
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
         else {
            if(symbol === 'const' && !constSupported) {
               symbol = letDeclarationSupported ? 'let' : 'var';
               var d = i, varName = getExpression({onlyOneValue:true}).trim();
               i = d;
               res += symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables});
               constraintedVariables.consts.add(varName);
               return res;
            }
            else if(symbol === 'let') {
               var d = i;
               symbol = getSymbol();
               if(type === whitespace) {
                  pres += symbol;
                  symbol = getSymbol();
               }
               i = d;
               if(symbol === '(') {
                  if(letExpressionSupported) {
                     return res + 'let' + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)});
                  }
                  else {
                     return res + '(function(){var ' + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}).replace(/^([\s]*)\(([\s\S]+)\)([\s]*)$/, '$1$2$3') + ';' + getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)}) + '})()';
                  }
               }
               else {
                  return res + (letDeclarationSupported ? 'let' : 'var') + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables});
               }
            }
            return res + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables});
         }
      }
      else {
         res += symbol; // ?? (string, number, litteral, ... ?)
      }

      var oldType, white;
      while(1) {
         oldType = lastSignificantType;
         deb = i;
         symbol = getSymbol();

         if(type === whitespace) {
            white = symbol;
            symbol = getSymbol();
         }
         else {
            white = '';
         }

         if(endSymbols.hasOwnProperty(symbol)) {
            i = deb;
            return res;
         }

         if(type === dot) {
            var symbol2 = getSymbol();
            if(type !== variable) {// Syntax error ?
               return res + white + symbol2;
            }
            res += white + '.' + symbol2;
         }
         else if(symbol === '?') {
            var pres = getExpression({inForeach:inForeach,onlyOneValue:true,constraintedVariables:constraintedVariables});
            res += '?' + pres + getSymbol(); // ':'
         }
         else if(symbol === '=>'  && (oldType & (variable | closeParen))) {
            ++i;
            var expr = getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)});
            if(arrowFunctionSupported) {
               res += '=>' + exp;
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
            if(oldType !== variable) {
               i = deb;
               return res;
            }
            res += white + symbol + getExpression({inForeach:inForeach,constraintedVariables:constraintedVariables}) + getSymbol(); // symbol should be ')'
         }
         else if(symbol === ',') {
            if(onlyOneValue || options.noComma) {
               i = deb;
               return res;
            }
            res += white + symbol + getExpression({inForeach:inForeach,value:value,endSymbols:endSymbols,constraintedVariables:constraintedVariables});
         }
         else if(symbol === ';') {
            if(value) {
               --i;
               return res + white;
            }
            return res + white + symbol;
         }
         else if(symbol === ':') {
            if(value) {
               --i;
               return res + white;
            }

            var matches = [], d;
            if(matches = /([\s]*)[\S]+/g.exec(res)) {
               var varName = res.trim();
               constraintedVariables.type.add(varName);
               var tmp = matches[1] + (letDeclarationSupported ? 'let ' : 'var ') + varName + white + '=';
               var defaultValue = '';
               symbol = getSymbol();
               if(type === whitespace) {
                  tmp += symbol;
                  symbol = getSymbol();
               }
               if(type === variable) {
                  var typeOfVar = symbol;
                  symbol = getSymbol();
                  if(type === whitespace) {
                     if(symbol !== ' ') {
                        white = symbol;
                     }
                     symbol = getSymbol();
                  }
                  else {
                     white = '';
                  }

                  if(type === whitespace) {
                     if(symbol !== ' ') {
                        white = symbol;
                     }
                     symbol = getSymbol();
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
                     tmp += defaultValue ? ('AutomatonJS.as(0,' + defaultValue + ', true)') : '0';
                     constraintedVariables.type.add('0' + varName);
                     break;
                  case "list":
                  case "array":
                  case "table":
                     tmp += defaultValue ? ('AutomatonJS.as([],' + defaultValue + ')') : '[]';
                     break;
                  case "state":
                  case "string":
                     tmp += defaultValue ? ('AutomatonJS.as("",' + defaultValue + ')') : '""';
                     break;
                  case "bool":
                  case "boolean":
                     tmp += defaultValue ? ('AutomatonJS.as(false,' + defaultValue + ')') : 'false';
                     break;
                  case "automaton":
                     tmp += defaultValue ? '(AutomatonJS.as(new Automaton,' + defaultValue + ')' : 'new Automaton';
                     break;
                  case "function":
                     tmp += defaultValue ? '(AutomatonJS.as(function(){},' + defaultValue + ')' : 'function(){}';
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
                              return res;
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

               symbol = getSymbol();
               white = '';
               if(type === whitespace) {
                  white = symbol;
                  symbol = getSymbol();
               }
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
               return res;
            }
         }
         else if(type === operator) {
            if(onlyOneValue) {
               i = deb;
               return res;
            }
            if(symbol === '==') {
               return white + "AutomatonJS.eq(" + res + ',' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
            }
            else if(symbol === '!=') {
               return white + "!AutomatonJS.eq(" + res + ',' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
            }
            else if(symbol[symbol.length-1] === '=') {
               if(constraintedVariables.type.contains(res.trim())) {
                  if(symbol.length > 1) {
                     return white + res + '=AutomatonJS.as(' + res.trim() + ',' +  res.trim() + symbol.substr(0,symbol.length-1) + getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables}) + ',' + (constraintedVariables.type.contains('0' + res.trim()) ? 'true':'false') + ')';
                  }
                  else {
                     return white + res + '=AutomatonJS.as(' + res.trim() + ',' +  getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables}) + ',' + (constraintedVariables.type.contains('0' + res.trim()) ? 'true':'false') + ')';
                  }
               }
               else if(!constSupported && constraintedVariables.consts.contains(res.trim())) {
                  return white + res.replace(/[\S]+/g, '') + '(function(){throw new Error("TypeError: ' + res.trim() + ' is read-only");})()' + getExpression({inForeach:inForeach,value:true,constraintedVariables:constraintedVariables}).replace(/[\S]+/g, '');
               }
            }

            return res + white + symbol + getExpression({inForeach:inForeach,value:value,constraintedVariables:constraintedVariables});
         }
         else if(")]}".indexOf(symbol) !== -1) {
            i = deb + white.length;
            return res + white;
         }
         else {
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
            }
            if(symbol === 'inter' || symbol === 'union' || symbol === 'minus' || symbol === 'contains' || symbol === 'subsetof' || symbol === 'elementof' || symbol === 'belongsto' || symbol === 'has') {
               var deb2 = i, symbol2 = getSymbol(), white2, symbol2;
               if(type === whitespace) {
                  white2 = symbol2 === ' ' ? '' : symbol2;
                  symbol2 = getSymbol();
               }
               else {
                  white2 = '';
               }

               if(type === operator) {
                  if(symbol2 !== '=' || symbol === 'contains' || symbol === 'subsetof' || symbol === 'elementof' || symbol === 'belongsto') {
                     i = deb;
                     return res;
                  }

                  return res + '.' + symbol + 'InPlace(' + (white === ' ' ? '' : white) + white2 + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
               else if(symbol === 'contains' || symbol === 'subsetof' || symbol === 'has') {
                  i = deb2;
                  return res + '.' + (symbol === 'subsetof' ? 'subsetOf' : symbol) + '(' + (white === ' ' ? '' : white) + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
               else if(symbol === 'elementof' || symbol === 'belongsto') {
                  i = deb2;
                  return getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + '.contains(' + (white === ' ' ? '' : white) + res + ')';
               }
               else {
                  i = deb2;
                  return white + symbol + '(' + res + ',' + getExpression({inForeach:inForeach, onlyOneValue:true,constraintedVariables:constraintedVariables}) + ')';
               }
            }
            i = deb;
            return res;
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
         var foreachBody = getExpression({inForeach:inForeach,constraintedVariables:copy(constraintedVariables)}), bf = '', ef = '';
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
      if(inExpr !== 'in' && inExpr !== 'of') {
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

         var foreachBody = getExpression({inForeach:!IterationsSupported,constraintedVariables:copy(constraintedVariables)});
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
            return 'try{(' + expr2 + ').forEach' + beforeParenthesis + '(function(' + ((declarationSymbol || keyword === 'foreach') ? expr1 : '') + ')' + bf + foreachBody + ef + ')}catch(e){if(e instanceof Error){throw e}else if(!(e === StopIteration)){' + (inForeach ? 'throw ' : 'return ') + 'e;}}';
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

   AutomatonJS.toPureJS = function (str, includesArray) {
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

   _("fr", "Assignation Error: types of the value and the variable don't match.", "Erreur d\'affectation : la valeur et la variable ont des types qui ne correspondent pas.")
})(this, this);