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
// NEEDS automata.js, set.js

(function (pkg) {
    "use strict";

    function trySymbolArray(lexer, type, a, checkNoIdentifierCharAfter) {
        for (var i = 0, len = a.length; i < len; ++i) {
            if (lexer.eat(a[i], type, checkNoIdentifierCharAfter)) {
                return true;
            }
        }
        return false;
    }

    function trySymbolObject(lexer, o) {
        for (var s in o) {
            if (o.hasOwnProperty(s) && lexer.eat(s, o[s])) {
                return true;
            }
        }
        return false;
    }

    function parseUnsignedNumber(lexer) {
        var dotEncountered = false,
            begin = lexer.curPos();

        if (!lexer.end() && lexer.lookAhead() === "0") {
            lexer.nextChar();
            if (!lexer.end() && (lexer.lookAhead().toLowerCase() === "x")) {
                do {
                    lexer.nextChar();
                } while ("0123456789ABCDEF".indexOf(lexer.lookAhead().toUpperCase()) !== -1);
                lexer.registerSymbol(lexer.NUMBER, begin);
                return true;
            }
        }

        while (
            !lexer.end()
         && (
                "0123456789".indexOf(lexer.lookAhead()) !== -1
             || (!dotEncountered && lexer.lookAhead() === ".")
         )) {
            if (!dotEncountered) {
                dotEncountered = lexer.lookAhead() === ".";
            }
            lexer.nextChar();
        }

        // TODO: checking if the number is correct (e.g: doesn't end with a dot)
        if (!lexer.end() && (lexer.lookAhead() === "e" || lexer.lookAhead() === "E")) {
            lexer.nextChar();
            if (!lexer.end() && (lexer.lookAhead() === "+" || lexer.lookAhead() === "-")) {
                lexer.nextChar();
            }
        }

        while (!lexer.end() && "0123456789".indexOf(lexer.lookAhead()) !== -1) {
            lexer.nextChar();
        }

        lexer.registerSymbol(lexer.NUMBER, begin);
        return true;
    }

    function tryString(lexer) {
        if (lexer.lookAhead() === "\"" || lexer.lookAhead() === "'") {
            var begin = lexer.curPos();
            var endChar = lexer.nextChar();

            while (!lexer.end() && lexer.lookAhead() !== endChar) {
                if (lexer.lookAhead() === "\\") {
                    lexer.nextChar();
                }

                lexer.nextChar();
            }

            lexer.nextChar();
            lexer.registerSymbol(lexer.STRING, begin);
            return true;
        }
        return false;
    }

    function tryWhitespace(lexer) {
        if (!(lexer.lookAhead().trim())) {
            var begin = lexer.curPos();

            do {
                lexer.nextChar();
            } while (!lexer.end() && !(lexer.lookAhead().trim()));

            lexer.registerSymbol(lexer.WHITESPACE, begin);
            return true;
        }
    }

    function trySlash(lexer) {
        if (lexer.lookAhead() === "/") {
            var begin = lexer.curPos();

            lexer.nextChar();

            if (!lexer.end() && lexer.lookAhead() === "/") {
                while (!lexer.end() && lexer.lookAhead() !== "\n") {
                    lexer.nextChar();
                }
                lexer.registerSymbol(lexer.WHITESPACE, begin);
            } else if (!lexer.end() && lexer.lookAhead() === "*") {
                do {
                    lexer.nextChar();
                } while (
                    !lexer.end(1)
                 && !(lexer.lookAhead() === "*" && lexer.lookAhead(1) === "/")
                );

                lexer.nextChar(1);
                lexer.registerSymbol(lexer.WHITESPACE, begin);
            } else {
                if (lexer.lastSignificantType & (
                        lexer.NUMBER
                      | lexer.VARIABLE
                      | lexer.CLOSEPAREN
                      | lexer.CLOSEBRACKET
                )) {
                    if (lexer.lookAhead() === "=") {
                        lexer.nextChar();
                    }
                    lexer.registerSymbol(lexer.OPERATOR, begin);
                    return true;
                }

                while (!lexer.end() && lexer.lookAhead() !== "/") {
                    if (lexer.lookAhead() === "\\") {
                        lexer.nextChar();
                    }
                    lexer.nextChar();
                }
                lexer.nextChar();
                while (!lexer.end() && "azertyuiopqsdfghjklmwxcvbn".indexOf(lexer.lookAhead().toLowerCase()) !== -1) {
                    lexer.nextChar();
                }
                lexer.registerSymbol(lexer.REGEX, begin);
            }

            return true;
        }
        return false;
    }

    function tryDot(lexer) {
        if (lexer.lookAhead() === ".") {
            if (!lexer.end(1) && "0123456789".indexOf(lexer.lookAhead(1)) !== -1) {
                return parseUnsignedNumber(lexer);
            }

            lexer.nextChar();
            lexer.registerSymbol(lexer.DOT);
            return true;
        }
        return false;
    }

    function tryNumber(lexer) {
        if ("0123456789".indexOf(lexer.lookAhead()) !== -1) {
            return parseUnsignedNumber(lexer);
        }
        return false;
    }

    function tryReservedKeyword(lexer) {
        return (
            trySymbolArray(lexer, lexer.INSTRUCTION, [
                "let",
                "const",
                "var",
                "new", "delete",
                "return", "throw", "catch", "finally",
                "break", "continue", "yield", "debugger",
                "in", "of",
                "if", "else",
                "do", "while", "foreach", "for",

                "function",
                "instanceof", "typeof",
                "try", "catch", "finally",
                "include", "export", "import",
                "switch", "case", "default",
                "with",
                "enum", "class", "interface"
            ], true) || trySymbolArray(lexer, lexer.RESERVED, [
                "false",
                "null",
                "this",
                "true",
                "super",
                "void",
                "public",
                "static",
                "extends",
                "package",
                "private",
                "protected",
                "implements"
            ], true)
        );
    }

    function tryPunctuation(lexer) {
        return trySymbolObject(lexer, {
            ")": lexer.CLOSEPAREN,
            "]": lexer.CLOSEBRACKET,
            "}": lexer.CLOSECURLY,
            "{": lexer.OPENBRACKET,
            "[": lexer.OPENBRACKET,
            "(": lexer.OPENBRACKET,
            ",": lexer.COMMASEMICOLON,
            ";": lexer.COMMASEMICOLON
        });
    }

    function tryOperator(lexer) {
        return trySymbolArray(lexer, lexer.OPERATOR, [
            "++", "--", "+=", "-=",
            "===", "==",
            "!==", "!=",
            ">>>=",
            "<<<", ">>>",
            "<<=", ">>=",
            "<<", ">>",
            "<=", ">=",
            "=>", // arrow functions
            "||", "&&",
            "&=", "|=", "*=", "%=", "^=",
            "&", "|", "*", "%", "^", "~",
            "?", ":", "=",
            "<", ">",
            "+", "-",
            "="
        ]) || trySymbolArray(lexer, lexer.ALPHA_OPERATOR, [
            "!contains", "!subsetof", "!elementof", "!belongsto", "!haskey", "!has",
            "contains", "subsetof", "elementof", "belongsto", "haskey",
            "!subsetOf", "!elementOf", "!belongsTo", "!hasKey",
            "subsetOf", "elementOf", "hasKey", "has",
            "!"
        ]);
    }

    function tryEndOfInput(lexer) {
        if (lexer.end()) {
            lexer.registerSymbol(lexer.END);
            return true;
        }
    }

    function tryIdentifier(lexer) {
        var begin = lexer.curPos();

        if (lexer.lookAhead().match(pkg.Lexer.identifierStartChar)) {
            do {
                lexer.nextChar();
            } while (!lexer.end() && lexer.lookAhead().match(pkg.Lexer.identifierPartChar));
            lexer.registerSymbol(lexer.VARIABLE, begin);
            return true;
        }
        return false;
    }

    pkg.Lexer = function (s) {
        this.lastSignificantType = this.END;
        this.type                = this.END;
        this.str                 = s;
        this.symbol              = "";
        this.i                   = 0;
    };

    pkg.Lexer.prototype = {
        lookAhead: function (count) {
            return this.str[this.i + (count || 0)];
        },

        eat: function (s, type, checkNoIdentifierCharAfter) {
            var len = s.length;
            if (this.str.substr(this.i, len) === s
                && (
                    !checkNoIdentifierCharAfter
                    || (
                        !this.str[this.i + len]
                        || !this.str[this.i + len].match(pkg.Lexer.identifierPartChar)
                    )
                )
            ) {
                var i = this.curPos();
                this.nextChar(len - 1);
                this.registerSymbol(type, i);
                return true;
            }
            return false;
        },

        nextChar: function (count) {
            this.i += count || 0;
            return this.str[this.i++];
        },

        end: function () {
            return this.i >= this.str.length;
        },

        curPos: function () {
            return this.i;
        },

        next: function () {
            return (
                tryEndOfInput(this)
             || tryPunctuation(this)
             || tryOperator(this)
             || tryReservedKeyword(this)
             || tryString(this)
             || tryWhitespace(this)
             || tryDot(this)
             || tryNumber(this)
             || trySlash(this)
             || tryIdentifier(this)
            );
        },

        nextSymbol: function (begin) {
            var type = this.type;
            this.next();

            if (begin && this.type === type) {
                this.symbol = this.str.substring(begin, this.curPos());
            }

            return this.symbol;
        },

        save: function () {
            var s = new pkg.Lexer();
            s.type = this.type;
            s.str = this.str;
            s.lastSignificantType = this.lastSignificantType;
            s.i = this.i;
            s.symbol = this.symbol;

            return s;
        },

        // prefer using the saved lexer directly instead of restoring this one from the new lexer.
        restore: function (s) {
            this.type                = s.type;
            this.lastSignificantType = s.lastSignificantType;
            this.i                   = s.i;
            this.symbol              = s.symbol;
        },

        registerSymbol: function (type, begin) {
            if (isNaN(begin)) {
                begin = this.curPos() - 1;
            }

            this.type = type;
            this.symbol = this.str.substring(begin, this.curPos());

            if (type === this.WHITESPACE) {
                var state = this.save();
                this.nextSymbol(begin);
                if (this.type !== this.WHITESPACE) {
                    this.restore(state);
                }
            } else {
                this.lastSignificantType = type;
                if (type === this.END) {
                    this.symbol = "";
                    return;
                }
            }
        },

        getWhite: function (ignoreOneSpace) {
            var state = this.save();
            this.nextSymbol();

            if (this.type === this.WHITESPACE) {
                if (ignoreOneSpace && this.symbol === " ") {
                    return "";
                }
                return this.symbol;
            }

            this.restore(state);
            return "";
        },

        isIdentifier: function (v) {
            if (v[0].match(pkg.Lexer.identifierStartChar)) {
                for (var i = 1; i < v.length; ++i) {
                    if (!v[1].match(pkg.Lexer.identifierPartChar)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        },

        substring: function (a, b) {
            return this.str.substring(a, b);
        },

        END:            0,
        STRING:         2,
        WHITESPACE:     4,
        VARIABLE:       8,
        DOT:            16,
        REGEX:          32,
        NUMBER:         64,
        OPERATOR:       128,
        COMMASEMICOLON: 256,
        CLOSEPAREN:     1024,
        CLOSECURLY:     2048,
        OPENBRACKET:    4096,
        INSTRUCTION:    8192,
        CLOSEBRACKET:   16384,
        RESERVED:       32768,
        ALPHA_OPERATOR: 65536
    };
}((typeof exports !== "undefined" && exports) || this.audescript));
