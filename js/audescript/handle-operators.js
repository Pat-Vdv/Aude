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

    function addOperatorParenthesis(o, opts) {
        o.afterLeft = (
            o.afterLeft
                ? o.afterLeft + opts.afterLeft
                : opts.afterLeft
        );

        o.transformedOperator = true;

        var left = o;
        while (
            left.prev
         && (!opts.weakerThan || opts.weakerThan.indexOf(left.prev.op) === -1
        )) {
            left = left.prev;
        }

        if (left.prev) {
            left.prev.beforeRight = (
                left.prev.beforeRight
                    ? opts.beforeLeft + left.prev.beforeRight
                    : opts.beforeRight
            );
        } else {
            left.beforeLeft = (
                left.beforeLeft
                    ? opts.beforeLeft + left.beforeLeft
                    : opts.beforeLeft
            );
        }

        var right = o;
        while (
            (right.right && right.right.hasOwnProperty("op"))
         && (
               (
                    !opts.weakerThan
                 || opts.weakerThan.indexOf(right.right.op) === -1
            ) && (
                    !opts.sameLevel
                 || opts.sameLevel.indexOf(right.right.op) === -1))
        ) {
            right = right.right;
        }

        if (right.right && right.right.hasOwnProperty("op")) {
            right.right.afterLeft  = (
                right.right.afterLeft
                    ? right.right.afterLeft + opts.afterRight
                    : opts.afterRight
            );
        } else {
            right.afterRight = (
                right.afterRight
                    ? right.afterRight + opts.afterRight
                    : opts.afterRight
            );
        }
    }

    function operatorChainToString(o) {
        if (typeof o === "string") {
            return o;
        }

        if (o.op === "?") {
            // this works because " ? : " is the most predecedent operator
            return (
                (o.beforeLeft || "") + o.left + (o.afterLeft || "")
              + o.white
              + "?"     + o.ifTrueExpression
              + o.colon + o.ifFalseExpression
              + (o.afterRight || "")
            );
        }

        var rightTrim = operatorChainToString(o.right);
        var rightSpaces = "";

        while (rightTrim.length && !rightTrim.slice(-1).trim()) {
            rightSpaces = rightTrim.slice(-1) + rightSpaces;
            rightTrim   = rightTrim.substr(0, rightTrim.length - 1);
        }

        if (o.transformedOperator) {
            return (
                (o.beforeLeft || "")  + o.left    + o.afterLeft
              + (o.beforeRight || "") + rightTrim + (o.afterRight || "")
              + rightSpaces
			);
            //TODO: check correctness
        }

        return (
              (o.beforeLeft || "")  + o.left    + (o.afterLeft || "")
            + (o.white || "")       + o.op
            + (o.beforeRight || "") + rightTrim + (o.afterRight || "")
            + rightSpaces
        );
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
        if (o.right && o.right.hasOwnProperty("op")) {
            o.right.prev = o;
        }

        switch (o.op) {
        case "==":
            addOperatorParenthesis(o, {
                beforeLeft: (o.white || "") + "audescript.eq(",
                afterLeft:  ",",
                afterRight: ")",
                weakerThan: [
                    "||", "&&",
                    "?"
                ],
                sameLevel:  [
                    "<", ">",
                    "<=", ">=",
                    "==", "===",
                    "!=", "!=="
                ]
            });
            break;
        case "!=":
            addOperatorParenthesis(o, {
                beforeLeft: (o.white || "") + "!audescript.eq(",
                afterLeft:  ",",
                afterRight: ")",
                weakerThan: [
                    "||", "&&",
                    "?"
                ],
                sameLevel:  [
                    "<", ">",
                    "<=", ">=",
                    "==", "===",
                    "!=", "!=="
                ]
            });
            break;
        case "?":
            if (o.ifTrueExpression.hasOwnProperty("op")) {
                o.ifTrueExpression = operatorChainToString(handleOperators(o.ifTrueExpression));
            }
            if (o.ifFalseExpression.hasOwnProperty("op")) {
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
                weakerThan: [
                    "<",  ">",
                    "<=", ">=",
                    "==", "===",
                    "!=", "!==",
                    "||", "&&",
                    "?"
                ],
                sameLevel:  [
                    "contains",
                    "belongs_to",
                    "has_key",
                    "subset_of",
                    "symdiff"
                ]
            });
            break;
        case "has_key":
            addOperatorParenthesis(o, {
                beforeLeft: " " + o.not + "(",
                afterLeft:  ").hasKey(" + (o.white === " " ? "" : o.white),
                afterRight: ")",
                weakerThan: [
                    "<", ">",
                    "<=", ">=",
                    "==", "===",
                    "!=", "!==",
                    "||", "&&",
                    "?"
                ],
                sameLevel: [
                    "contains",
                    "belongs_to",
                    "has_key",
                    "subset_of",
                    "symdiff"
                ]
            });
            break;
        default:
            var sameLevel, weakerThan;
            if (o.op === "union" || o.op === "inter" || o.op === "cross") {
                sameLevel  = [
                    "union",
                    "inter",
                    "cross"
                ];
                weakerThan = [
                    "minus",
                    "contains",
                    "belongs_to",
                    "has_key",
                    "subset_of",
                    "symdiff",
                    "<", ">",
                    "<=", ">=",
                    "==", "===",
                    "!=", "!==",
                    "||", "&&",
                    "?"
                ];
            } else if (o.op === "minus") {
                weakerThan = [
                    "contains",
                    "belongs_to",
                    "has_key",
                    "subset_of",
                    "symdiff",
                    "<", ">",
                    "<=", ">=",
                    "==", "===",
                    "!=", "!==",
                    "||", "&&",
                    "?"
                ];
                sameLevel  = [
                    "minus"
                ];
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

        if (o.right && o.right.hasOwnProperty("op")) {
            handleOperators(o.right);
        }

        return o;
    }

    pkg.internals.handleOperator = function (context, exprs) {
        if (context.acceptOperator) {
            return exprs;
        }

        return operatorChainToString(handleOperators(exprs));
    };
}((typeof exports !== "undefined" && exports) || this.audescript));
