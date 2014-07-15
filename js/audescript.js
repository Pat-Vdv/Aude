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

/*jslint indent: 4, nomen: true, ass: true, vars: true, evil: true, plusplus: true, eqeq: true, todo: true, bitwise: true */
/*jshint -W043 */
/*eslint no-eval:0*/
/*global Tuple:false, Set:false, Automaton:false, Transition:false */
// NEEDS automata.js, set.js

(function (pkg, that) {
    "use strict";

    var _ = pkg.Audescriptl10n = that.libD && that.libD.l10n ? that.libD.l10n() : function (s) { return s; };

    if (!pkg.Audescript) {
        pkg.Audescript = {};
    }

    // things needed to execute Audescript code.
    pkg.Audescript.StopIteration = {};
    pkg.Audescript.ReturnValue = function (v) {
        this.v = v;
    };
    pkg.Audescript.ThrowValue = function (v) {
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
    } catch (ignore) {}

    if (typeof that.Packages !== "object" || String(that.Packages) !== "[JavaPackage ]") {
        // disable this feature detection in rhino as it crashes it
        try {
            abbreviatedFunctionSupported = eval("(function () true)()");
        } catch (ignore) {}
    }

    try {
        letExpressionSupported  = eval("(function () {var a=1, t; let (a=2) {if (a === 2) {t = true}}; return t && a === 1;})();");
    } catch (ignore) {}

    try {
        letDeclarationSupported = eval("(function () {var a=1, t; if (true) {let a = 2;t = a === 2} return t && a === 1;})();");
    } catch (ignore) {}

    try {
        constSupported          = eval("(function () {const a=1; try{a=2;} catch (e) {return true;} return false;})();");
    } catch (ex) {
        if (ex instanceof TypeError) {
            constSupported = true;
        }
    }

    try {
        IterationsSupported     = eval("(function () {for (let i of [1,2]) {} return true;})()");
    } catch (ignore) {}

    try {
        destructuringSupported = eval("(function () {var [a,b,c] = [1,2,3]; return a === 1 && b === 2 && c === 3})()");
    } catch (ignore) {}

    try { // eval to allow parsing of the file even in browsers not supporting yield.
        eval(
            "Object.defineProperty(Object.prototype, 'iterator', {"
                +     "enumerable:false,"
                +     "writable: true,"
                +     "configurable: true,"
                +     "value: function () {"
                +         "for (var i in this) {"
                +             "if (this.hasOwnProperty(i)) {"
                +                 "yield this[i];"
                +             "}"
                +         "}"
                +         "return;"
                +     "}"
                + "});"
        );
    } catch (ignore) {}

    function destructNext(s, i, end, dontCheck) {
        while (!s[i].trim()) {
            ++i;
        }

        if (!dontCheck) {
            if (s[i] === ",") {
                return i + 1;
            }

            if (s[i] !== "," && s[i] !== end) {
                throw new Error("Malformed destructing string");
            }
        }
        return i;
    }

    function destructArray(e, destructStr, res, i, end) {
        ++i;
        var k = 0;
        while (destructStr[i] !== end) {
            i = destructNext(destructStr, i, "", true);
            if (destructStr[i] !== ",") {
                i = pkg.Audescript.destruct((e || [])[k], destructStr, res, true, i);
            }
            i = destructNext(destructStr, i, end);
            ++k;
        }
        if (destructStr[i] !== end) {
            throw new Error("Malformed destructing string");
        }
        return i + 1;
    }

    function destructObject(e, destructStr, res, i) {
        ++i;
        var key, endObject, start;
        while (destructStr[i] !== "}") {
            i = destructNext(destructStr, i, "", true);

            if (destructStr[i] === "\"" || destructStr[i] === "'") {
                endObject = destructStr[i];
                start = i++;
                while (destructStr[i] && destructStr[i] !== endObject) {
                    if (destructStr[i] === "\\") {
                        ++i;
                    }
                    ++i;
                }
                if (!destructStr[i]) {
                    throw new Error("Malformed destructing string");
                }
                key = eval(destructStr.substring(start, ++i));
            } else {
                start = i;
                while (destructStr[i] !== ":" && destructStr[i].trim()) {
                    ++i;
                }
                key = destructStr.substring(start, i);
            }

            i = destructNext(destructStr, i, "", true);
            if (destructStr[i] !== ":") {
                throw new Error("Malformed destructing string");
            }
            ++i;
            i = destructNext(destructStr, i, "", true);
            i = pkg.Audescript.destruct((e || {})[key], destructStr, res, true, i);
            i = destructNext(destructStr, i, "}");
        }
        if (destructStr[i] !== "}") {
            throw new Error("Malformed destructing string");
        }
        return i + 1;
    }

    function constError(variable) {
        return "(function () {throw new Error('TypeError: " + variable + " is read-only');})()";
    }

    function destructToJS(variable, newVal, listOfVals, constraintedVariables) {
        if (!listOfVals) {
            listOfVals = [];
            pkg.Audescript.destruct(null, variable, listOfVals);
        }

        var resToString = "'" + variable.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\\n") + "'";
        var ret = "(function () {Audescript.des=Audescript.destruct(" + newVal + "," + resToString + ");";
        var index, lovLen;

        for (index = 0, lovLen = listOfVals.length; index < lovLen; ++index) {
            if (listOfVals.hasOwnProperty(index)) {
                if (constraintedVariables.consts.contains(listOfVals[index])) {
                    ret += constError(listOfVals[index]) + ";";
                } else if (constraintedVariables.type.contains(listOfVals[index])) {
                    ret += listOfVals[index] + "=Audescript.as(" + listOfVals[index] + ", Audescript.des." + listOfVals[index] + ");";
                } else {
                    ret += listOfVals[index] + "=Audescript.des." + listOfVals[index] + ";";
                }
            }
        }
        return ret + "Audescript.des=null;})()";
    }

    pkg.Audescript.destruct = function (e, destructStr, res, returnCurrentIndex, i) {
        if (!res) {
            res = {};
        }

        i = destructNext(destructStr, i || 0, "", true);

        if (destructStr[i] === "[" || destructStr[i] === "(") {
            i = destructArray(e, destructStr, res, i, destructStr[i] === "[" ? "]" : ")");
        } else if (destructStr[i] === "{") {
            i = destructObject(e, destructStr, res, i);
        } else {
            var j = i++;
            while (destructStr[i] && ",]})".indexOf(destructStr[i]) === -1) {
                ++i;
            }

            if (res instanceof Array) {
                res.push(destructStr.substring(j, i));
            } else {
                res[destructStr.substring(j, i)] = e;
            }
        }

        if (returnCurrentIndex) {
            return i;
        }

        return res;
    };

    function tuplesEq(t1, t2) {
        if (t1.length !== t2.length) {
            return false;
        }

        var j;
        for (j = 0; j < t1.length; ++j) {
            if (!pkg.Audescript.eq(t1[j], t2[j])) {
                return false;
            }
        }

        return true;
    }

    // checks "real" equality between v1 and v2
    pkg.Audescript.eq = function (v1, v2) {
        if (v1 instanceof Tuple && v1.length === 1) {
            return pkg.Audescript.eq(v2, v1[0]);
        }

        /*eslint-disable eqeqeq */

        return v1 == v2 || (
            typeof v1 === typeof v2
            && (v1 instanceof Set && v2 instanceof Set
                ? v1.card() === v2.card() && !v1.minus(v2).card()
                : (v1 instanceof Transition && v2 instanceof Transition
                    ?          pkg.Audescript.eq(v1.symbol, v2.symbol)
                            && pkg.Audescript.eq(v1.startState, v2.startState)
                            && pkg.Audescript.eq(v1.endState, v2.endState)
                    : (v1 instanceof Automaton && v2 instanceof Automaton
                        ?          pkg.Audescript.eq(v1.states, v2.states)
                                && pkg.Audescript.eq(v1.finalStates, v2.finalStates)
                                && pkg.Audescript.eq(v1.trans, v2.trans)
                                && pkg.Audescript.eq(v1.q_init, v2.q_init)
                        : (v1 instanceof Tuple && v2 instanceof Tuple)
                            ? tuplesEq(v1, v2)
                            : JSON.stringify(v1) === JSON.stringify(v2)
                            )
                        )
                    )
        );

        /*eslint-enable eqeqeq */
    };

    // checks if value can be assigned to variable and return the right value. integerCheck enforce value being an integer.
    pkg.Audescript.as = function (variable, value, integerCheck) {
        if (variable instanceof Set && value instanceof Set) {
            if (!variable.typeConstraint  || variable.typeConstraint === value.constraintType) {
                return value;
            }

            var newVal = new Set();
            newVal.setTypeConstraint(variable.typeConstraint);
            newVal.unionInPlace(value);
            return value;
        }

        if (value !== null && value !== undefined && variable !== null && value !== undefined) {
            if (typeof value !== typeof variable && value.constructor !== variable.constructor) {
                throw new Error(_("Assignation Error: types of the value and the variable don’t match."));
            }
            return integerCheck ? (value > 0 ? Math.floor(value) : Math.ceil(value)) : value;
        }

        if (value !== variable) {
            throw new Error(_("Assignation Error: types of the value and the variable don’t match."));
        }

        return value;
    };

    Object.defineProperty(Object.prototype, "forEach", {
        enumerable: false,
        writable:   true,
        value: function (callback) {
            var i;
            for (i in this) {
                if (this.hasOwnProperty(i)) {
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
        commaSemicolon = 256,
        closeParen      = 1024,
        closeCurly      = 2048,
        openBracket     = 4096,
        instruction     = 8192,
        closeBracket    = 16384,
        end             = 0;

    function copy(constraintedVariables) {
        return {type: constraintedVariables.type.copy(), consts: constraintedVariables.consts.copy()};
    }

    function parseUnsignedNumber() {
        var dotEncountered = false, d = i;
        if (i < len && s[i] === "0") {
            ++i;
            if (i < len && (s[i] === "x" || s[i] === "X")) {
                do {
                    ++i;
                } while ("0123456789ABCDEF".indexOf(s[i].toUpperCase()) !== -1);
                return s.substring(d, i);
            }
        }

        while (i < len && ("0123456789".indexOf(s[i]) !== -1 || (!dotEncountered && s[i] === "."))) {
            if (!dotEncountered) {
                dotEncountered =  s[i] === ".";
            }
            ++i;
        }

        // TODO: checking if the number is correct (e.g: doesn't end with a dot)
        if (i < len && (s[i] === "e" || s[i] === "E")) {
            ++i;
            if (i < len && (s[i] === "+" || s[i] === "-")) {
                ++i;
            }
        }

        while (i < len && "0123456789".indexOf(s[i]) !== -1) {
            ++i;
        }

        type = lastSignificantType = number;
        return s.substring(d, i);
    }

    function getSymbol() {
        var d, begin, lst;

        if (i >= len) {
            lastSignificantType = type = end;
            return "";
        }

        if (s[i] === ")") {
            lastSignificantType = type = closeParen;
            return s[i++];
        }

        if (s[i] === "]") {
            lastSignificantType = type = closeBracket;
            return s[i++];
        }

        if (s[i] === "}") {
            lastSignificantType = type = closeCurly;
            return s[i++];
        }

        if ("{[(".indexOf(s[i]) !== -1) {
            lastSignificantType = type = openBracket;
            return s[i++];
        }

        if (s[i] === "\"" || s[i] === "'") {
            d = i;
            var endChar = s[i++];

            while (i < len && s[i] !== endChar) {
                if (s[i] === "\\") {
                    ++i;
                }
                ++i;
            }

            lastSignificantType = type = string;
            return s.substring(d, ++i);
        }

        if (!(s[i].trim())) {
            begin = i++;

            while (i < len && !(s[i].trim())) {
                ++i;
            }

            type = whitespace;
            lst  = lastSignificantType;
            d    = i;

            getSymbol();

            if (type !== whitespace) {
                i = d;
                lastSignificantType = lst;
                type = whitespace;
            }

            return s.substring(begin, i);
        }

        if (s[i] === ".") {
            if (i + 1 < len && "0123456789".indexOf(s[i + 1]) !== -1) {
                lastSignificantType = type = number;
                return parseUnsignedNumber();
            }

            lastSignificantType = type = dot;
            ++i;
            return ".";
        }

        if (type !== variable &&  "0123456789".indexOf(s[i]) !== -1) {
            lastSignificantType = type = number;
            return parseUnsignedNumber();
        }

        if ("*=!%<>&|?:^+-~\\".indexOf(s[i]) !== -1) { //TODO : simplify this bunch of crappy code
            lastSignificantType = type = operator;

            if (s[i] === "+") {
                ++i;
                if (s[i] === "+" || s[i] === "=") {
                    return "+" + s[i++];
                }
                return "+";
            }

            if (s[i] === "-") {
                ++i;
                if (s[i] === "-" || s[i] === "=") {
                    return "-" + s[i++];
                }
                return "-";
            }

            if (s[i] === "=") {
                ++i;
                if (s[i] === "=") {
                    ++i;
                    if (s[i] === "=") {
                        ++i;
                        return "===";
                    }
                    return "==";
                }
                if (s[i] === ">") {
                    ++i;
                    return "=>";
                }
                return "=";
            }

            if (s[i] === "<") {
                ++i;
                if (s[i] === "=") {
                    ++i;
                    return "<=";
                }
                if (s[i] === "<") {
                    ++i;
                    if (s[i] === "<") {
                        ++i;
                        return "<<<";
                    }
                    if (s[i] === "=") {
                        ++i;
                        return "<<=";
                    }
                    return "<<";
                }
                return "<";
            }

            if (s[i] === ">") {
                ++i;
                if (s[i] === "=") {
                    ++i;
                    return ">=";
                }
                if (s[i] === ">") {
                    ++i;
                    if (s[i] === ">") {
                        ++i;
                        if (s[i] === "=") {
                            ++i;
                            return ">>>=";
                        }
                        return ">>>";
                    }
                    if (s[i] === "=") {
                        ++i;
                        return ">>=";
                    }
                    return ">>";
                }
                return ">";
            }

            if (s[i] === "!") {
                ++i;
                begin = i;

                var symbol = getSymbol().toLowerCase();

                if (symbol === "contains" || symbol === "subsetof" || symbol === "elementof" || symbol === "belongsto") {
                    return "!" + symbol;
                }

                i = begin;
                lastSignificantType = type = operator;

                if (s[i] === "=") {
                    ++i;
                    if (s[i] === "=") {
                        ++i;
                        return "!==";
                    }
                    return "!=";
                }
                return "!";
            }

            if ("&|*%^".indexOf(s[i]) !== -1) {
                var c = s[i];
                ++i;
                if (s[i] === "=") {
                    ++i;
                    return c + "=";
                }

                if (c === "|" && s[i] === "|") {
                    ++i;
                    return "||";
                }

                if (c === "&" && s[i] === "&") {
                    ++i;
                    return "&&";
                }

                return c;
            }

            return s[i++];
        }

        if (s[i] === "/") {
            d = i++;

            if (i < len && s[i] === "/") {
                do {
                    ++i;
                } while (i < len && s[i] !== "\n");
                type = whitespace;
                begin = i;
                getSymbol();
                if (type !== whitespace) {
                    i = begin;
                    type = whitespace;
                }
            } else if (i < len && s[i] === "*") {
                do {
                    ++i;
                } while (i + 1 < len && !(s[i] === "*" && s[i + 1] === "/"));

                i   += 2;
                type = whitespace;
                begin  = i;
                lst  = lastSignificantType;
                getSymbol();

                if (type !== whitespace) {
                    i = begin;
                    lastSignificantType = lst;
                    type = whitespace;
                }
            } else {
                if (lastSignificantType & (number | variable | closeParen | closeBracket)) {
                    lastSignificantType = type = operator;
                    if (s[i] === "=") {
                        ++i;
                        return "/=";
                    }
                    return "/";
                }

                while (i < len && s[i] !== "/") {
                    if (s[i] === "\\") {
                        ++i;
                    }
                    ++i;
                }
                ++i;
                while (i < len && "azertyuiopqsdfghjklmwxcvbn".indexOf(s[i].toLowerCase()) !== -1) {
                    ++i;
                }
                lastSignificantType = type = regEx;
            }

            return s.substring(d, i);
        }

        if (s[i] === "," || s[i] === ";") {
            lastSignificantType = type = commaSemicolon;
            return s[i++];
        }

        d = i++;
        type = variable;
        var bufferSymbol = getSymbol();

        if (type === variable || type === instruction) {
            var v = s[d] + bufferSymbol;
            if (v === "var" || v === "new" || v === "delete" || v === "return" || v === "throw" || v === "break" || v === "continue" || v === "in" || v === "if" || v === "else" || v === "do" || v === "while" || v === "function" || v === "instanceof" || v === "typeof" || v === "include" || v === "let" || v === "const" || v === "try" || v === "catch" || v === "finally") {
                lastSignificantType = type = instruction;
            }
            return v;
        }

        i = d;
        lastSignificantType = type = variable;
        return s[i++];
    }

    var getExpression;

    function foreachReplacements(symbol, opts) {
        if (symbol === "break") {
            return "throw Audescript.StopIteration";
        }

        if (symbol === "return" || symbol === "throw") {
            var d    = i;
            var symb = getSymbol();

            if (type === whitespace) {
                if (symb.indexOf("\n") !== -1) {
                    i = d;

                    if (symbol === "throw") {
                        return "throw"; // Syntax error
                    }

                    return "throw new Audescript.ReturnValue(undefined)";
                }
                symb = getSymbol();
            }

            i = d;

            if (symb === ";") {
                if (symbol === "throw") {
                    return "throw"; // Syntax error
                }
                return "throw new Audescript.ReturnValue(undefined)";
            }

            if (symbol === "throw") {
                return "throw new Audescript.ThrowValue(" + getExpression({
                    inForeach: opts.inForeach,
                    value: true,
                    constraintedVariables: opts.constraintedVariables
                }) + ")";
            }

            return "throw new Audescript.ReturnValue(" + getExpression({
                inForeach: opts.inForeach,
                value: true,
                constraintedVariables: opts.constraintedVariables
            }) + ")";
        }

        if (symbol === "continue") {
            return "return";
        }

        return symbol;
    }

    function getConstraintString() {
        var begin = i;
        var symbol = getSymbol(), tmp = "";
        if (type === whitespace) {
            if (symbol !== " ") {
                tmp = symbol;
            }
            symbol = getSymbol();
        }
        if (type & (variable | string)) {
            if (type === string) {
                try {
                    var typeConstraint = JSON.parse(symbol);
                    if (typeConstraint === "float" || typeConstraint === "double") {
                        symbol = "'number'";
                    }
                } catch (e) {
                    i = begin;
                    return "";
                }
            } else {
                var lowerType = symbol.toLowerCase();

                if (lowerType === "integer" || lowerType === "int") {
                    symbol = "'integer'";
                } else if (lowerType === "number" || lowerType === "float") {
                    symbol = "'number'";
                } else if (lowerType === "list" || lowerType === "array") {
                    symbol = "Array";
                } else if (lowerType === "automata") {
                    symbol = "Automata";
                } else if (lowerType === "set") {
                    symbol = "Set";
                } else if (lowerType === "bool" || lowerType === "boolean" ||  lowerType === "string" || lowerType === "object" || lowerType === "undefined") {
                    symbol = "'" + lowerType + "'";
                } else if (lowerType === "function") {
                    symbol = "'function'";
                } else if (lowerType === "state") {
                    symbol = "null"; // FIXME: no constraint for states
                }
            }

            return tmp + symbol;
        }

        i = begin;
        return "";
    }

    function functionBody(s) {
        if (!abbreviatedFunctionSupported && s.trim()[0] !== "{") {
            return "{return " + s + "}";
        }
        return s;
    }

    function getWhite() {
        var d    = i,
            t    = type,
            l    = lastSignificantType,
            symb = getSymbol();

        if (type === whitespace) {
            return symb;
        }

        i = d;
        type = t;
        lastSignificantType = l;

        return "";
    }

    var toPureJS, parseForeach;

    function tryBrace(symbol, opts) {
        if (symbol === "{") {
            var begin  = i;
            var obj = false, oneVal = true;
            var pres = "";

            if (!opts.noSetOrObj) {
                do {
                    if (pres) {
                        pres += ",";
                        oneVal = false;
                    }

                    pres += getExpression({
                        inForeach: opts.inForeach,
                        value: true,
                        constraintedVariables: opts.constraintedVariables
                    }) + getWhite();
                    symbol = getSymbol();

                    if (symbol === ":") {
                        obj = true;
                        pres += symbol + getExpression({
                            inForeach: opts.inForeach,
                            value: true,
                            commaAllowed: false,
                            constraintedVariables: opts.constraintedVariables
                        }) + getWhite();
                        symbol = getSymbol();
                    }
                } while (symbol === ",");
            }

            if (!opts.noSetOrObj && symbol === "}" && !s.substring(begin - 1, i).match(/^\{[\s]*\}$/)) {
                return (obj || (opts.noValue && oneVal)) ? "{" + pres + "}" : "to_set([" + pres + "])";
            }

            i = begin;
            lastSignificantType = type = openBracket;
            return "{" + toPureJS({
                inForeach: opts.inForeach,
                constraintedVariables: copy(opts.constraintedVariables),
                endSymbols: { "}": true }
            })  + getSymbol(); // "}"
        }
        return false;
    }

    function tryArrayLitteral(symbol, opts) {
        if (symbol === "[") {
            return "[" + getExpression({
                inForeach: opts.inForeach,
                commaAllowed: true,
                constraintedVariables: opts.constraintedVariables,
                endSymbols: {
                    "]": true
                }
            }) + getSymbol(); // "]"
        }
        return false;
    }

    function tryParenthesis(symbol, opts) {
        if (symbol === "(") {
            if (opts.inForParenthesis) {
                var iter = "", comp = "";

                var decl = getExpression({
                    inForeach: false,
                    constraintedVariables: opts.constraintedVariables
                }) + getWhite();

                if (decl) {
                    comp = getExpression({
                        inForeach: false,
                        constraintedVariables: opts.constraintedVariables
                    }) + getWhite();

                    if (comp) {
                        // we allow the comma operator here in this specific context (iteration part of the for loop)
                        iter = getExpression({
                            inForeach: false,
                            commaAllowed: true,
                            constraintedVariables: opts.constraintedVariables
                        }) + getWhite();
                    }
                }

                if (getSymbol() === ")") {
                    return "(" + decl + comp + iter + ")";
                }
                return false;
            }

            var j, o = {commaAllowed: true};
            for (j in opts) {
                if (opts.hasOwnProperty(j)) {
                    o[j] = opts[j];
                }
            }
            o.acceptOperator = false;

            o.endSymbols = {")": true};
            var res = "(" + getExpression(o) + getSymbol(); // ")"
            if (o.gotComma && !o.noTuple) {
                res = " Tuple" + res;
            }
            return res;
        }
        return false;
    }

    function tryNewDeleteTypeof(symbol, opts) {
        if (symbol === "new" || (!opts.value && symbol === "delete") || symbol === "typeof") {
            return symbol + getExpression({
                inForeach: opts.inForeach,
                onlyOneValue: true,
                commaAllowed: opts.commaAllowed,
                constraintedVariables: opts.constraintedVariables,
                endSymbols: opts.endSymbols
            });
        }
        return false;
    }

    function tryEmptySet(symbol) {
        if (symbol === "emptySet") {
            var res = getWhite() + "new Set(";
            var begin = i;

            if (getSymbol() === "(") {
                var constraint = getConstraintString();
                if (getSymbol() === ")") {
                    if (constraint) {
                        res += "{typeConstraint:" + constraint + "}";
                    }
                } else {
                    i = begin;
                }
            } else {
                i = begin;
            }

            return res + ")";
        }
        return false;
    }

    function tryPunct(symbol, opts) {
        if (symbol === ";") {
            if (opts.value) {
                --i;
                return -1;
            }
            return symbol;
        }

        if (symbol === ",") {
            if (!opts.commaAllowed) {
                --i;
                return -1;
            }

            return symbol + getExpression({
                inForeach: opts.inForeach,
                value: opts.value,
                commaAllowed: true,
                endSymbols: opts.endSymbols,
                constraintedVariables: opts.constraintedVariables
            });
        }

        if (symbol === "!") {
            return symbol + getExpression({
                inForeach: opts.inForeach,
                value: opts.value,
                constraintedVariables: opts.constraintedVariables,
                onlyOneValue: opts.onlyOneValue
            });
        }

        return false;
    }

    function autoTrim(s) {
        var b = 0, l = s.length;
        while (b < l && " \t".indexOf(s[b]) !== -1) {
            ++b;
        }
        var e = l - 1;
        while (e > -1 && " \t".indexOf(s[e]) !== -1) {
            --e;
        }
        return s.substring(b, e + 1);
    }

    function tryInstructionBlock(symbol, opts, begin) {
        var d, tmp;
        if (symbol === "if" || symbol === "while" || symbol === "for" || symbol === "function" || symbol === "switch" || symbol === "try" || symbol === "catch" || symbol === "finally") {
            if (symbol === "function" || symbol === "catch") {
                if (symbol === "function") {
                    d = i;
                    var functionName = getWhite() + getSymbol();

                    if (functionName.trim() === "(") {
                        i = d;
                        functionName = functionName.slice(0, -1);
                    }

                    return symbol + functionName + getExpression({
                        inForeach: opts.inForeach,
                        constraintedVariables: opts.constraintedVariables,
                        noTuple: true,
                        onlyOneValue: true
                    }) + functionBody(getExpression({
                        inForeach: false,
                        constraintedVariables: copy(opts.constraintedVariables),
                        noSetOrObj: true
                    }));
                }

                return symbol + getExpression({
                    inForeach: false,
                    noTuple: true,
                    constraintedVariables: opts.constraintedVariables
                }) + functionBody(getExpression({
                    inForeach: false,
                    constraintedVariables: copy(opts.constraintedVariables),
                    noSetOrObj: true
                }));
            }

            if (opts.value) {
                i = begin;
                return -1;
            }

            if (symbol === "try" || symbol === "finally") {
                return symbol + getExpression({
                    inForeach: opts.inForeach,
                    constraintedVariables: copy(opts.constraintedVariables),
                    noSetOrObj: true
                });
            }

            if (symbol === "for" && !IterationsSupported && (tmp = parseForeach(symbol, opts)) !== "for") {
                return tmp;
            }

            return symbol + getExpression({
                inForeach: false,
                inForParenthesis: symbol === "for",
                blockComma: true,
                constraintedVariables: opts.constraintedVariables
            }) + getExpression({
                inForeach: (
                    symbol === "while" || symbol === "for" || symbol === "switch"
                )   ? false
                    : opts.inForeach,
                constraintedVariables: copy(opts.constraintedVariables),
                noValue: true
            });
        }

        if (symbol === "do") {
            if (opts.value) {
                i = begin;
                return -1;
            }

            tmp = symbol + getExpression({
                inForeach: false,
                constraintedVariables: copy(opts.constraintedVariables),
                noValue: true
            }) + getWhite();

            var symbol2 = getSymbol();
            d = i;

            if (symbol2 === "while") {
                return tmp + symbol2 + getExpression({
                    inForeach: opts.inForeach,
                    constraintedVariables: copy(opts.constraintedVariables)
                });
            }

            i = d;
            return tmp;
        }

        if (symbol === "else") {
            if (opts.value) {
                i = begin;
                return -1;
            }

            return symbol + getExpression({
                inForeach: opts.inForeach,
                noValue: true,
                constraintedVariables: copy(opts.constraintedVariables)
            });
        }
        return false;
    }

    function tryVariableRelatedInstruction(symbol, opts, begin) {
        if (type !== instruction) {
            return false;
        }

        if (opts.value) {
            i = begin;
            return -1;
        }


        if (symbol === "const" || symbol === "let" || symbol === "var") {
            var d;
            if (symbol === "let") {
                d = i;
                getWhite();
                symbol = getSymbol();
                i = d;
                if (symbol === "(") {
                    var letVars = getExpression({
                        inForeach: opts.inForeach,
                        noTuple: true,
                        onlyOneValue: true,
                        constraintedVariables: opts.constraintedVariables
                    }) + getSymbol();
                    var d2 = i;
                    getWhite();
                    if (s[i] !== "=") {
                        i = d2;
                        if (letExpressionSupported) {
                            return "let" + letVars + getExpression({
                                inForeach: opts.inForeach,
                                constraintedVariables: copy(opts.constraintedVariables)
                            });
                        }

                        return "(function () {var " + letVars.replace(/^([\s]*)\(([\s\S]+)\)([\s]*)$/, "$1$2$3") + ";" + getExpression({
                            inForeach: opts.inForeach,
                            constraintedVariables: copy(opts.constraintedVariables)
                        }) + "})()";
                    }
                }
                i = d;
                symbol = "let"; // regulat let, handling just after this.
            }

            var listOfVals, index, leng, semicolonExpected = false, vars, keyword, val, addToConsts = symbol === "const" && !constSupported;

            var decl = "";

            if (addToConsts || symbol === "let") {
                // Here, const is not supported
                keyword = letDeclarationSupported ? "let" : "var";
            } else {
                keyword = symbol;
            }

            var oldType, tmp = "", white = "";

            do {
                vars = getWhite() + getExpression({
                    onlyOneValue: true,
                    noTuple: true,
                    constraintedVariables: opts.constraintedVariables
                }) + getWhite();

                d = i;
                oldType = lastSignificantType;
                symbol = getSymbol();

                if (symbol === "=") {
                    val = getExpression({
                        inForeach: opts.inForeach,
                        constraintedVariables: opts.constraintedVariables,
                        value: true
                    });

                    d = i;
                    oldType = lastSignificantType;
                    white  = getWhite();
                    symbol = getSymbol();
                } else {
                    val = "";
                }

                if (!destructuringSupported || addToConsts) {
                    // destructuring
                    listOfVals = [];
                    pkg.Audescript.destruct(null, vars, listOfVals);
                }

                if (val && "[{(".indexOf(vars.trim()[0]) !== -1 && (!destructuringSupported || "(".indexOf(vars.trim()[0]) !== -1)) {
                    if (decl) {
                        tmp += (semicolonExpected ? ";" : "") + decl + ";";
                        decl = "";
                    }

                    tmp += keyword + " " + listOfVals.toString() + ";" + destructToJS(vars, val, listOfVals, opts.constraintedVariables) + white;
                    semicolonExpected = true;
                } else if (decl) {
                    decl += "," + vars + (val ? "=" + val : "") + white;
                } else {
                    decl = keyword + (vars[0].trim() ? " " : "") + vars + (val ? "=" + val : "") + white;
                }

                if (addToConsts) {
                    for (index = 0, leng = listOfVals.length; index < leng; ++index) {
                        if (listOfVals.hasOwnProperty(index)) {
                            opts.constraintedVariables.consts.add(listOfVals[index]);
                        }
                    }
                }
            } while (symbol === ",");

            if (symbol === ";") {
                return tmp + (semicolonExpected ? ";" : "") + decl + ";";
            }

            i = d;
            lastSignificantType = oldType;
            return tmp + (semicolonExpected ? ";" : "") + decl;
        }

        i = begin;
        return -1;
    }

    function tryForeachRelatedStuffs(symbol, opts, begin) {
        if (symbol === "foreach") {
            if (opts.value) {
                i = begin;
                return -1;
            }
            return parseForeach(symbol, opts);
        }

        if (opts.inForeach && (symbol === "break" || symbol === "continue" || symbol === "throw" || symbol === "return")) {
            if (opts.value) {
                i = begin;
                return -1;
            }
            return foreachReplacements(symbol, opts);
        }
    }

    function tryInclude(symbol, includes) {
        if (symbol === "include") {
            var res = getWhite();
            includes.push(getSymbol());
            res += getWhite();
            var begin = i;

            if (getSymbol() === ";") {
                return res + getWhite();
            }

            i = begin;
            return res;
        }
        return false;
    }

    function tryComma(symbol, opts, white, oldType) {
        if (symbol === ",") {
            opts.immediatlyReturn = true;
            if (!opts.commaAllowed) {
                --i;
                lastSignificantType = oldType;
                return white || -1;
            }

            opts.gotComma = true;
            return white + symbol + getExpression({
                inForeach: opts.inForeach,
                value: opts.value,
                commaAllowed: true,
                endSymbols: opts.endSymbols,
                constraintedVariables: opts.constraintedVariables
            });
        }
        return false;
    }

    function trySemicolon(symbol, opts, white, oldType) {
        if (symbol === ";") {
            opts.immediatlyReturn = true;
            if (opts.value) {
                --i;
                lastSignificantType = oldType;
                return white || -1;
            }
            return white + symbol + getWhite();
        }
        return false;
    }

    function tryColon(symbol, opts, white, oldType, begin, varName) {
        if (symbol === ":") {
            opts.immediatlyReturn = true;

            if (opts.value) {
                --i;
                lastSignificantType = oldType;
                return white || -1;
            }

            var d, tmp, white2, matches, constraint, typeOfVar, defaultValue;

            d = i;
            matches = /([\s]*)[\S]+/g.exec(varName);

            if (matches) {
                opts.constraintedVariables.type.add(varName);
                tmp = matches[1] + (letDeclarationSupported ? "let " : "var ") + varName + white + "=";
                defaultValue = "";
                symbol = getSymbol();

                if (type === whitespace) {
                    if (symbol.match("\n")) {
                        i = d;
                        type = lastSignificantType = operator;

                        return white + ":" + getExpression({
                            inForeach: opts.inForeach,
                            constraintedVariables: opts.constraintedVariables
                        });
                    }
                    tmp += symbol;
                    symbol = getSymbol();
                }

                if (type === variable) {
                    typeOfVar = symbol;
                    symbol = getSymbol();
                    if (type === whitespace) {
                        white = symbol === " " ? "" : symbol;
                        symbol = getSymbol();
                    } else {
                        white = "";
                    }

                    if (symbol === "=") {
                        defaultValue = getExpression({
                            inForeach: opts.inForeach,
                            value: true,
                            constraintedVariables: opts.constraintedVariables
                        });
                    } else {
                        i -= symbol.length;
                    }

                    switch (typeOfVar.toLowerCase()) {
                    case "integer":
                    case "int":
                        tmp += defaultValue ? ("Audescript.as(0," + defaultValue + ", true)") : "0";
                        opts.constraintedVariables.type.add("0" + varName);
                        break;
                    case "list":
                    case "array":
                    case "table":
                        tmp += defaultValue ? ("Audescript.as([]," + defaultValue + ")") : "[]";
                        break;
                    case "state":
                        opts.constraintedVariables.type.remove(varName);
                        tmp += defaultValue || "''";
                        break;
                    case "string":
                        tmp += defaultValue ? ("Audescript.as(''," + defaultValue + ")") : "''";
                        break;
                    case "bool":
                    case "boolean":
                        tmp += defaultValue ? ("Audescript.as(false," + defaultValue + ")") : "false";
                        break;
                    case "automaton":
                        tmp += defaultValue ? "Audescript.as(new Automaton," + defaultValue + ")" : "new Automaton";
                        break;
                    case "function":
                        tmp += defaultValue ? "Audescript.as(function () {}," + defaultValue + ")" : "function () {}";
                        break;
                    case "mappingfunction":
                        tmp += defaultValue || "getMappingFunction()";
                        break;
                    case "set":
                        if (defaultValue) {
                            tmp += (defaultValue.trim().substr(0, 7) === "to_set(") ? defaultValue : "to_set(" +  defaultValue + ")";
                        } else {
                            tmp   += "new Set()";
                            symbol = getSymbol();
                            white2 = "";

                            if (type === whitespace) {
                                if (symbol !== " ") {
                                    white2 = symbol;
                                }
                                symbol = getSymbol();
                            }

                            if (symbol === "of") {
                                constraint = getConstraintString();

                                if (constraint) {
                                    tmp += ";" + white2 + varName + ".setTypeConstraint(" + constraint + ")";
                                } else {
                                    i = begin;
                                    lastSignificantType = oldType;
                                    return white;
                                }

                                symbol = getSymbol();

                                if (type === whitespace) {
                                    if (symbol !== " ") {
                                        tmp += symbol;
                                    }
                                    symbol = getSymbol();
                                }

                                if (symbol === "=") {
                                    tmp += ";" + varName + ".unionInPlace(" + getExpression({
                                        inForeach: opts.inForeach,
                                        value: true,
                                        constraintedVariables: opts.constraintedVariables
                                    }) + ")";
                                } else {
                                    i -= symbol.length;
                                }
                            } else {
                                i -= symbol.length;
                            }
                        }
                        break;
                    default:
                        tmp += "new " + typeOfVar;
                    }

                    tmp += white;
                }

                white = getWhite();
                symbol = getSymbol();

                opts.noRes = true;
                if (symbol === ";") {
                    return tmp + white + symbol;
                }

                i -= symbol.length;
                return tmp + white;
            }

            i = begin;
            lastSignificantType = oldType;
            return white || -1;
        }
        return false;
    }

    function tryDot(opts, symbol, white) {
        if (symbol === ".") {
            symbol = getWhite() + getSymbol();

            if (type !== variable) {// Syntax error ?
                opts.immediatlyReturn = true;
            }

            return white + "." + symbol;
        }
        return false;
    }

    function tryInterro(opts, symbol, white, oldType, begin, res) {
        if (symbol === "?") {
            if (opts.onlyOneValue) {
                i = begin;
                lastSignificantType = oldType;
                opts.immediatlyReturn = true;
                return white || -1;
            }

            opts.noRes = true;
            opts.hasOperator = true;

            var o = {
                inForeach: opts.inForeach,
                value: true,
                constraintedVariables: opts.constraintedVariables
            };

            var ret = {op: symbol, left: autoTrim(res), white: white, not: "", alphaOp: false};
            ret.ifTrueExpression = getExpression(o);
            ret.valueIfTrueHasOperator = o.hasOperator;
            o.hasOperator = false;
            ret.colon = getWhite() + getSymbol() + getWhite();
            ret.ifFalseExpression = getExpression(o);
            ret.valueIfFalseHasOperator = o.hasOperator;
            return ret;
        }
        return false;
    }

    function tryBracketParenthesis(symbol, opts, white) {
        if (symbol === "[") {
            return white + symbol + getExpression({
                inForeach: opts.inForeach,
                constraintedVariables: opts.constraintedVariables,
                endSymbols: {"]": true}
            }) + getSymbol(); // symbol should be "]"
        }

        if (symbol === "(") {
            return white + symbol + getExpression({
                inForeach: opts.inForeach,
                constraintedVariables: opts.constraintedVariables,
                commaAllowed: true,
                endSymbols: {")": true}
            }) + getSymbol(); // symbol should be ")"
        }
        return false;
    }

    function tryArrowFunction(opts, symbol, oldType, args) {
        if (symbol === "=>"  && (oldType & (variable | closeParen))) {
            ++i;
            var expr = getExpression({
                inForeach: opts.inForeach,
                constraintedVariables: copy(opts.constraintedVariables)
            });

            if (arrowFunctionSupported) {
                return "=>" + expr;
            }

            opts.noRes = true;
            return "function" +
                    (oldType === closeParen ? args : "(" + args + ")") +
                    (expr.trim()[0] === "{" ? expr : "{return " + expr + "}");
        }
        return false;
    }

    function tryOperator(opts, type, symbol, white, begin, oldType, res) {
        if (type === operator) {
            opts.noRes = true;
            if (opts.onlyOneValue && symbol !== "!") {
                opts.immediatlyReturn = true;
                i = begin;
                lastSignificantType = oldType;
                return res + white;
            }

            if (symbol[symbol.length - 1] === "=" && symbol !== ">=" && symbol !== "<=" && symbol !== "===" && symbol !== "==" && symbol !== "!=" && symbol !== "!==") {
                var trimRes, newVal;
                trimRes = res.trim();
                newVal  = getExpression({
                    inForeach: opts.inForeach,
                    value: true,
                    constraintedVariables: opts.constraintedVariables
                });

                if ((!destructuringSupported && (trimRes[0] === "{" || trimRes[0] === "[")) || trimRes[0] === "(") {
                    return res + white + destructToJS(res, newVal, null, opts.constraintedVariables);
                }

                if (opts.constraintedVariables.type.contains(trimRes)) {
                    opts.immediatlyReturn = true;
                    if (symbol.length > 1) {
                        return white + res + "=Audescript.as(" + trimRes + "," +  trimRes + symbol.substr(0, symbol.length - 1) + newVal + "," + (opts.constraintedVariables.type.contains("0" + trimRes) ? "true" : "false") + ")";
                    }

                    return white + res + "=Audescript.as(" + trimRes + "," +  newVal + "," + (opts.constraintedVariables.type.contains("0" + trimRes) ? "true" : "false") + ")";
                }

                if (!constSupported && opts.constraintedVariables.consts.contains(trimRes)) {
                    opts.immediatlyReturn = true;
                    return white + res.replace(/[\S]+/g, "") + constError(trimRes) + newVal.replace(/[\S]+/g, "");
                }

                return res + white + symbol + newVal;
            }

            opts.hasOperator = true;

            var o = {
                inForeach: opts.inForeach,
                acceptOperator: true,
                value: true,
                noWhite: true,
                constraintedVariables: opts.constraintedVariables
            };

            var ret = {op: symbol, left: autoTrim(res), white: white, not: "", beforeRight: getWhite(), right: getExpression(o), alphaOp: false};
            ret.rightHasOperator = o.hasOperator;
            return ret;
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

    function tryAlphaOperator(opts, symbol, white, oldType, begin, res) {
        symbol = symbol.toLowerCase();

        var not = "";
        if (symbol && symbol[0] === "!") {
            not = "!";
            symbol = symbol.substr(1);

            if (alphaOperatorRenames.hasOwnProperty(symbol)) {
                symbol = alphaOperatorRenames[symbol];
            }

            if (symbol !== "contains" && symbol !== "subset_of" && symbol !== "belongs_to" && symbol !== "has_key") {
                // only these alpha operators can be negated
                i = begin;
                opts.immediatlyReturn = true;
                return -1;
            }
        } else if (alphaOperatorRenames.hasOwnProperty(symbol)) {
            symbol = alphaOperatorRenames[symbol];
        }

        if (symbol === "inter" || symbol === "union" || symbol === "cross" || symbol === "minus" || symbol === "contains" || symbol === "subsetof" || symbol === "belongs_to" || symbol === "has_key" || symbol === "sym_diff") {

            var maybeBeforeEqualSign = i;
            var symbol2 = getSymbol();
            var white2;

            if (type === whitespace) {
                white2 = symbol2 === " " ? "" : symbol2;
                symbol2 = getSymbol();
            } else {
                white2 = "";
            }

            if (type === operator) {
                if (symbol2 !== "=" || symbol === "contains" || symbol === "has_key" || symbol === "subset_of" || symbol === "belongs_to" || symbol === "sym_diff" || symbol === "") {
                    // syntax error (?)
                    i = begin;
                    lastSignificantType = oldType;
                    opts.immediatlyReturn = true;
                    return white || -1;
                }

                return "." + symbol + "InPlace(" + (white === " " ? "" : white) + white2 + getExpression({
                    inForeach: opts.inForeach,
                    value: true,
                    constraintedVariables: opts.constraintedVariables
                }) + ")";
            }

            i = maybeBeforeEqualSign; // white2 is not relevant anymore

            opts.noRes = true;
            opts.hasOperator = true;

            var o = {
                inForeach: opts.inForeach,
                value: true,
                noWhite: true,
                acceptOperator: true,
                constraintedVariables: opts.constraintedVariables
            };

            var ret = {op: symbol, left: autoTrim(res), white: white, not: not, beforeRight: getWhite(), right: getExpression(o), alphaOp: true};
            ret.rightHasOperator = o.hasOperator;
            return ret;
        }

        return false;
    }

    function addOperatorParenthesis(o, opts) {
        o.afterLeft = o.afterLeft ? o.afterLeft + opts.afterLeft : opts.afterLeft;
        o.transformedOperator = true;

        var left = o;
        while (left.prev && (!opts.weakerThan || opts.weakerThan.indexOf(left.prev.op) === -1)) {
            left = left.prev;
        }

        if (left.prev) {
            left.prev.beforeRight = left.prev.beforeRight ? opts.beforeLeft + left.prev.beforeRight : opts.beforeRight;
        } else {
            left.beforeLeft = left.beforeLeft ? opts.beforeLeft + left.beforeLeft : opts.beforeLeft;
        }

        var right = o;
        while (right.rightHasOperator && ((!opts.weakerThan || opts.weakerThan.indexOf(right.right.op) === -1) && (!opts.sameLevel || opts.sameLevel.indexOf(right.right.op) === -1))) {
            right = right.right;
        }

        if (right.rightHasOperator) {
            right.right.afterLeft  = right.right.afterLeft  ? right.right.afterLeft  + opts.afterRight : opts.afterRight;
        } else {
            right.afterRight = right.afterRight ? right.afterRight + opts.afterRight : opts.afterRight;
        }
    }

    function operatorChainToString(o) {
        if (typeof o === "string") {
            return o;
        }

        if (o.op === "?") {
            // this works because " ? : " is the most predecedent operator
            return (o.beforeLeft || "") + o.left + (o.afterLeft || "") + o.white + "?" + o.ifTrueExpression + o.colon + o.ifFalseExpression + (o.afterRight || "");
        }

        var rightTrim = operatorChainToString(o.right);
        var rightSpaces = "";

        while (rightTrim.length && !rightTrim.slice(-1).trim()) {
            rightSpaces = rightTrim.slice(-1) + rightSpaces;
            rightTrim   = rightTrim.substr(0, rightTrim.length - 1);
        }

        if (o.transformedOperator) {
            return (o.beforeLeft || "") + o.left + o.afterLeft + (o.beforeRight || "") + rightTrim + (o.afterRight || "") + rightSpaces;
            //TODO: check correctness
        }

        return (o.beforeLeft || "") + o.left + (o.afterLeft || "") + (o.white || "") + o.op +  (o.beforeRight || "") + rightTrim + (o.afterRight || "") + rightSpaces;
    }

    function handleOperators(o) {
        /**
         * priorities:
         *  - +, -, =, *
         *  - union, inter, cross
         *  - minus
         *  - contains, belongs_to, hasKey, subset_of, symdiff
         *  - <, <=, >= ,>, ==, ===
         *  - ||
         *  - &&
         *  - ? :
         */
        if (o.rightHasOperator) {
            o.right.prev = o;
        }

        switch (o.op) {
        case "==":
            addOperatorParenthesis(o, {
                beforeLeft: (o.white || "") + "Audescript.eq(",
                afterLeft:  ",",
                afterRight: ")",
                weakerThan: ["||", "&&", "?"],
                sameLevel:  ["<", "<=", ">=", ">", "==", "===", "!=", "!=="]
            });
            break;
        case "!=":
            addOperatorParenthesis(o, {
                beforeLeft: (o.white || "") + "!Audescript.eq(",
                afterLeft:  ",",
                afterRight: ")",
                weakerThan: ["||", "&&", "?"],
                sameLevel:  ["<", "<=", ">=", ">", "==", "===", "!=", "!=="]
            });
            break;
        case "?":
            if (o.valueIfTrueHasOperator) {
                o.ifTrueExpression = operatorChainToString(handleOperators(o.ifTrueExpression));
            }
            if (o.valueIfFalseHasOperator) {
                o.ifFalseExpression = operatorChainToString(handleOperators(o.ifFalseExpression));
            }
            return o; // "? : " operator is a specific case
//             return o.left + o.white + "?" + o.ifTrueExpression + o.colon + o.ifFalseExpression;
        case "contains":
        case "subsetof":
        case "sym_diff":
        case "belongs_to":
            addOperatorParenthesis(o, {
                beforeLeft: " " + o.not + o.op  + "(",
                afterLeft:  "," + (o.white === " " ? "" : o.white),
                afterRight: ")",
                weakerThan: ["<", "<=", ">=", ">", "==", "===", "!=", "!==", "||", "&&", "?"],
                sameLevel:  ["contains", "belongs_to", "has_key", "subset_of", "symdiff"]
            });
            break;
        case "has_key":
            addOperatorParenthesis(o, {
                beforeLeft: " " + o.not + "(",
                afterLeft:  ").hasKey("    + (o.white === " " ? "" : o.white),
                afterRight: ")",
                weakerThan: ["<", "<=", ">=", ">", "==", "===", "!=", "!==", "||", "&&", "?"],
                sameLevel:  ["contains", "belongs_to", "has_key", "subset_of", "symdiff"]
            });
            break;
        default:
            var sameLevel, weakerThan;
            if (o.op === "union" || o.op === "inter" || o.op === "cross") {
                sameLevel  = ["union", "inter", "cross"];
                weakerThan = ["minus", "contains", "belongs_to", "has_key", "subset_of", "symdiff", "<", "<=", ">=", ">", "==", "===", "!=", "!==", "||", "&&", "?"];
            } else if (o.op === "minus") {
                weakerThan = ["contains", "belongs_to", "has_key", "subset_of", "symdiff", "<", "<=", ">=", ">", "==", "===", "!=", "!==", "||", "&&", "?"];
                sameLevel  = ["minus"];
            }

            if (o.alphaOp) {
                // inter, union, cross, minus
                addOperatorParenthesis(o, {
                    beforeLeft: (o.white || "") + o.not + o.op + "(",
                    afterLeft:  ",",
                    afterRight: ")",
                    weakerThan: weakerThan,
                    sameLevel:  sameLevel
                });
            }
        }

        if (o.rightHasOperator) {
            handleOperators(o.right);
        }

        return o;
    }

    getExpression = function (opts) {
        if (!opts.noWhite) {
            opts.noWhite = true;
            return getWhite() + getExpression(opts);
        }

        if (opts.onlyOneValue) {
            opts.value = true;
        }

        if (!opts.endSymbols) {
            opts.endSymbols = {};
        }

        var begin       = i,
            res         = "",
            symbol      = getSymbol(),
            oldType     = lastSignificantType;

        /* Here:
         * The symbol to handle was just read in the variable symbol.
         * i is after the just read symbol
         * oldType is the type of the current symbol
         */

        // stop condition
        if (opts.endSymbols.hasOwnProperty(symbol) || ")]}".indexOf(symbol) !== -1) {
            /* case : we are at the end of an expression */
            i = begin;
            return "";
        }

        var beginAfterBrace = i;
        var tmpRes = tryBrace(symbol, opts)           ||
                     tryArrayLitteral(symbol, opts)   ||
                     tryParenthesis(symbol, opts)     ||
                     tryNewDeleteTypeof(symbol, opts) ||
                     tryEmptySet(symbol);

        if (tmpRes) {
            res += tmpRes;
            if (opts.onlyOneValue) {
                return res;
            }
        } else {
            i = beginAfterBrace;

            tmpRes = tryPunct(symbol, opts)                       ||
                     tryForeachRelatedStuffs(symbol, opts, begin) ||
                     tryInstructionBlock(symbol, opts, begin)     ||
                     tryInclude(symbol, includes)                 ||
                     tryVariableRelatedInstruction(symbol, opts, begin);

            if (tmpRes === -1) {
                return "";
            }

            if (tmpRes !== false) {
                return res + tmpRes;
            }

            res += symbol; // ?? (string, number, litteral, ... ?)
        }


        var white;

        for (;;) {
            oldType = lastSignificantType;
            white = getWhite();
            begin = i;
            symbol = getSymbol();

            if (opts.endSymbols.hasOwnProperty(symbol)) {
                i = begin;
                lastSignificantType = oldType;
                return res + white;
            }

            tmpRes = tryComma(symbol, opts, white, oldType)                      ||
                     trySemicolon(symbol, opts, white, oldType)                  ||
                     tryColon(symbol, opts, white, oldType, begin, res.trim())   ||
                     tryDot(opts, symbol, white)                                 ||
                     tryInterro(opts, symbol, white, oldType, begin, res)        ||
                     tryArrowFunction(opts, symbol, oldType, res)                ||
                     tryBracketParenthesis(symbol, opts, white)                  ||
                     tryOperator(opts, type, symbol, white, begin, oldType, res) ||
                     tryAlphaOperator(opts, symbol, white, oldType, begin, res);

            if (tmpRes === false) {
                if (")]}".indexOf(symbol) === -1) {
                    lastSignificantType = oldType;
                }

                i = begin;
                return res + white;
            }

            if (tmpRes === -1) {
                tmpRes = "";
            }

            if (opts.hasOperator) {
                if (opts.acceptOperator) {
                    opts.acceptOperator = false;
                    return tmpRes;
                }
                opts.hasOperator = false;
                tmpRes = operatorChainToString(handleOperators(tmpRes));
            }

            res = (opts.noRes ? "" : res) + tmpRes;

            if (opts.immediatlyReturn) {
                return res;
            }

            opts.noRes = false;
        }

        // should never be reached
        return res;
    };

    function comprehensiveSet(opts, declarationSymbol, begin, white, expr1) {
        if (s[i] === "{") {
            ++i;

            var n1 = white + getExpression({
                inForeach: opts.inForeach,
                value: true,
                endSymbols: {"," : true},
                constraintedVariables: opts.constraintedVariables
            });

            var symbol = getSymbol();

            if (symbol !== ",") {
                i = begin;
                return "";
            }

            symbol = getSymbol();

            if (type === whitespace) {
                white += symbol;
                symbol = getSymbol();
            }

            if (symbol !== ".") {
                i = begin;
                return "";
            }

            symbol = getSymbol();

            if (symbol !== ".") {
                i = begin;
                return "";
            }

            symbol = getSymbol();

            if (symbol !== ".") {
                i = begin;
                return "";
            }

            symbol = getSymbol();

            if (type === whitespace) {
                white += symbol;
                symbol = getSymbol();
            }

            if (symbol !== ",") {
                i = begin;
                return "";
            }

            var n2 = getExpression({
                inForeach: opts.inForeach,
                constraintedVariables: opts.constraintedVariables
            });

            if (getSymbol() !== "}") {
                i = begin;
                return "";
            }

            symbol = getSymbol();

            if (type === whitespace) {
                white += symbol;
                symbol = getSymbol();
            }

            if (symbol !== ")") {
                i = begin;
                return "";
            }

            var bf = "", ef = "", foreachBody = getExpression({
                inForeach: opts.inForeach,
                noValue: true,
                constraintedVariables: copy(opts.constraintedVariables)
            });

            if (foreachBody.trim()[0] !== "{") {
                bf = "{";
                ef = "}";
            }

            declarationSymbol = declarationSymbol || (/^[\s]*(let|var)/g.exec(expr1) || ["", (letDeclarationSupported ? "let" : "var")])[1];
            expr1 = expr1.replace(/^([\s]*)(?:let|var) */g, "$1");
            return "for (" + declarationSymbol + (declarationSymbol[declarationSymbol.length - 1].trim() ? " " : "") + expr1 + (expr1[expr1.length - 1].trim() ? " " : "") + "=" + n1 + "; " + expr1.trim() + " <= " + n2 + ";" + white + "++" + expr1.trim() + ")" + bf + foreachBody + ef;
        }

        return "";
    }

    parseForeach = function (keyword, opts) {
        var begin = i;
        var symbol = getSymbol(), beforeParenthesis = "";

        if (type === whitespace) {
            beforeParenthesis = symbol;
            symbol = getSymbol();
        }

        if (symbol !== "(") {
            i = begin;
            return keyword;
        }

        var expr1  = getExpression({
            inForeach: opts.inForeach,
            constraintedVariables: opts.constraintedVariables
        });

        var inExpr = getSymbol(), declarationSymbol = "";

        if (IterationsSupported) {
            if (keyword === "foreach" && !expr1.match(/^[\s]*(?:let|var) ?/)) {
                expr1 = (letDeclarationSupported ? "let " : "var ") + autoTrim(expr1);
            }
        } else {
            var key = /^[\s]*(let|var) */g.exec(expr1);

            if (key || keyword === "foreach") {
                declarationSymbol = (key ? key[1] + " " : (letDeclarationSupported ? "let " : "var "));
            }

            expr1 = expr1.replace(/^[\s]*(?:let|var) */g, "");
        }

        if (type === whitespace) {
            expr1 += inExpr;
            inExpr = getSymbol();
        }

        if ((inExpr !== "in" && inExpr !== "of") || (inExpr === "in" && keyword === "for")) {
            i = begin;
            return keyword;
        }

        var white = getSymbol(), d = i, c = comprehensiveSet(opts, declarationSymbol, d, white, expr1);

        if (c) {
            return c;
        }

        var expr2  = getExpression({
            inForeach: opts.inForeach,
            constraintedVariables: opts.constraintedVariables
        });

        if (getSymbol() !== ")") {
            i = begin;
            return "for";
        }

        var foreachBody = getExpression({
            inForeach: !IterationsSupported,
            noValue: true,
            constraintedVariables: copy(opts.constraintedVariables)
        });

        if (IterationsSupported) {
            return "for" + beforeParenthesis + "(" + declarationSymbol + expr1 + " of " + expr2 + ")" + foreachBody;
        }

        var  bf = "", ef = "";
        if (foreachBody.trim()[0] === "{") {
            if (!declarationSymbol && keyword !== "foreach") {
                foreachBody = foreachBody.replace(/([\s]*)\{/, "$1{" + expr1.replace(/\$/g, "$$$$") + "=arguments[0];");
            }
        } else {
            if (!declarationSymbol && keyword !== "foreach") {
                bf = "{" + expr1 + "=arguments[0];";
            } else {
                bf = "{";
            }
            ef = "}";
        }

        return "try{(" + expr2 + ").forEach" + beforeParenthesis + "(function (" + ((declarationSymbol || keyword === "foreach") ? expr1 : "") + ")" + bf + foreachBody + ef + ")}catch (e) {if (e instanceof Audescript.ThrowValue) {throw " + (opts.inForeach ? "e" : "e.v") + ";}else if (e instanceof Audescript.ReturnValue) {" + (opts.inForeach ? "throw e" : "return e.v") + ";}}";
    };

    toPureJS = function (opts) {
        if (!opts) {
            opts = {};
        }

        if (!opts.endSymbols) {
            opts.endSymbols = {};
        }

        if (!opts.constraintedVariables) {
            opts.constraintedVariables = {type: new Set(), consts: new Set()};
        }

        var res = "", symbol, beforeSymbol = i;

        do {
            // we browse the code, expression by expression
            res += getExpression({
                inForeach: opts.inForeach,
                value: false,
                endSymbols: opts.endSymbols,
                constraintedVariables: opts.constraintedVariables
            });

            // if no expression was parsed
            if (i === beforeSymbol) {
                symbol = getSymbol();
                if (opts.endSymbols.hasOwnProperty(symbol)) {
                    i = beforeSymbol;
                    return res;
                }
                // surely a syntax error, we avoid an infinite loop by just reading a symbol as is
                res += symbol;
            }

            beforeSymbol = i;
            symbol = getSymbol();
            i = beforeSymbol;

            // if we saw a stop symbol
            if (opts.endSymbols.hasOwnProperty(symbol)) {
                return res;
            }
        } while (type !== end);
        return res;
    };

    pkg.Audescript.toPureJS = function (str, includesArray) {
        includes = includesArray || [];
        len      = str.length;
        s        = str;
        i        = 0;
        lastSignificantType = type = end;
        return toPureJS();
    };

    /* Somme standard functions */

    // thx Tom Cornebize for the fold idea
    // thx http://www.developpez.net/forums/d355725/autres-langages/langages-fonctionnels/caml/ocaml-explication-listfold-left-right/#post2170830
    pkg.foldLeft = function (list, func, a) {
        if (!list.length) {
            return a;
        }

        return pkg.foldLeft(list.slice(1), func, func(a, list[0]));
    };

    pkg.foldRight = function (list, func, a) {
        if (!list.length) {
            return a;
        }

        return func(list[0], pkg.foldRight(func, a, list.slice(1)));
    };

    pkg.map = function (l, func) {
        return l.map(function (e) { func(e); });
    };
}(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this));
