/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */


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


// NEEDS automata.js, set.js

(function(pkg) {
   "use strict";
   if(!pkg.AutomatonJS) {
      pkg.AutomatonJS = {};
   }

   // things needed to executre AutomatonJS code.
   pkg.AutomatonJS.BreakException = {};
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

   Object.defineProperty(Object.prototype, 'forEach', {
      enumerable:false,
      value: function(callback) {
         for(var i in this) {
            if(this.hasOwnProperty(i)) {
               callback(this[i]);
            }
         }
      }
   });

   var s,i, len, type, lastSignificantType;
   var string          = 2,
       whitespace      = 4,
       variable        = 8,
       dot             = 16,
       regEx           = 32,
       number          = 64,
       operator        = 128,
       comma_semicolon = 256,
       comment         = 512,
       closeParen      = 1024,
       closeCurly      = 2048,
       openBracket     = 4096,
       instruction     = 8192,
       closeBracket    = 16384,
       end             = 0;

   function parseUnsignedNumber() {
      var dotEncountered, d = i;
      if(i < len && s[i] === '0') {
         ++i;
         if(i < len && s[i] === 'x' || s[i] === 'X') {
            do {
               ++i;
            } while('0123456789ABCDEF'.indexOf(s[i].toLowerCase()) !== -1);
         }
      }
      else {
         while(i < len && '0123456789'.indexOf(s[i]) !== -1 || (!dotEncountered && s[i] === '.')) {
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
      }
      type=number;
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
      else if(s[i] === "'" || s[i] === "'") {
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
         return s.substring(deb,i);
      }
      else if(s[i] === '.') {
         ++i;
         if('0123456789'.indexOf(s[i]) !== -1) {
            --i;
            lastSignificantType = type = number;
            return parseUnsignedNumber();
         }
         lastSignificantType = type = dot;
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
         var d = i++;
         if(i < len && s[i] === '/') {
            do {
               ++i;
            } while(i < len && s[i] !== '\n');
            type = comment;
         }
         else if(i < len && s[i] === '*') {
            do {
               ++i;
            } while(i+1 < len && (s[i] !== '*' || s[i+1] !== '/'));
            type = comment;
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
            if(v === "var" || v === "new" || v === "delete" || v === "return" || v === "throw" || v === "break" || v === "continue" || v === 'in' || v === 'if' || v === 'else' || v === 'do' || v === 'while' || v === 'function' || v === 'instanceof' || v === 'typeof') {
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
         return "throw AutomatonJS.BreakException";
      }
      else if(symbol === "return") {
         return "throw";
      }
      else if(symbol === "continue") {
         return "return";
      }
      return symbol;
   }

   function getExpression(options) {
      var res          = '',
          deb          = i,
          symbol       = getSymbol(),
          endSymbols   = options.endSymbols || {},
          value        = options.value,
          inForeach    = options.inForeach,
          onlyOneValue = options.onlyOneValue;

      if(endSymbols.hasOwnProperty(symbol)) {
         i = deb;
         return res;
      }

      if(type === whitespace) {
         res += symbol;
         deb = i;
         symbol = getSymbol();
      }
      if(")]}".indexOf(symbol) !== -1) {
         i = deb;
         return res;
      }
      if(symbol === '{') {
         deb = i;
         var pres = '';
         do {
            pres += (pres ? ',':'') + getExpression({inForeach:inForeach,value:true,onlyOneValue:true});
            symbol = getSymbol();
            if(type === whitespace) {
               pres += symbol;
               symbol = getSymbol();
            }
         } while(symbol === ',');
         if(symbol === '}') {
            res += 'to_set([' + pres + '])';
         }
         else {
            i = deb;
            pres = toPureJS({'}':true}, inForeach);
            res += '{' + pres  + getSymbol(); // '}'
         }
      }
      else if(symbol === '[') {
         var pres = toPureJS({']':true});
         res += '[' + pres + getSymbol(); // ']'
      }
      else if(symbol === '(') {
         var pres = toPureJS({')':true});
         res += '(' + pres + getSymbol(); // ')'
      }
      else if(symbol === ';') {
         if(value) {
            --i;
            return res;
         }
         return res + symbol;
      }
      else if(symbol === ',') {
         return res + ',' + getExpression({inForeach:true, value:false, endSymbols:endSymbols});
      }
      else if(symbol === 'foreach') {
         return res + parseForeach(inForeach);
      }               
      else if(inForeach && (symbol === "break" || symbol === "continue" || symbol === "throw" || symbol === "return")) {
         return res + foreachReplacements(symbol);
      }
      else if(symbol === 'if' || symbol === 'while' || symbol === 'for' || symbol === 'function') {
         return res + symbol + getExpression({inForeach:inForeach}) + getExpression({inForeach:inForeach});
      }
      else if(symbol === 'do') {
         res += symbol + getExpression({inForeach:inForeach});
         var symbol2 = getSymbol();
         var d = i;
         if(type === whitespace) {
            res += symbol2;
            symbol2 = getSymbol();
         }
         if(symbol2 === 'while') {
            return res + symbol2 + getExpression({inForeach:inForeach});
         }
         i = d;
         return res;
      }
      else if(symbol === 'else') {
         return res + symbol + getExpression({inForeach:inForeach});
      }
      else if(type === instruction) {
         if(symbol === 'new' || symbol === 'delete' || symbol === 'instanceof' || symbol === 'typeof') {
            res += symbol + getExpression({inForeach:inForeach, value:true, onlyOneValue:true});
         }
         else {
            return res + symbol + getExpression({inForeach:inForeach});
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
         if(endSymbols.hasOwnProperty(symbol)) {
            i = deb;
            return res;
         }

         if(type === whitespace) {
            white = symbol;
            symbol = getSymbol();
         }
         else {
            white = '';
         }

         if(type === dot) {
            var symbol2 = getSymbol();
            if(type !== variable) {// Syntax error ?
               return res + white + symbol2;
            }
            res += white + '.' + symbol2;
         }
         else if(symbol === '-' && i < len && s[i] === '>' && (oldType & (variable | closeParen))) {
            ++i;
            var expr = getExpression({inForeach:inForeach});
            res = 'function' +
                  (oldType === closeParen ? res : '(' + res + ')') +
                  (expr.trim()[0] === '{' ? expr : '{return ' + expr + '}');
         }
         else if(symbol === '[') {
            res += white + symbol + getExpression({inForeach:inForeach}) + getSymbol(); // symbol should be ']'
         }
         else if(symbol === '(') {
            if(oldType !== variable) {
               i = deb;
               return res;
            }
            res += white + symbol + getExpression({inForeach:inForeach}) + getSymbol(); // symbol should be ')'
         }
         else if(symbol === ',') {
            res += white + symbol + getExpression({inForeach:inForeach, value:value, endSymbols:endSymbols});
         }
         else if(symbol === ';') {
            if(value) {
               --i;
               return res + white;
            }
            return res + white + symbol;
         }
         else if(symbol === ':') {
            var matches = [];
            if(matches = /([\s]*)[\S]+/g.exec(res)) {
               var varName = res.trim();
               var tmp = matches[1] + 'var ' + varName + white + '=';
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
                        tmp += symbol;
                     }
                     symbol = getSymbol();
                  }
                  if(symbol === '(') {
                     defaultValue = getSymbol();
                     if(getSymbol() !== ')') {
                        i = deb;
                        return res;
                     }
                     symbol = getSymbol();
                  }

                  if(type === whitespace) {
                     if(symbol !== ' ') {
                        tmp += symbol;
                     }
                     symbol = getSymbol();
                  }
                  if(symbol === '=' && typeOfVar.toLowerCase() !== 'set') {
                     return tmp + getExpression({inForeach:inForeach});
                  }
                  else {
                     switch(typeOfVar.toLowerCase()) {
                     case "integer":
                        tmp += defaultValue || '0';
                        break;
                     case "list":
                     case "array":
                     case "table":
                        tmp += defaultValue || "[]";
                        break;
                     case "state":
                     case "string":
                        tmp += defaultValue || '""';
                        break;
                     case "bool":
                     case "boolean":
                        tmp += 'false';
                        break;
                     case "automaton":
                        tmp += defaultValue ? 'get_automaton(' + defaultValue + ')' : 'new Automaton';
                        break;
                     case "set":
                        if(symbol === '=') {
                           tmp += 'to_set(' +  getExpression({inForeach:inForeach, value:true}) + ')';
                           symbol = getSymbol();
                           if(type === whitespace) {
                              tmp += symbol;
                              symbol = getSymbol();
                           }
                        }
                        else if(!defaultValue){
                           tmp += 'new Set';
                        }

                        if(symbol === ';') {
                           return tmp + (defaultValue ? 'to_set(' + defaultValue + ')' : '') + ';';
                        }
                        else {
                           if(symbol === 'of') {
                              symbol = getSymbol();
                              if(type === whitespace) {
                                 if(symbol !== ' ') {
                                    tmp += symbol;
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
                                       return res;
                                    }
                                 }
                                 else {
                                    var lowerType = symbol.toLowerCase();
                                    if(lowerType === "integer") {
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
                                    else if(lowerType === 'element') {
                                       symbol = 'Element';
                                    }
                                    else if(lowerType === 'tuple') {
                                       symbol = 'Tuple';
                                    }
                                    else if(lowerType === 'set') {
                                       symbol = 'Set';
                                    }
                                    else if(lowerType === "bool" || lowerType === "boolean" ||  lowerType === "string" || lowerType === "object" || lowerType === "undefined") {
                                       symbol = '"' + lowerType + '"';
                                    }
                                    else if(lowerType === 'state') {
                                       symbol = 'null'; // FIXME: no constraint for states
                                    }
                                 }
                                 tmp += ';' + varName + '.setTypeConstraint(' + symbol + ')';
                                 symbol = getSymbol();
                                 if(type === whitespace) {
                                    if(symbol !== ' ') {
                                       tmp += symbol;
                                    }
                                    symbol = getSymbol();
                                 }
                                 if(symbol === '=') {
                                    tmp += ';' + varName + '.unionInPlace(' + getExpression({inForeach:inForeach, value:true}) + ')';
                                    symbol = getSymbol();
                                    if(type === whitespace) {
                                       if(symbol !== ' ') {
                                          tmp += symbol;
                                       }
                                       symbol = getSymbol();
                                    }
                                 }
                                 if(symbol === ';') {
                                    return tmp + (defaultValue ? 'to_set(' + defaultValue + ')' : '') + symbol;
                                 }
                                 else {
                                    i-= symbol.length;
                                    return tmp + (defaultValue ? 'to_set(' + defaultValue + ')' : '');
                                 }
                              }
                              else {
                                 i = deb;
                                 return res;
                              }
                           }
                           else {
                              i-= symbol.length;
                              return tmp + (defaultValue ? 'to_set(' + defaultValue + ')' : '');
                           }
                        }
                        break;
                     default:
                        tmp += 'new ' + typeOfVar;
                     }
                  }

                  if(symbol === ';') {
                     return tmp + symbol;
                  }
                  else {
                     i-= symbol.length;
                     return tmp;
                  }
               }
               else {
                  i = deb;
                  return res;
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
               return white + "AutomatonJS.eq(" + res + ',' + getExpression({inForeach:inForeach, value:true, onlyOneValue:true}) + ')';
            }

            return res + white + symbol + getExpression({inForeach:inForeach});
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
            if(symbol === 'inter' || symbol === 'union' || symbol === 'minus') {
               var deb2 = i, symbol2 = getSymbol(), white2, symbol2;
               if(type === whitespace) {
                  white2 = symbol2 === ' ' ? '' : symbol2;
                  symbol2 = getSymbol();
               }
               else {
                  white2 = '';
               }

               if(symbol2 === '=') {
                  return res + '.' + symbol + 'InPlace(' + (white === ' ' ? '' : white) + white2 + getExpression({inForeach:inForeach, value:true}) + ')';
               }
               else {
                  i = deb2;
                  return white + symbol + '(' + res + ',' + getExpression({inForeach:inForeach, value:true}) + ')';
               }
            }
            i = deb;
            return res;
         }
      }
      // should never be reached
      return res;
   }

   function parseForeach(inForeach) {
      var deb = i;

      var symbol = getSymbol(), beforeParenthesis = '';
      if(type === whitespace) {
         beforeParenthesis = symbol;
         symbol = getSymbol();
      }

      if(symbol !== '(') {
         i = deb;
         return 'foreach';
      }

      var expr1  = getExpression({inForeach:inForeach}),
          inExpr = getSymbol();

      if(type === whitespace) {
         expr1 += inExpr;
         inExpr = getSymbol();
      }
      if(inExpr !== 'in') {
         i = deb;
         return 'foreach';
      }
      var white = getSymbol();
      if(s[i] === '{') {
         ++i;
         var end = {',' : true};
         var n1 = white + getExpression({inForeach:inForeach, value:true, endSymbols:end});
         symbol = getSymbol();
         if(symbol !== ',') {
            i = deb;
            return 'foreach';
         }
         symbol = getSymbol();
         if(type === whitespace) {
            white += symbol;
            symbol = getSymbol();
         }
         if(symbol !== '.') {
            i = deb;
            return 'foreach';
         }
         symbol = getSymbol();
         if(symbol !== '.') {
            i = deb;
            return 'foreach';
         }
         symbol = getSymbol();
         if(symbol !== '.') {
            i = deb;
            return 'foreach';
         }

         symbol = getSymbol();
         if(type === whitespace) {
            white += symbol;
            symbol = getSymbol();
         }

         if(symbol !== ',') {
            i = deb;
            return 'foreach';
         }
         var n2 = getExpression({inForeach:inForeach});

         if(getSymbol() !== '}') {
            i = deb;
            return 'foreach';
         }

         symbol = getSymbol();
         if(type === whitespace) {
            white += symbol;
            symbol = getSymbol();
         }

         if(symbol !== ')') {
            i = deb;
            return 'foreach';
         }
         var foreachBody = getExpression({inForeach:inForeach}), bf = '', ef = '';
         if(foreachBody.trim()[0] !== '{') {
            bf = '{';
            ef = '}';
         }

         return 'for(var ' + expr1 + ' =' + n1 + '; i <= ' + n2 + ';' + white + '++' + expr1 + ')' + bf + foreachBody + ef;
      }
      else {
         var expr2  = getExpression({inForeach:inForeach});
         if(getSymbol() !== ')') {
            i = deb;
            return 'foreach';
         }

         var foreachBody = getExpression({inForeach:true}), bf = '', ef = '';
         if(foreachBody.trim()[0] !== '{') {
            bf = '{';
            ef = '}';
         }
         return 'try{(' + expr2 + ').forEach' + beforeParenthesis + '(function(' + expr1 + ')' + bf + foreachBody + ef + ')}catch(e){if(e instanceof Error){throw e}else if(!(e === AutomatonJS.BreakException)){' + (inForeach ? 'throw ' : 'return ') + 'e;}}';
      }
   }
   
   function toPureJS(endSymbols, inForeach) {
      if(!endSymbols) {
         endSymbols = {};
      }
      var res='', symbol, beforeSymbol = i;
      do {
         res += getExpression({inForeach:inForeach, value:false, endSymbols:endSymbols});
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

   AutomatonJS.toPureJS = function (str) {
      i   = 0;
      s   = str;
      len = s.length;
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

})(this);