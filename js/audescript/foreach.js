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

    var getExpression = pkg.internals.getExpression; // removed in audescript.js
    var copy          = pkg.utils.copy; // removed in audescript.js

    pkg.internals.foreachReplacements = function (context) {
        var lexer = context.lexer;
        if (lexer.symbol === "break") {
            return "throw audescript.StopIteration";
        }

        if (lexer.symbol === "return" || lexer.symbol === "throw") {
            var state = lexer.save();
            var symb = lexer.nextSymbol();

            if (lexer.type === lexer.WHITESPACE) {
                if (symb.indexOf("\n") !== -1) {
                    lexer.restore(state);

                    if (lexer.symbol === "throw") {
                        return "throw"; // Syntax error
                    }

                    return "throw new audescript.ReturnValue(undefined)";
                }
                symb = lexer.nextSymbol();
            }

            lexer.restore(state);

            if (symb === ";") {
                if (lexer.symbol === "throw") {
                    return "throw"; // Syntax error
                }
                return "throw new audescript.ReturnValue(undefined)";
            }

            if (lexer.symbol === "throw") {
                return "throw new audescript.ThrowValue(" + getExpression(context, {
                    value: true,
                    constraintedVariables: context.constraintedVariables
                }) + ")";
            }

            return "throw new audescript.ReturnValue(" + getExpression(context, {
                value: true,
                constraintedVariables: context.constraintedVariables
            }) + ")";
        }

        if (lexer.symbol === "continue") {
            return "return";
        }

        return lexer.symbol;
    };

    function comprehensiveSet(context, declarationSymbol, begin, white, expr1) {
        var lexer = context.lexer;
        if (lexer.lookAhead() === "{") {
            lexer.nextChar();
            var n1 = white + getExpression(context, {
                value: true,
                endSymbols: {"," : true},
                constraintedVariables: context.constraintedVariables
            });

            lexer.nextSymbol();

            if (lexer.symbol !== ",") {
                lexer.restore(begin);
                return "";
            }

            white += lexer.getWhite();

            if (lexer.substring(lexer.curPos(), lexer.curPos() + 3) !== "...") {
                lexer.restore(begin);
                return "";
            }

            lexer.nextChar(2);

            white += lexer.getWhite();

            lexer.nextSymbol();

            if (lexer.symbol !== ",") {
                lexer.restore(begin);
                return "";
            }

            var n2 = getExpression(context, {
                constraintedVariables: context.constraintedVariables
            });

            if (lexer.nextSymbol() !== "}") {
                lexer.restore(begin);
                return "";
            }

            white += lexer.getWhite();
            lexer.nextSymbol();

            if (lexer.symbol !== ")") {
                lexer.restore(begin);
                return "";
            }

            var bf = "", ef = "", foreachBody = getExpression(context, {
                noValue: true,
                constraintedVariables: copy(context.constraintedVariables)
            });

            if (foreachBody.trim()[0] !== "{") {
                bf = "{";
                ef = "}";
            }

            declarationSymbol =
                declarationSymbol || (
                        /^[\s]*(let|var)/g.exec(expr1)
                     || ["", (context.jsFeatures.letDeclaration ? "let" : "var")]
                )[1];

            expr1 = expr1.replace(/^([\s]*)(?:let|var) */g, "$1");

            return (
                "for (" + declarationSymbol + (
                    declarationSymbol[declarationSymbol.length - 1].trim()
                        ? " "
                        : ""
                    )
                + expr1
                + (
                    expr1[expr1.length - 1].trim() ? " " : ""
                ) + "=" + n1 + "; "
                + expr1.trim() + " <= " + n2 + ";"
                + white + "++" + expr1.trim()
                + ")" + bf + foreachBody + ef
            );
        }

        return "";
    }

    pkg.internals.parseForeach = function (context) {
        var lexer   = context.lexer,
            begin   = lexer.save(),
            keyword = lexer.symbol,
            beforeParenthesis = lexer.getWhite();

        lexer.nextSymbol();

        if (lexer.symbol !== "(") {
            lexer.restore(begin);
            return keyword;
        }

        var expr1  = getExpression(context, {
            constraintedVariables: context.constraintedVariables
        });

        var inExpr = lexer.nextSymbol(), declarationSymbol = "";

        if (context.jsFeatures.iterations) {
            if (keyword === "foreach" && !expr1.match(/^[\s]*(?:let|var) ?/)) {
                expr1 = (
                    context.jsFeatures.letDeclaration
                        ? "let "
                        : "var "
                ) + pkg.utils.autoTrim(expr1);
            }
        } else {
            var key = /^[\s]*(let|var) */g.exec(expr1);

            if (key || keyword === "foreach") {
                declarationSymbol = (
                    key
                        ? key[1] + " "
                        : (
                            context.jsFeatures.letDeclaration
                                ? "let "
                                : "var "
                        )
                );
            }

            expr1 = expr1.replace(/^[\s]*(?:let|var) */g, "");
        }

        if (lexer.type === lexer.WHITESPACE) {
            expr1 += inExpr;
            inExpr = lexer.nextSymbol();
        }

        if (
            (inExpr !== "in" && inExpr !==  "of")
         || (inExpr === "in" && keyword === "for")
        ) {
            lexer.restore(begin);
            return keyword;
        }

        var c = comprehensiveSet(
            context,
            declarationSymbol,
            lexer.save(),
            lexer.getWhite(),
            expr1
        );

        if (c) {
            return c;
        }

        var expr2  = getExpression(context, {
            constraintedVariables: context.constraintedVariables
        });

        if (lexer.nextSymbol() !== ")") {
            lexer.restore(begin);
            return "for";
        }

        var foreachBody = getExpression(context, {
            inForeach: !context.jsFeatures.iterations,
            noValue: true,
            constraintedVariables: copy(context.constraintedVariables)
        });

        if (context.jsFeatures.iterations) {
            return (
                "for" + beforeParenthesis + "("
              + declarationSymbol + expr1
              + " of "
              + expr2
              + ")" + foreachBody
            );
        }

        var  bf = "", ef = "";
        if (foreachBody.trim()[0] === "{") {
            if (!declarationSymbol && keyword !== "foreach") {
                foreachBody = foreachBody.replace(
                    /([\s]*)\{/,
                    "$1{" + expr1.replace(/\$/g, "$$$$") + "=arguments[0];"
                );
            }
        } else {
            if (!declarationSymbol && keyword !== "foreach") {
                bf = "{" + expr1 + "=arguments[0];";
            } else {
                bf = "{";
            }
            ef = "}";
        }

        return (
            "try{(" + expr2 + ").forEach" + beforeParenthesis
            + "(function ("
            + ((declarationSymbol || keyword === "foreach") ? expr1 : "")
            + ")" + bf
            + foreachBody
            + ef + ")}catch (e) {if (e instanceof audescript.ThrowValue) {throw "
            + (context.inForeach ? "e" : "e.v")
            + ";}else if (e instanceof audescript.ReturnValue) {"
            + (context.inForeach ? "throw e" : "return e.v") + ";}}"
        );
    };
}((typeof exports !== "undefined" && exports) || this.audescript));
