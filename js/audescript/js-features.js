/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */
/*
    Copyright (c) 2013-2014, Raphaël Jakse (Université Joseph Fourier)
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

/*eslint no-eval:0*/

(function(pkg, that) {
    "use strict";
    pkg.jsFeatures = {
        letDeclaration:      false,
        arrowFunction:       false,
        letExpression:       false,
        iterations:          false,
        constDeclaration:    false,
        abbreviatedFunction: false,
        destructuring:       false
    };


    try {
        pkg.jsFeatures.arrowFunction = eval("(x => true)()");
    } catch (ignore) {}

    if (typeof that.Packages !== "object" || String(that.Packages) !== "[JavaPackage ]") {
        // disable this feature detection in rhino as it crashes it
        try {
            pkg.jsFeatures.abbreviatedFunction = eval("(function () true)()");
        } catch (ignore) {}
    }

    try {
        pkg.jsFeatures.letExpression    = eval("(function () {var a=1, t; let (a=2) {if (a === 2) {t = true}}; return t && a === 1;})();");
    } catch (ignore) {}

    try {
        pkg.jsFeatures.letDeclaration   = eval("(function () {var a=1, t; if (true) {let a = 2;t = a === 2} return t && a === 1;})();");
    } catch (ignore) {}

    try {
        pkg.jsFeatures.constDeclaration = eval("(function () {const a=1; try{a=2;} catch (e) {return true;} return false;})();");
    } catch (ex) {
        if (ex instanceof TypeError) {
            pkg.jsFeatures.constDeclaration = true;
        }
    }

    try {
        pkg.jsFeatures.iterations       = eval("(function () {for (let i of [1,2]) {} return true;})()");
    } catch (ignore) {}

    try {
        pkg.jsFeatures.destructuring    = eval("(function () {var [a,b,c] = [1,2,3]; return a === 1 && b === 2 && c === 3})()");
    } catch (ignore) {}
}((typeof exports !== "undefined" && exports) || this.audescript, this));
