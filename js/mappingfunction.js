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
 * @author  Raphaël Jakse
 * @file This is a library featuring a convenient mapping function.
 * @version 0.1a
 */

(function(pkg) {
   "use strict";
   
   pkg.getMappingFunction = function() {
      var m = {}, f = function(a1,a2,a3) {
         switch(arguments.length) {
            case 1:
               return f.getKey(a1);
            case 2:
               f.setKey(a1,a2);
               return;
            case 3:
               if(a2 === null && a3 === null) {
                  f.removeKey(a1);
               }
            default:
               throw new Error('Bad arguments number.');
         }
      };

      f.hasKey = function(k) {
         return m.hasOwnProperty(Set.prototype.elementToString(k));
      };

      f.getKey = function(k) {
         var key = Set.prototype.elementToString(k);
         if(m.hasOwnProperty(key)) {
            return m[key];
         }
         throw new Error('This key is not mapped to anything.');
      };

      f.setKey = function(k,v) {
         switch(arguments.length) {
            case 1:
               f.removeKey(k);
               break;
            case 2:
               m[Set.prototype.elementToString(k)] = v;
               return;
            default:
               throw new Error('Bad arguments number.');

         }
      };

      f.removeKey = function(k) {
         delete m[Set.prototype.elementToString(k)];
      };

      return f;
   }
})(this);