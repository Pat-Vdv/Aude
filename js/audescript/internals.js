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

(function (pkg) {
    "use strict";

    pkg.internals = {
        getExpression: function (context, newContext) {
            newContext.lexer = context.lexer;
            if (!newContext.hasOwnProperty("inForeach")) {
                newContext.inForeach = context.inForeach;
            }
            newContext.jsFeatures = context.jsFeatures;
            return pkg.internals.parseStatement(newContext);
        },

        parseStatements: function (context) {
            if (!context.constraintedVariables) {
                context.constraintedVariables = {
                    type: new Set(),
                    consts: new Set()
                };
            }

            var lexer = context.lexer,
                res   = "",
                symbol,
                lexerBeforeSymbol = lexer.save();

            do {
                // we browse the code, expression by expression
                res += pkg.internals.parseStatement(context);

                // if no expression was parsed
                if (lexer.curPos() === lexerBeforeSymbol.curPos()) {
                    symbol = lexer.nextSymbol();
                    if (context.endSymbols && context.endSymbols.hasOwnProperty(symbol)) {
                        lexer.restore(lexerBeforeSymbol);
                        return res;
                    }
                    // surely a syntax error,
                    // we avoid an infinite loop by just reading a symbol as is
                    res += symbol;
                }

                lexerBeforeSymbol = lexer.save();
                symbol = lexerBeforeSymbol.nextSymbol();

                // if we saw a stop symbol
                if (context.endSymbols && context.endSymbols.hasOwnProperty(symbol)) {
                    return res;
                }
                lexerBeforeSymbol.restore(lexer);
            } while (lexer.type !== lexer.END);
            return res;
        },

        constError: function (variable) {
            return "(function () {throw new Error('TypeError: " + variable + " is read-only');})()";
        }
    };

    // added in audescript.js: var getExpression = pkg.internals.getExpression;

}((typeof exports !== "undefined" && exports) || this.audescript));
