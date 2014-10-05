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

(function (pkg) {
    "use strict";
    function destructNext(s, i, end, dontCheck) {
        while (!s[i].trim()) {
            ++i;
        }

        if (!dontCheck) {
            if (s[i] === ",") {
                return i + 1;
            }

            if (s[i] !== "," && s[i] !== end) {
                throw new Error("Malformed destructing string: " + s);
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
                i = pkg.destruct((e || [])[k], destructStr, res, true, i);
            }
            i = destructNext(destructStr, i, end);
            ++k;
        }
        if (destructStr[i] !== end) {
            throw new Error("Malformed destructing string: " + destructStr);
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
                    throw new Error("Malformed destructing string: " + destructStr);
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
                throw new Error("Malformed destructing string: " + destructStr);
            }
            ++i;
            i = destructNext(destructStr, i, "", true);
            i = pkg.destruct((e || {})[key], destructStr, res, true, i);
            i = destructNext(destructStr, i, "}");
        }
        if (destructStr[i] !== "}") {
            throw new Error("Malformed destructing string: " + destructStr);
        }
        return i + 1;
    }

    pkg.destructToJS = function (vars, newVal, listOfVals, constraintedVariables) {
        if (!listOfVals) {
            listOfVals = [];
            pkg.destruct(null, vars, listOfVals);
        }

        var resToString = "'" + vars.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\\n") + "'";
        var ret = "(function () {audescript.des=audescript.destruct(" + newVal + "," + resToString + ");";
        var index, lovLen;

        for (index = 0, lovLen = listOfVals.length; index < lovLen; ++index) {
            if (listOfVals.hasOwnProperty(index)) {
                if (constraintedVariables.consts.contains(listOfVals[index])) {
                    ret += pkg.internals.constError(listOfVals[index]) + ";";
                } else if (constraintedVariables.type.contains(listOfVals[index])) {
                    ret += listOfVals[index] + "=audescript.as(" + listOfVals[index] + ", audescript.des." + listOfVals[index] + ");";
                } else {
                    ret += listOfVals[index] + "=audescript.des." + listOfVals[index] + ";";
                }
            }
        }
        return ret + "audescript.des=null;})()";
    };

    pkg.destruct = function (e, destructStr, res, returnCurrentIndex, i) {
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
}((typeof exports !== "undefined" && exports) || this.audescript));
