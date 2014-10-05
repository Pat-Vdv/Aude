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
    var parseStatementAfter;

    function tryComma(context, white, begin, res) {
        if (context.lexer.symbol === ",") {
            if (!context.commaAllowed) {
                context.lexer.restore(begin);
                return res + white;
            }

            context.gotComma = true;
            return res + white + "," + getExpression(context, {
                value: context.value,
                commaAllowed: true,
                endSymbols: context.endSymbols,
                constraintedVariables: context.constraintedVariables
            });
        }
        return false;
    }

    function trySemicolon(context, white, begin, res) {
        if (context.lexer.symbol === ";") {
            if (context.value) {
                context.lexer.restore(begin);
                return res + white;
            }
            return res + white + context.lexer.symbol + context.lexer.getWhite();
        }
        return false;
    }

    function tryColon(context, white, begin, varName) {
        var lexer = context.lexer;
        if (lexer.symbol === ":") {
            if (context.value) {
                lexer.restore(begin);
                return varName + white; // syntax error
            }


            var tmp, white2, matches, constraint, typeOfVar, defaultValue;

            matches = /([\s]*)[\S]+/g.exec(varName);
            varName = varName.trim();

            if (matches && lexer.isIdentifier(varName)) {
                // variable declaration
                defaultValue = "";
                lexer.nextSymbol();

                if (lexer.type === lexer.WHITESPACE) {
                    if (lexer.symbol.match("\n")) {
                        lexer.restore(begin);
                        return false;
                    }
                    tmp += lexer.symbol;
                    lexer.nextSymbol();
                }

                context.constraintedVariables.type.add(varName);
                tmp = matches[1] + (
                    context.jsFeatures.letDeclaration
                        ? "let "
                        : "var "
                ) + varName + white + "=";

                var restore;

                if (lexer.type === lexer.VARIABLE) {
                    typeOfVar = lexer.symbol;
                    white  = lexer.getWhite(true);
                    var beforeSymbol = lexer.save();
                    lexer.nextSymbol();

                    if (lexer.symbol === "=") {
                        defaultValue = getExpression(context, {
                            value: true,
                            constraintedVariables: context.constraintedVariables
                        });
                    } else {
                        lexer.restore(beforeSymbol);
                    }

                    switch (typeOfVar.toLowerCase()) {
                    case "integer":
                    case "int":
                        tmp += (
                            defaultValue
                                ? ("audescript.as(0," + defaultValue + ", true)")
                                : "0"
                        );
                        context.constraintedVariables.type.add("0" + varName);
                        break;
                    case "list":
                    case "array":
                    case "table":
                        tmp += (
                            defaultValue
                                ? ("audescript.as([]," + defaultValue + ")")
                                : "[]"
                        );
                        break;
                    case "state":
                        context.constraintedVariables.type.remove(varName);
                        tmp += defaultValue || "''";
                        break;
                    case "string":
                        tmp += (
                            defaultValue
                                ? ("audescript.as(''," + defaultValue + ")")
                                : "''"
                        );
                        break;
                    case "bool":
                    case "boolean":
                        tmp += (
                            defaultValue
                                ? ("audescript.as(false," + defaultValue + ")")
                                : "false"
                        );
                        break;
                    case "automaton":
                        tmp += (
                            defaultValue
                                ? "audescript.as(new Automaton," + defaultValue + ")"
                                : "new Automaton"
                        );
                        break;
                    case "function":
                        tmp += (
                            defaultValue
                                ? "audescript.as(function () {}," + defaultValue + ")"
                                : "function () {}"
                        );
                        break;
                    case "mappingfunction":
                        tmp += defaultValue || "getMappingFunction()";
                        break;
                    case "set":
                        if (defaultValue) {
                            tmp += (
                                (defaultValue.trim().substr(0, 7) === "to_set(")
                                    ? defaultValue
                                    : "to_set(" +  defaultValue + ")"
                            );
                        } else {
                            tmp   += "new Set()";
                            white2 = lexer.getWhite(true);
                            restore = lexer.save();
                            lexer.nextSymbol();
                            if (lexer.symbol === "of") {
                                constraint = pkg.internals.getConstraintString(context);

                                if (constraint) {
                                    tmp += ";" + white2 + varName + ".setTypeConstraint(" + constraint + ")";
                                } else {
                                    lexer.restore(begin);
                                    return varName + white;
                                }

                                tmp += lexer.getWhite(true);
                                restore = lexer.save();
                                lexer.nextSymbol();

                                if (lexer.symbol === "=") {
                                    tmp += ";" + varName + ".unionInPlace(" + getExpression(context, {
                                        value: true,
                                        constraintedVariables: context.constraintedVariables
                                    }) + ")";
                                } else {
                                    lexer.restore(restore);
                                }
                            } else {
                                white += white2;
                                lexer.restore(restore);
                            }
                        }
                        break;
                    default:
                        tmp += "new " + typeOfVar;
                    }

                    tmp += white;
                } else {
                    lexer.restore(begin);
                    return false;
                }

                white = lexer.getWhite();
                restore = lexer.save();
                lexer.nextSymbol();

                // we don't include res here as it is in tmp
                if (lexer.symbol === ";") {
                    return tmp + white + lexer.symbol;
                }

                lexer.restore(restore);
                return tmp + white;
            }

            lexer.restore(begin);

            return varName + white;
        }
        return false;
    }

    function tryDotAfter(context, white, begin, res) {
        var lexer = context.lexer;
        if (lexer.symbol === ".") {
            return parseStatementAfter(
                context,
                res + white + "." + lexer.getWhite() + lexer.nextSymbol(context)
            );
        }
        return false;
    }

    function tryInterro(context, white, begin, res) {
        var lexer = context.lexer;
        if (lexer.symbol === "?") {
            if (context.onlyOneValue) {
                lexer.restore(begin);
                return res + white;
            }

            var o = {
                value: true,
                constraintedVariables: context.constraintedVariables
            };

            return pkg.internals.handleOperator(context, {
                op: "?",
                left: pkg.utils.autoTrim(res),
                white: white,
                not: "",
                alphaOp: false,
                ifTrueExpression: getExpression(context, o),
                colon: lexer.getWhite() + lexer.nextSymbol() + lexer.getWhite(),
                ifFalseExpression: getExpression(context, o)
            });
        }
        return false;
    }

    function tryBracketParen(context, white, begin, res) {
        if (context.lexer.symbol === "[") {
            return parseStatementAfter(context,
                res + white + "[" + getExpression(context, {
                    constraintedVariables: context.constraintedVariables,
                    endSymbols: {"]": true}
                }) + context.lexer.nextSymbol()
            ); // symbol should be "]"
        }

        if (context.lexer.symbol === "(") {
            return parseStatementAfter(context,
                res + white + "(" + getExpression(context, {
                    constraintedVariables: context.constraintedVariables,
                    commaAllowed: true,
                    endSymbols: {")": true}
                }) + context.lexer.nextSymbol()
            ); // symbol should be ")"
        }

        return false;
    }

    function tryArrowFunction(context, white, begin, args) {
        var lexer = context.lexer;
        var oldType = begin.lastSignificantType;
        if (lexer.symbol === "=>"  && (oldType & (lexer.VARIABLE | lexer.CLOSEPAREN))) {
            var expr = lexer.getWhite(!context.jsFeatures.arrowFunction) + getExpression(context, {
                constraintedVariables: pkg.utils.copy(context.constraintedVariables)
            });

            if (context.jsFeatures.arrowFunction) {
                return white + args + "=>" + expr;
            }

            return white + "function" +
                    (oldType === lexer.CLOSEPAREN ? args : "(" + args + ")") +
                    (expr.trim()[0] === "{" ? expr : "{return " + expr + "}");
        }
        return false;
    }

    function tryOperation(context, white, begin, res) {
        var lexer = context.lexer,
            type = lexer.type,
            symbol = lexer.symbol;

        if (type === lexer.OPERATOR) {
            if (context.onlyOneValue && symbol !== "!") {
                lexer.restore(begin);
                return res + white;
            }

            if (
                symbol[symbol.length - 1] === "="
             && symbol !== ">="
             && symbol !== "<="
             && symbol !== "==="
             && symbol !== "=="
             && symbol !== "!="
             && symbol !== "!=="
            ) {
                var trimRes, newVal;
                trimRes = res.trim();
                newVal  = getExpression(context, {
                    value: true,
                    constraintedVariables: context.constraintedVariables
                });

                if (
                    (
                        !context.jsFeatures.destructuring
                     && (trimRes[0] === "{" || trimRes[0] === "[")
                    )
                 || trimRes[0] === "("
                ) {
                    return (
                        res + white
                      + pkg.destructToJS(res, newVal, null, context.constraintedVariables)
                      + parseStatementAfter(context)
                    );
                }

                if (context.constraintedVariables.type.contains(trimRes)) {
                    context.immediatlyReturn = true;
                    if (symbol.length > 1) {
                        return (
                            white + res
                          + "=audescript.as("
                              + trimRes
                              + ","
                              + trimRes + symbol.substr(0, symbol.length - 1)
                              + newVal
                              + ","
                              + (
                                  context.constraintedVariables.type.contains("0" + trimRes)
                                      ? "true"
                                      : "false"
                              )
                          + ")" + parseStatementAfter(context)
                        );
                    }

                    return (
                        white + res
                      + "=audescript.as("
                          + trimRes
                          + ","
                          +  newVal
                          + ","
                          + (
                              context.constraintedVariables.type.contains("0" + trimRes)
                                  ? "true"
                                  : "false"
                          )
                      + ")" + parseStatementAfter(context)
                    );
                }

                if (!context.jsFeatures.const && context.constraintedVariables.consts.contains(trimRes)) {
                    context.immediatlyReturn = true;
                    return (
                        white + res.replace(/[\S]+/g, "")
                      + pkg.internals.constError(trimRes)
                      + newVal.replace(/[\S]+/g, "")
                      + parseStatementAfter(context)
                    );
                }

                return res + white + symbol + newVal + parseStatementAfter(context);
            }

            var o = {
                acceptOperator: true,
                value: true,
                noWhite: true,
                constraintedVariables: context.constraintedVariables
            };

            return pkg.internals.handleOperator(context, {
                op: symbol,
                alphaOp: false,
                left: pkg.utils.autoTrim(res),
                white: white,
                not: "",
                beforeRight: lexer.getWhite(),
                right: getExpression(context, o)
            });
        }
        return false;
    }

    // we normalize operators with this table
    var alphaOperatorRenames = {
        "u":          "union",
        "m":          "minus",
        "n":          "inter",
        "x":          "cross",
        "symdiff":    "sym_diff",
        "subsetof":   "subset_of",
        "element_of": "belongs_to",
        "elementof":  "belongs_to",
        "belongsto":  "belongs_to",
        "haskey":     "has_key"
    };

    function tryAlphaOperator(context, white, begin, res) {
        var lexer  = context.lexer,
            symbol = lexer.symbol.toLowerCase();

        var not = "";
        if (symbol && symbol[0] === "!") {
            not = "!";
            symbol = symbol.substr(1);

            if (alphaOperatorRenames.hasOwnProperty(symbol)) {
                symbol = alphaOperatorRenames[symbol];
            }

            if (
                symbol !== "contains"
             && symbol !== "subset_of"
             && symbol !== "belongs_to"
             && symbol !== "has_key"
            ) {
                // only these alpha operators can be negated
                context.lexer.restore(begin);
                return res + white;
            }
        } else if (alphaOperatorRenames.hasOwnProperty(symbol)) {
            symbol = alphaOperatorRenames[symbol];
        }

        if (
            symbol === "inter"
         || symbol === "union"
         || symbol === "cross"
         || symbol === "minus"
         || symbol === "contains"
         || symbol === "subsetof"
         || symbol === "belongs_to"
         || symbol === "has_key"
         || symbol === "sym_diff"
        ) {

            var maybeBeforeEqualSign = lexer.save();
            var white2  = lexer.getWhite(true);
            var symbol2 = lexer.nextSymbol();

            if (lexer.type === lexer.OPERATOR) {
                if (
                    symbol2 !== "="
                 || symbol === "contains"
                 || symbol === "has_key"
                 || symbol === "subset_of"
                 || symbol === "belongs_to"
                 || symbol === "sym_diff"
                 || symbol === ""
                ) {
                    // syntax error (?)
                    lexer.restore(begin);
                    return res + white;
                }

                return (
                    res + "." + symbol + "InPlace("
                  + (white === " " ? "" : white) + white2
                  + getExpression(context, {
                        value: true,
                        constraintedVariables: context.constraintedVariables
                    })
                  + ")"
                );
            }

            // white2 is not relevant anymore
            lexer.restore(maybeBeforeEqualSign);

            var o = {
                value: true,
                noWhite: true,
                acceptOperator: true,
                constraintedVariables: context.constraintedVariables
            };

            return pkg.internals.handleOperator(context, {
                op: symbol,
                left: pkg.utils.autoTrim(res),
                white: white,
                not: not,
                beforeRight: lexer.getWhite(),
                right: getExpression(context, o),
                alphaOp: true
            });
        }
        return false;
    }

    function tryFail(context, white, begin, res) {
        context.lexer.restore(begin);
        return res + white;
    }

    function tryEndAfter(context, white, begin, res) {
        if (context.lexer.type === context.lexer.END || (context.endSymbols && context.endSymbols.hasOwnProperty(context.lexer.symbol))) {
            context.lexer.restore(begin);
            return res + white;
        }
        return false;
    }

    parseStatementAfter = function (context, res) {
        if (typeof res !== "string") {
            res = "";
        }

         if (res.trim() && context.onlyOneValue) {
             return res;
         }

        var lexer   = context.lexer,
            white   = lexer.getWhite(),
            begin   = lexer.save();

        lexer.nextSymbol();

        return (
            tryEndAfter(context, white, begin, res)      ||
            tryComma(context, white, begin, res)         ||
            trySemicolon(context, white, begin, res)     ||
            tryColon(context, white, begin, res)         ||
            tryDotAfter(context, white, begin, res)      ||
            tryInterro(context, white, begin, res)       ||
            tryArrowFunction(context, white, begin, res) ||
            tryBracketParen(context, white, begin, res)  ||
            tryOperation(context, white, begin, res)     ||
            tryAlphaOperator(context, white, begin, res) ||
            tryFail(context, white, begin, res)
        );
    };

    pkg.internals.parseStatementAfter = parseStatementAfter;
}((typeof exports !== "undefined" && exports) || this.audescript));
