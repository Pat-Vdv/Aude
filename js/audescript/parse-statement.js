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

    var getExpression       = pkg.internals.getExpression;       // removed in audescript.js
    var parseStatementAfter = pkg.internals.parseStatementAfter; // removed in audescript.js
    var copy                = pkg.utils.copy;                    // removed in audescript.js

    function tryEnd(context, begin) {
        // stop condition
        if (
            (context.lexer.type === context.lexer.END)
         || (context.endSymbols && context.endSymbols.hasOwnProperty(context.lexer.symbol))
         || ")]}".indexOf(context.lexer.symbol) !== -1
        ) {
            /* case : we are at the end of an expression */
            context.lexer.restore(begin);
            return -1;
        }
        return false;
    }

    function tryBrace(context) {
        var lexer = context.lexer;
        if (lexer.symbol === "{") {
            var begin  = lexer.save();
            var obj = false, oneVal = true;
            var pres = "";

            if (!context.noSetOrObj) {
                do {
                    if (pres) {
                        pres += ",";
                        oneVal = false;
                    }

                    pres += getExpression(context, {
                        value: true,
                        constraintedVariables: context.constraintedVariables
                    }) + lexer.getWhite();
                    lexer.nextSymbol();

                    if (lexer.symbol === ":") {
                        obj = true;
                        pres += lexer.symbol + getExpression(context, {
                            value: true,
                            commaAllowed: false,
                            constraintedVariables: context.constraintedVariables
                        }) + lexer.getWhite();
                        lexer.nextSymbol();
                    }
                } while (lexer.symbol === ",");
            }

            if (!context.noSetOrObj
             && lexer.symbol === "}"
             && !lexer.substring(
                    begin.curPos() - 1,
                    lexer.curPos()
                ).match(/^\{[\s]*\}$/)
            ) {
                return (
                    (obj || (context.noValue && oneVal))
                        ? "{" + pres + "}"
                        : parseStatementAfter(context, "to_set([" + pres + "])")
                );
            }

            lexer.restore(begin);
            return parseStatementAfter(context, "{" + pkg.internals.parseStatements({
                constraintedVariables: copy(context.constraintedVariables),
                endSymbols: { "}": true },
                lexer: context.lexer,
                inForeach: context.inForeach,
                includes: context.includes,
                jsFeatures: context.jsFeatures,
                enforceReturnType: context.enforceReturnType
            }) + lexer.nextSymbol() /* "}" */);
        }
        return false;
    }

    function tryArrayLitteral(context) {
        if (context.lexer.symbol === "[") {
            return parseStatementAfter(context, "[" + getExpression(context, {
                commaAllowed: true,
                constraintedVariables: context.constraintedVariables,
                endSymbols: {
                    "]": true
                }
            }) + context.lexer.nextSymbol() /* "]" */);
        }
        return false;
    }

    function tryParenthesis(context) {
        var lexer = context.lexer;
        if (lexer.symbol === "(") {
            var begin = lexer.save();
            if (context.inForParenthesis) {
                var iter = "", comp = "";

                var decl = getExpression(context, {
                    inForeach: false,
                    constraintedVariables: context.constraintedVariables
                }) + lexer.getWhite();

                if (decl) {
                    comp = getExpression(context, {
                        inForeach: false,
                        constraintedVariables: context.constraintedVariables
                    }) + lexer.getWhite();

                    if (comp) {
                        // we allow the comma operator here in this
                        // specific context (iteration part of the for loop)
                        iter = getExpression(context, {
                            inForeach: false,
                            commaAllowed: true,
                            constraintedVariables: context.constraintedVariables
                        }) + lexer.getWhite();
                    }
                }

                if (lexer.nextSymbol() === ")") {
                    return parseStatementAfter(context,  "(" + decl + comp + iter + ")");
                }
                lexer.restore(begin);
                return false;
            }

            var o = {
                commaAllowed: true,
                constraintedVariables: context.constraintedVariables,
                value: true,
                endSymbols: {")": true}
            };

            var res = "(" + getExpression(context, o) + lexer.nextSymbol(); // ")"
            if (o.gotComma && !context.noTuple) {
                res = " Tuple" + res;
            }
            return parseStatementAfter(context, res);
        }
        return false;
    }

    function tryNewDeleteTypeof(context) {
        var lexer = context.lexer;
        if (
            lexer.symbol === "new"
         || lexer.symbol === "typeof"
         || (!context.value && lexer.symbol === "delete")
        ) {
            return parseStatementAfter(context, lexer.symbol + getExpression(context, {
                onlyOneValue: true,
                commaAllowed: context.commaAllowed,
                constraintedVariables: context.constraintedVariables,
                endSymbols: context.endSymbols
            }));
        }
        return false;
    }

    function tryEmptySet(context) {
        var lexer = context.lexer;

        if (lexer.symbol === "emptySet") {
            var res = lexer.getWhite() + "new Set(";
            var begin = lexer.save();

            if (lexer.nextSymbol() === "(") {
                var constraint = pkg.internals.getConstraintString(context);
                if (lexer.nextSymbol() === ")") {
                    if (constraint) {
                        res += "{typeConstraint:" + constraint + "}";
                    }
                } else {
                    lexer.restore(begin);
                }
            } else {
                lexer.restore(begin);
            }

            return parseStatementAfter(context, res + ")");
        }
        return false;
    }

    function tryPunct(context, begin) {
        var lexer = context.lexer;

        if (lexer.symbol === ";") {
            if (context.value) {
                lexer.restore(begin);
                return -1;
            }
            return lexer.symbol;
        }

        if (lexer.symbol === ",") {
            if (!context.commaAllowed) {
                lexer.restore(begin);
                return -1;
            }

            return "," + getExpression(context, {
                value: context.value,
                commaAllowed: true,
                endSymbols: context.endSymbols,
                constraintedVariables: context.constraintedVariables
            });
        }

        if (lexer.symbol === "!") {
            return "!" + getExpression(context, {
                value: context.value,
                constraintedVariables: context.constraintedVariables,
                onlyOneValue: context.onlyOneValue
            });
        }

        return false;
    }

    function functionBody(context, s, typedArgs) {
        var before = "",
            after  = "";

        if (typedArgs) {
            before = "{";
            after = "}";
            for (var arg in typedArgs) {
                if (typedArgs.hasOwnProperty(arg)) {
                    before += "audescript.ct(" + arg + "," + typedArgs[arg] + ");";
                }
            }
        }

        if (!context.jsFeatures.abbreviatedFunction && s.trim()[0] !== "{") {
            return before + "{return " + s + "}" + after;
        }

        return before + s + after;
    }

    function checkReturn(context, symbol, expr) {
        if (symbol === "return" && context.enforceReturnType) {
            return "audescript.ct(" + expr + "," + context.enforceReturnType + ")";
        }
        return expr;
    }

    function tryInstruction(context, begin) {
        var symbol = context.lexer.symbol;

        if (
            symbol === "return"
         || symbol === "throw"
         || symbol === "break"
         || symbol === "continue"
        ) {
            if (context.value) {
                context.lexer.restore(begin);
                return -1;
            }

            var kw;

            if (context.inForeach) {
                kw = pkg.internals.foreachReplacements(context);
            } else {
                kw = symbol;
            }

            return kw + context.lexer.getWhite() + checkReturn(context, symbol, getExpression(context, {
                constraintedVariables: context.constraintedVariables
            }));
        }

        return false;
    }

    function tryInstructionBlock(context, begin) {
        var lexer  = context.lexer,
            symbol = lexer.symbol,
            state;

        if (symbol === "function") {
            // can also be a value
            state = lexer.save();

            var functionReturnType = null;
            var functionName = lexer.getWhite() + lexer.nextSymbol();

            if (functionName.trim() === "(") {
                functionName = functionName.slice(0, -1);
                lexer.i--;
            }


            if (lexer.nextSymbol() === "(") {
                var parameters = "(";
                var typedArgs = {};
                var argName;
                while (!lexer.end() && lexer.symbol !== ")") {
                    parameters += lexer.getWhite();
                    lexer.nextSymbol();
                    if (lexer.type === lexer.VARIABLE) {
                        argName = lexer.symbol;
                        parameters += lexer.symbol + lexer.getWhite(true);
                        lexer.nextSymbol();
                        if (lexer.symbol === ":") {
                            parameters += lexer.getWhite(true);
                            typedArgs[argName] = pkg.internals.getConstraintString(context);
                        }
                    } else {
                        context.lexer.restore(begin);
                        return -1;
                    }

                    parameters += lexer.getWhite(true);
                    lexer.nextSymbol();
                    if (lexer.symbol === ",") {
                        parameters += "," + lexer.getWhite();
                    } else if (lexer.symbol !== ")") {
                        context.lexer.restore(begin);
                        return -1;
                    }
                }
                parameters += ")" + lexer.getWhite();
                var save = lexer.save();
                lexer.nextSymbol();
                if (lexer.symbol === ":") {
                    parameters += lexer.getWhite(true);
                    functionReturnType = pkg.internals.getConstraintString(context);
                } else {
                    lexer.restore(save);
                }
                return (
                    symbol
                  + functionName
                  + parameters
                  + functionBody(
                        context,
                        getExpression(context, {
                            inForeach: false,
                            constraintedVariables: copy(context.constraintedVariables),
                            enforceReturnType: functionReturnType,
                            endSymbols: {";": true},
                            noSetOrObj: true
                        }),
                        typedArgs
                    )
                );
            } else {
                context.lexer.restore(begin);
                return -1;
            }
        }

        if (
            symbol === "if"
         || symbol === "else"
         || symbol === "do"
         || symbol === "while"
         || symbol === "for"
         || symbol === "switch"
         || symbol === "try"
         || symbol === "catch"
         || symbol === "finally"
        ) {
            if (context.value) {
                lexer.restore(begin);
                return -1;
            }


            if (symbol === "catch") {
                return symbol + getExpression(context, {
                    inForeach: false,
                    noTuple: true,
                    constraintedVariables: context.constraintedVariables
                }) + functionBody(context, getExpression(context, {
                    inForeach: false,
                    constraintedVariables: copy(context.constraintedVariables),
                    noSetOrObj: true
                }));
            }

            if (symbol === "try" || symbol === "finally") {
                return symbol + getExpression(context, {
                    constraintedVariables: copy(context.constraintedVariables),
                    noSetOrObj: true
                });
            }

            var tmp;

            if (
                symbol === "for"
             && !context.jsFeatures.iterations
             && (tmp = pkg.internals.parseForeach(context)) !== "for"
            ) {
                return tmp;
            }

            if (symbol === "do") {
                if (context.value) {
                    lexer.restore(begin);
                    return -1;
                }

                tmp = symbol + getExpression(context, {
                    inForeach: false,
                    constraintedVariables: copy(context.constraintedVariables),
                    noValue: true
                }) + lexer.getWhite();

                var symbol2 = lexer.nextSymbol();
                state = lexer.save();

                if (symbol2 === "while") {
                    return tmp + symbol2 + getExpression(context, {
                        constraintedVariables: copy(context.constraintedVariables)
                    });
                }

                lexer.restore(state);
                return tmp;
            }

            if (symbol === "else") {
                if (context.value) {
                    lexer.restore(begin);
                    return -1;
                }

                return symbol + getExpression(context, {
                    noValue: true,
                    constraintedVariables: copy(context.constraintedVariables)
                });
            }

            return symbol + getExpression(context, {
                inForeach: false,
                inForParenthesis: symbol === "for",
                blockComma: true,
                constraintedVariables: context.constraintedVariables
            }) + getExpression(context, {
                inForeach: (
                    symbol === "while" || symbol === "for" || symbol === "switch"
                )   ? false
                    : context.inForeach,
                constraintedVariables: copy(context.constraintedVariables),
                noValue: true
            });
        }

        return false;
    }

    function tryVariableDeclaration(context, begin) {
        var lexer   = context.lexer,
            keyword = lexer.symbol;

        if (lexer.type !== lexer.INSTRUCTION) {
            return false;
        }

        if (context.value) {
            lexer.restore(begin);
            return -1;
        }

        if (keyword === "const" || keyword === "let" || keyword === "var") {
            var state;
            if (keyword === "let") {
                state = lexer.save();
                lexer.getWhite();
                lexer.nextSymbol();
                lexer.restore(state);
                if (lexer.symbol === "(") {
                    var letVars = getExpression(context, {
                        noTuple: true,
                        onlyOneValue: true,
                        constraintedVariables: context.constraintedVariables
                    }) + lexer.nextSymbol();
                    var state2 = lexer.save();
                    lexer.getWhite();
                    if (lexer.lookAhead() !== "=") {
                        lexer.restore(state2);
                        if (context.jsFeatures.letExpression) {
                            return "let" + letVars + getExpression(context, {
                                constraintedVariables: copy(context.constraintedVariables)
                            });
                        }

                        return (
                            "(function () {var "
                          + letVars.replace(/^([\s]*)\(([\s\S]+)\)([\s]*)$/, "$1$2$3")
                          + ";" + getExpression(context, {
                                constraintedVariables: copy(
                                    context.constraintedVariables
                                )
                            }) + "})()"
                        );
                    }
                }
                lexer.restore(state);
                // regular let, handling just after this.
            }

            var listOfVals,
                semicolonExpected = false,
                vars,
                val,
                addToConsts = keyword === "const" && !context.jsFeatures.constDeclaration;

            var decl = "";

            if (addToConsts || keyword === "let") {
                // Here, const is not supported
                keyword = context.jsFeatures.letDeclaration ? "let" : "var";
            }

            var tmp = "", white = "";

            do {
                vars = lexer.getWhite() + getExpression(context, {
                    onlyOneValue: true,
                    noTuple: true,
                    constraintedVariables: context.constraintedVariables
                }) + lexer.getWhite();

                state = lexer.save();
                lexer.nextSymbol();

                if (lexer.symbol === "=") {
                    val = getExpression(context, {
                        constraintedVariables: context.constraintedVariables,
                        value: true
                    });

                    state = lexer.save();
                    white  = lexer.getWhite();
                    lexer.nextSymbol();
                } else {
                    val = "";
                }

                if (!context.jsFeatures.destructuring || addToConsts) {
                    // destructuring
                    listOfVals = [];
                    pkg.destruct(null, vars, listOfVals);
                }

                if (
                    val && "[{(".indexOf(vars.trim()[0]) !== -1
                 && (
                    !context.jsFeatures.destructuring || "(".indexOf(vars.trim()[0]) !== -1
                 )
                ) {
                    if (decl) {
                        tmp += (semicolonExpected ? ";" : "") + decl + ";";
                        decl = "";
                    }

                    tmp += (
                        keyword + " " + listOfVals.toString() + ";"
                      + pkg.destructToJS(
                          vars,
                          val,
                          listOfVals,
                          context.constraintedVariables
                      ) + white
                    );
                    semicolonExpected = true;
                } else if (decl) {
                    decl += "," + vars + (val ? "=" + val : "") + white;
                } else {
                    decl = (
                        keyword
                     + (vars[0].trim() ? " " : "")
                     + vars + (val ? "=" + val : "") + white
                    );
                }

                if (addToConsts) {
                    for (var i = 0, len = listOfVals.length; i < len; ++i) {
                        if (listOfVals.hasOwnProperty(i)) {
                            context.constraintedVariables.consts.add(listOfVals[i]);
                        }
                    }
                }
            } while (lexer.symbol === ",");

            if (lexer.symbol === ";") {
                return tmp + (semicolonExpected ? ";" : "") + decl + ";";
            }

            lexer.restore(state);
            return tmp + (semicolonExpected ? ";" : "") + decl;
        }

        lexer.restore(begin);
        return -1;
    }

    function tryForeach(context, begin) {
        if (context.lexer.symbol === "foreach") {
            if (context.value) {
                context.lexer.restore(begin);
                return -1;
            }
            return pkg.internals.parseForeach(context);
        }
        return false;
    }

    function tryInclude(context, begin) {
        var lexer = context.lexer;
        if (lexer.symbol === "include") {
            var res = lexer.getWhite(), inc = lexer.nextSymbol();
            if (context.includes) {
                context.includes.push(inc);
            }
            res += lexer.getWhite();
            begin = lexer.save();

            if (lexer.nextSymbol() === ";") {
                return res + lexer.getWhite();
            }

            lexer.restore(begin);
            return res;
        }
        return false;
    }


    function tryOther(context) {
        return parseStatementAfter(context, context.lexer.symbol); // ?? (string, number, litteral, ... ?)
    }


    function parseStatement(context) {
        if (!context.noWhite) {
            context.noWhite = true;
            return context.lexer.getWhite() + parseStatement(context);
        }

        var begin = context.lexer.save();
        context.lexer.nextSymbol();

        var tmpRes =
                tryEnd(context, begin)                 ||
                tryBrace(context)                      ||
                tryArrayLitteral(context)              ||
                tryParenthesis(context)                ||
                tryNewDeleteTypeof(context)            ||
                tryEmptySet(context)                   ||
                tryPunct(context, begin)               ||
                tryForeach(context, begin)             ||
                tryInstruction(context, begin)         ||
                tryInstructionBlock(context, begin)    ||
                tryInclude(context, begin)             ||
                tryVariableDeclaration(context, begin) ||
                tryOther(context);

        if (tmpRes === -1) {
            // parsing failed
            return "";
        }

        return tmpRes;
    }

    pkg.internals.parseStatement = parseStatement;
}((typeof exports !== "undefined" && exports) || this.audescript));
