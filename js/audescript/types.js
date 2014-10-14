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

    pkg.internals.getConstraintString = function (context) {
        var lexer = context.lexer,
            begin = lexer.save(),
            tmp = lexer.getWhite(true),
            typeConstraint;

            lexer.nextSymbol();

        if (lexer.type & (lexer.VARIABLE | lexer.STRING)) {
            if (lexer.type === lexer.STRING) {
                try {
                    typeConstraint = JSON.parse(lexer.symbol);
                    if (typeConstraint === "float" || typeConstraint === "double") {
                        typeConstraint = "'number'";
                    }
                } catch (e) {
                    lexer.restore(begin);
                    return "";
                }
            } else {
                var lowerType = lexer.symbol.toLowerCase();

                switch(lowerType) {
                case "integer":
                case "int":
                    typeConstraint = "'int'";
                    break;
                case "number":
                    typeConstraint = "'number'";
                    break;
                case "list":
                case "array":
                    typeConstraint = "Array";
                    break;
                case "automaton":
                    typeConstraint = "Automaton";
                    break;
                case "set":
                    typeConstraint = "Set";
                    break;
                case "bool":
                    typeConstraint = "'boolean'";
                    break;
                case "boolean":
                case "string":
                case "object":
                case "undefined":
                case "function":
                    typeConstraint = "'" + lowerType + "'";
                    break;
                case "state":
                    typeConstraint = "null"; // FIXME: no constraint for states
                }
            }
            return tmp + typeConstraint;
        }

        lexer.restore(begin);
        return "";
    };
}((typeof exports !== "undefined" && exports) || this.audescript));
