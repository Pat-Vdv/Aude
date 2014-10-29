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

/*eslint no-eval:0, no-native-reassign:0, no-extend-native:0 */

(function (pkg, that) {
    "use strict";

    var _ = pkg.l10n || (that.libD && that.libD.l10n ? that.libD.l10n() : function (s) { return s; });

    function notdef() {}

    var Tuple      = that.Tuple      || notdef;
    var Automaton  = that.Automaton  || notdef;
    var Transition = that.Transition || notdef;

    pkg.StopIteration = {};
    pkg.ReturnValue = function (v) {
        this.v = v;
    };

    pkg.ThrowValue = function (v) {
        this.v = v;
    };

    function tuplesEq(t1, t2) {
        if (t1.length !== t2.length) {
            return false;
        }

        var j;
        for (j = 0; j < t1.length; ++j) {
            if (!pkg.eq(t1[j], t2[j])) {
                return false;
            }
        }

        return true;
    }

    function objEq(v1, v2, dontMirror) {
        for (var i in v1) {
            if (v1.hasOwnProperty(i)) {
                if (!(v2.hasOwnProperty(i) && (dontMirror || pkg.eq(v1[i], v2[i])))) {
                    return false;
                }
            }
        }

        if (!dontMirror) {
            return objEq(v2, v1, true);
        }

        return true;
    }

    // checks "real" equality between v1 and v2
    pkg.eq = function (v1, v2) {
        if (v1 instanceof Tuple && v1.length === 1) {
            return pkg.eq(v2, v1[0]);
        }

        /*eslint-disable eqeqeq */

        return v1 == v2 || (
            typeof v1 === typeof v2
            && v1.constructor === v2.constructor
            && (v1 instanceof Set
                ? v1.card() === v2.card() && !v1.minus(v2).card()
                : (v1 instanceof Transition
                    ?          pkg.eq(v1.symbol, v2.symbol)
                            && pkg.eq(v1.startState, v2.startState)
                            && pkg.eq(v1.endState, v2.endState)
                    : (v1 instanceof Automaton
                        ?          pkg.eq(v1.states, v2.states)
                                && pkg.eq(v1.finalStates, v2.finalStates)
                                && pkg.eq(v1.trans, v2.trans)
                                && pkg.eq(v1.q_init, v2.q_init)
                        : (v1 instanceof Tuple
                            ? tuplesEq(v1, v2)
                            : (
                                (v1.constructor === Object || v1.constructor === Array
                                    ? objEq(v1, v2)
                                    : JSON.stringify(v1) === JSON.stringify(v2)
                                )
                            )
                        )
                    )
                )
            )
        );

        /*eslint-enable eqeqeq */
    };

    // checks if value can be assigned to variable and return the right value. integerCheck enforce value being an integer.
    pkg.as = function (variable, value, integerCheck) {
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
                throw new Error(_("Type Error: types don't match."));
            }
            return integerCheck ? (value > 0 ? Math.floor(value) : Math.ceil(value)) : value;
        }

        if (value !== variable) {
            throw new Error(_("Type Error: types don't match."));
        }

        return value;
    };

    pkg.ct = function (val, type) {
        if (typeof type === "string") {
            if (type === "int") {
                if (!(typeof val === "number" && val % 1 === 0)) {
                    throw new TypeError(_("type mismatch."));
                }
            } else if (typeof val !== type) {
                throw new TypeError(_("type mismatch."));
            }
        } else if (val !== null && !(val instanceof type)) {
            throw new TypeError(_("type mismatch."));
        }
        return val;
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

    Object.defineProperty(Array.prototype, "peek", {
        enumerable: false,
        writable:   true,
        value: function () {
            return this[this.length-1];
        }
    });

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
}((typeof exports !== "undefined" && exports) || (this.audescript || (this.audescript = {})), this));
